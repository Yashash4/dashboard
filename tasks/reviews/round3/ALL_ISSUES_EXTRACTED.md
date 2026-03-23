# ALL ISSUES EXTRACTED — Round 3 Consolidated from 40 Review Files

**Generated:** 2026-03-22
**Source files:** 40 review reports across 8 areas
**Total unique issues:** 189 (after dedup)
**Breakdown:** 22 CRITICAL, 48 HIGH, 74 MEDIUM, 45 LOW

---

## AREA: CROSS

Cross-cutting issues found by multiple agents. These are listed here once and not repeated in area-specific sections.

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [x] | CROSS_CRIT_01 | `src/lib/rate-limit.ts:74-82` | **In-memory rate limiter never records hits — rate limiting is completely non-functional.** `rateLimit()` calls `getRateLimitStatus()` which reads timestamps from the `store` Map, but neither function ever calls `store.set()` to record new requests. Every call returns `success: true`. All 40+ API routes using `rateLimit()` have zero rate limiting. | Agent 01 (QA-22 related), Agent 02 (ST_B_CRIT_01), Agent 04 (ST_S_CRIT_01), Agent 06 (QA-01), Agent 07 (PRO_B_CRIT_01), Agent 09 (PRO_S_CRIT_01), Agent 22 (U-C1), Agent 24 (C-01), Agent 31 (QA-01), Agent 32 (C1), Agent 34 (C1), Agent 35 (UX-01), Agent 36 (CROSS-08), Agent 37 (H-08), Agent 38 (PERF-01), Agent 39 (C2), Agent 40 (ARCH-05) |
| [ ] | CROSS_CRIT_02 | `src/app/docs/billing/page.tsx:54` | **Billing docs claim Mission Control available on Pro tier; code enforces Ultra-only.** `mc-route-guard.ts:48` requires `hasAccess(plan, "ultra")`, sidebar gates MC to Ultra+, landing Pricing.tsx shows MC as `false` for Pro. Billing docs say "Yes" for Pro. | Agent 21 (QA-02), Agent 23 (FE-01), Agent 25 (UX-04), Agent 26 (QA-15), Agent 36 (CROSS-01) |
| [ ] | CROSS_CRIT_03 | `src/app/docs/billing/page.tsx:56`, `src/app/docs/plans/page.tsx:75,144,158` | **VPS storage values in docs contradict plans.ts.** Pro: docs say 200GB, plans.ts says 400GB. Ultra: docs say 400GB, plans.ts says 800GB. | Agent 21 (QA-03), Agent 23 (FE-02, FE-10), Agent 25 (UX-05), Agent 26 (QA-03), Agent 27 (H3, H4), Agent 36 (CROSS-02, CROSS-03) |
| [ ] | CROSS_CRIT_04 | Multiple landing components, dashboard components, docs pages | **Hardcoded colors violate the 60-30-10 design system rule.** Dozens of components use hardcoded Tailwind colors (`text-yellow-500`, `bg-green-600`, `text-red-500`, `bg-zinc-900`, `text-white`, `#ffe0c2`, `#161616`, etc.) instead of CSS variables from `globals.css`. | Agent 03 (FE-23, FE-24), Agent 05 (UX-12), Agent 08 (FE-09, FE-10, FE-11), Agent 10 (UX-10), Agent 13 (FE-05, FE-06), Agent 15 (UX-12, UX-13), Agent 16 (QA-06, QA-07, QA-08), Agent 18 (FE-01, FE-02, FE-03), Agent 20 (UX-04, UX-16, UX-17), Agent 23 (FE-04, FE-05, FE-06), Agent 25 (UX-01, UX-14), Agent 28 (FE-01 through FE-05), Agent 30 (UX-11), Agent 39 (M6, L1) |
| [ ] | CROSS_CRIT_05 | `src/app/page.tsx:10-15` | **SSR disabled for 6 landing page sections — zero server-rendered HTML for most of the page.** Features, Pricing, HowItWorks, Comparison, FAQ, and CTA all use `dynamic(() => import(...), { ssr: false })`. Search engines see only Hero + Navbar + ChannelBar + Footer. | Agent 16 (QA-05), Agent 17 (C2), Agent 18 (FE-04), Agent 20 (UX-01), Agent 38 (PERF-02) |
| [ ] | CROSS_CRIT_06 | `src/app/page.tsx:1` | **Landing page root is "use client" — destroys SSR for the entire page.** Combined with `ssr: false` dynamic imports, the landing page is entirely client-rendered. No page-level metadata can be exported. | Agent 17 (C1, H3), Agent 38 (PERF-02) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | CROSS_HIGH_01 | `src/app/docs/billing/page.tsx:44` | **Billing docs annual pricing does not match plans.ts calculations.** Starter shown as $50/mo (actual $49.92), Pro as $110/mo (actual $108.25), Ultra as $298/mo (actual $291.58). | Agent 21 (QA-04), Agent 23 (FE-03), Agent 25 (UX-06), Agent 26 (QA-07), Agent 27 (H2), Agent 36 (CROSS-04) |
| [ ] | CROSS_HIGH_02 | `src/app/docs/billing/page.tsx:47-53` | **Billing docs advertise tier-based limits (KB docs, messages, webhooks, audit retention) with no enforcement in code.** Starter shown with 50 KB docs, 5000 messages, 2 webhooks, 7-day audit — none enforced. Also claims Starter has "Basic" API/KB access but code blocks Starter entirely. | Agent 08 (FE-14), Agent 10 (UX-05 through UX-09), Agent 21 (QA-05, QA-09), Agent 23 (FE-14), Agent 26 (QA-04, QA-06, QA-13, QA-14), Agent 27 (M4, L1), Agent 36 (CROSS-05, CROSS-09) |
| [ ] | CROSS_HIGH_03 | `src/app/docs/billing/page.tsx:51`, `src/lib/payments/plans.ts:28` | **Billing docs say Starter has "No" custom domain; plans.ts says "Custom domain + auto-SSL".** | Agent 21 (QA-06), Agent 25 (UX-07), Agent 26 (QA-05), Agent 36 (CROSS-06) |
| [ ] | CROSS_HIGH_04 | `src/components/landing/Pricing.tsx:119`, `src/lib/v1-auth.ts:117` | **Rate limits not differentiated by tier despite comparison table claiming 1x/5x/10x/25x.** No code applies tier-multiplied rate limits. Ultra users get same limits as Pro. | Agent 21 (QA-01, QA-08), Agent 22 (U-H1, U-H2, U-H4), Agent 24 (H-02), Agent 36 (CROSS-07) |
| [ ] | CROSS_HIGH_05 | `src/app/globals.css:1` | **Render-blocking external Google Fonts via @import in CSS.** Three font families loaded via `@import url(...)` blocking render. Should use `next/font`. | Agent 17 (H1), Agent 38 (PERF-07) |
| [ ] | CROSS_HIGH_06 | `src/components/landing/Hero.tsx:20-24`, `src/components/landing/Navbar.tsx:92-97` | **Duplicate Supabase auth checks on landing page.** Both Hero and Navbar independently create Supabase clients and call `getUser()` on mount — two redundant network requests. | Agent 17 (H2), Agent 18 (FE-05), Agent 20 (UX-19), Agent 38 (PERF-08) |
| [ ] | CROSS_HIGH_07 | `src/app/api/v1/usage/route.ts:16-19` | **Unbounded query fetches ALL analytics rows into memory.** No `.limit()` on query. For high-traffic keys over 90 days, could return millions of rows causing OOM. | Agent 07 (PRO_B_HIGH_06), Agent 31 (QA-17), Agent 32 (H1), Agent 34 (H4), Agent 37 (C-04), Agent 38 (PERF-06) |
| [ ] | CROSS_HIGH_08 | `src/app/api/v1/chat/batch/route.ts:90` | **Batch POST blocks until all requests complete, then returns stale "processing" status.** `await processBatch()` blocks the response. Client receives misleading `status: "processing", completed: 0` after batch is already done. | Agent 06 (QA-04), Agent 07 (PRO_B_CRIT_02), Agent 31 (QA-02), Agent 32 (C2), Agent 33 (FE-12), Agent 35 (UX-16), Agent 38 (PERF-13) |
| [ ] | CROSS_HIGH_09 | `src/app/api/v1/predictions/route.ts:7-44` | **Predictions endpoint creates records but has no processing pipeline.** Status remains "pending" forever. Dead-end API. | Agent 06 (QA-17), Agent 07 (PRO_B_HIGH_09), Agent 31 (QA-03), Agent 32 (M2), Agent 33 (FE-13), Agent 35 (UX-12) |
| [ ] | CROSS_HIGH_10 | `src/app/docs/pro/api/page.tsx:155-156` | **Chat API docs code examples read `data.reply` but actual response field is `data.response`.** | Agent 06 (QA-14 partial), Agent 27 (C3), Agent 33 (FE-01), Agent 35 (UX-05) |
| [ ] | CROSS_HIGH_11 | `src/app/docs/pro/api/page.tsx:134-137` | **SSE streaming format in docs does not match actual API.** Docs show `{"chunk": "...", "done": false}` but actual sends `{"content": "..."}` with `data: [DONE]` termination. | Agent 06 (QA-14), Agent 27 (H1), Agent 33 (FE-02), Agent 35 (UX-06) |
| [ ] | CROSS_HIGH_12 | `src/lib/payments/plans.ts:93-97` | **`PLAN_PRICES` missing enterprise entry, causing silent lookup failures.** Admin subscription editor has different enterprise annual price ($9,999) vs plans.ts ($0). | Agent 06 (QA-16), Agent 08 (FE-12), Agent 21 (QA-07), Agent 22 (U-M2), Agent 23 (FE-13) |
| [x] | CROSS_HIGH_13 | `src/app/api/admin/customers/bulk/route.ts:41-44` | **Bulk suspend updates DB status to "stopped" but never SSHes into VPS to actually stop processes.** VPS continues running. | Agent 11 (QA-09), Agent 12 (H-02), Agent 37 (M-01) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | CROSS_MED_01 | `src/app/api/v1/threads/[id]/messages/route.ts:86-101` | **Thread messages POST includes the just-inserted user message in history, sending duplicate to model.** | Agent 06 (QA-18), Agent 07 (PRO_B_MED_02, PRO_B_MED_03) |
| [ ] | CROSS_MED_02 | `src/components/landing/Pricing.tsx:282-288` | **Pricing section embeds iframe for dashboard preview — reloads on plan switch, no loading state.** Each plan switch creates a new iframe via `key={previewPlan}`. | Agent 16 (QA-10), Agent 17 (M1), Agent 18 (FE-15), Agent 20 (UX-03), Agent 38 (PERF-10) |
| [ ] | CROSS_MED_03 | `src/components/landing/Features.tsx:275-326` | **Inline `<style>` tag with CSS animations re-injected on every render.** ~50 lines of CSS keyframes. Should be in globals.css. | Agent 17 (M2), Agent 18 (FE-07), Agent 19 (M-5), Agent 38 (PERF-14) |
| [ ] | CROSS_MED_04 | `src/app/providers.tsx:8` | **QueryClient instantiated at module scope — shared across requests in SSR.** Data leakage risk between users. | Agent 17 (M3), Agent 40 (ARCH-04) |
| [ ] | CROSS_MED_05 | `src/app/api/keys/route.ts:55-72` | **API key stats fetch pulls all `agent_analytics` rows into memory instead of using COUNT.** Three unbounded queries for counting. | Agent 02 (ST_B_HIGH_04), Agent 07 (PRO_B_HIGH_05), Agent 37 (H-01) |
| [ ] | CROSS_MED_06 | `src/components/landing/Pricing.tsx:9-100` | **Landing Pricing duplicates all plan data instead of importing from plans.ts.** Feature lists and taglines differ between the two. | Agent 23 (FE-08), Agent 36 (CROSS-13, CROSS-12, CROSS-14) |
| [ ] | CROSS_MED_07 | `src/components/dashboard/upgrade-prompt.tsx:19-27` | **Upgrade prompt features list inconsistent with plans.ts.** Lists features like "RBAC workspaces", "5x credits" that don't exist in plans.ts. | Agent 25 (UX-10), Agent 36 (CROSS-11) |
| [ ] | CROSS_MED_08 | `next.config.ts:6-30` | **No Content-Security-Policy header configured.** Application has no CSP, leaving it vulnerable to XSS. | Agent 19 (H-1), Agent 40 (ARCH-11) |
| [ ] | CROSS_MED_09 | `src/components/docs/docs-header.tsx:7-11`, `src/components/docs/docs-sidebar.tsx:20-24` | **Docs nav only lists 3 of 30+ doc pages.** Most docs pages are unreachable from header/sidebar navigation. | Agent 26 (QA-10), Agent 28 (FE-16), Agent 30 (UX-02) |
| [ ] | CROSS_MED_10 | `src/app/docs/api/agents/page.tsx:227`, `src/app/docs/api/models/page.tsx:221` | **Mislabeled "Next Steps" links: "Conversations & Threads" and "Usage API" both point to Webhooks page.** | Agent 10 (UX-18), Agent 26 (QA-01, QA-02), Agent 27 (L2), Agent 30 (UX-13) |
| [ ] | CROSS_MED_11 | `src/lib/v1-auth.ts:121` | **V1 API auth uses in-memory rate limiter instead of durable `rateLimitAsync()`.** On serverless, rate limits reset on cold start. | Agent 29 (H3), Agent 34 (H1), Agent 40 (ARCH-05) |
| [ ] | CROSS_MED_12 | `src/app/docs/billing/page.tsx:98` | **Billing docs downgrade example says Starter allows 1 agent; plans.ts says Unlimited.** | Agent 10 (UX-06), Agent 26 (QA-04) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | CROSS_LOW_01 | `src/components/landing/ChannelBar.tsx:19` | **Marquee 4x duplication unnecessary; 2x sufficient for -50% translateX.** 28 DOM nodes instead of 14. | Agent 16 (QA-11), Agent 18 (FE-13), Agent 20 (UX-26), Agent 38 (PERF-15) |
| [ ] | CROSS_LOW_02 | `src/app/api/v1/conversations/route.ts:5` | **JSDoc says "cursor-based pagination" but implementation is offset-based.** Also in threads and conversation messages. | Agent 31 (QA-06), Agent 32 (L1), Agent 33 (FE-07), Agent 35 (UX-11) |
| [ ] | CROSS_LOW_03 | `src/lib/payments/plans.ts:76` | **Enterprise plan `annualUsd: 0` is misleading.** Could show "$0.00/yr" if `contactUs` guard is bypassed. | Agent 01 (QA-11), Agent 10 (UX-22) |

---

## AREA: STARTER

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [x] | ST_CRIT_01 | `src/lib/ssh.ts:863` | **OS command injection via dashboard password in `updateDashboardPassword()`.** Only single-quote escaping; should use base64 encoding. | Agent 04 (ST_S_CRIT_02) |
| [ ] | ST_CRIT_02 | Multiple API routes | **`decryptField()` called on potentially null `ssh_password`.** If field is null (e.g., during provisioning), runtime error crashes the route. | Agent 01 (QA-22) |
| [ ] | ST_CRIT_03 | `src/app/api/vps/password/route.ts:11` | **No CSRF protection on GET endpoint returning sensitive VPS password.** A malicious page could exfiltrate the password via `fetch` with credentials. | Agent 01 (QA-21) |
| [x] | ST_CRIT_04 | `src/app/api/payments/verify/route.ts:96-129` | **Payment fulfillment not idempotent — replaying verified payment can duplicate subscriptions.** No status filter on order lookup; no unique constraint on `razorpay_payment_id`. | Agent 02 (ST_B_CRIT_02), Agent 37 (C-02, C-03) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [x] | ST_HIGH_01 | `src/app/api/vps/restart/route.ts:51-57` | **VPS restart sets status to "running" immediately after API call, before VM finishes restarting.** | Agent 01 (QA-05), Agent 02 (ST_B_CRIT_03) |
| [ ] | ST_HIGH_02 | `src/app/api/channels/health/route.ts:87-88` | **JSON comment stripping regex corrupts URLs containing `//`.** Config parse fails, all channels show "unknown" health. | Agent 01 (QA-09) |
| [ ] | ST_HIGH_03 | `src/components/dashboard/ticket-list.tsx:127-128` | **"Load More" calls non-existent `/api/tickets/list` endpoint.** Fails silently; users can never load more than 20 tickets. | Agent 01 (QA-13) |
| [ ] | ST_HIGH_04 | `src/app/api/vps/password/route.ts:37-41` | **Plaintext VPS dashboard password returned via GET on every page load.** Visible in DevTools network tab. | Agent 01 (QA-20), Agent 02 (ST_B_MED_02) |
| [ ] | ST_HIGH_05 | `src/app/api/chat/stream/route.ts:133-184` | **Streaming response runs DB insert in detached async IIFE with no error propagation.** Messages can be silently lost. | Agent 02 (ST_B_HIGH_01) |
| [ ] | ST_HIGH_06 | `src/app/api/chat/stream/route.ts:24-32` | **No message length validation in streaming chat endpoint.** Unlike `chat/send` (10K cap). | Agent 02 (ST_B_HIGH_02) |
| [ ] | ST_HIGH_07 | `src/app/api/account/delete/route.ts:66-142` | **Account deletion uses `Promise.allSettled` — partial failures leave orphaned data with no notification.** Also missing many tables from cleanup. | Agent 02 (ST_B_HIGH_03), Agent 37 (H-03, H-04) |
| [x] | ST_HIGH_08 | `src/app/api/cron/apply-pending-changes/route.ts:97-116` | **Cron job reads API keys from `user_api_keys` but doesn't call `decryptField()`.** Either keys are plaintext (security gap) or encrypted (broken). | Agent 02 (ST_B_HIGH_05) |
| [ ] | ST_HIGH_09 | `src/app/api/vps/logs/stream/route.ts:83-88` | **SSE log stream 30-minute maxDurationTimer never cleared on close.** Fires on already-closed controller. | Agent 02 (ST_B_HIGH_06) |
| [ ] | ST_HIGH_10 | `src/lib/ssh.ts:412-414` | **Heredoc delimiter injection in agent deploy.** If file content contains `AGENTEOF`, heredoc terminates early and remaining content executes as shell commands. | Agent 04 (ST_S_HIGH_01) |
| [ ] | ST_HIGH_11 | `src/app/api/knowledge-base/url/route.ts:55` | **SSRF via DNS rebinding.** `isPrivateUrl()` checks hostname string only; domains resolving to 127.0.0.1 bypass the check. | Agent 04 (ST_S_HIGH_03) |
| [ ] | ST_HIGH_12 | 8 dashboard pages | **Pages return `null` instead of redirecting unauthenticated users.** Blank white page if layout check fails. | Agent 01 (QA-01) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ST_MED_01 | `src/app/api/cron/apply-pending-changes/route.ts:118-125` | **Failed SSH changes retried infinitely on every cron run.** No retry limit or backoff. | Agent 01 (QA-17) |
| [ ] | ST_MED_02 | `src/app/api/channels/health/route.ts:128-136` | **Channel health check runs pgrep for every channel sequentially.** Same check repeated N times. | Agent 01 (QA-08) |
| [ ] | ST_MED_03 | `src/app/api/models/change/route.ts:92-106` | **Billing cycle calculation assumes monthly only.** Annual subscribers' change counters never reset. | Agent 02 (ST_B_MED_05) |
| [ ] | ST_MED_04 | `src/app/api/cron/cleanup-tickets/route.ts:17-21` | **Ticket cleanup OR condition can delete recently-resolved tickets.** Should check `resolved_at` only. | Agent 02 (ST_B_MED_06) |
| [ ] | ST_MED_05 | `src/lib/idempotency.ts:40-47` | **`storeIdempotency()` silently swallows upsert errors.** Failed cache writes make idempotency ineffective. | Agent 02 (ST_B_MED_07), Agent 37 (M-09) |
| [ ] | ST_MED_06 | `src/middleware.ts:33-35` | **Auth bypass when Supabase env vars missing.** All routes become public. | Agent 04 (ST_S_MED_02) |
| [ ] | ST_MED_07 | `src/app/api/account/password/route.ts:46-62` | **Password verification creates real Supabase session; signOut may fail leaving stale session.** | Agent 01 (QA-18), Agent 04 (ST_S_MED_04) |
| [ ] | ST_MED_08 | `src/app/api/tickets/attachment/route.ts:122` | **Storing signed URL (1-hour expiry) in DB is pointless.** No endpoint to regenerate. | Agent 02 (ST_B_MED_04) |
| [ ] | ST_MED_09 | `src/app/dashboard/openclaw/page.tsx:118-124` | **Decrypted VPS password serialized to client HTML via server component props.** | Agent 01 (QA-15) |
| [ ] | ST_MED_10 | `src/app/api/chat/send/route.ts:297` | **SSRF via DB-stored dashboard URL.** Not validated for private IPs at fetch time. | Agent 04 (ST_S_MED_05) |
| [ ] | ST_MED_11 | `src/app/api/cron/apply-pending-changes/route.ts:143-148` | **SSH error details leaked in cron response.** Internal IPs, hostnames, and stack traces. | Agent 04 (ST_S_MED_06), Agent 07 (PRO_B_HIGH_10), Agent 09 (PRO_S_CRIT_02) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ST_LOW_01 | `src/app/api/vps/scheduled-restart/route.ts:53`, `src/app/api/keys/route.ts:125`, `src/app/api/webhooks/[id]/route.ts:50` | **Multiple POST/PATCH handlers don't wrap `request.json()` in try-catch.** Malformed JSON causes unhandled 500. | Agent 02 (ST_B_LOW_01, ST_B_LOW_04, ST_B_LOW_05), Agent 04 (ST_S_MED_01) |
| [ ] | ST_LOW_02 | `src/app/api/chat/send/route.ts:388-393` | **RAG evaluation insert is fire-and-forget with silent error handler.** Analytics data silently lost. | Agent 02 (ST_B_LOW_03) |
| [ ] | ST_LOW_03 | `src/app/api/audit-log/route.ts:53-57` | **Partial ilike injection in PostgREST `.or()` filter syntax.** | Agent 04 (ST_S_LOW_01), Agent 09 (PRO_S_MED_07) |
| [ ] | ST_LOW_04 | `src/app/api/vps/password/route.ts:71` | **No password complexity requirements.** Only 8-char minimum. | Agent 04 (ST_S_HIGH_04), Agent 19 (M-1), Agent 29 (M4) |
| [ ] | ST_LOW_05 | `src/app/dashboard/chat/page.tsx:92` | **Chat page `absolute inset-0` breaks parent layout flow.** May clip on mobile. | Agent 01 (QA-02), Agent 03 (FE-04), Agent 05 (UX-19) |

---

## AREA: PRO

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | PRO_CRIT_01 | `src/app/docs/pro/api/page.tsx:226-229` | **Docs show wrong error response format.** Docs: flat `{"error": "...", "code": "RATE_LIMITED"}`. Actual: nested `{"error": {"code": "rate_limited", ...}}`. | Agent 33 (FE-03), Agent 35 (UX-03) |
| [ ] | PRO_CRIT_02 | `src/app/dashboard-demo/layout.tsx:20`, `src/app/dashboard-demo/[[...slug]]/page.tsx:668` | **Missing Suspense boundary for useSearchParams in dashboard-demo.** Next.js 15 requires Suspense around `useSearchParams` consumers. Build failure or runtime crash. | Agent 08 (FE-01, FE-02) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | PRO_HIGH_01 | `src/app/api/mission-control/tasks/route.ts:8`, `src/types/mission-control.ts:30` | **Task priority enum mismatch: route accepts "urgent" but type says "critical", queue sorts by "critical".** | Agent 06 (QA-06), Agent 07 (PRO_B_LOW_02) |
| [ ] | PRO_HIGH_02 | `src/app/api/mission-control/tasks/bulk-action/route.ts:29` | **Bulk delete uses hard DELETE while single-task delete uses soft delete.** Data integrity mismatch. | Agent 06 (QA-09), Agent 07 (PRO_B_CRIT_03), Agent 24 (L-02) |
| [ ] | PRO_HIGH_03 | `src/app/api/mission-control/tasks/bulk-action/route.ts:31-46` | **Bulk "move" and "priority" actions accept any value without validation against whitelists.** | Agent 06 (QA-07, QA-08), Agent 07 (PRO_B_CRIT_04), Agent 09 (PRO_S_HIGH_03) |
| [ ] | PRO_HIGH_04 | `src/app/api/v1/files/route.ts:161` | **`indexDocument()` fire-and-forget with empty catch — file stuck in "processing" forever on error.** | Agent 07 (PRO_B_HIGH_01) |
| [ ] | PRO_HIGH_05 | `src/app/api/analytics/funnels/route.ts:38-47` | **Fetches ALL messages for up to 200 conversations with no `.limit()`.** Tens of thousands of rows. | Agent 07 (PRO_B_HIGH_04), Agent 37 (H-02), Agent 38 (PERF-05) |
| [ ] | PRO_HIGH_06 | `src/app/api/mission-control/tasks/[id]/dependencies/route.ts:60-81` | **Circular dependency check performs N+1 queries — one DB call per graph node.** | Agent 07 (PRO_B_HIGH_03), Agent 37 (H-05) |
| [ ] | PRO_HIGH_07 | `src/app/api/mission-control/tasks/reorder/route.ts:75-86` | **Reorder fires up to 100 concurrent UPDATE queries via `Promise.all()`.** Can overwhelm DB connection pool. | Agent 07 (PRO_B_HIGH_07), Agent 37 (M-05) |
| [ ] | PRO_HIGH_08 | `src/app/api/v1/chat/batch/route.ts:214-236` | **DNS rebinding SSRF on batch webhook callback.** URL validated at submission but fetched minutes later. | Agent 09 (PRO_S_HIGH_05), Agent 34 (H2) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | PRO_MED_01 | `src/app/api/mission-control/tasks/bulk-action/route.ts:10` | **Bulk action JSON parse can throw unhandled error.** No try-catch on `request.json()`. | Agent 06 (QA-10) |
| [ ] | PRO_MED_02 | `src/app/api/v1/chat/batch/route.ts:123` | **Batch fails silently when `dashboardUrl` is null — stays in "processing" forever.** | Agent 06 (QA-05), Agent 31 (QA-13), Agent 32 (M5) |
| [ ] | PRO_MED_03 | `src/app/api/analytics/funnels/route.ts:22` | **Funnels route does not validate negative "days" param.** Negative values compute future date, returning empty results. | Agent 06 (QA-13), Agent 09 (PRO_S_LOW_04) |
| [ ] | PRO_MED_04 | `src/lib/mc-route-guard.ts:70-78` | **Body size check only validates Content-Length header, not actual body.** Comment says post-parse validation but never implemented. | Agent 07 (PRO_B_MED_12), Agent 09 (PRO_S_HIGH_02), Agent 24 (H-03) |
| [ ] | PRO_MED_05 | `src/app/api/mission-control/automation-rules/[id]/route.ts:14-20` | **PATCH handler doesn't validate `trigger_type` or `action_type` against whitelist.** POST validates but update does not. | Agent 07 (PRO_B_MED_06) |
| [ ] | PRO_MED_06 | `src/app/api/v1/agents/[id]/route.ts:18-21` | **Agent detail endpoint doesn't filter by `deployed` status.** Returns agent info even if not deployed. | Agent 07 (PRO_B_MED_08) |
| [ ] | PRO_MED_07 | `src/app/api/v1/threads/[id]/messages/route.ts:58-187` | **Thread messages POST has no content moderation unlike chat endpoint.** Bypasses content policy. | Agent 31 (QA-04), Agent 34 (H3) |
| [ ] | PRO_MED_08 | `src/app/api/v1/chat/route.ts:117-124` | **Default agent selection is non-deterministic.** No `.order()` clause with `.limit(1).single()`. | Agent 31 (QA-12), Agent 32 (H2) |
| [ ] | PRO_MED_09 | `src/app/api/v1/files/route.ts:131-134` | **File upload continues and returns success even when storage upload fails.** DB record points to non-existent file. | Agent 31 (QA-08), Agent 32 (C3) |
| [ ] | PRO_MED_10 | `src/app/api/v1/files/route.ts:142-163` | **File upload missing text extraction for PDF files.** PDF accepted but never indexed; stays "processing" until marked failed. | Agent 31 (QA-09) |
| [ ] | PRO_MED_11 | `src/app/api/v1/chat/route.ts:227` | **Fetch timeout not cleared on abort.** Timer fires again against already-aborted controller. | Agent 32 (M1) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | PRO_LOW_01 | `src/lib/api-errors.ts:58` | **Revoked API key returns 401 instead of 403.** Should be "authorized but forbidden", not "unauthenticated". | Agent 06 (QA-03) |
| [ ] | PRO_LOW_02 | `src/app/api/v1/audit-log/route.ts:34-35` | **Unsanitized `from`/`to` date parameters passed directly to query.** Invalid strings cause Supabase errors. | Agent 07 (PRO_B_LOW_05), Agent 32 (M3), Agent 34 (M1) |
| [ ] | PRO_LOW_03 | `src/app/api/v1/health/route.ts:24-25` | **Health endpoint reveals API key name and rate limit configuration.** | Agent 09 (PRO_S_LOW_02), Agent 34 (L1) |

---

## AREA: ADMIN

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ADMIN_CRIT_01 | `src/components/dashboard/admin-customer-detail.tsx:387` | **Broken useState destructuring — all VPS action buttons permanently disabled.** `const [checkPendingRef = { current: false }, setActionLoading]` creates broken variable; JSX uses assignment expressions instead of comparisons. | Agent 11 (QA-01), Agent 13 (FE-01, FE-02), Agent 15 (UX-05) |
| [ ] | ADMIN_CRIT_02 | `src/lib/provision-v3.ts:180,246,313` | **Command injection via subdomain in provisioning pipeline.** Subdomain from admin input interpolated directly into shell commands, nginx config, and SSL cert generation without validation. | Agent 11 (QA-05), Agent 12 (H-05), Agent 14 (C-01) |
| [x] | ADMIN_CRIT_03 | `src/lib/provision-v3.ts:467-468` | **Data API token generated during provisioning but never saved to database.** Token is lost immediately; Data API is deployed with unusable auth. | Agent 12 (C-01) |
| [x] | ADMIN_CRIT_04 | `src/app/api/admin/provision/route.ts:287-303` | **No error handling on DB save after successful provisioning.** If DB write fails, VPS is provisioned but platform has no record. | Agent 12 (C-02), Agent 37 (C-01) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ADMIN_HIGH_01 | `src/app/admin/page.tsx:54` | **MRR calculation queries missing `billing_cycle` column.** Annual subscriptions counted at full annual price, inflating MRR. | Agent 11 (QA-02), Agent 13 (FE-10) |
| [ ] | ADMIN_HIGH_02 | `src/lib/provision-store.ts:61-66` | **`getActiveJob()` TOCTOU race — concurrent POST requests can create duplicate orphaned jobs.** | Agent 11 (QA-08), Agent 12 (L-01) |
| [ ] | ADMIN_HIGH_03 | `src/app/api/admin/customers/[id]/full/route.ts:127-148` | **Decrypted SSH and dashboard passwords returned in API response.** XSS or session hijack exposes all customer credentials. | Agent 14 (C-03) |
| [ ] | ADMIN_HIGH_04 | `src/app/api/admin/*` | **No rate limiting on any admin API endpoint.** Stolen admin session allows unlimited provisioning, credential access, bulk operations. | Agent 14 (H-01) |
| [ ] | ADMIN_HIGH_05 | `src/middleware.ts:84-96` | **Middleware does not enforce admin role on `/api/admin/*` routes.** Only checks authentication, not role. Deferred to individual handlers. | Agent 14 (H-03) |
| [ ] | ADMIN_HIGH_06 | `src/lib/credential-utils.ts:24-26` | **Encryption silently disabled when env var missing.** `encryptField()` returns plaintext with no warning when `CREDENTIAL_ENCRYPTION_KEY` not set. | Agent 14 (H-05) |
| [ ] | ADMIN_HIGH_07 | `src/app/api/admin/api-keys/route.ts:89` | **Customer API keys stored in plaintext in database.** Not encrypted with `encryptField()` unlike SSH passwords. | Agent 12 (M-03), Agent 14 (M-05) |
| [ ] | ADMIN_HIGH_08 | `src/components/dashboard/admin-customers.tsx:144-166` | **No confirmation dialog for bulk suspend/activate.** Accidental misclick can suspend dozens of customers. | Agent 15 (UX-01) |
| [ ] | ADMIN_HIGH_09 | `src/components/dashboard/admin-api-keys.tsx:124-149` | **API key deletion has no confirmation dialog.** Deleting configured key causes immediate service disruption. | Agent 15 (UX-02) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ADMIN_MED_01 | `src/app/api/admin/tickets/[id]/route.ts:87`, `src/components/dashboard/admin-ticket-thread.tsx:131` | **Ticket reply response missing `messageId` — client falls back to random UUID.** Potential duplicates on re-fetch. | Agent 11 (QA-04), Agent 13 (FE-14) |
| [ ] | ADMIN_MED_02 | `src/app/admin/page.tsx:36-66` | **Admin overview has no error handling for 14 parallel Supabase queries.** Silently shows zeros on failure. | Agent 11 (QA-10), Agent 13 (FE-08) |
| [ ] | ADMIN_MED_03 | `src/app/api/admin/api-keys/route.ts:233-247` | **Failed SSH config push after key deletion silently ignored.** Key removed from DB but VPS still has old key. | Agent 11 (QA-13), Agent 12 (M-04) |
| [ ] | ADMIN_MED_04 | `src/lib/provision-v3.ts:361` | **Dashboard username from user-controlled name field in htpasswd command.** Shell metacharacters possible. | Agent 14 (C-02) |
| [ ] | ADMIN_MED_05 | `src/lib/provision-v3.ts:417` | **Embedded service listens on 0.0.0.0:5555 without authentication.** If firewall misconfigured, anyone can send embedding requests. | Agent 14 (M-03) |
| [ ] | ADMIN_MED_06 | `src/components/dashboard/admin-customer-detail.tsx` | **Component is ~1180 lines with 12+ state variables.** Extremely difficult to maintain. | Agent 13 (FE-09) |
| [ ] | ADMIN_MED_07 | `src/app/api/admin/provision/route.ts:43` | **Multiple admin routes don't wrap `request.json()` in try-catch.** | Agent 12 (H-03) |
| [ ] | ADMIN_MED_08 | `src/components/dashboard/admin-customers.tsx:185` | **CSV export doesn't escape commas or quotes in customer data.** Double quotes break CSV parsing. | Agent 11 (QA-11), Agent 13 (FE-20) |
| [ ] | ADMIN_MED_09 | `src/app/api/admin/provision/route.ts:43-59` | **Provision route POST does not validate `sshPort` type/range.** Port 0 silently becomes 22. | Agent 11 (QA-14) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ADMIN_LOW_01 | `src/components/dashboard/admin-api-keys.tsx:77-79`, `src/components/dashboard/admin-dashboard-auth.tsx:36-38` | **`useEffect` missing dependency — `fetchKeys`/`fetchCredentials` not in dep array.** | Agent 11 (QA-12), Agent 13 (FE-03, FE-04) |
| [ ] | ADMIN_LOW_02 | Multiple admin components | **Missing aria-labels on icon-only buttons.** Delete, clear selection, auto-restart buttons unlabeled. | Agent 13 (FE-18), Agent 15 (UX-14, UX-15) |
| [ ] | ADMIN_LOW_03 | `src/components/dashboard/admin-customers.tsx:339-342` | **Select-all checkbox does not indicate indeterminate state.** | Agent 15 (UX-18) |
| [ ] | ADMIN_LOW_04 | `src/components/dashboard/admin-audit-logs.tsx:128-192` | **Audit logs table not responsive on mobile — no overflow-x-auto wrapper.** | Agent 13 (FE-11), Agent 15 (UX-07) |

---

## AREA: LANDING

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | LAND_CRIT_01 | `src/app/page.tsx:1-37` | **4 landing page components (ProductTour, Stats, WhyClawHQ, BeforeAfter) never rendered.** ~40% of content invisible. | Agent 16 (QA-01), Agent 20 (UX-23) |
| [ ] | LAND_CRIT_02 | `src/components/landing/Hero.tsx:87` | **"See it in action" CTA links to `#product-tour` which is not rendered on page.** Dead anchor link. | Agent 16 (QA-02), Agent 20 (UX-02) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | LAND_HIGH_01 | `src/components/landing/Footer.tsx:24` | **Footer "Product Tour" link points to non-existent `#product-tour`.** | Agent 16 (QA-03) |
| [ ] | LAND_HIGH_02 | `src/components/landing/Features.tsx:234-252` | **Pro and Ultra feature grids defined but never rendered.** Only Starter features displayed; key selling points hidden. | Agent 16 (QA-04), Agent 20 (UX-23) |
| [ ] | LAND_HIGH_03 | `src/components/landing/Navbar.tsx:230-271` | **Mobile menu does not trap focus or handle Escape key.** Users can tab behind overlay. | Agent 18 (FE-11), Agent 20 (UX-09) |
| [ ] | LAND_HIGH_04 | `src/components/landing/CTA.tsx:43`, `src/app/pricing/page.tsx:285` | **Inconsistent money-back guarantee: 14-day vs 7-day.** Direct contradiction in trust signal. | Agent 20 (UX-12) |
| [ ] | LAND_HIGH_05 | `src/components/landing/Features.tsx:262-271` | **IntersectionObserver toggles `inView` both ways — animations restart on scroll.** Should be one-way flag. | Agent 18 (FE-14) |
| [ ] | LAND_HIGH_06 | `src/app/sitemap.ts:4-29` | **Sitemap missing `/pricing` and `/register` pages.** Key conversion pages not indexed. | Agent 17 (H4) |
| [ ] | LAND_HIGH_07 | `src/components/landing/Navbar.tsx:127-139` | **Navbar dropdowns lack aria-expanded, aria-haspopup. Only open on hover, not keyboard accessible.** | Agent 20 (UX-07, UX-08) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | LAND_MED_01 | `src/app/register/page.tsx:108,149,166` | **Register page uses hardcoded background colors instead of CSS variables.** `bg-[#111111]`, `bg-[#191919]`, `bg-[#222222]`. | Agent 16 (QA-08), Agent 19 (L-4), Agent 20 (UX-17) |
| [ ] | LAND_MED_02 | `src/components/landing/Navbar.tsx:240-253` | **Mobile menu uses plain `<a href>` for internal routes, causing full page reload instead of client-side navigation.** | Agent 16 (QA-12) |
| [ ] | LAND_MED_03 | `src/components/landing/FAQ.tsx:61` | **FAQ toggle buttons missing `aria-expanded` attribute.** Screen readers cannot determine open/close state. | Agent 18 (FE-09) |
| [ ] | LAND_MED_04 | `src/app/register/page.tsx:68-91` | **Registration form has no rate limiting or CAPTCHA.** Mass account creation possible. | Agent 19 (H-2) |
| [ ] | LAND_MED_05 | `src/app/register/page.tsx:97-100` | **OAuth redirect URL uses `window.location.origin` instead of env var.** | Agent 19 (L-3) |
| [ ] | LAND_MED_06 | `src/components/landing/CTA.tsx:36` | **"Book a Demo" uses mailto link instead of proper booking flow.** Users without mail client see nothing. | Agent 20 (UX-28) |
| [ ] | LAND_MED_07 | `src/components/landing/Comparison.tsx:74` | **Comparison section lacks `id` anchor — cannot be deep-linked.** | Agent 20 (UX-21) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | LAND_LOW_01 | `src/components/landing/FAQ.tsx:65` | **FAQ `max-h-96` (384px) may clip long answers on mobile.** | Agent 16 (QA-14), Agent 18 (FE-08) |
| [ ] | LAND_LOW_02 | `src/components/landing/Footer.tsx:39` | **OpenClaw GitHub link may be a dead 404 if URL is incorrect.** | Agent 16 (QA-16) |
| [ ] | LAND_LOW_03 | `src/components/landing/Navbar.tsx:5` | **Navbar imports 20 lucide icons but only uses ~3 in rendering.** Bundle bloat. | Agent 17 (L1) |
| [ ] | LAND_LOW_04 | `src/components/landing/Footer.tsx:58-68` | **Footer mixes auth links (Log in, Sign up) in "Legal" column.** | Agent 20 (UX-25) |

---

## AREA: ULTRA

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [x] | ULTRA_CRIT_01 | `src/app/api/payments/create-order/route.ts:29-86` | **Client controls both `amount` and `metadata.plan` for subscription orders — no server-side price validation.** User can pay $1 and get Ultra activated. | Agent 24 (C-02) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ULTRA_HIGH_01 | `src/components/dashboard/billing-overview.tsx:349-374` | **No downgrade button or cancellation flow on billing page.** Ultra users at $350/mo cannot self-serve downgrade or cancel. | Agent 25 (UX-02) |
| [ ] | ULTRA_HIGH_02 | `src/lib/tier.ts:34-35` | **Ultra badge color in sidebar uses hardcoded violet instead of `--tier-ultra` (warm amber).** Wrong color identity for the $350/mo tier. | Agent 23 (FE-04), Agent 25 (UX-01) |
| [ ] | ULTRA_HIGH_03 | `src/app/pricing/page.tsx:173-193` | **Ultra card on pricing page has no visual distinction from Starter.** $350/mo plan looks identical to $59/mo plan. | Agent 23 (FE-07), Agent 25 (UX-08) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ULTRA_MED_01 | `src/app/api/payments/verify/route.ts:151-196` | **No `subscription_downgrade` case in payment fulfillment.** MC data and automation rules persist after downgrade. | Agent 22 (U-M3) |
| [ ] | ULTRA_MED_02 | `src/app/api/mission-control/stream/route.ts:8-27` | **MC stream route duplicates auth/tier logic instead of using `guardMCRoute`.** Maintenance risk. | Agent 22 (U-M4) |
| [ ] | ULTRA_MED_03 | `src/app/dashboard-demo/page.tsx:27-28` | **Dashboard demo hardcodes Pro plan data regardless of `?plan=ultra` param.** Misleading Ultra preview. | Agent 23 (FE-12) |
| [ ] | ULTRA_MED_04 | `src/components/dashboard/billing-overview.tsx:67-131` | **Billing overview duplicates plan data with different Ultra features than plans.ts.** Third distinct feature list. | Agent 23 (FE-09) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ULTRA_LOW_01 | `src/components/landing/Pricing.tsx:65-66` | **Landing page plan CTAs link to `/pricing` without plan preselection param.** Users must re-locate their plan. | Agent 21 (QA-11), Agent 25 (UX-09) |

---

## AREA: DOCS

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | DOCS_CRIT_01 | `src/app/docs/api/agents/page.tsx:25-58` | **Agents endpoint docs say "no query parameters" but actual route supports `limit`, `offset` pagination. Response schema also omits `has_more` and `total` fields.** | Agent 27 (C1, C2) |
| [ ] | DOCS_CRIT_02 | `src/app/docs/layout.tsx:32-40` | **Right sidebar "On this page" TOC is a non-functional placeholder.** Empty column takes up 192px of screen width. | Agent 30 (UX-01) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | DOCS_HIGH_01 | `src/app/docs/support/page.tsx:111-113,189-196` | **Support docs: auto-close vs auto-delete contradiction.** One section says "Auto-Closed", another says "automatically deleted". | Agent 26 (QA-09) |
| [ ] | DOCS_HIGH_02 | `src/app/docs/account/page.tsx:234`, `src/app/docs/channels/page.tsx:227`, `src/app/docs/billing/page.tsx:205` | **Docs link to `/dashboard/*` authenticated routes instead of staying within `/docs/`.** | Agent 26 (QA-08), Agent 30 (UX-14) |
| [ ] | DOCS_HIGH_03 | `src/app/docs/api/agents/page.tsx:35-38` | **Documented agent `id` uses `agt_` prefix but actual implementation returns raw `agent_id`.** | Agent 27 (H5) |
| [ ] | DOCS_HIGH_04 | `src/components/docs/knowledge-base-docs.tsx:31-46` | **Docs instruct users to pass raw session cookies in cURL commands.** Encourages insecure cookie handling. | Agent 29 (C1) |
| [ ] | DOCS_HIGH_05 | `src/app/docs/vps/page.tsx:90-93` | **VPS docs disclose internal service ports (5555, 5556) and service names.** Reconnaissance advantage for attackers. | Agent 29 (H1) |
| [ ] | DOCS_HIGH_06 | `src/components/docs/docs-nav.tsx:158-165` | **Mobile nav button overlaps page content — no header bar, below minimum touch target.** | Agent 30 (UX-03) |
| [ ] | DOCS_HIGH_07 | `src/app/docs/analytics/page.tsx`, `src/app/docs/knowledge-base/page.tsx`, `src/app/docs/monitoring/page.tsx` | **Three docs pages are thin stubs with minimal content — unnecessary navigation hops.** | Agent 30 (UX-04) |
| [ ] | DOCS_HIGH_08 | `src/app/docs/billing/page.tsx:32-58`, multiple doc pages | **Tables in docs lack horizontal scroll wrapper — overflow on mobile.** | Agent 28 (FE-07), Agent 30 (UX-12) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | DOCS_MED_01 | `src/app/docs/pro/api/page.tsx:31,88,120-199` | **Code blocks in Pro API page lack background, padding, and overflow styling.** | Agent 28 (FE-08) |
| [ ] | DOCS_MED_02 | `src/app/docs/pro/webhooks/page.tsx:137-159` vs `src/components/docs/webhooks-docs.tsx:46` | **Webhook HMAC verification docs describe different signature scheme than code examples.** Prose says "raw body"; code uses "timestamp.body". | Agent 29 (M5) |
| [ ] | DOCS_MED_03 | `src/app/docs/pro/api/page.tsx:56-60` | **Docs list rate limit tiers but don't mention per-endpoint differences or chat endpoint default.** | Agent 27 (M1, M2, M3) |
| [ ] | DOCS_MED_04 | `src/app/docs/layout.tsx` | **No breadcrumb navigation in docs.** Nested pages give no hierarchy indication. | Agent 30 (UX-05) |
| [ ] | DOCS_MED_05 | `src/components/docs/docs-nav.tsx:116-123` | **Search only filters sidebar nav titles — no full-text content search.** | Agent 30 (UX-06) |
| [ ] | DOCS_MED_06 | `src/components/docs/docs-nav.tsx:78` | **All 6 sidebar nav groups start fully expanded (39 items visible).** No auto-collapse to current section. | Agent 30 (UX-07) |
| [ ] | DOCS_MED_07 | Multiple doc pages | **Inconsistent callout/tip/warning patterns.** Dedicated `Callout` component exists but is never used. | Agent 30 (UX-10) |
| [ ] | DOCS_MED_08 | `src/app/docs/api/auth/page.tsx:109`, multiple doc pages | **Code examples hardcode API keys as constants instead of using environment variables.** | Agent 29 (M2, M3) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | DOCS_LOW_01 | `src/components/docs/docs-header.tsx:37` | **Docs header says "API Docs" but docs cover all product areas.** Should say "Documentation". | Agent 26 (QA-12) |
| [ ] | DOCS_LOW_02 | `src/app/docs/layout.tsx` | **No skip navigation link for keyboard/screen reader users.** Must tab through 39+ sidebar links. | Agent 30 (UX-17) |
| [ ] | DOCS_LOW_03 | `src/lib/v1-auth.ts:66` | **API key hashing uses unsalted SHA-256.** Vulnerable to rainbow tables if DB leaked. Docs also disclose exact algorithm. | Agent 29 (L3) |
| [ ] | DOCS_LOW_04 | Multiple docs pages | **Inconsistent Link styling — some with hover:underline, some without, some completely unstyled.** | Agent 28 (FE-14) |

---

## AREA: V1_API

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | V1_CRIT_01 | `src/app/api/v1/chat/route.ts:397-408` | **Chat endpoint does not use `apiSuccess` helper — returns structurally different success response from all other endpoints.** | Agent 33 (FE-04) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | V1_HIGH_01 | Multiple V1 routes | **"Not found" errors use inconsistent error codes — some return 404, some return 400 `invalid_request`.** Files, predictions, batches, conversations all return 400 for missing resources. | Agent 33 (FE-05), Agent 35 (UX-09) |
| [ ] | V1_HIGH_02 | `src/app/api/v1/threads/[id]/messages/route.ts:88-93` | **Thread message inserts (user + assistant) ignore DB errors — silent data loss.** | Agent 07 (PRO_B_MED_02, PRO_B_MED_03), Agent 32 (H3), Agent 37 (H-07) |
| [ ] | V1_HIGH_03 | `src/app/api/v1/chat/route.ts:71` vs `batch/route.ts:49` vs `threads/messages:84` | **Message max length inconsistent: 100K in chat, 10K in threads/batch.** 10x undocumented difference. | Agent 33 (FE-09), Agent 35 (UX-13) |
| [ ] | V1_HIGH_04 | `src/app/api/v1/chat/batch/route.ts:218-232` | **Batch webhook sends full results payload to user-provided URL.** If key compromised, attacker exfiltrates all responses. Should send notification only. | Agent 31 (QA-16) |
| [ ] | V1_HIGH_05 | `src/app/api/v1/agents/[id]/route.ts:69-77` | **Agent DELETE silently succeeds even when SSH undeploy fails.** Agent process still running on VPS. | Agent 31 (QA-11), Agent 32 (M7) |
| [ ] | V1_HIGH_06 | `src/app/api/v1/threads/[id]/route.ts:41` | **Thread deletion does not explicitly delete child messages.** Orphaned messages if no CASCADE constraint. | Agent 32 (H4) |
| [ ] | V1_HIGH_07 | `src/app/docs/pro/api/page.tsx` | **API docs page only documents /v1/chat — 15+ endpoints have zero documentation.** | Agent 35 (UX-08) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | V1_MED_01 | `src/app/api/v1/files/[id]/route.ts:50-64` | **TOCTOU race in file deletion.** Separate SELECT then DELETE without transaction. | Agent 32 (H5) |
| [ ] | V1_MED_02 | `src/app/api/v1/conversations/route.ts:38,59` | **Pagination response shape changes between empty and populated results.** `next_cursor: null` only in empty case. | Agent 33 (FE-06) |
| [ ] | V1_MED_03 | `src/app/api/v1/models/route.ts:21-28` | **Models endpoint returns no pagination metadata.** Breaks pattern of all other list endpoints. | Agent 33 (FE-10) |
| [ ] | V1_MED_04 | `src/app/api/v1/files/route.ts:165-173` vs `78-85` vs `[id]/route.ts:22-29` | **File upload, list, and detail responses use different field names for type/mime_type.** | Agent 33 (FE-14, FE-15) |
| [ ] | V1_MED_05 | All V1 routes | **No CORS headers on V1 API routes.** Browser-based integrations blocked. | Agent 35 (UX-14) |
| [ ] | V1_MED_06 | `src/app/api/v1/threads/[id]/messages/route.ts:45-49` | **Thread messages GET returns raw DB rows; conversation messages GET maps fields.** Leaks internal schema. | Agent 33 (FE-16) |
| [ ] | V1_MED_07 | `src/lib/api-errors.ts:142` | **Rate limit `Retry-After` header always hardcoded to "60" regardless of actual reset time.** | Agent 35 (UX-02, UX-04) |
| [ ] | V1_MED_08 | `src/app/api/v1/files/route.ts:125` | **Path traversal potential in storage path via filename.** `file.name` user-controlled, not sanitized for `../`. | Agent 34 (M4) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | V1_LOW_01 | `src/lib/v1-auth.ts:78` | **Auth validation leaks key hash prefix in server logs.** Aids offline brute-force if logs accessed. | Agent 09 (PRO_S_LOW_01), Agent 31 (QA-18) |
| [ ] | V1_LOW_02 | `src/app/api/v1/audit-log/route.ts:25,54` | **Audit log exposes IP addresses via API.** | Agent 31 (QA-10), Agent 34 (L2) |
| [ ] | V1_LOW_03 | Multiple V1 DELETE routes | **No audit trail for destructive API operations (agents, files, threads).** | Agent 34 (L3) |
| [ ] | V1_LOW_04 | N/A | **No OpenAPI/Swagger specification available.** No machine-readable API spec. | Agent 35 (UX-18) |
| [ ] | V1_LOW_05 | `src/app/api/v1/chat/route.ts:34` | **Idempotency key allows single-character values — easy collisions.** | Agent 31 (QA-15) |

---

## AREA: STARTER (Frontend/UX)

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ST_FE_HIGH_01 | `src/components/dashboard/notification-bell.tsx:107` | **Notification bell button lacks accessible label.** Screen readers announce unlabeled button. | Agent 03 (FE-16), Agent 05 (UX-13) |
| [ ] | ST_FE_HIGH_02 | `src/app/layout.tsx:40-46` | **No skip-to-content link in layout.** Keyboard users must tab through 20+ sidebar items. | Agent 05 (UX-02) |
| [ ] | ST_FE_HIGH_03 | `src/app/dashboard/support/new/page.tsx:81,172-178` | **Ticket attachment upload renders after ticketId set but router.push fires immediately — attachment UI inaccessible.** | Agent 05 (UX-06) |
| [ ] | ST_FE_HIGH_04 | `src/components/dashboard/channel-manager.tsx` | **ChannelManager is 862 lines with too many concerns.** 10+ state variables, multiple data fetching operations. | Agent 03 (FE-20) |
| [ ] | ST_FE_HIGH_05 | `src/app/dashboard/layout.tsx:27-38` and page files | **Duplicate data fetching — layout fetches subscription, then each page re-fetches it.** | Agent 03 (FE-09) |
| [ ] | ST_FE_HIGH_06 | `src/components/dashboard/channel-manager.tsx:585-604` | **Channel reorder buttons too small (24x24px) — below 44px WCAG touch target.** | Agent 05 (UX-09) |
| [ ] | ST_FE_HIGH_07 | `src/components/dashboard/agent-chat.tsx:33-37` | **Code block copy button invisible to keyboard users.** `opacity-0` with no `focus:opacity-100`. No `aria-label`. | Agent 05 (UX-32) |
| [ ] | ST_FE_HIGH_08 | `src/app/dashboard/vps/page.tsx:86-97` | **VPS "No VPS Provisioned" empty state has no guidance or next action.** | Agent 05 (UX-23) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ST_FE_MED_01 | `src/components/dashboard/agent-manager.tsx:250-253` | **Bulk agent deploy/undeploy shows per-item toast spam.** 10+ sequential toasts. | Agent 05 (UX-07), Agent 03 (FE-21) |
| [ ] | ST_FE_MED_02 | `src/components/dashboard/channel-manager.tsx:498-499` | **Channel disconnect removes channel from state entirely with no undo.** | Agent 05 (UX-26) |
| [ ] | ST_FE_MED_03 | `src/components/dashboard/agent-manager.tsx:641-663` | **"Undeploy All" confirmation has no destructive styling.** Users may not grasp severity. | Agent 05 (UX-25) |
| [ ] | ST_FE_MED_04 | `src/components/dashboard/agent-manager.tsx:358-379` | **Agent filter buttons and sort select lack sufficient touch targets and accessible labels.** | Agent 03 (FE-18, FE-19), Agent 05 (UX-10) |
| [ ] | ST_FE_MED_05 | Multiple dashboard pages | **Inconsistent error state patterns — some with retry button, some without, some in cards.** No shared error component. | Agent 05 (UX-16), Agent 03 (FE-11, FE-12) |
| [ ] | ST_FE_MED_06 | `src/app/pricing/page.tsx:143-164` | **Pricing toggle buttons lack ARIA roles/state.** No `role="tablist"`, `aria-selected`, or `aria-pressed`. | Agent 08 (FE-17), Agent 10 (UX-01), Agent 25 (UX-11) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ST_FE_LOW_01 | `src/components/dashboard/vps-controls.tsx:196` | **Redundant useEffect dependencies may cause duplicate chart points.** | Agent 01 (QA-07), Agent 03 (FE-01) |
| [ ] | ST_FE_LOW_02 | `src/components/dashboard/agent-chat.tsx:378-382` | **/retry removes system messages unintentionally.** | Agent 01 (QA-04) |
| [ ] | ST_FE_LOW_03 | `src/app/dashboard/billing/page.tsx:50-51` | **Payments query error not checked.** Silent empty payments list. | Agent 01 (QA-10) |
| [ ] | ST_FE_LOW_04 | `src/components/dashboard/notification-bell.tsx:144-146` | **Notification items without href are non-functional buttons.** Click does nothing. | Agent 03 (FE-17), Agent 05 (UX-15) |

---

## AREA: CROSS (Architecture/Infrastructure)

### CRITICAL

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ARCH_CRIT_01 | Entire project | **No test infrastructure exists.** Zero tests, no test runner configured. 145+ API routes with no automated verification. | Agent 40 (ARCH-01) |
| [ ] | ARCH_CRIT_02 | All `src/app/api/` routes | **Massive auth/plan-check boilerplate duplication across 145+ routes.** 627 instances of ad-hoc error format vs 91 structured. Inconsistent error contracts. | Agent 40 (ARCH-02) |

### HIGH

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ARCH_HIGH_01 | 117 files calling `createAdminClient()` | **No data access layer — Supabase queries scattered across route handlers.** Same queries duplicated in dozens of files. | Agent 40 (ARCH-03) |
| [ ] | ARCH_HIGH_02 | `src/lib/provision-store.ts` | **In-memory provision job store incompatible with multi-instance deployments.** POST and GET may hit different instances. | Agent 40 (ARCH-06) |
| [ ] | ARCH_HIGH_03 | 18 files containing `demo@clawhq.tech` | **Demo user bypass scattered across 18 API routes without centralization.** Each has inline mock data. | Agent 40 (ARCH-07) |
| [ ] | ARCH_HIGH_04 | `src/lib/ssh.ts:10-20` | **SSH connection opened and closed per every operation — no pooling.** 200-800ms handshake overhead per call. | Agent 38 (PERF-03) |
| [x] | ARCH_HIGH_05 | `.env.local.template:5-6` | **Git-tracked template contains real Supabase anon key.** Template should have placeholders only. Also missing 13+ env vars. | Agent 39 (C1, H3) |
| [ ] | ARCH_HIGH_06 | `src/app/api/admin/api-keys/route.ts:145,243`, `src/app/sitemap.ts:6-24` | **Hardcoded production URLs bypass environment variables.** Will break in non-production environments. | Agent 39 (H1, H2, H5) |

### MEDIUM

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [ ] | ARCH_MED_01 | Multiple routes | **`.select("*")` used in 30+ API routes — over-fetching.** Fetches all columns including large text/JSON not needed. | Agent 38 (PERF-11) |
| [ ] | ARCH_MED_02 | `src/lib/mc-route-guard.ts:30-44`, many routes | **Repeated auth + subscription check pattern — 2 sequential DB queries per request.** 30-60ms tax on every request. | Agent 38 (PERF-12) |
| [ ] | ARCH_MED_03 | All POST/PUT/DELETE session routes | **No CSRF protection for state-mutating session-based routes.** Cookie auth without CSRF tokens. | Agent 40 (ARCH-10) |
| [ ] | ARCH_MED_04 | `src/lib/provision.ts`, `src/lib/notify.ts`, `src/lib/context-cache.ts` | **Dead code: 3 lib modules never imported anywhere.** | Agent 39 (M1, M2, M3) |
| [ ] | ARCH_MED_05 | `src/lib/payments/xpay.ts:14-42` | **XPay payment module is a stub with TODO comments.** Both functions throw/return errors. | Agent 39 (M4) |

### LOW

| Done | ID | File:Line | Description | Sources |
|------|----|-----------|-------------|---------|
| [x] | ARCH_LOW_01 | Root directory | **Debug/backup files in project root.** `provision_route_backup.txt`, `test_write.txt`, `x.txt`. | Agent 39 (C3) |
| [ ] | ARCH_LOW_02 | `tailwind.config.ts:5-9` | **Content paths include legacy directories that don't exist.** `./pages/**`, `./components/**`, `./app/**`. | Agent 40 (ARCH-14) |
| [ ] | ARCH_LOW_03 | `next.config.ts` | **Missing image optimization configuration.** No WebP/AVIF format, no deviceSizes. | Agent 38 (PERF-18) |
| [ ] | ARCH_LOW_04 | All API routes under `src/app/api/` | **No `Cache-Control` headers on any API response.** Read-only endpoints could benefit from caching. | Agent 38 (PERF-17) |
| [ ] | ARCH_LOW_05 | `src/app/api/v1/chat/route.ts`, `admin/provision/route.ts` | **Business logic embedded in route handlers makes code untestable.** Chat route is 429 lines. | Agent 40 (ARCH-09) |
| [ ] | ARCH_LOW_06 | Multiple route files | **`any` type used extensively in API route handlers.** No shared TypeScript types for DB rows. | Agent 40 (ARCH-12), Agent 13 (FE-07) |

---

## CROSS-AREA DUPLICATES

Issues found by multiple area-specific agents (deduplicated above, listed here for reference):

- **Broken rate limiter (`rateLimit()` never records hits):** Found by Agents 01, 02, 04, 06, 07, 09, 22, 24, 31, 32, 34, 35, 36, 37, 38, 39, 40 (17 agents)
- **Hardcoded colors violating design system:** Found by Agents 03, 05, 08, 10, 13, 15, 16, 18, 20, 23, 25, 28, 30, 39 (14 agents)
- **SSR disabled for landing page sections:** Found by Agents 16, 17, 18, 20, 38 (5 agents)
- **Billing docs Mission Control on Pro (should be Ultra-only):** Found by Agents 21, 23, 25, 26, 36 (5 agents)
- **VPS storage inconsistency (docs vs plans.ts):** Found by Agents 21, 23, 25, 26, 27, 36 (6 agents)
- **Billing docs annual pricing doesn't match plans.ts:** Found by Agents 21, 23, 25, 26, 27, 36 (6 agents)
- **Batch POST blocks and returns stale status:** Found by Agents 06, 07, 31, 32, 33, 35, 38 (7 agents)
- **Predictions endpoint never processes records:** Found by Agents 06, 07, 31, 32, 33, 35 (6 agents)
- **Chat API docs field name `reply` vs actual `response`:** Found by Agents 06, 27, 33, 35 (4 agents)
- **SSE streaming format docs mismatch:** Found by Agents 06, 27, 33, 35 (4 agents)
- **Usage endpoint unbounded query:** Found by Agents 07, 31, 32, 34, 37, 38 (6 agents)
- **No tier-based rate limit differentiation:** Found by Agents 21, 22, 24, 36 (4 agents)
- **Duplicate Supabase auth calls on landing page:** Found by Agents 17, 18, 20, 38 (4 agents)
- **PLAN_PRICES missing enterprise:** Found by Agents 06, 08, 21, 22, 23 (5 agents)
- **Bulk suspend updates DB but never stops VPS:** Found by Agents 11, 12, 37 (3 agents)
- **Landing page "use client" on root:** Found by Agents 17, 38 (2 agents, plus SSR-disabled overlap)
- **Billing docs feature limits not enforced in code:** Found by Agents 08, 10, 21, 23, 26, 27, 36 (7 agents)
- **Pricing section iframe performance issues:** Found by Agents 16, 17, 18, 20, 38 (5 agents)
- **Docs nav only lists 3 of 30+ pages:** Found by Agents 26, 28, 30 (3 agents)
- **Content-Security-Policy header missing:** Found by Agents 19, 40 (2 agents)
