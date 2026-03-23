# Agent 36 — Cross-Cutting — Integration Review
**Total Issues Found: 14**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 4 / LOW: 2

---

### [CROSS-01] — Billing docs claim Mission Control available on Pro; code enforces Ultra-only
**Files:** `src/app/docs/billing/page.tsx:54`, `src/lib/mc-route-guard.ts:48`, `src/components/dashboard/app-sidebar.tsx:303`
**Severity:** CRITICAL
**Description:** The billing docs comparison table says Mission Control is available for Pro (`<td>Yes</td>` for Pro column at line 54). However, all Mission Control API routes use `guardMCRoute()` which calls `hasAccess(plan, "ultra")` (mc-route-guard.ts:48), and the sidebar only shows Mission Control for Ultra+ plans (app-sidebar.tsx:303). The landing page comparison table (Pricing.tsx:117) correctly shows Mission Control as `false` for Pro.
**Impact:** Users on the Pro plan may believe they have Mission Control access based on the billing documentation, leading to confusion and potential support tickets when the feature is actually gated to Ultra.
**Recommendation:** Change billing docs line 54 from `<td>Yes</td>` to `<td>No</td>` for the Pro column on the Mission Control row.

---

### [CROSS-02] — Pro storage: 400GB in plans.ts/landing/billing-overview vs 200GB in billing docs and plans docs
**Files:** `src/lib/payments/plans.ts:50`, `src/components/landing/Pricing.tsx:109`, `src/components/dashboard/billing-overview.tsx:90`, `src/app/docs/billing/page.tsx:56`, `src/app/docs/plans/page.tsx:75,144`
**Severity:** CRITICAL
**Description:** There is a major inconsistency in Pro plan storage across the codebase:
- `plans.ts:50` says "8 vCPU, 32GB RAM, 400GB storage"
- `landing/Pricing.tsx:109` comparison table says Pro: "400 GB"
- `billing-overview.tsx:90` says "8 vCPU, 32GB RAM, 400GB storage"
- `landing/HowItWorks.tsx:62` says "400GB NVMe"
- `upgrade-dialog.tsx:40` says "400GB storage"

But:
- `docs/billing/page.tsx:56` says Pro: "8 vCPU / 32 GB / 200 GB"
- `docs/plans/page.tsx:75` says Pro storage: "200 GB"
- `docs/plans/page.tsx:144` says "8 vCPU, 32 GB RAM, 200 GB storage"

**Impact:** Customers reading the docs see 200GB for Pro, while the pricing page and plans.ts advertise 400GB. This could be perceived as bait-and-switch if docs are treated as the contract.
**Recommendation:** Reconcile all sources. If 400GB is correct (as per plans.ts source of truth), update docs/billing and docs/plans to say 400GB. If 200GB is correct, update plans.ts and all other references.

---

### [CROSS-03] — Ultra storage: 800GB in plans.ts/landing vs 400GB in billing docs and plans docs
**Files:** `src/lib/payments/plans.ts:68`, `src/components/landing/Pricing.tsx:109`, `src/app/docs/billing/page.tsx:56`, `src/app/docs/plans/page.tsx:75,158`
**Severity:** CRITICAL
**Description:** Same storage mismatch for Ultra plan:
- `plans.ts:68` says "16 vCPU, 64GB RAM, 800GB storage"
- `landing/Pricing.tsx:109` says Ultra: "800 GB"
- `billing-overview.tsx:105` says "800GB storage"
- `upgrade-dialog.tsx:49` says "800GB storage"

But:
- `docs/billing/page.tsx:56` says Ultra: "16 vCPU / 64 GB / 400 GB"
- `docs/plans/page.tsx:75` says Ultra storage: "400 GB"
- `docs/plans/page.tsx:158` says "16 vCPU, 64 GB RAM, 400 GB storage"

**Impact:** Same as CROSS-02 but for Ultra tier. 400GB vs 800GB is a 2x discrepancy.
**Recommendation:** Align all sources with plans.ts as the single source of truth (800GB for Ultra).

---

### [CROSS-04] — Billing docs annual pricing does not match plans.ts calculated values
**Files:** `src/app/docs/billing/page.tsx:44`, `src/lib/payments/plans.ts:19,37,57`
**Severity:** HIGH
**Description:** The billing docs show annual per-month prices as:
- Starter: $50/mo (line 44) — but $599/12 = $49.92/mo
- Pro: $110/mo (line 44) — but $1299/12 = $108.25/mo
- Ultra: $298/mo (line 44) — but $3499/12 = $291.58/mo

The pricing page (pricing/page.tsx:207) and landing Pricing.tsx:208 both use `Math.round(plan.annual / 12)` which yields $50, $108, $292. The billing docs use different rounded values for Pro ($110 vs $108) and Ultra ($298 vs $292).
**Impact:** Users comparing pricing page to billing docs will see different per-month rates for annual billing, creating trust issues.
**Recommendation:** Either use consistent rounding everywhere or display the exact annual total rather than per-month equivalent. The docs should match the `Math.round(annual/12)` formula: Starter=$50, Pro=$108, Ultra=$292.

---

### [CROSS-05] — Billing docs advertise limits (KB docs: 50/500, messages: 5K/50K, webhooks: 2/10) with no enforcement in code
**Files:** `src/app/docs/billing/page.tsx:47-53`, `src/app/api/knowledge-base/upload/route.ts`, `src/app/api/webhooks/route.ts`
**Severity:** HIGH
**Description:** The billing docs comparison table defines specific tier-based limits:
- Knowledge Base documents: Starter=50, Pro=500, Ultra=Unlimited
- Monthly messages: Starter=5,000, Pro=50,000, Ultra=Unlimited
- Webhooks: Starter=2, Pro=10, Ultra=Unlimited
- Audit logging: Starter=7 days, Pro=30 days, Ultra=90 days

However, none of these limits are enforced in the API routes. The knowledge base routes (`api/knowledge-base/upload/route.ts`) only check a 100MB storage limit with no document count check per tier. The webhook routes (`api/webhooks/route.ts`) gate on Pro plan access but do not limit count to 10. The audit log route does not filter by retention period per tier. And there is no monthly message limit enforcement anywhere.

Additionally, the billing docs claim Starter has "Basic" API access and Knowledge Base (50 docs), but the code completely blocks Starter users from both features (API and KB require Pro+).
**Impact:** Either features are more restrictive than documented (Starter KB/API blocked entirely vs documented as limited) or less restrictive (Pro has unlimited webhooks/KB docs vs documented limits). Both create a contract mismatch.
**Recommendation:** Either implement the documented limits in the API routes, or update the billing docs to match actual behavior (Starter: no KB/API/webhooks/audit, Pro+: unlimited).

---

### [CROSS-06] — Billing docs say Starter has custom domain "No" but plans.ts says "Custom domain + auto-SSL" for Starter
**Files:** `src/app/docs/billing/page.tsx:51`, `src/lib/payments/plans.ts:28`
**Severity:** HIGH
**Description:** The billing docs comparison table says Custom domain for Starter is "No" (line 51). But plans.ts lists "Custom domain + auto-SSL" as a Starter feature (line 28). The landing page also lists this as a Starter feature.
**Impact:** Starter customers see "Custom domain" on the pricing page but the billing docs say they don't have it. Direct contradiction.
**Recommendation:** Align billing docs with plans.ts — Starter should show "Yes" for Custom domain.

---

### [CROSS-07] — Rate limits not differentiated by tier despite comparison table claiming 1x/5x/10x/25x
**Files:** `src/components/landing/Pricing.tsx:119`, `src/lib/rate-limit.ts`, `src/lib/v1-auth.ts:117`
**Severity:** HIGH
**Description:** The landing page comparison table (Pricing.tsx:119) shows rate limits as Starter=1x, Pro=5x, Ultra=10x, Enterprise=25x. However, the rate limiting code applies the same limits regardless of tier. In v1-auth.ts:117, the rate limit uses `apiKey.rate_limit_per_min || 60` — this is per-key, not per-tier. All session-based API routes use hardcoded limits (e.g., `rateLimit(identifier, 20, 60_000)`) with no tier multiplier. The Mission Control routes use `guardMCRoute` with fixed limits (e.g., `max: 30`).

There is no code anywhere that applies the 1x/5x/10x/25x multiplier based on the user's plan.
**Impact:** All users get the same rate limits regardless of plan, making the advertised rate limit tiers misleading.
**Recommendation:** Implement a tier-based rate limit multiplier. Add a `getRateLimitMultiplier(plan)` function to `tier.ts` and apply it in both `v1-auth.ts` and session-based rate limit calls.

---

### [CROSS-08] — In-memory rateLimit() never records hits — always returns success
**Files:** `src/lib/rate-limit.ts:74-82`
**Severity:** HIGH
**Description:** The synchronous `rateLimit()` function (used by all session-based API routes) calls `getRateLimitStatus()` to check remaining count, but never actually records the hit. It does not push `Date.now()` into the timestamps array in the `store` Map. The function at line 74-82 gets `remaining` from `getRateLimitStatus` but never calls `store.set()` or pushes a timestamp. This means the in-memory rate limiter will always report `remaining > 0` (equal to the limit) and `success: true` for every request.

The `rateLimitAsync()` function (line 92) calls `rateLimit()` as a "pre-check" which will always pass, then falls through to the Supabase RPC — but if the RPC doesn't exist, it falls back to the broken in-memory result.
**Impact:** Rate limiting is completely non-functional for all session-based API routes. Any user can make unlimited requests.
**Recommendation:** Fix `rateLimit()` to record hits. After checking remaining, push `Date.now()` to the timestamps array and call `cleanup()`.

---

### [CROSS-09] — Billing docs claim Starter has "Basic" analytics; code blocks all analytics for Starter
**Files:** `src/app/docs/billing/page.tsx:52`, `src/app/api/analytics/usage/route.ts:22`, `src/app/api/analytics/funnels/route.ts:15`
**Severity:** MEDIUM
**Description:** The billing docs say Starter gets "Basic" analytics. However, every analytics API route (`usage`, `funnels`, `paths`, `resolution`, `intents`, `anomalies`, `csat`, `live`, `dashboards`) requires `hasAccess(plan, "pro")`, completely blocking Starter users from all analytics endpoints.
**Impact:** Starter users expect some level of analytics based on the docs but get none.
**Recommendation:** Either implement basic analytics for Starter, or update the billing docs to say "No" for Starter analytics.

---

### [CROSS-10] — Plans docs (docs/plans) show Starter with "3 models" and "5 model switches/month" — not enforced or reflected in plans.ts
**Files:** `src/app/docs/plans/page.tsx:81-82`, `src/lib/payments/plans.ts:22-31`
**Severity:** MEDIUM
**Description:** The plans docs comparison table says Starter gets "3 models" and "5 model switches/month", Pro gets "3+ models" and "Unlimited switches", Ultra gets "All models" and "Unlimited switches". Plans.ts simply says "AI models included — no API keys" for all plans. The model change API route (`api/models/change/route.ts`) does not enforce any model switch limit per tier.
**Impact:** Documented model restrictions don't exist in the codebase. Starter users may have access to all models with unlimited switches, or the docs promise limitations that create unnecessary expectations.
**Recommendation:** Align docs/plans with actual behavior (all tiers get all models, unlimited switches) or implement per-tier model restrictions.

---

### [CROSS-11] — Upgrade prompt features don't match plans.ts or pricing page features
**Files:** `src/components/dashboard/upgrade-prompt.tsx:8-28`, `src/lib/payments/plans.ts:43-51`
**Severity:** MEDIUM
**Description:** The `UpgradePrompt` component (shown when Starter users try to access Pro features) lists features that don't match plans.ts:
- "Team access with role-based permissions" — not mentioned anywhere in plans.ts or pricing
- "2x credits & priority support" — plans.ts doesn't mention credits or support tiers for Pro
- "5x credits & enterprise-grade monitoring" — plans.ts doesn't mention credits for Ultra
- Missing actual Pro features like "Knowledge Base with AI search (RAG)", "Webhooks (9 events, auto-retry)"

**Impact:** Users see different feature lists depending on where they look, creating inconsistent messaging about what each tier includes.
**Recommendation:** Update UpgradePrompt to pull features from plans.ts or at minimum align the text with the canonical feature list.

---

### [CROSS-12] — Landing page Pricing taglines differ from plans.ts taglines
**Files:** `src/components/landing/Pricing.tsx:17,41`, `src/lib/payments/plans.ts:21,39`
**Severity:** LOW
**Description:** Minor text inconsistencies:
- Starter tagline: plans.ts says "All-inclusive. One price. Zero hassle." vs Pricing.tsx says "All-inclusive. Zero hassle." (missing "One price.")
- Pro tagline: plans.ts says "For builders who ship." vs Pricing.tsx says "For teams that build."
**Impact:** Minor brand inconsistency across two views of the same data. Not user-facing critical but makes maintenance harder.
**Recommendation:** Have the landing Pricing component import from plans.ts instead of duplicating plan data locally.

---

### [CROSS-13] — Landing Pricing.tsx duplicates all plan data instead of importing from plans.ts
**Files:** `src/components/landing/Pricing.tsx:9-100`, `src/lib/payments/plans.ts:14-90`
**Severity:** MEDIUM
**Description:** The landing page Pricing component defines its own local `plans` array (lines 9-100) with hardcoded prices, features, and tier names instead of importing from `plans.ts`. This creates a maintenance burden — any price or feature change requires updating two files. The pricing page (`src/app/pricing/page.tsx`) correctly imports from `plans.ts`, showing this was intended to be the single source of truth.
**Impact:** Drift between the two sources (as seen in CROSS-12 tagline differences). Any future price change that only updates plans.ts will leave the landing page showing stale data.
**Recommendation:** Refactor Pricing.tsx to import `PLANS` from `plans.ts` and add any display-specific fields (like `ctaHref`, `accentVar`) as extensions.

---

### [CROSS-14] — Starter plan features in landing Pricing.tsx mention "Agent Store (7 free agents)" — plans.ts says "Agent Store with free pre-built agents"
**Files:** `src/components/landing/Pricing.tsx:26`, `src/lib/payments/plans.ts:26`
**Severity:** LOW
**Description:** The landing page Pricing component specifies "Agent Store (7 free agents)" while plans.ts says "Agent Store with free pre-built agents" without specifying a count. Per memory instructions, specific counts should be avoided.
**Impact:** If the number of free agents changes, the landing page will be stale. Also contradicts the project guideline about not specifying counts.
**Recommendation:** Change to "Agent Store with free pre-built agents" to match plans.ts and the no-count guideline.
