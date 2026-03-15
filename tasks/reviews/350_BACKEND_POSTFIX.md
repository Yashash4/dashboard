# 350 Backend Post-Fix Review -- Mission Control API Routes

**Reviewer role:** Backend Developer
**Date:** 2026-03-16
**Scope:** All MC API routes after the 58-fix round, verifying 16 specific fixes

---

## Files Reviewed

### Core Libraries
| File | Path |
|------|------|
| mc-automation.ts | `dashboard/src/lib/mc-automation.ts` |
| mc-route-guard.ts | `dashboard/src/lib/mc-route-guard.ts` |
| vps-data-api.ts | `dashboard/src/lib/vps-data-api.ts` |

### API Routes (30 files)
| Route | Methods |
|-------|---------|
| tasks/route.ts | GET, POST |
| tasks/[id]/route.ts | GET, PATCH, DELETE |
| tasks/reorder/route.ts | PATCH |
| tasks/bulk-update/route.ts | POST |
| tasks/bulk-action/route.ts | POST |
| tasks/queue/route.ts | GET |
| tasks/[id]/comments/route.ts | GET, POST |
| tasks/[id]/reviews/route.ts | GET, POST |
| tasks/[id]/dependencies/route.ts | GET, POST, DELETE |
| tasks/[id]/activities/route.ts | GET |
| automation-rules/route.ts | GET, POST |
| automation-rules/[id]/route.ts | PATCH, DELETE |
| templates/route.ts | GET, POST |
| templates/[id]/route.ts | PATCH, DELETE |
| statuses/route.ts | GET, POST |
| statuses/[id]/route.ts | PATCH, DELETE |
| agents/status/route.ts | GET |
| agents/heartbeat/route.ts | POST |
| agents/[id]/start/route.ts | POST |
| agents/[id]/stop/route.ts | POST |
| agents/[id]/restart/route.ts | POST |
| events/route.ts | GET, POST |
| sessions/route.ts | GET, POST |
| sessions/[id]/route.ts | PATCH |
| metrics/route.ts | GET |
| workload/route.ts | GET |
| time-tracking/route.ts | GET |
| stream/route.ts | GET (SSE) |

---

## Fix Verification Results

### FIX-01: mc-automation.ts exists with processAutomationRules() -- PASS

**Status: VERIFIED**

- `mc-automation.ts` exists at `dashboard/src/lib/mc-automation.ts` (131 lines).
- Exports `processAutomationRules(userId, triggerType, triggerValue, context)`.
- Called from **task PATCH** (lines 165-174) on column and priority changes.
- Called from **heartbeat** (lines 96-99) when agent goes offline or blocked.
- Both call sites use `.catch(() => {})` for non-blocking execution.
- Activity logging inside `mc-automation.ts` goes to VPS via `vpsDataFetch` (line 44), not Supabase.
- Supported action types: `assign_agent`, `move_to_column`, `create_task`, `send_notification` (placeholder).
- `move_to_column` correctly handles `completed_at` (sets on done, clears otherwise).

### FIX-02: Dependency enforcement in task PATCH + BFS cycle detection -- PARTIAL PASS

**Status: PARTIALLY VERIFIED -- downgrade from BFS to direct-only check**

- **Task PATCH dependency enforcement** (lines 103-124): When moving to `in_progress`, `testing`, or `review`, the route queries `mc_task_dependencies` for the task, then checks if any dependency tasks are not in `done`. Returns 409 with `blocked_by` list if any are unfinished. This is correct.
- **Auto-unblock dependents** (lines 177-203): When a task moves to `done`, the route checks all tasks that depend on it. If all their dependencies are now done, it emits an `unblocked` SSE event. Correct.
- **Cycle detection in dependencies POST** (lines 59-68): Only checks **direct reverse** (A depends on B, then B cannot depend on A). This is NOT a full BFS traversal. A cycle like A -> B -> C -> A would slip through. The comment says "Simple circular dependency check" which is an acknowledged limitation.

**Finding:** Cycle detection is shallow (depth 1 only). A true BFS/DFS cycle check was expected per FIX-02 spec. Risk: transitive circular dependencies can be created, which would then permanently block tasks from moving forward.

### FIX-03: Dependency DELETE checks user ownership -- FAIL

**Status: NOT VERIFIED**

Looking at `dependencies/route.ts` DELETE handler (lines 84-105):

```typescript
const { error } = await supabase
  .from("mc_task_dependencies")
  .delete()
  .eq("id", dependency_id);
```

The delete query filters only by `dependency_id` -- it does **not** filter by `user_id` or verify that the parent task belongs to the authenticated user. While the `guardMCRoute` call ensures the user is authenticated, any authenticated Ultra user could delete any other user's dependency if they know the UUID.

**Finding:** Missing `.eq("user_id", user.id)` or a join-based ownership check on the dependency delete. The GET and POST handlers properly verify task ownership, but DELETE does not.

### FIX-04: Queue route uses guardMCRoute() -- FAIL

**Status: NOT VERIFIED**

The queue route (`tasks/queue/route.ts`) uses a manual `getUser()` helper (lines 4-10) instead of `guardMCRoute()`:

```typescript
async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
```

This means the queue route is missing:
- Ultra plan check (any authenticated user could access it)
- Rate limiting
- Body size checks

Every other MC route uses `guardMCRoute()`. This is the sole exception.

### FIX-06: estimated_hours uses ?? not || -- FAIL

**Status: NOT VERIFIED**

In `tasks/route.ts` POST handler (line 105):

```typescript
estimated_hours: estimated_hours || null,
```

This uses `||` which coerces `0` to `null`. A task with `estimated_hours: 0` would be stored as `null`. Should be `estimated_hours ?? null` to preserve explicit zero values.

Note: The heartbeat route correctly uses `??` for `capacity_used` (line 65): `capacity_used: capacity_used ?? 0`. So the pattern is known but inconsistently applied.

### FIX-07: Reorder clears completed_at when moving out of done -- FAIL

**Status: PARTIALLY VERIFIED**

- **bulk-update/route.ts** (line 34): Correctly clears `completed_at` when moving out of done:
  ```typescript
  ...(u.column_id === "done" ? { completed_at: now } : { completed_at: null }),
  ```
- **reorder/route.ts** (line 45): Does NOT clear `completed_at` when moving out of done:
  ```typescript
  ...(u.column_id === "done" ? { completed_at: now } : {}),
  ```
  Moving a task from `done` to `planning` via reorder would leave `completed_at` set, making the task appear completed when it is not.

**Finding:** `reorder/route.ts` only sets `completed_at` on done but never clears it. The `bulk-update` route does it correctly. Inconsistency.

### FIX-08: "error" in VALID_EVENT_TYPES -- FAIL

**Status: NOT VERIFIED**

In `events/route.ts` (lines 7-14):

```typescript
const VALID_EVENT_TYPES = [
  "webhook",
  "tool_invocation",
  "task_complete",
  "agent_state_change",
  "session_start",
  "session_end",
] as const;
```

`"error"` is not in this list. Agents cannot report error events through the events POST endpoint. While `"error"` is in `VALID_SEVERITIES`, it is missing from event types. If the fix was to add "error" as an event type, it was not done.

### FIX-09: Review approval auto-moves to Done -- PASS

**Status: VERIFIED**

In `reviews/route.ts` POST handler (lines 114-130):

```typescript
if (status === "approved") {
  const now = new Date().toISOString();
  await supabase
    .from("mc_tasks")
    .update({ column_id: "done", completed_at: now, updated_at: now })
    .eq("id", taskId)
    .eq("user_id", user.id);
```

Correctly sets `column_id`, `completed_at`, and `updated_at`. Also logs the activity to VPS. The `.eq("user_id", user.id)` ensures ownership scoping.

### FIX-11: Comments/reviews POST verify task ownership -- PARTIAL PASS

**Status: PARTIALLY VERIFIED**

- **Comments GET** (lines 17-27): Verifies task ownership before returning comments. Correct.
- **Comments POST** (lines 46-99): Does NOT verify that the task belongs to the user before inserting. The `user_id` is set on the comment row itself, but there is no check that `taskId` belongs to `user.id`. An authenticated user could post comments on any task if they know its UUID.
- **Reviews GET** (lines 18-29): Verifies task ownership. Correct.
- **Reviews POST** (lines 46-138): Does NOT verify task ownership before inserting. Same issue as comments.

**Finding:** Both comments and reviews POST handlers skip the task-ownership verification that their GET counterparts perform. The insert sets `user_id` on the comment/review row, but the `task_id` is not verified to belong to the authenticated user.

### FIX-12: column_id/priority validated against enums -- FAIL

**Status: NOT VERIFIED**

In `tasks/[id]/route.ts` PATCH handler, the `column_id` and `priority` fields from the request body are passed through to the update without validation against known enums. The allowed fields whitelist (lines 56-72) only controls which keys are permitted, not their values.

Similarly in `tasks/route.ts` POST (lines 63-64), `column_id` and `priority` default to valid values but accept arbitrary strings from the client.

The `bulk-action` route also does not validate that `value` is a valid column when `action === "move"` or a valid priority when `action === "priority"`.

The only place enum validation exists is in `events/route.ts` (event types + severities) and `agents/heartbeat/route.ts` (agent statuses).

### FIX-13: String length validation on all text fields -- FAIL

**Status: NOT VERIFIED**

The only string length check found is in `events/route.ts` (line 92-94):
```typescript
if (message.length > 5000) {
  return NextResponse.json({ error: "Message too long (max 5000 chars)" }, { status: 400 });
}
```

No other route validates string lengths. The following fields accept unbounded strings:
- Task `title`, `description`, `acceptance_criteria`, `outcome`, `error_message`, `resolution`
- Comment `content`
- Review `notes`
- Automation rule `name`, `trigger_value`, `action_value`
- Template `name`, `description`
- Status `name`
- Session `error_message`

### FIX-14: Body size check (not just Content-Length) -- FAIL

**Status: NOT VERIFIED**

In `mc-route-guard.ts` (lines 70-78), the body size check only looks at the `Content-Length` header:

```typescript
if (options.maxBodySize) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > options.maxBodySize) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
}
```

Problems:
1. If `Content-Length` is missing (chunked transfer encoding), the check is skipped entirely.
2. The actual body is never measured. A client can set `Content-Length: 100` and send 10MB.
3. The fix was supposed to read and measure the actual body bytes, not rely on the header.

### FIX-20: VPS token in .env not systemd cleartext -- PASS (by design)

**Status: VERIFIED**

In `vps-data-api.ts`, the VPS token is fetched from the `vps_instances` database table (`data_api_token` column), not from environment variables or systemd unit files. The token is cached in-memory for 5 minutes with TTL-based eviction. The `Authorization: Bearer ${vps.token}` header is constructed at request time from the DB-fetched value.

No hardcoded tokens or `.env` references for VPS tokens exist in the codebase.

### FIX-21: Reviewer field uses auth user, not request body -- FAIL

**Status: NOT VERIFIED**

In `reviews/route.ts` POST (lines 58, 92):

```typescript
const { reviewer, status, notes } = body as { reviewer?: string; ... };
// ...
reviewer: reviewer || profile?.name || user.email || "reviewer",
```

The `reviewer` field from the request body takes **priority** over the authenticated user's profile name. A client can set `reviewer: "Admin"` or any arbitrary string to impersonate another user. The fix should have been:

```typescript
reviewer: profile?.name || user.email || "reviewer",
```

Ignoring `body.reviewer` entirely.

### FIX-22: Reorder items validated (UUID format, valid column, positive position) -- FAIL

**Status: NOT VERIFIED**

In `tasks/reorder/route.ts`, the `updates` array items are not validated:
- No UUID format check on `u.id`
- No validation that `u.column_id` is a valid column
- No check that `u.position` is a non-negative integer
- Items with `position: -1` or `column_id: "foobar"` would pass through to Supabase

The only validation is that `updates` is a non-empty array with max 100 items.

### FIX-16 (Activities via vpsDataFetch): Activities written via vpsDataFetch not Supabase -- PASS

**Status: VERIFIED**

- `mc-automation.ts` (line 44): Activities go through `vpsDataFetch(userId, "/api/activities", ...)`.
- `reviews/route.ts` (lines 102-111, 122-129): Activity logging via `vpsDataFetch`.
- `activities/route.ts` GET: Reads from VPS first (`hasVPSDataAPI` check), falls back to Supabase.
- No route writes activities directly to Supabase's `mc_activities` table.

---

## Summary Scorecard

| Fix | Description | Status |
|-----|-------------|--------|
| FIX-01 | mc-automation.ts + processAutomationRules | **PASS** |
| FIX-02 | Dependency enforcement + BFS cycle detection | **PARTIAL** -- shallow cycle check only |
| FIX-03 | Dependency DELETE ownership check | **FAIL** -- no user_id filter on delete |
| FIX-04 | Queue route uses guardMCRoute | **FAIL** -- uses manual getUser() |
| FIX-06 | estimated_hours uses ?? | **FAIL** -- still uses \|\| |
| FIX-07 | Reorder clears completed_at | **FAIL** -- reorder does not, bulk-update does |
| FIX-08 | "error" in VALID_EVENT_TYPES | **FAIL** -- missing from list |
| FIX-09 | Review approval auto-moves to Done | **PASS** |
| FIX-11 | Comments/reviews POST verify task ownership | **PARTIAL** -- GET verifies, POST does not |
| FIX-12 | column_id/priority enum validation | **FAIL** -- no enum checks |
| FIX-13 | String length validation | **FAIL** -- only events route has it |
| FIX-14 | Body size check on actual body | **FAIL** -- header only, easily spoofed |
| FIX-20 | VPS token from DB not cleartext | **PASS** |
| FIX-21 | Reviewer from auth user not body | **FAIL** -- body.reviewer takes priority |
| FIX-22 | Reorder item validation | **FAIL** -- no UUID/column/position checks |
| FIX-16 | Activities via vpsDataFetch | **PASS** |

**Result: 4 PASS, 2 PARTIAL, 10 FAIL**

---

## Additional Findings (Not Part of Fix Verification)

### Finding A: Queue route logs wrong event_type
In `tasks/queue/route.ts` (line 114), when a task is claimed from the queue, the event is logged as `event_type: "task_complete"` which is semantically wrong -- the task was just assigned, not completed.

### Finding B: bulk-action "move" does not set completed_at
In `tasks/bulk-action/route.ts` (line 32), when moving tasks via bulk action with `action === "move"` and `value === "done"`, the update only sets `column_id` and `updated_at` but does not set `completed_at`. Moving out of done also does not clear `completed_at`.

### Finding C: Stream route does not use guardMCRoute
The SSE `stream/route.ts` manually implements auth, plan check, and rate limiting instead of using `guardMCRoute`. While functionally equivalent, this is duplicate logic that could drift from the guard.

### Finding D: No pagination cap on activities fallback
In `activities/route.ts`, the Supabase fallback path caps `limit` at 100 but the VPS path passes the limit directly to the VPS API without a cap.

### Finding E: Automation rule run_count race condition
In `mc-automation.ts` (lines 37-40), the run count increment reads `rule.run_count` from the earlier SELECT then writes `run_count + 1`. If two rules fire concurrently for the same rule, both read the same count and one increment is lost. Should use a Supabase RPC or `.rpc("increment_run_count", ...)`.

---

## Priority Fixes Required

### P0 (Security)
1. **FIX-03**: Add user ownership check to dependency DELETE
2. **FIX-04**: Replace `getUser()` with `guardMCRoute()` in queue route
3. **FIX-11**: Add task ownership verification in comments/reviews POST
4. **FIX-21**: Remove `body.reviewer` override, use only auth user's name

### P1 (Data Integrity)
5. **FIX-06**: Change `estimated_hours || null` to `estimated_hours ?? null`
6. **FIX-07**: Add `completed_at: null` to reorder when column is not done
7. **FIX-12**: Add enum validation for column_id and priority in task PATCH/POST
8. **FIX-22**: Validate UUID format, column enum, and position >= 0 in reorder
9. **Finding B**: Set `completed_at` in bulk-action move

### P2 (Defense in Depth)
10. **FIX-08**: Add "error" to VALID_EVENT_TYPES
11. **FIX-13**: Add string length limits to all text input fields
12. **FIX-14**: Read actual body bytes for size check, not just Content-Length header
13. **FIX-02**: Implement full BFS/DFS cycle detection for transitive dependencies
14. **Finding A**: Fix queue event_type from "task_complete" to "task_assigned"
