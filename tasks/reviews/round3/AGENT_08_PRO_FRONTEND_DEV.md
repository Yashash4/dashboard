# Agent 08 — Pro Tier — Frontend Developer Review

**Total Issues Found: 22**
- CRITICAL: 2
- HIGH: 6
- MEDIUM: 9
- LOW: 5

---

## React Patterns & State Management

### [FE-01] — Missing Suspense boundary for useSearchParams in dashboard-demo layout
**File:** `src/app/dashboard-demo/layout.tsx:20`
**Severity:** CRITICAL
**Description:** The `DemoLayout` component calls `useSearchParams()` at line 20 but is not wrapped in a `<Suspense>` boundary. In Next.js 15, any component that uses `useSearchParams` must be either wrapped in Suspense or rendered inside a Suspense boundary. This will cause a build-time error or a runtime hydration crash in production.
**Impact:** The entire `/dashboard-demo` route will fail to render in production builds, causing a blank page or crash.
**Suggestion:** Either wrap the layout's children in a Suspense boundary, or extract the `useSearchParams` usage into a child component wrapped in Suspense (similar to how `src/app/pricing/page.tsx` handles it with `PricingContent`).

---

### [FE-02] — Missing Suspense boundary for useSearchParams in dashboard-demo page
**File:** `src/app/dashboard-demo/[[...slug]]/page.tsx:668`
**Severity:** CRITICAL
**Description:** The `DemoPage` component calls `useSearchParams()` at line 668 without a Suspense boundary. Same issue as FE-01 — Next.js 15 requires Suspense around `useSearchParams` consumers.
**Impact:** Build failures or runtime crashes on the demo page route.
**Suggestion:** Wrap the default export in a Suspense boundary, or extract the searchParams-dependent logic into a separate client component wrapped in Suspense.

---

### [FE-03] — useEffect missing fetchKeys from dependency array
**File:** `src/components/dashboard/admin-api-keys.tsx:77-79`
**Severity:** HIGH
**Description:** The `useEffect` at line 77 depends on `userId` but calls `fetchKeys()` which is defined inside the component and not listed in the dependency array. While `fetchKeys` closes over `userId` (so functionally it works), the React exhaustive-deps lint rule will flag this. More importantly, `fetchKeys` is recreated on every render, so it cannot be safely added without `useCallback`.
**Impact:** If `userId` changes, `fetchKeys` may use a stale closure. The eslint-plugin-react-hooks rule violation may mask real bugs.
**Suggestion:** Wrap `fetchKeys` in `useCallback` with `[userId]` as dependency, then include it in the `useEffect` dependency array. Alternatively, inline the fetch logic directly in the effect.

---

### [FE-04] — usePayment hook has unstable options reference causing infinite re-renders risk
**File:** `src/hooks/use-payment.ts:101,136`
**Severity:** HIGH
**Description:** The `openRazorpay` callback at line 101 depends on `options`, and `initiatePayment` at line 136 depends on `options`. The `options` parameter is an object literal passed from the pricing page (`{ onSuccess: () => {...} }`). Since object literals create new references on every render, this causes `openRazorpay` and `initiatePayment` to be recreated every render, defeating the purpose of `useCallback`.
**Impact:** Unnecessary re-creations of callbacks on every render. While it doesn't cause visible bugs currently, it's a performance anti-pattern that could cause issues if these callbacks are passed as props or used in other effects.
**Suggestion:** Use `useRef` to store the options, or accept individual callback functions and use `useRef` for the latest callback pattern.

---

### [FE-05] — Pricing page processingPlan not reset on payment error
**File:** `src/app/pricing/page.tsx:68-81`
**Severity:** MEDIUM
**Description:** In `handleSubscribe`, `setProcessingPlan(planName)` is called at line 68 and `setProcessingPlan(null)` at line 80. However, if `initiatePayment` throws an error (which it catches internally and returns `false`), `setProcessingPlan(null)` still runs — but if the component unmounts due to navigation (line 31, `router.push("/")`), the state update on an unmounted component could occur. More critically, the button disabled state relies on `processingPlan` but `isProcessing` from the hook is a separate state that could be out of sync.
**Impact:** Double state tracking (`processingPlan` and `isProcessing`) creates potential for inconsistent button states.
**Suggestion:** Use only `isProcessing` from the hook, or only the local `processingPlan` state — not both. The current code disables the button based on `processingPlan` (line 251) but never checks `isProcessing`.

---

### [FE-06] — AdminSubscriptionEditor does not reflect external prop changes
**File:** `src/components/dashboard/admin-subscription-editor.tsx:46-58`
**Severity:** MEDIUM
**Description:** The component initializes its state from the `subscription` prop via `useState` at lines 46-58. If the parent re-fetches and passes a new `subscription` object, the editor state will not update because `useState` initial values are only used on mount. The `handleCancel` function at line 110 resets to the prop values, but there is no mechanism to sync state when the prop changes without user action.
**Impact:** If an admin opens the editor, another admin changes the subscription, and the first admin's parent refetches, the editor will show stale data.
**Suggestion:** Add a `useEffect` that resets local state when `subscription` prop changes (keyed on `subscription?.id` or a serialized form), or adopt a controlled component pattern.

---

## TypeScript Issues

### [FE-07] — Excessive use of `any` in usePayment hook
**File:** `src/hooks/use-payment.ts:23,36,46,75,90,91`
**Severity:** HIGH
**Description:** The `usePayment` hook uses `any` in six places: `(window as any).Razorpay` (lines 23, 90), `orderData: any` (line 36), `response: any` (lines 46, 91), and `err: any` (line 75). The Razorpay SDK response and order data should be typed with at least a basic interface.
**Impact:** No compile-time safety for payment-critical code paths. Typos in property access (e.g., `response.razorpay_payment_id`) would not be caught.
**Suggestion:** Define interfaces for `RazorpayOrderData`, `RazorpayResponse`, and `RazorpayFailedResponse`. For `window.Razorpay`, use a global augmentation or a local type assertion with a proper interface.

---

### [FE-08] — metadata typed as Record<string, any> in PaymentParams
**File:** `src/hooks/use-payment.ts:15`
**Severity:** LOW
**Description:** `metadata: Record<string, any>` allows any value without structure. For subscription payments, the metadata always has `plan` and `billing_cycle` fields.
**Impact:** No type safety for payment metadata — wrong field names would not be caught.
**Suggestion:** Define a union type for metadata based on `PaymentType`, e.g., `SubscriptionMetadata { plan: string; billing_cycle: "monthly" | "annual" }`.

---

## Hardcoded Colors (Design System Violations)

### [FE-09] — Hardcoded color #ffe0c2 in all Pro docs badge spans
**File:** `src/app/docs/pro/page.tsx:8`, `src/app/docs/pro/api/page.tsx:8`, and 10+ more files
**Severity:** HIGH
**Description:** The PRO badge `<span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] ...">PRO</span>` hardcodes the hex value `#ffe0c2` across at least 12 documentation pages. Per the CLAUDE.md design system rules, all colors must come from CSS variables. This color corresponds to `var(--cta)`.
**Impact:** Changing the CTA/cream color in `globals.css` will not update these badges, breaking the 60-30-10 system and requiring a multi-file edit to fix.
**Suggestion:** Replace `bg-[#ffe0c2]/10 text-[#ffe0c2]` with `bg-[var(--cta)]/10 text-[var(--cta)]` across all files, or better yet, extract a reusable `<ProBadge />` component.

---

### [FE-10] — Hardcoded colors in docs API reference tables
**File:** `src/app/docs/api/agents/page.tsx:65-66`, `src/app/docs/api/models/page.tsx:78-79`
**Severity:** MEDIUM
**Description:** Table headers use `text-white` and borders use `border-white/10`, `border-white/5` — hardcoded white colors instead of CSS variables like `var(--text-primary)` and `var(--border-primary)`.
**Impact:** These hardcoded colors won't adapt if the design system switches to a light theme or adjusts the neutral palette.
**Suggestion:** Replace `text-white` with `text-[var(--text-primary)]` and `border-white/10` with `border-[var(--border-primary)]`.

---

### [FE-11] — Hardcoded badge colors in admin-subscription-editor
**File:** `src/components/dashboard/admin-subscription-editor.tsx:123-135`
**Severity:** MEDIUM
**Description:** `STATUS_COLORS` and `PLAN_COLORS` use hardcoded Tailwind colors like `text-green-500`, `bg-violet-600`, `bg-purple-600` instead of CSS variable equivalents. The `PLAN_CONFIG` in `src/lib/tier.ts` already defines proper badge classes but is not used here.
**Impact:** Color inconsistency between the sidebar plan badge (which uses `PLAN_CONFIG`) and the subscription editor. Theme changes won't propagate.
**Suggestion:** Import and use `PLAN_CONFIG` from `src/lib/tier.ts` for plan colors. For status colors, use the design system's `--success`, `--error`, `--warning` variables.

---

## Pricing & Data Consistency

### [FE-12] — Enterprise plan annual price is 0 in PLANS but 9999 in PRICE_MAP
**File:** `src/lib/payments/plans.ts:76` vs `src/components/dashboard/admin-subscription-editor.tsx:24`
**Severity:** HIGH
**Description:** In `plans.ts` line 76, the Enterprise plan has `annualUsd: 0`, but in the admin subscription editor at line 24, `PRICE_MAP.enterprise.annual` is `9999`. This means the Enterprise plan data is inconsistent across the codebase. The `PLAN_PRICES` export at line 93 also omits enterprise entirely.
**Impact:** Admin-created enterprise subscriptions will default to $9,999/yr, but the pricing page shows `annualUsd: 0` (though the Enterprise card uses `contactUs` so it's not directly displayed). If any code path tries to use `PLAN_PRICES["enterprise"]`, it will be undefined.
**Suggestion:** Decide on the canonical Enterprise annual price and unify it. Add `enterprise` to `PLAN_PRICES` in `plans.ts`, or explicitly document that enterprise pricing is custom.

---

### [FE-13] — Billing docs table disagrees with plans.ts pricing
**File:** `src/app/docs/billing/page.tsx:44`
**Severity:** MEDIUM
**Description:** The billing docs show annual prices as `$50/mo` for Starter and `$110/mo` for Pro. Doing the math: $50 * 12 = $600/yr and $110 * 12 = $1,320/yr. But `plans.ts` defines Starter annual as `$599` and Pro annual as `$1,299`. The per-month calculations for billing docs ($50, $110) are rounded differently from the pricing page which shows `Math.round(599 / 12) = $50` and `Math.round(1299 / 12) = $108`.
**Impact:** Users see $110/mo on the billing docs page but $108/mo on the pricing page toggle, causing confusion and potential trust issues.
**Suggestion:** Use a single source of truth. Either derive monthly-equivalent prices from `plans.ts` or document exact values there. The billing docs should show `$108/mo` for Pro annual (matching `Math.round(1299/12)`).

---

### [FE-14] — Billing docs features table contradicts plans.ts features
**File:** `src/app/docs/billing/page.tsx:47-48`
**Severity:** MEDIUM
**Description:** The billing docs table says Starter has "50" Knowledge Base documents and "5,000 monthly messages," and Starter has "Basic" API access and "2 webhooks." However, the Pro features overview page (`src/app/docs/pro/page.tsx:179-196`) says Knowledge Base, Webhooks, and API access are "Not included" on Starter. The plans.ts features list for Starter makes no mention of Knowledge Base, webhooks, or API access either.
**Impact:** Contradictory documentation confuses users about what Starter actually includes.
**Suggestion:** Align the billing docs feature matrix with the actual Starter plan capabilities defined in `plans.ts` and the Pro overview page.

---

## Component Architecture

### [FE-15] — Dashboard demo page is 688 lines with 20+ components in one file
**File:** `src/app/dashboard-demo/[[...slug]]/page.tsx`
**Severity:** HIGH
**Description:** This file is ~688 lines containing 20+ page components (OverviewPage, VPSPage, AgentsPage, etc.), shared UI helpers (PageHeader, StatCard, Btn, Table, StatusBadge, ChartBars, EmptyState), and the route map. This far exceeds the 300-line threshold for splitting.
**Impact:** Hard to maintain, test, or review. Any change risks unintended side effects across unrelated demo pages. IDE navigation and code review become difficult.
**Suggestion:** Split into: (1) `src/app/dashboard-demo/components/shared.tsx` for UI helpers, (2) individual page files or at least group by tier (core, pro, ultra), (3) keep the route map in the main page file importing from the splits.

---

### [FE-16] — PRO badge duplicated across 12+ docs pages
**File:** `src/app/docs/pro/page.tsx:8`, `src/app/docs/pro/api/page.tsx:8`, etc.
**Severity:** MEDIUM
**Description:** The identical PRO badge markup `<span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>` is copy-pasted across every Pro docs page. Any change (e.g., fixing the hardcoded color, changing the style) requires editing 12+ files.
**Impact:** Maintenance burden and risk of inconsistency if some files are missed during updates.
**Suggestion:** Extract a `<ProBadge />` component (e.g., `src/components/docs/pro-badge.tsx`) and import it in all docs pages.

---

## Accessibility

### [FE-17] — Pricing toggle buttons lack ARIA roles and state
**File:** `src/app/pricing/page.tsx:143-164`
**Severity:** MEDIUM
**Description:** The Monthly/Annual toggle is built with plain `<button>` elements. They lack `role="tablist"` / `role="tab"`, `aria-selected`, or `aria-pressed` attributes. Screen readers cannot determine which option is currently selected.
**Impact:** Users relying on assistive technology cannot determine the current billing frequency selection.
**Suggestion:** Add `role="tablist"` to the container, `role="tab"` and `aria-selected={!annual}` / `aria-selected={annual}` to the buttons, or use `aria-pressed` for toggle button semantics.

---

### [FE-18] — Delete button in admin-api-keys has no accessible label
**File:** `src/components/dashboard/admin-api-keys.tsx:199-209`
**Severity:** MEDIUM
**Description:** The delete button only contains a Trash2 icon with no text and no `aria-label`. Screen readers will announce it as an empty button.
**Impact:** Admin users relying on screen readers cannot identify the delete action.
**Suggestion:** Add `aria-label={`Delete ${getProviderLabel(k.provider)} key`}` to the Button element.

---

### [FE-19] — Logout button uses native button without keyboard focus indication
**File:** `src/components/dashboard/app-sidebar.tsx:373-379`
**Severity:** LOW
**Description:** The logout `<button>` at line 373 uses custom classes but no explicit focus-visible ring. The `title="Sign out"` provides a tooltip but not an `aria-label`.
**Impact:** Keyboard users may not see a focus indicator; the button relies on `title` which is not consistently announced by screen readers.
**Suggestion:** Add `focus-visible:ring-2 focus-visible:ring-ring` classes and an `aria-label="Sign out"`.

---

## Responsive & Mobile Issues

### [FE-20] — Dashboard demo 4-column grid breaks on small screens
**File:** `src/app/dashboard-demo/[[...slug]]/page.tsx:137`
**Severity:** LOW
**Description:** The instance details grid at line 137 uses `grid-cols-4` without a responsive breakpoint. On mobile viewports (< 640px), four columns will be extremely cramped with tiny text.
**Impact:** Demo page looks broken on mobile devices, poor first impression for potential customers evaluating the product.
**Suggestion:** Change to `grid-cols-2 md:grid-cols-4` for a 2-column layout on mobile.

---

### [FE-21] — VPS page actions overflow on mobile
**File:** `src/app/dashboard-demo/[[...slug]]/page.tsx:154`
**Severity:** LOW
**Description:** The VPS page header actions at line 154 render three buttons inline with `<>` fragments. On narrow viewports, these will overflow horizontally since neither the PageHeader nor the actions container has `flex-wrap`.
**Impact:** Buttons overlap or get clipped on mobile views of the demo.
**Suggestion:** Add `flex-wrap` to the PageHeader actions container, or stack buttons vertically on small screens.

---

### [FE-22] — Billing docs comparison table has no horizontal scroll wrapper
**File:** `src/app/docs/billing/page.tsx:32-58`
**Severity:** LOW
**Description:** The plan comparison table with 5 columns (Feature + 4 plans) uses a plain `<table>` inside the prose container with no `overflow-x-auto` wrapper. On mobile, the table extends beyond the viewport.
**Impact:** Users on mobile cannot see the Ultra and Enterprise columns without a scroll mechanism.
**Suggestion:** Wrap the table in a `<div className="overflow-x-auto">` or use the `not-prose` pattern with explicit overflow handling as done in the agents API docs page.

---
