# ALL ISSUES EXTRACTED — Consolidated from 40 Review Files

**Generated:** 2026-03-16
**Source files:** 40 review reports across 11 areas
**Total unique issues:** 500+

---

## AREA: 59 (Starter Dashboard)

### CRITICAL

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 59_CRIT_01 | `src/app/dashboard/account/page.tsx:22-43` | Account page has no try/catch on Promise.all — any query failure crashes the page with unhandled rejection | 59_QA_TESTER (BUG-026) |
| 59_CRIT_02 | `src/components/dashboard/monitoring-dashboard.tsx:166` | CPU icon color logic has wrong precedence — `> 75` checked before `> 90`, so red branch is unreachable; CPU at 95% shows yellow instead of red | 59_QA_TESTER (BUG-027) |
| 59_CRIT_03 | `src/app/api/vps/password/route.ts:113` | Dashboard password stored in plaintext in Supabase — if DB is compromised, all customer passwords exposed | 59_BACKEND_DEV (C1), 59_SECURITY_AUDITOR (C1) |
| 59_CRIT_04 | All VPS routes | SSH credentials (root passwords) stored in plaintext in database — DB breach exposes root SSH access to every VPS | 59_SECURITY_AUDITOR (C2) |
| 59_CRIT_05 | `src/app/api/payments/verify/route.ts:17` | Payment verification route missing request.json() try/catch — malformed body returns 500 with potential stack trace leak | 59_BACKEND_DEV (C2) |
| 59_CRIT_06 | `src/app/api/payments/verify/route.ts` | Payment verification has no rate limiting — attacker can brute-force payment signatures | 59_BACKEND_DEV (C3) |

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 59_HIGH_01 | `src/app/dashboard/page.tsx:114` | No-subscription "View Plans" link points to /billing which shows "No Active Subscription" with no way to subscribe — user stuck in loop | 59_QA_TESTER (BUG-001) |
| 59_HIGH_02 | `src/app/dashboard/models/page.tsx:13` | Models page returns null for unauthenticated users instead of redirecting to /login — shows blank page | 59_QA_TESTER (BUG-008) |
| 59_HIGH_03 | `src/components/dashboard/agent-manager.tsx:205-274` | Bulk deploy does not check VPS status — fires N sequential error toasts when VPS is offline | 59_QA_TESTER (BUG-011) |
| 59_HIGH_04 | `src/components/dashboard/agent-chat.tsx:410` | Chat sidebar not responsive on mobile — fixed 256px width leaves no room for chat on small screens; chat-mobile-sidebar.tsx exists but is not used | 59_QA_TESTER (BUG-016), 59_UX_REVIEWER |
| 59_HIGH_05 | `src/components/dashboard/agent-chat.tsx:134-235` | Streaming chat does not abort on agent switch — old stream continues writing to state, accumulating tokens in memory for a non-visible message | 59_QA_TESTER (BUG-017) |
| 59_HIGH_06 | `src/components/dashboard/channel-manager.tsx:296-331` | Channel reconnect sends empty credentials — always fails for Telegram/Discord/Slack/Teams (only webchat works) | 59_QA_TESTER (BUG-020) |
| 59_HIGH_07 | `src/lib/rate-limit.ts` | In-memory rate limiter resets on serverless cold starts — rate limits are effectively useless on Vercel | 59_BACKEND_DEV (H1), 59_SECURITY_AUDITOR (M2) |
| 59_HIGH_08 | `src/app/api/vps/ssl-check/route.ts:23` | SSL check uses regular Supabase client instead of admin client — may silently return null due to RLS | 59_BACKEND_DEV (H2) |
| 59_HIGH_09 | `src/app/api/webhooks/route.ts:82` | webhooks POST missing try/catch around request.json() | 59_BACKEND_DEV (H3) |
| 59_HIGH_10 | `src/app/api/keys/[id]/route.ts:92` | keys PATCH missing try/catch around request.json() | 59_BACKEND_DEV (H4) |
| 59_HIGH_11 | `src/app/api/payments/create-order/route.ts:23` | payments create-order missing try/catch around request.json() | 59_BACKEND_DEV (H5) |
| 59_HIGH_12 | `src/app/api/cron/mc-recurring/route.ts` and `src/app/api/cron/webhook-retry/route.ts` | Two cron endpoints have ZERO authentication — any unauthenticated request triggers admin operations | 59_SECURITY_AUDITOR (H1) |
| 59_HIGH_13 | `src/app/api/cron/log-alerts/route.ts:19` | log-alerts cron has weak auth — if CRON_SECRET is unset, check is bypassed entirely (fail-open) | 59_SECURITY_AUDITOR (H2) |
| 59_HIGH_14 | `src/middleware.ts:152-182` | Middleware does not protect API routes — no /api/* in matcher; any route missing its auth check is fully public | 59_SECURITY_AUDITOR (H3) |
| 59_HIGH_15 | `src/middleware.ts:75` | Middleware uses getSession() instead of getUser() — expired/revoked sessions can still access dashboard pages | 59_SECURITY_AUDITOR (H4) |
| 59_HIGH_16 | Multiple V1 routes, webhook-retry cron | SSRF risk — isPrivateUrl() may be bypassable via DNS rebinding, IPv6 loopback, or octal notation | 59_SECURITY_AUDITOR (H5) |
| 59_HIGH_17 | Multiple server pages | Excessive `any` types — ~40 `any` types across server pages for Supabase query results | 59_FRONTEND_DEV |
| 59_HIGH_18 | Multiple components | Missing ARIA labels on icon-only buttons — 15+ instances across 7 components | 59_FRONTEND_DEV |
| 59_HIGH_19 | `src/components/dashboard/vps-maintenance.tsx:268` | Toggle button is 2px dot (h-2 w-2) — far below 44px WCAG minimum touch target | 59_FRONTEND_DEV |
| 59_HIGH_20 | `logs-explorer.tsx`, `knowledge-base-manager.tsx` | Missing debounce on search inputs — re-renders full table on every keystroke | 59_FRONTEND_DEV |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 59_MED_01 | `src/app/dashboard/page.tsx:82-86` | Model query error silently ignored — modelRes.error never checked | 59_QA_TESTER (BUG-003) |
| 59_MED_02 | `src/app/dashboard/vps/page.tsx:46` | VPS page swallows Supabase errors — treats RLS failure as "no VPS" | 59_QA_TESTER (BUG-004) |
| 59_MED_03 | `src/components/dashboard/vps-controls.tsx:270` | VPS Controls useEffect dependency on [monitoring] may cause chart data stalling | 59_QA_TESTER (BUG-005) |
| 59_MED_04 | `src/components/dashboard/vps-controls.tsx:362-439` | Double-click timing window on Stop/Restart AlertDialog — actionLoading not set before performAction | 59_QA_TESTER (BUG-007) |
| 59_MED_05 | `src/app/dashboard/models/page.tsx:39` | availableModels error not checked — empty model list shown on query failure | 59_QA_TESTER (BUG-009) |
| 59_MED_06 | `src/components/dashboard/agent-manager.tsx:374` | Agent name access on potentially null agents relation — runtime crash possible | 59_QA_TESTER (BUG-012) |
| 59_MED_07 | `src/components/dashboard/agent-manager.tsx:126` | Deploy limit check uses stale deployedCount during bulk deploy | 59_QA_TESTER (BUG-013) |
| 59_MED_08 | `src/app/dashboard/store/[id]/page.tsx:179` | Price display shows cost ($X.XX) — may violate project naming rules ("no cost shown") | 59_QA_TESTER (BUG-015) |
| 59_MED_09 | `src/components/dashboard/channel-manager.tsx:252-277` | fetchLastMessages runs on every render due to channels dependency — N API calls on every state change | 59_QA_TESTER (BUG-019) |
| 59_MED_10 | `src/app/dashboard/support/new/page.tsx:78,93,179` | New ticket navigation uses /dashboard/support prefix instead of clean /support URLs | 59_QA_TESTER (BUG-021) |
| 59_MED_11 | `src/components/dashboard/ticket-thread.tsx:203` | Ticket thread "Back to Support" uses /dashboard/support prefix | 59_QA_TESTER (BUG-022) |
| 59_MED_12 | `src/components/dashboard/ticket-list.tsx:166,216,237` | Ticket list navigation uses /dashboard/support/... paths | 59_QA_TESTER (BUG-023) |
| 59_MED_13 | `src/app/api/vps/password/route.ts:70` | No max-length on VPS dashboard password — multi-MB string could be written to DB | 59_BACKEND_DEV (M1) |
| 59_MED_14 | `src/app/api/tickets/create/route.ts` | No max-length on ticket subject/description | 59_BACKEND_DEV (M2) |
| 59_MED_15 | `src/app/api/tickets/[id]/reply/route.ts` | No max-length on ticket reply message | 59_BACKEND_DEV (M3) |
| 59_MED_16 | `src/app/api/chat/send/route.ts:49` | No max-length on chat message — could cause large token consumption | 59_BACKEND_DEV (M4) |
| 59_MED_17 | `src/app/api/webhooks/route.ts` | No max-length on webhook description | 59_BACKEND_DEV (M5) |
| 59_MED_18 | `src/app/api/agents/config/route.ts` | No max-length on agent config values | 59_BACKEND_DEV (M6) |
| 59_MED_19 | `src/app/api/notifications/route.ts:55` | Notification PATCH body.ids array not length-limited — could send thousands of IDs | 59_BACKEND_DEV (M7) |
| 59_MED_20 | `src/app/api/audit-log/route.ts:52-55` | Audit log search sanitization is fragile — strips some but not all special characters | 59_BACKEND_DEV (M8) |
| 59_MED_21 | `src/app/api/vps/status/route.ts:71` | VPS status leaks internal error message in _stale_reason field | 59_BACKEND_DEV (M9), 59_SECURITY_AUDITOR (L2) |
| 59_MED_22 | `src/app/api/chat/send/route.ts` | Chat send route has 60s timeout but no maxDuration export — Vercel Hobby tier kills at 10s | 59_BACKEND_DEV (M10) |
| 59_MED_23 | `src/app/api/account/delete/route.ts` | Account deletion misses 15+ tables — zombie SSH credentials, PII persists, GDPR violation risk | 59_SECURITY_AUDITOR (M1) |
| 59_MED_24 | `src/app/api/vps/logs/route.ts:46` | VPS logs lines parameter NaN handling is sloppy — parseInt of non-numeric returns NaN | 59_SECURITY_AUDITOR (M3) |
| 59_MED_25 | `src/app/api/tickets/attachment/route.ts:101-102` | Ticket attachments use public URLs — accessible without authentication to anyone who knows the URL | 59_SECURITY_AUDITOR (M4) |
| 59_MED_26 | `src/app/api/account/avatar/route.ts:56` | Avatar upload validates MIME type from client-provided Content-Type only — SVG with XSS or spoofed type possible | 59_SECURITY_AUDITOR (M5) |
| 59_MED_27 | `src/app/api/payments/verify/route.ts:50-51,73-119` | Payment verification trusts client-provided metadata for plan fulfillment — user could pay $1 but claim Pro plan | 59_SECURITY_AUDITOR (M7) |
| 59_MED_28 | `src/components/dashboard/vps-controls.tsx` (~825 lines) | VPS controls component too large — should be split into 4 sub-components | 59_FRONTEND_DEV |
| 59_MED_29 | `src/components/dashboard/api-access-manager.tsx` (~745 lines) | API access manager too large — code examples should be separate constants file | 59_FRONTEND_DEV |
| 59_MED_30 | `uptime-display.tsx`, `dashboard-password.tsx` | Use raw fetch + useEffect instead of React Query — inconsistent with codebase | 59_FRONTEND_DEV |
| 59_MED_31 | `src/components/dashboard/logs-explorer.tsx` | Renders all filtered entries (500+) without virtualization — significant DOM churn | 59_FRONTEND_DEV |
| 59_MED_32 | `src/components/dashboard/mini-sparkline.tsx:39` | Gradient ID collision if two sparklines have same data | 59_FRONTEND_DEV |
| 59_MED_33 | `src/components/dashboard/overview-sparklines.tsx:29` | Query returns null instead of throwing on error — silently swallows failures | 59_FRONTEND_DEV |
| 59_MED_34 | `src/components/dashboard/openclaw-embed.tsx:25` | Auth fetch has no AbortController — state update on unmounted component possible | 59_FRONTEND_DEV |
| 59_MED_35 | `src/components/dashboard/logs-explorer.tsx:278-289` | Log filter badges are clickable but not keyboard-accessible (Badge onClick, not button) | 59_FRONTEND_DEV |
| 59_MED_36 | Dynamic content areas | Missing aria-live regions for polling content (VPS status, monitoring, notifications) | 59_FRONTEND_DEV |
| 59_MED_37 | `api-access-manager.tsx`, `openclaw-credentials-banner.tsx` | Key list items and credentials banner overflow on mobile — no flex-wrap | 59_FRONTEND_DEV |
| 59_MED_38 | `src/components/dashboard/vps-controls.tsx` | Chart tooltip may be clipped on mobile | 59_FRONTEND_DEV |
| 59_MED_39 | `agents/page.tsx:68-71` | Fragile assumption about Supabase join behavior — normalizes relation as array | 59_FRONTEND_DEV |
| 59_MED_40 | `vps-maintenance.tsx` | Scheduled restarts use mock data with misleading success toast | 59_FRONTEND_DEV |

### LOW

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 59_LOW_01 | `src/app/dashboard/page.tsx:142` | Contact support link for no-subscription users is minor UX concern | 59_QA_TESTER (BUG-002) |
| 59_LOW_02 | `src/components/dashboard/vps-controls.tsx:129-137` | Stale chart data from previous session could confuse users | 59_QA_TESTER (BUG-006) |
| 59_LOW_03 | `src/components/dashboard/model-config.tsx:361` | Model comparison dialog receives null for currentModel — could crash if dialog accesses display_name | 59_QA_TESTER (BUG-010) |
| 59_LOW_04 | `src/app/dashboard/store/[id]/page.tsx:33` | Store detail 404 uses default Next.js page — not branded | 59_QA_TESTER (BUG-014) |
| 59_LOW_05 | `src/components/dashboard/agent-chat.tsx:263-303` | /compact command interleaves loading states with sendMessage fragily | 59_QA_TESTER (BUG-018) |
| 59_LOW_06 | `src/app/api/tickets/create/route.ts:27-31` | Category field sent from form but ignored server-side | 59_QA_TESTER (BUG-024) |
| 59_LOW_07 | `src/components/dashboard/billing-overview.tsx:373-383` | No downgrade path visible — no way for user to downgrade or contact support to downgrade | 59_QA_TESTER (BUG-025) |
| 59_LOW_08 | `src/app/api/cron/apply-pending-changes/route.ts` | Cron response returns internal user IDs and model names | 59_BACKEND_DEV (L1) |
| 59_LOW_09 | `src/app/api/vps/uptime/route.ts:127` | Returns 200 with error field on SSH failure — inconsistent with other routes | 59_BACKEND_DEV (L2) |
| 59_LOW_10 | `src/app/api/models/history/route.ts:36-41` | Both error and catch return empty history — broken table indistinguishable from empty | 59_BACKEND_DEV (L3) |
| 59_LOW_11 | `src/app/api/vps/gateway-health/route.ts:89-92` | Returns 200 on SSH failure with no error flag | 59_BACKEND_DEV (L4) |
| 59_LOW_12 | `src/app/api/vps/stop/route.ts:54` | Sets status to "stopped" immediately instead of transitional "stopping" state | 59_BACKEND_DEV (L5) |
| 59_LOW_13 | Multiple routes | Unused err variable in catch blocks | 59_BACKEND_DEV (L6) |
| 59_LOW_14 | `src/app/api/mission-control/tasks/queue/route.ts` | Uses regular Supabase client with RLS — inconsistent with other routes using admin client | 59_BACKEND_DEV (L7) |
| 59_LOW_15 | No CORS config | No explicit CORS configuration — relies on SameSite=Lax cookies | 59_SECURITY_AUDITOR (L1) |
| 59_LOW_16 | `src/middleware.ts:111-116` | Admin role check uses RLS-scoped client — safe direction (fail-closed) but noted | 59_SECURITY_AUDITOR (L3) |
| 59_LOW_17 | `src/app/api/channels/[id]/routing/route.ts` GET | Channel routing GET endpoint missing rate limit | 59_SECURITY_AUDITOR (L4) |
| 59_LOW_18 | `src/lib/ssh.ts:157` | serviceName in systemctl commands not quoted | 59_SECURITY_AUDITOR (L5) |
| 59_LOW_19 | `src/lib/ssh.ts:394` | deployAgent filename parameter not sanitized — path traversal possible on user's own VPS | 59_SECURITY_AUDITOR (L6) |
| 59_LOW_20 | Multiple components | No staleTime on queries — refetch on every mount | 59_FRONTEND_DEV |
| 59_LOW_21 | Chart components | Chart components not lazy-loaded — recharts ~200KB imported eagerly | 59_FRONTEND_DEV |
| 59_LOW_22 | `ssl-checker.tsx:60` | Missing border-border on Card — minor inconsistency | 59_FRONTEND_DEV |
| 59_LOW_23 | `channel-setup-wizard.tsx:143` | Step counter inside DialogDescription — semantically wrong | 59_FRONTEND_DEV |
| 59_LOW_24 | `model-playground.tsx:185` | Model selector grid doesn't stack on very narrow screens | 59_FRONTEND_DEV |
| 59_LOW_25 | `api-playground.tsx:137` | activeKeys variable computed but never used in JSX | 59_FRONTEND_DEV |
| 59_LOW_26 | `quick-actions.tsx:6` | ArrowRight imported but never used | 59_FRONTEND_DEV |
| 59_LOW_27 | `model-playground.tsx:226-239` | Uses raw textarea instead of shadcn Textarea | 59_FRONTEND_DEV |
| 59_LOW_28 | `api-playground.tsx:339` | Uses native checkbox instead of shadcn Checkbox | 59_FRONTEND_DEV |

### UX ISSUES (from 59_UX_REVIEWER)

| ID | Description | Sources |
|----|-------------|---------|
| 59_UX_01 | No cancel/downgrade flow in Billing — users cannot leave | 59_UX_REVIEWER |
| 59_UX_02 | No self-service payment method update — must contact support | 59_UX_REVIEWER |
| 59_UX_03 | Chat page missing 4 built components (mobile sidebar, export, read receipts, sound toggle) | 59_UX_REVIEWER |
| 59_UX_04 | Security Score logic is broken — older accounts rated lower, meaningless metric | 59_UX_REVIEWER |
| 59_UX_05 | "Password Last Changed: Unknown" in security section | 59_UX_REVIEWER |
| 59_UX_06 | No file attachments in ticket creation (component exists but unused) | 59_UX_REVIEWER |
| 59_UX_07 | No conversation history browser in chat — /clear destroys everything | 59_UX_REVIEWER |
| 59_UX_08 | No alert thresholds on VPS metrics — no color change at 80%+ | 59_UX_REVIEWER |
| 59_UX_09 | Third sparkline card switches between Messages and Tickets — confusing | 59_UX_REVIEWER |
| 59_UX_10 | Avatar upload component exists but unused on Account page | 59_UX_REVIEWER |
| 59_UX_11 | 11 sidebar items without grouping — too many ungrouped | 59_UX_REVIEWER |

---

## AREA: 129 (Pro Features)

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 129_MED_01 | `/api/vps/logs` | Missing rate limit on VPS logs endpoint — 5s auto-refresh could overload SSH | 129_QA_TESTER (BUG-02) |
| 129_MED_02 | `knowledge-base-manager.tsx:148` | Content search mode dropdown doesn't actually filter by content — only name search works from main bar | 129_QA_TESTER (BUG-03), 129_FRONTEND_DEV |
| 129_MED_03 | `audit-log/route.ts:52` | Audit log search sanitization strips underscores/periods — breaks searches for action names like "api_key_created" | 129_QA_TESTER (BUG-06) |
| 129_MED_04 | `agent-builder.tsx` | Deploy possible with empty sanitized agent name (all special chars -> empty string) | 129_QA_TESTER (BUG-07) |
| 129_MED_05 | `agent-builder.tsx:173` | AI config JSON extraction regex is greedy — may match wrong braces | 129_QA_TESTER (BUG-08) |
| 129_MED_06 | `/api/v1/health/route.ts` | V1 Health endpoint has no rate limiting | 129_QA_TESTER (BUG-09) |
| 129_MED_07 | `/api/v1/conversations/route.ts` | V1 Conversations endpoint has no rate limiting | 129_QA_TESTER (BUG-10) |
| 129_MED_08 | `logs/alerts/route.ts:63-75` | Log alerts DELETE does not verify Pro plan — downgraded user can still delete rules | 129_QA_TESTER (BUG-13) |
| 129_MED_09 | `agents/[id]/config/route.ts` | Agent config GET is not Pro-gated — Starter user can read agent configs | 129_QA_TESTER (BUG-14) |
| 129_MED_10 | `webhooks-manager.tsx:663-677` | Pause/Resume uses raw fetch instead of useMutation — bypasses loading/error handling | 129_FRONTEND_DEV (RQ-1) |
| 129_MED_11 | `audit-log-viewer.tsx:232-249` | Verify chain uses raw fetch inline instead of mutation | 129_FRONTEND_DEV (RQ-2) |
| 129_MED_12 | `usage-analytics.tsx` (lines 97+) | Multiple `any` type casts — API response data completely untyped | 129_FRONTEND_DEV |
| 129_MED_13 | `knowledge-base-manager.tsx` | Upload zone looks like drag-drop but does not support it — misleading UX | 129_FRONTEND_DEV |
| 129_MED_14 | `webhooks-manager.tsx:600` | Enable/disable dot toggle has no accessible label, no aria-label, no keyboard focus | 129_FRONTEND_DEV (A11Y-1) |
| 129_MED_15 | `webhooks-manager.tsx:757` | Delivery expand/collapse button missing aria-expanded | 129_FRONTEND_DEV (A11Y-2) |
| 129_MED_16 | `logs-explorer.tsx:280` | Badge-level filter toggles not keyboard accessible (Badge onClick, not button) | 129_FRONTEND_DEV (A11Y-3) |
| 129_MED_17 | `knowledge-base-manager.tsx:447` | Upload drop zone is div onClick with no keyboard handler | 129_FRONTEND_DEV (A11Y-4) |
| 129_MED_18 | `agent-builder.tsx`, `model-playground.tsx` | Textareas lack id and associated label htmlFor | 129_FRONTEND_DEV (A11Y-5/6) |
| 129_MED_19 | `webhooks-manager.tsx` | Summary/templates grids use grid-cols-3 with no responsive breakpoint — cramped on mobile | 129_FRONTEND_DEV (MOB-1/2) |
| 129_MED_20 | `webhooks-manager.tsx` | Card header has many buttons (Edit, Test, Pause, Delete) that overflow on mobile | 129_FRONTEND_DEV (MOB-3) |
| 129_MED_21 | `api-access-manager.tsx` | Nested tabs may overflow on small screens | 129_FRONTEND_DEV (MOB-4) |
| 129_MED_22 | `logs-explorer.tsx` | No useMemo on filtered/levelCounts — recalculated every render | 129_FRONTEND_DEV |
| 129_MED_23 | `logs-explorer.tsx` | Renders up to 500 log entries without virtualization | 129_FRONTEND_DEV |
| 129_MED_24 | `agent-chat.tsx` | No AbortController on streaming fetch — connection leaks on unmount | 129_FRONTEND_DEV |
| 129_MED_25 | Agent chat `CodeBlock` | No syntax highlighting — code rendered as plain monospace text | 129_FRONTEND_DEV |

### HIGH (129 Backend)

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 129_HIGH_01 | `analytics/funnels/route.ts:37-44` | N+1 query storm — up to 200 sequential COUNT queries for conversations | 129_BACKEND_DEV (H1) |
| 129_HIGH_02 | `analytics/paths/route.ts:89-107` | N+1 query storm in fallback path — fetches messages per conversation individually | 129_BACKEND_DEV (H2) |
| 129_HIGH_03 | `keys/route.ts:49-82` | N+1 pattern — downloads all analytics rows, filters client-side per key O(keys*rows) | 129_BACKEND_DEV (H3) |
| 129_HIGH_04 | `knowledge-base.ts:252-258` | embedChunks sequential per-row updates — 100 separate UPDATE queries per batch | 129_BACKEND_DEV (H4) |
| 129_HIGH_05 | `v1/chat/batch/route.ts` | Batch API webhook_url parameter accepted/stored but never dispatched | 129_BACKEND_DEV (H5) |
| 129_HIGH_06 | `v1/conversations/route.ts:68`, `knowledge-base/search/route.ts:47` | Unescaped LIKE wildcards in .ilike() queries — % and _ not escaped | 129_SECURITY_AUDITOR (HIGH-03) |

### MEDIUM (129 Backend)

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 129_MED_B01 | Multiple V1 routes | Missing try/catch on request.json() in 5+ routes | 129_BACKEND_DEV (M1) |
| 129_MED_B02 | Multiple V1 routes | 15+ instances of `as any` casts on Supabase join types | 129_BACKEND_DEV (M2) |
| 129_MED_B03 | 7+ V1 route files | validateApiKey helper copy-pasted identically in 7+ files | 129_BACKEND_DEV (M3) |
| 129_MED_B04 | All dashboard Pro routes | Duplicated 6-line plan-check boilerplate in every route | 129_BACKEND_DEV (M4) |
| 129_MED_B05 | `v1/conversations`, `v1/conversations/[id]/messages` | Inconsistent error response shapes — flat string vs structured object | 129_BACKEND_DEV (M5) |
| 129_MED_B06 | `v1/chat/route.ts:295-350` | SSE stream lacks client disconnect handling — upstream reader continues draining | 129_BACKEND_DEV (M6) |
| 129_MED_B07 | `context-cache.ts` | In-memory context cache single-instance only — useless on serverless | 129_BACKEND_DEV (M7) |
| 129_MED_B08 | `cron/mc-recurring/route.ts` | mc-recurring cron has NO auth check | 129_BACKEND_DEV (M8) |
| 129_MED_B09 | `audit-log/streams/route.ts:137-149` | SIEM stream URL validation weaker than isPrivateUrl() — misses IPv6, link-local | 129_BACKEND_DEV (M9) |
| 129_MED_B10 | `idempotency.ts:47` | storeIdempotency silently swallows errors | 129_BACKEND_DEV (M10) |
| 129_MED_B11 | `moderation.ts` | Content moderation has only ~15 keywords — minimal coverage | 129_BACKEND_DEV (M11) |
| 129_MED_B12 | `audit-log.ts:91-152` | streamToSIEM makes HTTP requests to stored URLs without SSRF protection | 129_BACKEND_DEV (M12) |
| 129_MED_B13 | `webhooks/route.ts:37-53` | Webhook secret partially exposed in GET response (first 6 + last 4 chars); full secret selected from DB unnecessarily | 129_SECURITY_AUDITOR (MED-01) |
| 129_MED_B14 | `audit-log.ts:99` | SIEM API keys stored in plaintext in Supabase | 129_SECURITY_AUDITOR (MED-02) |
| 129_MED_B15 | Multiple V1 GET routes | Most V1 GET routes lack rate limiting | 129_SECURITY_AUDITOR (MED-03) |

### LOW (129)

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 129_LOW_01 | `logs-explorer.tsx:402` | HighlightText minor inconsistency between regex split and includes match | 129_QA_TESTER (BUG-01) |
| 129_LOW_02 | `webhooks-manager.tsx` | Masked secret shown inline alongside "shown once" dialog — confusing | 129_QA_TESTER (BUG-04) |
| 129_LOW_03 | `keys/route.ts:144` | Rate limit variable naming concern (rateLimit_rpm near rateLimit function) | 129_QA_TESTER (BUG-05) |
| 129_LOW_04 | `auto-responses/route.ts:200` | DELETE uses query param while PATCH uses body — inconsistent API design | 129_QA_TESTER (BUG-11) |
| 129_LOW_05 | `business-hours/route.ts` GET | Business hours GET has no rate limiting | 129_QA_TESTER (BUG-12) |
| 129_LOW_06 | `knowledge-base-manager.tsx`, `agent-builder.tsx` | Raw fetch patterns instead of useMutation (RQ-3, RQ-4) | 129_FRONTEND_DEV |
| 129_LOW_07 | `usage-analytics.tsx` | No staleTime — refetches on every mount | 129_FRONTEND_DEV (RQ-6) |
| 129_LOW_08 | `cron/log-alerts/route.ts:19` | Auth fails open when CRON_SECRET is unset | 129_BACKEND_DEV (L1) |
| 129_LOW_09 | `conversation-analysis.ts:57` | Abandonment detection is time-unaware — 30-second-old conversation marked abandoned | 129_BACKEND_DEV (L7) |
| 129_LOW_10 | `rag-evaluation.ts:63` | Returns groundednessScore 1.0 for 0 claims — misleading | 129_BACKEND_DEV (L8) |
| 129_LOW_11 | `file-processors.ts` | Does not handle corrupt files gracefully — generic error | 129_BACKEND_DEV (L9) |
| 129_LOW_12 | `log-alerting.ts:118-122` | Incomplete ReDoS protection — user-supplied regex not validated for catastrophic backtracking | 129_BACKEND_DEV (L10) |
| 129_LOW_13 | `knowledge-base.ts:28-55` | SSRF check missing IPv6 private ranges (fe80::, fd00::, fc00::) | 129_SECURITY_AUDITOR (LOW-01) |
| 129_LOW_14 | `audit-log.ts` | Hash chain not enforced at write time in application code | 129_SECURITY_AUDITOR (LOW-03) |
| 129_LOW_15 | `file-processors.ts:11` | No file size guard in processFile() — large file could cause memory exhaustion | 129_SECURITY_AUDITOR (LOW-04) |

---

## AREA: 350 (Ultra / Mission Control)

### CRITICAL

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 350_CRIT_01 | `dependencies/route.ts:99` | Cross-user dependency deletion — no user_id check; any authenticated user can delete any dependency | 350_FIX_VERIFICATION (FIX-03), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |
| 350_CRIT_02 | `tasks/queue/route.ts:4-10` | Task queue route lacks guardMCRoute — no Ultra plan check, no rate limiting; any authenticated user can access | 350_FIX_VERIFICATION (FIX-04), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 350_HIGH_01 | `tasks/route.ts:105` | estimated_hours uses `||` not `??` — setting 0 stores null | 350_FIX_VERIFICATION (FIX-06), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |
| 350_HIGH_02 | `events/route.ts:7-14` | "error" not in VALID_EVENT_TYPES — API rejects error event POSTs while frontend displays them | 350_FIX_VERIFICATION (FIX-08), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |
| 350_HIGH_03 | `event-feed.tsx:108` | Event pagination replaces instead of appends — clicking "Load more" loses previous page | 350_FIX_VERIFICATION (FIX-18), 350_QA_POSTFIX |
| 350_HIGH_04 | No routes | No column_id or priority enum validation on any task route — accepts arbitrary strings | 350_FIX_VERIFICATION (FIX-12), 350_BACKEND_POSTFIX |
| 350_HIGH_05 | No routes | No string length validation on any route except events — unbounded strings accepted | 350_FIX_VERIFICATION (FIX-13), 350_BACKEND_POSTFIX |
| 350_HIGH_06 | `tasks/[id]/route.ts:227` | Soft delete completely unimplemented — hard delete only, no undo-delete path | 350_FIX_VERIFICATION (FIX-15) |
| 350_HIGH_07 | `reviews/route.ts:114-120` | Review approval bypasses dependency check — task moved to "done" without checking unfinished deps | 350_QA_POSTFIX (NEW-BUG-01) |
| 350_HIGH_08 | `reviews/route.ts:114-120` | Review approval doesn't fire automation rules — inconsistent trigger behavior | 350_QA_POSTFIX (NEW-BUG-02) |
| 350_HIGH_09 | `reviews/route.ts:114-120` | Review approval doesn't emit realtime event — board won't update in real-time | 350_QA_POSTFIX (NEW-BUG-03) |
| 350_HIGH_10 | `comments/route.ts` POST, `reviews/route.ts` POST | POST routes for comments/reviews don't verify task ownership — can add to other users' tasks | 350_FIX_VERIFICATION (FIX-11), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |
| 350_HIGH_11 | `reviews/route.ts:92` | Reviewer field still accepts client input as primary value — can impersonate any name | 350_FIX_VERIFICATION (FIX-21), 350_BACKEND_POSTFIX |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 350_MED_01 | `dependencies/route.ts:59-68` | Circular dependency detection is shallow (depth 1 only) — A->B->C->A not detected | 350_FIX_VERIFICATION (FIX-02C), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |
| 350_MED_02 | `tasks/reorder/route.ts:45` | Reorder doesn't clear completed_at when moving OUT of done — task appears completed when it's not | 350_FIX_VERIFICATION (FIX-07), 350_QA_POSTFIX, 350_BACKEND_POSTFIX |
| 350_MED_03 | `mc-event-bus.ts`, `stream/route.ts` | Old SSE EventBus still imported/used in API routes — API routes don't broadcast via Supabase Realtime | 350_FIX_VERIFICATION (FIX-10), 350_QA_POSTFIX |
| 350_MED_04 | `types/mission-control.ts:112` | cost_usd still in MCSession type and trace_data — violates "no cost shown" rule | 350_FIX_VERIFICATION (FIX-52), 350_QA_POSTFIX |
| 350_MED_05 | `task-board.tsx:1327-1339` | Drag-drop persistence reads stale state for same-column reorder — position may be off by one | 350_QA_POSTFIX (NEW-BUG-04), 350_FRONTEND_POSTFIX |
| 350_MED_06 | `agent-roster.tsx:53-65` | Agent roster ref + forceRender anti-pattern — fragile, breaks if polling disabled | 350_QA_POSTFIX (NEW-BUG-05) |
| 350_MED_07 | `session-tracker.tsx:75-80` | Session tracker useEffect has stale closure — re-render loop on every 3s poll | 350_QA_POSTFIX (NEW-BUG-06), 350_FRONTEND_POSTFIX |
| 350_MED_08 | `mc-route-guard.ts:70-78` | Body size check trusts Content-Length header — client can spoof | 350_FIX_VERIFICATION (FIX-14), 350_BACKEND_POSTFIX |
| 350_MED_09 | `tasks/reorder/route.ts` | Reorder items not individually validated — no UUID, column enum, or position checks | 350_FIX_VERIFICATION (FIX-22), 350_BACKEND_POSTFIX |
| 350_MED_10 | `tasks/bulk-action/route.ts:32` | Bulk action "move" to "done" does not set completed_at; move out does not clear it | 350_BACKEND_POSTFIX (Finding B) |
| 350_MED_11 | `tasks/queue/route.ts:114` | Queue route logs wrong event_type "task_complete" instead of "task_assigned" | 350_BACKEND_POSTFIX (Finding A) |
| 350_MED_12 | `mc-automation.ts:37-40` | Automation rule run_count has race condition — concurrent rules lose increments | 350_BACKEND_POSTFIX (Finding E) |
| 350_MED_13 | `task-board.tsx` (1,536 lines) | Not split into separate files as specified — largest file in MC | 350_FIX_VERIFICATION (FIX-58), 350_FRONTEND_POSTFIX |
| 350_MED_14 | `agent-roster.tsx`, `session-tracker.tsx` | Polling too aggressive — 2s and 3s respectively, should be 5-10s | 350_FRONTEND_POSTFIX |
| 350_MED_15 | MC components | Missing ARIA on drag handles, swimlane expand, calendar cells | 350_FRONTEND_POSTFIX |
| 350_MED_16 | Swimlane view mobile | 7 columns at 150px = 1050px minimum — poor mobile UX | 350_UX_POSTFIX |

### LOW

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| 350_LOW_01 | `metrics/route.ts:53` | success_rate_percent returns decimal not integer | 350_FIX_VERIFICATION (FIX-43) |
| 350_LOW_02 | 8 MC files | Multiple text-[9px] and text-[10px] usages — below WCAG minimum | 350_FIX_VERIFICATION (FIX-47), 350_FRONTEND_POSTFIX |
| 350_LOW_03 | `task-board.tsx` TaskCardContent | No tabIndex, role, or aria attributes on task cards | 350_FIX_VERIFICATION (FIX-48) |
| 350_LOW_04 | `task-board.tsx:396` | Search input has no debounce | 350_FIX_VERIFICATION (FIX-46), 350_FRONTEND_POSTFIX |
| 350_LOW_05 | Calendar view line 791 | monthName in week view shows wrong month when week crosses boundary | 350_FIX_VERIFICATION (FIX-51) |
| 350_LOW_06 | `statuses/route.ts` | Color field not validated as hex regex — any string accepted | 350_FIX_VERIFICATION (FIX-32) |
| 350_LOW_07 | `automation-rules/route.ts:32-36` | trigger_type and action_type not validated against whitelists | 350_FIX_VERIFICATION (FIX-33) |
| 350_LOW_08 | `comments/route.ts:57` | mentions array not validated for max items, type, or length | 350_FIX_VERIFICATION (FIX-35) |
| 350_LOW_09 | `event-feed.tsx:113-121, 153-159` | Events double-filtered — server-side AND client-side (redundant) | 350_QA_POSTFIX (NEW-BUG-07) |
| 350_LOW_10 | `event-feed.tsx:363` | Session link uses /mission-control/sessions — may not work if middleware doesn't cover | 350_QA_POSTFIX (NEW-BUG-08) |
| 350_LOW_11 | `mission-control-overview.tsx:113-120` | Overview query key collision with event feed — may show different data | 350_QA_POSTFIX (NEW-BUG-09) |
| 350_LOW_12 | `task-detail-modal.tsx:7` | Unused Calendar import from lucide-react | 350_FRONTEND_POSTFIX |
| 350_LOW_13 | `activities/route.ts` | VPS path has no limit cap — passes limit directly without validation | 350_BACKEND_POSTFIX (Finding D) |

### UX ISSUES (from 350_UX_POSTFIX)

| ID | Description | Sources |
|----|-------------|---------|
| 350_UX_01 | No automation rules UI — backend built, frontend missing entirely; users cannot access the feature | 350_UX_POSTFIX |
| 350_UX_02 | No dependencies UI — API built, no visual way to add/view dependencies | 350_UX_POSTFIX |
| 350_UX_03 | No column selector on create task dialog — always goes to Planning | 350_UX_POSTFIX |
| 350_UX_04 | Command palette is just navigation — no task search, quick actions, or agents control | 350_UX_POSTFIX |
| 350_UX_05 | Agent roster status filter UI missing — state declared, no buttons rendered | 350_UX_POSTFIX |
| 350_UX_06 | Overview "+X more" only for tasks — not agents, events, or sessions | 350_UX_POSTFIX |
| 350_UX_07 | Accessibility below acceptable — 9-10px text, near-zero ARIA attributes, no focus indicators | 350_UX_POSTFIX |

---

## AREA: V1 API

### CRITICAL

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| V1_CRIT_01 | All V1 routes | Auth boilerplate duplicated 25+ times (~20 lines each) — 2 DB queries per handler x 25 = 50 redundant calls | V1_API_BACKEND, V1_API_SECURITY, V1_API_QA_TESTER (BUG-026) |
| V1_CRIT_02 | No global limit | No global request body size limit — 100MB JSON parsed into memory before validation | V1_API_SECURITY (#6), V1_API_QA_TESTER (BUG-030) |
| V1_CRIT_03 | `chat/batch/route.ts:37` webhook_url | Batch webhook_url stored but never validated for SSRF — attacker can scan internal network | V1_API_SECURITY (#13) |

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| V1_HIGH_01 | `chat/route.ts:81-106` | Chat endpoint mixes 3 incompatible error formats — structured, manual, and flat string | V1_API_CONSUMER (BUG-01), V1_API_QA_TESTER (BUG-002), V1_API_BACKEND |
| V1_HIGH_02 | 5 endpoints | Missing plan check — batch/:id, files/:id GET/DELETE, predictions/:id, threads/:id/messages GET | V1_API_QA_TESTER (BUG-005), V1_API_BACKEND |
| V1_HIGH_03 | 11+ endpoints | No rate limiting — DELETE /agents/:id triggers SSH, could exhaust connections | V1_API_QA_TESTER (BUG-006), V1_API_SECURITY (#4), V1_API_BACKEND |
| V1_HIGH_04 | `chat/route.ts:290-358` | Streaming has no max duration/bytes — slow upstream keeps connection open indefinitely | V1_API_SECURITY (#7) |
| V1_HIGH_05 | `moderation.ts` | Content moderation library exists but NOT called by any V1 endpoint | V1_API_SECURITY (#16) |
| V1_HIGH_06 | `chat/batch/route.ts:135` | Batch results leak upstream error details (connection strings, hostnames) | V1_API_SECURITY (#17b) |
| V1_HIGH_07 | `chat/batch/route.ts` | Batch webhook_url is stored but never dispatched — dead feature | V1_API_CONSUMER (BUG-02), V1_API_QA_TESTER (BUG-017), V1_API_BACKEND |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| V1_MED_01 | `health/route.ts` | Health endpoint has no request_id tracking and no rate limiting | V1_API_QA_TESTER (BUG-001), V1_API_CONSUMER |
| V1_MED_02 | `conversations/route.ts`, `conversations/[id]/messages/route.ts` | Old response format — no request IDs, flat error strings | V1_API_QA_TESTER (BUG-003), V1_API_CONSUMER |
| V1_MED_03 | `threads/[id]/messages/route.ts` POST | No message length limit on thread messages — multi-MB messages accepted | V1_API_QA_TESTER (BUG-007), V1_API_SECURITY |
| V1_MED_04 | `threads/route.ts:63` | No metadata size or depth limit — arbitrarily large JSON stored | V1_API_QA_TESTER (BUG-008), V1_API_SECURITY (#5e) |
| V1_MED_05 | `chat/batch/route.ts` | No validation on individual batch request items — custom_id and message not checked | V1_API_QA_TESTER (BUG-009) |
| V1_MED_06 | `files/route.ts` | MIME type check trusts client-declared Content-Type — no magic byte validation | V1_API_QA_TESTER (BUG-010), V1_API_SECURITY (#10a) |
| V1_MED_07 | `conversations/route.ts` | NaN propagation from bad limit/offset params — negative values not clamped | V1_API_QA_TESTER (BUG-011) |
| V1_MED_08 | `conversations/route.ts:68` | ilike wildcards not escaped — % and _ allow broader matching than intended | V1_API_QA_TESTER (BUG-012), V1_API_SECURITY (#5a) |
| V1_MED_09 | `chat/route.ts` streaming | Streaming response missing X-Request-Id header | V1_API_QA_TESTER (BUG-014), V1_API_CONSUMER, V1_API_FRONTEND, V1_API_BACKEND |
| V1_MED_10 | All V1 routes | No rate limit headers ever sent on success responses — consumers blind until 429 | V1_API_CONSUMER |
| V1_MED_11 | Multiple endpoints | 4 different pagination patterns across endpoints — inconsistent DX | V1_API_CONSUMER, V1_API_BACKEND |
| V1_MED_12 | `files/route.ts` POST | Binary files (PDF, images) stuck in "processing" forever — no background job triggered | V1_API_CONSUMER (BUG-03) |
| V1_MED_13 | `files/[id]/route.ts` DELETE | File DELETE does not clean up Supabase Storage — orphaned files accumulate | V1_API_CONSUMER (BUG-04), V1_API_QA_TESTER (BUG-023) |
| V1_MED_14 | `conversations/[id]/messages` vs `threads/[id]/messages` | Message order is descending in conversations but ascending in threads — inconsistent | V1_API_CONSUMER (BUG-07) |
| V1_MED_15 | `predictions/[id]/route.ts` | Predictions GET endpoint exists but no POST creation endpoint — orphaned endpoint | V1_API_CONSUMER (BUG-06) |
| V1_MED_16 | `chat/route.ts:101-106` | Message character limit error says "100KB" but check counts characters not bytes | V1_API_CONSUMER (BUG-05) |
| V1_MED_17 | 3 files | Thinking-tag stripping duplicated with inconsistent coverage — batch only strips 2 of 5 patterns | V1_API_BACKEND |
| V1_MED_18 | `chat/batch/route.ts` | Fire-and-forget processBatch — serverless function can kill mid-execution | V1_API_BACKEND |
| V1_MED_19 | 13 route files | Missing try/catch — unhandled exception returns generic HTML 500 | V1_API_BACKEND |
| V1_MED_20 | `chat/batch/route.ts` | No concurrent batch limit per user — unlimited queued work | V1_API_SECURITY (#8) |
| V1_MED_21 | No endpoint | No auth failure logging — brute-force undetectable | V1_API_SECURITY (#20) |
| V1_MED_22 | `idempotency.ts` | Idempotency module exists but never imported by any V1 endpoint — dead code | V1_API_CONSUMER, V1_API_SECURITY (#12), V1_API_BACKEND |

### LOW

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| V1_LOW_01 | `chat/route.ts:48-52` vs others | Revoked key error message inconsistency — confirms key existed on some endpoints | V1_API_QA_TESTER (BUG-004), V1_API_SECURITY (#2) |
| V1_LOW_02 | `usage/route.ts` | NaN propagation in days param — parseInt("abc") causes invalid date | V1_API_QA_TESTER (BUG-013) |
| V1_LOW_03 | `chat/route.ts` streaming | No error event sent on mid-stream failure — truncated stream with no indication | V1_API_QA_TESTER (BUG-015) |
| V1_LOW_04 | `chat/route.ts` streaming | No per-read timeout on streaming — slow VPS keeps connection alive | V1_API_QA_TESTER (BUG-016) |
| V1_LOW_05 | `api_batches` table | Batch records never cleaned up — table grows unbounded | V1_API_QA_TESTER (BUG-018) |
| V1_LOW_06 | `chat/batch/route.ts:94` | processBatch silently returns on missing dashboardUrl — batch stuck in "processing" | V1_API_QA_TESTER (BUG-019) |
| V1_LOW_07 | `threads/[id]/route.ts` DELETE | Thread deletion may orphan messages if no CASCADE FK | V1_API_QA_TESTER (BUG-020) |
| V1_LOW_08 | `threads/[id]/messages/route.ts` POST | Thread context capped at 20 messages silently — no documentation | V1_API_QA_TESTER (BUG-021) |
| V1_LOW_09 | `files/route.ts:96-99` | Storage upload failure silently swallowed — file record created but file not stored | V1_API_QA_TESTER (BUG-022) |
| V1_LOW_10 | `health/route.ts:67-71` | Health endpoint returns agent names and rate limit — information leakage | V1_API_QA_TESTER (BUG-025), V1_API_SECURITY (#17c) |
| V1_LOW_11 | No V1 endpoint | No CORS headers — browser-based clients cannot call cross-origin | V1_API_QA_TESTER (BUG-029) |
| V1_LOW_12 | `files/route.ts:90` | Filename not sanitized for storage path — potential path traversal | V1_API_SECURITY (#10b) |
| V1_LOW_13 | `threads/[id]/messages/route.ts` POST | No analytics tracking — usage dashboards undercount thread requests | V1_API_BACKEND |
| V1_LOW_14 | `api-errors.ts` | Dead code: rateLimitHeaders(), content_blocked, request_in_progress error codes never used | V1_API_BACKEND |

### V1 API FRONTEND

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| V1_FE_01 | `api-playground.tsx` | Playground sends to /api/v1/chat without API key — always gets 401 | V1_API_FRONTEND |
| V1_FE_02 | `api-playground.tsx:193` | Streaming demo doesn't update UI incrementally — result only shows after full stream | V1_API_FRONTEND |
| V1_FE_03 | `api-access-manager.tsx` | Zero ARIA attributes in ApiAccessManager or ApiPlayground | V1_API_FRONTEND |
| V1_FE_04 | `api-playground.tsx:315` | Playground grid-cols-2 doesn't collapse on mobile | V1_API_FRONTEND |
| V1_FE_05 | `api-docs.tsx:29` | Hardcoded BASE_URL (app.clawhq.tech) instead of using window.location.origin | V1_API_FRONTEND |
| V1_FE_06 | `api-access-manager.tsx:149` | JS streaming code example uses Node-only process.stdout.write | V1_API_FRONTEND |
| V1_FE_07 | `api-access-manager.tsx:208` | Python conversations example uses f-string with $ prefix (JS artifact) | V1_API_FRONTEND |
| V1_FE_08 | `api-docs.tsx` | stream parameter not documented in formal docs Chat API section | V1_API_FRONTEND |
| V1_FE_09 | `api-access-manager.tsx` | Rate limit inline edit has no cancel/close mechanism | V1_API_FRONTEND |

---

## AREA: Landing Page

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| LAND_HIGH_01 | All landing components | No prefers-reduced-motion support — infinite marquee, pulsing dots, auto-cycling all animate for vestibular disorder users | LANDING_FRONTEND |
| LAND_HIGH_02 | `Comparison.tsx`, `Pricing.tsx` | Comparison/pricing tables overflow horizontally on mobile with no scroll indicator | LANDING_FRONTEND |
| LAND_HIGH_03 | `Navbar.tsx` | Mobile menu toggle has no aria-label | LANDING_FRONTEND |
| LAND_HIGH_04 | `FAQ.tsx` | FAQ accordion not ARIA-compliant — no aria-expanded, aria-controls, or role | LANDING_FRONTEND |
| LAND_HIGH_05 | All landing components | No lazy loading — all 14 sections rendered immediately, no next/dynamic | LANDING_FRONTEND |
| LAND_HIGH_06 | Hero section | No product visual above the fold — text only, no screenshot/mockup/video | LANDING_UX_CONVERSION |
| LAND_HIGH_07 | Entire page | Zero social proof — no testimonials, customer logos, case studies | LANDING_UX_CONVERSION |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| LAND_MED_01 | `ChatMockup` | Infinite typing loop at 20ms (50fps) with state updates every tick — expensive on mobile | LANDING_FRONTEND |
| LAND_MED_02 | `KanbanMockup` | Auto-move card reset causes visual "jump" when all cards exhausted | LANDING_FRONTEND |
| LAND_MED_03 | `Stats.tsx` | Stats component buttons lack aria-label or aria-current | LANDING_FRONTEND |
| LAND_MED_04 | `ProductTour.tsx` | Tab buttons implemented without role=tablist/tab/tabpanel or aria-selected | LANDING_FRONTEND |
| LAND_MED_05 | No skip-to-content link | Users must tab through entire navbar before reaching content | LANDING_FRONTEND |
| LAND_MED_06 | Focus indicators | Rely on browser defaults — may be invisible on dark backgrounds | LANDING_FRONTEND |
| LAND_MED_07 | `layout.tsx` | Missing og:image for social sharing — no preview card image | LANDING_FRONTEND, LANDING_BACKEND (M-2) |
| LAND_MED_08 | `layout.tsx` | Missing og:url and metadataBase | LANDING_BACKEND (M-1, M-3) |
| LAND_MED_09 | No robots.ts or sitemap.ts | Important for search engine discovery | LANDING_BACKEND (M-5) |
| LAND_MED_10 | `src/middleware.ts`, `next.config.ts` | No Content-Security-Policy headers | LANDING_SECURITY |
| LAND_MED_11 | `src/middleware.ts`, `next.config.ts` | No HSTS, X-Frame-Options, X-Content-Type-Options headers | LANDING_SECURITY |
| LAND_MED_12 | `HowItWorks.tsx` | Nested boxes indentation reaches ~96px on mobile — very narrow content | LANDING_FRONTEND |
| LAND_MED_13 | `/docs`, `/terms`, `/privacy` not in middleware matcher | No session refresh on public pages — session could expire during docs reading | LANDING_BACKEND (MW-1) |

### LOW

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| LAND_LOW_01 | `Navbar.tsx:87` | Logo href="#" — dead link, should be "/" | LANDING_FRONTEND, LANDING_QA_TESTER (BUG-001), LANDING_UX_CONVERSION |
| LAND_LOW_02 | `VPSHealthMockup` | Potential interval leak — inner interval cleanup not called on fast unmount | LANDING_FRONTEND |
| LAND_LOW_03 | `globals.css` | No scroll-behavior: smooth — anchor clicks snap-jump | LANDING_FRONTEND |
| LAND_LOW_04 | `CTA.tsx` | Giant text glow layer clone missing aria-hidden="true" | LANDING_FRONTEND |
| LAND_LOW_05 | `DashboardShowcase.tsx`, `Architecture.tsx` | Exist but not imported — dead components | LANDING_FRONTEND |
| LAND_LOW_06 | 8 mockup components | Not imported on landing page — may be unused across entire app | LANDING_FRONTEND |
| LAND_LOW_07 | `Features.tsx` | Injects <style> tag inside component body — anti-pattern | LANDING_FRONTEND |
| LAND_LOW_08 | `Footer.tsx:59` | GitHub link missing target="_blank" rel="noopener noreferrer" | LANDING_SECURITY |
| LAND_LOW_09 | `layout.tsx` | Missing og:siteName and canonical URL | LANDING_BACKEND (M-4, M-6) |

### UX/CONVERSION ISSUES

| ID | Description | Sources |
|----|-------------|---------|
| LAND_UX_01 | Page section order suboptimal — Stats too early, WhyClawHQ after Pricing (should be before) | LANDING_UX_CONVERSION |
| LAND_UX_02 | No free trial, no demo, no freemium — $59/mo is high-friction first ask | LANDING_UX_CONVERSION |
| LAND_UX_03 | No CTA after Comparison section (most convincing section) | LANDING_UX_CONVERSION |
| LAND_UX_04 | Page too long — 13 sections, users may not reach Pricing | LANDING_UX_CONVERSION |
| LAND_UX_05 | Solutions dropdown links all go to #features — not granular | LANDING_UX_CONVERSION |

### TERMS/PRIVACY QA

| ID | Description | Sources |
|----|-------------|---------|
| LAND_QA_01 | Terms feature descriptions conflict with landing page — Starter says "Single agent" vs 7 free agents; Mission Control listed as Pro instead of Ultra-only | LANDING_QA_TESTER (BUG-002) |
| LAND_QA_02 | Navbar logo casing inconsistency — "clawhq" vs "ClawHQ" across pages | LANDING_QA_TESTER |

---

## AREA: Docs

### CRITICAL

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| DOCS_CRIT_01 | `docs/billing/page.tsx:43-57` | Billing page plan data wildly contradicts Plans page on VPS specs, agent limits, channel limits, pricing | DOCS_CONTENT_ACCURACY (C1), DOCS_UX_READER, DOCS_QA_TESTER |
| DOCS_CRIT_02 | `docs/pro/page.tsx:152-208` | Pro overview contradicts Plans page — says Starter has "2 channels" when Plans says "All 7" | DOCS_CONTENT_ACCURACY (C2) |
| DOCS_CRIT_03 | `docs/api/models/page.tsx`, `docs/api/agents/page.tsx` | Provider-branded model names (GPT-4o, Claude 3.5, Gemini) — violates naming rules | DOCS_CONTENT_ACCURACY (C3), DOCS_SECURITY, DOCS_QA_TESTER |
| DOCS_CRIT_04 | `tailwind.config.ts:91` | @tailwindcss/typography not in plugins — prose/prose-invert classes do nothing; all doc page typography unstyled | DOCS_FRONTEND (C1) |
| DOCS_CRIT_05 | 3 broken links | /docs/monitoring, /docs/knowledge-base, /docs/analytics — pages don't exist | DOCS_CONTENT_ACCURACY (C5), DOCS_QA_TESTER, DOCS_UX_READER |

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| DOCS_HIGH_01 | `docs/layout.tsx:33-40` | Right-side "On this page" TOC is empty placeholder — no auto-generation | DOCS_FRONTEND (H1), DOCS_UX_READER, DOCS_QA_TESTER |
| DOCS_HIGH_02 | `docs-nav.tsx` | Search is title-filter only — no content search, no keyboard shortcut, no empty state | DOCS_FRONTEND (H2) |
| DOCS_HIGH_03 | `docs-nav.tsx` MobileDocsNav | Mobile sidebar does not auto-close on navigation | DOCS_FRONTEND (H3) |
| DOCS_HIGH_04 | `code-block.tsx` | No syntax highlighting in code blocks — plain monospace text | DOCS_FRONTEND (H4), DOCS_UX_READER |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| DOCS_MED_01 | `docs/api/auth/page.tsx` vs `docs/pro/api/page.tsx` | API base URL inconsistency — app.clawhq.tech vs yourname.clawhq.tech | DOCS_CONTENT_ACCURACY (C4), DOCS_UX_READER |
| DOCS_MED_02 | `docs/faq/page.tsx:236-242` | FAQ says "no fixed limit" on agents — contradicts billing/pro pages | DOCS_CONTENT_ACCURACY (M1) |
| DOCS_MED_03 | `docs/api/webhooks` page | Nav label "Webhooks API" leads to page about Conversations/Threads/Usage/Health — completely wrong label | DOCS_CONTENT_ACCURACY (M3), DOCS_UX_READER |
| DOCS_MED_04 | `docs/support/page.tsx:212,220` | Links to /docs/knowledge-base for "self-service" — should be /docs/faq | DOCS_CONTENT_ACCURACY (M4) |
| DOCS_MED_05 | `docs/channels/page.tsx:9-11` | WhatsApp listed as admin-assisted but is actually QR-code self-service | DOCS_CONTENT_ACCURACY (M5) |
| DOCS_MED_06 | `docs-sidebar.tsx` | Legacy sidebar references /docs/webhooks and /docs/knowledge-base — 404 links | DOCS_FRONTEND (C2), DOCS_UX_READER |
| DOCS_MED_07 | Plans/Billing/FAQ | Enterprise pricing shown as "$999+/mo" in some places and "Custom" in others | DOCS_CONTENT_ACCURACY (M7) |
| DOCS_MED_08 | `docs/pro/api/page.tsx:28` vs `docs/faq/page.tsx:318` | API key length inconsistency — clw_ + 32 chars (36 total) vs clw_ + 36 chars (40 total) | DOCS_CONTENT_ACCURACY (M8) |
| DOCS_MED_09 | `docs/pro/model-playground/page.tsx:185-188` | "per-token costs" language implies usage-based billing — contradicts flat-rate model | DOCS_CONTENT_ACCURACY (M9) |
| DOCS_MED_10 | `docs-nav.tsx` vs `docs-sidebar.tsx` | Two separate sidebar/layout systems with different styling — inconsistent | DOCS_FRONTEND (M1) |
| DOCS_MED_11 | All prose doc pages | No anchor links on headings — cannot deep-link to sections | DOCS_FRONTEND (M4) |
| DOCS_MED_12 | `docs-sidebar.tsx` and `docs-header.tsx` | Duplicate DOC_PAGES arrays — changes to one won't reflect in other | DOCS_FRONTEND (M6) |
| DOCS_MED_13 | `docs/pro/api/page.tsx` vs `docs/api/chat/page.tsx` | SSE streaming format differs — chunk/done vs content/[DONE] | DOCS_UX_READER |
| DOCS_MED_14 | `docs/pro/api/page.tsx` vs `docs/api/chat/page.tsx` | Response field name differs — data.reply vs data.response | DOCS_UX_READER |
| DOCS_MED_15 | All 36 pages | Zero screenshots or diagrams — purely text documentation | DOCS_UX_READER |

### LOW

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| DOCS_LOW_01 | `docs/dashboard/page.tsx:106` | Notification preferences self-link — links to /docs/dashboard instead of /docs/account | DOCS_CONTENT_ACCURACY (m4), DOCS_QA_TESTER |
| DOCS_LOW_02 | `docs/dashboard/page.tsx:168` | Upgrade link points to /docs/models instead of /docs/billing | DOCS_CONTENT_ACCURACY (M2) |
| DOCS_LOW_03 | `docs/api/models/page.tsx:46` | "cost-effective" language implies per-model pricing | DOCS_CONTENT_ACCURACY (m3) |
| DOCS_LOW_04 | `docs-nav.tsx:161-172` | Mobile nav z-index fragile — button and sidebar both z-50 | DOCS_FRONTEND (L3) |
| DOCS_LOW_05 | `docs-nav.tsx:127` | DocsNav logo links to / instead of /docs | DOCS_FRONTEND (L4) |
| DOCS_LOW_06 | `docs-nav.tsx` | No "no results" message when search returns empty | DOCS_FRONTEND (L1) |
| DOCS_LOW_07 | `components/docs/api-docs.tsx:32` | Inconsistent API key placeholder — YOUR_API_KEY vs clw_your_api_key_here | DOCS_SECURITY |
| DOCS_LOW_08 | `components/docs/knowledge-base-docs.tsx:266` | "Supabase Storage" exposed in user-facing docs text | DOCS_SECURITY, NAMING_SECRETS_SCAN |
| DOCS_LOW_09 | `docs/vps/page.tsx:90-94` | Internal service ports documented (18789, 5555, 5556) | DOCS_SECURITY |

---

## AREA: Admin

### CRITICAL

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| ADMIN_CRIT_01 | `admin/layout.tsx` | 2FA bypass — admin layout does NOT check MFA assurance level; 2FA is effectively decorative | ADMIN_QA_TESTER (A1/S1) |
| ADMIN_CRIT_02 | `admin/customers/[id]/route.ts` DELETE | Customer deletion does not deprovision VPS — orphaned servers remain running with valid SSH credentials | ADMIN_SECURITY |
| ADMIN_CRIT_03 | `admin/customers/[id]/full/route.ts` | GET /full returns SSH password, dashboard password, and data API token all in one response | ADMIN_SECURITY |

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| ADMIN_HIGH_01 | `admin/vps-password/route.ts` GET | Credential access not audit-logged | ADMIN_SECURITY |
| ADMIN_HIGH_02 | `admin/customers/[id]/full/route.ts` | Customer data view (includes credentials) not audit-logged | ADMIN_SECURITY, ADMIN_BACKEND |
| ADMIN_HIGH_03 | Admin login/session | Admin login events not audit-logged | ADMIN_SECURITY |
| ADMIN_HIGH_04 | `admin/customers/[id]/route.ts` DELETE | Customer deletion does not clean up DNS records, Storage files, or VPS-hosted data | ADMIN_SECURITY |
| ADMIN_HIGH_05 | `admin/customers/bulk/route.ts` | No batch size limit on userIds array — unbounded IN() clause | ADMIN_BACKEND, ADMIN_SECURITY |
| ADMIN_HIGH_06 | `admin/provision/route.ts` GET:92-127 | Missing admin role check — any authenticated user can poll provisioning status | ADMIN_QA_TESTER (G3/S2), ADMIN_BACKEND |
| ADMIN_HIGH_07 | `admin/provision/route.ts:86` | Audit log records "provisioned" before provisioning actually completes | ADMIN_QA_TESTER (G1), ADMIN_BACKEND |
| ADMIN_HIGH_08 | `admin-customer-detail.tsx` (1180 lines) | Must be split — too large, contains 6+ inline sub-components | ADMIN_FRONTEND |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| ADMIN_MED_01 | `admin/customers/bulk/route.ts` | No rate limiting on bulk operations | ADMIN_SECURITY, ADMIN_BACKEND |
| ADMIN_MED_02 | Multiple admin routes | SSH error messages leak internal details to client | ADMIN_SECURITY, ADMIN_QA_TESTER |
| ADMIN_MED_03 | Supabase defaults | No custom admin session timeout — uses Supabase 1-hour default | ADMIN_SECURITY |
| ADMIN_MED_04 | `admin/provision/route.ts:173-178` | SSL/HTTPS failures silently swallowed — empty if-blocks | ADMIN_BACKEND |
| ADMIN_MED_05 | `admin/customers/[id]/route.ts` DELETE | Cascade delete swallows error details — no indication which step failed | ADMIN_BACKEND |
| ADMIN_MED_06 | `admin/api-keys/route.ts` DELETE | Does not check DB delete result before re-pushing keys to VPS | ADMIN_BACKEND |
| ADMIN_MED_07 | `admin-subscription-editor.tsx` | Shows stale data after save — subscription prop not refreshed | ADMIN_QA_TESTER (E3) |
| ADMIN_MED_08 | `admin-subscription-editor.tsx` | Negative price accepted — no validation that price >= 0 | ADMIN_QA_TESTER (E4) |
| ADMIN_MED_09 | `admin-ticket-thread.tsx` | Optimistic message update uses wrong ID — database ID differs from local UUID | ADMIN_QA_TESTER (F1) |
| ADMIN_MED_10 | `admin/tickets/[id]/route.ts:77-89` | Double-update in ticket reply — two separate UPDATE queries | ADMIN_QA_TESTER (F2) |
| ADMIN_MED_11 | `admin/page.tsx:57` | Pro customer count includes Enterprise — double-counting | ADMIN_QA_TESTER (A3) |
| ADMIN_MED_12 | `admin/page.tsx` | ARR calculation naive — MRR x 12 ignores annual billing cycles | ADMIN_QA_TESTER (A4) |
| ADMIN_MED_13 | `admin-customer-detail.tsx:424` | Race condition in service re-checks — multiple concurrent checks from rapid action clicks | ADMIN_QA_TESTER (C2) |
| ADMIN_MED_14 | `admin-vps-editor.tsx` | IP change does not update DNS records or firewall rules | ADMIN_QA_TESTER (K1) |
| ADMIN_MED_15 | `admin/customers/[id]/actions/route.ts` | Does not check VPS running status before SSH — hangs 10s on stopped VPS | ADMIN_QA_TESTER (D1) |
| ADMIN_MED_16 | No admin endpoints | No cache invalidation after mutations — must manually refresh | ADMIN_QA_TESTER (X1) |
| ADMIN_MED_17 | All admin API endpoints | No rate limiting on any admin API endpoint | ADMIN_QA_TESTER (X2) |
| ADMIN_MED_18 | 7 instances across admin components | `any` type usages — audit logs, VPS health, customers untyped | ADMIN_FRONTEND |
| ADMIN_MED_19 | `admin-customer-detail.tsx`, `admin-api-keys.tsx`, `admin-dashboard-auth.tsx` | Manual useState/useEffect/fetch instead of React Query | ADMIN_FRONTEND |
| ADMIN_MED_20 | `admin-dashboard-auth.tsx:28`, `admin-api-keys.tsx:69` | Empty catch blocks — errors silently swallowed | ADMIN_FRONTEND |
| ADMIN_MED_21 | `admin-audit-logs.tsx` filter bar | Fixed w-[200px] selects break on narrow screens | ADMIN_FRONTEND |
| ADMIN_MED_22 | All admin icon-only buttons | Missing aria-label on eye/copy/delete buttons | ADMIN_FRONTEND |
| ADMIN_MED_23 | `admin-customers.tsx`, `admin-bulk-health.tsx` | Table rows use onClick but not keyboard-accessible (no tabIndex/onKeyDown) | ADMIN_FRONTEND |
| ADMIN_MED_24 | `admin/provision/route.ts` | Single-process concurrency guard — won't work in multi-instance deploy | ADMIN_BACKEND |

### LOW

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| ADMIN_LOW_01 | 2FA | 2FA is optional — admin can disable it | ADMIN_SECURITY |
| ADMIN_LOW_02 | All admin routes | No admin-level permission scoping — all admins equal | ADMIN_SECURITY |
| ADMIN_LOW_03 | `admin-vps-health.tsx` | Unused imports (useEffect, AlertTriangle); stopped variable computed but never rendered | ADMIN_FRONTEND |
| ADMIN_LOW_04 | `admin-delete-customer.tsx` | Duplicate delete dialog — same exists inline in admin-customer-detail.tsx | ADMIN_FRONTEND |
| ADMIN_LOW_05 | 3 places | STATUS_CONFIG and PRIORITY_CONFIG duplicated in 3 files — should be shared constants | ADMIN_FRONTEND |
| ADMIN_LOW_06 | `admin-deploy.tsx`, `admin-subscription-editor.tsx` | Labels not linked to inputs via htmlFor/id | ADMIN_FRONTEND |
| ADMIN_LOW_07 | `admin-2fa-setup.tsx`, `verify-2fa page.tsx` | createClient() called inside component body — new client every render | ADMIN_FRONTEND |
| ADMIN_LOW_08 | `admin/api-keys/route.ts:167` | POST returns debug field that could leak internal VPS info | ADMIN_BACKEND |
| ADMIN_LOW_09 | `admin/health/route.ts:107` | Returns 200 on SSH failure — error in body, not status code | ADMIN_BACKEND |
| ADMIN_LOW_10 | `admin/customers/bulk/route.ts` | Suspend only changes subscription — VPS continues running | ADMIN_BACKEND |
| ADMIN_LOW_11 | Actions, health, services, migrate-docker | No command-level timeout on SSH execCommand — hung command blocks until function timeout | ADMIN_BACKEND |
| ADMIN_LOW_12 | 13 admin route files | Duplicated auth boilerplate (12 lines per handler) | ADMIN_BACKEND |
| ADMIN_LOW_13 | `admin/provision/route.ts:175,178` | Empty if-blocks (dead branches) for SSL/HTTPS failures | ADMIN_BACKEND |

### MISSING FEATURES

| ID | Description | Sources |
|----|-------------|---------|
| ADMIN_MISS_01 | SSH terminal not built | ADMIN_QA_TESTER (I1), ADMIN_OPS_MANAGER |
| ADMIN_MISS_02 | Customer impersonation not built | ADMIN_QA_TESTER (J1), ADMIN_OPS_MANAGER |
| ADMIN_MISS_03 | No coupon system | ADMIN_QA_TESTER (E1) |
| ADMIN_MISS_04 | Cannot force-switch a customer's model from admin | ADMIN_OPS_MANAGER |
| ADMIN_MISS_05 | Cannot view customer chat history | ADMIN_OPS_MANAGER |
| ADMIN_MISS_06 | No automated health monitoring/alerts (on-demand only) | ADMIN_OPS_MANAGER |
| ADMIN_MISS_07 | No bulk VPS restart capability | ADMIN_OPS_MANAGER |
| ADMIN_MISS_08 | No customer list pagination | ADMIN_QA_TESTER (B2) |
| ADMIN_MISS_09 | No ticket list pagination | ADMIN_QA_TESTER (F3) |
| ADMIN_MISS_10 | No refund action/button | ADMIN_OPS_MANAGER |
| ADMIN_MISS_11 | No admin-initiated auth password reset | ADMIN_OPS_MANAGER |
| ADMIN_MISS_12 | No revenue history/growth/churn tracking | ADMIN_OPS_MANAGER |

---

## AREA: Database

### CRITICAL

| ID | Description | Sources |
|----|-------------|---------|
| DB_CRIT_01 | `channel_credentials` has no user_id column and no RLS policies — data leak vector | DATABASE_ADMIN |
| DB_CRIT_02 | `ALL_NEW_MIGRATIONS.sql` is a duplicate concatenation — will cause conflicts on deploy | DATABASE_ADMIN |
| DB_CRIT_03 | Timestamp collision: `20260315400000` used by two files | DATABASE_ADMIN |
| DB_CRIT_04 | Timestamp collision: `20260315500000` used by two files | DATABASE_ADMIN |
| DB_CRIT_05 | `kb_feedback.chunk_id` and `document_id` have no FK constraints — orphan rows on delete | DATABASE_ADMIN |
| DB_CRIT_06 | SECURITY DEFINER functions accept p_user_id without validation — user could query another user's KB chunks | DATABASE_ADMIN |
| DB_CRIT_07 | `siem_configs` and `log_alert_rules` defined twice with conflicting schemas | DATABASE_ADMIN |

### MAJOR

| ID | Description | Sources |
|----|-------------|---------|
| DB_MAJ_01 | `agent_analytics.user_id` is nullable — allows orphan analytics rows | DATABASE_ADMIN |
| DB_MAJ_02 | MC tables reference `public.users(id)` not `auth.users(id)` — inconsistent FK chain | DATABASE_ADMIN |
| DB_MAJ_03 | 10 tables missing from spec (model_change_history, channel_agent_routing, scheduled_restarts, coupons, etc.) | DATABASE_ADMIN |
| DB_MAJ_04 | `mc_tasks.column_id`, `priority`, `mc_events.severity`, `mc_agent_status.status` lack CHECK constraints | DATABASE_ADMIN |
| DB_MAJ_05 | `mc_reviews` lacks UNIQUE constraint per reviewer per task | DATABASE_ADMIN |
| DB_MAJ_06 | `analytics_daily_summary.user_id` missing ON DELETE CASCADE | DATABASE_ADMIN |
| DB_MAJ_07 | `mc_automation_rules`, `mc_task_templates`, `mc_recurring_tasks` missing user_id indexes | DATABASE_ADMIN |
| DB_MAJ_08 | `mc_recurring_tasks` missing next_run_at index (critical for cron performance) | DATABASE_ADMIN |
| DB_MAJ_09 | `webhook_deliveries` created twice with different schemas | DATABASE_ADMIN |
| DB_MAJ_10 | `get_webhook_delivery_stats` overwritten with incompatible signature | DATABASE_ADMIN |
| DB_MAJ_11 | Several tables (api_batches, api_predictions, analytics_*) missing user_id indexes | DATABASE_ADMIN |
| DB_MAJ_12 | `kb_documents` and `kb_chunks` RLS only allows SELECT — no INSERT/UPDATE/DELETE via client | DATABASE_ADMIN |

### MINOR

| ID | Description | Sources |
|----|-------------|---------|
| DB_MIN_01 | `csat_ratings.agent_id` is TEXT instead of UUID | DATABASE_ADMIN |
| DB_MIN_02 | `conversation_intents.conversation_id` is TEXT instead of UUID | DATABASE_ADMIN |
| DB_MIN_03 | Early migration policies lack IF NOT EXISTS guards | DATABASE_ADMIN |
| DB_MIN_04 | `mc_task_templates.default_agent_id` has no FK reference | DATABASE_ADMIN |
| DB_MIN_05 | `mc_task_dependencies` missing reverse lookup index on depends_on_task_id | DATABASE_ADMIN |
| DB_MIN_06 | `user_onboarding` missing INSERT policy | DATABASE_ADMIN |
| DB_MIN_07 | `user_notifications` missing INSERT/DELETE policy | DATABASE_ADMIN |
| DB_MIN_08 | `kb_feedback` missing indexes on chunk_id and document_id | DATABASE_ADMIN |
| DB_MIN_09 | `api_batches.status` and `api_predictions.status` lack CHECK constraints | DATABASE_ADMIN |

---

## AREA: Data Architecture

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| DATA_MED_01 | `mission-control/workload/route.ts:24` | mc_events read directly from Supabase — bypasses vpsDataFetch VPS-first pattern | DATA_ARCHITECTURE |
| DATA_MED_02 | `mission-control/tasks/queue/route.ts:112` | mc_events INSERT direct to Supabase — no hasVPSDataAPI check | DATA_ARCHITECTURE |
| DATA_MED_03 | `mission-control/agents/heartbeat/route.ts:77` | mc_events INSERT direct to Supabase — no VPS-first pattern | DATA_ARCHITECTURE |

---

## AREA: Naming & Secrets

### HIGH

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| NAME_HIGH_01 | `components/docs/knowledge-base-docs.tsx:266,544` | "Supabase Storage" exposed in user-facing docs text | NAMING_SECRETS_SCAN |
| NAME_HIGH_02 | `components/docs/api-docs.tsx:944-947` | SDK section says "Coming soon" for Python/JS/Go/Ruby | NAMING_SECRETS_SCAN |
| NAME_HIGH_03 | `components/dashboard/vps-maintenance.tsx:69` | Mock scheduled restart data — hardcoded INITIAL_SCHEDULES with misleading success toast | NAMING_SECRETS_SCAN |

### MEDIUM

| ID | File:Line | Description | Sources |
|----|-----------|-------------|---------|
| NAME_MED_01 | `components/dashboard/agent-rating.tsx:149` | "Reviews coming soon" placeholder text | NAMING_SECRETS_SCAN |
| NAME_MED_02 | `docs/pro/model-playground/page.tsx:187` | "per-token costs" language implies token-based pricing | NAMING_SECRETS_SCAN |
| NAME_MED_03 | `privacy/page.tsx:252` | "Cloudflare" named as DNS provider — may need legal review | NAMING_SECRETS_SCAN |
| NAME_MED_04 | `use-payment.ts`, `xpay.ts`, `email.ts` | 6 TODO comments for incomplete features (XPay payments, email provider) | NAMING_SECRETS_SCAN |

---

## AREA: Performance

### P0

| ID | Description | Sources |
|----|-------------|---------|
| PERF_P0_01 | Mission Control polling storm — 2+ API requests/second/user from overlapping refetchIntervals across components | PERFORMANCE_ENGINEER |

### P1

| ID | Description | Sources |
|----|-------------|---------|
| PERF_P1_01 | SSH connection per request — 18 handshakes/minute/user for VPS controls polling; no connection pooling | PERFORMANCE_ENGINEER |
| PERF_P1_02 | Font loading via CSS @import blocks rendering — unused JetBrains Mono also loaded | PERFORMANCE_ENGINEER |
| PERF_P1_03 | QueryClient singleton shared across SSR — can leak data between server requests | PERFORMANCE_ENGINEER |
| PERF_P1_04 | Logs explorer without virtualization — 500+ entries in DOM | PERFORMANCE_ENGINEER |
| PERF_P1_05 | VPS controls Recharts re-renders on every poll — charts should be memoized sub-components | PERFORMANCE_ENGINEER |
| PERF_P1_06 | framer-motion shipped to dashboard users — ~40KB for non-landing routes | PERFORMANCE_ENGINEER |
| PERF_P1_07 | N+1 in webhook-retry cron — up to 40 extra DB queries per run | PERFORMANCE_ENGINEER |

### P2

| ID | Description | Sources |
|----|-------------|---------|
| PERF_P2_01 | refetchIntervalInBackground missing on most queries — wasted requests in background tabs | PERFORMANCE_ENGINEER |
| PERF_P2_02 | Supabase admin client re-created per call — minor overhead on hot paths | PERFORMANCE_ENGINEER |
| PERF_P2_03 | select("*") on some Supabase queries — oversized payloads | PERFORMANCE_ENGINEER |
| PERF_P2_04 | Copy-button setTimeout leak on unmount — React warnings | PERFORMANCE_ENGINEER |

---

## AREA: Cross-Tier Integration

### MEDIUM

| ID | Description | Sources |
|----|-------------|---------|
| CROSS_MED_01 | Pro upgrade prompt mentions "Mission Control — advanced VPS management" — confusing with Ultra-only Mission Control suite | CROSS_TIER_INTEGRATION |

### LOW

| ID | Description | Sources |
|----|-------------|---------|
| CROSS_LOW_01 | VPS page renames to "Mission Control" for Pro — naming overlap with Ultra Mission Control sidebar entry | CROSS_TIER_INTEGRATION |
| CROSS_LOW_02 | /monitoring page exists but has no sidebar navigation entry — orphaned page | CROSS_TIER_INTEGRATION |

---

## STATISTICS

| Area | CRITICAL | HIGH | MEDIUM | LOW | Total |
|------|----------|------|--------|-----|-------|
| 59 (Starter) | 6 | 20 | 40 | 28 | 94+ UX |
| 129 (Pro) | 0 | 6 | 25+ | 15 | 46+ |
| 350 (Ultra) | 2 | 11 | 16 | 13 | 42+ UX |
| V1 API | 3 | 7 | 22 | 14 | 46+ FE |
| Landing | 0 | 7 | 13 | 9 | 29+ UX |
| Docs | 5 | 4 | 15 | 9 | 33 |
| Admin | 3 | 8 | 24 | 13 | 48+ Missing |
| Database | 7 | 12 | 0 | 9 | 28 |
| Data Arch | 0 | 0 | 3 | 0 | 3 |
| Naming | 0 | 3 | 4 | 0 | 7 |
| Performance | 1 | 7 | 0 | 4 | 12 |
| Cross-Tier | 0 | 0 | 1 | 2 | 3 |
| **TOTALS** | **27** | **85** | **163** | **116** | **391+** |

*Note: Some issues appear in multiple source reports and are de-duplicated above (listed once with all sources noted). UX and missing-feature issues add approximately 50+ additional items to the totals above.*
