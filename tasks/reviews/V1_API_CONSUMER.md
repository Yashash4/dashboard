# V1 API Consumer Review

> Reviewed: 2026-03-16
> Perspective: External developer integrating with ClawHQ's V1 API using only the code as documentation.

---

## Executive Summary

The V1 API surface is **broad and functional** (18 endpoints across 8 resource groups). The newer endpoints (batch, threads, agents, files, audit-log, models, usage) use the structured `apiError`/`apiSuccess` helpers from `api-errors.ts`, producing consistent error shapes and request IDs. However, the **older endpoints** (health, chat, conversations) still use raw `NextResponse.json()`, creating two distinct error formats that a consumer must handle differently. This is the single biggest consistency problem across the API.

---

## 1. Endpoint-by-Endpoint Analysis

### POST /api/v1/chat

| Check | Status | Notes |
|-------|--------|-------|
| Usable from code alone? | Partially | `message`, `agent`, `session_id`, `stream` params are discoverable from the destructuring on line 87, but a developer would not know valid values for `agent` without calling `/health` or `/agents` first. |
| Validation | Good | Checks empty message, 100KB limit, session_id format (alphanumeric, 128 chars). |
| Error format | **INCONSISTENT** | Auth errors use the structured `{ error: { code, message, type, request_id } }` shape (via `apiError`), but validation errors on lines 82-106 use a flat `{ error: "string" }` shape. A consumer parsing `error.code` will get `undefined` for invalid JSON, missing message, or message-too-long errors. |
| Rate limit headers | **MISSING** | Rate limiting is checked (line 70-76) but the response on success does NOT include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, or `X-RateLimit-Reset` headers. The 429 response includes `Retry-After: 60` but not the standard rate limit trio. |
| Request ID | Partial | `X-Request-Id` header is present on auth errors and the success response (line 403), but **missing** from validation error responses (lines 82-106), the 502 upstream error, the 504 timeout, and the 500 catch-all. |
| Streaming (SSE) | Works, but simplified | SSE format is correct (`data: {...}\n\n`). However, the streamed chunks are simplified to `{ content: "..." }` — no `id`, no `object`, no `model`, no `choices` array. This deviates from the OpenAI-compatible format that the upstream VPS provides. A developer expecting OpenAI-compatible SSE will be surprised. Also, the streaming response has **no `X-Request-Id` header** (line 352-358). |
| Idempotency | **NOT USED** | `idempotency.ts` exists but is never imported or called by any endpoint. The module is dead code. |

**Edge cases that could break it:**
- Sending `{ "message": "   " }` (whitespace only) — correctly caught by `!message?.trim()`.
- Sending `Content-Type: text/plain` instead of `application/json` — `request.json()` will fail, returns `{ error: "Invalid JSON body" }` with no request ID.
- Sending a message with exactly 100,001 characters — caught, but the error is flat `{ error: "Message too long (max 100KB)" }` while the check is character-based, not byte-based. The error message says "100KB" but it's actually 100K characters (which could be 400KB in UTF-8).

### POST /api/v1/chat/batch

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Clear: send `{ requests: [{ custom_id, message, agent? }], webhook_url? }`. |
| Validation | Good | Checks array, non-empty, max 50, RPM capacity. Uses `missing_parameter` error code with `param` field. |
| Error format | Consistent | Uses `apiError`/`apiSuccess` throughout. |
| Rate limit | 5 RPM | Very restrictive. Documented only in code. |
| Batch processing | Works conceptually | Processes 3 at a time via `Promise.allSettled`. However, the `webhook_url` is stored but **never called** — the `processBatch` function does not dispatch to the webhook URL when processing completes. This is a silent feature gap. |

**Edge case:** If a `custom_id` is duplicated across requests, results will have duplicate IDs. No uniqueness validation.

### GET /api/v1/chat/batch/:id

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Straightforward poll endpoint. |
| Error format | Consistent | Uses `apiError`/`apiSuccess`. |
| Plan check | **MISSING** | Unlike every other endpoint, this one does NOT check the subscription plan. A downgraded user could still poll batch results. |

### GET /api/v1/health

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Returns `status`, `plan`, `key_name`, `rate_limit`, `agents`. |
| Error format | **INCONSISTENT** | Uses raw `NextResponse.json({ error: "string" })` for all errors — no `code`, `type`, or `request_id`. This is the oldest endpoint pattern. |
| Request ID | **MISSING** | No `X-Request-Id` on any response. |
| Rate limit | **NO RATE LIMITING** | Anyone can hammer this endpoint. |

### GET /api/v1/models

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Returns `{ models: [{ id, name, context_window, description }] }`. |
| Error format | Consistent | Uses `apiError`/`apiSuccess`. |
| Rate limit | **NONE** | No rate limiting on this endpoint. |

### GET /api/v1/usage

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | `?days=7` param with 1-90 range. Returns daily breakdown + totals. |
| Error format | Consistent. |
| Pagination | N/A | Returns all daily data for the period. Could be large for 90 days but manageable. |

### POST /api/v1/threads (create) + GET /api/v1/threads (list)

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Create: `{ agent?, metadata? }`. List: `?limit=&offset=`. |
| Error format | Consistent. |
| Pagination | Offset-based | `limit` (1-100, default 20) + `offset`. **No `has_more` or `total` count** in the response — the consumer cannot tell if there are more pages. |
| Rate limit | 30/min for create | Good. |

### GET/DELETE /api/v1/threads/:id

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes. |
| Error format | Consistent. |
| DELETE cascade | **UNCLEAR** | Thread is deleted, but it's unknown from code alone whether `api_thread_messages` has a foreign key cascade. If not, orphaned messages remain. |

### GET/POST /api/v1/threads/:id/messages

| Check | Status | Notes |
|-------|--------|-------|
| Context maintained? | **YES** | POST fetches last 20 messages from the thread and sends full history to the VPS. This correctly maintains conversation context. |
| Pagination (GET) | Partial | `limit` param (max 200, default 50), but **no offset** — only forward pagination. Uses `has_more` boolean. |
| Rate limit | Uses per-key RPM | Shared with chat endpoint rate limit since both use `apikey:{id}` key. |

### GET /api/v1/files (list) + POST /api/v1/files (upload)

| Check | Status | Notes |
|-------|--------|-------|
| File upload | Multipart form | `formData.get("file")` + optional `purpose` field. Correctly validates type and size. |
| Allowed types | PDF, TXT, MD, CSV, JSON, PNG, JPG, GIF, WebP | Good coverage. |
| Max size | 10MB | Reasonable. |
| Indexing | Automatic | Text files are indexed immediately via `indexDocument`. Binary files (PDF, images) get status `processing` but **no background job** is triggered to process them — they will stay in `processing` forever. |
| List pagination | **HARDCODED limit 100** | No pagination params. If user has >100 files, they can never see the rest. |
| Error format | Consistent. |

### GET/DELETE /api/v1/files/:id

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes. |
| Plan check on GET | **MISSING** | GET does not verify subscription plan. DELETE also skips plan check. |
| Storage cleanup | **MISSING** | DELETE removes the DB record but does NOT delete the file from Supabase Storage (`kb-files` bucket). Storage leak. |

### GET /api/v1/agents (list)

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Returns deployed agents with model info. |
| Error format | Consistent. |
| Pagination | **NONE** | Returns all deployed agents. Usually fine (most users have <10 agents). |
| POST create | **MISSING** | The task mentions `POST create` but the `agents/route.ts` only has GET. Agents cannot be created via API. |

### GET/DELETE /api/v1/agents/:id

| Check | Status | Notes |
|-------|--------|-------|
| GET | Works | Returns detailed agent info including `custom_config`. |
| DELETE | Actually undeploys | Calls SSH `undeployAgent` then marks as `deployed: false`. This is destructive — it's an undeploy, not a delete. |
| PATCH | **MISSING** | The task mentions PATCH but it does not exist in the code. Agents cannot be updated via API. |

### GET /api/v1/predictions/:id

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Standard poll endpoint for async predictions. |
| Creation endpoint | **MISSING** | There is no POST endpoint to create predictions. The `api_predictions` table exists but nothing writes to it from the V1 API. This endpoint is an orphan — it can read predictions but none can be created via API. |
| Plan check | **MISSING** | No subscription validation. |

### GET /api/v1/conversations (list)

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Supports `?agent=`, `?limit=`, `?offset=` filters. |
| Error format | **INCONSISTENT** | Uses raw `NextResponse.json({ error: "string" })`. No request IDs. |
| Rate limit | **NONE** | |
| Agent filter | **SQL INJECTION RISK** | Uses `ilike("name", `%${agent}%`)` with unsanitized user input. While Supabase parameterizes queries, the `%` wildcards in the pattern mean a consumer could pass `agent=%` to match everything, or use `_` as single-char wildcard. Not a security issue, but unexpected behavior. |

### GET /api/v1/conversations/:id/messages

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes. |
| Error format | **INCONSISTENT** | Raw `NextResponse.json`. No request IDs. |
| Message order | **DESCENDING** | Returns newest first. This is the opposite of `threads/:id/messages` which returns **ascending**. A consumer working with both will get confused. |
| Rate limit | **NONE** | |

### GET /api/v1/audit-log

| Check | Status | Notes |
|-------|--------|-------|
| Usable? | Yes | Rich filtering: `category`, `action`, `entity_type`, `entity_id`, `from`, `to`. |
| Pagination | **CURSOR-BASED** | Uses ISO timestamp cursor. This is the ONLY endpoint using cursor pagination — everything else uses offset. |
| Error format | Consistent. |
| Rate limit | 30/min | Good. |

---

## 2. Cross-Cutting Issues

### 2.1 Two Error Formats (Critical)

Endpoints fall into two camps:

**New pattern** (batch, threads, files, agents, predictions, models, usage, audit-log):
```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid API key",
    "type": "authentication_error",
    "request_id": "req_abc123"
  }
}
```

**Old pattern** (health, chat validation errors, conversations):
```json
{
  "error": "Invalid API key"
}
```

A consumer writing a generic error handler must check `typeof response.error === 'string'` vs `typeof response.error === 'object'`. This is a significant DX problem.

### 2.2 Rate Limit Headers Never Sent on Success

The `apiSuccess` helper accepts an optional `RateLimitInfo` parameter for rate limit headers, but **no endpoint ever passes it**. The `rateLimit()` function returns `{ success, remaining }` but not `limit` or `reset` timestamp, so callers cannot construct the `RateLimitInfo` object. The infrastructure exists but is not wired up.

Result: consumers have no visibility into their rate limit status until they hit 429.

### 2.3 Inconsistent Pagination

| Endpoint | Style | Has `total`/`has_more`? |
|----------|-------|------------------------|
| threads (list) | offset | Neither |
| threads/:id/messages (GET) | limit only (no offset) | `has_more` only |
| files (list) | none (hardcoded 100) | Neither |
| conversations (list) | offset | `total` |
| conversations/:id/messages | offset | Neither |
| audit-log | cursor | `has_more` + `next_cursor` |

A consumer must learn 4 different pagination patterns.

### 2.4 Auth Boilerplate Duplication

Every endpoint repeats the full auth flow: extract Bearer token, validate `clw_` prefix and length, SHA-256 hash, DB lookup, status check, plan check. This is ~15 lines duplicated 16 times. The `validateApiKey` helper only does the first part (token extraction). A shared middleware or wrapper would eliminate this and ensure consistency.

### 2.5 Idempotency Module is Dead Code

`src/lib/idempotency.ts` provides `checkIdempotency()` and `storeIdempotency()` but neither function is imported anywhere. No endpoint supports `Idempotency-Key` headers. This is misleading — the infrastructure suggests idempotency is supported, but it is not.

### 2.6 Missing `X-Request-Id` on Streaming Responses

The streaming SSE response (chat with `stream: true`) does not include `X-Request-Id` in headers. The non-streaming response does. Consumers using streaming cannot correlate requests for debugging.

---

## 3. Specific Bug Reports

### BUG-01: Chat validation errors lack structured format
**File:** `dashboard/src/app/api/v1/chat/route.ts` lines 81-106
**Impact:** Consumer error handling breaks for 400 errors on the main chat endpoint.
**Fix:** Replace `NextResponse.json({ error: "..." })` calls with `apiError("invalid_request", "...", ctx)`.

### BUG-02: Batch webhook_url is stored but never dispatched
**File:** `dashboard/src/app/api/v1/chat/batch/route.ts` line 60, function `processBatch`
**Impact:** Consumer sets `webhook_url` expecting a callback when batch completes. It never fires.
**Fix:** Add webhook dispatch at end of `processBatch` after final status update.

### BUG-03: File upload — binary files stuck in "processing" forever
**File:** `dashboard/src/app/api/v1/files/route.ts` lines 102-128
**Impact:** PDF and image uploads will never reach "processed" status. Only text files get indexed.
**Fix:** Add background processing for PDF extraction and image handling.

### BUG-04: File DELETE does not clean up storage
**File:** `dashboard/src/app/api/v1/files/[id]/route.ts` line 59
**Impact:** Storage bucket accumulates orphaned files.
**Fix:** Add `admin.storage.from("kb-files").remove([storagePath])` before or after DB delete.

### BUG-05: Message character limit mislabeled as bytes
**File:** `dashboard/src/app/api/v1/chat/route.ts` line 101-106
**Impact:** Error says "max 100KB" but the check is `message.length > 100_000` which counts UTF-16 code units, not bytes.
**Fix:** Either change the error message to "max 100,000 characters" or change the check to `new TextEncoder().encode(message).length > 100_000`.

### BUG-06: Predictions endpoint is orphaned
**File:** `dashboard/src/app/api/v1/predictions/[id]/route.ts`
**Impact:** No way to create predictions via V1 API. The GET endpoint exists but is useless.
**Fix:** Either add a POST creation endpoint or remove the GET endpoint.

### BUG-07: Conversations messages returned in opposite order from threads messages
**Files:** `conversations/[id]/messages/route.ts` (descending) vs `threads/[id]/messages/route.ts` (ascending)
**Impact:** Consumer must reverse one or the other to get consistent ordering.
**Fix:** Standardize on ascending (chronological) for both.

---

## 4. Security Observations

### 4.1 API Key Format Leak
The validation `!rawKey.startsWith("clw_") || rawKey.length !== 36` tells an attacker the exact key format: `clw_` prefix + 32 characters = 36 total. While not a critical issue (key format is typically documented), the early rejection before DB lookup means an attacker can distinguish "wrong format" from "valid format but wrong key."

### 4.2 No Request Body Size Limit (except chat)
Only the chat endpoint checks message length (100K chars). The batch endpoint, threads POST, and file upload have their own limits, but thread `metadata` accepts arbitrary JSON with no size limit. A consumer (or attacker) could send a 50MB metadata blob.

### 4.3 Agent Undeploy via DELETE is Dangerous
`DELETE /api/v1/agents/:id` performs a real SSH undeploy operation. If an API key is leaked, an attacker could undeploy all agents. There is no confirmation or soft-delete — it takes immediate effect.

---

## 5. Missing Features a Consumer Would Expect

1. **No PATCH/PUT on any resource** — Cannot update thread metadata, agent config, or file details via API.
2. **No POST for agents** — Cannot create/deploy agents via API. Must use dashboard.
3. **No POST for predictions** — Endpoint exists to read but not to create.
4. **No search/filter on threads** — Cannot filter threads by agent, date range, or metadata.
5. **No file content retrieval** — Can list and delete files, but cannot download the actual file content.
6. **No API key management** — Cannot create, rotate, or revoke API keys via API. Must use dashboard.
7. **No webhook management** — Webhooks are dispatched (chat endpoint) but cannot be configured via API.

---

## 6. Consistency Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Auth pattern | 7/10 | All endpoints use Bearer token, but boilerplate varies. Health and conversations skip plan check inconsistently. |
| Error format | 4/10 | Two incompatible formats. Older endpoints use flat strings. |
| Request ID | 6/10 | Present on most structured responses, missing from health, conversations, chat validation errors, and streaming. |
| Rate limiting | 5/10 | Applied inconsistently. Headers never sent on success. |
| Pagination | 3/10 | Four different patterns across endpoints. |
| Response shape | 6/10 | Newer endpoints are consistent. Conversations responses are shaped differently (no wrapping, different field names). |
| HTTP status codes | 8/10 | Generally correct. 502 for upstream, 504 for timeout, 429 for rate limit. |
| Streaming | 7/10 | Works correctly but simplified format differs from OpenAI SSE standard. No request ID header. |

**Overall API Consistency: 5.75/10**

---

## 7. Recommendations (Priority Order)

### P0 — Fix Before Launch
1. **Migrate chat + health + conversations to use `apiError`/`apiSuccess`** — Eliminates the dual error format problem.
2. **Wire up rate limit headers on success responses** — The infrastructure exists; just pass `RateLimitInfo` to `apiSuccess`.
3. **Fix batch webhook dispatch** — Either implement or remove the `webhook_url` parameter.

### P1 — Fix Soon
4. **Standardize pagination** — Pick one pattern (cursor-based is better for real-time data) and apply everywhere.
5. **Add plan check to batch/:id GET, files/:id GET/DELETE, predictions GET** — Inconsistent gating is a billing leak.
6. **Add rate limiting to health, models, conversations** — Currently unprotected.
7. **Extract auth into shared middleware** — Eliminate 16x duplication, ensure consistency.

### P2 — Nice to Have
8. **Implement idempotency or remove dead code** — Misleading to have the module without using it.
9. **Add PATCH endpoints for threads and agents** — Standard REST expectation.
10. **Add file content download endpoint** — Consumers need to retrieve uploaded files.
11. **Fix message ordering inconsistency** between conversations and threads.
12. **Add `total` or `has_more` to all list endpoints** for pagination completeness.
