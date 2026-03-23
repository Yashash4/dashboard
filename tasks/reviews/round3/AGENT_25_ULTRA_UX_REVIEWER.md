# Agent 25 — Ultra Tier — UX Reviewer Review

**Total Issues Found: 14**
- CRITICAL: 2 / HIGH: 4 / MEDIUM: 5 / LOW: 3

---

### [UX-01] — Ultra badge color in sidebar does not match Ultra tier color variable
**File:** `src/lib/tier.ts:34-35`
**Severity:** HIGH
**Description:** The Ultra badge in the sidebar uses `bg-violet-500/15 text-violet-400 border border-violet-500/30` (hardcoded violet Tailwind colors), while the design system defines `--tier-ultra: #ffb86c` (warm amber) in `globals.css:57`. The admin subscription editor also uses a different hardcoded color: `bg-violet-600 text-white` at `src/components/dashboard/admin-subscription-editor.tsx:133`. This means the Ultra brand color is inconsistent across three touchpoints: sidebar badge (violet), admin editor (violet-600), and landing page pricing (warm amber via `var(--tier-ultra)`).
**User Impact:** Ultra users see a violet badge in their sidebar but an amber accent on the marketing page, creating a disjointed brand identity. The color mismatch undermines trust for a $350/mo tier.
**Recommendation:** Replace all hardcoded violet colors for Ultra with `var(--tier-ultra)` from the design system. The badge class in `tier.ts` should use something like `bg-[var(--tier-ultra)]/15 text-[var(--tier-ultra)] border border-[var(--tier-ultra)]/30`.

### [UX-02] — No downgrade button or cancellation flow on billing page
**File:** `src/components/dashboard/billing-overview.tsx:349-374`
**Severity:** CRITICAL
**Description:** The billing page only renders an "Upgrade" button for plans above the current plan, and a disabled "Current Plan" button for the active plan. There is no downgrade button, no cancel subscription button, and no link to initiate cancellation. The billing docs at `src/app/docs/billing/page.tsx:92-100` describe a downgrade flow, and lines 192-199 describe cancellation from the billing page, but the actual billing UI has neither.
**User Impact:** Ultra users at $350/mo cannot self-serve downgrade to Pro or cancel their subscription from the dashboard. They would need to email support or find an undiscoverable path. This is a major friction point and potential legal/compliance issue for subscription transparency.
**Recommendation:** Add a "Downgrade" button for plans below current tier (with confirmation dialog explaining end-of-cycle activation), and a "Cancel Subscription" action in the billing page.

### [UX-03] — No Ultra-specific documentation page
**File:** `src/app/docs/pro/page.tsx` (entire file)
**Severity:** HIGH
**Description:** There is a dedicated Pro Features Overview page at `/docs/pro` with detailed descriptions of all 10 Pro modules and a Pro vs Starter comparison table. There is no equivalent page for Ultra. Ultra users paying $350/mo have no documentation page explaining Mission Control, the task board, agent orchestration, session replay, or time tracking. The docs sidebar likely links to `/docs/pro` but has no `/docs/ultra` equivalent.
**User Impact:** Ultra users have no onboarding documentation for their exclusive features. They discover features only through the sidebar navigation, with no guidance on how to use Mission Control, set up agent orchestration, or leverage session replay. This is especially problematic given that Ultra features (orchestration, task boards) are more complex than Pro features.
**Recommendation:** Create a `/docs/ultra` page mirroring the structure of the Pro page, with detailed descriptions of each Ultra-exclusive feature, an Ultra vs Pro comparison table, and a "Getting Started with Ultra" section.

### [UX-04] — Billing docs show Mission Control available on Pro tier (incorrect)
**File:** `src/app/docs/billing/page.tsx:54`
**Severity:** CRITICAL
**Description:** The plan comparison table in the billing documentation shows Mission Control as "Yes" for the Pro tier. However, in the actual plan definitions (`src/lib/payments/plans.ts:62-69`) and the landing page comparison table (`src/components/landing/Pricing.tsx:117`), Mission Control is an Ultra-exclusive feature (Pro = false, Ultra = true). The sidebar also gates Mission Control behind `hasAccess(plan, "ultra")` at `src/components/dashboard/app-sidebar.tsx:302`.
**User Impact:** Pro users reading the billing docs may believe they should have access to Mission Control, leading to confusion and support tickets. Ultra users may feel their $350/mo tier is less differentiated if Pro is documented as having Mission Control too.
**Recommendation:** Fix the billing docs table to show Mission Control as "No" for Pro and "Yes" for Ultra (and Enterprise), consistent with the actual feature gating.

### [UX-05] — Billing docs show inconsistent storage values for Ultra
**File:** `src/app/docs/billing/page.tsx:56`
**Severity:** MEDIUM
**Description:** The billing docs VPS resources row shows Ultra as "16 vCPU / 64 GB / 400 GB" storage, but the plan definitions in `plans.ts:68` and the landing page comparison table at `Pricing.tsx:109` both show Ultra as having "800 GB" storage. The billing docs also show Pro as "200 GB" while plans.ts and the comparison table show "400 GB".
**User Impact:** Ultra users checking their plan entitlements in the docs see half the storage they should have. This could lead them to believe they are not getting their money's worth or cause confusion when actual storage differs from documented limits.
**Recommendation:** Update billing docs storage values to match the canonical plan definitions: Pro = 400 GB, Ultra = 800 GB.

### [UX-06] — Billing docs show inconsistent annual pricing for Ultra
**File:** `src/app/docs/billing/page.tsx:44`
**Severity:** MEDIUM
**Description:** The billing docs show Ultra annual price as "$298/mo" (which would be $3,576/yr), but the actual annual price in `plans.ts:57` is $3,499/yr ($291.58/mo). The docs also show Starter annual as "$50/mo" ($600/yr) versus actual $599/yr, and Pro annual as "$110/mo" ($1,320/yr) versus actual $1,299/yr.
**User Impact:** Ultra users comparing pricing see incorrect annual rates in the docs, potentially causing confusion or distrust when the actual charge differs from what documentation states.
**Recommendation:** Update billing docs prices to match the canonical values in `plans.ts`.

### [UX-07] — Billing docs show Starter has "Custom domain: No" contradicting plan definitions
**File:** `src/app/docs/billing/page.tsx:51`
**Severity:** MEDIUM
**Description:** The billing docs table shows Starter as not having custom domain support. However, the actual Starter plan definition in `plans.ts:28` includes "Custom domain + auto-SSL" as a feature. This creates a false differentiation point that could mislead users into thinking they need Pro/Ultra for a custom domain.
**User Impact:** Potential Ultra users evaluating whether to upgrade may use incorrect feature comparisons in the docs, undermining their trust in the platform's transparency.
**Recommendation:** Update the billing docs to show custom domain as included in all tiers, consistent with plans.ts.

### [UX-08] — Ultra card on pricing page has no visual distinction from Starter
**File:** `src/app/pricing/page.tsx:173-278`
**Severity:** HIGH
**Description:** On the `/pricing` page, only the Pro plan card has visual distinction (`highlighted: true` adds a colored border and accent CTA button). The Ultra card at $350/mo looks identical to the Starter card at $59/mo — same border color, same outline-variant button, same badge styling (both use the muted gray badge style since `plan.highlighted` is false). The Ultra "Most Powerful" badge gets the same gray treatment as any non-highlighted plan badge at line 188.
**User Impact:** Ultra, the highest paid self-serve tier, is visually de-emphasized compared to Pro. Users scanning the pricing page may not even notice Ultra or may perceive it as less important. For a $350/mo plan, the lack of visual distinction makes it harder to justify the premium.
**Recommendation:** Give the Ultra card its own visual treatment — use `var(--tier-ultra)` for the border accent, badge background, and CTA button. The card should feel premium and distinct from both Starter and Pro.

### [UX-09] — Landing page pricing CTA links all go to generic /pricing with no plan preselection
**File:** `src/components/landing/Pricing.tsx:65-66`
**Severity:** MEDIUM
**Description:** All plan CTA buttons on the landing page link to `/pricing` without passing a `?plan=` parameter. The pricing page does support a `preselectedPlan` query parameter (line 23 of `pricing/page.tsx`), which would highlight the selected card with a ring. But the landing page never uses this, so users clicking "Go Ultra" land on a generic pricing page and must find Ultra again.
**User Impact:** Users who have already decided on Ultra from the landing page are forced to re-locate the Ultra card on the pricing page, adding unnecessary friction to a high-value conversion flow.
**Recommendation:** Update the landing page CTA hrefs to include the plan parameter: `/pricing?plan=ultra`, `/pricing?plan=pro`, etc.

### [UX-10] — Upgrade prompt features list is inconsistent with actual Ultra plan features
**File:** `src/components/dashboard/upgrade-prompt.tsx:19-27`
**Severity:** HIGH
**Description:** The upgrade prompt for Ultra lists features like "RBAC workspaces & approvals", "5x credits & enterprise-grade monitoring", and "End-to-end tracing & time travel debugging" that do not appear in the canonical plan definitions at `plans.ts:61-69`. Meanwhile, actual Ultra features like "Kanban task board" and "16 vCPU, 64GB RAM, 800GB storage" are missing from the upgrade prompt. The billing overview also has its own divergent Ultra feature list at `billing-overview.tsx:104-114` with items like "RBAC workspaces & approvals" and "Cost & token dashboard" not found in plans.ts.
**User Impact:** Users encountering the upgrade prompt see different features than what they saw on the pricing/landing pages, creating confusion about what Ultra actually includes. If they upgrade based on "RBAC workspaces & approvals" but that feature does not exist, it damages trust.
**Recommendation:** Centralize the Ultra feature list. Have `upgrade-prompt.tsx` and `billing-overview.tsx` import from `plans.ts` (or a shared feature config) to ensure consistency across all touchpoints.

### [UX-11] — No pricing/billing toggle ARIA labels for screen readers
**File:** `src/app/pricing/page.tsx:143-164`, `src/components/landing/Pricing.tsx:155-171`
**Severity:** MEDIUM
**Description:** The Monthly/Annual toggle buttons on both the pricing page and landing page pricing section lack `aria-pressed` or `role="tab"` attributes. They are plain `<button>` elements with only visual styling to indicate the active state. Screen reader users cannot determine which billing cycle is currently selected.
**User Impact:** Visually impaired Ultra users cannot determine whether they are viewing monthly or annual pricing, which matters significantly at Ultra's price point ($350/mo vs $292/mo annual).
**Recommendation:** Add `role="tablist"` to the container and `role="tab"` with `aria-selected` to each toggle button. Alternatively, use `aria-pressed` on each button.

### [UX-12] — Ultra plan on billing page shows annual price without per-month breakdown
**File:** `src/components/dashboard/billing-overview.tsx:318-326`
**Severity:** LOW
**Description:** When the annual toggle is active on the billing page, the Ultra plan card shows "$3499/yr" but does not show the per-month equivalent ($292/mo). In contrast, the pricing page and landing page both show the annual price broken down per month. The monthly view shows "or $3499/yr" as a secondary line, but the annual view just shows the lump sum.
**User Impact:** Ultra users on the billing page cannot quickly compare the annual per-month cost versus monthly billing. At Ultra's price point, the $58/mo savings is significant but not surfaced in the annual view.
**Recommendation:** Show "$292/mo billed annually" or "$3,499/yr ($292/mo)" in the annual view to help users quickly compare.

### [UX-13] — Upgrade prompt links to /billing but should support direct Ultra upgrade
**File:** `src/components/dashboard/upgrade-prompt.tsx:54-56`
**Severity:** LOW
**Description:** The upgrade prompt's CTA button says "View Plans" and links to `/billing`. When a Starter user encounters an Ultra-gated feature (Mission Control), they see the Ultra upgrade prompt but must navigate to billing, find the Ultra card, and click Upgrade there. The prompt could initiate the upgrade flow directly.
**User Impact:** Extra navigation steps in the upgrade funnel for Ultra-gated features. Each additional click is a potential drop-off point for a $350/mo conversion.
**Recommendation:** Add a direct "Upgrade to Ultra" button that either opens the upgrade dialog directly or links to `/billing?upgrade=ultra` with auto-scrolling to the Ultra card.

### [UX-14] — Pro docs page has hardcoded color instead of using design system variable
**File:** `src/app/docs/pro/page.tsx:8`, `src/app/docs/pro/api/page.tsx:8`
**Severity:** LOW
**Description:** The Pro badge on documentation pages uses hardcoded color `#ffe0c2` (`bg-[#ffe0c2]/10 text-[#ffe0c2]`) instead of the design system's `--tier-pro` variable (`#c4a1ff`, soft violet) or `--cta` variable. This hardcodes the CTA cream color rather than the Pro tier color, and would not update if the theme changes.
**User Impact:** Minor visual inconsistency. If themes are swapped via globals.css, these badges will remain cream-colored while the rest of the Pro tier branding changes.
**Recommendation:** Use `bg-[var(--tier-pro)]/10 text-[var(--tier-pro)]` to stay consistent with the design system.
