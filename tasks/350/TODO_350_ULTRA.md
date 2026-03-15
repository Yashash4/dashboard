# Mission Control — Ultra $350 — Complete Build Guide

**Owner:** Plan 350 Agent
**Last updated:** 2026-03-15

---

## PART A: CONTEXT — READ THIS FIRST

### A1. What is ClawHQ?

ClawHQ is a managed OpenClaw hosting SaaS. Users sign up, pick a plan, and ClawHQ provisions a dedicated VPS with OpenClaw (an AI agent framework) installed, configured, and ready to use. Users get a dashboard to manage everything — VPS, AI models, agents, channels, chat, support.

**Pricing tiers:**
- **Starter $59/mo** — Dedicated VPS, bundled AI models (no API keys needed), 7 messaging channels, agent store, managed infrastructure
- **Pro $129/mo** — Everything in Starter + Logs Explorer, Usage Analytics, Knowledge Base (RAG), Webhooks, API Access, Audit Log
- **Ultra $350/mo** — Everything in Pro + **Mission Control** (this is YOUR scope)
- **Enterprise $999+/mo** — Custom everything

**How AI models work (IMPORTANT):**
- ClawHQ uses an external cloud AI API (internally called "clawhq-models") to provide AI to users
- Users do NOT pay per token or per request — it's flat-rate, unlimited-feel
- Rate limiting happens silently in the backend — users never see usage limits, token counts, costs, or quotas
- If they hit a rate limit, they get a "Too many requests, please wait" error — that's it
- **NEVER show cost, tokens, usage percentages, or budget data to users in the UI**

**What runs on the VPS:**
- OpenClaw framework + gateway
- Nginx reverse proxy + SSL
- AI models are NOT on the VPS — they're accessed via external API
- The VPS has plenty of free RAM (8-64GB depending on tier)

### A2. What is Mission Control?

Mission Control is the **flagship Ultra-only feature** — the reason someone pays $350/mo instead of $129/mo. It's supposed to be a **command center for managing an AI agent workforce**.

Think of it like: if your AI agents were employees, Mission Control is the office where you assign them work, watch them perform, track their output, and manage their schedules.

**Mission Control has 5 pages:**
1. **Overview** (`/dashboard/mission-control`) — Executive dashboard showing health, active agents, tasks, events, sessions at a glance
2. **Task Board** (`/dashboard/mission-control/tasks`) — Kanban board for assigning and tracking AI agent work
3. **Agent Roster** (`/dashboard/mission-control/agents`) — Real-time view of all AI agents with status, capacity, performance
4. **Event Feed** (`/dashboard/mission-control/events`) — Live activity stream of everything happening
5. **Session Tracker** (`/dashboard/mission-control/sessions`) — Track agent sessions with step-by-step execution traces

### A3. What is the CURRENT state? (Why this rebuild is needed)

**The honest truth:** Mission Control currently looks functional but is mostly fake. Here's what's broken:

1. **Every single component falls back to mock data.** A brand new $350/mo customer sees fabricated numbers — fake agents ("Support Bot", "Research Bot"), fake tasks, fake events, fake sessions with fake costs ($0.023, $12.45). There is zero indication this data is fake. This is the #1 trust-killer.

2. **The SSE real-time system is non-functional.** `emitMCEvent()` is only called from task routes. Agent status changes, new events, and session updates never push via SSE. The in-process EventEmitter also won't work in serverless environments. "Real-time" is actually 2-5 second polling that wastes bandwidth.

3. **The Task Board doesn't persist.** Drag-drop between columns updates local React state only — never calls the server. Every mutation (create, update, delete, comment, review) uses `.catch(() => {})` — fire-and-forget. Users can spend 30 minutes organizing their board, refresh, and lose everything.

4. **Comments, reviews, and activities are hardcoded mock data.** The GET APIs exist but are never called. The task detail modal shows fake comments/reviews that reset on page reload.

5. **The Agent Roster is read-only.** You can look at agents but can't do anything — no start, stop, restart, configure, reassign. It's a display case, not a command center.

6. **System health is hardcoded to 94.5%.** The overview metrics card lies.

7. **No API-level Ultra plan gating.** Any authenticated user (even $59 Starter) can call Mission Control API endpoints directly.

8. **No rate limiting on any MC endpoint.** A script could create thousands of tasks per second.

### A4. Design System — LOCKED (Do NOT change)

The design system is fixed across the entire product. Dark theme only. No light mode. No theme toggle.

| Token | Value |
|-------|-------|
| **Body font** | Geist Mono (monospace everywhere — terminal aesthetic) |
| **Code font** | JetBrains Mono |
| **Page background** | `#111111` |
| **Card background** | `#191919` |
| **Muted background** | `#222222` |
| **Hover background** | `#2a2a2a` |
| **Border** | `#201e18` |
| **Primary (sage green)** | `oklch(0.6762 0.0567 132.4479)` |
| **Accent (warm cream)** | `#ffe0c2` (CTAs, highlights) |
| **Tier: Starter** | Green |
| **Tier: Pro** | Cream |
| **Tier: Ultra** | Amber |
| **Tier: Enterprise** | Teal |
| **Border radius** | `0.625rem` |
| **Vibe** | "Terminal-luxury SaaS" |

Use CSS variables from `globals.css` — NEVER hardcode colors. Use shadcn/ui components. Dark theme only — do not add light mode classes or `dark:` prefixes.

### A5. Naming Rules — CRITICAL

**NEVER expose any infrastructure provider name in user-facing code, UI, error messages, comments, or variable names visible to clients.**

| Real (internal) | Use this name instead |
|---|---|
| Ollama | `clawhq-models` or `ClawHQ AI` or just "AI model" |
| Hostinger | `clawhq-vps` or "your VPS" or "your instance" |
| Blackbox | Never mention |
| Supabase | Never mention in UI (fine in server-side code imports) |
| Vercel | Never mention |
| Cloudflare | Never mention |
| Any model provider | Just the model name (e.g., "Kimi K2.5") — no provider prefix |

In code:
- Server-side imports of Supabase/libraries are fine — they're not user-facing
- Variable names in frontend components: use `clawhqModels`, `clawhqVPS`, not `ollama`, `hostinger`
- Error messages to users: "Model service unavailable" not "Ollama connection failed"
- No reference repo names in code comments (no "vibe-kanban", "langfuse" etc.)

**Only these names are visible to users:** "ClawHQ", "OpenClaw", model names (Kimi K2.5, MiniMax M2.5)

### A6. Tech Stack Available

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS 3.4** + tailwindcss-animate
- **Framer Motion 12** (animations)
- **shadcn/ui** (51 components installed)
- **Lucide React** (icons)
- **Recharts** (charts)
- **@dnd-kit** (already installed — drag-and-drop)
- **React Query / TanStack Query** (data fetching — already the pattern)
- **Supabase** (auth + database — server-side)
- **SSH via node-ssh** (VPS management — server-side)
- Can install ANY npm package needed: `react-hotkeys-hook`, `cmdk`, `@tanstack/react-virtual`, `@fullcalendar/react`, etc.

### A7. What You Own (and what you DON'T touch)

**YOUR pages (Ultra-gated):**
- `/dashboard/mission-control` — Overview
- `/dashboard/mission-control/tasks` — Task Board
- `/dashboard/mission-control/agents` — Agent Roster
- `/dashboard/mission-control/events` — Event Feed
- `/dashboard/mission-control/sessions` — Session Tracker

**YOUR API routes:**
- `/api/mission-control/metrics` (GET)
- `/api/mission-control/tasks` (GET/POST) + `/tasks/[id]` (PATCH/DELETE)
- `/api/mission-control/tasks/[id]/comments` (GET/POST)
- `/api/mission-control/tasks/[id]/reviews` (GET/POST)
- `/api/mission-control/tasks/[id]/activities` (GET) — NEEDS TO BE BUILT
- `/api/mission-control/tasks/reorder` (PATCH)
- `/api/mission-control/agents/status` (GET)
- `/api/mission-control/agents/heartbeat` (POST)
- `/api/mission-control/events` (GET/POST)
- `/api/mission-control/sessions` (GET/POST) + `/sessions/[id]` (GET/PATCH)
- `/api/mission-control/stream` (GET — SSE)
- Plus all NEW routes you'll build (bulk-update, dependencies, automation, etc.)

**YOUR components:**
- `src/components/mission-control/mission-control-overview.tsx`
- `src/components/mission-control/task-board.tsx`
- `src/components/mission-control/agent-roster.tsx`
- `src/components/mission-control/event-feed.tsx`
- `src/components/mission-control/session-tracker.tsx`
- Plus all NEW components you'll build

**YOUR lib/hook/type files:**
- `src/hooks/use-mission-control-stream.ts`
- `src/types/mission-control.ts`
- `src/lib/mc-event-bus.ts`
- `src/lib/mock-data/mission-control.ts` — DELETE THIS (Priority 0)
- `src/lib/mc-route-guard.ts` — DOESN'T EXIST, BUILD THIS

**YOUR database tables (all prefixed `mc_`):**
- `mc_tasks`, `mc_agent_status`, `mc_events`, `mc_sessions`
- `mc_comments`, `mc_reviews`, `mc_activities`
- Plus all NEW tables you'll build

**DO NOT TOUCH these (other agents own them):**
- ALL Starter pages (dashboard overview, VPS, models, agents, store, chat, channels, support, billing, account) — Plan 59 agent owns these
- ALL Pro pages (logs, analytics, knowledge-base, webhooks, api-access, audit-log) — Plan 129 agent owns these
- Auth pages (login, register, forgot-password)
- Landing page components
- Admin pages
- `src/lib/ssh.ts` — you can CALL its functions but don't modify the file
- `src/lib/tier.ts` — you can import `hasAccess` but don't modify
- `src/middleware.ts` — you may add new MC routes but don't remove existing ones

**Shared files you may need to touch (coordinate):**
- `src/components/dashboard/app-sidebar.tsx` — MC nav section (Ultra-gated)
- `src/middleware.ts` — adding new MC route paths

### A8. Reference Repos — What to Study

Five open-source repos have been cloned for you to study and adapt patterns from. They are at `C:\Users\yasha\OneDrive\Desktop\yash\`. All are Apache 2.0 or MIT licensed — free to study and adapt.

**1. vibe-kanban** (`C:\Users\yasha\OneDrive\Desktop\yash\vibe-kanban`)
BloopAI's AI agent kanban board. **Steal from this for Task Board.**
- `packages/web-core/src/features/kanban/ui/KanbanContainer.tsx` — drag-drop persistence (`isSyncingRef` at :348, `bulkUpdateIssues` at :611-703), configurable columns (:363-386), view toggle (:871)
- `packages/web-core/src/shared/lib/remoteApi.ts:126-139` — bulk update endpoint pattern
- `packages/web-core/src/shared/keyboard/registry.ts` — keyboard shortcut system with scopes
- `packages/web-core/src/shared/keyboard/SequenceIndicator.tsx` — visual key buffer indicator
- `packages/web-core/src/shared/keyboard/useIssueShortcuts.ts` — per-entity shortcuts
- `packages/web-core/src/features/kanban/model/hooks/useKanbanFilters.ts` — filter system
- `packages/ui/src/components/KanbanCardContent.tsx` — 5-row card progressive disclosure
- `packages/ui/src/components/KanbanBoard.tsx:136-157` — mobile drag handle separation
- `packages/web-core/src/shared/hooks/useIsMobile.ts` — mobile detection
- `packages/web-core/src/shared/dialogs/command-bar/CommandBarDialog.tsx` — command palette
- `packages/web-core/src/shared/stores/useUiPreferencesStore.ts` — Zustand for UI state

**2. mc-reference** (`C:\Users\yasha\OneDrive\Desktop\yash\mc-reference`)
builderz-labs Mission Control. **Steal from this for real-time + agent management.**
- `src/lib/event-bus.ts` — singleton event bus with `globalThis` persistence
- `src/app/api/events/route.ts` — SSE endpoint with workspace scoping + heartbeat
- `src/lib/use-server-events.ts` — client SSE hook with typed dispatch
- `src/lib/use-smart-poll.ts` — visibility-aware polling that defers to SSE
- `src/lib/scheduler.ts:158-213` — heartbeat timeout detection
- `src/app/api/workload/route.ts` — workload recommendation API

**3. kanban-reference** (`C:\Users\yasha\OneDrive\Desktop\yash\kanban-reference`)
dnd-kit + shadcn kanban. **Steal from this for drag animations + accessibility.**
- `src/components/multipleContainersKeyboardPreset.ts` — keyboard cross-column navigation for dnd-kit
- `src/components/KanbanBoard.tsx:139-232` — ARIA live announcements for drag events
- `src/components/BoardColumn.tsx:58-69` — ghost/overlay drag state styling
- `src/components/TaskCard.tsx:53-60` — dragging card visual states

**4. langfuse-reference** (`C:\Users\yasha\OneDrive\Desktop\yash\langfuse-reference`)
LLM observability platform. **Steal from this for trace/session viewer.**
- `web/src/components/trace2/components/TraceTimeline/index.tsx` — Gantt timeline view
- `web/src/components/trace2/lib/helpers.ts` — `heatMapTextColor` for duration coloring
- `web/src/components/trace2/components/TraceTree.tsx` — virtualized tree view
- `web/src/components/session/index.tsx` — session sticky header
- `web/src/components/trace2/contexts/ViewPreferencesContext.tsx` — view preferences in localStorage

**5. llm-monitor-reference** (`C:\Users\yasha\OneDrive\Desktop\yash\llm-monitor-reference`)
OpenLLM Monitor. **Steal from this for live feed UI.**
- `frontend/src/components/LiveFeedMode.jsx` — live feed toggle with event counter

### A9. Dependency Chain — What Must Be Done Before What

```
PRIORITY 0: Kill mock data
    ↓ (MUST be done first — everything after assumes real empty states)
PRIORITY 1: Fix bugs
    ├── mc-route-guard.ts (needed by ALL API fixes)
    ├── emitMCEvent calls (needed before real-time rebuild)
    └── Task board bug fixes (needed before task board rebuild)
         ↓
PRIORITY 2: Rebuild Task Board
    ├── Configurable columns (needed before swimlane view)
    ├── Bulk update endpoint (needed before drag persistence)
    ├── Search/filter (independent)
    ├── Keyboard shortcuts (independent)
    └── Command palette (independent)
         ↓
PRIORITY 3: Rebuild Real-Time
    ↓ (replaces broken SSE — all real-time features depend on this)
PRIORITY 4: Rebuild Agent Roster
    ↓ (agent actions need working real-time to reflect changes)
PRIORITY 6: Rebuild Session Viewer (no cost/token data)
    ↓
PRIORITY 7: Rebuild Event Feed
    ↓
PRIORITY 8: Advanced Task Features
    ├── Task templates (needed before recurring tasks)
    ├── Task dependencies (independent)
    ├── Automation rules (needs working task state changes from P2)
    ├── Bulk operations (needs working task board from P2)
    └── Recurring tasks (needs task templates)
         ↓
PRIORITY 9: Additional View Modes
    ├── Swimlane (needs configurable columns from P2)
    ├── Calendar (needs due dates working from P1 bug fix)
    └── Time tracking (needs started_at/completed_at from P1 bug fix)
```

**Checkpoint rule:** Run `npx next build` after completing each PRIORITY level. Zero errors before moving to the next.

### A10. What NOT to Show Users — EVER

- No cost ($), token counts, usage percentages, budget data, or quota bars
- No provider names (Ollama, Hostinger, Blackbox, Supabase, Vercel, Cloudflare)

### A11. Data Architecture — WHERE Data Lives (CRITICAL)

**Core principle:** User data lives on THEIR VPS, not in our Supabase. This is a privacy selling point AND saves Supabase storage costs. The VPS runs 24/7 — guaranteed uptime.

**Data Location Map:**

| Data | Where | Why |
|------|-------|-----|
| Auth / users / subscriptions / payments | **Supabase** | ClawHQ business data |
| API keys | **Supabase** | Fast validation on ClawHQ server |
| Webhook configs (URLs, secrets, events) | **Supabase** | Dispatch runs on ClawHQ server |
| Support tickets | **Supabase** | Both user + admin need access. AUTO-DELETE 48hrs after resolved. |
| Analytics daily summary (1 row/user/day) | **Supabase** | ClawHQ needs business metrics |
| MC tasks, agent_status, comments, reviews | **Supabase** | Real-time needed (Supabase Realtime for kanban, roster) |
| Webhook delivery logs | **VPS** | Grows fast, only user needs it |
| Analytics detailed data | **VPS** | Heavy, user-specific |
| Agent configs (SOUL.md, config files) | **VPS only** | Already there, no duplication |
| KB documents + chunks + embeddings | **VPS only** | Huge data, stays on user's server |
| Chat messages / conversations | **VPS only** | OpenClaw already stores it |
| Audit logs | **VPS only** | Grows fast, user-specific |
| MC events | **VPS** | Huge event stream, not real-time critical |
| MC sessions + trace data | **VPS** | Huge, trace JSONB is large |
| MC activities (task history) | **VPS** | Grows fast, not real-time critical |

**VPS Services Architecture (3 HTTP services on each user's VPS):**

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **OpenClaw Gateway** | 18789 | Chat, agent management, conversations | Already exists |
| **ClawHQ Embeddings** | 5555 | Text embedding for KB RAG | Already built |
| **ClawHQ Data API** | 5556 | Events, sessions, activities, audit logs, analytics, KB, delivery logs | **NEW — BUILD THIS** |

**ClawHQ Data API (port 5556) — what it serves:**
- `GET /api/events` — MC event feed (paginated, filterable)
- `GET /api/sessions` — MC session list (paginated)
- `GET /api/sessions/:id` — Session detail with trace data
- `GET /api/activities/:taskId` — Task activity history
- `GET /api/audit-log` — Audit log entries (paginated, filterable)
- `GET /api/analytics` — Detailed usage analytics
- `GET /api/kb/documents` — KB document list
- `GET /api/kb/search` — KB vector search
- `GET /api/webhook-deliveries/:webhookId` — Webhook delivery history
- `GET /api/chat/history` — Chat conversation history (or proxy to OpenClaw on 18789)
- `GET /health` — Service health check

**How data flows:**
```
User's Browser → ClawHQ Dashboard API (your server)
    ├── Real-time data → Supabase (tasks, agent status, comments, reviews)
    └── Historical data → User's VPS port 5556 (events, sessions, KB, audit, analytics)
                          User's VPS port 18789 (chat history via OpenClaw)
                          User's VPS port 5555 (embeddings)
```

**Security:** Data API on port 5556 is secured with an auth token generated during provisioning. Only ClawHQ dashboard can call it. Token stored in `vps_instances` table alongside SSH credentials.

**How dashboard API routes change:**
```
BEFORE: const { data } = await supabase.from("mc_events").select(...)
AFTER:  const data = await fetch(`https://${vps.hostname}:5556/api/events?...`, { headers: { Authorization: `Bearer ${vps.data_api_token}` } })
```

Frontend doesn't change — same UI, same features. Only the backend data source changes.

**Local database on VPS:** The Data API uses SQLite (via `better-sqlite3`) for structured data storage. Tables mirror the Supabase schema but live locally. SQLite is perfect for single-user VPS — no server process needed, file-based, fast reads.
- No mock/fake data presented as real
- No "Coming Soon" labels — everything is live
- No light mode or theme toggle
- No SSH details, Docker internals, or provisioning scripts in user-facing UI

---

## PART B: TASKS — DO THESE IN ORDER

---

## PRIORITY 0: KILL ALL MOCK DATA

**Why this is first:** Every task after this assumes empty states exist. If you build the task board rebuild on top of mock data, the board will look "full" during development and you'll miss empty state bugs. Kill mock data first, see the real empty states, then build everything on top of reality.

**What's happening now:** Every MC component imports from `src/lib/mock-data/mission-control.ts` (901 lines of fake data). When the API returns an empty array or errors, the components silently fall back to this mock data. Users see fake agents, fake tasks, fake events, fake costs. There is ZERO indication it's fake.

**The mock data contamination points (9 locations):**

| Component | Default value | Empty API fallback | Error fallback |
|---|---|---|---|
| `overview.tsx` | Lines 85, 100, 115, 130 | Lines 92, 107, 122, 137 | Line 79 |
| `task-board.tsx` | Line 676 | Line 668 | catch in queryFn |
| `agent-roster.tsx` | Line 43 | Line 50 | Line 52 |
| `event-feed.tsx` | Line 105 | Line 112 | Line 114 |
| `session-tracker.tsx` | Line 61 | Line 68 | Line 70 |
| `metrics/route.ts` | — | Line 78 | Line 81 |

- [x] **0.1 Remove mock imports from mission-control-overview.tsx**
  Remove all `import { mockMetrics, mockAgentStatuses, mockTasks, mockEvents, mockSessions }` lines. Replace every `|| mockX` fallback with `|| []` or `|| null`. For the metrics query, replace `mockMetrics` with `null`. Then add proper empty state rendering:
  - Metrics section: when `metrics === null`, show 5 skeleton cards with "—" values and a subtle "Waiting for data..." label
  - Agent section: when `agents.length === 0`, show: icon + "No agents deployed yet" + link to Agents page
  - Tasks section: when `tasks.length === 0`, show: icon + "No tasks created" + "Create your first task" button
  - Events section: when `events.length === 0`, show: icon + "No events yet" + "Events appear when agents perform actions"
  - Sessions section: when `sessions.length === 0`, show: icon + "No sessions yet" + "Sessions are created when agents run tasks"

- [x] **0.2 Remove mock imports from task-board.tsx**
  Remove `import { mockTasks, mockComments, mockReviews, mockActivities, mockAgentStatuses }`. Change `useState<MCTask[]>(mockTasks)` to `useState<MCTask[]>([])`. Change `useState` for comments/reviews/activities to empty arrays. Change the queryFn fallback from `mockTasks` to `[]`. Show empty board state:
  - When zero tasks across all columns: show centered message with icon + "Your task board is empty" + "Create your first task to assign work to your AI agents" + prominent "Create Task" button
  - Per-column empty: just show the column header with a subtle dashed border area saying "Drag tasks here"

- [x] **0.3 Remove mock imports from agent-roster.tsx**
  Remove mock import. Change default + fallback to `[]`. Empty state: icon + "No agents registered yet" + "Deploy an agent from your Agents page to see it here" + link to `/agents`

- [x] **0.4 Remove mock imports from event-feed.tsx**
  Remove mock import. Change default + fallback to `[]`. Empty state: icon + "No events recorded" + "Events will appear here when your agents perform actions, tasks change status, or sessions start"

- [x] **0.5 Remove mock imports from session-tracker.tsx**
  Remove mock import. Change default + fallback to `[]`. Empty state: icon + "No sessions recorded" + "Sessions are created automatically when agents work on tasks"

- [x] **0.6 Fix metrics API to never return mock data**
  In `metrics/route.ts`: remove all `mockMetrics` imports and references. When tables are empty or query fails:
  ```json
  { "metrics": { "system_health_percent": null, "active_agents": 0, "total_agents": 0, "tasks_in_progress": 0, "success_rate_percent": null }, "status": "no_data" }
  ```
  On actual error: return status 500 with `{ error: "Failed to fetch metrics" }`. NEVER return 200 with fake data.

- [x] **0.7 Delete or gate the mock data file**
  Option A (preferred): Delete `src/lib/mock-data/mission-control.ts` entirely. If any import breaks, that import is a mock contamination point you need to fix.
  Option B: Wrap the entire file in `if (process.env.NODE_ENV === 'development' && process.env.MC_USE_MOCK === 'true')` and export empty arrays by default. This keeps it available for local dev but never in production.

**After Priority 0:** Run `npx next build`. Fix any import errors from deleted mock file. Every MC page should now show real empty states with onboarding messages. This is correct — a new user SHOULD see empty states, not fake data.

---

## PRIORITY 1: FIX ALL BUGS (43 total)

**Why fix bugs before building features:** Building new features on top of a broken foundation creates more bugs. The task board rebuild (Priority 2) will rewrite large parts of `task-board.tsx`, but the API route bugs, plan gating, and SSE issues need to be fixed first because the new task board will depend on working APIs.

### 1.0 Create mc-route-guard.ts (DO THIS FIRST — all API fixes depend on it)

This file doesn't exist but should. It's a shared utility used by every MC API route.

- [x] **Build `src/lib/mc-route-guard.ts`**
  Create a function `guardMCRoute(request)` that does three things in order:
  1. **Auth check:** Get user from Supabase session. If no user → return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`
  2. **Plan check:** Get user's subscription from `subscriptions` table. Check `hasAccess(plan, "ultra")`. If not Ultra → return `NextResponse.json({ error: "Ultra plan required" }, { status: 403 })`
  3. **Rate limit:** Call `rateLimit()` with configurable limits per route

  Returns `{ user, plan, subscription }` on success, or `NextResponse` on failure.

  Every MC API route should start with:
  ```typescript
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  ```

### 1.1 Task Board Bugs (14 items)

- [x] **1.1.1 [CRITICAL] API data never syncs after first load**
  **Where:** `task-board.tsx:687-692`
  **What's broken:** A boolean `initialSynced` is set to `true` after the first API response, and the `useEffect` that syncs API data → local state has `if (initialSynced) return`. This means after the first load, API data is fetched every 10 seconds (via `refetchInterval: 10000`) but the results are thrown away — they never update the local `tasks` state. If another tab, device, or agent modifies tasks, those changes are invisible.
  **How to fix:** Replace `initialSynced` boolean with a `isSyncingRef` pattern from vibe-kanban. The idea:
  - Use a `useRef<boolean>(false)` called `isSyncingRef`
  - When a drag starts (`handleDragStart`), set `isSyncingRef.current = true`
  - After the drag API call completes + 500ms buffer, set `isSyncingRef.current = false`
  - In the `useEffect` that syncs API → local state, check `if (isSyncingRef.current) return` — this prevents server data from overwriting the optimistic drag state
  - When NOT dragging, server data always flows through to local state
  **Reference:** `vibe-kanban/packages/web-core/src/features/kanban/ui/KanbanContainer.tsx:348` (isSyncingRef definition), `:437` (the guard in useEffect)
  **Connected to:** Priority 2 task board rebuild (bulk update endpoint), but this bug fix can be done independently first

- [x] **1.1.2 [CRITICAL] Drag-drop between columns doesn't persist**
  **Where:** `task-board.tsx:721-775` (`handleDragOver` and `handleDragEnd`)
  **What's broken:** When you drag a card from one column to another, `handleDragOver` updates `column_id` in local state, and `handleDragEnd` updates position in local state. Neither function calls any API. The reorder endpoint (`/api/mission-control/tasks/reorder`) exists but is never called. On page refresh, all moves revert.
  **How to fix:** In `handleDragEnd`, after updating local state, call the reorder API (or the new bulk-update endpoint from Priority 2). Send all affected card IDs with their new `column_id` and `position` values. Use the sort order formula `1000 * columnIndex + cardIndex` for deterministic ordering.
  **Temporary fix (before Priority 2):** Call `PATCH /api/mission-control/tasks/[id]` with `{ column_id, position }` for the moved card. This is one API call per move.
  **Proper fix (after Priority 2):** Call `POST /api/mission-control/tasks/bulk-update` with all affected cards in one request.
  **Reference:** `vibe-kanban/.../KanbanContainer.tsx:611-703` for the bulk update flow

- [x] **1.1.3 [CRITICAL] All mutations fire-and-forget**
  **Where:** `task-board.tsx:806-810` (create), `:843-847` (send to inbox), `:886-890` (update), `:898-900` (delete), `:916-920` (comment), `:951-955` (review)
  **What's broken:** Every fetch call ends with `.catch(() => {})`. If the API returns an error (auth expired, server 500, validation failure), the error is swallowed. The user sees the optimistic local update succeed, but on page refresh everything reverts. Data loss.
  **How to fix:** For each mutation:
  1. Before the optimistic update, capture the previous state: `const prevTasks = [...tasks]`
  2. Apply the optimistic update to local state
  3. Call the API with proper error handling
  4. On error: rollback local state to `prevTasks`, show error toast: `toast.error("Failed to save. Please try again.")`
  5. On success: optionally show success toast for important actions (create, delete)
  Use `sonner` for toasts (already in the project: `import { toast } from "sonner"`).

- [x] **1.1.4 [CRITICAL] Comments/reviews/activities never fetched from API**
  **Where:** `task-board.tsx:677-680`
  **What's broken:** `comments`, `reviews`, and `activities` state arrays are initialized from mock data and never loaded from the server. The GET endpoints exist (`/api/mission-control/tasks/[id]/comments`, `/api/mission-control/tasks/[id]/reviews`) but are never called.
  **How to fix:** When the task detail modal opens (user clicks a task card), fetch comments, reviews, and activities for that specific task:
  ```typescript
  // In the task detail component or when selectedTask changes:
  const { data: comments } = useQuery({
    queryKey: ["mc-comments", selectedTask.id],
    queryFn: () => fetch(`/api/mission-control/tasks/${selectedTask.id}/comments`).then(r => r.json()),
    enabled: !!selectedTask
  });
  ```
  Same for reviews and activities. Remove the global mock arrays.

- [x] **1.1.5 [HIGH] Agent dropdown uses mock agents**
  **Where:** `task-board.tsx:369-372`
  **What's broken:** `MOCK_AGENTS` is derived from `mockAgentStatuses` — static fake data. Users can only "assign" tasks to fake agents.
  **How to fix:** Fetch real agents from `/api/mission-control/agents/status` using `useQuery`. Populate the Select dropdown with real agent names/IDs. Show "No agents deployed" if empty.

- [x] **1.1.6 [HIGH] Task IDs use Date.now()**
  **Where:** `task-board.tsx:781`
  **What's broken:** `id: task-${Date.now()}` collides if two tasks are created within the same millisecond. Same issue at `:904` (comments), `:929` (reviews), `:831,:940` (activities).
  **How to fix:** Use `crypto.randomUUID()` for all client-generated IDs. These are temporary IDs for optimistic UI — the server generates the real UUID on insert. The client ID is replaced when the API response comes back.

- [x] **1.1.7 [MEDIUM] `user_id: "demo"` hardcoded**
  **Where:** `task-board.tsx:782`
  **What's broken:** Client-created tasks have `user_id: "demo"`. The server-side POST sets the real user_id, but local state has the wrong value.
  **How to fix:** Pass the real user ID from auth context. The page component already has the user — pass it as a prop or use a context/hook.

- [x] **1.1.8 [MEDIUM] Tasks GET returns 200 on error**
  **Where:** `tasks/route.ts:52-54`
  **What's broken:** The catch block returns `{ tasks: [], total: 0 }` with HTTP 200. The client can't distinguish "no tasks" from "query failed". After removing mock data (Priority 0), an empty array from an error looks identical to a genuinely empty board.
  **How to fix:** Return HTTP 500 with `{ error: "Failed to fetch tasks" }`. The client should show an error state with a retry button, not an empty board.

- [x] **1.1.9 [MEDIUM] PATCH overwrites metadata instead of merging**
  **Where:** `tasks/[id]/route.ts:109-113`
  **What's broken:** When moving a task to "done" without approval, the code sets `updates.metadata = { _warning: "..." }`. This overwrites any existing metadata (subtasks, tags, custom fields) because it creates a new object instead of merging with the database value.
  **How to fix:** Fetch the task's current metadata from the database first, then merge:
  ```typescript
  const { data: existing } = await supabase.from("mc_tasks").select("metadata").eq("id", id).single();
  updates.metadata = { ...(existing?.metadata || {}), ...(updates.metadata || {}), _warning: "..." };
  ```

- [x] **1.1.10 [MEDIUM] isOverdue returns true for tasks due today**
  **Where:** `task-board.tsx:91-93`
  **What's broken:** `new Date(dateStr) < new Date()` compares the due date (midnight) against the current time. A task due "today" becomes "overdue" at 12:01 AM.
  **How to fix:** Compare against end of day:
  ```typescript
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay < new Date();
  ```

- [x] **1.1.11 [MEDIUM] Agent "none" as string instead of null**
  **Where:** `task-board.tsx:511` (Select value "none"), `:433` (assignment logic)
  **What's broken:** When user selects "None" for agent, `agentId` is set to the string `"none"`, which becomes `assigned_agent_id: "none"` in the database. Should be `null`.
  **How to fix:** In `handleCreateTask`, check: `assigned_agent_id: agentId === "none" ? null : agentId`

- [x] **1.1.12 [MEDIUM] completed_at not cleared when task leaves "done"**
  **Where:** `task-board.tsx:739-743`
  **What's broken:** `handleDragOver` only updates `column_id`. If a task in "done" (with `completed_at` set) is dragged back to "in_progress", `completed_at` remains set. The task appears "completed" even though it's back in progress.
  **How to fix:** In `handleDragOver`, when the destination column is NOT "done", clear `completed_at`:
  ```typescript
  if (overCol !== "done") {
    task.completed_at = null;
  }
  ```
  Also clear it in the API call.

- [x] **1.1.13 [MEDIUM] Comments filtered by user_id on comment table**
  **Where:** `comments/route.ts:29`
  **What's broken:** `.eq("user_id", user.id)` on the `mc_comments` table means only comments authored by the current user are returned. Agent-authored comments (with a different or null user_id) are excluded. The filter should be on task ownership, not comment authorship.
  **How to fix:** First verify the task belongs to the user (check `mc_tasks.user_id = user.id` for the given `task_id`), then fetch ALL comments for that task regardless of who authored them.

- [x] **1.1.14 [LOW] Activities API endpoint doesn't exist**
  **Where:** Missing file `src/app/api/mission-control/tasks/[id]/activities/route.ts`
  **What's broken:** The task detail modal expects to show an activity timeline but the API endpoint doesn't exist.
  **How to build:** Create the route. GET handler: auth → guard → fetch from `mc_activities` where `task_id = params.id` and the task belongs to the user. Order by `created_at DESC`. Paginate (default 50 per page). Return `{ activities: [...], total: number }`.

### 1.2 Agent Roster Bugs (4 items)

- [x] **1.2.1 [CRITICAL] Heartbeat never calls emitMCEvent()**
  **Where:** `agents/heartbeat/route.ts`
  **What's broken:** When an agent sends a heartbeat with a status change (e.g., "working" → "idle"), the status is upserted in `mc_agent_status` and an event is inserted in `mc_events`. But `emitMCEvent()` is never called, so the SSE stream doesn't push the update. Clients only learn about agent status changes via polling.
  **How to fix:** After the upsert and event insert, call:
  ```typescript
  import { emitMCEvent } from "@/lib/mc-event-bus";
  emitMCEvent(user.id, "agent_status_changed", { agent_id, status, ...metadata });
  ```
  **Note:** This depends on the real-time rebuild (Priority 3) where `emitMCEvent` may be replaced with Supabase Realtime. For now, add the call — it will work with the current EventBus for same-process deployments.

- [x] **1.2.2 [MEDIUM] No Ultra plan gating on API routes**
  **Where:** `agents/status/route.ts`, `agents/heartbeat/route.ts`
  **How to fix:** Use `guardMCRoute()` from step 1.0. Replace the manual auth check with the shared guard.

- [x] **1.2.3 [MEDIUM] Catch returns 200 on error**
  **Where:** `agents/status/route.ts:31-33`
  **How to fix:** Return `NextResponse.json({ error: "Failed to fetch agent status" }, { status: 500 })` instead of `{ agents: [] }` with 200.

- [x] **1.2.4 [MEDIUM] Stale data in agent detail sheet**
  **Where:** `agent-roster.tsx:58,101`
  **What's broken:** `selectedAgent` is stored in local state as a snapshot. The `agents` array refreshes every 2 seconds, but `selectedAgent` never updates. If an agent's status changes while the sheet is open, the user sees stale data.
  **How to fix:** Add a `useEffect` that updates `selectedAgent` when `agents` changes:
  ```typescript
  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.find(a => a.id === selectedAgent.id);
      if (updated) setSelectedAgent(updated);
    }
  }, [agents]);
  ```

### 1.3 Event Feed Bugs (6 items)

- [x] **1.3.1 [MEDIUM] Events POST never calls emitMCEvent()**
  **Where:** `events/route.ts:88-112`
  **How to fix:** After inserting the event in the database, call `emitMCEvent(user.id, "new_event", eventData)`.

- [x] **1.3.2 [MEDIUM] Client filters never sent to API**
  **Where:** `event-feed.tsx:109`
  **What's broken:** The fetch URL is hardcoded to `/api/mission-control/events` with no query params. The API supports `?type=...&severity=...` but the client filters only in-memory via `useMemo`. This means ALL events are fetched on every 2-second poll, even when the user has filtered to just "errors".
  **How to fix:** Build the fetch URL dynamically:
  ```typescript
  const params = new URLSearchParams();
  if (typeFilter) params.set("type", typeFilter);
  if (severityFilter) params.set("severity", severityFilter);
  const url = `/api/mission-control/events?${params.toString()}`;
  ```
  Keep the `useMemo` for instant UI response, but send filters to the API to reduce payload size.

- [x] **1.3.3 [MEDIUM] No Ultra plan gating**
  **How to fix:** Use `guardMCRoute()`.

- [x] **1.3.4 [MEDIUM] No event_type/severity validation**
  **Where:** `events/route.ts:62-79`
  **How to fix:** Define valid enums and validate:
  ```typescript
  const VALID_EVENT_TYPES = ["webhook", "tool_invocation", "task_complete", "agent_state_change", "session_start", "session_end"] as const;
  const VALID_SEVERITIES = ["success", "info", "warning", "error"] as const;
  if (!VALID_EVENT_TYPES.includes(event_type)) return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  ```

- [x] **1.3.5 [LOW] Catch returns 200 on error**
  **Where:** `events/route.ts:50-52`
  **How to fix:** Return 500 with error message.

- [x] **1.3.6 [LOW] No pagination UI**
  **How to fix:** Add "Load more" button at the bottom of the event list. Track `page` state, increment on click, pass to API. Or implement infinite scroll with `IntersectionObserver`.

### 1.4 Session Tracker Bugs (6 items)

- [x] **1.4.1 [MEDIUM] Sessions POST/PATCH never call emitMCEvent()**
  **How to fix:** Call `emitMCEvent(user.id, "session_updated", sessionData)` after successful insert/update in both routes.

- [x] **1.4.2 [MEDIUM] No Ultra plan gating**
  **How to fix:** Use `guardMCRoute()`.

- [x] **1.4.3 [MEDIUM] formatDuration(0) shows "Active"**
  **Where:** `session-tracker.tsx:31`
  **What's broken:** `if (!ms)` is falsy for both `null` and `0`. A session that completed instantly shows "Active".
  **How to fix:** `if (ms === null || ms === undefined) return "Active";`

- [x] **1.4.4 [MEDIUM] Selected session shows stale data**
  **Where:** `session-tracker.tsx:76-77`
  **How to fix:** Same pattern as agent roster — update `selectedSession` when `sessions` array refreshes.

- [x] **1.4.5 [MEDIUM] PATCH allows arbitrary cost_usd**
  **Where:** `sessions/[id]/route.ts:25-34`
  **What's broken:** The allowed fields include `cost_usd`, `tokens_input`, `tokens_output`. A client can set these to any value.
  **How to fix:** Remove `cost_usd`, `tokens_input`, `tokens_output` from the allowed fields array. These fields should never be set by the client. If they need to be tracked internally, set them server-side only. **Remember: no cost/token data is shown to users.**

- [x] **1.4.6 [LOW] Catch returns 200 on error**
  **How to fix:** Return 500.

### 1.5 SSE / Infrastructure Bugs (8 items)

- [x] **1.5.1 [CRITICAL] emitMCEvent() only called from task routes**
  **What's broken:** The SSE system can only push task-related events. Agent heartbeats, new events, and session updates all rely on polling because nobody calls `emitMCEvent()` from those routes.
  **How to fix:** Add `emitMCEvent()` calls in:
  - `agents/heartbeat/route.ts` — after status upsert (event: `agent_status_changed`)
  - `events/route.ts` POST — after event insert (event: `new_event`)
  - `sessions/route.ts` POST — after session create (event: `session_created`)
  - `sessions/[id]/route.ts` PATCH — after session update (event: `session_updated`)

- [x] **1.5.2 [HIGH] EventBus won't work on Vercel serverless**
  **Where:** `mc-event-bus.ts`
  **What's broken:** The `EventEmitter` singleton uses `globalThis` which persists within a single Node.js process. On Vercel, each API route invocation may run in a different isolate. The POST endpoint that calls `emitMCEvent()` runs in a different process than the GET SSE stream — the event never reaches the listener.
  **How to fix (Priority 3 will fully address this, but for now):** Keep the current EventBus but add a comment that it only works for single-process deployments. The Priority 3 rebuild will replace it with Supabase Realtime channels.

- [x] **1.5.3 [HIGH] mc-route-guard.ts missing**
  Already covered in step 1.0 above.

- [x] **1.5.4 [MEDIUM] No plan gating on SSE endpoint**
  **Where:** `stream/route.ts`
  **How to fix:** Add Ultra plan check at the top of the handler. Use `guardMCRoute()` or a simplified version (SSE is GET, not JSON body).

- [x] **1.5.5 [MEDIUM] Duplicate SSE connections**
  **Where:** `event-feed.tsx:103`, `session-tracker.tsx:59`
  **What's broken:** Both components independently call `useMissionControlStream()`. If both are mounted, two SSE connections open.
  **How to fix:** Lift the `useMissionControlStream()` call to the Mission Control layout component (`src/app/dashboard/mission-control/layout.tsx` — create if it doesn't exist). Pass connection state via React context. All child pages consume the context instead of creating their own connections.

- [x] **1.5.6 [LOW] connected state never shown**
  **How to fix:** In the MC layout header, show a small indicator:
  - Green dot + "Live" when `connected === true`
  - Yellow dot + "Reconnecting..." when disconnected but retrying
  - Red dot + "Disconnected" when retries exhausted

- [x] **1.5.7 [LOW] SSE retries forever on 401**
  **Where:** `use-mission-control-stream.ts:65-78`
  **How to fix:** In the `onerror` handler, check if the HTTP status was 401 or 403. If so, stop retrying and set `connected = false` permanently. Show "Session expired — please refresh" in the UI.

- [x] **1.5.8 [LOW] Stream closes without client notification**
  **Where:** `stream/route.ts:65-72`
  **How to fix:** Before `controller.close()`, send a "closing" event: `controller.enqueue(encoder.encode("event: closing\ndata: {}\n\n"))`. The client can handle this gracefully and reconnect immediately instead of waiting for the `onerror` to fire.

### 1.6 Cross-cutting Bugs (5 items)

- [x] **1.6.1 [HIGH] No rate limiting on ANY endpoint**
  **How to fix:** Use `rateLimit()` from `src/lib/rate-limit.ts` (already exists in the project). Apply via `guardMCRoute()`. Suggested limits:
  - Metrics GET: 20/min
  - Tasks GET: 30/min, POST: 20/min
  - Tasks PATCH/DELETE: 30/min
  - Comments/Reviews POST: 20/min
  - Reorder: 20/min
  - Agents status GET: 60/min
  - Heartbeat POST: 60/min
  - Events GET: 30/min, POST: 100/min
  - Sessions GET: 30/min, POST: 20/min
  - Stream GET: 5/min (connection rate, not message rate)

- [x] **1.6.2 [MEDIUM] No body size limits**
  **How to fix:** In POST/PATCH handlers, check `request.headers.get("content-length")`. If > 50KB (51200 bytes), return 413. Also validate specific fields: `metadata` object max 10KB, `payload` max 20KB, `description` max 5000 chars, `content` (comments) max 2000 chars.

- [x] **1.6.3 [MEDIUM] Reorder unbounded array**
  **Where:** `reorder/route.ts:28`
  **How to fix:** Add: `if (updates.length > 100) return NextResponse.json({ error: "Max 100 items per reorder" }, { status: 400 })`.

- [x] **1.6.4 [LOW] formatTimeAgo duplicated**
  **Where:** `mission-control-overview.tsx:58-66` and `agent-roster.tsx:29-38`
  **How to fix:** Extract to `src/lib/format-time.ts`. Export `formatTimeAgo(dateString: string | null): string`. Handle null input. Import from both components.

- [x] **1.6.5 [LOW] Status colors opacity issue**
  **Where:** `mission-control-overview.tsx:44-45`
  **What's broken:** `text-muted-foreground/50` opacity modifier may not work with CSS variable-based colors in shadcn.
  **How to fix:** Use explicit opacity: `text-muted-foreground opacity-50` or define explicit color values in the status config.

---

## PRIORITY 2: REBUILD TASK BOARD

**Why:** The task board is the centerpiece of Mission Control — it's where users spend 80% of their time. After fixing bugs (Priority 1), the board works correctly but is still basic. This priority transforms it from a simple kanban into a professional AI agent management tool.

**What changes:** Configurable columns, proper drag persistence, keyboard shortcuts, search/filter, command palette, better card design, mobile support, undo/redo.

### New Database Table

- [x] **2.0 Create `mc_task_statuses` table**
  ```sql
  CREATE TABLE mc_task_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#666666',
    sort_order INTEGER NOT NULL DEFAULT 0,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- RLS: users can only see/modify their own statuses
  ALTER TABLE mc_task_statuses ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own statuses" ON mc_task_statuses
    FOR ALL USING (auth.uid() = user_id);

  -- Default statuses (inserted for each new Ultra user, or via migration)
  -- Backlog, In Progress, Review, Done
  ```

  **Migration:** Create a Supabase migration file at `supabase/migrations/YYYYMMDD_mc_task_statuses.sql`.

  **Seed default statuses:** When an Ultra user first accesses Mission Control (or via a setup endpoint), insert 4 default statuses: Backlog (sort_order: 0, color: `#666666`), In Progress (sort_order: 1, color: `#3b82f6`), Review (sort_order: 2, color: `#f59e0b`), Done (sort_order: 3, color: `#22c55e`).

  **Update `mc_tasks`:** Change `column_id` from a hardcoded string enum to a UUID referencing `mc_task_statuses.id`. Add a migration to convert existing column string values to status UUIDs.

### New API Endpoints

- [x] **2.1 Build `GET/POST /api/mission-control/statuses`**
  GET: return user's statuses ordered by `sort_order`. POST: create new status (name, color required). Max 10 statuses per user.

- [x] **2.2 Build `PATCH/DELETE /api/mission-control/statuses/[id]`**
  PATCH: update name, color, sort_order, hidden. DELETE: only if no tasks use this status (or move tasks to "Backlog" first).

- [x] **2.3 Build `POST /api/mission-control/tasks/bulk-update`**
  Accepts: `{ updates: [{ id: string, column_id: string, position: number }] }`. Max 100 items. Updates all in a transaction. This is the endpoint that drag-drop calls after every move.
  **Reference:** `vibe-kanban/.../remoteApi.ts:126-139`

### Frontend Rebuild

- [x] **2.4 Configurable columns**
  Fetch statuses from `/api/mission-control/statuses`. Render columns based on statuses where `hidden === false`. Add a "Manage Columns" button (gear icon) that opens a dialog to add/rename/reorder/hide/color columns.
  **Reference:** `vibe-kanban/.../KanbanContainer.tsx:363-386` for visible vs hidden filtering

- [x] **2.5 Kanban/List view toggle**
  Add a ButtonGroup: "Kanban" | "List". In List view, render tasks grouped by status in a vertical table/list. Hidden statuses appear as additional tabs in List view only.
  **Reference:** `vibe-kanban/.../KanbanContainer.tsx:871`

- [x] **2.6 Drag persistence with bulk update + isSyncingRef**
  Wire `handleDragEnd` to call the bulk-update endpoint. Implement the `isSyncingRef` guard from bug fix 1.1.1. Sort order formula: `1000 * columnIndex + cardIndex`.
  **Reference:** `vibe-kanban/.../KanbanContainer.tsx:348,437,604,611-703`

- [x] **2.7 Keyboard shortcut registry**
  Install `react-hotkeys-hook`. Create `src/lib/mc-keyboard.ts` with a shortcut registry. Scopes: KANBAN (active when board is focused), TASK_DETAIL (active when modal is open), GLOBAL (always active). Shortcuts:
  - `n` or `c` — create new task
  - `j/k` — move focus down/up in column
  - `h/l` — move focus left/right across columns
  - `/` — focus search input
  - `?` — show shortcut help
  - `Enter` — open focused task detail
  - `Escape` — close modal/dialog
  - `Cmd+K` — open command palette
  - `i>c` — create task (sequential)
  - `i>p` — change priority (sequential)
  - `i>a` — assign agent (sequential)
  - `i>d` — duplicate task (sequential)
  - `i>x` — delete task (sequential)
  Add a floating indicator (bottom-right) showing the key buffer for sequential shortcuts. Red shake on invalid, green flash on valid.
  **Reference:** `vibe-kanban/.../keyboard/registry.ts`, `SequenceIndicator.tsx`, `useIssueShortcuts.ts`

- [x] **2.8 Search & filter bar**
  Add a filter bar above the kanban board. Filters: text search (searches task title + description), priority dropdown (low/medium/high/critical), agent dropdown (list real agents + "Unassigned"), tag filter, sort by (position, priority, created, updated, due date). Filters stored in local state (not persisted to server). "Clear all" button. Show result count.
  **Reference:** `vibe-kanban/.../useKanbanFilters.ts`

- [x] **2.9 Command palette**
  Install `cmdk`. Create `src/components/mission-control/command-palette.tsx`. Open with `Cmd+K`. Actions: "Create task", "Search tasks...", "Go to Overview", "Go to Agents", "Go to Events", "Go to Sessions", "Change task status" (shows status picker), "Assign agent" (shows agent picker). Context-aware: if a task is focused, show task-specific actions.
  **Reference:** `vibe-kanban/.../CommandBarDialog.tsx`

- [x] **2.10 Progressive disclosure card design**
  Redesign task cards with 5 rows:
  - Row 1: Task ID (small, muted) + status indicator dot
  - Row 2: Title (truncated, `line-clamp-1`, font-medium)
  - Row 3: Description preview (muted, `line-clamp-2` desktop, hidden on mobile)
  - Row 4: Priority badge (left) + Agent name/avatar (right)
  - Row 5: Tags (max 2 + "+N") + Due date (right, red if overdue)
  "More actions" button: invisible until hover (desktop), always visible (mobile). Click stops propagation (doesn't open detail modal).
  **Reference:** `vibe-kanban/.../KanbanCardContent.tsx`

- [x] **2.11 Mobile drag handle separation**
  On mobile (`useIsMobile()` hook — check viewport < 768px):
  - Whole card = tap to open detail modal
  - Separate 6-dot grip handle = drag to move
  - On desktop: whole card is draggable + click (only if not dragging) opens detail
  **Reference:** `vibe-kanban/.../KanbanBoard.tsx:136-157`, `useIsMobile.ts`

- [x] **2.12 Undo/redo with toast**
  Create `src/hooks/use-undo-stack.ts`. Maintain a stack of `{ type: "move"|"delete"|"create"|"assign", undo: () => void, description: string }`. After every destructive action (move, delete, priority change), push to stack. Show a toast with "Undo" button using `sonner`:
  ```typescript
  toast("Task moved to Review", { action: { label: "Undo", onClick: () => undoStack.pop().undo() } });
  ```
  Toast auto-dismisses after 5 seconds. Neither reference repo has this — build from scratch.

---

## PRIORITY 3: REBUILD REAL-TIME

**Why:** The current SSE system is broken (EventBus can't cross serverless processes). After fixing bugs (Priority 1) and rebuilding the task board (Priority 2), real-time updates are needed so multi-tab/multi-device usage works, and so the dashboard feels "alive."

- [x] **3.1 Replace EventBus with Supabase Realtime**
  Supabase is already in the stack. Use Supabase Realtime channels for cross-process event broadcasting.

  **Server side:** After any mutation in MC API routes, broadcast via Supabase channel:
  ```typescript
  const supabase = createAdminClient();
  await supabase.channel(`mc:${userId}`).send({
    type: "broadcast",
    event: "task_updated",
    payload: { taskId, column_id, ... }
  });
  ```

  **Client side:** Create `src/hooks/use-mc-realtime.ts`:
  ```typescript
  const channel = supabase.channel(`mc:${userId}`);
  channel.on("broadcast", { event: "*" }, (payload) => {
    // Invalidate relevant React Query caches based on event type
    queryClient.invalidateQueries({ queryKey: ["mc-tasks"] });
  });
  channel.subscribe();
  ```

  This replaces the EventEmitter, works across serverless isolates, and is truly real-time.

  **Alternative (if Supabase Realtime is not available):** Adopt mc-reference's 3-layer pattern (event bus + SSE + smart polling). Reference: `mc-reference/src/lib/event-bus.ts`, `use-server-events.ts`, `use-smart-poll.ts`

- [x] **3.2 Smart polling with visibility-aware fallback**
  Even with Supabase Realtime, keep polling as a fallback for connection drops:
  - When realtime is connected: poll every 30 seconds (bootstrap/sync only)
  - When realtime is disconnected: poll every 5 seconds
  - When tab is hidden: stop polling entirely
  - When tab becomes visible: fire immediate poll, then resume normal interval
  **Reference:** `mc-reference/src/lib/use-smart-poll.ts`

- [x] **3.3 Connection status indicator**
  In the MC layout header, show real-time connection status:
  - Green dot + "Live" — Supabase Realtime connected
  - Yellow dot + "Reconnecting..." — connection lost, retrying
  - Gray dot + "Offline" — connection failed, polling fallback active
  Use the `connected` state from the realtime hook.

---

## PRIORITY 4: REBUILD AGENT ROSTER

**Why:** Currently read-only. Users can look at agents but can't DO anything. A command center needs controls.

- [x] **4.1 Agent actions: start/stop/restart**
  Add action buttons to each agent card and the detail sheet. These call SSH functions that already exist in `src/lib/ssh.ts`:
  - **Start agent:** calls `startOpenClaw()` or equivalent SSH command on the user's VPS
  - **Stop agent:** calls `stopOpenClaw()` or equivalent
  - **Restart agent:** calls `restartOpenClaw()` or equivalent
  Build API routes: `POST /api/mission-control/agents/[id]/start`, `/stop`, `/restart`. Each: auth → guard → get VPS SSH credentials from `vps_instances` table → SSH command → update `mc_agent_status` → emit event → return result.
  Show confirmation dialog before stop/restart. Show loading spinner on button during SSH call. Show success/error toast.

- [x] **4.2 Agent actions: reassign task**
  In the agent detail sheet, show the agent's current task. Add "Reassign" button → opens a task picker dialog → user selects a different task → PATCH the task's `assigned_agent_id` → emit event. Also add "Unassign" to remove the agent from its current task.

- [x] **4.3 Wire real system health**
  **Where:** `metrics/route.ts:67` (hardcoded `system_health_percent: 94.5`)
  **How to fix:** Calculate from real VPS stats. Call `/api/vps/monitoring` internally (or use the same SSH functions) to get CPU, RAM, disk usage. Formula:
  ```
  health = 100 - max(cpu_percent, ram_percent, disk_percent)
  ```
  If VPS is stopped: health = 0 with status "VPS Offline". If SSH fails: health = null with status "Unknown".

- [x] **4.4 Heartbeat timeout detection**
  Create a mechanism (cron endpoint or scheduled check) that runs every 5 minutes. Query `mc_agent_status` for agents where `last_activity_at < now() - interval '10 minutes'`. Set those agents to status "offline". Insert an event in `mc_events`: "Agent X went offline (no heartbeat for 10 minutes)". Emit real-time event.
  **Reference:** `mc-reference/src/lib/scheduler.ts:158-213`

- [x] **4.5 Workload management API**
  Build `GET /api/mission-control/workload`. Returns a recommendation based on current system state:
  - `"normal"` — everything fine
  - `"throttle"` — some agents busy, queue growing (suggest waiting before new tasks)
  - `"shed"` — most agents busy or blocked, consider reducing workload
  - `"pause"` — critical issues, agents failing
  Calculate from: error rate (last 5 minutes), queue depth (tasks in "Backlog"), agent busy ratio (working/total). Return recommendation + metrics. Show on overview dashboard as a health indicator.
  **Reference:** `mc-reference/src/app/api/workload/route.ts`

---

## ~~PRIORITY 5: COST TRACKING~~ — REMOVED

**Decision:** No cost/usage/quota tracking shown to users. All tiers are unlimited-feel. Rate limiting happens silently in the backend. Users never see token counts, costs, budgets, or usage bars. If they hit rate limits, they get a "Too many requests" error — that's it.

**In code:** Remove `cost_usd`, `tokens_input`, `tokens_output` from all user-facing UI components. These fields can remain in the database for internal tracking but are NEVER displayed. Remove any `$` formatting, cost color coding, or budget alerts from the UI.

---

## PRIORITY 6: REBUILD TRACE/SESSION VIEWER

**Why:** The session tracker currently shows basic data in a list. For $350/mo, users need professional debugging tools — step-by-step execution traces with visual timelines, bottleneck identification, and session comparison.

**IMPORTANT:** No cost/token data shown to users. Sessions display: agent name, duration, status (active/completed/failed), and trace steps. NOT cost, tokens, or any monetary values.

- [x] **6.1 Gantt timeline view for traces**
  When a user clicks a session and opens the detail sheet, replace the current basic dot visualization with a horizontal Gantt timeline:
  - Each trace step = a horizontal bar
  - Bar width = proportional to step duration
  - Bar color = green (success), red (failure), yellow (in progress), gray (skipped)
  - Tree connector lines on the left (indentation for nested steps)
  - Time scale header showing total session duration
  - Hover on bar → tooltip with step name, duration, result
  **Reference:** `langfuse/web/src/components/trace2/components/TraceTimeline/index.tsx`

- [x] **6.2 Heat map coloring on duration**
  For each trace step, color the duration text based on how much of the total session time it consumed:
  - > 75% of total → red text (this step is the bottleneck)
  - > 50% of total → yellow text (significant)
  - < 50% → default text
  Users can instantly spot which step is slow without reading numbers.
  **Reference:** `langfuse/web/src/components/trace2/lib/helpers.ts` (`heatMapTextColor` function)

- [x] **6.3 Tree view with collapsible spans**
  Add a tree view mode (toggle between timeline and tree). Each node shows: step name, type badge (e.g., "Tool", "Agent", "API"), duration, status badge. Collapsible — click to expand/collapse children. Use `@tanstack/react-virtual` for virtualization if traces have many steps.
  **Reference:** `langfuse/web/src/components/trace2/components/TraceTree.tsx`

- [x] **6.4 Session sticky header**
  When viewing a session's traces, show a sticky header bar at the top with: agent name badge, total duration, trace count ("12 steps"), status badge (Active/Completed/Failed). This stays visible while scrolling through the trace list.
  **Reference:** `langfuse/web/src/components/session/index.tsx`

- [x] **6.5 Session comparison**
  "Compare" button on session list → user selects two sessions → side-by-side view showing: duration diff, status diff, step-by-step trace diff (aligned by step name, highlight differences). Useful for debugging: "Why did this session fail when the same task succeeded yesterday?"

- [x] **6.6 Live session indicator**
  For active sessions (no `ended_at`), show a pulsing green dot + a counting-up timer showing elapsed time since `started_at`. Updates every second via `setInterval`. Clearly distinguishes active from completed sessions in the list.

---

## PRIORITY 7: REBUILD EVENT FEED

**Why:** Currently a read-only log with in-memory filtering. For $350/mo, it should be an actionable activity stream.

- [x] **7.1 Server-side filtering**
  Pass filter params to the API: `?type=...&severity=...&agent_id=...&from=...&to=...&search=...`. The API applies these to the Supabase query. Reduces payload size and enables pagination.

- [x] **7.2 Event-to-session linking**
  Events with a `session_id` should be clickable. Clicking navigates to or opens the session detail sheet. Show a small link icon next to events that have linked sessions.

- [x] **7.3 Live feed toggle**
  Add "Live" / "Paused" toggle button. When Live: new events animate in from the top (slide-in animation). When Paused: events stop auto-updating, user can read without things jumping. Show event counter badge: "12 new events" when paused.
  **Reference:** `llm-monitor-reference/frontend/src/components/LiveFeedMode.jsx`

- [x] **7.4 Left border color coding by severity**
  Each event card gets a colored left border: green (success), blue (info), yellow (warning), red (error). Enables instant visual scanning without reading text.

- [x] **7.5 Structured payload display**
  Instead of raw `JSON.stringify` in a `<pre>` tag, parse common payload shapes into readable cards. Example: a webhook event shows "URL: https://..., Status: 200, Latency: 45ms" in a clean key-value layout. Unknown shapes fall back to formatted JSON with syntax highlighting.

- [x] **7.6 Date range filter**
  Add a date picker: "Last hour", "Today", "Last 7 days", "Last 30 days", "Custom range". Pass `from` and `to` timestamps to the API.

- [x] **7.7 Full-text search**
  Search input that searches event `message` and `payload` content. Pass `search` param to API. API uses `.ilike()` or full-text search on the message field.

---

## PRIORITY 8: ADVANCED TASK FEATURES

**Why:** These features transform the task board from "a kanban" into "an AI workflow management system." Task dependencies, automation rules, and recurring tasks are what justify $350/mo over using Trello for free.

**Dependency chain:** Task templates must be built before recurring tasks (recurring tasks create from templates). Automation rules need working task state changes from Priority 2. Bulk operations need working drag/persistence from Priority 2.

### New Database Tables

- [x] **8.0a Create `mc_task_dependencies` table**
  ```sql
  CREATE TABLE mc_task_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id)
  );
  ```

- [x] **8.0b Create `mc_automation_rules` table**
  ```sql
  CREATE TABLE mc_automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'task_enters_column', 'task_priority_changes', 'agent_goes_offline', 'task_overdue'
    trigger_value TEXT, -- column_id for enters_column, priority value, etc.
    action_type TEXT NOT NULL, -- 'assign_agent', 'move_to_column', 'send_notification', 'create_task'
    action_value TEXT, -- agent_id, column_id, notification text, template_id
    is_enabled BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [x] **8.0c Create `mc_task_templates` table**
  ```sql
  CREATE TABLE mc_task_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    default_agent_id UUID,
    subtasks JSONB DEFAULT '[]', -- [{title: string, completed: boolean}]
    tags TEXT[] DEFAULT '{}',
    estimated_hours NUMERIC,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [x] **8.0d Create `mc_recurring_tasks` table**
  ```sql
  CREATE TABLE mc_recurring_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES mc_task_templates(id) ON DELETE CASCADE,
    schedule_type TEXT NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly', 'custom_cron'
    schedule_value TEXT NOT NULL, -- cron expression or interval description
    next_run_at TIMESTAMPTZ NOT NULL,
    last_run_at TIMESTAMPTZ,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

Add RLS policies to all tables (users can only access their own data).

### Features

- [x] **8.1 Task dependencies**
  API: `POST /api/mission-control/tasks/[id]/dependencies` — add dependency. `DELETE /api/mission-control/tasks/[id]/dependencies/[depId]` — remove. `GET` returns task's dependencies.
  Validation: prevent circular dependencies (A depends on B, B depends on A). Simple check: traverse the dependency chain, if you reach the source task → reject.
  UI: in task detail modal, "Dependencies" section. "Add dependency" button → task picker (search/select from existing tasks). Show list of dependencies with status (completed/in-progress). If any dependency is not in "Done" column → show lock icon on the task card + "Blocked by: Task #X, Task #Y" label. Prevent moving blocked tasks to "In Progress" (show toast: "Complete dependencies first").
  When a dependency completes → auto-check if dependent tasks are now unblocked → emit event.

- [x] **8.2 Automation rules**
  API: CRUD on `/api/mission-control/automation-rules`. Max 20 rules per user.
  Engine: create `src/lib/mc-automation.ts` with `evaluateRules(userId, trigger, context)`. Called after every task state change, agent status change, or on a schedule. When a trigger matches → execute the action → increment `run_count` → log as activity on the task.
  UI: new page or section in MC. Rule builder with dropdowns:
  - Trigger: "When a task enters [column dropdown]", "When a task priority changes to [priority dropdown]", "When an agent goes [status dropdown]", "When a task is overdue"
  - Action: "Assign agent [agent dropdown]", "Move to [column dropdown]", "Send notification [text input]", "Create task from [template dropdown]"
  Enable/disable toggle per rule. Show run count.

- [x] **8.3 Bulk operations**
  Add a selection mode to the task board:
  - Checkbox on each card (visible on hover desktop, always visible mobile)
  - "Select all in column" option in column header dropdown
  - When 1+ tasks selected, floating action bar appears at bottom of screen:
    - "Move to..." → column picker
    - "Assign to..." → agent picker
    - "Set priority..." → priority picker
    - "Delete selected" → confirmation dialog ("Delete X tasks? This cannot be undone.")
  - API: `POST /api/mission-control/tasks/bulk-action` accepts `{ task_ids: string[], action: "move"|"assign"|"priority"|"delete", value: string }`. Max 50 tasks per action.
  - Clear selection after action completes.

- [x] **8.4 Task templates**
  API: CRUD on `/api/mission-control/templates`. Max 20 templates per user.
  Pre-built templates (seeded for new Ultra users):
  - "Support Ticket" — priority: high, subtasks: [Triage request, Respond to user, Verify resolution], tags: [support]
  - "Research Task" — priority: medium, subtasks: [Search sources, Analyze findings, Write summary], tags: [research]
  - "Data Processing" — priority: medium, subtasks: [Fetch data, Transform/clean, Validate output, Store results], tags: [data]
  UI: in the create task dialog, add "Create from template" tab. Shows template cards with name, description, preview of subtasks. Click → pre-fills the create form. "Save as template" button in task detail modal (saves current task's config as a new template). Template management page: list, edit, delete templates.

- [x] **8.5 Recurring tasks**
  API: CRUD on `/api/mission-control/recurring-tasks`. Max 10 recurring tasks per user.
  Cron endpoint: `GET /api/cron/mc-recurring` — called on schedule (every 15 minutes via external cron or Vercel cron). Checks `mc_recurring_tasks` where `is_enabled = true AND next_run_at <= now()`. For each:
  1. Get the template
  2. Create a new task in the first column (Backlog) with template fields + auto-assign if template has `default_agent_id`
  3. Update `last_run_at = now()` and calculate `next_run_at` based on schedule
  UI: "Make recurring" toggle in task create/edit → shows schedule picker (every X hours/days/weeks + time picker). Recurring icon on task cards created by recurring rules. "Recurring Tasks" management section: list all, enable/disable, edit schedule, see last/next run.

---

## PRIORITY 9: ADDITIONAL VIEW MODES

**Why:** Multiple view modes make Mission Control feel like a premium, professional tool. Users can switch between Kanban (workflow), List (quick scan), Swimlane (per-agent workload), Calendar (deadlines), and Time Tracking (efficiency) based on what they need.

**Dependency:** Configurable columns from Priority 2 must be done first. Calendar needs working due dates (bug fix 1.1.10). Time tracking needs `started_at`/`completed_at` timestamps (bug fix 1.1.12 + Priority 2 task state management).

- [x] **9.1 Swimlane view**
  Third view mode (toggle: Kanban | List | Swimlane). Same columns (statuses) but rows are grouped by a selector:
  - Group by: Agent, Priority, Tag, or None
  - Each swimlane = a horizontal row with a label (agent name, priority level, tag name) and its own set of columns
  - Collapsible rows (click lane header to collapse/expand)
  - Task count per lane shown in header
  - Drag between swimlanes changes the grouping attribute (e.g., dragging from "Support Bot" lane to "Research Bot" lane changes `assigned_agent_id`)
  - Drag within a lane changes column (same as kanban)
  - Layout: CSS Grid with `grid-template-rows: auto` per swimlane, columns matching the kanban columns
  - Empty swimlanes hidden or shown with "No tasks" indicator

- [x] **9.2 Due date calendar view**
  Fourth view mode. Three sub-views: Month, Week, Day.
  - **Month view:** CSS Grid 7-column calendar. Each day cell shows task count + priority color dots. Click day → expands to show task list. Click task → opens detail modal.
  - **Week view:** 7-day columns with tasks shown as blocks. Time slots optional.
  - **Day view:** Single day with full task list sorted by priority.
  - Overdue tasks highlighted with red background
  - Today highlighted with accent border
  - Drag task between days → updates `due_date` via PATCH
  - Recurring task indicators (recurring icon on relevant dates)
  - Same filter bar as kanban (filter by agent, priority)
  - Can use `@fullcalendar/react` library or build a custom CSS Grid calendar

- [x] **9.3 Time tracking dashboard**
  New page: `/dashboard/mission-control/time-tracking` (or tab within MC).

  **Auto-tracking mechanism:** When a task moves to "In Progress", set `started_at = now()` if not already set. When a task moves to "Done", set `completed_at = now()`. Calculate `actual_hours = (completed_at - started_at) / 3600000`. This happens automatically in the task PATCH endpoint.

  **Dashboard sections:**
  1. **Summary cards:** Total tasks completed (this week), Avg completion time, On-time rate (% completed before due date), Efficiency score (avg actual/estimated %)
  2. **Estimated vs Actual table:** Per task: name, agent, estimated hours, actual hours, efficiency % (green >100% = faster, red <100% = slower). Sortable by any column. Paginated.
  3. **Per-agent performance chart:** Bar chart (Recharts) showing avg efficiency % per agent. Color: green >90%, yellow 70-90%, red <70%. Trend arrow showing change from previous period.
  4. **Trends chart:** Line chart (Recharts) over last 30 days. Lines: avg completion time, on-time rate %, tasks completed per day. Toggle each line on/off.
  5. **Insights panel:** Auto-generated text insights: "Support Bot is 15% faster than last week", "Research Bot averages 38% over estimated time — consider adjusting estimates", "Thursday is your busiest day with 12 tasks completed on average".

  API: `GET /api/mission-control/time-tracking?period=7d|30d|90d` — aggregates from `mc_tasks` where `completed_at IS NOT NULL`. Returns summary stats, per-task breakdown, per-agent breakdown, daily trend data.

---

## FEATURES TO REMOVE/SIMPLIFY

These are changes that REDUCE complexity. Do them as you encounter the relevant code — don't make a separate pass.

- [x] **Reduce default columns from 7 to 4-5**
  When creating default statuses (Priority 2), create only: Backlog, In Progress, Review, Done. Users can add more via the column manager. Don't create: Planning, Inbox, Assigned, Testing (the old 7-column set was confusing — "Planning" vs "Inbox" and "Assigned" vs "In Progress" were ambiguous).

- [x] **Simplify agent statuses from 6 to 4**
  Current: online, working, idle, blocked, sleeping, offline. Simplify to: Active (green — merges online+working), Idle (yellow — merges idle+sleeping), Error (red — replaces blocked), Offline (gray). Update the status config in overview and agent-roster components. Update the heartbeat API to accept only these 4 values.

- [x] **Replace "Send to Inbox" with "Move to..."**
  The "Send to Inbox" button is a special-case single-transition. Replace with a generic "Move to..." dropdown that lets users move a task to any column. Reuse the column/status picker from the configurable columns feature.

- [x] **Move acceptance criteria to task detail**
  The create task dialog currently has too many fields (title, description, priority, agent, due date, hours, tags, subtasks, acceptance criteria). Remove acceptance criteria from the create form. Move it to the task detail modal as an expandable section. Keep create form simple: title (required), priority, agent, due date.

- [x] **Make review approval enforcing**
  Currently, tasks can be moved to "Done" regardless of review status. Make it enforcing: if a task has reviews and none are "approved", prevent moving to "Done". Show toast: "This task needs an approved review before completion." Add a "Skip review" option for task owners.

- [x] **Move "Active Sessions" off overview**
  The overview currently shows "Active Sessions" with per-session detail. This is too granular for an executive overview. Replace with a simple count card: "Active Sessions: 3". The detail stays on the Sessions sub-page.

- [x] **Remove "error" as an event_type**
  Having both `event_type: "error"` and `severity: "error"` is confusing. An event can be `type: error, severity: warning` which makes no sense. Remove "error" from `event_type` enum. Use severity for error level. Use event_type for what happened (tool_invocation, task_complete, agent_state_change, session_start, session_end, webhook).

---

## UX IMPROVEMENTS

Apply these as you build each component. They're not separate tasks — integrate them into the relevant Priority work.

- [x] **Lead overview with alerts, not metrics**
  Reorder the overview layout. First section: "Needs Attention" — blocked agents, failed tasks, overdue tasks, errors in last hour. Second section: agent status cards. Third section: metrics. Users should see problems before stats.

- [x] **Add action buttons everywhere**
  Overview: "Deploy Agent", "Create Task", "View Logs". Agent cards: "Start", "Stop", "Restart". Session detail: "Retry", "View Events". Event cards: "View Session", "Filter by this agent". Nothing should be read-only.

- [x] **Delete confirmation dialog**
  Every delete action (task, template, rule, recurring task) must show a confirmation dialog: "Delete [name]? This cannot be undone." with Cancel + Delete buttons. Use shadcn `AlertDialog`.

- [x] **Loading skeletons for ALL components**
  Every component that fetches data must show a skeleton matching its layout while loading. Use shadcn `Skeleton`. The skeleton should have the same dimensions as the real content to prevent layout shift.

- [x] **Error states with retry for ALL components**
  Every component that fetches data must handle the error state. Show: red/amber icon + "Failed to load [X]" + "Try again" button that calls `refetch()`. Never show a blank space or crash on error.

- [x] **Drag target column highlighting**
  When dragging a card over a column, add a subtle highlight to the column: light border glow or background color change. Use `#2a2a2a` background or a faint primary color border. This gives visual feedback about where the card will drop.

- [x] **Ghost/overlay drag states**
  During drag: the source card becomes translucent (`opacity-30`), and the dragged overlay gets `ring-2 ring-primary shadow-lg`. This clearly shows what's being moved and where it came from.
  **Reference:** `kanban-reference/src/components/BoardColumn.tsx:58-69`, `TaskCard.tsx:53-60`

- [x] **Column auto-sizing**
  Replace fixed `w-[300px]` columns with CSS Grid `auto-cols-[minmax(200px,400px)]`. Columns adapt to available space. On narrow viewports, columns shrink to 200px minimum with horizontal scroll.
  **Reference:** `vibe-kanban/packages/ui/src/components/KanbanBoard.tsx:268`

- [x] **ARIA live announcements for drag**
  dnd-kit supports accessibility announcements. Add descriptive strings for every drag lifecycle event:
  - `onDragStart`: "Picked up task: [title]"
  - `onDragOver`: "Task [title] is over column [column name], position [N] of [total]"
  - `onDragEnd`: "Task [title] was dropped in column [column name]"
  - `onDragCancel`: "Dragging was cancelled. Task [title] was returned to its original position."
  **Reference:** `kanban-reference/src/components/KanbanBoard.tsx:139-232`

- [x] **"Last updated" indicator**
  In the MC header bar, show "Updated 3s ago" timestamp that ticks. Subtle pulse animation on values that recently changed (number counts up/down with a brief color flash). Reinforces the "live" feel.

- [x] **Per-column empty states**
  When a column has zero tasks, show a dashed border area with: "Drag tasks here" or a contextual message ("No tasks in progress — assign work from Backlog"). Don't just show an empty white space.

- [x] **Trace summary header**
  Before showing trace steps in the session detail, show a one-line summary: "12 steps · 3.8s total · All succeeded" or "8 steps · 12.1s total · 2 failed". This gives the headline before the details.

- [x] **Structured event payloads**
  Parse common event payload shapes into readable cards instead of raw JSON. Known shapes: tool invocations (show tool name, input, output), webhook events (show URL, status, latency), agent state changes (show old → new status). Unknown shapes: formatted JSON with syntax highlighting.

- [x] **View preferences in localStorage**
  Save user's view preferences to `localStorage`: active view mode (kanban/list/swimlane/calendar), column visibility, sort order, filter state, expanded/collapsed swimlanes. Restore on page load. Key: `mc-preferences-${userId}`.

---

## SECURITY/PERFORMANCE

Apply these throughout all work. They're requirements, not optional improvements.

- [x] **Rate limiting on all MC endpoints**
  Already covered in bug 1.6.1. Use `guardMCRoute()`.

- [x] **mc-route-guard.ts**
  Already covered in step 1.0. Shared auth + plan check + rate limit.

- [x] **Validate column_id and priority on writes**
  In task POST/PATCH: validate `column_id` is a valid UUID that belongs to the user (exists in `mc_task_statuses`). Validate `priority` is one of: low, medium, high, critical. Reject invalid values with 400.

- [x] **Verify task ownership on comments/reviews**
  In comments/reviews POST: first check the task's `user_id` matches the authenticated user. Don't allow adding comments to other users' tasks.

- [x] **Cap reorder array at 100**
  Already covered in bug 1.6.3.

- [x] **Max body size 50KB**
  Already covered in bug 1.6.2.

- [x] **Reduce polling when real-time connected**
  Already covered in Priority 3. When Supabase Realtime is connected: poll every 30s. When disconnected: poll every 5s. When tab hidden: stop polling.

- [x] **Virtualize long lists**
  Install `@tanstack/react-virtual`. Use for:
  - Task columns with 50+ items
  - Event feed list
  - Session list
  - Trace tree view
  - Activity timeline
  Reference: `langfuse/.../TraceTree.tsx` for virtualized tree pattern

- [x] **View preferences to localStorage**
  Already covered in UX section.

---

## FINAL CHECKLIST

Before marking Mission Control as complete:

- [x] Every page shows real data or proper empty states — ZERO mock data
- [x] Every API route uses `guardMCRoute()` (auth + Ultra plan + rate limit)
- [x] Every mutation has error handling with rollback + toast
- [x] Every component has loading skeleton + error state + empty state
- [x] Drag-drop persists to server via bulk-update API
- [x] Real-time updates work (Supabase Realtime or fallback)
- [x] No provider names visible anywhere (no Ollama, Hostinger, Blackbox, Supabase, Vercel)
- [x] No cost/token/usage data shown to users
- [x] Dark theme only — no light mode, no hardcoded colors
- [x] Design system colors/fonts match the locked spec
- [x] Mobile/touch works for all interactive elements
- [x] Keyboard shortcuts work for power users
- [x] `npx next build` passes with zero errors
- [x] All checkboxes in this file are checked

---

# PHASE 2: VPS DATA MIGRATION

**Status:** NEW — not started. All Phase 1 priorities (0-9) are complete. This is the next major work.

**Why:** User data should live on THEIR VPS, not in our Supabase. This is a privacy selling point ("Your data stays on YOUR server") AND saves Supabase storage costs. See section A11 above for the full data architecture.

**What changes:** MC events, sessions, activities, audit logs, analytics details, KB data, webhook delivery logs, and chat history move from Supabase to the user's VPS. A new HTTP service ("ClawHQ Data API" on port 5556) runs on each VPS to serve this data.

**What stays in Supabase:** MC tasks, agent_status, comments, reviews (real-time needed), auth, subscriptions, API keys, webhook configs, support tickets, daily analytics summary.

---

## PHASE 2.1: BUILD VPS DATA API SERVICE

**What:** A lightweight Node.js HTTP server running on each user's VPS at port 5556. Uses SQLite for local data storage. Serves JSON endpoints for all user-specific data. Secured with auth token.

**Architecture:**
```
User's Browser → ClawHQ Dashboard API (your server)
    ├── Real-time data → Supabase (tasks, agent status, comments, reviews)
    └── Historical data → User's VPS port 5556 (events, sessions, KB, audit, analytics)
                          User's VPS port 18789 (chat history via OpenClaw)
                          User's VPS port 5555 (embeddings)
```

- [x] **Create the Data API Node.js service**
  File structure on VPS:
  ```
  /opt/clawhq-data-api/
  ├── server.js          ← HTTP server (Express or Fastify)
  ├── db.js              ← SQLite connection + schema initialization
  ├── auth.js            ← Auth token middleware
  ├── routes/
  │   ├── events.js      ← GET/POST /api/events
  │   ├── sessions.js    ← GET/POST /api/sessions, GET/PATCH /api/sessions/:id
  │   ├── activities.js  ← GET /api/activities/:taskId
  │   ├── audit-log.js   ← GET/POST /api/audit-log
  │   ├── analytics.js   ← GET/POST /api/analytics
  │   ├── kb.js           ← GET/POST /api/kb/documents, GET /api/kb/search, POST /api/kb/chunks
  │   ├── deliveries.js  ← GET /api/webhook-deliveries/:webhookId
  │   └── health.js      ← GET /health
  ├── package.json
  └── data.db            ← SQLite database file (auto-created)
  ```

  Uses `better-sqlite3` for SQLite (synchronous, fast, no server process). Uses `express` for HTTP. All routes return JSON. All routes validate auth token.

- [x] **Define SQLite schema**
  On first startup, `db.js` creates all tables if they don't exist:

  ```sql
  -- MC Events (moved from Supabase mc_events)
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    agent_id TEXT,
    task_id TEXT,
    session_id TEXT,
    message TEXT,
    payload TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);

  -- MC Sessions (moved from Supabase mc_sessions)
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_id TEXT,
    task_id TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    duration_ms INTEGER,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    trace_data TEXT,
    metadata TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent_id);

  -- MC Activities (moved from Supabase mc_activities)
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL,
    actor TEXT,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_activities_task ON activities(task_id);

  -- Audit Logs (moved from Supabase audit_logs)
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    action TEXT NOT NULL,
    category TEXT,
    entity_type TEXT,
    entity_id TEXT,
    actor_type TEXT DEFAULT 'user',
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(category);

  -- Analytics (detailed per-message data, moved from Supabase agent_analytics)
  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_name TEXT,
    channel_type TEXT,
    response_time_ms INTEGER,
    message_date TEXT,
    hour INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(message_date);
  CREATE INDEX IF NOT EXISTS idx_analytics_agent ON analytics(agent_name);

  -- KB Documents (moved from Supabase kb_documents)
  CREATE TABLE IF NOT EXISTS kb_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER DEFAULT 0,
    content TEXT,
    status TEXT DEFAULT 'processing',
    chunk_count INTEGER DEFAULT 0,
    retrieval_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    indexed_at TEXT
  );

  -- KB Chunks (moved from Supabase kb_chunks)
  CREATE TABLE IF NOT EXISTS kb_chunks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    document_id TEXT NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    embedding BLOB,
    metadata TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_chunks_doc ON kb_chunks(document_id);

  -- Webhook Delivery Logs (moved from Supabase webhook_deliveries)
  CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    webhook_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    status_code INTEGER,
    response_body TEXT,
    latency_ms INTEGER,
    success INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
  CREATE INDEX IF NOT EXISTS idx_deliveries_retry ON webhook_deliveries(next_retry_at);
  ```

- [x] **Implement all API endpoints**
  Each endpoint: validate auth token → query SQLite → return JSON.

  | Method | Path | Query Params | Response |
  |--------|------|-------------|----------|
  | GET | `/api/events` | `type, severity, agent_id, from, to, search, limit, offset` | `{ events: [...], total }` |
  | POST | `/api/events` | — | `{ event: {...} }` |
  | GET | `/api/sessions` | `agent_id, status (active/completed/failed), limit, offset` | `{ sessions: [...], total }` |
  | POST | `/api/sessions` | — | `{ session: {...} }` |
  | GET | `/api/sessions/:id` | — | `{ session: {...full with trace_data} }` |
  | PATCH | `/api/sessions/:id` | — | `{ session: {...} }` |
  | GET | `/api/activities/:taskId` | `limit, offset` | `{ activities: [...], total }` |
  | POST | `/api/activities` | — | `{ activity: {...} }` |
  | GET | `/api/audit-log` | `category, search, from, to, limit, offset` | `{ logs: [...], total }` |
  | POST | `/api/audit-log` | — | `{ log: {...} }` |
  | GET | `/api/analytics` | `period (7d/14d/30d), agent` | `{ daily: [...], hourly: [...], by_agent: [...], summary: {...} }` |
  | POST | `/api/analytics` | — | `{ record: {...} }` |
  | GET | `/api/kb/documents` | `search, status` | `{ documents: [...] }` |
  | POST | `/api/kb/documents` | — | `{ document: {...} }` |
  | DELETE | `/api/kb/documents/:id` | — | `{ success: true }` |
  | GET | `/api/kb/search` | `q, limit` | `{ results: [{ content, document_name, relevance }] }` |
  | POST | `/api/kb/chunks` | — | `{ chunk: {...} }` |
  | GET | `/api/webhook-deliveries/:webhookId` | `limit, offset` | `{ deliveries: [...], total }` |
  | POST | `/api/webhook-deliveries` | — | `{ delivery: {...} }` |
  | GET | `/health` | — | `{ status: "ok", uptime, db_size_mb }` |

- [x] **Auth middleware**
  Every request must include `Authorization: Bearer <token>`. Token generated during provisioning: `crypto.randomBytes(32).toString('hex')`. Stored in `vps_instances.data_api_token` in Supabase. Reject with 401 if missing/invalid.

- [x] **Create systemd service file**
  ```ini
  [Unit]
  Description=ClawHQ Data API
  After=network.target

  [Service]
  Type=simple
  User=root
  WorkingDirectory=/opt/clawhq-data-api
  ExecStart=/usr/bin/node server.js
  Restart=always
  RestartSec=5
  Environment=PORT=5556
  Environment=DB_PATH=/opt/clawhq-data-api/data.db
  Environment=AUTH_TOKEN=<generated-during-provisioning>

  [Install]
  WantedBy=multi-user.target
  ```

---

## PHASE 2.2: ADD TO PROVISIONING

- [x] **Add provisioning step in `provision-v3.ts`**
  New step after embedding service (step 11):
  1. `mkdir -p /opt/clawhq-data-api/routes`
  2. Write all service files via SSH (base64 encoded — `server.js`, `db.js`, `auth.js`, all route files, `package.json`)
  3. `cd /opt/clawhq-data-api && npm install`
  4. Generate auth token: `crypto.randomBytes(32).toString('hex')`
  5. Create systemd service file with token in environment
  6. `systemctl daemon-reload && systemctl enable clawhq-data-api && systemctl start clawhq-data-api`
  7. Verify: `curl -H "Authorization: Bearer <token>" http://localhost:5556/health`
  8. Save token to `vps_instances.data_api_token` in Supabase

- [x] **Add `data_api_token` column to `vps_instances`**
  Migration: `ALTER TABLE vps_instances ADD COLUMN data_api_token TEXT;`

- [x] **For existing VPSes (already provisioned)**
  Create a one-time migration script / admin endpoint that SSHes into existing VPSes and installs the Data API service. This is needed for current users who were provisioned before this feature.

---

## PHASE 2.3: CREATE VPS DATA API HELPER

- [x] **Create `src/lib/vps-data-api.ts`**
  A helper function used by all dashboard API routes to call the user's VPS Data API:

  ```typescript
  import { createAdminClient } from "@/lib/supabase-admin";

  interface VPSDataAPIOptions {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
    timeout?: number; // ms, default 10000
  }

  export async function vpsDataFetch<T = unknown>(
    userId: string,
    path: string,
    options?: VPSDataAPIOptions
  ): Promise<T> {
    const supabase = createAdminClient();
    const { data: vps } = await supabase
      .from("vps_instances")
      .select("hostname, data_api_token, status")
      .eq("user_id", userId)
      .single();

    if (!vps) throw new Error("VPS not found");
    if (!vps.data_api_token) throw new Error("Data API not configured on VPS");
    if (vps.status !== "running") throw new Error("VPS is not running");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 10000);

    try {
      const response = await fetch(`https://${vps.hostname}:5556${path}`, {
        method: options?.method || "GET",
        headers: {
          "Authorization": `Bearer ${vps.data_api_token}`,
          "Content-Type": "application/json",
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text().catch(() => "Unknown error");
        throw new Error(`VPS Data API error ${response.status}: ${error}`);
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  ```

  **Caching:** Cache the VPS hostname + token lookup for 5 minutes to avoid hitting Supabase on every request. Use a simple `Map<string, { vps, expiresAt }>`.

---

## PHASE 2.4: MIGRATE DASHBOARD API ROUTES

For each data type, change the dashboard API route from Supabase to VPS Data API. Frontend stays the same — same response format.

**Pattern for each migration:**
```
BEFORE: const { data } = await supabase.from("mc_events").select(...).eq("user_id", user.id)
AFTER:  const data = await vpsDataFetch(user.id, "/api/events?type=...&limit=50")
```

For writes:
```
BEFORE: await supabase.from("mc_events").insert({ user_id: user.id, ... })
AFTER:  await vpsDataFetch(user.id, "/api/events", { method: "POST", body: { ... } })
```

- [x] **Migrate MC Events**
  `src/app/api/mission-control/events/route.ts`:
  - GET: `vpsDataFetch(user.id, "/api/events?...")` instead of Supabase
  - POST: `vpsDataFetch(user.id, "/api/events", { method: "POST", body })` instead of Supabase. ALSO broadcast via Supabase Realtime for SSE push if needed.

- [x] **Migrate MC Sessions**
  `src/app/api/mission-control/sessions/route.ts` + `sessions/[id]/route.ts`:
  - GET/POST/PATCH: all via VPS Data API

- [x] **Migrate MC Activities**
  `src/app/api/mission-control/tasks/[id]/activities/route.ts`:
  - GET: from VPS Data API
  - POST (created by task state changes): write to VPS Data API

- [x] **Migrate Audit Log**
  `src/app/api/audit-log/route.ts`:
  - GET: from VPS Data API
  `src/lib/audit-log.ts` (`logAudit()` function):
  - Write: to VPS Data API instead of Supabase admin client
  - Note: `logAudit()` is called from MANY routes (KB, webhooks, API keys, agents, etc.). The change in this one function migrates all audit writes.

- [x] **Migrate Webhook Delivery Logs**
  `src/lib/webhook-dispatch.ts`:
  - Insert delivery records: to VPS Data API
  `src/app/api/webhooks/[id]/deliveries/route.ts`:
  - GET: from VPS Data API
  `src/app/api/cron/webhook-retry/route.ts`:
  - Read pending retries: from VPS Data API
  - Update retry status: to VPS Data API

- [x] **Migrate Analytics (detailed data only)**
  `src/app/api/analytics/usage/route.ts`:
  - Detailed charts (daily, hourly, by-agent): from VPS Data API
  - Keep daily summary ping to Supabase (1 row/user/day for ClawHQ business metrics)
  `src/app/api/chat/send/route.ts` (where analytics are recorded):
  - Write analytics record: to VPS Data API (instead of `agent_analytics` Supabase table)
  - ALSO write daily summary to Supabase: increment `analytics_daily_summary` table (new table, 1 row per user per day with total_messages count)

- [x] **Migrate KB Data**
  All `src/app/api/knowledge-base/*` routes:
  - Documents CRUD: to/from VPS Data API
  - Chunks: to/from VPS Data API
  - Search: via VPS Data API (which calls the embedding service on 5555 internally for vector search)
  - Upload: file content sent to VPS Data API for storage + chunking + embedding
  `src/lib/knowledge-base.ts`:
  - `indexDocument()`: write chunks to VPS Data API
  - `searchKBChunks()`: query VPS Data API search endpoint
  - `embedChunks()`: still calls embedding service on 5555 directly (or via Data API as proxy)

- [x] **Migrate Chat History**
  `src/app/api/chat/messages/route.ts`:
  - Read: from OpenClaw API on port 18789 (OpenClaw already stores conversations internally)
  - OR from VPS Data API if we add a chat history table
  `src/app/api/v1/conversations/route.ts` + `[id]/messages/route.ts`:
  - Same: read from OpenClaw or VPS Data API

---

## PHASE 2.5: TICKET AUTO-DELETE

- [x] **Create cron endpoint `GET /api/cron/cleanup-tickets`**
  Query `support_tickets` where `status = 'resolved' AND resolved_at < now() - interval '48 hours'`.
  Delete the ticket AND all `ticket_messages` for that ticket.
  Run every hour via external cron or Vercel cron.

- [x] **Add `resolved_at` column to support_tickets**
  Migration: `ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMPTZ;`
  Set `resolved_at = now()` when ticket status changes to "resolved" (in the resolve API route).

---

## PHASE 2.6: CREATE DAILY ANALYTICS SUMMARY TABLE

- [x] **Create `analytics_daily_summary` table in Supabase**
  ```sql
  CREATE TABLE analytics_daily_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    total_messages INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
  );
  ```
  One row per user per day. Incremented on every message send. This is the ONLY analytics data in Supabase — for ClawHQ admin business metrics.

---

## PHASE 2.7: CLEANUP

- [x] **Remove migrated Supabase tables**
  After verifying all data flows through VPS Data API:
  - Drop `mc_events` table (data now on VPS)
  - Drop `mc_sessions` table (data now on VPS)
  - Drop `mc_activities` table (data now on VPS)
  - Drop `audit_logs` table (data now on VPS)
  - Drop `agent_analytics` table (replaced by VPS + daily summary)
  - Drop `kb_documents` table (data now on VPS)
  - Drop `kb_chunks` table (data now on VPS)
  - Drop `webhook_deliveries` table (data now on VPS)
  **DO NOT drop until verified.** Keep tables for 2 weeks as backup before final deletion.

- [x] **Remove old Supabase queries from codebase**
  Search for any remaining `supabase.from("mc_events")`, `supabase.from("mc_sessions")`, etc. and remove/replace.

- [x] **Update `next build`**
  Ensure build passes with all migrations. No broken imports referencing removed tables.

---

## PHASE 2 FINAL CHECKLIST

- [x] VPS Data API running on port 5556 on all user VPSes
- [x] Auth token generated and stored in `vps_instances.data_api_token`
- [x] All migrated data flows through VPS Data API, not Supabase
- [x] MC tasks/agent_status/comments/reviews still in Supabase (real-time)
- [x] Daily analytics summary in Supabase (business metrics)
- [x] Support tickets auto-delete 48hrs after resolved
- [x] Frontend unchanged — same UI, same features, just different backend
- [x] `npx next build` passes
- [x] No provider names exposed
- [x] Old Supabase tables dropped after 2-week verification period
