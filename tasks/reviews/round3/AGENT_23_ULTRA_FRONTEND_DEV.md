# Agent 23 — Ultra Tier — Frontend Developer Review

**Total Issues Found: 14**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 4 / LOW: 2

---

### [FE-01] — Billing docs: Mission Control shown as available on Pro (should be Ultra-only)
**File:** `src/app/docs/billing/page.tsx:54`
**Severity:** CRITICAL
**Description:** The billing docs comparison table shows Mission Control as `Yes` for the Pro plan. However, every other source of truth (plans.ts features, landing Pricing.tsx comparison table line 117, plan-comparison.tsx line 127, and the sidebar gating in app-sidebar.tsx line 302) all agree that Mission Control is Ultra-only (Pro = false).
**Impact:** Users on Pro may believe they should have Mission Control access and file support tickets. Contradicts the actual feature gating in the product.
**Suggestion:** Change the Pro column for Mission Control from `Yes` to `No` at line 54 of `src/app/docs/billing/page.tsx`.

---

### [FE-02] — Billing docs: Ultra VPS storage listed as 400GB instead of 800GB
**File:** `src/app/docs/billing/page.tsx:56`
**Severity:** CRITICAL
**Description:** The billing docs feature comparison table shows Ultra VPS resources as `16 vCPU / 64 GB / 400 GB`. Every other definition (plans.ts line 68, landing Pricing.tsx line 109, billing-overview.tsx line 105, plan-comparison.tsx line 32) shows Ultra storage as 800GB.
**Impact:** Users evaluating Ultra see incorrect specs. This could affect purchasing decisions and creates a discrepancy with the actual provisioned infrastructure.
**Suggestion:** Change `400 GB` to `800 GB` in the Ultra column at line 56.

---

### [FE-03] — Billing docs: Ultra annual price shown as $298/mo (incorrect math)
**File:** `src/app/docs/billing/page.tsx:44`
**Severity:** CRITICAL
**Description:** The billing docs show Ultra annual pricing as `$298/mo`. The actual annual price is $3,499/yr (from plans.ts line 57), which divides to ~$291.58/mo. The displayed $298/mo would imply $3,576/yr. No other source shows this figure.
**Impact:** Users comparing annual pricing see an incorrect amount that does not match what they would actually be charged.
**Suggestion:** Change to `$292/mo` (rounding $3499/12) or display as `$3,499/yr` to match plans.ts.

---

### [FE-04] — Ultra badge in sidebar uses hardcoded violet instead of `--tier-ultra`
**File:** `src/lib/tier.ts:34-35`
**Severity:** HIGH
**Description:** The `PLAN_CONFIG` for Ultra uses hardcoded Tailwind violet classes: `bg-violet-500/15 text-violet-400 border border-violet-500/30`. The design system defines `--tier-ultra: #ffb86c` (warm amber) in globals.css. Violet is the Pro tier color (`--tier-pro: #c4a1ff`), not Ultra. This means the Ultra badge in the sidebar header (app-sidebar.tsx line 196) renders in the wrong color.
**Impact:** Ultra users see a violet badge that visually matches Pro instead of the designated warm amber. Breaks the color identity of the Ultra tier and confuses tier differentiation.
**Suggestion:** Change to `bg-[var(--tier-ultra)]/15 text-[var(--tier-ultra)] border border-[var(--tier-ultra)]/30` to use the CSS variable.

---

### [FE-05] — Admin subscription editor uses hardcoded violet for Ultra badge
**File:** `src/components/dashboard/admin-subscription-editor.tsx:133`
**Severity:** HIGH
**Description:** The `PLAN_COLORS` map for Ultra is `bg-violet-600 text-white`, and Enterprise is `bg-purple-600 text-white`. These are hardcoded Tailwind colors that do not use the design system variables (`--tier-ultra` is amber, `--tier-enterprise` is gold). This renders the Ultra badge as violet in the admin subscription editor, which is inconsistent with the amber Ultra color defined in the design system.
**Impact:** Admin users see incorrect tier colors when viewing/editing subscriptions, undermining the visual consistency of the tier system.
**Suggestion:** Use `bg-[var(--tier-ultra)] text-[var(--bg-base)]` for Ultra and `bg-[var(--tier-enterprise)] text-[var(--bg-base)]` for Enterprise.

---

### [FE-06] — Admin customers list uses hardcoded amber for Ultra instead of CSS variable
**File:** `src/components/dashboard/admin-customers.tsx:42`
**Severity:** MEDIUM
**Description:** The `PLAN_CONFIG` for Ultra uses `bg-amber-600/20 text-amber-400 border-amber-600/30`. While this happens to be close to the `--tier-ultra` amber, it hardcodes the color rather than referencing the CSS variable. Same issue at `admin-customer-detail.tsx:177`.
**Impact:** If the theme is changed (e.g., to Theme C where `--tier-ultra` is `#f472b6` pink), these admin components will still show amber. Violates the design system's single-source-of-truth principle.
**Suggestion:** Use `bg-[var(--tier-ultra)]/20 text-[var(--tier-ultra)] border-[var(--tier-ultra)]/30` in both files.

---

### [FE-07] — Pricing page does not visually differentiate Ultra card
**File:** `src/app/pricing/page.tsx:173-193`
**Severity:** HIGH
**Description:** The pricing page only applies special styling to the `highlighted` plan (Pro, via `plan.highlighted`). The Ultra card gets the same generic badge treatment as Starter and Enterprise: `bg-muted text-muted-foreground border-border`. There is no use of `--tier-ultra` color for the Ultra badge or card border. The "Most Powerful" badge blends with other non-highlighted badges.
**Impact:** Ultra, the highest paid tier at $350/mo, has no visual distinction on the pricing page. It does not stand out from the $59 Starter plan visually, which undermines the premium positioning.
**Suggestion:** Add Ultra-specific styling: use `--tier-ultra` for the badge background/text and apply a subtle Ultra border accent to the card, similar to how Pro gets `border-[var(--cream)]/30`.

---

### [FE-08] — Landing Pricing component duplicates plan data instead of importing from plans.ts
**File:** `src/components/landing/Pricing.tsx:9-100`
**Severity:** HIGH
**Description:** The landing page Pricing component defines its own inline plan data array with 100 lines of plan definitions, rather than importing from `src/lib/payments/plans.ts`. The feature lists differ between the two: for example, Starter in plans.ts has "Agent Store with free pre-built agents" while the landing page has "Agent Store (7 free agents)". The taglines also differ (plans.ts: "All-inclusive. One price. Zero hassle." vs landing: "All-inclusive. Zero hassle."). The Ultra features list omits "800GB storage" in the detail text while plans.ts includes it.
**Impact:** Any price or feature change requires updating multiple files. The inconsistencies between the two data sources create conflicting messaging across the site.
**Suggestion:** Import plan data from `plans.ts` and extend it with landing-specific fields (CTA text, accent variable) rather than duplicating.

---

### [FE-09] — Billing overview duplicates plan data with different Ultra features
**File:** `src/components/dashboard/billing-overview.tsx:67-131`
**Severity:** HIGH
**Description:** The billing overview defines its own `PLANS` array (lines 67-131) with Ultra features that differ from plans.ts. The billing version includes "5X credits", "RBAC workspaces & approvals", "Cost & token dashboard" which do not appear in the canonical plans.ts. Meanwhile plans.ts lists "Session replay with traces" and "Time tracking + calendar view" which the billing version omits. This is a third distinct Ultra feature list.
**Impact:** Users comparing features across pricing page, landing page, and billing page see three different feature descriptions for Ultra, creating confusion about what Ultra actually includes.
**Suggestion:** Import from `plans.ts` as the single source of truth.

---

### [FE-10] — Billing docs Pro storage discrepancy (200GB vs 400GB)
**File:** `src/app/docs/billing/page.tsx:56`
**Severity:** MEDIUM
**Description:** The billing docs show Pro VPS as `8 vCPU / 32 GB / 200 GB` storage. However, plans.ts line 50 says "8 vCPU, 32GB RAM, 400GB storage". The plan-comparison.tsx and landing Pricing.tsx also show 400GB for Pro.
**Impact:** Incorrect storage figure in docs undermines trust and causes confusion for Pro users evaluating their allocation.
**Suggestion:** Change to `200 GB` to `400 GB` in the Pro column.

---

### [FE-11] — Upgrade prompt does not use tier accent colors
**File:** `src/components/dashboard/upgrade-prompt.tsx:38-48`
**Severity:** MEDIUM
**Description:** The `UpgradePrompt` component uses generic `text-primary` for check icons regardless of the required plan tier. When prompting to upgrade to Ultra, there is no visual indication of the Ultra brand color. The lock icon is generic `text-muted-foreground`.
**Impact:** The upgrade prompt for Ultra looks identical to the Pro upgrade prompt. Ultra's premium positioning is lost in the generic presentation.
**Suggestion:** When `requiredPlan === "ultra"`, use `text-[var(--tier-ultra)]` for the plan label and check icons, and add a subtle Ultra-colored border or accent.

---

### [FE-12] — Dashboard demo hardcodes Pro plan data, does not show Ultra state
**File:** `src/app/dashboard-demo/page.tsx:27-28`
**Severity:** MEDIUM
**Description:** The dashboard demo overview page hardcodes `plan: "pro"` in the subscription object (line 28) regardless of the `?plan=ultra` query parameter passed via the URL. While the sidebar correctly reflects the Ultra plan, the overview content always shows "pro" as the current plan with Pro-level VPS specs (8 vCPU, 32GB RAM).
**Impact:** When users preview the Ultra dashboard from the landing page Pricing section (which links to `?plan=ultra`), the overview content does not reflect Ultra-level VPS specs or the Ultra plan name, creating a misleading demo.
**Suggestion:** Read the `plan` query parameter and adjust the demo data accordingly.

---

### [FE-13] — Enterprise missing from PLAN_PRICES lookup (blocks annual pricing)
**File:** `src/lib/payments/plans.ts:93-97`
**Severity:** LOW
**Description:** The `PLAN_PRICES` quick lookup object includes starter, pro, and ultra but excludes enterprise. While Enterprise is `contactUs: true`, the admin subscription editor (admin-subscription-editor.tsx line 24) defines its own `PRICE_MAP` that includes enterprise with `annual: 9999`. The inconsistency means any code relying on `PLAN_PRICES` for enterprise will get `undefined`.
**Impact:** Minor since enterprise uses a contact-us flow, but the inconsistency between `PLAN_PRICES` and the admin's `PRICE_MAP` could cause issues if enterprise self-service is ever added.
**Suggestion:** Add enterprise to `PLAN_PRICES` for completeness, or document why it is intentionally excluded.

---

### [FE-14] — Comparison table in billing docs: Starter shows Knowledge Base docs=50, API=Basic, Webhooks=2, Custom domain=No
**File:** `src/app/docs/billing/page.tsx:43-57`
**Severity:** LOW
**Description:** The billing docs comparison table shows Starter with `Knowledge Base documents: 50`, `API access: Basic`, `Webhooks: 2`, and `Custom domain: No`. However, plans.ts says Starter includes "Custom domain + auto-SSL" (line 28), and the landing Pricing comparison table (line 113-115) shows Knowledge Base, API + Webhooks as `false` for Starter. The billing docs imply Starter has limited access to these features rather than no access.
**Impact:** Creates conflicting expectations. A Starter user reading the billing docs might expect 50 KB documents and 2 webhooks, while the actual product gives them none.
**Suggestion:** Align billing docs with the canonical feature definitions. Starter should show Knowledge Base, Webhooks, and API access as "Not included" (or a dash), and Custom domain should be "Yes".
