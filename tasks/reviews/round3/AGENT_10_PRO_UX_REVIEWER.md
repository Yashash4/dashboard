# Agent 10 — Pro Tier — UX Reviewer Review

**Total Issues Found: 22**
- CRITICAL: 3
- HIGH: 7
- MEDIUM: 8
- LOW: 4

---

## Upgrade Flow

### [UX-01] — Pricing page billing toggle lacks focus indicator and ARIA state
**File:** `src/app/pricing/page.tsx:143-164`
**Severity:** CRITICAL
**Description:** The Monthly/Annual toggle is built with plain `<button>` elements that have no visible focus ring (no `focus:` or `focus-visible:` class) and no `aria-pressed` or `role="tablist"`/`role="tab"` markup. The selected state is communicated only via background color change, with no ARIA attribute to convey the current selection to screen readers.
**User Impact:** Keyboard-only users cannot see which toggle is focused. Screen reader users have no way to know which billing cycle is currently selected. Fails WCAG 2.1 AA SC 4.1.2 (Name, Role, Value) and SC 2.4.7 (Focus Visible).
**Recommendation:** Add `role="tablist"` to the container, `role="tab"` and `aria-selected={!annual}` / `aria-selected={annual}` to each button, and add `focus-visible:ring-2 focus-visible:ring-primary` classes.

---

### [UX-02] — No confirmation step before payment initiation
**File:** `src/app/pricing/page.tsx:59-81`
**Severity:** HIGH
**Description:** Clicking "Subscribe" immediately calls `initiatePayment()` which opens the Razorpay checkout modal. There is no intermediate confirmation screen showing the user exactly what they are about to pay, which plan they selected, or what billing cycle was chosen. The comment on line 235 even acknowledges this: "CTA -- opens Razorpay directly, no confirm step."
**User Impact:** Users can accidentally trigger a payment flow with a single misclick. There is no opportunity to review the selected plan and price before committing. This is especially problematic on mobile where touch targets are close together.
**Recommendation:** Add a lightweight confirmation dialog (or a summary card overlay) showing plan name, billing cycle, price, and a "Confirm & Pay" button before opening Razorpay.

---

### [UX-03] — Payment cancellation provides no feedback to the user
**File:** `src/hooks/use-payment.ts:83-85` and `src/hooks/use-payment.ts:125-127`
**Severity:** MEDIUM
**Description:** When a user dismisses the Razorpay modal, the `ondismiss` callback rejects with `new Error("cancelled")`, and the `initiatePayment` function silently swallows it (`if (err.message !== "cancelled")`). The user sees no confirmation that the payment was cancelled and may be confused about whether the action succeeded or failed.
**User Impact:** Users who close the payment modal are left in an ambiguous state with no feedback about what happened.
**Recommendation:** Show a neutral toast like "Payment cancelled. You can try again anytime." when the user dismisses the modal.

---

### [UX-04] — Pricing page redirects existing subscribers without explanation
**File:** `src/app/pricing/page.tsx:52-57`
**Severity:** MEDIUM
**Description:** Users with an existing subscription are silently redirected from `/pricing` to `/billing` via `router.replace()`. There is no toast or message explaining why they were redirected.
**User Impact:** If a user bookmarks the pricing page or clicks a pricing link from docs/marketing, they are silently sent to billing with no context. They may think the page is broken.
**Recommendation:** Show a brief toast message like "You already have a subscription. Manage it from your billing page." before redirecting, or use `router.push()` so the back button works.

---

## Data Consistency

### [UX-05] — Pro plan VPS specs are inconsistent across pricing and billing docs
**File:** `src/lib/payments/plans.ts:50` vs `src/app/docs/billing/page.tsx:56`
**Severity:** HIGH
**Description:** The pricing plan definition says Pro includes "8 vCPU, 32GB RAM, **400GB** storage" but the billing docs comparison table says Pro includes "8 vCPU / 32 GB / **200 GB**". The storage value is doubled in the pricing card. Similarly, Ultra shows "16 vCPU, 64GB RAM, **800GB** storage" in plans.ts but "16 vCPU / 64 GB / **400 GB**" in billing docs.
**User Impact:** Users see contradictory storage specs depending on whether they are on the pricing page or billing docs. This erodes trust and could lead to disputes after purchase.
**Recommendation:** Reconcile the storage values in `plans.ts` and `billing/page.tsx` to a single source of truth.

---

### [UX-06] — Billing docs claims Starter has 1 agent limit; pricing says unlimited
**File:** `src/app/docs/billing/page.tsx:98-99` vs `src/lib/payments/plans.ts:23-31` and `src/app/docs/pro/page.tsx:160`
**Severity:** HIGH
**Description:** The billing docs downgrade section states "you have 10 agents but are downgrading to Starter which allows 1." However, the pricing plan features for Starter do not mention any agent limit, and the Pro overview docs comparison table explicitly says Starter has "Unlimited agents."
**User Impact:** Users reading the billing docs may believe Starter has a 1-agent limit, causing them to hesitate to downgrade. Contradicts information on the pricing page.
**Recommendation:** Correct the billing docs downgrade example to reference an actual Starter limitation, or add agent limits to the plan definitions if they exist.

---

### [UX-07] — Billing docs claims Starter has "Basic" API access; Pro overview says "Not included"
**File:** `src/app/docs/billing/page.tsx:49` vs `src/app/docs/pro/page.tsx:189-191`
**Severity:** HIGH
**Description:** The billing page feature matrix says Starter has "Basic" API access. The Pro overview comparison table says Starter has API access "Not included." The pricing cards for Starter do not mention API access at all.
**User Impact:** Users receive conflicting signals about whether Starter includes any API access, making it impossible to make an informed purchase decision.
**Recommendation:** Decide whether Starter includes basic API access or not, and update all docs and pricing to be consistent.

---

### [UX-08] — Billing docs says Starter includes 2 webhooks; Pro overview says "Not included"
**File:** `src/app/docs/billing/page.tsx:53` vs `src/app/docs/pro/page.tsx:186-187`
**Severity:** HIGH
**Description:** The billing feature matrix claims Starter includes 2 webhooks, while the Pro overview says Starter webhooks are "Not included."
**User Impact:** Same conflicting information problem as UX-07. Users cannot trust the feature comparison.
**Recommendation:** Align webhook limits across all documentation pages.

---

### [UX-09] — Billing docs says Starter has 50 KB docs and 5,000 messages; pricing page shows no limits
**File:** `src/app/docs/billing/page.tsx:47-48` vs `src/lib/payments/plans.ts:23-31`
**Severity:** MEDIUM
**Description:** The billing docs show Starter with "50" Knowledge Base documents and "5,000" monthly messages. The Starter pricing card features list does not mention any message limit or Knowledge Base document count at all, making it appear unlimited.
**User Impact:** Users may upgrade to Starter expecting unlimited messages, then hit the 5,000 cap without warning.
**Recommendation:** Add message and document limits to the pricing card features if they exist, or remove them from the billing comparison if they do not.

---

## Accessibility

### [UX-10] — PRO badge in docs uses hardcoded colors instead of CSS variables
**File:** `src/app/docs/pro/page.tsx:8` and `src/app/docs/pro/api/page.tsx:8`
**Severity:** HIGH
**Description:** The PRO badge uses hardcoded color `#ffe0c2` (both as text and background with 10% opacity): `bg-[#ffe0c2]/10 text-[#ffe0c2]`. This violates the CLAUDE.md design system rule: "ALL colors MUST come from CSS variables in globals.css. NEVER hardcode colors in components." Additionally, `#ffe0c2` at 10% opacity on a dark background produces extremely low contrast text, likely failing WCAG 2.1 AA minimum contrast ratio of 4.5:1 for small text.
**User Impact:** The PRO badge may be nearly invisible on dark backgrounds. Changing the theme via globals.css will not update these badges. Found in 24 files across the codebase.
**Recommendation:** Replace `#ffe0c2` with `var(--tier-pro)` or another CSS variable, and ensure the background/text combination meets 4.5:1 contrast ratio.

---

### [UX-11] — Pricing page plan cards have no heading hierarchy for screen readers
**File:** `src/app/pricing/page.tsx:195`
**Severity:** MEDIUM
**Description:** Plan names use `<h3>` tags but there is no `<h2>` between the page `<h1>` and the plan cards. The heading hierarchy jumps from `<h1>` (line 133) directly to `<h3>` (line 195), skipping `<h2>`. This violates WCAG SC 1.3.1 (Info and Relationships).
**User Impact:** Screen reader users navigating by heading levels will miss plan cards when jumping from h2 to h2, and the document outline is malformed.
**Recommendation:** Add a visually hidden `<h2>` like "Available Plans" before the plan grid, or change plan names to `<h2>`.

---

### [UX-12] — Upgrade prompt links to /billing but text says "View Plans"
**File:** `src/components/dashboard/upgrade-prompt.tsx:54-56`
**Severity:** MEDIUM
**Description:** The upgrade prompt CTA button says "View Plans" but links to `/billing`. For users without a subscription, `/billing` may not show plan comparison. For users who want to compare plans, `/pricing` would be more appropriate.
**User Impact:** Users click "View Plans" expecting a plan comparison page but land on their billing dashboard instead, creating a disorienting experience.
**Recommendation:** Link to `/pricing` instead of `/billing`, or change the button text to "Manage Subscription."

---

### [UX-13] — Dashboard demo buttons are non-functional with no indication
**File:** `src/app/dashboard-demo/[[...slug]]/page.tsx:43-55`
**Severity:** MEDIUM
**Description:** All `Btn` components in the dashboard demo render real `<button>` elements but have no `onClick` handlers and no `disabled` attribute. Users exploring the demo will click buttons expecting interaction and get nothing. There is no visual indicator (e.g., cursor, opacity) or tooltip that these are preview-only.
**User Impact:** Users evaluating the Pro tier through the demo will think features are broken when buttons do not respond.
**Recommendation:** Add `disabled` attribute or `pointer-events-none` to demo buttons, with a tooltip like "Available in your dashboard after upgrade." Alternatively, add `cursor-not-allowed opacity-60` styling.

---

### [UX-14] — Dashboard demo VPS page shows wrong title "Mission Control"
**File:** `src/app/dashboard-demo/[[...slug]]/page.tsx:152`
**Severity:** MEDIUM
**Description:** The `VPSPage()` component in the dashboard demo displays the title "Mission Control" instead of "VPS Management" or "VPS." This is the title of the Ultra-tier feature, not the VPS management page.
**User Impact:** Users browsing the Pro demo see "Mission Control" when clicking VPS in the sidebar, creating confusion about which feature they are viewing.
**Recommendation:** Change the title to "VPS Management" to match the sidebar label from `app-sidebar.tsx:64`.

---

## Navigation & Onboarding

### [UX-15] — No onboarding guidance after Pro upgrade
**File:** `src/app/pricing/page.tsx:29-32`
**Severity:** HIGH
**Description:** After successful payment, the `onSuccess` callback shows a generic toast "Welcome to ClawHQ!" and redirects to `/` (the dashboard root). For a user who just upgraded from Starter to Pro, there is no onboarding flow, welcome modal, or guidance pointing them to the 9 new Pro features that just appeared in their sidebar.
**User Impact:** Users pay $129/month and land on the same dashboard overview with no indication of what changed or how to use their new features. The Pro docs mention "all Pro features appear in your dashboard sidebar immediately" but new users may not notice the new sidebar section.
**Recommendation:** After upgrade, redirect to a dedicated onboarding page or show a modal highlighting the new Pro features with links to relevant docs. At minimum, show a toast like "Welcome to Pro! Check out your new tools in the sidebar."

---

### [UX-16] — Sidebar Pro Tools section shows 9 items without visual grouping
**File:** `src/components/dashboard/app-sidebar.tsx:88-98`
**Severity:** LOW
**Description:** The "Pro Tools" sidebar section lists 9 items in a flat list (Model Playground, Agent Builder, Monitoring, Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log). This is a dense list with no subcategories or visual grouping to help users find what they need.
**User Impact:** Users may struggle to locate specific Pro features in the long list, especially new users unfamiliar with the terminology.
**Recommendation:** Consider grouping Pro tools into subcategories (e.g., "Build" for Agent Builder/Model Playground, "Observe" for Monitoring/Logs/Analytics, "Integrate" for Webhooks/API Access) or add subtle visual separators.

---

### [UX-17] — Docs Pro overview links to nonexistent doc pages
**File:** `src/app/docs/pro/page.tsx:32-33` and `src/app/docs/pro/page.tsx:65-66`
**Severity:** MEDIUM
**Description:** The Pro overview page links to `/docs/pro/logs` (line 32) and `/docs/pro/webhooks` (line 65). While these pages likely exist given the grep results for `#ffe0c2`, the docs sidebar navigation (`docs-sidebar.tsx:20-24`) only shows 3 pages: "Chat API", "Webhooks" at `/docs/api/webhooks`, and "Knowledge Base" at `/docs/pro/knowledge-base`. Most Pro doc pages are not reachable through sidebar navigation.
**User Impact:** Users who navigate through the sidebar cannot discover Pro documentation pages. They can only reach them through links within the Pro overview page.
**Recommendation:** Add Pro documentation pages to the docs sidebar navigation, or create a dedicated "Pro Docs" section in the sidebar.

---

## Documentation Clarity

### [UX-18] — API docs "Next Steps" links point to wrong pages
**File:** `src/app/docs/api/agents/page.tsx:227` and `src/app/docs/api/models/page.tsx:221`
**Severity:** LOW
**Description:** In the Agents API docs, the "Conversations & Threads" link points to `/docs/api/webhooks` (line 227), which is a mislabeled link. In the Models API docs, the "Usage API" link also points to `/docs/api/webhooks` (line 221). These are clearly incorrect cross-references.
**User Impact:** Users following "Next Steps" to learn about conversations/threads or usage monitoring land on the webhooks page instead.
**Recommendation:** Fix the href values to point to the correct pages (e.g., `/docs/api/conversations` and `/docs/api/usage`).

---

### [UX-19] — Billing docs link to non-docs dashboard route
**File:** `src/app/docs/billing/page.tsx:205`
**Severity:** LOW
**Description:** The "Next Steps" section includes a link to `/dashboard/analytics` which is a dashboard route, not a docs route. Docs pages should link to other docs or clearly indicate when a link navigates away from documentation.
**User Impact:** Users reading docs are unexpectedly taken out of the documentation context into the dashboard, which may require authentication.
**Recommendation:** Link to `/docs/pro/analytics` instead, or add "(opens dashboard)" text to indicate the navigation change.

---

### [UX-20] — Admin subscription editor allows arbitrary price entry without validation feedback
**File:** `src/components/dashboard/admin-subscription-editor.tsx:256-261`
**Severity:** LOW
**Description:** The price field in the admin subscription editor is a plain number input with no min/max attributes. While there is a `>= 0` check on save (line 74-78), the input itself provides no real-time validation feedback. An admin could type a negative number or an extremely high price and only learn it is invalid after clicking Save.
**User Impact:** Admin users get no inline validation hints, leading to a trial-and-error experience when entering prices.
**Recommendation:** Add `min="0"` to the input element and consider adding inline validation messages.

---

### [UX-21] — Annual pricing display hides true annual cost
**File:** `src/app/pricing/page.tsx:205-208`
**Severity:** CRITICAL
**Description:** When annual billing is selected, the displayed price is `Math.round(plan.annualUsd / 12)` which shows a monthly equivalent. For Pro, this shows $108/mo (1299/12 = 108.25, rounded to 108). Below it shows "$1,299/yr." However, $108 * 12 = $1,296, not $1,299. The `Math.round` operation creates a displayed price that does not mathematically match the actual annual charge, which could be seen as a deceptive pricing pattern.
**User Impact:** Users see "$108/mo" prominently but are actually charged $1,299/yr ($108.25/mo). The $3 discrepancy may seem small but undermines trust. For Ultra: displayed as $292/mo but charged $3,499/yr ($291.58/mo), a $7 gap.
**Recommendation:** Either show the exact monthly equivalent with cents (e.g., "$108.25/mo") or show the annual price prominently with the monthly figure as a secondary note. Consider adding "billed annually" text next to the monthly equivalent.

---

### [UX-22] — Enterprise plan shows "$0/yr" when annual toggle is selected
**File:** `src/lib/payments/plans.ts:76` and `src/app/pricing/page.tsx:206-208`
**Severity:** CRITICAL
**Description:** The Enterprise plan has `annualUsd: 0` in the plan definition. While the `contactUs` flag prevents the price from rendering on the pricing page (guarded by `!plan.contactUs` at line 201), this zero value is still exported and could be consumed by other components. More importantly, if the `contactUs` guard were ever removed or bypassed, the Enterprise plan would show "$0/mo" with annual billing selected (`Math.round(0 / 12) = 0`).
**User Impact:** Currently mitigated by the `contactUs` check, but the zero annual price is a data integrity issue that could surface in admin tools, billing reports, or any new component that reads `PLAN_PRICES` or `PLANS` without checking `contactUs`. Note that `PLAN_PRICES` in the same file (line 93-97) does not include enterprise at all, creating a silent lookup failure.
**Recommendation:** Set `annualUsd` to a reasonable default (e.g., `9999`) or add explicit handling for enterprise pricing throughout the codebase. Ensure `PLAN_PRICES` and `PLANS` are consistent about enterprise.

---
