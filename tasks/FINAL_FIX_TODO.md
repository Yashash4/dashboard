# FINAL FIX TODO — ALL 391+ Issues From 40 Review Agents

**Source:** `tasks/reviews/ALL_ISSUES_EXTRACTED.md` (747 lines, every issue with ID, severity, file:line, description)
**Total:** 27 CRITICAL + 85 HIGH + 163 MEDIUM + 116 LOW + 50+ UX = 441+ items
**Rule:** Do steps IN ORDER. `npx next build` must pass after each step.
**Last updated:** 2026-03-16

**IMPORTANT:** The full issue list with every detail is in `tasks/reviews/ALL_ISSUES_EXTRACTED.md`. This TODO organizes them into execution order. Reference ALL_ISSUES_EXTRACTED.md for exact file:line and detailed descriptions.

---

## STEP 1: DATABASE & SCHEMA (12 items)

Fix the foundation — wrong schema breaks everything.

- [ ] **1.1** Delete duplicate migration `ALL_NEW_MIGRATIONS.sql` — DB_CRIT_01
- [ ] **1.2** Fix timestamp collision at `20260315400000` (rename one) — DB_CRIT_02
- [ ] **1.3** Fix timestamp collision at `20260315500000` (rename one) — DB_CRIT_03
- [ ] **1.4** Add `user_id` column + RLS to `channel_credentials` — DB_CRIT_04
- [ ] **1.5** Fix 3 SECURITY DEFINER functions (add `auth.uid()` check) — DB_CRIT_05
- [ ] **1.6** Fix `siem_configs` + `log_alert_rules` duplicate definitions — DB_CRIT_06
- [ ] **1.7** Add FK constraints to `kb_feedback.chunk_id` + `document_id` — DB_CRIT_07
- [ ] **1.8** Fix nullable `user_id` on `agent_analytics` — DB_HIGH_01
- [ ] **1.9** Fix inconsistent FK refs (`public.users` vs `auth.users`) — DB_HIGH_02
- [ ] **1.10** Add missing CHECK constraints on MC tables — DB_HIGH_03
- [ ] **1.11** Add missing indexes on 10+ tables — DB_HIGH_04
- [ ] **1.12** Create 10 missing tables from spec — DB_HIGH_05

`npx next build` ✓

---

## STEP 2: SECURITY — ALL CRITICAL + HIGH (41 items)

Everything is unsafe without these. Covers 59, 129, 350, V1 API, Admin.

### Credential Encryption (4 items)
- [ ] **2.1** Encrypt `vps_instances.ssh_password` — 59_CRIT_04
- [ ] **2.2** Encrypt `vps_instances.dashboard_password` — 59_CRIT_03
- [ ] **2.3** Update ALL reads to decrypt — affects ssh.ts, admin routes, vps routes
- [ ] **2.4** Update ALL writes to encrypt — affects provision, password update routes

### Cron Auth (4 items)
- [ ] **2.5** Auth on `mc-recurring` cron — 59_HIGH_12
- [ ] **2.6** Auth on `webhook-retry` cron — 59_HIGH_12
- [ ] **2.7** Fix `log-alerts` fail-open — 59_HIGH_13
- [ ] **2.8** Verify ALL other crons have auth

### 350 Security (4 items)
- [ ] **2.9** Fix dependency DELETE user ownership — 350_CRIT_01
- [ ] **2.10** Fix queue route — use `guardMCRoute()` — 350_CRIT_02
- [ ] **2.11** Fix comments POST task ownership — 350_HIGH_04
- [ ] **2.12** Fix reviews POST task ownership — 350_HIGH_05

### V1 API Security (8 items)
- [ ] **2.13** Add body size limit ALL V1 POST routes — V1_CRIT_01
- [ ] **2.14** SSRF validation on batch `webhook_url` — V1_CRIT_02
- [ ] **2.15** Fix ilike injection in conversations — V1_CRIT_03
- [ ] **2.16** Add rate limiting to 11 endpoints — V1_HIGH_02
- [ ] **2.17** Add plan checks to 5 endpoints — V1_HIGH_05
- [ ] **2.18** Fix SSE no max duration — V1_HIGH_03
- [ ] **2.19** Fix content moderation not called — V1_HIGH_04
- [ ] **2.20** Fix batch results leak upstream errors — V1_HIGH_06

### Admin Security (7 items)
- [ ] **2.21** Fix 2FA bypass in layout — ADMIN_CRIT_01
- [ ] **2.22** Fix provision GET no admin check — ADMIN_CRIT_02
- [ ] **2.23** Fix deletion deprovision VPS — ADMIN_CRIT_03
- [ ] **2.24** Audit log credential views — ADMIN_HIGH_02
- [ ] **2.25** Fix admin login not logged — ADMIN_HIGH_03
- [ ] **2.26** Fix deletion cleanup (DNS, Storage, VPS data) — ADMIN_HIGH_04
- [ ] **2.27** Fix credentials in API response body — ADMIN_HIGH_01

### 59 Starter Security (7 items)
- [ ] **2.28** Fix payment verify try/catch — 59_CRIT_05
- [ ] **2.29** Add rate limit payment verify — 59_CRIT_06
- [ ] **2.30** Fix middleware no API protection — 59_HIGH_14
- [ ] **2.31** Fix middleware getSession vs getUser — 59_HIGH_15
- [ ] **2.32** Fix account deletion misses 15+ tables — 59_MED_23
- [ ] **2.33** Fix ticket attachments public URLs — 59_MED_25
- [ ] **2.34** Fix payment trusts client metadata — 59_MED_27

### 129 Pro Security (3 items)
- [ ] **2.35** Fix webhook secrets full column in GET — 129_SEC_MED_01
- [ ] **2.36** Fix SIEM API keys plaintext — 129_SEC_MED_02
- [ ] **2.37** Fix LIKE wildcard injection — 129_SEC_HIGH_02

### Landing Security (2 items)
- [ ] **2.38** Add security response headers (CSP, HSTS, etc.) — LAND_SEC_MED_01
- [ ] **2.39** Add missing `rel="noopener noreferrer"` — LAND_SEC_LOW_01

### Cross-tier (2 items)
- [ ] **2.40** Fix in-memory rate limiter (useless serverless) — 59_HIGH_07, PERF issue
- [ ] **2.41** Fix SSRF via DNS rebinding/IPv6 — 59_HIGH_16

`npx next build` ✓

---

## STEP 3: V1 API CLEANUP (13 items)

Creates shared patterns used by everything.

- [ ] **3.1** Create `src/lib/v1-auth.ts` shared middleware — V1_CRIT_04 (auth copied 25 times)
- [ ] **3.2** Replace auth in ALL 17 route files
- [ ] **3.3** Standardize ALL errors to `apiError()` — V1_HIGH_01
- [ ] **3.4** Fix playground auth (no Bearer token) — V1_FRONT_P2_01
- [ ] **3.5** Create/fix `idempotency.ts` — V1_BACK_INFO_01
- [ ] **3.6** Create/fix `moderation.ts` — V1_BACK_INFO_02
- [ ] **3.7** Create/fix `context-cache.ts` — V1_BACK_INFO_03
- [ ] **3.8** Fix batch webhook callback (dead code) — V1_QA_P0_03, V1_BACK_MED_04
- [ ] **3.9** Fix thinking-tag stripping in batch (2/5 patterns) — V1_BACK_MED_03
- [ ] **3.10** Standardize pagination (3 patterns → cursor) — V1_BACK_LOW_01
- [ ] **3.11** Add try/catch to 13 handlers — V1_QA_P1 batch
- [ ] **3.12** Fix SSE X-Request-Id + error events — V1_QA_P1_05
- [ ] **3.13** Fix chat route mixed error formats — V1_QA_P0_01

`npx next build` ✓

---

## STEP 4: 350 ULTRA ALL REMAINING (24 items)

### Unfixed items (11)
- [ ] **4.1** `estimated_hours ?? null` — 350_FAIL_06
- [ ] **4.2** Clear `completed_at` on un-done — 350_FAIL_07
- [ ] **4.3** Add "error" to event types — 350_FAIL_08
- [ ] **4.4** Replace `emitMCEvent()` with Supabase Realtime — 350_FAIL_10
- [ ] **4.5** Validate column_id enum — 350_FAIL_12
- [ ] **4.6** Validate priority enum — 350_FAIL_12
- [ ] **4.7** String length validation — 350_FAIL_13
- [ ] **4.8** Body size check (not Content-Length) — 350_FAIL_14
- [ ] **4.9** Soft delete (`deleted_at`) — 350_FAIL_15
- [ ] **4.10** Event pagination append — 350_FAIL_18
- [ ] **4.11** Reorder item validation — 350_FAIL_22

### Missing UI (5)
- [ ] **4.12** Build Automation Rules UI — 350_UX_01
- [ ] **4.13** Build Dependencies UI — 350_UX_02
- [ ] **4.14** Agent roster status filter buttons — 350_UX_03
- [ ] **4.15** Create task column selector — 350_UX_04
- [ ] **4.16** Expand command palette — 350_UX_05

### New bugs from fixes (4)
- [ ] **4.17** Review approval check dependencies — 350_NEW_01
- [ ] **4.18** Review approval fire automation — 350_NEW_02
- [ ] **4.19** Review approval emit realtime — 350_NEW_03
- [ ] **4.20** Same-column reorder stale state — 350_NEW_04

### Arch + Perf (4)
- [ ] **4.21** Fix 3 mc_events data violations — DA_CRIT_01-03
- [ ] **4.22** Reduce polling (2s/3s/5s → 10s+) — PERF_P0_01
- [ ] **4.23** Fix useEffect infinite loop — 350_FRONT_HIGH_01
- [ ] **4.24** Split task-board.tsx — 350_FRONT_CRIT_01

`npx next build` ✓

---

## STEP 5: 59 STARTER ALL REMAINING (~65 items)

### Critical + High (18 items)
- [ ] **5.1** Account page try/catch — 59_CRIT_01
- [ ] **5.2** Monitoring CPU color precedence — 59_CRIT_02
- [ ] **5.3** Billing dead end (no subscribe flow) — 59_HIGH_01
- [ ] **5.4** Models page null → redirect — 59_HIGH_02
- [ ] **5.5** Bulk deploy check VPS status — 59_HIGH_03
- [ ] **5.6** Chat sidebar mobile — 59_HIGH_04
- [ ] **5.7** Chat streaming abort on switch — 59_HIGH_05
- [ ] **5.8** Channel reconnect empty creds — 59_HIGH_06
- [ ] **5.9** SSL check wrong client — 59_HIGH_08
- [ ] **5.10** Webhooks POST try/catch — 59_HIGH_09
- [ ] **5.11** Keys PATCH try/catch — 59_HIGH_10
- [ ] **5.12** Payments create-order try/catch — 59_HIGH_11
- [ ] **5.13** Replace ~40 `any` types — 59_HIGH_17
- [ ] **5.14** Add ARIA labels 15+ buttons — 59_HIGH_18
- [ ] **5.15** Fix 2px toggle button — 59_HIGH_19
- [ ] **5.16** Add search debounce — 59_HIGH_20
- [ ] **5.17** Wire 4 chat components — 59_UX_01
- [ ] **5.18** Add payment method self-service — 59_UX_02

### Medium (40 items) — 59_MED_01 through 59_MED_40
- [ ] **5.19-5.58** All 40 medium items from ALL_ISSUES_EXTRACTED.md (model errors, VPS errors, max-lengths, audit search, status leaks, component splits, React Query migration, virtualization, gradient collision, AbortController, accessibility, mobile overflow, chart tooltips, mock data, etc.)

### Low (8 items) — 59_LOW_01 through 59_LOW_08
- [ ] **5.59-5.66** All 8 low items

`npx next build` ✓

---

## STEP 6: 129 PRO ALL REMAINING (~55 items)

### QA bugs (14 items) — 129_QA_01 through 129_QA_14
- [ ] **6.1-6.14** All 14 bugs (rate limit VPS logs, KB search mode dead, audit strips underscores, agent builder empty name, AI JSON regex, V1 health/conversations rate limits, log alerts DELETE plan check, agent config not Pro-gated)

### Frontend (20 items) — 129_FRONT_P0/P1/P2
- [ ] **6.15-6.34** KB drag-drop dead, webhook a11y, searchMode dead, missing useMemo, no virtualization, missing AbortController, raw textarea, inline fetches, untyped responses, non-responsive webhooks, split webhooks-manager, syntax highlighting, upload progress, tooltips

### Backend (27 items) — 129_BACK_HIGH/MED/LOW
- [ ] **6.35-6.61** N+1 queries (funnels, paths, key stats), sequential embedding updates, missing try/catch, duplicated auth, SSE disconnect handling, SIEM SSRF, idempotency failures, dead code, ReDoS protection

### UX (3 items)
- [ ] **6.62** Model Playground — add history + saved results
- [ ] **6.63** Logs Explorer — increase cap, add time range, add regex
- [ ] **6.64** Remove "team collaboration" from upgrade prompt — 129_UX_03

`npx next build` ✓

---

## STEP 7: DOCS + LANDING ALL FIXES (~30 items)

### Docs (15 items)
- [ ] **7.1** Register @tailwindcss/typography plugin — DOCS_FRONT_CRIT_01
- [ ] **7.2** Fix dead links /docs/webhooks and /docs/knowledge-base — DOCS_FRONT_CRIT_02
- [ ] **7.3** Standardize plan data across ALL pages — DOCS_CONTENT_CRIT_01
- [ ] **7.4** Replace provider model names (gpt-4o → Kimi K2.5) — DOCS_CONTENT_CRIT_02
- [ ] **7.5** Fix 6 broken cross-links — DOCS_QA_01
- [ ] **7.6** Fix API base URL inconsistency — DOCS_UX_CRIT_02
- [ ] **7.7** Implement Table of Contents sidebar — DOCS_FRONT_HIGH_01
- [ ] **7.8** Fix "Webhooks API" nav mislabel — DOCS_QA_03
- [ ] **7.9** Fix mobile sidebar close — DOCS_FRONT_HIGH_02
- [ ] **7.10** Delete orphaned components — DOCS_FRONT_LOW_01
- [ ] **7.11** Add syntax highlighting — DOCS_FRONT_MED_03
- [ ] **7.12** Fix API key placeholder inconsistency — DOCS_SEC_LOW_01
- [ ] **7.13** Fix "Supabase Storage" in KB docs — DOCS_SEC_MED_01
- [ ] **7.14** Add search keyboard shortcut — DOCS_FRONT_MED_01
- [ ] **7.15** Merge two layout systems — DOCS_FRONT_HIGH_03

### Landing (15 items)
- [ ] **7.16** Add DashboardMockup to hero — LAND_UX_CRIT_01
- [ ] **7.17** Fix logo href="#" → "/" — LAND_FRONT_CRIT_02, LAND_QA_01
- [ ] **7.18** Add prefers-reduced-motion — LAND_FRONT_CRIT_01
- [ ] **7.19** Add scroll-behavior: smooth — LAND_FRONT_CRIT_04
- [ ] **7.20** Add OG image + metadataBase — LAND_FRONT_CRIT_05, LAND_BACK_01
- [ ] **7.21** Create robots.ts — LAND_BACK_02
- [ ] **7.22** Create sitemap.ts — LAND_BACK_02
- [ ] **7.23** Add /docs /terms /privacy to middleware matcher — LAND_BACK_04
- [ ] **7.24** Fix Terms feature descriptions — LAND_QA_02
- [ ] **7.25** Lazy load below-fold sections — LAND_FRONT_NOTE_01
- [ ] **7.26** Fix VPSHealthMockup interval leak — LAND_FRONT_MED_05
- [ ] **7.27** Add FAQ ARIA attributes — LAND_FRONT_MED_02
- [ ] **7.28** Fix comparison table mobile overflow — LAND_FRONT_MED_04
- [ ] **7.29** Wire unused mockup components — LAND_FRONT_MED_06
- [ ] **7.30** Add mobile menu aria-label — LAND_FRONT_CRIT_03

`npx next build` ✓

---

## STEP 8: ADMIN ALL FIXES (~30 items)

### Critical + High (10 items)
- [ ] **8.1** Enforce 2FA — ADMIN_CRIT_01 (also in Step 2)
- [ ] **8.2** Build SSH terminal (xterm.js) — ADMIN_QA_MISSING_01
- [ ] **8.3** Build impersonation — ADMIN_QA_MISSING_02
- [ ] **8.4** Fix deletion deprovision — ADMIN_CRIT_03 (also in Step 2)
- [ ] **8.5** Fix provision GET auth — ADMIN_CRIT_02 (also in Step 2)
- [ ] **8.6** Fix VPS actions on stopped VPS — ADMIN_QA_CRIT_04
- [ ] **8.7** Fix audit log premature "provisioned" — ADMIN_QA_CRIT_05
- [ ] **8.8** Fix customer detail no retry on failure — ADMIN_QA_CRIT_06
- [ ] **8.9** Add batch size limit (bulk ops) — ADMIN_BACK_HIGH_01
- [ ] **8.10** Build coupon system — ADMIN_QA_MISSING_03

### Medium (12 items)
- [ ] **8.11** Fix cache invalidation after mutations — ADMIN_QA_HIGH
- [ ] **8.12** Add rate limiting to admin APIs — ADMIN_QA_HIGH
- [ ] **8.13** Fix Pro customer count (includes Enterprise) — ADMIN_QA_HIGH
- [ ] **8.14** Fix stale data after subscription edits — ADMIN_QA_HIGH
- [ ] **8.15** Split admin-customer-detail.tsx (1180 lines) — ADMIN_FRONT_CRIT
- [ ] **8.16** Replace useState/fetch with React Query (4 components) — ADMIN_FRONT_CRIT
- [ ] **8.17** Fix 7 `any` types — ADMIN_FRONT_MED
- [ ] **8.18** Delete dead code admin-delete-customer.tsx — ADMIN_FRONT_MED
- [ ] **8.19** Fix STATUS_CONFIG/PRIORITY_CONFIG duplication — ADMIN_FRONT_MED
- [ ] **8.20** Add ARIA labels to icon buttons — ADMIN_FRONT_MED
- [ ] **8.21** Fix silent error swallowing — ADMIN_FRONT_MED
- [ ] **8.22** Remove unused imports — ADMIN_FRONT_LOW

### Ops Manager gaps (12 items)
- [ ] **8.23** Build force-model-switch — ADMIN_OPS_06
- [ ] **8.24** Build customer chat history viewer — ADMIN_OPS_12
- [ ] **8.25** Build background health monitoring + alerts — ADMIN_OPS_01
- [ ] **8.26** Build admin password reset for customers — ADMIN_OPS_10
- [ ] **8.27** Build bulk VPS restart — ADMIN_OPS_19
- [ ] **8.28** Build customer export for accounting — ADMIN_OPS_20
- [ ] **8.29** Build churn tracking dashboard — ADMIN_OPS_22
- [ ] **8.30** Build revenue forecasting — ADMIN_OPS_23

`npx next build` ✓

---

## STEP 9: PERFORMANCE + POLISH (~25 items)

### Performance (8 items)
- [ ] **9.1** SSH connection pooling — PERF_P1_01
- [ ] **9.2** Fix font loading (next/font) — PERF_P1_02
- [ ] **9.3** Fix framer-motion bundle (dynamic import) — PERF_P1_03
- [ ] **9.4** Fix QueryClient SSR singleton — PERF_P1_04
- [ ] **9.5** Virtualize logs (500+ rows) — PERF_P1_05
- [ ] **9.6** Fix VPS charts re-render — PERF_P1_06
- [ ] **9.7** Fix N+1 in webhook-retry cron — PERF_P1_08
- [ ] **9.8** Fix MC polling storm (21 intervals) — PERF_P0_01

### Cross-tier (3 items)
- [ ] **9.9** Fix upgrade prompt "Mission Control" for Pro — CT_MED_01
- [ ] **9.10** Fix VPS page title "Mission Control" for Pro — CT_LOW_01
- [ ] **9.11** Add monitoring to sidebar — CT_LOW_02

### Naming (5 items)
- [ ] **9.12** Fix "Supabase Storage" in KB docs — NAME_CRIT_01
- [ ] **9.13** Fix "Coming soon" SDKs + reviews — NAME_CRIT_02, NAME_HIGH_01
- [ ] **9.14** Fix "per-token costs" in playground — NAME_HIGH_02
- [ ] **9.15** Fix mock data in VPS maintenance — NAME_MED_01
- [ ] **9.16** Review "Cloudflare" in privacy page — NAME_MED_02

### Remaining LOW items across all areas (~9 items)
- [ ] **9.17-9.25** All remaining low-priority items from ALL_ISSUES_EXTRACTED.md

`npx next build` ✓ **ALL DONE.**

---

## EXECUTION SUMMARY

| Step | Items | What | Depends On |
|------|-------|------|-----------|
| 1 | 12 | Database schema | Nothing |
| 2 | 41 | Security (ALL areas) | Step 1 |
| 3 | 13 | V1 API cleanup | Step 2 |
| 4 | 24 | 350 Ultra remaining | Steps 2, 3 |
| 5 | ~65 | 59 Starter all fixes | Steps 1, 2 |
| 6 | ~55 | 129 Pro all fixes | Steps 2, 3 |
| 7 | ~30 | Docs + Landing | Step 4 (features final) |
| 8 | ~30 | Admin all fixes | Steps 1, 2 |
| 9 | ~25 | Performance + polish | All above |
| **TOTAL** | **~295** | | |

**Note:** Some items appear in multiple steps (e.g., 2FA fix is in both Step 2 security and Step 8 admin). Do it ONCE in the first step it appears. Mark as "already done in Step X" in later steps.

**Full detail for every item:** `tasks/reviews/ALL_ISSUES_EXTRACTED.md`
