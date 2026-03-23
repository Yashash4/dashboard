# Agent 35 — V1 API — UX Reviewer Review
**Total Issues Found: 18**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 7 / LOW: 3

---

### [UX-01] — Rate limiter never records hits — limits are never enforced
**File:** `src/lib/rate-limit.ts:74-82`
**Severity:** CRITICAL
**Description:** The synchronous `rateLimit()` function reads from the in-memory store to check remaining capacity but never writes a timestamp to the store. Every call sees full remaining capacity because no hits are ever recorded. The `getRateLimitStatus()` function reads `store.get(identifier)` but nothing in `rateLimit()` calls `store.set()` or pushes to the timestamps array. This means all V1 API rate limits are effectively unenforced.
**Developer Impact:** Developers building against this API cannot rely on rate limit headers (`X-RateLimit-Remaining`) being accurate. They will always show the full limit, giving a false sense of how much capacity remains. More critically, abusive callers face no throttling.
**Recommendation:** Add `const now = Date.now(); const timestamps = store.get(identifier) || []; timestamps.push(now); store.set(identifier, timestamps);` inside `rateLimit()` before returning, so each call is actually counted.

---

### [UX-02] — Retry-After header is always hardcoded to "60" regardless of actual reset time
**File:** `src/lib/api-errors.ts:142`
**Severity:** HIGH
**Description:** When a rate limit error is returned, the `Retry-After` header is hardcoded to `"60"` seconds. The actual reset time is known (via `rateLimitInfo.reset`) but is not passed to the `apiError()` function. The rate limit error is generated in `v1-auth.ts:111` and `v1-auth.ts:123` before `rateLimitInfo` is computed, so the real reset time is unavailable at that point.
**Developer Impact:** Developers implementing retry logic will always wait 60 seconds even if the window resets sooner. This degrades perceived API performance.
**Recommendation:** Compute `rateLimitInfo` before the rate limit check in `v1-auth.ts`, then pass the actual seconds-until-reset to `apiError()` and use it for the `Retry-After` header.

---

### [UX-03] — Docs claim error format `{"error": "...", "code": "RATE_LIMITED"}` but implementation returns `{"error": {"code": "rate_limited", ...}}`
**File:** `src/app/docs/pro/api/page.tsx:226-229` vs `src/lib/api-errors.ts:122-133`
**Severity:** CRITICAL
**Description:** The documentation shows a flat error body:
```json
{"error": "Rate limit exceeded. Retry after 12 seconds.", "code": "RATE_LIMITED"}
```
But the actual implementation returns a nested structure:
```json
{"error": {"code": "rate_limited", "message": "...", "type": "api_error", "request_id": "req_..."}}
```
The code casing also differs (docs: `RATE_LIMITED`, impl: `rate_limited`). Developers following the docs will write broken error-handling code.
**Developer Impact:** Any developer parsing errors based on the documented format will fail to handle errors correctly. This is the first thing a developer encounters when something goes wrong.
**Recommendation:** Update the docs to match the actual nested error structure, including the `type` and `request_id` fields. Use lowercase `rate_limited` to match implementation.

---

### [UX-04] — Docs claim `Retry-After` header on 429 but say "Retry after 12 seconds" — the actual header is always "60"
**File:** `src/app/docs/pro/api/page.tsx:64-66` and `src/lib/api-errors.ts:142`
**Severity:** MEDIUM
**Description:** Docs state: "the API returns a 429 Too Many Requests response with a Retry-After header indicating how many seconds to wait." The example error body says "Retry after 12 seconds." But the actual `Retry-After` header is always hardcoded to `60`. The "12 seconds" in the docs is misleading — it implies dynamic calculation that does not exist.
**Developer Impact:** Developers will expect a dynamic `Retry-After` value and may build retry logic around the body message string instead of the header, or distrust the header when it always says 60.
**Recommendation:** Either implement dynamic Retry-After or update docs to say the header is always 60 seconds.

---

### [UX-05] — Docs show response field `reply` but implementation returns `response`
**File:** `src/app/docs/pro/api/page.tsx:156` vs `src/app/api/v1/chat/route.ts:398`
**Severity:** CRITICAL
**Description:** The JavaScript code example shows `console.log(data.reply)` and the Python example shows `data["reply"]`. But the actual chat endpoint returns `{ response: "...", agent: "...", request_id: "..." }`. The field is called `response`, not `reply`.
**Developer Impact:** Every developer following the code examples will get `undefined` / `None` on their first integration attempt. This is the most common endpoint and the most visible onboarding failure.
**Recommendation:** Change docs code examples to use `data.response` instead of `data.reply`.

---

### [UX-06] — SSE streaming format in docs does not match implementation
**File:** `src/app/docs/pro/api/page.tsx:134-137` vs `src/app/api/v1/chat/route.ts:280-286`
**Severity:** HIGH
**Description:** The docs show SSE events like:
```
data: {"chunk": "Webhooks are ", "done": false}
data: {"chunk": "", "done": true, "usage": {"prompt_tokens": 45, "completion_tokens": 128}}
```
But the actual implementation sends:
```
data: {"content": "Webhooks are "}
data: [DONE]
```
The implementation uses `content` not `chunk`, does not include `done` or `usage` fields, and uses the `[DONE]` sentinel instead of a `done: true` object.
**Developer Impact:** Developers building SSE parsers from the docs will parse `chunk` and `done` fields that do not exist, and will miss the `[DONE]` termination signal.
**Recommendation:** Update docs to show the actual SSE format with `content` field and `[DONE]` termination.

---

### [UX-07] — Threads and Conversations are redundant overlapping concepts with no documentation explaining when to use which
**File:** `src/app/api/v1/threads/route.ts` and `src/app/api/v1/conversations/route.ts`
**Severity:** HIGH
**Description:** The API exposes both `/v1/threads` and `/v1/conversations` endpoints. Threads appear to be API-created conversation containers (with metadata support and explicit message posting). Conversations appear to be dashboard-originated chat sessions. Neither the docs nor the API responses explain the distinction. The docs page (`src/app/docs/pro/api/page.tsx`) does not mention either resource at all — it only documents the `/v1/chat` endpoint.
**Developer Impact:** Developers will be confused about which to use. They may create threads via the API but look for their data in conversations, or vice versa. The lack of documentation means trial-and-error is required.
**Recommendation:** Either consolidate into one concept, or add clear documentation explaining: "Use Threads for stateful API conversations. Conversations are read-only records of dashboard chat sessions."

---

### [UX-08] — API docs page only documents /v1/chat — 90% of endpoints are undocumented
**File:** `src/app/docs/pro/api/page.tsx`
**Severity:** HIGH
**Description:** The API docs page documents only the `/v1/chat` endpoint, SSE streaming, and error codes. The following endpoints have zero documentation: `/v1/health`, `/v1/agents`, `/v1/agents/:id`, `/v1/models`, `/v1/usage`, `/v1/audit-log`, `/v1/threads/*`, `/v1/conversations/*`, `/v1/files/*`, `/v1/predictions/*`, `/v1/chat/batch/*`. That is 15+ endpoints with no docs.
**Developer Impact:** Developers must reverse-engineer the API by trial and error. Discoverability is near zero for anything beyond basic chat.
**Recommendation:** Add endpoint reference documentation for all V1 routes, including request/response schemas, query parameters, and pagination details.

---

### [UX-09] — Inconsistent "not found" error codes across resources
**File:** Multiple routes
**Severity:** MEDIUM
**Description:** Different resources use different error codes for "not found":
- Agents: `agent_not_found` (404) — `src/app/api/v1/agents/[id]/route.ts:23`
- Threads: `thread_not_found` (404) — `src/app/api/v1/threads/[id]/route.ts:20`
- Conversations: `invalid_request` (400) — `src/app/api/v1/conversations/[id]/messages/route.ts:26`
- Files: `invalid_request` (400) — `src/app/api/v1/files/[id]/route.ts:20`
- Predictions: `invalid_request` (400) — `src/app/api/v1/predictions/[id]/route.ts:20`
- Batches: `invalid_request` (400) — `src/app/api/v1/chat/batch/[id]/route.ts:20`

Files, predictions, batches, and conversations all return `400 Bad Request` with code `invalid_request` when a resource is not found. This is semantically wrong — a missing resource is `404 Not Found`.
**Developer Impact:** SDK builders cannot write a generic "resource not found" handler. A 400 error might be a missing resource or an actual bad request — they are indistinguishable.
**Recommendation:** Add `file_not_found`, `prediction_not_found`, `batch_not_found`, `conversation_not_found` error codes that map to 404 status.

---

### [UX-10] — Pagination response inconsistency — no `offset` returned in paginated responses
**File:** Multiple routes (e.g., `src/app/api/v1/agents/route.ts:48`, `src/app/api/v1/files/route.ts:77`)
**Severity:** MEDIUM
**Description:** All paginated endpoints accept `offset` and `limit` query parameters and return `has_more` and `total`. However, none of them return the current `offset` or `limit` in the response. A developer receiving a response has no way to know what page they are on without tracking it client-side.
**Developer Impact:** Developers must maintain pagination state externally. This makes it harder to build generic pagination helpers or debug pagination issues.
**Recommendation:** Include `offset` and `limit` in all paginated responses, e.g., `{ "agents": [...], "has_more": true, "total": 50, "offset": 0, "limit": 20 }`.

---

### [UX-11] — Thread messages comment says "cursor-based pagination" but implementation is offset-based
**File:** `src/app/api/v1/threads/[id]/messages/route.ts:8`
**Severity:** LOW
**Description:** The JSDoc comment says "cursor-based pagination" but the implementation uses `offset` and `limit` query parameters with `range()` — standard offset-based pagination. Same issue in `src/app/api/v1/conversations/route.ts:5` and `src/app/api/v1/conversations/[id]/messages/route.ts:5`.
**Developer Impact:** Misleading for developers reading the source code or auto-generated docs. They may look for cursor parameters that do not exist.
**Recommendation:** Update comments to say "offset-based pagination" to match the implementation.

---

### [UX-12] — Predictions endpoint creates records but never processes them
**File:** `src/app/api/v1/predictions/route.ts:22-31`
**Severity:** HIGH
**Description:** The `POST /v1/predictions` endpoint creates a prediction record with status `"pending"` and returns immediately. There is no background worker, queue, or processing logic to actually execute the prediction. The `GET /v1/predictions/:id` endpoint can poll for results, but the status will remain `"pending"` forever because nothing transitions it to `"completed"`.
**Developer Impact:** Developers will create predictions, poll for results, and wait indefinitely. This is a dead-end API that wastes developer time.
**Recommendation:** Either implement the prediction processing pipeline or remove/disable this endpoint and document it as "coming soon."

---

### [UX-13] — Chat endpoint message length limit is 100,000 chars but batch/thread limit is 10,000 chars
**File:** `src/app/api/v1/chat/route.ts:71` vs `src/app/api/v1/chat/batch/route.ts:49` vs `src/app/api/v1/threads/[id]/messages/route.ts:84`
**Severity:** MEDIUM
**Description:** The `/v1/chat` endpoint allows messages up to 100,000 characters. The batch endpoint (`/v1/chat/batch`) and thread messages endpoint (`/v1/threads/:id/messages`) limit messages to 10,000 characters. This 10x difference is undocumented and surprising.
**Developer Impact:** Developers who test with `/v1/chat` and then switch to threads or batch will get unexpected validation errors for messages that previously worked.
**Recommendation:** Either align the limits across all endpoints or document the differences. A single constant for the message limit shared across routes would prevent drift.

---

### [UX-14] — No CORS headers on V1 API routes
**File:** All `src/app/api/v1/*/route.ts` files
**Severity:** MEDIUM
**Description:** None of the V1 API routes set CORS headers (`Access-Control-Allow-Origin`, etc.) or handle `OPTIONS` preflight requests. If a developer tries to call the API from a browser-based application (e.g., a React frontend), all requests will fail with CORS errors.
**Developer Impact:** Browser-based integrations are completely blocked. Developers must set up a server-side proxy to use the API from any web application.
**Recommendation:** Add CORS headers to V1 routes (either via Next.js middleware or per-route), or document that the API is server-to-server only and browser calls are not supported.

---

### [UX-15] — Onboarding requires 3+ steps with no quick-start path
**File:** `src/lib/v1-auth.ts:96` and `src/app/docs/pro/api/page.tsx`
**Severity:** MEDIUM
**Description:** To make a first API call, a developer must: (1) have a Pro/Ultra/Enterprise subscription, (2) create an API key from the dashboard, (3) have a deployed agent, (4) know the agent's slug name. The docs do not mention steps 1, 3, or 4. A developer with a valid API key but no deployed agents gets `"No deployed agents found"` with no guidance on what to do next.
**Developer Impact:** High onboarding friction. The error message "No deployed agents found" does not tell the developer to go deploy an agent from the dashboard.
**Recommendation:** Add actionable error messages like "No deployed agents found. Deploy an agent from your dashboard at https://app.clawhq.tech/agents before using the chat API." Also add a getting-started checklist to the docs.

---

### [UX-16] — Batch endpoint awaits full processing before returning — not truly async
**File:** `src/app/api/v1/chat/batch/route.ts:90`
**Severity:** MEDIUM
**Description:** The batch create endpoint calls `await processBatch(...)` which processes all items sequentially (3 at a time) before returning the response. For a batch of 50 items with 60s timeouts each, this could block for up to 17 minutes. The endpoint returns `status: "processing"` as if it is async, but the HTTP response does not arrive until all processing completes. The `maxDuration` is set to 300s (5 minutes) which would time out for large batches.
**Developer Impact:** Developers expect immediate acknowledgment (like a job queue) based on the response format, but the actual behavior is synchronous blocking. Large batches will likely hit the 5-minute serverless timeout and return an error.
**Recommendation:** Move batch processing to a true background job (e.g., a separate serverless function invoked via fetch without await, or a queue). Return the batch ID immediately and let polling work as designed.

---

### [UX-17] — API key format validation rejects valid keys silently with generic message
**File:** `src/lib/v1-auth.ts:59-63`
**Severity:** LOW
**Description:** The auth middleware validates that keys start with `clw_` and are exactly 36 characters long. If a developer accidentally includes extra whitespace, quotes, or the full `Bearer clw_...` string in the key field, they get "Invalid API key format" with no hint about what the expected format is.
**Developer Impact:** Common mistakes (trailing newline from copy-paste, double "Bearer Bearer" prefix, key in quotes) produce an unhelpful error. Developers must guess the correct format.
**Recommendation:** Include the expected format in the error message: `"Invalid API key format. Expected: clw_ followed by 32 alphanumeric characters (36 chars total). Got ${rawKey.length} chars."` Also log the key length to help debugging.

---

### [UX-18] — No OpenAPI/Swagger specification available
**File:** N/A (missing)
**Severity:** LOW
**Description:** The API has no machine-readable specification (OpenAPI/Swagger). Modern API workflows rely on OpenAPI specs for auto-generating SDKs, testing with Postman/Insomnia, and type-safe client generation.
**Developer Impact:** Developers cannot auto-generate typed clients. Every integration requires manual implementation. No import-into-Postman workflow exists.
**Recommendation:** Generate an OpenAPI 3.0 spec from the route definitions. This can be auto-generated from the existing TypeScript types and route structure, or hand-authored as a YAML file served at `/api/v1/openapi.json`.
