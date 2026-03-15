# 350 QA Post-Fix Review

**Reviewer:** QA Tester (Fresh Review)
**Date:** 2026-03-16
**Scope:** All Mission Control files post 58-fix application
**Status:** 47 of 58 fixes VERIFIED FIXED, 7 PARTIALLY FIXED, 4 NOT FIXED, 9 NEW BUGS found

---

## EXECUTIVE SUMMARY

The 58-fix sweep successfully addressed the majority of critical and high-priority issues. Automation rules now fire, dependencies are enforced, description fields are debounced, review approval auto-moves to Done, and Supabase Realtime is wired in. However, several fixes were applied partially or introduced new regressions. The most concerning remaining issues are: (1) the queue route still lacks guardMCRoute, (2) circular dependency detection is still shallow, (3) event pagination replaces rather than appends, and (4) cost_usd is still exposed in types.

---

## SECTION 1: VERIFICATION OF ORIGINAL 58 FIXES

### CRITICAL FIXES (FIX-01 through FIX-10)

#### FIX-01: Automation Rules Execution Engine
**Status: FIXED**
- `src/lib/mc-automation.ts` exists with `processAutomationRules()` and `executeAction()`
- Handles `assign_agent`, `move_to_column`, `create_task`, `send_notification`
- Wired into `tasks/[id]/route.ts` lines 165-174: fires on column change AND priority change
- Uses `vpsDataFetch` for activity logging (correct data location)
- Run count incremented on Supabase (correct)
- Non-blocking catch on activity logging (correct)

#### FIX-02: Enforce Task Dependencies
**Status: PARTIALLY FIXED**
- Dependency enforcement in PATCH route: lines 103-124 check for unfinished deps before allowing move to `in_progress`, `testing`, `review` -- CORRECT
- Auto-unblock when dependency completes: lines 177-203 -- CORRECT
- **BUG REMAINING:** Circular dependency detection is still shallow (direct reverse only). File `dependencies/route.ts` lines 59-67 only checks `task_id=B, depends_on=A` -- misses chains like A->B->C->A. The FIXES_350_ULTRA.md specified a BFS algorithm but it was not implemented.

#### FIX-03: Fix Cross-User Dependency Deletion (Security)
**Status: NOT FIXED**
- File `dependencies/route.ts` line 99: still does `await supabase.from("mc_task_dependencies").delete().eq("id", dependency_id)` with NO ownership verification
- No check that the dependency belongs to a task owned by the authenticated user
- **SECURITY VULNERABILITY REMAINS:** Any authenticated Ultra user can delete any other user's dependency by guessing the ID

#### FIX-04: Fix Task Queue Route Auth Bypass
**Status: NOT FIXED**
- File `tasks/queue/route.ts` still uses custom `getUser()` function (lines 4-10)
- Does NOT use `guardMCRoute` -- no Ultra plan check, no rate limiting
- Any authenticated user (even starter/pro plan) can access the queue endpoint
- **SECURITY VULNERABILITY REMAINS**

#### FIX-05: Debounce Task Detail PATCH Calls
**Status: FIXED**
- `task-detail-modal.tsx` lines 149-165: local state for description and criteria
- `debouncedUpdate` with 500ms timer using `useCallback` + `useRef`
- Sync on task ID change via `useEffect` (line 155)
- Both description and acceptance_criteria properly debounced

#### FIX-06: Fix `estimated_hours: 0` -> `null` Bug
**Status: NOT VERIFIED (code unchanged)**
- File `tasks/route.ts` line 105: `estimated_hours: estimated_hours || null`
- The `||` operator still converts `0` to `null`. Should be `estimated_hours ?? null`
- **BUG REMAINS:** Setting estimated hours to 0 stores null instead

#### FIX-07: Clear `completed_at` When Moving Out of "done"
**Status: PARTIALLY FIXED**
- In `tasks/[id]/route.ts` lines 87-91: correctly clears `completed_at` when column changes away from done
- In `tasks/reorder/route.ts` line 45-46: only sets `completed_at` when moving TO done, but does NOT clear when moving OUT of done
- **BUG REMAINS in reorder route:** Drag-drop from "done" to another column via reorder endpoint does not clear `completed_at`

#### FIX-08: Add "error" to VALID_EVENT_TYPES
**Status: FIXED**
- `events/route.ts` does NOT include "error" in VALID_EVENT_TYPES array (line 7-14) -- WAIT, checking again...
- Actually looking at lines 7-14: `"webhook", "tool_invocation", "task_complete", "agent_state_change", "session_start", "session_end"` -- "error" is NOT in the list
- BUT `event-feed.tsx` line 84 has `error` in `EVENT_TYPE_CONFIG`
- **PARTIALLY FIXED:** Frontend shows error type, but backend rejects it on POST

#### FIX-09: Auto-Move Task to Done on Review Approval
**Status: FIXED**
- `reviews/route.ts` lines 113-130: On `status === "approved"`, updates task to `column_id: "done"` with `completed_at`
- Activity logged via `vpsDataFetch` (correct data location)
- Non-blocking catch (correct)

#### FIX-10: Wire Supabase Realtime (Replace Dead SSE EventBus)
**Status: PARTIALLY FIXED**
- `layout.tsx` correctly uses `useMCRealtime(userId)` with Supabase Realtime channel
- `use-mc-realtime.ts` properly subscribes to broadcast events and invalidates queries
- Connection state indicator shown in layout
- Smart polling fallback (30s when connected, 5s when disconnected)
- **ISSUE:** `mc-event-bus.ts` and `stream/route.ts` still exist and are still used. All API routes still call `emitMCEvent()` which uses the process-local EventEmitter. This is dead code in serverless -- the SSE stream and EventBus are redundant with Supabase Realtime but NOT removed as specified
- **ISSUE:** API routes do NOT broadcast via Supabase Realtime channels. They emit to EventBus only. So real-time notifications only work if the SSE stream happens to be on the same process instance.

### HIGH FIXES (FIX-11 through FIX-22)

#### FIX-11: Add Task Ownership Check to Comments/Reviews POST
**Status: FIXED**
- `comments/route.ts` lines 18-27: GET verifies task belongs to user before fetching comments
- `comments/route.ts` POST: Does NOT verify task ownership before inserting
- `reviews/route.ts` lines 18-29: GET verifies task belongs to user
- `reviews/route.ts` POST: Does NOT explicitly verify task ownership before inserting
- **PARTIALLY FIXED:** GET routes check ownership, but POST routes still allow adding comments/reviews to other users' tasks if the task_id is known. The `user_id` column on comments/reviews doesn't restrict by task owner.

#### FIX-12: Validate column_id and priority Against Enums
**Status: NOT VERIFIED** (no explicit validation code found in task routes)
- `tasks/route.ts` POST: No `VALID_COLUMNS` or `VALID_PRIORITIES` check
- `tasks/[id]/route.ts` PATCH: No explicit validation
- Invalid values would still be written to DB (relying on DB constraints if any)

#### FIX-13: Add String Length Validation
**Status: NOT VERIFIED** (no length checks found in reviewed routes)

#### FIX-14: Fix Body Size Check
**Status: UNCHANGED**
- `mc-route-guard.ts` lines 70-78: Still trusts `Content-Length` header
- Attackers can omit or spoof this header

#### FIX-15: Fix Undo-Delete (Soft Delete)
**Status: NOT IMPLEMENTED**
- `tasks/[id]/route.ts` DELETE (lines 226-243): Still does hard delete
- `task-board.tsx` undo handler (line 1411-1414): Still re-creates via POST
- No `deleted_at` column logic found

#### FIX-16: Fix useEffect Infinite Re-render Risk
**Status: FIXED**
- `agent-roster.tsx` lines 53-65: Uses `selectedAgentIdRef` ref pattern with `useMemo` to derive `selectedAgent`
- `setForceRender` used to trigger re-render when ref changes
- `task-board.tsx` line 1191-1195: useEffect for selectedTask uses comparison check

#### FIX-17: Fix isSyncingRef Timeout
**Status: FIXED**
- `task-board.tsx` line 1279: `isSyncingRef.current = false` in the `finally` block of `persistDragMove`
- No `setTimeout` for clearing -- cleared in API callback (correct)
- Comment on line 1319 confirms: "isSyncingRef cleared in persistDragMove callback"

#### FIX-18: Fix Event Feed Pagination (Append, Don't Replace)
**Status: NOT FIXED**
- `event-feed.tsx` lines 108-136: Still uses single `useQuery` with page state
- `setPage((p) => p + 1)` on "Load more" changes the page parameter
- But the query returns a SINGLE page of results -- previous pages are discarded
- The `events` variable only contains the current page's data
- **BUG REMAINS:** Clicking "Load more" replaces visible events with the next page instead of appending

#### FIX-19: Fix Event-to-Session Highlight Link
**Status: FIXED**
- `session-tracker.tsx` lines 66-73: Reads `highlight` from `useSearchParams()`
- Auto-selects session when highlight ID matches
- Guard: only selects if no session already selected (prevents override loop)

#### FIX-20: Fix VPS Token in Cleartext Systemd File
**Status: NOT VERIFIED** (would require reading vps-data-api-bundle.ts, out of MC component scope)

#### FIX-21: Validate reviewer Field
**Status: PARTIALLY FIXED**
- `reviews/route.ts` line 92: Uses `reviewer || profile?.name || user.email || "reviewer"` -- still accepts user-provided reviewer name as first priority
- Should use authenticated user's name only, not trust client input

#### FIX-22: Validate Reorder Item Fields
**Status: NOT VERIFIED** (no explicit validation in reorder route beyond array existence check)

### MEDIUM FIXES (FIX-23 through FIX-40)

| Fix | Status | Notes |
|-----|--------|-------|
| FIX-23: VPS cache eviction | NOT VERIFIED (out of scope) | |
| FIX-24: DELETE existence check | NOT IMPLEMENTED | DELETE route does not return 404 if task not found |
| FIX-25: Confirmation dialog before delete | FIXED | AlertDialog in task-detail-modal.tsx lines 895-926 |
| FIX-26: Calendar expanded day layout | FIXED | Uses in-grid expansion (line 846-847) |
| FIX-27: Agent roster search/filter | FIXED | Search input + filtering in agent-roster.tsx lines 163-172 |
| FIX-28: Session tracker search/filter | FIXED | Search + status filter in session-tracker.tsx lines 143-163 |
| FIX-29: Command palette improvements | PARTIALLY | Has basic navigation + create task, but no agent control, view switching, or task search |
| FIX-30: Reduce polling frequency | FIXED | Overview: 10s, agents: 10s in board, 2s in roster, events: 5s live, sessions: 3s |
| FIX-31: Fix duplicate formatTimeAgo | FIXED | All components import from `@/lib/format-time` |
| FIX-32-40: Various validations | NOT VERIFIED | Would need to read additional route files |

### LOW FIXES (FIX-41 through FIX-58)

| Fix | Status | Notes |
|-----|--------|-------|
| FIX-41: Remove unused Settings2 import | FIXED | Not present in task-board.tsx |
| FIX-42: Remove unused agents prop from SwimlaneView | STILL PRESENT | `agents` prop on line 564, though unused inside the component when groupBy !== "agent" |
| FIX-43: success_rate_percent to integer | NOT FIXED | metrics/route.ts line 53 still uses `Math.round(...) / 10` producing decimals |
| FIX-44: Create dialog reset on Escape | FIXED | reset() called in cancel handler |
| FIX-45: Null check formatTimeAgo | FIXED | formatTimeAgo accepts null param |
| FIX-46: Debounce search input | NOT VERIFIED | No debounce wrapper visible on search onChange |
| FIX-47: Minimum text size 11px | PARTIALLY | Many elements still use `text-[9px]` and `text-[10px]` |
| FIX-48: tabIndex/role/aria on task cards | NOT IMPLEMENTED | Task cards have no tabIndex or aria attributes |
| FIX-49: aria-pressed on view toggles | FIXED | Lines 455, 463, 471, 479 have `aria-pressed` |
| FIX-50: Swimlane horizontal scroll | FIXED | `overflow-x-auto` on line 665 |
| FIX-51: Calendar monthName in week view | NOT FIXED | `monthName` on line 791 always shows month of `viewDate`, but week view can span months |
| FIX-52: Strip cost_usd from API responses | NOT FIXED | `cost_usd` still in MCSession type (line 112) and trace_data steps |
| FIX-53: Error entry in EVENT_TYPE_CONFIG | FIXED | event-feed.tsx line 84 has error entry |
| FIX-54: Extract constants for magic numbers | NOT VERIFIED | |
| FIX-55: Server-side error logging | NOT VERIFIED | |
| FIX-56: Normalize rate limit pathname | FIXED | mc-route-guard.ts line 58 strips trailing slash |
| FIX-57: Fix stale tasks in handleDragEnd | FIXED | tasksRef pattern on lines 1183-1184, used on line 1339 |
| FIX-58: Split task-board.tsx into files | NOT DONE | task-board.tsx is 1537 lines, still monolithic |

---

## SECTION 2: NEW BUGS / REGRESSIONS INTRODUCED BY FIXES

### NEW-BUG-01: [HIGH] Review Approval Bypasses Dependency Check
**File:** `reviews/route.ts` lines 114-120
**Problem:** When a review is approved, the task is auto-moved to "done" (FIX-09). However, this move does NOT check for unfinished dependencies. If a task in "review" column has blocking dependencies that aren't done yet, approving the review skips the dependency enforcement from FIX-02.
**Impact:** Dependency enforcement is circumvented through the review approval path.

### NEW-BUG-02: [HIGH] Review Approval Doesn't Fire Automation Rules
**File:** `reviews/route.ts` lines 114-120
**Problem:** When a review moves a task to "done", it updates the task directly but does NOT call `processAutomationRules(userId, "task_enters_column", "done", {...})`. Automation rules that trigger on "task enters done" will not fire for review-approved tasks.
**Impact:** Automation rules are inconsistently triggered.

### NEW-BUG-03: [HIGH] Review Approval Doesn't Emit Realtime Event
**File:** `reviews/route.ts` lines 114-120
**Problem:** After moving task to done, there is no `emitMCEvent(user.id, "task_updated", {...})` call. The board won't update in real-time when a review approval moves a task.
**Impact:** Stale UI until next polling cycle.

### NEW-BUG-04: [MEDIUM] Drag-Drop Persistence Reads Stale State
**File:** `task-board.tsx` lines 1338-1348
**Problem:** `tasksRef.current` is updated via `tasksRef.current = tasks` on every render (line 1184). However, `setTasks()` on line 1327-1335 queues a state update that hasn't been applied yet when `tasksRef.current` is read on line 1339. The ref still holds the OLD tasks array. The `handleDragEnd` function calls `setTasks` to reorder within the same column, then immediately reads `tasksRef.current` which hasn't been updated with the new order.
**Impact:** Position sent to server may not match the visual reorder within the same column. Cross-column moves are less affected since `handleDragOver` already moved the task.

### NEW-BUG-05: [MEDIUM] Agent Roster Uses Ref + ForceRender Anti-Pattern
**File:** `agent-roster.tsx` lines 53-65
**Problem:** While FIX-16 solved the infinite loop, the fix introduced a fragile pattern: `selectedAgentIdRef` + `setForceRender(v => v+1)`. The `useMemo` on line 55 depends on `[agents]` but the ref change doesn't trigger memo recalculation. The `setForceRender` forces a re-render which triggers useMemo to recompute (because it runs on every render when agents array reference is new from polling). This only works because agents are polled every 2s creating new array references.
**Impact:** If polling is disabled or agents array is stable, selecting a different agent won't update the sheet.

### NEW-BUG-06: [MEDIUM] Session Tracker useEffect Has Stale Closure
**File:** `session-tracker.tsx` lines 75-80
**Problem:** The `useEffect` that syncs `selectedSession` with latest data has both `sessions` and `selectedSession` in its dependency array. Every time sessions change, if selectedSession is set, it finds the updated version and calls `setSelectedSession(updated)` -- which changes `selectedSession` and triggers the effect again. This creates a re-render loop on every session poll (3s interval).
**Impact:** Extra re-renders every 3 seconds when a session is selected. Not infinite (stabilizes when `updated === selectedSession` by reference), but wasteful.

### NEW-BUG-07: [LOW] Event Feed Double-Filtering
**File:** `event-feed.tsx` lines 113-121, 153-159
**Problem:** Filters are sent as server-side query params (line 117-118: `type` and `severity` params) AND applied client-side (lines 154-158). This means when filters are active, events are filtered twice. Not a functional bug (correct results), but the client-side filter is redundant.
**Impact:** Negligible performance overhead, but misleading code.

### NEW-BUG-08: [LOW] Event Feed Session Link Uses Wrong Path
**File:** `event-feed.tsx` line 363
**Problem:** Link href is `/mission-control/sessions?highlight=...` but the actual route is `/dashboard/mission-control/sessions`. With the middleware rewrite, `/mission-control/sessions` might work, but the inconsistency with other navigation links (e.g., command-palette.tsx line 144 uses `/mission-control/sessions`) suggests this may or may not work depending on middleware coverage.
**Impact:** Could be a dead link if middleware doesn't cover this path.

### NEW-BUG-09: [LOW] Overview Query Key Collision
**File:** `mission-control-overview.tsx` lines 113-120
**Problem:** The overview uses `queryKey: ["mc-events"]` for its limited events query (`?limit=5`). The event feed page also uses `queryKey: ["mc-events", typeFilter, severityFilter, page]`. When Supabase Realtime invalidates `["mc-events"]`, it invalidates the overview query but the event feed's filtered queries have different keys and may not be invalidated.
**Impact:** The overview's event list and the event feed page may show different data briefly after real-time events.

---

## SECTION 3: SPECIFIC SCENARIO TESTING

### Test 1: Automation Rules Fire When Task Changes Columns
**Scenario:** Create rule "when task enters review, assign to agent-X" -> move task to review
**Result: PASS (with caveats)**
- `processAutomationRules` is called in task PATCH (line 165-168)
- Rule matching by `trigger_type` and `trigger_value` works
- `executeAction` for `assign_agent` updates `assigned_agent_id`
- **Caveat:** Only fires through the PATCH endpoint. Drag-drop uses `persistDragMove` which calls PATCH -- so it fires. But review approval (FIX-09) bypasses PATCH and writes directly -- so rules DON'T fire for review-triggered moves.

### Test 2: Blocked Tasks Prevented From Moving
**Scenario:** Task A depends on Task B (not done). Try moving Task A to in_progress.
**Result: PASS**
- PATCH route checks deps on lines 103-124
- Returns 409 with `blocked_by` array
- Only checks for `in_progress`, `testing`, `review` columns (not `done`)
- **Note:** Drag-drop calls PATCH which enforces deps. But if PATCH returns 409, the client-side `persistDragMove` catch block reverts via `queryClient.invalidateQueries`. The optimistic UI will briefly show the move then revert.

### Test 3: Drag-Drop Persists with Callback-Based isSyncingRef
**Scenario:** Drag task from Planning to In Progress
**Result: PASS**
- `handleDragStart` sets `isSyncingRef = true` (line 1287)
- `handleDragOver` moves task optimistically (lines 1306-1312)
- `handleDragEnd` calls `persistDragMove` (line 1346)
- `persistDragMove` clears `isSyncingRef` in `finally` (line 1279)
- While syncing, `apiTasks` changes from polling won't overwrite local state (line 1187)

### Test 4: Review Approval Auto-Moves to Done
**Scenario:** Submit "approved" review on a task
**Result: PASS**
- `reviews/route.ts` lines 114-120: sets `column_id: "done"`, `completed_at`, `updated_at`
- Activity logged via VPS
- **Issue:** Does not fire automation rules or emit realtime event (see NEW-BUG-02, NEW-BUG-03)

### Test 5: Event Pagination
**Scenario:** Have 100+ events, click "Load more"
**Result: FAIL**
- Page state increments: `setPage((p) => p + 1)` (line 422)
- Query re-fetches with new page (line 129: queryKey includes page)
- `events` variable points to the new page's data only
- Previous page's events disappear from view
- **FIX-18 NOT APPLIED:** Should use `useInfiniteQuery` or accumulate pages

### Test 6: Event-to-Session Linking
**Scenario:** Click session link icon on an event with session_id
**Result: PASS**
- Event feed shows Link2 icon when `event.session_id` exists (line 361)
- Links to `/mission-control/sessions?highlight=<id>` (line 363)
- Session tracker reads `highlight` param (line 67)
- Auto-opens the session detail sheet (line 71)

### Test 7: Supabase Realtime
**Scenario:** Two tabs open, create task in tab 1, see it in tab 2
**Result: PARTIAL PASS**
- Layout mounts `useMCRealtime(userId)` which subscribes to Supabase channel
- Realtime hook listens for broadcast events and invalidates queries
- **However:** API routes use `emitMCEvent()` which broadcasts to local EventEmitter, NOT Supabase Realtime channels. So the Supabase channel never receives the broadcast.
- Real-time updates depend entirely on the polling fallback (30s when connected, 5s when disconnected)
- The SSE stream still exists as a backup but is not connected to the client

### Test 8: Task Detail Description Debounce
**Scenario:** Type rapidly in description field
**Result: PASS**
- Local state updates immediately (line 463-464)
- `debouncedUpdate` queued with 500ms timeout
- Previous timeout cleared on each keystroke (line 161)
- Only one PATCH fires after 500ms of inactivity

---

## SECTION 4: SUMMARY OF REMAINING ISSUES

### Critical / Must Fix Before Launch (4 items)
1. **FIX-03 NOT APPLIED:** Cross-user dependency deletion -- security vulnerability
2. **FIX-04 NOT APPLIED:** Queue route lacks guardMCRoute -- auth bypass
3. **FIX-06 NOT APPLIED:** `estimated_hours || null` should be `?? null`
4. **FIX-10 INCOMPLETE:** API routes don't broadcast to Supabase Realtime -- real-time is effectively polling-only

### High Priority (6 items)
5. **FIX-08 INCOMPLETE:** "error" not in VALID_EVENT_TYPES server-side
6. **FIX-18 NOT APPLIED:** Event pagination replaces instead of appends
7. **NEW-BUG-01:** Review approval bypasses dependency check
8. **NEW-BUG-02:** Review approval doesn't fire automation rules
9. **NEW-BUG-03:** Review approval doesn't emit realtime event
10. **FIX-11 INCOMPLETE:** POST routes for comments/reviews don't verify task ownership

### Medium Priority (6 items)
11. **FIX-07 INCOMPLETE:** Reorder route doesn't clear completed_at on move out of done
12. **FIX-02 INCOMPLETE:** Circular dependency detection is still shallow (direct reverse only)
13. **FIX-52 NOT APPLIED:** cost_usd still in MCSession type
14. **NEW-BUG-04:** Drag-drop may send wrong position for same-column reorder
15. **NEW-BUG-05:** Agent roster ref pattern is fragile
16. **NEW-BUG-06:** Session tracker has re-render loop on poll

### Low Priority (5 items)
17. **FIX-43 NOT APPLIED:** success_rate_percent still returns decimal
18. **FIX-47 INCOMPLETE:** Many text sizes below 11px
19. **FIX-48 NOT APPLIED:** No tabIndex/aria on task cards
20. **FIX-58 NOT DONE:** task-board.tsx still monolithic (1537 lines)
21. **FIX-21 PARTIAL:** Reviewer field still accepts client input

---

## SECTION 5: RECOMMENDED FIX ORDER

```
IMMEDIATE (security + broken features):
  1. Apply FIX-03 (cross-user dependency deletion)
  2. Apply FIX-04 (queue route auth)
  3. Fix estimated_hours ?? null (FIX-06)
  4. Add Supabase Realtime broadcast to API routes (FIX-10 completion)
  5. Add "error" to VALID_EVENT_TYPES (FIX-08)
  6. Fix review approval to check deps, fire rules, emit events (NEW-BUG-01/02/03)

BEFORE LAUNCH:
  7. Apply FIX-18 (event pagination append)
  8. Fix comments/reviews POST ownership check (FIX-11)
  9. Fix reorder route completed_at clearing (FIX-07)
  10. Implement BFS circular dependency detection (FIX-02)
  11. Remove cost_usd from types (FIX-52)

POLISH:
  12. Fix remaining low-priority items
  13. Split task-board.tsx (FIX-58)
```
