# Agent 06 — Pro Tier — QA Tester Review

**Total Issues Found: 18**
- CRITICAL: 3
- HIGH: 5
- MEDIUM: 7
- LOW: 3

---

## Rate Limiting

### [QA-01] — In-memory rate limiter never records hits, allowing unlimited requests
**File:** `src/lib/rate-limit.ts:74-82`
**Description:** The `rateLimit()` function reads timestamps from the `store` Map to count hits in the window, but it **never pushes a new timestamp** into the store when a request passes. The function calls `getRateLimitStatus()` which only reads, and then returns `{ success: true }` without side effects. Since no timestamp is ever written, `validTimestamps` will always be empty, `remaining` will always equal `limit`, and `success` will always be `true`. Every route that uses the synchronous `rateLimit()` function (which is all of them — v1-auth.ts:121, mc-route-guard.ts:59, keys/route.ts:31, analytics routes, logs/alerts) has **zero rate limiting**.
**Severity:** CRITICAL
**Steps to Reproduce:** Send 1000 requests per second to any rate-limited endpoint (e.g., `POST /api/keys`, `GET /api/analytics/funnels`). All requests will succeed because the in-memory store never records any hits.
**Expected vs Actual:**
- Expected: After N requests in a window, further requests are rejected with 429.
- Actual: All requests pass through because `store` is never written to.

---

## V1 API Authentication

### [QA-02] — API key format validation rejects valid hex-only keys
**File:** `src/lib/v1-auth.ts:59`
**Description:** The key format check requires `rawKey.length !== 36`, but the key generation in `src/app/api/keys/route.ts:151` produces `clw_` + 32 hex chars from `crypto.randomBytes(16).toString("hex")`. That is 4 + 32 = 36 characters, which matches. However, the comment on line 153 says "first 8 hex chars", and the hex output of `randomBytes(16)` is always exactly 32 hex characters. This validation is currently correct but fragile — if the key generation format ever changes to use `randomUUID()` (which has hyphens and would be longer), the auth check would break silently. This is informational, not a current bug.
**Severity:** LOW
**Steps to Reproduce:** N/A — informational.
**Expected vs Actual:** Currently matches. Noted for future reference.

### [QA-03] — revoked_api_key error returns 401 instead of 403
**File:** `src/lib/api-errors.ts:58`
**Description:** When a valid but revoked API key is used, `apiError("revoked_api_key", ...)` returns HTTP 401. However, 401 means "unauthenticated" (identity unknown), while a revoked key is "authenticated but no longer authorized." The correct status code should be 403 Forbidden. The docs page at `src/app/docs/pro/api/page.tsx:217` also states revoked keys return `401 Unauthorized`, compounding the misleading status code.
**Severity:** LOW
**Steps to Reproduce:** Use a revoked API key to call any V1 endpoint. Response will be 401 instead of 403.
**Expected vs Actual:**
- Expected: 403 Forbidden with a clear "key has been revoked" message.
- Actual: 401 Unauthorized, making clients think the key format or value is wrong rather than that it was revoked.

---

## V1 Chat Batch

### [QA-04] — Batch POST blocks until all requests complete, returning stale "processing" status
**File:** `src/app/api/v1/chat/batch/route.ts:90-99`
**Description:** The `processBatch()` function is `await`ed on line 90, meaning the HTTP response on line 92 is only sent **after** all batch items have been processed (up to 50 items x 60s timeout = potentially 1000+ seconds). Despite this, the response on line 96 returns `status: "processing"` and `completed: 0`, which is a lie — by the time the client receives the response, the batch is already fully completed or failed. The `maxDuration` is set to 300 seconds (line 12), but 50 items processed 3-at-a-time with 60s timeouts could exceed this.
**Severity:** HIGH
**Steps to Reproduce:** Submit a batch of 50 messages. The HTTP response will hang for minutes until all messages are processed, then return `status: "processing"` with `completed: 0`.
**Expected vs Actual:**
- Expected: The response returns immediately with the batch ID, and processing happens asynchronously. Client polls `GET /api/v1/chat/batch/:id` for status.
- Actual: Response blocks for the full processing duration, then returns misleading status.

### [QA-05] — Batch processing does not update status to "failed" when dashboardUrl is missing
**File:** `src/app/api/v1/chat/batch/route.ts:123`
**Description:** When the VPS has no dashboard URL configured, the function simply `return`s without updating the batch status. The batch remains in `"processing"` status forever.
**Severity:** MEDIUM
**Steps to Reproduce:** Trigger a batch when the user's VPS has no `openclaw_dashboard_url` or `hostname`.
**Expected vs Actual:**
- Expected: Batch status updated to "failed" with an error message.
- Actual: Batch stuck in "processing" permanently.

---

## Mission Control

### [QA-06] — Task priority enum mismatch: "urgent" vs "critical"
**File:** `src/app/api/mission-control/tasks/route.ts:8` and `src/types/mission-control.ts:30`
**Description:** The task creation route on line 8 defines `VALID_PRIORITIES = ["low", "medium", "high", "urgent"]`, but the TypeScript type `MCTask.priority` in `src/types/mission-control.ts:30` defines it as `"low" | "medium" | "high" | "critical"`. The queue route at `src/app/api/mission-control/tasks/queue/route.ts:6` uses `PRIORITY_ORDER = ["critical", "high", "medium", "low"]`. This means:
1. A task created via the API with priority `"critical"` will be rejected (not in VALID_PRIORITIES).
2. A task created with `"urgent"` will not be correctly sorted by the queue (not in PRIORITY_ORDER).
3. The TypeScript type says `"critical"` but the API only accepts `"urgent"`.
**Severity:** HIGH
**Steps to Reproduce:** POST to `/api/mission-control/tasks` with `priority: "critical"` — it will be rejected as invalid. Then create one with `priority: "urgent"` and try the queue endpoint — it won't sort correctly since `PRIORITY_ORDER.indexOf("urgent")` returns -1.
**Expected vs Actual:**
- Expected: Consistent priority values across types, creation, and sorting.
- Actual: Three different priority enums that don't agree.

### [QA-07] — Bulk action "move" does not validate column_id value
**File:** `src/app/api/mission-control/tasks/bulk-action/route.ts:31`
**Description:** When `action === "move"`, the `value` parameter is used directly as a `column_id` without validation against the valid columns list. An attacker could set `value` to any string, which would write an invalid `column_id` to the database, potentially breaking the Kanban board.
**Severity:** MEDIUM
**Steps to Reproduce:** POST to `/api/mission-control/tasks/bulk-action` with `{ task_ids: ["..."], action: "move", value: "nonexistent_column" }`.
**Expected vs Actual:**
- Expected: 400 error for invalid column.
- Actual: Tasks updated with garbage column_id.

### [QA-08] — Bulk action "priority" does not validate priority value
**File:** `src/app/api/mission-control/tasks/bulk-action/route.ts:44`
**Description:** Same issue as QA-07 but for the `"priority"` action. No validation that `value` is one of the valid priority values.
**Severity:** MEDIUM
**Steps to Reproduce:** POST to `/api/mission-control/tasks/bulk-action` with `{ task_ids: ["..."], action: "priority", value: "super_mega_urgent" }`.
**Expected vs Actual:**
- Expected: 400 error for invalid priority.
- Actual: Tasks updated with invalid priority string.

### [QA-09] — Bulk action "delete" uses hard DELETE instead of soft delete
**File:** `src/app/api/mission-control/tasks/bulk-action/route.ts:29`
**Description:** The tasks GET route at line 29 of `tasks/route.ts` filters by `.is("deleted_at", null)`, indicating the system uses soft deletes. However, the bulk `"delete"` action uses `.delete()` which performs a hard SQL DELETE, permanently removing the rows. This is inconsistent with the soft-delete pattern and makes deleted tasks unrecoverable.
**Severity:** MEDIUM
**Steps to Reproduce:** Bulk delete tasks, then try to query them — they are permanently gone instead of soft-deleted.
**Expected vs Actual:**
- Expected: `update({ deleted_at: now })` to match the soft-delete pattern.
- Actual: Hard DELETE permanently removes task rows.

### [QA-10] — Bulk action JSON parse can throw unhandled error
**File:** `src/app/api/mission-control/tasks/bulk-action/route.ts:10`
**Description:** The `request.json()` call on line 10 is not wrapped in a try-catch. If the request body is not valid JSON, this will throw an unhandled exception that will bubble up as a 500 Internal Server Error without a helpful message. Other routes like `tasks/route.ts:65-75` properly handle this with try-catch and a "Invalid JSON body" response.
**Severity:** MEDIUM
**Steps to Reproduce:** POST to `/api/mission-control/tasks/bulk-action` with a non-JSON body like `"this is not json"`.
**Expected vs Actual:**
- Expected: 400 "Invalid JSON body".
- Actual: 500 Internal Server Error.

### [QA-11] — Automation rules POST allows trigger_type/action_type validation to pass null
**File:** `src/app/api/mission-control/automation-rules/route.ts:35-43`
**Description:** The validation on lines 35-39 only checks `if (trigger_type && ...)`, meaning if `trigger_type` is `null` or `undefined`, the validation is skipped. Then on line 42, the check `if (!name || !trigger_type || !action_type)` will catch missing values. However, the order creates a logic gap: if `trigger_type` is an empty string `""`, it passes the falsy check on line 35 (skipped), then passes the truthiness check on line 42 (empty string is falsy, so it returns error). This is fine for empty strings but the real issue is the validation is unnecessarily confusing — the existence check on line 42 should come first.
**Severity:** LOW
**Steps to Reproduce:** N/A — minor code quality issue, not a user-facing bug.
**Expected vs Actual:** Validation works but is confusingly ordered.

---

## API Key Management

### [QA-12] — POST /api/keys does not handle invalid JSON body
**File:** `src/app/api/keys/route.ts:125`
**Description:** The `request.json()` call is not wrapped in a try-catch. If the request body is not valid JSON, this will throw an unhandled exception resulting in a 500 error. Other routes in the codebase use `.catch(() => null)` to handle this gracefully.
**Severity:** MEDIUM
**Steps to Reproduce:** POST to `/api/keys` with an invalid JSON body.
**Expected vs Actual:**
- Expected: 400 "Invalid JSON body".
- Actual: 500 Internal Server Error.

---

## Analytics Routes

### [QA-13] — Funnels route does not validate negative "days" param
**File:** `src/app/api/analytics/funnels/route.ts:22`
**Description:** The `days` parameter is parsed with `Math.min(90, parseInt(...))` but does not have a `Math.max(1, ...)` lower bound. If a user passes `?days=-100`, the calculation `Date.now() - days * 24 * 60 * 60 * 1000` would result in a date **in the future**, causing the query to return zero results silently. The `/api/v1/usage/route.ts:13` correctly uses `Math.min(90, Math.max(1, ...))`.
**Severity:** MEDIUM
**Steps to Reproduce:** GET `/api/analytics/funnels?days=-30`. Returns empty funnel data.
**Expected vs Actual:**
- Expected: Clamp to minimum of 1 day, or return 400 for invalid value.
- Actual: Silently computes a future date and returns empty results.

---

## Documentation Accuracy

### [QA-14] — SSE stream format in docs does not match actual API response format
**File:** `src/app/docs/pro/api/page.tsx:134-137`
**Description:** The docs show the SSE stream format as `{"chunk": "...", "done": false}` with `usage` in the final chunk. But the actual streaming implementation at `src/app/api/v1/chat/route.ts:283-284` sends `{"content": "..."}` (not `"chunk"`), and the `[DONE]` signal is sent as a raw `data: [DONE]` line, not as a JSON object with `"done": true`. There is no `usage` field in the stream. Code examples at lines 156 and 175 reference `data.reply` but the actual non-streaming response uses `data.response`.
**Severity:** HIGH
**Steps to Reproduce:** Follow the docs to parse SSE — look for `data.chunk` and `data.done`. Neither field exists in the actual response.
**Expected vs Actual:**
- Expected: Docs match the actual response format: `{"content": "..."}` for stream events, `{"response": "..."}` for non-streaming.
- Actual: Docs say `chunk`/`done`/`reply` but actual API uses `content`/`[DONE]`/`response`.

### [QA-15] — Docs reference "32 random alphanumeric characters" but keys are hex
**File:** `src/app/docs/pro/api/page.tsx:27-28`
**Description:** The docs describe keys as "32 random alphanumeric characters" but the actual generation at `src/app/api/keys/route.ts:151` uses `crypto.randomBytes(16).toString("hex")`, which produces only hex characters (0-9, a-f). The example key `clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` contains characters like `g`, `i`, `j`, `k`, etc. that are not valid hex. This could confuse users who try to validate keys locally.
**Severity:** LOW
**Steps to Reproduce:** Generate an API key and observe it only contains hex characters, not the full alphanumeric range shown in docs.
**Expected vs Actual:**
- Expected: Docs accurately describe hex characters (0-9, a-f).
- Actual: Docs claim alphanumeric, example shows non-hex characters.

---

## Plan/Tier Gating

### [QA-16] — Enterprise plan missing from PLAN_PRICES, blocking enterprise subscription payments
**File:** `src/lib/payments/plans.ts:93-97`
**Description:** The `PLAN_PRICES` lookup table includes `starter`, `pro`, and `ultra` but omits `enterprise`. In `src/app/pricing/page.tsx:65`, `PLAN_PRICES[planName]` returns `undefined` for "enterprise", causing `handleSubscribe` to return early on line 66 without any user feedback. The "Contact Us" flag exists on the plan definition but nothing in the subscribe handler checks for it or shows a contact form — it just silently fails.
**Severity:** HIGH
**Steps to Reproduce:** On the pricing page, if the Enterprise plan renders a subscribe button (which it does if `contactUs` isn't checked in the template), clicking it does nothing.
**Expected vs Actual:**
- Expected: Enterprise card either shows "Contact Us" button that opens a form/link, or the subscribe handler shows a message.
- Actual: Button click does nothing — no feedback, no error, no redirect.

### [QA-17] — Predictions route creates records but has no background processor
**File:** `src/app/api/v1/predictions/route.ts:23-30`
**Description:** The `POST /api/v1/predictions` endpoint creates a prediction record with `status: "pending"` and stores `input_body`, but there is no background processing logic to actually execute the prediction. Unlike the batch endpoint which calls `processBatch()`, the predictions endpoint just inserts a DB row and returns. The `GET /api/v1/predictions/:id` endpoint lets users poll for status, but the status will remain `"pending"` forever because nothing processes it.
**Severity:** HIGH
**Steps to Reproduce:** Create a prediction via `POST /api/v1/predictions`. Poll `GET /api/v1/predictions/:id` — status will always be "pending", never "completed".
**Expected vs Actual:**
- Expected: Prediction is processed asynchronously and status transitions to "completed" or "failed".
- Actual: Prediction stuck in "pending" forever — no processing pipeline exists.

---

## Thread Messages

### [QA-18] — Thread POST message includes own message in history, sending duplicate to model
**File:** `src/app/api/v1/threads/[id]/messages/route.ts:86-101`
**Description:** The user message is inserted into `api_thread_messages` on line 88-93, and then on lines 96-101, the last 20 messages are fetched from the same table ordered by `created_at DESC`. Since the user message was just inserted, it will be included in the `history` array. This history is then sent to the OpenClaw model as the full `messages` array (line 130-133). The result is the user's message appears twice in the request to the model: once in the history array (from the DB fetch) and once as the latest message (already part of history since it was inserted before the fetch). This wastes tokens and can confuse the model.
**Severity:** MEDIUM
**Steps to Reproduce:** Send a message in a thread. The model receives the message twice — once from the conversation history and once as the latest entry (which is already in the history since it was just inserted).
**Expected vs Actual:**
- Expected: History fetched before inserting the user message, or the latest user message excluded from history.
- Actual: User message duplicated in the model's input.
