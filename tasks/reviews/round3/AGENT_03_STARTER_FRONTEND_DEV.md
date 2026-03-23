# Agent 03 — Starter Dashboard — Frontend Developer Review

**Total Issues Found: 24**
- CRITICAL: 2
- HIGH: 7
- MEDIUM: 10
- LOW: 5

---

## React Anti-Patterns

### [FE-01] — Redundant useEffect dependencies in VPS chart accumulation
**File:** `src/components/dashboard/vps-controls.tsx:196`
**Severity:** MEDIUM
**Description:** The useEffect that accumulates chart data lists both `monitoring` and individual sub-properties (`monitoring?.cpu_percent`, `monitoring?.ram_used_mb`, etc.) as dependencies. Since `monitoring` is an object returned by `useQuery`, when it changes reference, all sub-properties change too. The sub-property deps are redundant and misleading.
**Impact:** Confusing for future developers; could cause double-firing if React Query ever returns a stable reference with changed nested values.
**Suggestion:** Use only `[monitoring]` as the dependency.

### [FE-02] — Unused `useCallback` import in AgentChat
**File:** `src/components/dashboard/agent-chat.tsx:3`
**Severity:** LOW
**Description:** `useCallback` is imported but never used in the component.
**Impact:** Dead code.
**Suggestion:** Remove the unused import.

### [FE-03] — `handleSend` called without await in keyboard handler
**File:** `src/components/dashboard/agent-chat.tsx:437`
**Severity:** MEDIUM
**Description:** `handleKeyDown` calls `handleSend()` without `await`. Errors inside the async function become unhandled promise rejections.
**Impact:** If `handleSend` throws, the error won't bubble up.
**Suggestion:** Add `await` or `.catch()`.

### [FE-04] — Chat page uses `absolute inset-0` which breaks parent layout flow
**File:** `src/app/dashboard/chat/page.tsx:92`
**Severity:** HIGH
**Description:** The chat page wraps content in `<div className="absolute inset-0 flex flex-col">`, which removes the element from document flow. Combined with the layout's `p-6` on `<main>`, this causes the chat to overlay padding and potentially overflow.
**Impact:** On certain screen sizes, the chat area may clip behind the sidebar or extend beyond the viewport.
**Suggestion:** Use `h-[calc(100vh-3.5rem)]` with `-m-6` (like the OpenClaw page does at line 103).

### [FE-05] — eslint-disable suppressing exhaustive-deps in ChannelManager
**File:** `src/components/dashboard/channel-manager.tsx:280-281`
**Severity:** MEDIUM
**Description:** The `fetchLastMessages` callback uses `channels` but lists `connectedChannelIds` as its dependency. Currently safe, but fragile if the function body changes.
**Impact:** Potential stale closure if future changes read more from `channels`.
**Suggestion:** Derive connected IDs outside the callback and pass as a parameter.

## TypeScript Issues

### [FE-06] — `as any` type assertions in health check handler
**File:** `src/components/dashboard/channel-manager.tsx:365,369`
**Severity:** MEDIUM
**Description:** Uses `as any` twice for the health check response. The API shape is known and should be typed.
**Impact:** Property typos won't be caught at compile time.
**Suggestion:** Define an interface for health check results.

### [FE-07] — `as any` in agent store sort handler
**File:** `src/components/dashboard/agent-store.tsx:145`
**Severity:** LOW
**Description:** `setSortBy(e.target.value as any)` instead of the proper union type.
**Impact:** No compile-time validation.
**Suggestion:** Cast to `"name" | "newest" | "price"`.

### [FE-08] — Supabase agent join type needs manual casting
**File:** `src/app/dashboard/agents/page.tsx:85`
**Severity:** LOW
**Description:** Requires `as UserAgent[]` cast because manual interfaces don't match Supabase's generated types.
**Impact:** Schema changes silently hide mismatches.
**Suggestion:** Generate Supabase types from the schema.

## State Management

### [FE-09] — Duplicate data fetching between dashboard layout and pages
**File:** `src/app/dashboard/layout.tsx:27-38` and multiple page files
**Severity:** HIGH
**Description:** The layout fetches `subscription`, then each page re-fetches it. The layout already redirects if no subscription exists.
**Impact:** Redundant Supabase queries on every page load.
**Suggestion:** Pass subscription via `UserProvider` context, or use React `cache()`.

### [FE-10] — Agent/Channel/Model managers use local state without sync
**File:** `src/components/dashboard/agent-manager.tsx:83`, `channel-manager.tsx:238`, `model-config.tsx:57`
**Severity:** MEDIUM
**Description:** These components initialize `useState` from server props and manually patch on mutations, with no polling or revalidation.
**Impact:** Stale data if another session modifies the data.
**Suggestion:** Use `useQuery` with `initialData` or call `router.refresh()` after mutations.

## Missing Loading/Error/Empty States

### [FE-11] — Monitoring page swallows Supabase errors silently
**File:** `src/app/dashboard/monitoring/page.tsx:59-61`
**Severity:** HIGH
**Description:** The try block does not check `vpsRes.error` or `subRes.error`, unlike other pages. Database errors appear as "No VPS Provisioned" instead of the error state.
**Impact:** Incorrect user feedback on database errors.
**Suggestion:** Add error checks like other pages.

### [FE-12] — Chat page silently ignores Supabase errors
**File:** `src/app/dashboard/chat/page.tsx:40-41`
**Severity:** HIGH
**Description:** Same as FE-11: `agentsRes.error` and `vpsRes.error` are not checked.
**Impact:** Permissions errors show "No agents deployed" instead of the error state.
**Suggestion:** Add explicit error checks.

## Responsive/Mobile Layout Issues

### [FE-13] — Agent manager summary card header wraps poorly on mobile
**File:** `src/components/dashboard/agent-manager.tsx:300-353`
**Severity:** MEDIUM
**Description:** Single-row flex layout with stats and dropdown gets squeezed on narrow screens.
**Impact:** Content may clip or overlap below ~400px.
**Suggestion:** Add `flex-wrap` or stack on small screens.

### [FE-14] — Monitoring page grid-cols-2 cards too narrow on small phones
**File:** `src/app/dashboard/monitoring/page.tsx:148`
**Severity:** LOW
**Description:** `grid-cols-2` gives ~145px per card on 320px phones. Large numbers may overflow.
**Impact:** Minor visual issue on very narrow viewports.
**Suggestion:** Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.

### [FE-15] — Billing plans grid creates uneven card heights
**File:** `src/components/dashboard/billing-overview.tsx:287`
**Severity:** LOW
**Description:** Enterprise card is shorter than others on `md` screens with `grid-cols-2`.
**Impact:** Minor aesthetic issue.
**Suggestion:** Use `grid-auto-rows: 1fr`.

## Accessibility Issues

### [FE-16] — Notification bell button lacks accessible label
**File:** `src/components/dashboard/notification-bell.tsx:107`
**Severity:** HIGH
**Description:** The bell button has only an icon, no `aria-label`. Screen readers announce it as an unlabeled button.
**Impact:** Screen reader users cannot identify the button's purpose.
**Suggestion:** Add `aria-label="Notifications"`.

### [FE-17] — Notification items without href are non-functional buttons
**File:** `src/components/dashboard/notification-bell.tsx:144-146`
**Severity:** MEDIUM
**Description:** Notifications without `href` are rendered as `<button>` but clicking does nothing.
**Impact:** Confusing for all users; misleading for screen reader users.
**Suggestion:** Render as `<div>` when no `href` exists.

### [FE-18] — Filter buttons lack focus-visible styles
**File:** `src/components/dashboard/agent-manager.tsx:358-369`, `agent-store.tsx:129-141`
**Severity:** MEDIUM
**Description:** Raw `<button>` elements with no focus ring styles.
**Impact:** Keyboard users cannot see which button is focused.
**Suggestion:** Add `focus-visible:ring-2 focus-visible:ring-ring`.

### [FE-19] — Native select elements lack proper labeling
**File:** `src/components/dashboard/agent-manager.tsx:372-379`, `agent-store.tsx:143-150`
**Severity:** MEDIUM
**Description:** `<select>` elements for sorting have no `<label>` or `aria-label`.
**Impact:** Screen readers won't announce what the select controls.
**Suggestion:** Add `aria-label="Sort order"`.

## Component Size Issues

### [FE-20] — ChannelManager is 862 lines with too many concerns
**File:** `src/components/dashboard/channel-manager.tsx`
**Severity:** HIGH
**Description:** Handles listing, health checking, connecting, disconnecting, reconnecting, credential fetching, ordering, status history, and wizard triggering. 10+ state variables.
**Impact:** Difficult to maintain, test, or review.
**Suggestion:** Extract `ChannelCard`, `ChannelHealthCheck`, `ConnectChannelSection` sub-components.

### [FE-21] — AgentManager is 684 lines with inline bulk action logic
**File:** `src/components/dashboard/agent-manager.tsx`
**Severity:** HIGH
**Description:** Embeds sequential bulk deploy/undeploy loop (lines 205-293) that floods the UI with toast notifications.
**Impact:** UI spam during bulk actions; hard to maintain.
**Suggestion:** Extract `useBulkAgentAction` hook and split into sub-components.

## Inconsistent Patterns

### [FE-22] — Inconsistent auth redirect pattern across pages
**File:** Multiple pages
**Severity:** MEDIUM
**Description:** Pages use two different patterns: dynamic import (`await import("next/navigation")`) in 9 pages vs static import in 2 pages. The dynamic import is unnecessary in server components.
**Impact:** Inconsistency and unnecessary complexity.
**Suggestion:** Use static import consistently.

### [FE-23] — Hardcoded color values violate the 60-30-10 design system
**File:** Multiple components
**Severity:** CRITICAL
**Description:** Per CLAUDE.md, ALL colors MUST come from CSS variables. Numerous components use hardcoded Tailwind colors (`text-yellow-500`, `bg-green-600`, `text-red-500`, `text-blue-500`, `text-green-400`) instead of design system variables (`--success`, `--warning`, `--error`, `--info`).
**Impact:** Theme changes via `globals.css` won't affect these colors, breaking the design system's core promise.
**Suggestion:** Replace with CSS variable equivalents throughout.

### [FE-24] — Overview page pending model uses hardcoded yellow
**File:** `src/app/dashboard/page.tsx:229`
**Severity:** CRITICAL
**Description:** `text-yellow-500` used for the pending model indicator on the main overview page, visible to all users with a pending model change.
**Impact:** Won't update with theme changes; violates the mandatory design system rule.
**Suggestion:** Replace with `text-[var(--warning)]`.
