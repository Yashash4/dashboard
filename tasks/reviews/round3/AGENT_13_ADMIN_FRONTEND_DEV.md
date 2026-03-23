# Agent 13 — Admin Panel — Frontend Developer Review

**Total Issues Found: 22**
- CRITICAL: 2 / HIGH: 6 / MEDIUM: 9 / LOW: 5

---

### [FE-01] — Destructured useState with default value creates broken variable
**File:** `src/components/dashboard/admin-customer-detail.tsx:387`
**Severity:** CRITICAL
**Description:** The line `const [checkPendingRef = { current: false }, setActionLoading] = useState<string | null>(null);` uses destructuring with a default value, which means `checkPendingRef` is always `{ current: false }` (since `useState` initializes with `null`, which is nullish, so the default kicks in). The variable name suggests it was meant to be a ref, but it is a state value that never receives its actual state. Every reference to `checkPendingRef` throughout lines 761-847 evaluates to `{ current: false }` instead of the actual action loading string.
**Impact:** All VPS action buttons (Restart OpenClaw, Restart Nginx, etc.) will never show loading spinners and the `disabled` prop will never be `true` since `!!{ current: false }` is always `true` — meaning all buttons are always disabled.
**Suggestion:** Replace with `const [actionLoading, setActionLoading] = useState<string | null>(null);` and update all references from `checkPendingRef = { current: false }` to `actionLoading`.

### [FE-02] — Assignment expressions used instead of comparisons in JSX
**File:** `src/components/dashboard/admin-customer-detail.tsx:761,774,787,800,813,826,839`
**Severity:** CRITICAL
**Description:** The `disabled` prop uses `!!checkPendingRef = { current: false }` which is an assignment expression inside JSX, not a comparison. Similarly, the ternary conditions like `checkPendingRef = { current: false } === "restart_openclaw"` are assignments followed by strict equality. This is syntactically broken and should not compile. If it somehow passes the build, the behavior is undefined and all buttons will be permanently disabled.
**Impact:** The entire VPS actions panel is non-functional. Admins cannot restart, stop, start, or view logs for any VPS.
**Suggestion:** This is directly caused by FE-01. After fixing the variable name, replace all `checkPendingRef = { current: false }` with `actionLoading` throughout the template.

### [FE-03] — useEffect missing dependency (fetchKeys not stable)
**File:** `src/components/dashboard/admin-api-keys.tsx:77-79`
**Severity:** HIGH
**Description:** The `useEffect` depends on `[userId]` but calls `fetchKeys`, which is a function defined inside the component and not wrapped in `useCallback`. React's exhaustive-deps rule would flag this. If `fetchKeys` is listed as a dep, it causes an infinite loop since it's recreated on every render. The current code works but relies on `userId` to trigger the fetch correctly.
**Impact:** If `userId` changes without a full remount, `fetchKeys` may use a stale closure capturing the old `userId`. This is unlikely in practice but is a React anti-pattern.
**Suggestion:** Wrap `fetchKeys` in `useCallback` with `[userId]` dependency, or inline the fetch logic into the effect.

### [FE-04] — useEffect missing dependency (fetchCredentials not stable)
**File:** `src/components/dashboard/admin-dashboard-auth.tsx:36-38`
**Severity:** HIGH
**Description:** Same pattern as FE-03. `fetchCredentials` is called from `useEffect([userId])` but is not wrapped in `useCallback`. The function captures `userId` from closure which may become stale.
**Impact:** Potential stale closure if `userId` prop changes.
**Suggestion:** Wrap `fetchCredentials` in `useCallback` with `[userId]` as dependency.

### [FE-05] — Hardcoded colors in admin page violate design system
**File:** `src/app/admin/page.tsx:21-31,103-116,183,192,201,222`
**Severity:** HIGH
**Description:** Multiple hardcoded Tailwind colors used instead of CSS variables:
- Line 21: `bg-blue-600`, `text-white`, `border-blue-600`
- Line 22: `bg-yellow-600`, `text-white`, `border-yellow-600`
- Line 23: `bg-green-600`, `text-white`, `border-green-600`
- Lines 103-116: `border-red-600/30`, `bg-red-600/5`, `border-yellow-600/30`, `bg-yellow-600/5`, `text-red-500`, `text-yellow-500`, `text-red-400`, `text-yellow-400`
- Line 183: `text-green-500`
- Line 192: `text-[#ffe0c2]` (raw hex)
- Line 201: `text-amber-400`
- Line 222: `text-teal-400`

Per the CLAUDE.md design system rules, all colors must come from CSS variables.
**Impact:** Changing the site theme via `globals.css` won't affect these elements. The admin panel will look inconsistent with any future theme changes.
**Suggestion:** Replace all hardcoded colors with CSS variable equivalents like `var(--success)`, `var(--warning)`, `var(--error)`, `var(--tier-pro)`, `var(--tier-ultra)`, `var(--tier-enterprise)`, etc.

### [FE-06] — Hardcoded colors across all admin components
**File:** `src/components/dashboard/admin-customer-detail.tsx:174-194`, `src/components/dashboard/admin-customers.tsx:40-44`, `src/components/dashboard/admin-ticket-thread.tsx:56-88`, `src/components/dashboard/admin-subscription-editor.tsx:123-135`, `src/components/dashboard/admin-vps-health.tsx:186,192,230`, `src/components/dashboard/admin-api-keys.tsx:183,188`
**Severity:** HIGH
**Description:** Every admin component uses hardcoded Tailwind colors (`bg-green-600`, `text-red-500`, `bg-blue-600`, `bg-yellow-600`, `bg-amber-600`, `text-teal-400`, `bg-violet-600`, `bg-purple-600`, `text-[#ffe0c2]`, etc.) rather than CSS variables. This is a pervasive violation of the 60-30-10 design system rule.
**Impact:** The admin panel is completely detached from the design system. Theme changes will not propagate.
**Suggestion:** Create a systematic mapping of status/plan colors to CSS variables and replace throughout all components.

### [FE-07] — Excessive `any` types throughout admin components
**File:** `src/app/admin/page.tsx:77,84,223,244,247,282`, `src/components/dashboard/admin-audit-logs.tsx:154`, `src/components/dashboard/admin-customer-detail.tsx:104,387`, `src/components/dashboard/admin-vps-health.tsx:24`
**Severity:** HIGH
**Description:** Multiple `any` type usages:
- `admin/page.tsx:77` — `activeSubsData?.forEach((sub: any) => ...`
- `admin/page.tsx:84` — `vpsInstances?.filter((v: any) => ...`
- `admin/page.tsx:223` — `activeSubsData?.filter((s: any) => ...`
- `admin/page.tsx:244,282` — `(ticket: any)`, `(log: any)`
- `admin/page.tsx:247` — `(ticket.users as any)?.email`
- `audit-logs.tsx:154` — `logs.map((log: any) => ...`
- `audit-logs.tsx:165` — `(ACTION_COLORS[log.action] as any)`
- `customer-detail.tsx:104` — `config: any` in channels interface
- `vps-health.tsx:24` — `users: any` in VpsInstance interface
**Impact:** No compile-time safety on data shapes returned from Supabase queries. Runtime errors from unexpected data shapes won't be caught during development.
**Suggestion:** Define proper interfaces for Supabase query return types and replace all `any` usages.

### [FE-08] — No error handling for failed Supabase queries in server component
**File:** `src/app/admin/page.tsx:36-66`
**Severity:** HIGH
**Description:** The `Promise.all` destructures 14 Supabase queries but none check for `.error`. If any query fails, the destructured values (`count`, `data`) may be `null` without an error being surfaced. Supabase client does not throw on error — it returns `{ data: null, error: ... }`.
**Impact:** The admin overview page could silently display zeros or empty lists when database queries fail, misleading the admin into thinking there are no customers/tickets/etc.
**Suggestion:** Check for errors on critical queries and display an error banner, or at minimum log the errors server-side.

### [FE-09] — Component too large — admin-customer-detail.tsx is ~1180 lines
**File:** `src/components/dashboard/admin-customer-detail.tsx`
**Severity:** MEDIUM
**Description:** This single component file is approximately 1180 lines long with the main `AdminCustomerDetail` component spanning ~800 lines of JSX. It contains multiple sub-components (`CredentialField`, `ServiceBadge`, `ResourceGauge`, `Section`) defined in the same file, manages 12+ state variables, and handles 5+ different data fetching operations.
**Impact:** Difficult to maintain, test, or review. Changes to one section risk unintended side effects on others.
**Suggestion:** Extract sub-components into their own files. Split the main component into separate section components (VPS section, subscription section, etc.) that each manage their own state.

### [FE-10] — MRR by plan calculation ignores annual billing cycle
**File:** `src/app/admin/page.tsx:76-80`
**Severity:** MEDIUM
**Description:** The `mrrByPlan` calculation at line 79 uses `Number(sub.price) || 0` directly without adjusting for annual billing cycle. However, the `monthlyRevenue` calculation at lines 69-73 correctly divides annual prices by 12. This means the per-plan MRR breakdown displayed in cards is incorrect for annual subscriptions — it shows the full annual price as monthly.
**Impact:** Admin sees inflated MRR numbers per plan for annual subscribers, while the total MRR is correct.
**Suggestion:** Apply the same annual normalization: `const price = Number(sub.price) || 0; mrrByPlan[plan] = (mrrByPlan[plan] || 0) + (sub.billing_cycle === 'annual' ? price / 12 : price);`

### [FE-11] — Audit logs table not responsive on mobile
**File:** `src/components/dashboard/admin-audit-logs.tsx:128-192`
**Severity:** MEDIUM
**Description:** The audit logs table uses a 6-column layout (`<Table>` with Time, Admin, Action, Entity, Details, IP columns) with no responsive handling. On mobile viewports, the table will overflow horizontally but there is no `overflow-x-auto` wrapper.
**Impact:** On mobile devices, the audit logs table content may be cut off or require horizontal scrolling that isn't visually indicated.
**Suggestion:** Wrap the table in a `div` with `overflow-x-auto` class, or switch to a card-based layout on mobile using responsive breakpoints.

### [FE-12] — Customer table rows use multiple onClick handlers instead of wrapping row in a link
**File:** `src/components/dashboard/admin-customers.tsx:422-478`
**Severity:** MEDIUM
**Description:** Each `<td>` in the customer table has its own `onClick={() => router.push(...)}` handler (6 identical handlers per row). This is both verbose and creates accessibility issues — the row is not a semantic link, so screen readers won't announce it as navigable, and `Cmd/Ctrl+Click` won't open in a new tab.
**Impact:** Poor accessibility and user experience. Users can't right-click to open customer detail in a new tab. Keyboard navigation via the `tabIndex={0}` and `onKeyDown` on `<tr>` is a partial fix but not a complete accessible solution.
**Suggestion:** Wrap the entire row content in a Next.js `<Link>` component, or use a single `onClick` on the `<tr>` while ensuring the checkbox column uses `e.stopPropagation()` (which is already done).

### [FE-13] — Subscription editor doesn't refresh parent data after save
**File:** `src/components/dashboard/admin-subscription-editor.tsx:102`
**Severity:** MEDIUM
**Description:** After successfully saving a subscription update, the component calls `setEditing(false)` but doesn't trigger a data refresh on the parent. The read-only view still shows the original `subscription` prop data, not the updated values. Only a full page refresh would show the new subscription data.
**Impact:** After editing a subscription, the admin sees stale data until they manually refresh the page.
**Suggestion:** Accept an `onUpdate` callback prop and call it after successful save, or use `router.refresh()` to trigger a server-side data refresh.

### [FE-14] — Ticket thread reply uses optimistic update with potential ID mismatch
**File:** `src/components/dashboard/admin-ticket-thread.tsx:128-136`
**Severity:** MEDIUM
**Description:** The reply is optimistically appended to the messages array with `data.messageId || crypto.randomUUID()`. If the API returns successfully but without `messageId`, the local message gets a random UUID that doesn't match the database. If the component were to re-fetch messages later, there could be duplicate messages displayed (one with the random ID, one with the real ID).
**Impact:** Potential duplicate messages if the page is refreshed or messages are re-fetched. The fallback UUID is never reconciled with the actual database ID.
**Suggestion:** Either always use the server-returned ID (and show a loading placeholder until the response arrives), or re-fetch the full message list after posting.

### [FE-15] — `navigator.clipboard.writeText` not guarded for non-HTTPS contexts
**File:** `src/components/dashboard/admin-dashboard-auth.tsx:68`, `src/components/dashboard/admin-customer-detail.tsx:239`
**Severity:** MEDIUM
**Description:** `navigator.clipboard.writeText()` is called without a try/catch. This API requires a secure context (HTTPS) and user activation. It will throw in HTTP environments (like local dev without HTTPS) or if the page is not focused.
**Impact:** Unhandled promise rejection could crash the component or show a confusing error during development.
**Suggestion:** Wrap in try/catch with a fallback (e.g., `document.execCommand('copy')` or a toast indicating the copy failed).

### [FE-16] — VPS Health "Check All" runs health checks sequentially in a Promise.allSettled
**File:** `src/components/dashboard/admin-vps-health.tsx:77-81`
**Severity:** MEDIUM
**Description:** While `Promise.allSettled` is good, each `checkHealth` call independently updates state via `setHealthMap`, causing one re-render per VPS instance during the check. With many VPS instances, this creates a cascade of re-renders.
**Impact:** Performance degradation proportional to the number of VPS instances. Each health check result triggers a full component re-render.
**Suggestion:** Batch the state updates by collecting all results first, then calling `setHealthMap` once with the full map. Alternatively, use React 18's automatic batching which handles this for async operations (verify it applies here).

### [FE-17] — Admin page alerts use array index as key
**File:** `src/app/admin/page.tsx:102`
**Severity:** MEDIUM
**Description:** `alerts.map((alert, i) => <div key={i} ...>)` uses array index as key. While the alerts array is computed fresh on each render (server component), this is still a minor anti-pattern.
**Impact:** Minimal since this is a server component and the array is stable per render. However, if this were ever refactored to a client component with dynamic alerts, it would cause incorrect reconciliation.
**Suggestion:** Use a unique key based on alert content, e.g., `key={alert.text}` or `key={`${alert.level}-${alert.text}`}`.

### [FE-18] — Missing aria-labels on icon-only buttons
**File:** `src/components/dashboard/admin-api-keys.tsx:199-210`, `src/components/dashboard/admin-customers.tsx:307-315`, `src/components/dashboard/admin-vps-health.tsx:195-212`
**Severity:** LOW
**Description:** Several buttons contain only icons with no accessible label:
- Delete key button (trash icon) in admin-api-keys.tsx:199
- Clear selection button (X icon) in admin-customers.tsx:307
- Auto-restart button (shield icon) in admin-vps-health.tsx:195-212
**Impact:** Screen readers will announce these as unlabeled buttons, making the admin panel inaccessible for assistive technology users.
**Suggestion:** Add `aria-label` attributes describing the action (e.g., `aria-label="Delete API key"`, `aria-label="Clear selection"`).

### [FE-19] — Clickable ticket rows in customer-detail lack keyboard accessibility
**File:** `src/components/dashboard/admin-customer-detail.tsx:1077-1078`
**Severity:** LOW
**Description:** Ticket rows in the customer detail have `onClick` and `cursor-pointer` but no `tabIndex`, `role="button"`, or `onKeyDown` handler for keyboard navigation.
**Impact:** Keyboard users cannot navigate to or activate these clickable ticket rows.
**Suggestion:** Add `tabIndex={0}`, `role="link"`, and `onKeyDown={(e) => { if (e.key === 'Enter') router.push(...) }}`.

### [FE-20] — CSV export doesn't escape values containing commas or quotes
**File:** `src/components/dashboard/admin-customers.tsx:185`
**Severity:** LOW
**Description:** The CSV export wraps values in double quotes but doesn't escape double quotes within the values. If a customer name or email contains a `"` character, the CSV will be malformed.
**Impact:** Exported CSV may be corrupted for customers with special characters in their data.
**Suggestion:** Replace `v` with `v.replace(/"/g, '""')` inside the map before wrapping in quotes.

### [FE-21] — `password` and `showPassword` toggle button lacks proper aria attributes
**File:** `src/components/dashboard/admin-dashboard-auth.tsx:129-146`
**Severity:** LOW
**Description:** The password visibility toggle button has no `aria-label` or `aria-pressed` attribute to indicate its function and state to assistive technology.
**Impact:** Screen reader users won't know what the eye/eye-off button does.
**Suggestion:** Add `aria-label={showPassword ? "Hide password" : "Show password"}`.

### [FE-22] — CredentialField copy button uses unhandled async without await
**File:** `src/components/dashboard/admin-customer-detail.tsx:237-243`
**Severity:** LOW
**Description:** The `handleCopy` function calls `navigator.clipboard.writeText(value)` without `await`. The clipboard write is fire-and-forget, meaning the "copied" feedback shows immediately regardless of whether the copy actually succeeded.
**Impact:** User sees success feedback even if clipboard write fails silently.
**Suggestion:** Add `await` and wrap in try/catch, showing an error toast on failure.
