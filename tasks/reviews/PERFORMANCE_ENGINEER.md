# Performance Engineering Review -- ClawHQ Dashboard

**Reviewed:** 2026-03-16
**Scope:** Full codebase audit across polling, bundle, queries, memory, rendering, streaming, fonts, Supabase, and SSH
**Severity scale:** P0 = fix now, P1 = fix soon, P2 = improve when convenient

---

## 1. Polling -- refetchInterval Storm

### Finding: 21 active polling intervals across components

**Total refetchIntervals found:**

| Component | Interval | API endpoint | Notes |
|-----------|----------|-------------|-------|
| `mission-control-overview.tsx` | 10s | `/api/mission-control/metrics` | |
| `mission-control-overview.tsx` | 5s | `/api/mission-control/agents/status` | **DUPLICATE** of agent-roster |
| `mission-control-overview.tsx` | 5s | `/api/mission-control/tasks` | **DUPLICATE** of task-board |
| `mission-control-overview.tsx` | 5s | `/api/mission-control/events?limit=5` | |
| `mission-control-overview.tsx` | 5s | `/api/mission-control/sessions` | **DUPLICATE** of session-tracker |
| `agent-roster.tsx` | **2s** | `/api/mission-control/agents/status` | Aggressive |
| `session-tracker.tsx` | **3s** | `/api/mission-control/sessions` | Aggressive |
| `task-board.tsx` | 10s | `/api/mission-control/tasks` (x2 queries) | |
| `event-feed.tsx` | 5s (when live) | `/api/mission-control/events` | |
| `vps-controls.tsx` | 5s | `/api/vps/status` | |
| `vps-controls.tsx` | 10s | `/api/vps/monitoring` | Conditional on running |
| `vps-controls.tsx` | 30s | `/api/vps/gateway-health` | Conditional on running |
| `live-dashboard.tsx` | 5s | Unknown live endpoint | |
| `logs-explorer.tsx` | 5s | Logs endpoint (when auto-refresh on) | |
| `notification-bell.tsx` | 30s | Notifications endpoint | |
| `vps-process-list.tsx` | 15s | `/api/vps/processes` | |
| `agent-analytics.tsx` | 30s | Analytics endpoint | |

**Estimated API calls per second for a Mission Control user:**

The Mission Control overview page alone fires: 5 endpoints at 5-10s each. If the user has the overview + agent roster + session tracker + task board visible simultaneously:

- `/api/mission-control/agents/status` -- polled at 2s (roster) + 5s (overview) = **~0.7 req/s** for ONE endpoint
- `/api/mission-control/sessions` -- polled at 3s (tracker) + 5s (overview) = **~0.53 req/s**
- `/api/mission-control/tasks` -- polled at 10s (board) + 5s (overview) = **~0.3 req/s**
- `/api/mission-control/events` -- 5s (overview) + 5s (feed) = **~0.4 req/s**
- `/api/mission-control/metrics` -- 10s = 0.1 req/s

**Total: ~2+ API requests/second per user on Mission Control alone.**

Plus `use-mc-realtime.ts` runs a 30s safety-net poll (when connected) that invalidates ALL 4 MC query keys, or a 5s poll when disconnected -- which duplicates everything above.

### Severity: P0

### Recommendations

1. **Deduplicate query keys.** `mission-control-overview.tsx` and the sub-pages (`agent-roster.tsx`, `session-tracker.tsx`, `task-board.tsx`) share the same queryKeys (`["mc-agents"]`, `["mc-tasks"]`, etc.) but set DIFFERENT refetchIntervals. React Query uses the last-mounted interval. This is unpredictable.
2. **Move all MC polling to `use-mc-realtime.ts` only.** The Supabase Realtime channel + 30s safety-net pattern is correct. Remove all `refetchInterval` from individual MC components and rely solely on cache invalidation from the realtime hook.
3. **Reduce agent-roster from 2s to 10s minimum.** 2-second polling for agent status is excessive for a dashboard; 10s is sufficient.
4. **Reduce session-tracker from 3s to 10s.**
5. **Add `refetchIntervalInBackground: false`** to ALL polling queries (only `vps-controls.tsx` and `logs-explorer.tsx` currently do this).

---

## 2. Bundle Size

### Finding: Several heavy libraries, some imported wisely, some not

| Library | Size (gzip est.) | Usage | Verdict |
|---------|----------|-------|---------|
| `recharts` | ~150KB | 4 component files | OK -- used substantially |
| `framer-motion` | ~40KB | 22 landing page files | **P1** -- 22 imports all in landing page components; consider dynamic import for landing route |
| `react-markdown` | ~30KB | 3 files | OK -- dynamic import would help |
| `@dnd-kit/*` | ~30KB | 1 file (task-board.tsx) | **P2** -- only used on Mission Control task board; dynamic import candidate |
| `xlsx` | ~350KB | 1 file (file-processors.ts) | Good -- already uses `await import("xlsx")` |
| `mammoth` | ~80KB | 1 file (file-processors.ts) | Good -- already uses `await import("mammoth")` |
| `jszip` | ~45KB | 1 file (file-processors.ts) | Good -- already uses `await import("jszip")` |
| `pdf-parse` | ~20KB | Server only (external package) | OK |
| `@sentry/nextjs` | ~60KB | Whole app | OK -- monitoring is important |

### Severity: P1

### Recommendations

1. **Dynamic import framer-motion for landing page.** The landing page loads 22 components all importing framer-motion. Since the dashboard (the primary user surface) does NOT use framer-motion, use `next/dynamic` with `ssr: false` for landing page sections to avoid shipping framer-motion to dashboard users.
2. **Dynamic import `@dnd-kit`** in `task-board.tsx` -- it is only used on one page.
3. **Audit lucide-react imports.** The project imports individual icons (good), but `vps-controls.tsx` imports 18 icons. Tree-shaking should handle this, but verify the build output.

---

## 3. N+1 Queries

### Finding: Two N+1 patterns identified

**a) `cron/webhook-retry/route.ts` -- P1**

```
for (const delivery of pending) {
    const { data: webhook } = await admin
      .from("webhooks")
      .select("url, secret, enabled")
      .eq("id", delivery.webhook_id)
      .single();
    // ... then fetch per-delivery ...
}
```

For up to 20 pending deliveries, this issues 20 individual webhook lookups + 20-40 update queries. Should batch-fetch all webhook IDs upfront with a single `.in("id", webhookIds)` query.

**b) `ssh.ts` `findDataDir()` -- P2**

```
for (const dir of candidates) {
    const check = await ssh.execCommand(`test -d ${dir} && echo exists`);
}
```

Sequentially runs up to 4 SSH commands to find a directory. Should combine into a single command:
`for d in /opt/openclaw/data /var/lib/openclaw/data ...; do test -d "$d" && echo "$d" && exit; done`

**c) `admin/customers/[id]/full/route.ts` -- No issue.** Already uses `Promise.all()` for 11 parallel queries. Well done.

### Severity: P1 (webhook retry), P2 (SSH)

---

## 4. Memory Leaks

### Finding: Several potential leaks identified

**a) `providers.tsx` -- QueryClient outside component -- P1**

```typescript
const queryClient = new QueryClient();  // Module-level singleton

export default function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>...
```

This creates a single QueryClient shared across all SSR renders. In Next.js App Router, this can cause data leaking between requests on the server. The official pattern is:

```typescript
function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
```

**b) `copy-button.tsx` and ~10 similar "copied" patterns -- P2**

```typescript
setTimeout(() => setCopied(false), 2000);
```

No cleanup on unmount. If the component unmounts within 2s, React will warn about state updates on unmounted components. Low severity since these are short-lived timers, but should use a `useEffect` cleanup or `useRef` pattern.

**c) `vps-data-api.ts` module-level `setInterval` -- P2**

```typescript
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of vpsCache) {
    if (val.expiresAt < now) vpsCache.delete(key);
  }
}, 10 * 60 * 1000);
```

Runs forever in the Node.js process. For Next.js API routes this is fine (server-side module, long-lived process), but the interval can never be cleared. Low risk.

**d) `provision-store.ts` -- `setTimeout` for job cleanup -- OK**

Uses `setTimeout(() => jobs.delete(jobId), 10 * 60 * 1000)`. This is intentional and appropriate for background job cleanup.

### Severity: P1 (QueryClient), P2 (others)

---

## 5. React Re-renders

### Finding: Limited use of memoization (72 occurrences across 26 files)

**a) `vps-controls.tsx` -- P1**

The `chartData` state is updated every 10 seconds via `useEffect` depending on `monitoring`. Each update triggers a full re-render of the entire component including two Recharts `<AreaChart>` components and all cards. The chart components should be extracted into memoized sub-components.

The inline `formatRate()` and `formatBytes()` helper functions are fine (pure, cheap), but the Recharts `Tooltip.formatter` functions create new function references on every render. These should be stable references via `useCallback`.

**b) `mission-control-overview.tsx` -- P2**

Renders MetricCards, agent list, task list, event list, and session list all in one component. Any of the 5 polling queries updating causes ALL sections to re-render. Should split into memoized sub-components.

**c) `task-board.tsx` -- OK**

Has 11 `useMemo`/`useCallback` usages. Well-optimized for a complex drag-and-drop board.

### Severity: P1

---

## 6. Virtualization -- Long Lists

### Finding: No virtual scrolling used anywhere

**a) `logs-explorer.tsx` -- P1**

Renders `filtered.map((entry, i) => ...)` inside a 600px scrollable container. Logs can easily reach 500-1000+ entries. Each row contains a table row with timestamp, level badge, and highlighted message text. No virtualization.

**b) `task-board.tsx` -- P2**

Renders all tasks per column. Unlikely to exceed 100 items per column in practice.

**c) `admin-customers.tsx` -- P2**

Customer list. Unlikely to exceed a few hundred entries.

### Severity: P1 (logs-explorer)

### Recommendations

- Add `@tanstack/react-virtual` (lightweight, ~2KB) for `logs-explorer.tsx`.
- The VPS logs viewer in `vps-controls.tsx` uses `<pre>` with `whitespace-pre-wrap` for 200 lines. Acceptable for now.

---

## 7. SSE / Streaming Cleanup

### Finding: Properly handled

**a) `mission-control/stream/route.ts` -- OK**

- Auto-closes after 5 minutes
- Cleans up on `request.signal` abort
- Cleans up `pingInterval` and `timeout` timers
- Removes `eventBus` listener on disconnect

**b) `vps/logs/stream/route.ts` -- OK**

- Auto-closes after 30 minutes
- Keepalive every 15 seconds
- SSH connection disposed on cancel/abort
- Listens for `request.signal` abort

**c) `use-mission-control-stream.ts` (client-side SSE) -- OK**

- Closes EventSource on unmount
- Clears retry timeout on unmount
- Exponential backoff with max 10 retries

**d) `use-mc-realtime.ts` (client-side Supabase Realtime) -- OK**

- Unsubscribes channel on unmount
- Stops polling on unmount
- Removes visibility listener on unmount

### Severity: None -- well implemented.

---

## 8. Font Loading

### Finding: Suboptimal font loading via CSS @import

**`globals.css` line 1:**
```css
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Issues -- P1:

1. **CSS `@import` blocks rendering.** The browser must download the CSS file before it can continue parsing the stylesheet. Next.js has built-in font optimization via `next/font` that self-hosts fonts and eliminates the external request.

2. **Two font families loaded but only one used.** `JetBrains Mono` is loaded but `globals.css` only references `Geist Mono` in the `body` and `code` rules. JetBrains Mono appears unused -- wasted bytes.

3. **Four weights of Geist Mono (400, 500, 600, 700)** loaded. Verify all four are actually used.

### Recommendations

1. Switch to `next/font/google`:
```typescript
import { Geist_Mono } from 'next/font/google';
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500', '600'] });
```
2. Remove JetBrains Mono unless it is used somewhere.
3. Audit whether weight 700 is actually needed.

---

## 9. Supabase

### Finding: No connection pooling needed -- client library handles it

**a) Admin client creates new instance per call -- P2**

`supabase-admin.ts`:
```typescript
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

Every API route that calls `createAdminClient()` creates a new Supabase client instance. The Supabase JS client uses `fetch()` under the hood (HTTP, not persistent connections), so this is technically fine. However, creating the client involves parsing config and initializing internal state. For hot paths (polling endpoints called every 2-5s), a module-level singleton would be more efficient:

```typescript
let _admin: ReturnType<typeof createClient> | null = null;
export function createAdminClient() {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  }
  return _admin;
}
```

**b) No `.select()` column optimization on some queries -- P2**

Some queries use `select("*")` when only a few columns are needed (e.g., `admin/api-keys/route.ts`, `webhooks` routes). Selecting only needed columns reduces payload size.

**c) VPS Data API cache -- Good**

`vps-data-api.ts` correctly caches VPS hostname lookups for 5 minutes to avoid hitting Supabase on every request.

### Severity: P2

---

## 10. SSH -- New Connection Per Request

### Finding: Every SSH operation opens a new connection -- P1

**`ssh.ts` `connect()` function:**
```typescript
async function connect(creds: VPSCredentials): Promise<NodeSSH> {
  const ssh = new NodeSSH();
  await ssh.connect({ ... readyTimeout: 10000 });
  return ssh;
}
```

Every exported function (`getProcessStatus`, `getVPSStats`, `startOpenClaw`, `stopOpenClaw`, `restartOpenClaw`, `deployAgent`, `configureChannel`, etc.) calls `connect()` to open a fresh SSH connection, does its work, then calls `ssh.dispose()`.

**Impact:** When the VPS controls page polls `getProcessStatus` every 5s and `getVPSStats` every 10s, that is:
- 12 SSH connections/minute for status
- 6 SSH connections/minute for stats
- = 18 SSH handshakes per minute per user

Each SSH handshake involves TCP + key exchange + auth, adding ~1-3 seconds of latency per call.

### Recommendations

1. **Implement SSH connection pooling.** Cache SSH connections per VPS IP with a 60-second idle timeout:
```typescript
const pool = new Map<string, { ssh: NodeSSH; lastUsed: number }>();
const IDLE_TIMEOUT = 60_000;

async function getConnection(creds: VPSCredentials): Promise<NodeSSH> {
  const key = `${creds.ip_address}:${creds.ssh_port || 22}`;
  const existing = pool.get(key);
  if (existing && existing.ssh.isConnected()) {
    existing.lastUsed = Date.now();
    return existing.ssh;
  }
  const ssh = new NodeSSH();
  await ssh.connect({ ... });
  pool.set(key, { ssh, lastUsed: Date.now() });
  return ssh;
}
```
2. **Batch SSH commands.** `getVPSStats()` already uses `Promise.all()` for 5 parallel commands -- good. But `getProcessStatus()` runs 2-4 sequential SSH commands (detectRuntime -> check). Combine into a single command.
3. **Remove `ssh.dispose()` from individual functions** once pooling is in place; instead, let the idle timeout handle cleanup.

---

## Summary of Priorities

| # | Issue | Severity | Est. Impact |
|---|-------|----------|-------------|
| 1 | Mission Control polling storm (2+ req/s/user, duplicated queries) | **P0** | Server load, battery drain |
| 2 | SSH connection per request (18 handshakes/min/user) | **P1** | 1-3s latency per VPS operation |
| 3 | Font loading via CSS @import + unused JetBrains Mono | **P1** | Render-blocking, wasted bytes |
| 4 | QueryClient singleton shared across SSR | **P1** | Data leaking between server requests |
| 5 | Logs explorer without virtualization | **P1** | Jank with 500+ log entries |
| 6 | VPS controls re-renders (Recharts on every poll) | **P1** | Unnecessary DOM work every 10s |
| 7 | framer-motion shipped to dashboard users | **P1** | ~40KB gzip for non-landing routes |
| 8 | N+1 in webhook-retry cron | **P1** | Up to 40 extra DB queries per cron run |
| 9 | `refetchIntervalInBackground` missing on most queries | **P2** | Wasted requests in background tabs |
| 10 | Supabase admin client re-created per call | **P2** | Minor overhead on hot paths |
| 11 | `select("*")` on some Supabase queries | **P2** | Oversized payloads |
| 12 | Copy-button setTimeout leak on unmount | **P2** | React warnings, minor |

---

## What Is Already Done Well

- **VPS Data API caching** (`vps-data-api.ts`) -- 5-minute cache for VPS lookups
- **Dynamic imports** for heavy file processing libraries (xlsx, mammoth, jszip)
- **SSE cleanup** -- both server and client properly clean up streams, timers, and subscriptions
- **`Promise.all`** in admin customer detail and VPS stats for parallel I/O
- **Conditional polling** -- `vps-controls.tsx` disables monitoring/gateway polls when VPS is stopped
- **Rate limiting** on SSE endpoints
- **`refetchIntervalInBackground: false`** on VPS control queries (but missing elsewhere)
- **Task board memoization** -- 11 useMemo/useCallback in the most complex component
- **Landing page mockup cleanup** -- all setInterval/setTimeout in mockups properly return cleanup functions
