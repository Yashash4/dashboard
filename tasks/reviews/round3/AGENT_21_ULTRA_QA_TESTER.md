# Agent 21 — Ultra Tier — QA Tester Review

**Total Issues Found: 12**
- CRITICAL: 2 / HIGH: 4 / MEDIUM: 4 / LOW: 2

---

### [QA-01] — No tier-based rate limit differentiation for Ultra users
**File:** `src/lib/v1-auth.ts:117`
**Severity:** HIGH
**Description:** The V1 auth middleware uses `apiKey.rate_limit_per_min || 60` as the default rate limit for all plans. The comparison table in `src/components/landing/Pricing.tsx:119` advertises rate limits of "1x" for Starter, "5x" for Pro, "10x" for Ultra, and "25x" for Enterprise. However, the actual code never applies tier-multiplied rate limits. An Ultra user paying $350/mo gets the exact same per-key RPM options (30, 60, 120, 300) as a Pro user at $129/mo. The `plan` value returned by `validateV1Auth` is never used to scale limits.
**Steps to Reproduce:** Create an API key as an Ultra user. Set rate limit to 300 RPM. Create a key as a Pro user with the same 300 RPM. Both behave identically.
**Expected vs Actual:** Ultra users should get 10x the base rate limits (e.g., 600 RPM default). Actual: Ultra users get the same limits as Pro users.

---

### [QA-02] — Billing docs: Mission Control listed as available for Pro (contradicts all other sources)
**File:** `src/app/docs/billing/page.tsx:54`
**Severity:** CRITICAL
**Description:** The billing docs plan comparison table shows Mission Control as "Yes" for the Pro tier. Every other source in the codebase correctly gates Mission Control to Ultra only: `mc-route-guard.ts:48` requires `hasAccess(plan, "ultra")`, the sidebar (`app-sidebar.tsx:302`) only shows Ultra nav for Ultra+ plans, the landing page comparison table (`Pricing.tsx:117`) shows Mission Control as `false` for Pro, and all dashboard Mission Control pages redirect non-Ultra users. This billing doc will confuse Pro users into thinking they have Mission Control access.
**Steps to Reproduce:** Navigate to `/docs/billing` and read the plan comparison table. The "Mission Control" row shows "Yes" for Pro.
**Expected vs Actual:** Expected: Mission Control shows "No" for Pro, "Yes" for Ultra/Enterprise. Actual: Shows "Yes" for Pro.

---

### [QA-03] — Billing docs: VPS storage for Pro and Ultra contradicts plans.ts and landing page
**File:** `src/app/docs/billing/page.tsx:56`
**Severity:** HIGH
**Description:** The billing docs state Pro VPS has "200 GB" storage and Ultra has "400 GB" storage. However, `plans.ts:50` says Pro has "400GB storage", `plans.ts:68` says Ultra has "800GB storage", and the landing page comparison table (`Pricing.tsx:109`) says Pro has "400 GB" and Ultra has "800 GB". The billing docs are understating Ultra's storage by 50% and Pro's storage by 50%.
**Steps to Reproduce:** Compare the storage values in `/docs/billing` against `/pricing` (landing page) and `plans.ts`.
**Expected vs Actual:** Expected: Pro = 400 GB, Ultra = 800 GB (matching plans.ts). Actual billing docs: Pro = 200 GB, Ultra = 400 GB.

---

### [QA-04] — Billing docs: Ultra annual effective monthly price says $298/mo, actual is $291.58
**File:** `src/app/docs/billing/page.tsx:44`
**Severity:** MEDIUM
**Description:** The billing docs plan comparison shows Ultra annual price as "$298/mo". The actual calculation from `plans.ts` is $3499/12 = $291.58/mo, which is confirmed in the more detailed plans page (`docs/plans/page.tsx:179`). The $298 figure in the billing docs is wrong.
**Steps to Reproduce:** Navigate to `/docs/billing` and see the "Price (annual)" row for Ultra. Compare with the "Effective Monthly" column in `/docs/plans`.
**Expected vs Actual:** Expected: ~$292/mo. Actual: $298/mo.

---

### [QA-05] — Billing docs: Starter says "Basic" API access, but plans.ts/v1-auth blocks Starter entirely
**File:** `src/app/docs/billing/page.tsx:49`
**Severity:** MEDIUM
**Description:** The billing docs say Starter gets "Basic" API access. In reality, `v1-auth.ts:96` explicitly blocks all API access for Starter users: `if (!["pro", "ultra", "enterprise"].includes(plan))` returns an error. Starter users get zero API access, not "Basic" access. This is misleading for prospective Ultra users evaluating the comparison table.
**Steps to Reproduce:** Read the billing docs comparison table. Note Starter shows "Basic" API access. Then try to use V1 API with a Starter plan key.
**Expected vs Actual:** Expected: Billing docs should say "Not included" for Starter API access. Actual: Says "Basic".

---

### [QA-06] — Billing docs: Custom domain "No" for Starter contradicts plans.ts
**File:** `src/app/docs/billing/page.tsx:51`
**Severity:** MEDIUM
**Description:** The billing docs show custom domain as "No" for Starter, "Yes" for Pro/Ultra. However, `plans.ts:28` explicitly lists "Custom domain + auto-SSL" as a Starter feature. All plans include custom domains since every provisioned VPS gets a hostname under `clawhq.tech` with auto-SSL.
**Steps to Reproduce:** Compare the custom domain row in billing docs vs Starter features in `plans.ts`.
**Expected vs Actual:** Expected: All plans show "Yes" for custom domain. Actual: Billing docs say "No" for Starter.

---

### [QA-07] — PLAN_PRICES missing enterprise, admin-subscription-editor has different enterprise annual price
**File:** `src/lib/payments/plans.ts:93-97` and `src/components/dashboard/admin-subscription-editor.tsx:24`
**Severity:** HIGH
**Description:** The `PLAN_PRICES` lookup in `plans.ts` does not include an enterprise entry. The pricing page uses `PLAN_PRICES[planName]` to determine payment amounts. If an admin tries to set a user to enterprise via the pricing page flow, `PLAN_PRICES["enterprise"]` returns undefined, and `handleSubscribe` returns early without processing. Meanwhile, `admin-subscription-editor.tsx:24` defines enterprise annual as `$9,999`, but `plans.ts:75` defines enterprise `annualUsd: 0` (since it's contact-us). This creates an inconsistency: admin tools suggest enterprise annual is $9,999 while the plan definition says $0.
**Steps to Reproduce:** Check `PLAN_PRICES` object - no enterprise key. Check `PRICE_MAP` in admin-subscription-editor - enterprise annual is 9999.
**Expected vs Actual:** Expected: Consistent enterprise pricing or clear N/A handling. Actual: Three different values across files (0 in plans.ts, undefined in PLAN_PRICES, 9999 in admin editor).

---

### [QA-08] — Ultra plan has no tier-specific API key limits
**File:** `src/app/api/keys/route.ts:9`
**Severity:** HIGH
**Description:** The API key creation route hardcodes `MAX_ACTIVE_KEYS = 5` for all plans. The valid rate limit options are fixed at `[30, 60, 120, 300]` RPM (line 156). Ultra users paying nearly 3x the Pro price get the same 5-key limit and the same rate limit options. Given the "10x rate limits" marketing claim, Ultra users should have higher key limits and higher RPM options.
**Steps to Reproduce:** As an Ultra user, create 5 API keys. Try to create a 6th. Same limit as a Pro user.
**Expected vs Actual:** Expected: Ultra should have higher key limits (e.g., 10-20 keys) and higher RPM tiers (e.g., 600 RPM). Actual: Same 5-key limit and same RPM options as Pro.

---

### [QA-09] — Billing docs: Knowledge Base docs limit "50" for Starter, but KB is not a Starter feature
**File:** `src/app/docs/billing/page.tsx:47`
**Severity:** LOW
**Description:** The billing docs show Starter getting "50" Knowledge Base documents and "5,000" monthly messages. Knowledge Base is a Pro feature (as shown in `plans.ts` and the landing page). The Starter row should say "Not included" or 0 for KB docs. Similarly, the message limits are not enforced anywhere in code, so these numbers are aspirational at best.
**Steps to Reproduce:** Read billing docs table for Starter Knowledge Base documents.
**Expected vs Actual:** Expected: "Not included" for Starter KB. Actual: "50".

---

### [QA-10] — Plans docs: Ultra VPS storage says 400 GB, should be 800 GB
**File:** `src/app/docs/plans/page.tsx:158`
**Severity:** MEDIUM
**Description:** The plans documentation page lists Ultra VPS as "16 vCPU, 64 GB RAM, 400 GB storage". However, `plans.ts:68` says "800GB storage" for Ultra, and the landing page comparison table (`Pricing.tsx:109`) also says "800 GB". The plans docs understate Ultra storage by half.
**Steps to Reproduce:** Navigate to `/docs/plans` and find the Ultra VPS specification.
**Expected vs Actual:** Expected: 800 GB. Actual: 400 GB.

---

### [QA-11] — Ultra landing card CTA links to /pricing without plan preselection
**File:** `src/components/landing/Pricing.tsx:65-66`
**Severity:** LOW
**Description:** All plan cards on the landing page link to `/pricing` without passing any plan identifier as a query parameter. The pricing page supports `?plan=ultra` for preselection (line 22, `searchParams.get("plan")`), but the landing page CTAs do not use it. An Ultra prospect clicking "Go Ultra" lands on the pricing page with no plan highlighted, having to find and re-select Ultra.
**Steps to Reproduce:** Click "Go Ultra" on the landing page pricing section. Arrive at `/pricing` with no plan preselected.
**Expected vs Actual:** Expected: Link to `/pricing?plan=ultra` so the Ultra card is highlighted. Actual: Links to bare `/pricing`.

---

### [QA-12] — Pro docs page does not mention Ultra as the next upgrade path
**File:** `src/app/docs/pro/page.tsx:1-237`
**Severity:** LOW (informational)
**Description:** The Pro features documentation page (`/docs/pro`) has a "Pro vs. Starter" comparison table but never mentions Ultra or Mission Control as the next tier. There is no upsell or "What's next" section pointing Pro users to Ultra features. This is a missed opportunity given Ultra is $350/mo vs Pro's $129/mo. The "Getting Started with Pro" section at the end would be an ideal place to mention the Ultra upgrade path.
**Steps to Reproduce:** Read the full Pro features docs page. No mention of Ultra anywhere.
**Expected vs Actual:** Expected: A brief mention or link to Ultra features for Pro users considering an upgrade. Actual: No Ultra mention at all.

---

## Summary

The most critical issues are:

1. **Billing docs falsely claim Pro has Mission Control** (QA-02) -- this will cause support tickets and user confusion.
2. **No tier-based rate limit differentiation** (QA-01, QA-08) -- Ultra's "10x rate limits" marketing claim is not implemented. Ultra users get identical API limits to Pro users.
3. **Storage figures inconsistent across 3+ documentation pages** (QA-03, QA-10) -- billing docs and plans docs both understate Ultra's storage compared to `plans.ts`.
4. **Enterprise pricing inconsistency** (QA-07) -- three different values across three files.
