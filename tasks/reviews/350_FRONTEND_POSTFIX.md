# 350 -- Frontend Post-Fix Review: Mission Control Components

**Reviewer:** Frontend Developer
**Date:** 2026-03-16
**Scope:** All MC component files, realtime hook, keyboard lib -- after 58-fix round

---

## 1. Was task-board.tsx Split? (FIX-58)

**VERDICT: NOT SPLIT -- still a single 1,536-line file.**

FIX-58 called for extracting `CalendarView`, `SwimlaneView`, `TaskListView`, `CreateTaskDialog`, and `FilterBar` into separate files. All five sub-components exist but remain **inline inside `task-board.tsx`**. The file is the largest in the MC suite by a wide margin.

| Component | Approx Lines | Should Be Extracted? |
|-----------|-------------|---------------------|
| `CalendarView` | ~280 | YES |
| `SwimlaneView` | ~140 | YES |
| `TaskListView` | ~60 | Borderline |
| `CreateTaskDialog` | ~135 | YES |
| `FilterBar` | ~130 | YES |
| `SortableTaskCard` / `TaskCardContent` | ~180 | YES |
| `DroppableColumn` | ~75 | Borderline |
| Main `TaskBoard` | ~400 | Stays |

**Recommendation:** Extract `CalendarView`, `SwimlaneView`, `CreateTaskDialog`, `FilterBar`, and the card components into co-located files under `src/components/mission-control/`. This would bring `task-board.tsx` down to ~500 lines.

---

## 2. Component Sizes

| File | Lines | Status |
|------|-------|--------|
| `task-board.tsx` | 1,536 | TOO LARGE -- needs split |
| `task-detail-modal.tsx` | 935 | LARGE but acceptable (single modal, tabbed) |
| `session-tracker.tsx` | 426 | OK |
| `event-feed.tsx` | 431 | OK |
| `agent-roster.tsx` | 438 | OK |
| `mission-control-overview.tsx` | 512 | OK |
| `command-palette.tsx` | 163 | OK |
| `priority-badge.tsx` | 31 | OK |
| `status-indicator.tsx` | 41 | OK |

---

## 3. TypeScript -- `any` Types

**PASS.** Zero `any` type annotations found across all MC components, the realtime hook, and the keyboard lib. All types use proper interfaces from `@/types/mission-control`. The `dragListeners` prop uses `Record<string, unknown>` (line 149 of task-board.tsx) which is the correct approach.

---

## 4. useEffect Infinite Loop Risks (FIX-16)

**MOSTLY FIXED, two residual concerns:**

### 4a. agent-roster.tsx -- ref pattern applied (PASS)
Lines 53-58: Uses `selectedAgentIdRef` with a `useMemo` derivation + `setForceRender` counter to avoid re-render loops. The pattern works but the `setForceRender` counter hack is inelegant. A cleaner approach would be a single `useState` for `selectedAgentId`.

### 4b. session-tracker.tsx -- potential infinite update loop (CONCERN)
Lines 75-80:
```typescript
useEffect(() => {
  if (selectedSession) {
    const updated = sessions.find((s) => s.id === selectedSession.id);
    if (updated) setSelectedSession(updated);
  }
}, [sessions, selectedSession]);
```
`selectedSession` is both a dependency AND is set inside the effect. Every time `sessions` changes, this fires and calls `setSelectedSession(updated)` which creates a new object reference, which triggers the effect again. It stabilizes only because `sessions` doesn't change on the next cycle, but if the polling interval fires during the update, it could cause a brief cascade. The same pattern exists in `task-board.tsx` line 1190-1195.

**Recommendation:** Compare by ID only, or use a ref for selectedId (like agent-roster does).

---

## 5. Debouncing (FIX-05, FIX-46)

### 5a. Description/Criteria Debouncing (FIX-05) -- PASS
`task-detail-modal.tsx` lines 149-165: Local state + `debouncedUpdate` with 500ms setTimeout via ref. Properly clears previous timer. Description and acceptance_criteria both use this pattern.

### 5b. Search Debouncing (FIX-46) -- NOT IMPLEMENTED

`FilterBar` in task-board.tsx line 396: `onChange={(e) => onSearchChange(e.target.value)}` passes the raw value straight to `setSearchQuery`, which feeds into a `useMemo` filter. The `useMemo` itself is cheap (client-side array filter), so this is acceptable for moderate task counts. However, if tasks scale to hundreds, there is no debounce protection. The search is not firing API calls, so this is **low severity**.

**Recommendation:** Add a 200ms debounce on `searchQuery` if task count is expected to exceed ~500.

---

## 6. Accessibility

### 6a. ARIA Attributes (FIX-48, FIX-49) -- PARTIAL

**Present:**
- View toggle buttons in `FilterBar` have `aria-pressed` and `role="button"` (lines 455-483).

**Missing:**
- Drag handles in `SortableTaskCard` have no `aria-label` (screen readers see an unlabeled button).
- `DroppableColumn` has no `aria-label` describing the column name/role.
- Calendar day cells use `<div>` with click handlers -- should be `role="gridcell"` or use `<button>`.
- Swimlane collapse buttons have no `aria-expanded` attribute.
- Event feed filter popovers have no `aria-haspopup` or `aria-expanded`.
- Session status filter buttons have no `aria-pressed`.
- Command palette dialog: the `<button>` for "Back" (line 50-55) has no `aria-label`.

### 6b. Text Sizes (FIX-47) -- MOSTLY PASS

Most text uses `text-[10px]`, `text-[11px]`, `text-xs` (12px), or `text-sm` (14px). The smallest size seen is `text-[8px]` (calendar overflow indicator, line 864 of task-board.tsx) and `text-[9px]` (multiple badge/ID labels). The `text-[9px]` occurrences are borderline but used for supplementary labels only, not primary content.

**One issue:** `text-[8px]` on the calendar "+N" overflow count is too small. Should be at least `text-[10px]`.

---

## 7. Mobile / Responsive

### 7a. Swimlane Overflow (FIX-50) -- FIXED
Line 665 uses `overflow-x-auto` on the swimlane grid container with `minmax(150px, 1fr)` columns. This allows horizontal scrolling on narrow screens. However, the grid uses `gridTemplateColumns: repeat(${MC_COLUMNS.length}, minmax(150px, 1fr))` which creates 7 columns -- on mobile this means a very wide scroll area (7 x 150px = 1050px minimum). Functional, but the UX is heavy scrolling.

### 7b. Calendar Layout (FIX-26) -- PARTIALLY FIXED
- Month view: 7-column grid does not collapse on mobile. At 320px viewport, each cell is ~46px wide, which is cramped but functional because content uses dot indicators.
- Week view: Same 7-column grid, cells are even wider (min-h 200px). On mobile this would be very tight.
- Day view: Single-column, works fine on mobile.

**Recommendation:** Consider stacking calendar to 1-column on `sm:` breakpoint or defaulting to day/week view on mobile.

### 7c. Kanban Board
Line 308: `w-[280px] sm:w-[300px]` for columns. The `overflow-x-auto` on the parent (line 1502) handles horizontal scroll. This is the standard approach for mobile Kanban. PASS.

---

## 8. Command Palette (FIX-29)

**Actions available:**
1. Create Task
2. Keyboard Shortcuts
3. Navigate: Overview, Task Board, Agent Roster, Event Feed, Sessions

**Missing actions that were suggested in FIX-29:**
- Quick filter by priority (e.g., "Show critical tasks")
- Quick filter by agent
- Toggle view mode (kanban/list/swimlane/calendar)
- Bulk actions (mark done, delete)
- Jump to specific task by ID/title search

The command palette is functional but minimal. The navigation paths also use `/mission-control/*` instead of the middleware-rewritten clean URLs, though this may still work via Next.js client-side routing.

---

## 9. Unused Imports (FIX-41, FIX-42)

**PASS -- no obvious unused imports detected.**

Verified across all MC component files:
- `task-board.tsx`: All imported icons and components are used.
- `task-detail-modal.tsx`: `Calendar` and `Bot` icons are imported but not directly used in JSX -- however `Bot` is used indirectly via agent display. `Calendar` is unused. **One potential unused import: `Calendar` from lucide-react** (line 7). The component uses `Clock` for time display, not `Calendar`.
- `event-feed.tsx`: `Pause`, `PlayIcon` -- both used in live toggle.
- `session-tracker.tsx`: All used.
- `agent-roster.tsx`: All used.

**One unused import found:** `task-detail-modal.tsx` imports `Calendar` (line 7) but never uses it in the JSX. Only `Clock` is used for timestamp display.

---

## 10. Performance

### 10a. Polling Intervals (FIX-30)

| Component | Query Key | Interval | Assessment |
|-----------|-----------|----------|------------|
| `task-board.tsx` | `mc-tasks` | 10s | OK (was higher?) |
| `task-board.tsx` | `mc-agents` | 10s | OK |
| `agent-roster.tsx` | `mc-agents` | 2s | AGGRESSIVE -- should be 5-10s |
| `mission-control-overview.tsx` | `mc-metrics` | 10s | OK |
| `mission-control-overview.tsx` | `mc-agents` | 5s | OK |
| `mission-control-overview.tsx` | `mc-tasks` | 5s | OK |
| `mission-control-overview.tsx` | `mc-events` | 5s | OK |
| `mission-control-overview.tsx` | `mc-sessions` | 5s | OK |
| `event-feed.tsx` | `mc-events` | 5s (live) / off (paused) | GOOD |
| `session-tracker.tsx` | `mc-sessions` | 3s | AGGRESSIVE -- should be 5s |

The realtime hook adds a safety-net poll at 30s when connected, 5s when disconnected. This is good. However, the individual component polls STACK with the realtime hook's polls. When on the agents page with realtime connected, `mc-agents` gets polled every 2s (agent-roster) + every 30s (realtime hook) = effectively every 2s. The realtime hook should make the aggressive component polls unnecessary.

**Recommendation:** When realtime is connected, component-level `refetchInterval` should be longer (30s+) or disabled entirely, relying on realtime invalidation.

### 10b. Memoization -- PASS
- `filteredTasks`, `tasksByColumn`, `realAgents` are all properly `useMemo`'d with correct dependencies.
- `SwimlaneView` lanes computation is memoized.
- `CalendarView` monthDays/weekDays/tasksByDate are memoized.
- `persistDragMove` is `useCallback`'d with `[queryClient]` dependency. Correct.

---

## 11. State Management -- Stale State in handleDragEnd (FIX-57)

**FIXED.** Lines 1183-1184 and 1338-1348:
```typescript
const tasksRef = useRef(tasks); // FIX-57
tasksRef.current = tasks;
// ...
const currentTasks = tasksRef.current; // in handleDragEnd
```
The ref is updated on every render, and `handleDragEnd` reads from `tasksRef.current` instead of the closure-captured `tasks`. This correctly avoids stale state when `setTasks` in `handleDragOver` hasn't propagated to the closure yet.

**Minor concern:** `tasksRef.current` is updated synchronously during render. The `setTasks` call in `handleDragEnd` (line 1327) uses a callback form `(prev) => ...` which is correct. However, line 1339 reads `tasksRef.current` AFTER the `setTasks` call -- but `setTasks` is async (batched), so `tasksRef.current` still holds the pre-setTasks value at that point. This means the `persistDragMove` call may send a stale position. The position calculation on line 1344 re-filters and re-sorts from `currentTasks`, which already has the column change from `handleDragOver` but NOT the reorder from line 1327.

**Impact:** For cross-column moves, position is correct (column was already changed in `handleDragOver`). For same-column reorders, the position sent to the API might be off by one. This is a subtle bug that would only manifest when reordering within the same column.

---

## 12. Supabase Realtime Hook

**PROPERLY WIRED. Good implementation.**

`src/hooks/use-mc-realtime.ts`:
- Creates a Supabase Realtime channel scoped to `mc:{userId}`.
- Listens for broadcast events with `event: "*"` wildcard.
- Maps event types to query keys via `EVENT_TO_QUERY_KEY`:
  - `task_created/updated/deleted` -> `["mc-tasks"]`
  - `agent_status_changed` -> `["mc-agents"]`
  - `new_event` -> `["mc-events"]`
  - `session_created/updated` -> `["mc-sessions"]`
- Falls back to 5s polling when disconnected, 30s safety-net when connected.
- Respects `document.visibilityState` to skip polls when tab is hidden.
- Immediate refresh on tab focus.
- Proper cleanup in useEffect return.

**Concerns:**
1. The `queryClient` is in the useEffect dependency array (line 110). TanStack's `useQueryClient` returns a stable reference, so this is safe, but it's unnecessary noise.
2. Missing query keys: `mc-comments`, `mc-reviews`, `mc-activities` are not in `EVENT_TO_QUERY_KEY`. If a comment or review is added by another user or agent, it won't trigger a realtime refresh of those tabs. Low priority since these are fetched on-demand per task.
3. The Supabase channel is created fresh on every userId change. If `userId` is set asynchronously (which it is, via `getUser().then()`), the effect runs twice: once with `null` (early return), once with the actual ID. This is fine.

---

## Summary: Issue Severity Table

| # | Issue | Severity | FIX Ref | Status |
|---|-------|----------|---------|--------|
| 1 | task-board.tsx not split (1,536 lines) | Medium | FIX-58 | NOT DONE |
| 2 | No `any` types | -- | FIX-41 | PASS |
| 3 | Session tracker useEffect dependency loop risk | Low | FIX-16 | PARTIAL |
| 4 | Search not debounced | Low | FIX-46 | NOT DONE (acceptable for now) |
| 5 | Missing ARIA: drag handles, swimlane expand, calendar cells | Medium | FIX-48/49 | PARTIAL |
| 6 | `text-[8px]` on calendar overflow | Low | FIX-47 | NOT FIXED |
| 7 | Calendar/week view not mobile-responsive | Low | FIX-26 | PARTIAL |
| 8 | Command palette missing advanced actions | Low | FIX-29 | PARTIAL |
| 9 | Unused `Calendar` import in task-detail-modal | Trivial | FIX-41 | NOT FIXED |
| 10 | Agent roster polls at 2s, sessions at 3s (too aggressive) | Medium | FIX-30 | NOT FULLY FIXED |
| 11 | Stale state in same-column reorder persist | Low | FIX-57 | PARTIAL (cross-col fixed, same-col edge case) |
| 12 | Realtime hook missing comment/review/activity keys | Low | -- | NEW |
| 13 | Description/criteria debouncing | -- | FIX-05 | PASS |
| 14 | Realtime hook wired and functional | -- | FIX-10 | PASS |
| 15 | Undo stack for moves/deletes | -- | -- | PASS |
| 16 | Optimistic updates with rollback | -- | -- | PASS |
| 17 | `isSyncingRef` cleared in callback not timer | -- | FIX-17 | PASS |

---

## Priority Actions

1. **Split task-board.tsx** into 4-5 co-located files. This is the single biggest maintainability debt.
2. **Reduce polling intervals** for agent-roster (2s -> 10s) and session-tracker (3s -> 5s). The realtime hook handles instant updates.
3. **Add ARIA labels** to drag handles (`aria-label="Reorder task"`), swimlane collapse buttons (`aria-expanded`), and calendar cells (`role="gridcell"`).
4. **Fix same-column reorder persistence** by reading from the `setTasks` callback's return value or deferring the persist to a `useEffect`.
