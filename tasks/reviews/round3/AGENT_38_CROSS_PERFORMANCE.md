# Agent 38 — Cross-Cutting — Performance Engineer Review
**Total Issues Found: 18**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 7 / LOW: 3

---

### [PERF-01] — In-memory rate limiter never records hits (completely broken)
**File:** `src/lib/rate-limit.ts:74-82`
**Severity:** CRITICAL
**Description:** The synchronous `rateLimit()` function calls `getRateLimitStatus()` which filters existing timestamps but never pushes a new timestamp into the `store` Map. No call to `store.set()` or `store.get().push()` exists for recording new requests. As a result, `remaining` is always equal to `limit`, and `success` is always `true`. Every rate-limited route using `rateLimit()` (audit-log, analytics, logs/alerts, mc-route-guard, and many others) has zero rate limiting.
**Impact:** All endpoints using the synchronous `rateLimit()` function are completely unprotected from abuse. An attacker can send unlimited requests. This affects ~20+ API routes.
**Recommendation:** Add a timestamp recording step:
```ts
export function rateLimit(identifier, limit, windowMs = 60_000) {
  cleanup(windowMs);
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = store.get(identifier) || [];
  const valid = timestamps.filter(t => t > windowStart);
  if (valid.length >= limit) {
    return { success: false, remaining: 0 };
  }
  valid.push(now);
  store.set(identifier, valid);
  return { success: true, remaining: limit - valid.length };
}
```

---

### [PERF-02] — Landing page is entirely client-rendered ("use client" at root)
**File:** `src/app/page.tsx:1`
**Severity:** CRITICAL
**Description:** The landing page root component has `"use client"` at the top, making the entire page a client-side rendered SPA. On top of this, below-fold sections use `dynamic(() => import(...), { ssr: false })`, meaning they are excluded from SSR and only load after JavaScript executes. Search engines and users with slow connections see an empty page until the JS bundle fully loads and executes.
**Impact:** Poor SEO (Google sees an empty shell), poor Largest Contentful Paint (LCP), poor First Contentful Paint (FCP). The landing page is the primary marketing surface and the first impression for all visitors.
**Recommendation:** Remove `"use client"` from `page.tsx`. Make it a Server Component. Import Hero/Navbar/Footer statically (they can remain client components). Keep `dynamic` imports for below-fold sections but with `ssr: true` (the default) so they are server-rendered but code-split for JS bundle.

---

### [PERF-03] — SSH connection opened and closed per every operation (no pooling)
**File:** `src/lib/ssh.ts:10-20, 56-82, 84-134, 136-194, 196-250, 253-318`
**Severity:** CRITICAL
**Description:** Every exported function in `ssh.ts` creates a brand new SSH connection via `connect()`, performs its work, then disposes of it. SSH handshake involves TCP connect + key exchange + authentication, typically 200-800ms per connection. The `getProcessStatus()` function alone opens a connection, runs `detectRuntime()` (1-2 commands), then `findSystemdService()` (1-2 commands), then the actual status check — all sequential over one connection, but the connection itself is new every call. For monitoring dashboards that poll every few seconds, this creates enormous latency overhead.
**Impact:** Each VPS status check or management operation adds 200-800ms of SSH handshake overhead. Monitoring endpoints that poll frequently create many short-lived connections, potentially hitting VPS connection limits.
**Recommendation:** Implement SSH connection pooling with TTL-based eviction:
```ts
const pool = new Map<string, { ssh: NodeSSH; lastUsed: number }>();
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

---

### [PERF-04] — Cron route processes model changes sequentially with SSH per user
**File:** `src/app/api/cron/apply-pending-changes/route.ts:33-150`
**Severity:** HIGH
**Description:** The `apply-pending-changes` cron endpoint iterates over all pending model changes in a sequential `for` loop. For each change, it makes 3-4 DB queries (model info, VPS info, API keys, user email) and then opens an SSH connection to push config. With 10 pending changes, this could take 10+ seconds purely from SSH handshakes, plus query latency.
**Impact:** Cron execution time grows linearly with pending changes. With `maxDuration: 300`, it can handle ~30-50 changes before timing out. DB queries within the loop are also sequential when they could be batched.
**Recommendation:** Batch all DB queries upfront (fetch all model info, all VPS info, all API keys in parallel queries), then process SSH operations with controlled concurrency (e.g., `Promise.allSettled` with a concurrency limit of 5).

---

### [PERF-05] — Analytics funnels route fetches all messages without pagination
**File:** `src/app/api/analytics/funnels/route.ts:38-42`
**Severity:** HIGH
**Description:** The funnels endpoint fetches ALL `chat_messages` for up to 200 conversations using `.in("conversation_id", convIds)` with no `.limit()`. A user with 200 conversations averaging 20 messages each would fetch 4,000 rows, and the entire result set is processed in-memory. Over 90 days with active users, this could be 10,000+ rows.
**Impact:** Memory spikes for active users, slow response times (potentially seconds), risk of hitting Supabase response size limits.
**Recommendation:** Use a database-level aggregation. Either add an RPC function that returns message counts grouped by conversation_id, or use `.select("conversation_id", { count: "exact", head: true })` pattern grouped per conversation. Alternatively, maintain a denormalized `message_count` column on `chat_conversations`.

---

### [PERF-06] — Usage analytics route fetches all rows to client for aggregation
**File:** `src/app/api/v1/usage/route.ts:16-19`
**Severity:** HIGH
**Description:** The usage endpoint fetches ALL `agent_analytics` rows for the given API key within a date range, then aggregates them in JavaScript (grouping by date, computing averages). For a busy API key over 90 days, this could be thousands or tens of thousands of rows transferred from the database just to compute daily aggregates.
**Impact:** Excessive data transfer from DB, high memory usage on the serverless function, slow response for active keys.
**Recommendation:** Push aggregation to the database with a Supabase RPC function or SQL view that returns pre-aggregated daily stats (date, count, error_count, avg_response_time).

---

### [PERF-07] — Google Fonts loaded via blocking @import in CSS
**File:** `src/app/globals.css:1`
**Severity:** HIGH
**Description:** Three font families (DM Sans, Instrument Serif, JetBrains Mono) are loaded via a single `@import url(...)` at the top of `globals.css`. CSS `@import` is render-blocking — the browser must fetch the external CSS from Google Fonts before it can render any content. The `display=swap` parameter helps with font rendering, but the CSS file itself still blocks.
**Impact:** Adds 100-300ms to First Contentful Paint depending on network conditions. Three font families means a larger CSS file and more font files to download.
**Recommendation:** Move font loading to `next/font` (Google Fonts integration) in `layout.tsx`, which automatically self-hosts fonts and eliminates the external request:
```ts
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
```
Or at minimum, use `<link rel="preconnect">` and `<link rel="preload">` in the document head.

---

### [PERF-08] — Duplicate Supabase auth calls in Hero and Navbar on landing page
**File:** `src/components/landing/Hero.tsx:19-25`, `src/components/landing/Navbar.tsx:91-97`
**Severity:** HIGH
**Description:** Both the Hero and Navbar components independently create a Supabase browser client and call `supabase.auth.getUser()` on mount. This results in two identical network requests to Supabase Auth on every landing page load, just to check if the user is logged in.
**Impact:** Two redundant auth round-trips (~100-200ms each) on every landing page visit. Doubles the auth API load.
**Recommendation:** Lift the auth check to a shared context provider or the page component level. Pass the user state down via props or React context. Alternatively, use a shared hook with React Query or SWR for deduplication.

---

### [PERF-09] — framer-motion imported in 20 landing page components (bundle bloat)
**File:** `src/components/landing/*.tsx` (20 files)
**Severity:** MEDIUM
**Description:** Every landing page component imports from `framer-motion`. While tree-shaking helps, framer-motion's core runtime (~30-40KB gzipped) is included in the client bundle. Combined with the `"use client"` root page, this entire bundle must download and execute before any landing page content is visible.
**Impact:** Adds ~30-40KB gzipped to the landing page JS bundle. Combined with `ssr: false` dynamic imports, below-fold sections are invisible until the full framer-motion bundle loads.
**Recommendation:** Consider using CSS animations or the lighter `motion` package (framer-motion's tree-shakeable subset). For scroll-triggered animations, CSS `@starting-style` + `IntersectionObserver` with CSS transitions can replace most `whileInView` uses with zero JS cost.

---

### [PERF-10] — Pricing section embeds a full iframe for dashboard preview
**File:** `src/components/landing/Pricing.tsx:281-288`
**Severity:** MEDIUM
**Description:** The Pricing component renders an `<iframe>` pointing to `/dashboard-demo?plan=${previewPlan}`. This iframe loads a full Next.js page inside the landing page, including its own JS bundles, CSS, and React hydration. When the user switches plans, a new iframe is created (note `key={previewPlan}`), triggering a full page load each time.
**Impact:** Each plan switch triggers a full page load in the iframe. The initial iframe load adds significant weight to the landing page (likely 200KB+ of additional JS/CSS). Three plan switches = three full page loads.
**Recommendation:** Replace the iframe with a static mockup component (similar to what Hero already does with its dashboard preview). If interactivity is needed, render the dashboard demo as a React component directly within the page.

---

### [PERF-11] — `.select("*")` used extensively across API routes (over-fetching)
**File:** Multiple files (see grep output — 30+ occurrences)
**Severity:** MEDIUM
**Description:** At least 30 API routes use `.select("*")` when querying Supabase. Notable examples include `admin/customers/[id]/full/route.ts` (7 occurrences in one file), `knowledge-base/route.ts`, `webhooks/route.ts`, `onboarding/route.ts`, `payments/verify/route.ts`, and `logs/alerts/route.ts`. This fetches all columns from each table, including potentially large text/JSON columns that the client doesn't need.
**Impact:** Increased data transfer from DB, larger JSON responses, higher memory usage per request. For tables with large `metadata`, `payload`, or `content` columns, this can be significant.
**Recommendation:** Replace `.select("*")` with explicit column lists for all routes, especially those returning lists. Keep `"*"` only for admin detail views where all columns are genuinely needed.

---

### [PERF-12] — Repeated auth + subscription check pattern (2 DB queries per request)
**File:** `src/lib/mc-route-guard.ts:30-44`, `src/app/api/audit-log/route.ts:8-24`, `src/app/api/analytics/funnels/route.ts:9-16`, `src/app/api/logs/alerts/route.ts:9-16`
**Severity:** MEDIUM
**Description:** Nearly every protected route performs: (1) `supabase.auth.getUser()` — one DB call, (2) `.from("subscriptions").select("plan").eq("user_id", user.id).single()` — a second DB call. These two queries are sequential and add ~30-60ms combined to every request. The pattern is repeated identically in `mc-route-guard.ts`, `audit-log/route.ts`, `analytics/funnels`, `analytics/paths`, `logs/alerts`, and many others.
**Impact:** Every authenticated route pays a fixed 30-60ms tax for the plan lookup, even when the plan was already checked moments ago.
**Recommendation:** Either (a) embed the plan in a JWT claim so it's available without a DB round-trip, (b) cache the subscription status in-memory with a short TTL (e.g., 60s), or (c) create a unified middleware that extracts user + plan in one pass and attaches to the request context.

---

### [PERF-13] — Batch chat processing awaits full completion before responding
**File:** `src/app/api/v1/chat/batch/route.ts:90`
**Severity:** MEDIUM
**Description:** The batch endpoint calls `await processBatch(...)` on line 90, meaning the HTTP response is held open until ALL batch items (up to 50) have been processed sequentially (3 at a time). Each item involves an HTTP request to the VPS with a 60-second timeout. In the worst case, 50 items at 3 concurrency = ~17 rounds, with potential 60s timeouts each.
**Impact:** Client receives no response until all items complete. Even successful batches with 50 items will take many seconds. The `maxDuration: 300` (5 minutes) is the safety net, but it means the client is waiting up to 5 minutes for a response.
**Recommendation:** Return the batch ID immediately after creating the DB record, then process in the background. The client can poll `/api/v1/chat/batch/[id]` for status. This is already partially designed this way (the batch record has a status field) but the `await` blocks the response.

---

### [PERF-14] — Features component injects CSS via inline `<style>` tag on every render
**File:** `src/components/landing/Features.tsx:275-326`
**Severity:** MEDIUM
**Description:** The Features component renders a `<style>` block containing ~50 lines of CSS (keyframe animations, hover states) directly in JSX. This CSS is injected into the DOM on every render and is not deduplicated or cached by Next.js's CSS pipeline.
**Impact:** CSS is re-parsed by the browser on each render. The animations CSS (~1.5KB) bypasses the CSS optimization pipeline (minification, deduplication, caching). If this component re-renders, the style block is re-injected.
**Recommendation:** Move these styles to `globals.css` or a CSS module. CSS keyframe animations and hover states belong in stylesheets, not inline `<style>` tags in components.

---

### [PERF-15] — ChannelBar quadruples its items array for marquee animation
**File:** `src/components/landing/ChannelBar.tsx:19`
**Severity:** LOW
**Description:** `const items = [...channels, ...channels, ...channels, ...channels]` creates an array of 28 items (7 channels x 4) for the marquee animation. Each item renders a React element with an icon component.
**Impact:** 28 React elements rendered when 14 (2x) would suffice for a seamless CSS marquee loop. Minor memory and reconciliation overhead.
**Recommendation:** Use CSS `animation-iteration-count: infinite` with only 2x duplication instead of 4x. Or use a pure CSS marquee without duplicating DOM elements.

---

### [PERF-16] — Admin customer full detail fetches 11 parallel queries including unbounded selects
**File:** `src/app/api/admin/customers/[id]/full/route.ts:50-105`
**Severity:** MEDIUM
**Description:** The customer detail endpoint fires 11 parallel Supabase queries for a single customer. While parallel execution is good, several queries use `.select("*")` with no `.limit()` — notably `channels`, `webhooks`, `api_keys`, and `user_agents`. For a customer with many records, this could return large payloads.
**Impact:** 11 concurrent DB queries per request. While parallel, this creates connection pressure on Supabase. Unbounded selects on `channels`, `webhooks`, `api_keys` could grow over time.
**Recommendation:** Add `.limit()` to unbounded selects. Replace `.select("*")` with explicit column lists. Consider combining related queries (e.g., subscription + model) into a single RPC call.

---

### [PERF-17] — No `Cache-Control` headers on any API response
**File:** All API routes under `src/app/api/`
**Severity:** LOW
**Description:** No API routes set `Cache-Control` headers on responses. Read-only endpoints like `GET /api/v1/models`, `GET /api/v1/health`, and analytics endpoints could benefit from short-lived caching (e.g., `max-age=60` or `stale-while-revalidate`).
**Impact:** Every request hits the server even for data that changes infrequently (model list, health status, plan info). CDN/browser caching is not utilized.
**Recommendation:** Add `Cache-Control: public, max-age=60, stale-while-revalidate=300` to read-only endpoints. Add `Cache-Control: private, no-cache` explicitly to user-specific endpoints to prevent CDN caching of private data.

---

### [PERF-18] — next.config.ts missing image optimization configuration
**File:** `next.config.ts`
**Severity:** LOW
**Description:** The Next.js config does not configure `images` (remotePatterns, formats, deviceSizes). The landing page uses `<Image>` from `next/image` in the Navbar, but no WebP/AVIF optimization is configured. OG images reference `/logo-full.jpeg` which may not be optimized.
**Impact:** Images are served in their original format without automatic optimization. No AVIF/WebP conversion means larger image payloads.
**Recommendation:** Add image optimization config:
```ts
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
},
```
