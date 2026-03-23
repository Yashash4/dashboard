# Agent 33 — V1 API — Frontend Developer Review
**Total Issues Found: 18**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 7 / LOW: 3

---

### [FE-01] — Docs show wrong response field name for chat endpoint
**File:** `src/app/docs/pro/api/page.tsx:156`
**Severity:** CRITICAL
**Description:** The JavaScript code example reads `data.reply` and the Python example reads `data["reply"]`, but the actual chat endpoint at `src/app/api/v1/chat/route.ts:398` returns `{ response: assistantContent, agent: agentSlug, request_id: ctx.requestId }`. The field is `response`, not `reply`.
**Impact:** Every developer following the docs will get `undefined` when trying to read the response. This is the first thing any new API consumer will hit.
**Suggestion:** Change `data.reply` to `data.response` and `data["reply"]` to `data["response"]` in all code examples.

---

### [FE-02] — Docs show wrong SSE streaming format
**File:** `src/app/docs/pro/api/page.tsx:134-137`
**Severity:** CRITICAL
**Description:** The docs describe the streaming format as `{"chunk": "...", "done": false}` with a `done` field and `usage` object. The actual streaming implementation at `src/app/api/v1/chat/route.ts:283-285` emits `{"content": "..."}` for data chunks and `data: [DONE]` as a termination signal. There is no `chunk` field, no `done` boolean, and no `usage` object.
**Impact:** Any SDK or client-side streaming parser built from the docs will completely fail to parse actual SSE events. Developers will waste significant debugging time.
**Suggestion:** Update docs to show the actual format: `data: {"content": "Webhooks are "}` with `data: [DONE]` termination.

---

### [FE-03] — Docs show wrong error response format
**File:** `src/app/docs/pro/api/page.tsx:226-229`
**Severity:** CRITICAL
**Description:** The docs show error responses as `{ "error": "Rate limit exceeded...", "code": "RATE_LIMITED" }` (flat structure with uppercase code). The actual error format from `src/lib/api-errors.ts:122-129` is `{ "error": { "code": "rate_limited", "message": "...", "type": "api_error", "request_id": "req_..." } }` (nested object with lowercase snake_case code).
**Impact:** Any error handling code built from docs will fail. `error.code` would be undefined since `error` is an object, not a string. The uppercase `RATE_LIMITED` vs lowercase `rate_limited` mismatch would break switch statements even if the nesting were correct.
**Suggestion:** Update docs to show the actual nested error structure with correct field names and casing.

---

### [FE-04] — Chat endpoint does not use apiSuccess helper, returns flat response
**File:** `src/app/api/v1/chat/route.ts:397-408`
**Severity:** HIGH
**Description:** The main chat POST endpoint manually constructs its response with `NextResponse.json(successBody, ...)` instead of using `apiSuccess()`. Every other endpoint wraps data inside a consistent structure via `apiSuccess()`. The chat endpoint returns `{ response, agent, request_id }` at the top level. This means the chat endpoint has a structurally different success response than all other endpoints.
**Impact:** SDK developers cannot write a single response parser. Chat responses have `request_id` in the body while other endpoints only surface it in headers. Inconsistency forces special-casing in client libraries.
**Suggestion:** Use `apiSuccess({ response: assistantContent, agent: agentSlug }, ctx, rateLimitInfo)` and remove the manual `request_id` from the body (it's already in the `X-Request-Id` header).

---

### [FE-05] — "Not found" errors use inconsistent error codes across endpoints
**File:** Multiple files
**Severity:** HIGH
**Description:** When a resource is not found, different endpoints use different error codes:
- `agents/[id]/route.ts:23` — `agent_not_found` (HTTP 404)
- `threads/[id]/route.ts:20` — `thread_not_found` (HTTP 404)
- `chat/batch/[id]/route.ts:20` — `invalid_request` (HTTP 400) for "Batch not found"
- `files/[id]/route.ts:20` — `invalid_request` (HTTP 400) for "File not found"
- `predictions/[id]/route.ts:20` — `invalid_request` (HTTP 400) for "Prediction not found"
- `conversations/[id]/messages/route.ts:25` — `invalid_request` (HTTP 400) for "Conversation not found"
**Impact:** A consumer cannot rely on HTTP status code 404 to mean "not found" since some not-found cases return 400. Error handling logic must check both status codes and parse error messages to determine if something wasn't found. This is particularly bad for SDK retry logic (400 = don't retry, 404 = might retry).
**Suggestion:** Use dedicated error codes (`batch_not_found`, `file_not_found`, `prediction_not_found`, `conversation_not_found`) mapped to HTTP 404 for all "not found" scenarios.

---

### [FE-06] — Pagination response shape inconsistency: conversations includes `next_cursor: null` in empty case but not in populated case
**File:** `src/app/api/v1/conversations/route.ts:38,59`
**Severity:** HIGH
**Description:** The conversations endpoint comment says "cursor-based pagination" (line 6) but actually uses offset-based pagination. When no agents match the filter, the empty response at line 38 includes `next_cursor: null` in the response. But the normal success response at line 59 does not include `next_cursor`. This means the response shape changes depending on whether results are empty.
**Impact:** TypeScript SDK consumers who type the response based on one path will get runtime errors on the other. Any code that destructures `{ next_cursor }` will get `undefined` in the normal case but `null` in the empty case.
**Suggestion:** Remove `next_cursor: null` from the empty response at line 38 to match the normal response shape. Also update the JSDoc comment from "cursor-based" to "offset-based".

---

### [FE-07] — Comment/JSDoc claims cursor-based pagination but implementation is offset-based
**File:** `src/app/api/v1/conversations/route.ts:6`, `src/app/api/v1/conversations/[id]/messages/route.ts:8`, `src/app/api/v1/threads/[id]/messages/route.ts:8`
**Severity:** MEDIUM
**Description:** Three endpoints have JSDoc comments claiming "cursor-based pagination" but all actually implement offset-based pagination using `offset` and `limit` query params with `range()`.
**Impact:** Developers reading the source or auto-generated docs will expect cursor parameters and implement cursor logic. When they can't find the cursor in the response, they'll be confused.
**Suggestion:** Update JSDoc comments to say "offset-based pagination" consistently.

---

### [FE-08] — Default pagination limits are inconsistent across endpoints
**File:** Multiple files
**Severity:** MEDIUM
**Description:** Default `limit` values vary without clear rationale:
- Agents: default 20, max 100
- Conversations: default 20, max 100
- Conversation messages: default 50, max 200
- Threads: default 20, max 100
- Thread messages: default 50, max 200
- Files: default 20, max 100
- Audit log: default 50, max 100
**Impact:** SDK developers must hardcode different defaults per endpoint or risk unexpected behavior. The inconsistency between list endpoints (20) and message endpoints (50) is defensible but not documented.
**Suggestion:** Document the defaults per endpoint in the API docs, or standardize to a single default (e.g., 20) with a single max (e.g., 100).

---

### [FE-09] — Message max length is inconsistent: 100K in chat, 10K in threads/batch
**File:** `src/app/api/v1/chat/route.ts:71`, `src/app/api/v1/threads/[id]/messages/route.ts:84`, `src/app/api/v1/chat/batch/route.ts:49`
**Severity:** HIGH
**Description:** The chat endpoint allows messages up to 100,000 characters (line 71). The thread messages endpoint caps at 10,000 characters (line 84). The batch endpoint also caps at 10,000 (line 49). A developer who tests with the chat endpoint and later migrates to threads will silently have their messages rejected with a different limit.
**Impact:** Developer confusion and potential production bugs when switching between endpoints. The 10x difference is not intuitive.
**Suggestion:** Either align the limits or clearly document the per-endpoint limits. Consider using a shared constant.

---

### [FE-10] — Models endpoint returns no pagination metadata
**File:** `src/app/api/v1/models/route.ts:21-28`
**Severity:** MEDIUM
**Description:** The models endpoint returns `{ models: [...] }` with no `has_more`, `total`, or pagination params. While the model list is likely small, this breaks the pattern established by every other list endpoint which returns `{ <items>, has_more, total }`.
**Impact:** A generic SDK list method that expects `has_more` and `total` on all list responses will break for models. Consumers need to special-case this endpoint.
**Suggestion:** Add `has_more: false` and `total: models.length` for consistency, even if pagination is not needed.

---

### [FE-11] — Health endpoint returns `plan` as a string but no type information
**File:** `src/app/api/v1/health/route.ts:21-27`
**Severity:** LOW
**Description:** The health endpoint returns `plan` as a raw string (e.g., "pro", "ultra", "enterprise") and `agents` as an array of agent name strings. Neither the response nor docs define the possible plan values. Also, `rate_limit` is a number field that duplicates the `X-RateLimit-Limit` header.
**Impact:** Minor — consumers must guess valid plan values. The duplicated rate limit info in body and headers is mildly confusing but not harmful.
**Suggestion:** Document the enum of valid plan values. Consider removing `rate_limit` from the body since it's in headers.

---

### [FE-12] — Batch endpoint returns `apiSuccess` with status "processing" but batch is already done
**File:** `src/app/api/v1/chat/batch/route.ts:89-99`
**Severity:** HIGH
**Description:** The batch POST handler `await`s `processBatch()` at line 90, which processes all items to completion. After that awaited call returns, line 93 returns `status: "processing"` and `completed: 0`. The batch has already finished processing at this point. The consumer will poll and find it completed, but the initial response is misleading.
**Impact:** The initial response tells the consumer the batch is still processing, prompting unnecessary polling. The response should reflect the actual final state since the processing is synchronous.
**Suggestion:** After `await processBatch()`, fetch the actual batch status from the DB and return the real `status`, `completed`, and `failed` counts.

---

### [FE-13] — Predictions endpoint creates records but has no processing pipeline
**File:** `src/app/api/v1/predictions/route.ts:23-30`
**Severity:** MEDIUM
**Description:** The predictions POST endpoint inserts a record with `status: "pending"` into `api_predictions` but never triggers any processing. There is no background job, no webhook, no queue consumer. The prediction will remain in "pending" state forever.
**Impact:** Consumers who create predictions will poll the GET endpoint indefinitely and never get a result. This is a dead endpoint.
**Suggestion:** Either implement the processing pipeline, remove the endpoint, or mark it as "coming soon" in docs. Currently it silently accepts work it will never complete.

---

### [FE-14] — Files list endpoint uses different field names than file detail endpoint
**File:** `src/app/api/v1/files/route.ts:78-85`, `src/app/api/v1/files/[id]/route.ts:22-29`
**Severity:** MEDIUM
**Description:** The files list returns items with `{ file_id, filename, size, type, status, created_at }`. The file detail returns `{ file_id, filename, type, size, status, chunks, created_at }`. The field ordering differs (`size` before `type` in list, `type` before `size` in detail) and the detail response includes a `chunks` field not present in list items.
**Impact:** While field ordering in JSON is technically insignificant, the missing `chunks` field means TypeScript types for list items and detail items must differ. Consumers who expect to "upgrade" a list item to a detail item by fetching by ID may be surprised by the structural differences.
**Suggestion:** Include `chunks` (as `null` or `0`) in list items for consistency. Also add `mime_type` to both (the upload response includes it but list/detail do not).

---

### [FE-15] — Upload response includes `mime_type` but list and detail responses use `type` (file extension)
**File:** `src/app/api/v1/files/route.ts:165-173`, `src/app/api/v1/files/route.ts:78-85`, `src/app/api/v1/files/[id]/route.ts:22-29`
**Severity:** MEDIUM
**Description:** The upload POST response returns `mime_type: "application/pdf"` (the MIME type). The list GET and detail GET return `type: "pdf"` (the file extension from the DB). These are semantically different values with different field names representing "file type".
**Impact:** A consumer storing the upload response and later comparing with a list/detail response will find `mime_type` missing and `type` having a different value format. SDKs need to handle this mismatch.
**Suggestion:** Return both `type` (extension) and `mime_type` consistently across all file endpoints, or pick one and standardize.

---

### [FE-16] — Thread messages GET returns raw DB rows while conversation messages GET maps fields
**File:** `src/app/api/v1/threads/[id]/messages/route.ts:45-49`, `src/app/api/v1/conversations/[id]/messages/route.ts:52-58`
**Severity:** MEDIUM
**Description:** Conversation messages are mapped to a clean shape: `{ id, role, content, created_at }`. Thread messages at line 45 return `results` directly from the DB query, which includes `tool_calls` and `tool_results` columns. This leaks internal DB schema to the API consumer and means the response shape depends on which table schema is used.
**Impact:** Thread message responses may include null `tool_calls` and `tool_results` fields that are internal implementation details. If columns are added to `api_thread_messages`, they'll automatically leak to the API without review.
**Suggestion:** Map thread messages through an explicit transform like conversation messages, selecting only the fields that should be part of the public API.

---

### [FE-17] — Rate limit error does not include rate limit info in response headers
**File:** `src/lib/v1-auth.ts:110-111`, `src/lib/api-errors.ts:141-143`
**Severity:** LOW
**Description:** When rate limiting triggers in `validateV1Auth` (lines 110-111), it returns via `apiError("rate_limited", ...)` which only adds a static `Retry-After: 60` header. It does not include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, or `X-RateLimit-Reset` headers. Successful responses include all three. This means the consumer loses rate limit visibility exactly when they need it most.
**Impact:** Consumers implementing adaptive rate limiting cannot read their current limit/remaining/reset when they get throttled. They must wait a static 60 seconds even if the window resets sooner.
**Suggestion:** Pass rate limit info to the `apiError` function for rate-limited responses so consumers can implement precise backoff.

---

### [FE-18] — Audit log filter params use inconsistent naming: `entity_type` in query but no documentation
**File:** `src/app/api/v1/audit-log/route.ts:17-22`
**Severity:** LOW
**Description:** The audit log endpoint accepts six filter parameters (`category`, `action`, `entity_type`, `entity_id`, `from`, `to`) but none are documented in the API docs page. The `from`/`to` parameters are ambiguous (are they ISO timestamps? Unix timestamps? Date strings?). Looking at lines 34-35, they're passed directly to `gte`/`lte` on `created_at`, implying ISO format, but this is not validated.
**Impact:** Consumers must guess at filter parameter names and formats. Invalid date strings will silently produce empty results rather than a validation error.
**Suggestion:** Document the filter parameters. Add validation for `from`/`to` to ensure they're valid ISO 8601 timestamps, returning a clear error if not.
