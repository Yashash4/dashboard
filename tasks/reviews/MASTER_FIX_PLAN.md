# Master Fix Plan — From 40 Review Agents

**Source:** 40 review reports in `tasks/reviews/`
**Total issues:** ~170 (25 critical, 45 high, 60 medium, 40 low)
**Date:** 2026-03-16

---

## ROUND 1: Security Fixes (URGENT — do before anything else)

### From 59 Security Auditor
- [ ] **S1. Encrypt SSH/dashboard passwords in Supabase** — `vps_instances.ssh_password` and `dashboard_password` stored in plaintext. Use `encryptCredentials()` from `src/lib/crypto.ts`. Encrypt on write, decrypt on read. CRITICAL.
- [ ] **S2. Auth on ALL cron routes** — `mc-recurring`, `webhook-retry` have ZERO auth. `log-alerts` fails open when `CRON_SECRET` unset. Add `CRON_SECRET` check to ALL cron routes: `if (request.headers.get("authorization") !== \`Bearer \${process.env.CRON_SECRET}\`) return 401`.

### From 129 Security Auditor
- [ ] **S3. Fix LIKE wildcard injection** — V1 conversations and KB search pass unsanitized `%` and `_` to `.ilike()`. Escape wildcards: `query.replace(/%/g, "\\%").replace(/_/g, "\\_")`.

### From V1 API Security
- [ ] **S4. Add global body size limit to V1 API** — No max request body size. Add Next.js route config: `export const bodyParser = { sizeLimit: '100kb' }` on all POST routes. Or check body size in shared middleware.
- [ ] **S5. SSRF via batch `webhook_url`** — No URL validation. Add `isPrivateUrl()` check (from `src/lib/knowledge-base.ts`) before storing/calling webhook_url.
- [ ] **S6. Add rate limiting to 11 V1 endpoints** — health, models, usage, agents GET/DELETE, conversations, predictions, files GET/DELETE all missing rate limits.
- [ ] **S7. Add plan checks to 5 V1 endpoints** — `batch/:id GET`, `files/:id GET/DELETE`, `predictions/:id`, `threads/:id/messages GET` skip plan verification.

### From 350 Backend Post-fix
- [ ] **S8. Fix cross-user dependency deletion** — `dependencies/route.ts` DELETE has no user_id check. Add task ownership verification before deleting.
- [ ] **S9. Fix queue route auth** — `tasks/queue/route.ts` uses custom auth, no plan check, no rate limit. Replace with `guardMCRoute()`.
- [ ] **S10. Fix comments/reviews POST task ownership** — Neither verifies the task belongs to the user before inserting.

### From Admin Security + QA
- [ ] **S11. Fix 2FA bypass** — Admin layout never checks MFA assurance level. Add `aal2` check in `src/app/admin/layout.tsx`.
- [ ] **S12. Fix provision GET no admin check** — `GET /api/admin/provision` (polling) lacks admin role verification.
- [ ] **S13. Customer deletion must deprovision VPS** — Deletion doesn't destroy the actual VPS, leaving orphaned servers with valid SSH credentials.
- [ ] **S14. Audit log credential views** — When admin views SSH/dashboard passwords, log it to admin audit trail.

### From Database Admin
- [ ] **S15. Add RLS to `channel_credentials`** — No RLS policies, no `user_id` column. Data access hole.
- [ ] **S16. Fix SECURITY DEFINER functions** — 3 functions accept `p_user_id` without verifying `auth.uid()`. Add `WHERE user_id = auth.uid()` or change to `SECURITY INVOKER`.
- [ ] **S17. Delete duplicate migration** — `ALL_NEW_MIGRATIONS.sql` is a concatenation of 8 other files. Delete it.
- [ ] **S18. Fix timestamp collisions** — Two files at `20260315400000` and two at `20260315500000`. Rename one in each pair.

### From Landing Security
- [ ] **S19. Add security response headers** — No CSP, HSTS, X-Frame-Options, X-Content-Type-Options. Add via `next.config.ts` `headers()`.

---

## ROUND 2: 350 Ultra — Unfixed Items + Missing UI

### Unfixed from FIXES_350_ULTRA.md (confirmed by 3 reviewers)
- [ ] **U1. FIX-06: `estimated_hours` still uses `||`** — Change to `??` in `tasks/route.ts`.
- [ ] **U2. FIX-07: Reorder never clears `completed_at`** — Add `completed_at: null` when column is not "done" in `tasks/reorder/route.ts`.
- [ ] **U3. FIX-08: "error" missing from VALID_EVENT_TYPES** — Add to array in `events/route.ts` AND `EVENT_TYPE_CONFIG` in `event-feed.tsx`.
- [ ] **U4. FIX-10: API routes still use `emitMCEvent()`** — Replace with Supabase Realtime broadcast in heartbeat, events POST, sessions POST/PATCH.
- [ ] **U5. FIX-12: No column_id/priority enum validation** — Add whitelist check in tasks POST/PATCH/reorder/bulk-update/bulk-action.
- [ ] **U6. FIX-13: No string length validation** — Add max lengths: title 500, description 10000, comment 5000, name 200.
- [ ] **U7. FIX-14: Body size check trusts Content-Length** — Read actual body or use Next.js `bodyParser.sizeLimit`.
- [ ] **U8. FIX-15: Soft delete not implemented** — Add `deleted_at` column, update DELETE to soft-delete, add filter to all queries.
- [ ] **U9. FIX-18: Event pagination replaces instead of appending** — Use `useInfiniteQuery` or accumulate pages.
- [ ] **U10. FIX-22: Reorder items not validated** — Check UUID format, valid column_id, positive position.
- [ ] **U11. FIX-58: task-board.tsx NOT split** — Still 1536 lines. Extract CalendarView, SwimlaneView, TaskListView, CreateTaskDialog, FilterBar into separate files.

### Missing UI (backend built, zero frontend)
- [ ] **U12. Automation Rules UI** — Full backend exists (`mc-automation.ts`, API routes). Need: rule list page, create rule dialog (trigger type dropdown + trigger value + action type + action value), enable/disable toggle, run count display. Add `/mission-control/automation` page or tab in task board.
- [ ] **U13. Dependencies UI** — API supports add/remove/circular detection. Need: "Dependencies" section in task detail modal, "Add dependency" → task picker, blocked indicator on task cards (lock icon + "Waiting on: Task X"), prevent moving blocked tasks in UI.
- [ ] **U14. Agent roster status filter buttons** — State variable exists but no filter buttons rendered. Add status filter buttons (Online, Working, Idle, Error, Offline).
- [ ] **U15. Create task column selector** — Currently hardcodes `column_id: "planning"`. Add column dropdown to create dialog.
- [ ] **U16. Command palette expansion** — Only 7 items. Add: task search, agent start/stop, view switching, filter shortcuts.

### New bugs from fixes
- [ ] **U17. Review approval bypasses dependency checks** — Auto-move to Done should check dependencies first.
- [ ] **U18. Review approval doesn't fire automation rules** — Should call `processAutomationRules()` after auto-move.
- [ ] **U19. Review approval doesn't emit realtime event** — Should broadcast via Supabase Realtime.
- [ ] **U20. Same-column reorder reads stale state** — `tasksRef` used before `setTasks` batch applies.

### Data architecture violations
- [ ] **U21. 3 routes write mc_events to Supabase** — `workload/route.ts:24`, `tasks/queue/route.ts:112`, `agents/heartbeat/route.ts:77`. Should use `vpsDataFetch()` with Supabase fallback.

### Performance
- [ ] **U22. Reduce polling** — Agent roster 2s → 10s, session tracker 3s → 10s, overview 5s → 15-30s.
- [ ] **U23. Add useEffect dependency fix** — session-tracker and task-board `selectedX` infinite loop risk.

---

## ROUND 3: V1 API Cleanup

- [ ] **A1. Extract shared auth middleware** — Create `src/lib/v1-auth.ts` with `validateAndAuthorize(request)` that does: extract Bearer → hash → lookup → active check → plan check → rate limit → return `{ user, apiKey }`. Replace the 25 copy-pasted auth blocks.
- [ ] **A2. Standardize error format** — ALL V1 endpoints must use `apiError()` from `api-errors.ts`. Fix: health, conversations, conversations/messages to use structured format.
- [ ] **A3. Fix batch webhook callback** — `webhook_url` is stored but never dispatched. After batch completes, POST results to the URL.
- [ ] **A4. Fix playground auth** — Playground component calls `/api/v1/chat` without Bearer token. Must use the user's selected API key.
- [ ] **A5. Create missing libs** — `idempotency.ts`, `moderation.ts`, `context-cache.ts` are referenced in `api-errors.ts` but don't exist. Either create them or remove dead error codes.
- [ ] **A6. Fix thinking-tag stripping in batch** — Batch strips only 2 of 5 tag patterns. Add `<reasoning>`, `<reflection>`, custom delimiters.
- [ ] **A7. Add rate limiting to all endpoints** — Use the shared middleware from A1.
- [ ] **A8. Standardize pagination** — Pick ONE pattern (cursor-based) and apply everywhere.
- [ ] **A9. Add try/catch to 13 handlers missing it** — Unhandled throws produce HTML instead of JSON.
- [ ] **A10. Fix SSE streaming** — Add `X-Request-Id` header, error events on mid-stream failures, per-read timeout.

---

## ROUND 4: Docs + Landing Fixes

### Docs
- [ ] **D1. Register @tailwindcss/typography plugin** — Add to `tailwind.config.ts` plugins. Without this, all `prose` styling is inert.
- [ ] **D2. Fix plan data inconsistencies** — Plans page, Billing docs, Pro overview, and FAQ all have different VPS specs, agent limits, channel counts. Standardize to: Starter (2 vCPU/8GB, all 7 channels, unlimited agents from store, 5 model changes/month), Pro (8 vCPU/32GB, same + Pro tools), Ultra (16 vCPU/64GB, same + MC).
- [ ] **D3. Fix 6 broken cross-links** — `/docs/monitoring` → `/docs/dashboard/monitoring` or remove, `/docs/analytics` → `/docs/pro/analytics`, `/docs/knowledge-base` → `/docs/pro/knowledge-base`.
- [ ] **D4. Replace provider model names** — Change `gpt-4o`, `claude-3-5-sonnet` etc. to `Kimi K2.5`, `MiniMax M2.5` in API reference docs.
- [ ] **D5. Implement Table of Contents sidebar** — Currently empty placeholder. Auto-extract h2/h3 headings from page content, show as scrollspy-linked TOC.
- [ ] **D6. Fix "Webhooks API" nav mislabel** — Points to Conversations/Threads/Usage/Health page, not webhooks.
- [ ] **D7. Fix mobile sidebar** — Doesn't close on navigation. Add pathname watcher.
- [ ] **D8. Delete orphaned components** — `docs-sidebar.tsx` and `docs-header.tsx` not used by current layout.

### Landing
- [ ] **L1. Add DashboardMockup to hero** — Component exists but isn't used. Place below the hero text.
- [ ] **L2. Fix logo href** — `Navbar.tsx` logo links to `href="#"`. Change to `/`.
- [ ] **L3. Add OG image + metadataBase** — Create OG image, add to root layout metadata.
- [ ] **L4. Add robots.txt + sitemap.xml** — `src/app/robots.ts` and `src/app/sitemap.ts`. Index public pages, exclude `/dashboard/*` and `/admin/*`.
- [ ] **L5. Add prefers-reduced-motion** — Wrap all Framer Motion animations with `useReducedMotion()` check.
- [ ] **L6. Add smooth scroll CSS** — `html { scroll-behavior: smooth; }` in globals.css.
- [ ] **L7. Lazy load below-fold sections** — Use `next/dynamic` for sections after hero.
- [ ] **L8. Fix Terms feature descriptions** — Terms says Starter has "Single agent", Pro has "mission control" — contradicts landing page. Align with actual features.
- [ ] **L9. Add /docs, /terms, /privacy to middleware matcher** — Prevents session expiry for authenticated users reading docs.

---

## ROUND 5: Admin Gaps

- [ ] **AD1. Enforce 2FA** — Check `aal.currentLevel === "aal2"` in admin layout. Redirect to `/admin/verify-2fa` if not met.
- [ ] **AD2. Build SSH terminal** — `xterm.js` + WebSocket → SSH proxy. Install: `npm install xterm @xterm/addon-fit @xterm/addon-web-links`. New page: `/admin/tools/terminal`. Select customer → connect to their VPS.
- [ ] **AD3. Build impersonation** — "Login As" creates temp session as customer. Yellow banner. Auto-expire 30min. Log to admin audit.
- [ ] **AD4. Fix deletion to deprovision VPS** — When deleting customer: cancel subscription, destroy VPS (via Hostinger API or mark for manual cleanup), clean DNS, clean Supabase Storage, delete auth user.
- [ ] **AD5. Add batch size limit** — Bulk operations has no limit on `userIds` array. Cap at 50.
- [ ] **AD6. Fix provision GET auth** — Add admin role check to provision polling endpoint.
- [ ] **AD7. Audit log credential reads** — Log when admin views SSH/dashboard passwords.
- [ ] **AD8. Split admin-customer-detail.tsx** — 1180 lines. Extract sub-components for each section.
- [ ] **AD9. Replace useState/fetch with React Query** — 4 admin components use manual fetch instead of React Query.
- [ ] **AD10. Build force-model-switch** — Admin can instantly switch any customer's model, bypassing limits.
- [ ] **AD11. Build customer chat history viewer** — Read from customer's VPS via vpsDataFetch.
- [ ] **AD12. Build background health monitoring** — Scheduled health checks with alerts when VPS goes down.

---

## ROUND 6: Code Quality + Performance (after all above)

### Performance
- [ ] **P1. SSH connection pooling** — 18 handshakes/min per VPS page user. Implement connection reuse.
- [ ] **P2. Fix font loading** — Render-blocking CSS @import. Use `next/font` instead.
- [ ] **P3. Fix framer-motion bundle** — Ships to dashboard users but only used on landing. Use dynamic import.
- [ ] **P4. Virtualize logs** — 500+ rows without virtualization in logs-explorer.
- [ ] **P5. Fix QueryClient SSR leak** — Module-level singleton can leak between requests. Create per-request.

### Cross-tier
- [ ] **CT1. Fix upgrade prompt text** — Says "Mission Control" for Pro but MC is Ultra-only.
- [ ] **CT2. Fix VPS page title** — Shows "Mission Control" for Pro users but real MC is Ultra.
- [ ] **CT3. Add monitoring to sidebar** — `/monitoring` page exists but has no sidebar entry.

### Naming
- [ ] **N1. Fix "Supabase Storage" in KB docs** — User-facing text exposes provider.
- [ ] **N2. Fix "Coming soon" text** — In api-docs.tsx (SDKs) and agent-rating.tsx (reviews).
- [ ] **N3. Fix "per-token costs" reference** — In model-playground page.
- [ ] **N4. Remove mock data in VPS maintenance** — Uses mock for scheduled restarts.
