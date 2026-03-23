# Agent 39 — Cross-Cutting — Naming & Secrets Scan

**Total Issues Found: 18**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 6 / LOW: 4

---

## CRITICAL

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| C1 | `.env.local.template:5-6` | **Git-tracked template contains real Supabase anon key and project URL.** The template file is committed to the repository (confirmed via `git ls-files`) and includes the actual `NEXT_PUBLIC_SUPABASE_ANON_KEY` JWT and the real Supabase project URL. While anon keys are semi-public, including the real value in source control means anyone with repo access has a working credential. The template should have placeholder values only. | `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...` (full JWT committed) |
| C2 | `src/lib/rate-limit.ts:74-82` | **In-memory rate limiter never records hits — effectively disabled.** The `rateLimit()` function calls `getRateLimitStatus()` which reads from `store` (a Map of timestamps), but neither function ever calls `store.set()` to record a new hit. The store is only written to in the `cleanup()` function. This means every request sees `remaining = limit` and is always allowed through. The in-memory rate limiter is a no-op. All routes using `rateLimit()` (including `mc-route-guard.ts:59` and `v1-auth.ts:121`) have **no actual rate limiting** unless the Supabase RPC fallback in `rateLimitAsync()` is used. | `rateLimit()` at line 74 returns `{ success: remaining > 0 }` but never writes timestamps to `store` |
| C3 | Root directory | **Debug/backup files with source code in project root.** Three stray files exist: `provision_route_backup.txt` (contains full API route source code), `test_write.txt`, and `x.txt`. These are untracked but present in the working tree and could accidentally be committed or deployed. The backup file contains import statements and potentially sensitive route logic. | `provision_route_backup.txt`, `test_write.txt`, `x.txt` all in project root |

## HIGH

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| H1 | `src/app/api/admin/api-keys/route.ts:145,243` | **Hardcoded `appUrl` bypasses environment variable.** Two locations pass `appUrl: "https://app.clawhq.tech"` directly instead of using `process.env.NEXT_PUBLIC_APP_URL`. Other files (e.g., `provision/route.ts:232`, `email.ts:71`) correctly use the env var with a fallback. This means these routes will break in any non-production environment (staging, local dev). | `appUrl: "https://app.clawhq.tech"` without env var fallback |
| H2 | `src/app/sitemap.ts:6-24`, `src/app/robots.ts:12` | **Hardcoded production URLs without env var.** The sitemap and robots files hardcode `https://app.clawhq.tech` for all URLs instead of using `process.env.NEXT_PUBLIC_APP_URL`. This means staging/dev environments generate sitemaps pointing to production. | `url: "https://app.clawhq.tech"` (4 occurrences in sitemap, 1 in robots) |
| H3 | `.env.local.template` | **Template is missing 6 env vars used in code.** The template only lists `HOSTINGER_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Missing from template: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `CREDENTIAL_ENCRYPTION_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `XPAY_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`. New developers will not know which env vars are required. | Compare `.env.local` (17 vars) vs `.env.local.template` (4 vars) |
| H4 | `src/lib/email.ts:81-85` | **Hardcoded hex colors in email HTML template.** The email template uses raw hex colors (`#191919`, `#201e18`, `#6b8f5e`, `#ccc`, `#999`, `#666`) instead of referencing the design system. While CSS variables cannot be used in email HTML, these colors should at least be defined as constants to stay in sync with the design system. | `background: #191919; border: 1px solid #201e18;` etc. |
| H5 | `src/lib/ssh.ts:633` | **Hardcoded allowed origin for iframe embedding.** The default parameter value is `["https://app.clawhq.tech"]` instead of reading from `process.env.NEXT_PUBLIC_APP_URL`. | `allowedOrigins: string[] = ["https://app.clawhq.tech"]` |

## MEDIUM

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| M1 | `src/lib/provision.ts` (entire file) | **Dead code: old provision module never imported.** `provision.ts` is the old provisioning implementation. Only `provision-v3.ts` is imported (by `api/admin/provision/route.ts`). The old file should be removed. | No imports of `@/lib/provision` found anywhere in the codebase |
| M2 | `src/lib/notify.ts` (entire file) | **Dead code: notify module never imported.** `notify.ts` exports `createNotification` but is not imported by any file in the codebase. | No imports of `@/lib/notify` found anywhere |
| M3 | `src/lib/context-cache.ts` (entire file) | **Dead code: context-cache module never imported.** Defines a `Map`-based cache but is not imported by any file. | No imports of `@/lib/context-cache` found anywhere |
| M4 | `src/lib/payments/xpay.ts:14-42` | **Stub implementation with 4 TODO comments.** The entire XPay payment module is unimplemented — both `createXPayOrder` and `verifyXPayPayment` throw or return errors. Contains 4 TODO markers indicating incomplete work. | `throw new Error("XPay integration pending")` and `return { verified: false, error: "XPay verification not implemented" }` |
| M5 | `src/app/api/admin/customers/[id]/route.ts:76` | **TODO comment for incomplete VPS cleanup.** A TODO notes that VPS destruction via Hostinger API is not implemented, meaning customer deletion may leave orphaned VPS instances. | `// TODO: 2.23 — Call Hostinger API to destroy/stop VPS when API supports it.` |
| M6 | Multiple landing components | **Hardcoded hex colors violate 60-30-10 design system rule.** The macOS traffic light dots (`#ff5f57`, `#ffbd2e`, `#28c840`) appear in 6 files across ~18 occurrences. Dashboard mockup components use `#191919`, `#222222` directly. While the traffic lights are decorative, the mockup backgrounds should use CSS variables per the project's design rules. | `bg-[#ff5f57]` in Hero.tsx:117, Comparison.tsx:110, HowItWorks.tsx:125/258, CodeBlockMockup.tsx:116; `bg-[#191919]`/`bg-[#222222]` in DashboardMockup.tsx, ChatMockup.tsx, AnalyticsMockup.tsx, KanbanMockup.tsx |

## LOW

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| L1 | `src/components/dashboard/admin-customers.tsx:41` | **Hardcoded tier color for "pro" badge.** Uses `bg-[#ffe0c2]/20 text-[#ffe0c2]` instead of CSS variable `var(--tier-pro)`. Same pattern at `admin-customer-detail.tsx:176`. | `pro: { label: "Pro", className: "bg-[#ffe0c2]/20 text-[#ffe0c2] border-[#ffe0c2]/30" }` |
| L2 | `src/components/docs/webhooks-docs.tsx:27`, `knowledge-base-docs.tsx:28`, `api-docs.tsx:29` | **Hardcoded BASE_URL in docs components.** Three documentation components define `const BASE_URL = "https://app.clawhq.tech/api"` instead of using the env var. These are display-only (code examples shown to users), but should still be consistent. | `const BASE_URL = "https://app.clawhq.tech/api"` in 3 files |
| L3 | `src/lib/provision.ts` vs `src/lib/provision-v3.ts` | **Naming inconsistency: versioned filename.** The active provisioning module uses a `-v3` suffix instead of simply replacing the old file. This creates confusion about which is current. | Two files with near-identical interfaces, only `-v3` is used |
| L4 | `src/lib/email.ts:4` | **Resend client instantiated at module scope regardless of config.** `new Resend(process.env.RESEND_API_KEY)` runs even if the env var is undefined. The `sendEmail` function does check for the key, but the client object is created unconditionally. Should be lazy-initialized. | `const resend = new Resend(process.env.RESEND_API_KEY);` at top level |
