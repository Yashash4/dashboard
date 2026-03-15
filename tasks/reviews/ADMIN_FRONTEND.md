# Admin Panel Frontend Review

Reviewed: 2026-03-16
Scope: 14 component files (`src/components/dashboard/admin-*.tsx`) + 11 page files (`src/app/admin/**/*.tsx`)

---

## 1. Component Architecture

### CRITICAL: `admin-customer-detail.tsx` is 1180 lines — must be split

This file contains 6+ inline sub-components (`CredentialField`, `ServiceBadge`, `ResourceGauge`, `Section`), a massive data-fetching main component, VPS action handlers, a delete dialog, and a logs dialog. It should be decomposed into:

| Proposed File | Responsibility |
|---|---|
| `admin-customer-header.tsx` | Back button, name, badges, external link |
| `admin-customer-profile.tsx` | Profile & Account section |
| `admin-customer-vps.tsx` | VPS credentials, services, resources, action buttons, logs dialog |
| `admin-customer-agents.tsx` | Agents + Channels sections |
| `admin-customer-danger.tsx` | Delete dialog (currently duplicated — see below) |
| `shared/credential-field.tsx` | Reusable `CredentialField` with show/hide + copy |
| `shared/service-badge.tsx` | Reusable `ServiceBadge` |
| `shared/resource-gauge.tsx` | Reusable `ResourceGauge` |
| `shared/collapsible-section.tsx` | Reusable `Section` wrapper |

### `admin-deploy.tsx` is 623 lines — borderline

The provisioning form + progress tracker + log panel are tightly coupled via shared state (`jobId`, `steps`, `logs`). Not a clean split candidate, but the log panel rendering (lines 594-620) and the step list rendering (lines 494-533) could be extracted into presentation components.

### `admin-customers.tsx` (487 lines) — acceptable

Well-structured with filtering, sorting, bulk actions, and CSV export all related to a single table view.

### All other components are well-scoped
- `admin-2fa-setup.tsx` (309 lines) — single concern
- `admin-audit-logs.tsx` (225 lines) — clean
- `admin-dashboard-auth.tsx` (181 lines) — clean
- `admin-delete-customer.tsx` (133 lines) — clean
- `admin-subscription-editor.tsx` (291 lines) — clean read/edit toggle pattern
- `admin-ticket-thread.tsx` (305 lines) — clean
- `admin-tickets.tsx` (241 lines) — clean
- `admin-vps-health.tsx` (244 lines) — clean
- `admin-api-keys.tsx` (298 lines) — clean
- `admin-vps-editor.tsx` (316 lines) — clean
- `admin-bulk-health.tsx` (306 lines) — clean

---

## 2. TypeScript Issues

### `any` types found (7 instances)

| File | Line | Issue |
|---|---|---|
| `admin-audit-logs.tsx` | 154 | `logs.map((log: any)` — log rows untyped |
| `admin-audit-logs.tsx` | 165 | `ACTION_COLORS[log.action] as any` — badge variant cast |
| `admin-vps-health.tsx` | 24 | `users: any` in `VpsInstance` interface |
| `admin-bulk-health.tsx` | 35 | `users: any` in `VpsInstance` interface |
| `admin-customers.tsx` | 72 | `(vps as any)?.hostname` — forced cast |
| `admin-customer-detail.tsx` | 104 | `config: any` in channels type |
| `admin-overview page.tsx` | 72-73 | `(sub: any)`, `(v: any)`, `(ticket: any)`, `(log: any)` — multiple untyped iterations |

**Fix:** Define proper types for `AuditLog`, `VpsInstance` (with `users`), and the overview page data shapes. The `as any` cast on line 165 of audit-logs should use the Badge variant union type.

### Missing return types

No component explicitly declares a return type. While React.FC inference handles this, adding `JSX.Element` or `ReactNode` return types would improve developer experience.

---

## 3. State Management

### No React Query in `admin-customer-detail.tsx`

This is the most data-heavy component and uses raw `useState` + `useEffect` + `fetch` for data loading. It should use `useQuery` for:
- Initial customer data fetch (`fetchData`)
- Service status check (`fetchServices`)

Benefits: automatic caching, refetch on focus, loading/error states, stale-while-revalidate.

### No React Query in `admin-api-keys.tsx`

Same pattern: manual `useState`/`useEffect`/`fetch` for loading API keys. Should use `useQuery` + `useMutation`.

### No React Query in `admin-dashboard-auth.tsx`

Manual fetch for credentials. Should use `useQuery`.

### No React Query in `admin-2fa-setup.tsx`

Manual `loadFactors` with `useEffect`. Should use `useQuery`.

### React Query used correctly in:
- `admin-audit-logs.tsx` — proper `useQuery` with pagination keys

### `admin-deploy.tsx` polling pattern is correct
Uses `setInterval` with cleanup, refs to avoid stale closures, and proper state transitions. The `useCallback` for `addLog` and refs for `stepsRef`/`prevStepsKeyRef` are well-done.

---

## 4. Credential Display

### Good: `admin-customer-detail.tsx` `CredentialField` component

Has show/hide toggle (Eye/EyeOff), copy button, and proper masking (`"$$$$$$$$$$$$$$"`). Applied to SSH password, dashboard password, data API token, and webhook secrets.

### Good: `admin-dashboard-auth.tsx`

Has show/hide toggle for password field, copy button for combined credentials.

### Good: `admin-vps-editor.tsx`

SSH password field has show/hide toggle in edit mode.

### Missing: `admin-api-keys.tsx`

API key input uses `type="password"` but there is no way to reveal the value after entry. The stored keys are never shown (only provider name + status), which is correct from a security perspective, but consider showing a masked preview (e.g., `sk-ant-...xxxx`).

---

## 5. Responsive Layout

### Good responsive patterns throughout:
- `admin-overview page.tsx`: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for stat cards
- `admin-customer-detail.tsx`: `grid-cols-2 md:grid-cols-4` for info grids
- `admin-deploy.tsx`: `grid-cols-1 lg:grid-cols-2` for form/progress split
- `admin-bulk-health.tsx`: `grid-cols-1 sm:grid-cols-4` for summary cards
- `admin-customers.tsx`: `flex-wrap` on filter bar, `overflow-x-auto` on table

### Issues:

| File | Issue |
|---|---|
| `admin-audit-logs.tsx` | Filter selects use fixed `w-[200px]` — will break on narrow screens. Should use `w-full sm:w-[200px]` and wrap the filter row with `flex-wrap`. |
| `admin-tickets.tsx` | `TabsList` with 5 tabs can overflow on mobile. Needs `overflow-x-auto` or a dropdown alternative on small screens. |
| `admin-bulk-health.tsx` | Table with 8 columns — on mobile, `overflow-x-auto` is present on the outer `div`, but the table content (especially services column with emoji indicators) will be very cramped. Consider hiding CPU/RAM columns on small screens. |
| `admin-customers.tsx` | Table has 7 columns + checkbox. On mobile the row click targets will be very narrow. Consider a card layout below `md` breakpoint. |

---

## 6. Loading / Error / Empty States

### Loading states: Good coverage

Every component that fetches data shows a loading indicator:
- `admin-customer-detail.tsx`: centered spinner
- `admin-dashboard-auth.tsx`: inline spinner with "Loading..."
- `admin-api-keys.tsx`: inline spinner
- `admin-2fa-setup.tsx`: centered spinner
- `admin-audit-logs.tsx`: table row with "Loading..."
- `admin-deploy.tsx`: progress panel with placeholder
- `admin-bulk-health.tsx`: progress counter during check

### Error states: Inconsistent

| File | Error Handling |
|---|---|
| `admin-customer-detail.tsx` | `toast.error` on fetch failure, shows "Customer not found" fallback — Good |
| `admin-dashboard-auth.tsx` | Empty `catch {}` block (line 28) — swallows errors silently. Should show error state or toast. |
| `admin-api-keys.tsx` | Empty `catch {}` block (line 69) — same problem |
| `admin-audit-logs.tsx` | `throw new Error("Failed to fetch")` — React Query handles this, but no `isError` UI is rendered |
| `admin-2fa-setup.tsx` | Silently drops error from `listFactors` (line 44) — no user feedback |
| `admin-bulk-health.tsx` | Individual check errors are captured in health map — Good |

**Fix:** Add error state UI to `admin-audit-logs.tsx` using React Query's `isError`/`error`. Replace silent catch blocks with toast notifications or error state UI.

### Empty states: Good coverage

- `admin-tickets.tsx`: Inbox icon + contextual message based on search/filter state — excellent
- `admin-customers.tsx`: Inbox icon + contextual message — excellent
- `admin-audit-logs.tsx`: "No audit logs found" row
- `admin-api-keys.tsx`: "No API keys configured" text
- `admin-vps-health.tsx`: "No VPS instances." text
- `admin-customer-detail.tsx`: Per-section empty messages for every section — excellent
- `admin-deploy.tsx`: Rocket icon + guidance text in progress panel

---

## 7. Unused Imports & Dead Code

| File | Issue |
|---|---|
| `admin-vps-health.tsx` | `useEffect` imported (line 3) but never used |
| `admin-vps-health.tsx` | `AlertTriangle` imported (line 10) but never used |
| `admin-customers.tsx` | None detected |
| `admin-customer-detail.tsx` | `Key` imported but used. All imports appear used. |
| `admin-vps-health.tsx` | `stopped` variable (line 105) is computed but never rendered |

### Duplicated code: `AdminDeleteCustomer` is redundant

`admin-delete-customer.tsx` (133 lines) implements the exact same delete confirmation dialog that already exists inside `admin-customer-detail.tsx` (lines 1128-1177). The standalone component (`admin-delete-customer.tsx`) does not appear to be imported anywhere based on the page files reviewed. If it is truly unused, delete it. If it was previously used by an older customer detail page, it is now dead code.

### Duplicated config objects

`STATUS_CONFIG` and `PRIORITY_CONFIG` are defined in 3 places:
1. `admin-tickets.tsx` (lines 37-77)
2. `admin-ticket-thread.tsx` (lines 48-88)
3. `admin-overview page.tsx` (lines 20-31)

These should be extracted to a shared constants file, e.g., `src/lib/ticket-status.ts`.

`PLAN_COLORS` / `STATUS_COLORS` are defined in both `admin-customer-detail.tsx` and `admin-customers.tsx` with slightly different formats. Should be unified.

---

## 8. Accessibility

### Missing `aria-label` on icon-only buttons

| File | Line(s) | Element |
|---|---|---|
| `admin-dashboard-auth.tsx` | 133-144 | Eye/EyeOff toggle button — no accessible label |
| `admin-customer-detail.tsx` | 255-260 | Eye/EyeOff toggle in `CredentialField` — uses raw `<button>` with no aria-label |
| `admin-customer-detail.tsx` | 262-266 | Copy button in `CredentialField` — no aria-label |
| `admin-vps-editor.tsx` | 219-229 | Eye/EyeOff toggle — raw `<button>`, no aria-label |
| `admin-api-keys.tsx` | 194-205 | Delete button per key — icon-only, no aria-label |

**Fix:** Add `aria-label` to all icon-only buttons. Example: `aria-label="Toggle password visibility"`, `aria-label="Copy to clipboard"`, `aria-label="Delete API key"`.

### Missing keyboard support

- `admin-customers.tsx`: Table rows use `onClick` on `<td>` elements instead of `<tr>`. The rows are not focusable (`tabIndex` missing) and have no `onKeyDown` handler. Users cannot navigate the table with keyboard.
- `admin-customer-detail.tsx`: Ticket rows (line 1077) use `onClick` on `<div>` but are not keyboard-accessible.
- `admin-bulk-health.tsx`: Table rows (line 241) use `onClick` but are not keyboard-accessible.

**Fix:** Add `tabIndex={0}`, `role="link"` or `role="button"`, and `onKeyDown` handler that triggers on Enter/Space.

### Missing `<label>` associations

- `admin-deploy.tsx`: Labels are present but not linked to inputs via `htmlFor`/`id` pairs.
- `admin-subscription-editor.tsx`: Same issue — `<Label>` components without `htmlFor`.

### Good practices observed:
- `verify-2fa page.tsx`: `htmlFor="code"` + `id="code"` on the verification input — correct
- `admin-deploy.tsx`: `aria-expanded={customerOpen}` on combobox — correct
- Dialog components use proper `DialogTitle`/`DialogDescription` — correct

---

## 9. Supabase Client Usage in Client Components

### Issue: `admin-2fa-setup.tsx` and `verify-2fa page.tsx` call `createClient()` inside the component body

```ts
const supabase = createClient();
```

This creates a new Supabase client on every render. Should be moved outside the component or wrapped in `useMemo`/module-level singleton.

---

## 10. Data Fetching Patterns

### Server components (pages) are well-structured

All page files that fetch data use server components with `createAdminClient()` and pass props to client components. This is the correct Next.js 15 pattern:
- `admin/page.tsx` (overview) — parallel queries with `Promise.all`
- `admin/customers/page.tsx` — single query with joins
- `admin/deploy/page.tsx` — single query
- `admin/tickets/page.tsx` — single query with joins
- `admin/tickets/[id]/page.tsx` — two sequential queries
- `admin/health/page.tsx` — single query with joins

### Client components that fetch their own data

`admin-customer-detail.tsx` fetches all data client-side via `/api/admin/customers/{id}/full`. This is intentional (the page is a thin wrapper), but it means the initial page load shows a spinner. Consider server-side data fetching in the page component and passing initial data as props, then using React Query for refetching.

---

## 11. Summary of Action Items

### Priority 1 (High)
1. Split `admin-customer-detail.tsx` into 5-8 smaller components
2. Replace manual `useState`/`useEffect`/`fetch` patterns with React Query in `admin-customer-detail.tsx`, `admin-api-keys.tsx`, `admin-dashboard-auth.tsx`, `admin-2fa-setup.tsx`
3. Fix 7 `any` type usages with proper interfaces
4. Add error state UI to `admin-audit-logs.tsx`
5. Fix silent error swallowing in `admin-dashboard-auth.tsx` and `admin-api-keys.tsx`

### Priority 2 (Medium)
6. Extract shared config constants (`STATUS_CONFIG`, `PRIORITY_CONFIG`, `PLAN_COLORS`) into `src/lib/` files
7. Add `aria-label` to all icon-only buttons (5+ components)
8. Add keyboard navigation to clickable table rows (3 components)
9. Fix responsive issues on `admin-audit-logs.tsx` filter bar and `admin-tickets.tsx` tabs
10. Remove unused imports in `admin-vps-health.tsx` (`useEffect`, `AlertTriangle`)
11. Delete or verify usage of `admin-delete-customer.tsx` (likely dead code)

### Priority 3 (Low)
12. Associate `<Label>` with inputs via `htmlFor`/`id` in `admin-deploy.tsx`, `admin-subscription-editor.tsx`
13. Move `createClient()` calls out of component body in `admin-2fa-setup.tsx` and `verify-2fa page.tsx`
14. Consider server-side initial data fetch for customer detail page
15. Add responsive card layout for customer table on small screens
