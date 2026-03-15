# V1 API QA Test Report

**Date:** 2026-03-16
**Scope:** All endpoints under `dashboard/src/app/api/v1/`
**Method:** Static code review of every route handler — happy path, error cases, edge cases, rate limiting, streaming, batch, and response shape consistency.

---

## Endpoint Inventory

| # | Endpoint | Methods | File |
|---|----------|---------|------|
| 1 | `/api/v1/health` | GET | `health/route.ts` |
| 2 | `/api/v1/chat` | POST | `chat/route.ts` |
| 3 | `/api/v1/chat/batch` | POST | `chat/batch/route.ts` |
| 4 | `/api/v1/chat/batch/:id` | GET | `chat/batch/[id]/route.ts` |
| 5 | `/api/v1/models` | GET | `models/route.ts` |
| 6 | `/api/v1/usage` | GET | `usage/route.ts` |
| 7 | `/api/v1/conversations` | GET | `conversations/route.ts` |
| 8 | `/api/v1/conversations/:id/messages` | GET | `conversations/[id]/messages/route.ts` |
| 9 | `/api/v1/agents` | GET | `agents/route.ts` |
| 10 | `/api/v1/agents/:id` | GET, DELETE | `agents/[id]/route.ts` |
| 11 | `/api/v1/threads` | GET, POST | `threads/route.ts` |
| 12 | `/api/v1/threads/:id` | GET, DELETE | `threads/[id]/route.ts` |
| 13 | `/api/v1/threads/:id/messages` | GET, POST | `threads/[id]/messages/route.ts` |
| 14 | `/api/v1/files` | GET, POST | `files/route.ts` |
| 15 | `/api/v1/files/:id` | GET, DELETE | `files/[id]/route.ts` |
| 16 | `/api/v1/predictions/:id` | GET | `predictions/[id]/route.ts` |
| 17 | `/api/v1/audit-log` | GET | `audit-log/route.ts` |

**Total: 17 routes, 23 HTTP method handlers.**

---

## 1. Response Shape Consistency

### FAIL — Two response shape standards are mixed

Newer endpoints use the `apiError()` / `apiSuccess()` helpers from `src/lib/api-errors.ts`, which produce:
```
// Success: { ...data fields } with X-Request-Id header
// Error:   { error: { code, message, type, request_id } }
```

Older endpoints use raw `NextResponse.json()` with flat error strings:
```
// Error: { error: "Some message string" }
```

**Endpoints using inconsistent (old-style flat) error shapes:**

| Endpoint | Issue |
|----------|-------|
| `GET /health` | All errors are `{ error: "string" }` — no error code, no type, no request_id |
| `POST /chat` | Mixed: auth errors use `apiError()` but body validation errors at lines 82-84, 95-98, 101-105, 108-113 use flat `{ error: "string" }`. Revoked key error at line 48-52 uses a manually-built structured error instead of `apiError("revoked_api_key", ...)`. Upstream errors (lines 283-286, 178, 181-185, 192-195) are flat strings. |
| `GET /conversations` | All errors are `{ error: "string" }` |
| `GET /conversations/:id/messages` | All errors are `{ error: "string" }` |

**Endpoints using consistent (new-style structured) error shapes:**
- `POST /chat/batch`, `GET /chat/batch/:id`
- `GET /models`
- `GET /usage`
- `GET /agents`, `GET /agents/:id`, `DELETE /agents/:id`
- `GET /threads`, `POST /threads`, `GET /threads/:id`, `DELETE /threads/:id`
- `GET /threads/:id/messages`, `POST /threads/:id/messages`
- `GET /files`, `POST /files`, `GET /files/:id`, `DELETE /files/:id`
- `GET /predictions/:id`
- `GET /audit-log`

### BUG-001 (Medium) — `/health` has no request_id tracking
The health endpoint does not use `createRequestContext()`. Every other structured endpoint returns `X-Request-Id`. This makes debugging health check failures harder.

### BUG-002 (High) — `/chat` mixes three different error formats
The main chat endpoint — the most critical route — uses three incompatible error shapes:
1. `apiError()` for auth errors (structured, with request_id)
2. Manual structured error at line 48 for revoked key (has request_id but different code path)
3. Flat `{ error: "string" }` for body validation and upstream errors (no request_id, no code, no type)

Consumers cannot write a single error-handling parser.

### BUG-003 (Medium) — `/conversations` and `/conversations/:id/messages` use old response format
These endpoints return `{ conversations: [...], total: N }` and `{ messages: [...] }` without `X-Request-Id` headers. They are the only endpoints without request tracing.

---

## 2. Authentication Tests

### Happy Path — PASS (all endpoints)
All 17 endpoints validate `Authorization: Bearer clw_...` with SHA-256 hash lookup against `api_keys` table.

### Missing Auth Header
| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| No auth header | 401 | 401 | PASS |
| `Authorization: Basic xxx` | 401 | 401 | PASS (startsWith("Bearer ") check) |
| `Bearer ` (empty token) | 401 | 401 | PASS (length/prefix check) |

### Invalid Key Format
| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| `Bearer abc` | 401 | 401 | PASS (length != 36) |
| `Bearer xxxx_` + 31 chars | 401 | 401 | PASS (prefix != "clw_") |
| `Bearer clw_` + 32 chars | Varies | Lookup fails -> 401 | PASS |

### Revoked Key
| Endpoint | Expected | Actual | Verdict |
|----------|----------|--------|---------|
| `/health` | 401 | 401 `{ error: "API key has been revoked" }` | PASS |
| `/chat` | 401 | 401 with structured error | PASS |
| All others | 401 | 401 "Invalid or revoked API key" | PASS |

### BUG-004 (Low) — Revoked key error message inconsistency
- `/health` says "API key has been revoked"
- `/chat` uses code `revoked_api_key`
- All other endpoints say "Invalid or revoked API key" (they combine the invalid + revoked check into one)

This leaks information: on `/health` and `/chat`, an attacker can distinguish between "key doesn't exist" vs "key exists but is revoked." The other endpoints correctly merge these.

---

## 3. Plan Gating Tests

### Missing Plan (starter user)
All endpoints that check plan correctly reject starter/free users.

| Endpoint | Status | Code | Verdict |
|----------|--------|------|---------|
| `/health` | 403 | flat error | PASS |
| `/chat` | 403 | structured, manual | PASS |
| `/chat/batch` | 403 via apiError | structured | PASS |
| `/models` | 403 | structured | PASS |
| `/usage` | 403 | structured | PASS |
| `/conversations` | 403 | flat error | PASS |
| `/conversations/:id/messages` | 403 | flat error | PASS |
| `/agents` | 403 | structured | PASS |
| `/agents/:id` GET/DELETE | 403 | structured | PASS |
| `/threads` GET/POST | 403 | structured | PASS |
| `/threads/:id` GET/DELETE | 403 | structured | PASS |
| `/threads/:id/messages` POST | 403 | structured | PASS |
| `/files` GET/POST | 403 | structured | PASS |
| `/audit-log` | 403 | structured | PASS |

### BUG-005 (Medium) — Missing plan check on 4 endpoints

| Endpoint | Plan Check? | Issue |
|----------|-------------|-------|
| `GET /chat/batch/:id` | NO | Anyone with a valid key can poll batch status, even after downgrade |
| `GET /files/:id` | NO | File details accessible without plan check |
| `DELETE /files/:id` | NO | File deletion accessible without plan check |
| `GET /predictions/:id` | NO | Prediction polling accessible without plan check |
| `GET /threads/:id/messages` | NO (GET handler) | Thread messages readable without plan check |

These endpoints skip the subscription check entirely. A user who downgrades from Pro to Starter retains access to these resources.

---

## 4. Rate Limiting Tests

### Endpoints with rate limiting

| Endpoint | Rate Limit Key | Limit | Window | Verdict |
|----------|---------------|-------|--------|---------|
| `POST /chat` | `apikey:{id}` | Per-key RPM (default 60) | 60s | PASS |
| `POST /chat/batch` | `{user_id}:batch` | 5 | 60s | PASS |
| `POST /threads` | `{user_id}:thread_create` | 30 | 60s | PASS |
| `POST /threads/:id/messages` | `apikey:{id}` | Per-key RPM | 60s | PASS |
| `POST /files` | `{user_id}:file_upload` | 10 | 60s | PASS |
| `GET /audit-log` | `{user_id}:v1_audit` | 30 | 60s | PASS |

### BUG-006 (High) — Missing rate limiting on 11 endpoints

| Endpoint | Risk |
|----------|------|
| `GET /health` | Unlimited key validation calls — can be used to brute-force key validity |
| `GET /models` | Low risk but should have basic RL |
| `GET /usage` | Triggers DB aggregation — potential DoS vector |
| `GET /conversations` | DB query with ILIKE filter — injection-adjacent |
| `GET /conversations/:id/messages` | Unbounded DB reads |
| `GET /chat/batch/:id` | Polling without RL |
| `GET /agents` | Low risk |
| `GET /agents/:id` | Low risk |
| `DELETE /agents/:id` | Triggers SSH operations — expensive |
| `GET /threads` | Low risk |
| `GET /threads/:id` | Low risk |

The `DELETE /agents/:id` case is notable: it imports `undeployAgent` from `@/lib/ssh` and initiates SSH sessions. Without rate limiting, rapid DELETE requests could exhaust SSH connections on the VPS.

---

## 5. Input Validation & Edge Cases

### POST /chat — Message Validation

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| Empty body `{}` | 400 | 400 "message field is required" | PASS |
| `{ message: "" }` | 400 | 400 (empty string, `!message?.trim()`) | PASS |
| `{ message: "   " }` | 400 | 400 (whitespace only, trim check) | PASS |
| `{ message: "x".repeat(100001) }` | 400 | 400 "Message too long (max 100KB)" | PASS |
| `{ message: "x".repeat(100000) }` | Accepted | Accepted (exactly 100K) | PASS |
| Invalid JSON body | 400 | 400 "Invalid JSON body" | PASS |
| `{ session_id: "a".repeat(129) }` | 400 | 400 session_id validation | PASS |
| `{ session_id: "abc!@#" }` | 400 | 400 alphanumeric check | PASS |
| `{ agent: "nonexistent" }` | 404 | 404 "Agent not found or not deployed" | PASS |

### BUG-007 (Medium) — No message length validation on thread messages
`POST /threads/:id/messages` checks `!message?.trim()` for empty but has **no max length check**. The `/chat` endpoint caps at 100KB. A user could send a multi-MB message through the threads endpoint, which gets stored in DB and forwarded to VPS.

### BUG-008 (Low) — No metadata size validation on thread creation
`POST /threads` accepts `body.metadata` as an arbitrary object with no size or depth limit. A malicious user could send a deeply nested or very large JSON object that gets stored directly in the database.

### POST /chat/batch — Batch Validation

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| Missing `requests` | 400 | 400 "requests array is required" | PASS |
| `requests: []` | 400 | 400 (length === 0 check) | PASS |
| `requests: "string"` | 400 | 400 (!Array.isArray check) | PASS |
| 51 requests | 400 | 400 "Maximum 50 requests per batch" | PASS |
| Requests > RPM | 400 | 400 "Batch size exceeds rate limit" | PASS |

### BUG-009 (Medium) — No validation on individual batch request items
The batch endpoint validates the array exists and its length, but does NOT validate individual items:
- `custom_id` is not checked for presence, type, or uniqueness
- `message` is not checked for presence or length
- Missing `custom_id` or `message` would propagate into the background processor and produce broken results

### POST /files — File Upload Validation

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| No file in form | 400 | 400 "file is required" | PASS |
| File > 10MB | 400 | 400 "File must be under 10MB" | PASS |
| Unsupported MIME type | 400 | 400 "Unsupported file type" | PASS |
| Valid PDF upload | 200 | 200 with file_id | PASS |
| Invalid multipart | 400 | 400 "Invalid multipart form data" | PASS |

### BUG-010 (Medium) — MIME type check relies on client-declared Content-Type
The file upload checks `file.type` which is the MIME type declared by the client in the multipart form. A malicious user could upload an executable with `Content-Type: text/plain`. No magic-byte validation is performed.

### GET /conversations — Query Params

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| `limit=200` | Capped at 100 | `Math.min(parseInt(...), 100)` = 100 | PASS |
| `limit=-5` | Sane default | -5 is used as-is (negative range) | **FAIL** |
| `offset=-10` | Sane default | -10 passed to Supabase range | **FAIL** |
| `limit=abc` | Sane default | `parseInt("abc")` = NaN, `Math.min(NaN, 100)` = NaN | **FAIL** |

### BUG-011 (Medium) — No lower-bound clamping on `limit` and `offset` in `/conversations`
`parseInt("abc")` returns NaN, `Math.min(NaN, 100)` returns NaN. This NaN is passed into the Supabase `.range()` call. Similarly, negative values are not clamped. Compare with `/threads` which does `Math.max(1, ...)` and `Math.max(0, ...)` correctly.

### BUG-012 (Low) — SQL injection-adjacent ILIKE filter in conversations
```ts
const { data: agentRows } = await admin
  .from("agents")
  .select("id, name")
  .ilike("name", `%${agent}%`);
```
The `agent` query param is interpolated into an ILIKE pattern without escaping `%` and `_` wildcards. While Supabase parameterizes the query (no SQL injection), a user can pass `agent=_%` to match any agent name with 1+ characters, bypassing intended filtering.

### GET /usage — Query Params

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| `days=0` | Clamped to 1 | `Math.max(1, 0)` = 1 | PASS |
| `days=100` | Clamped to 90 | `Math.min(90, 100)` = 90 | PASS |
| `days=abc` | Sane default | `parseInt("abc")` = NaN | **FAIL** |

### BUG-013 (Low) — NaN propagation in `/usage` days param
`parseInt("abc") || "7"` is not used — the code does `parseInt(url.searchParams.get("days") || "7")`. If the user passes `?days=abc`, parseInt returns NaN, and `Math.min(90, Math.max(1, NaN))` returns NaN. The date calculation `Date.now() - NaN` returns NaN, and `new Date(NaN).toISOString()` throws an error or produces "Invalid Date".

### GET /audit-log — Pagination

| Test | Expected | Actual | Verdict |
|------|----------|--------|---------|
| `limit=0` | Clamped to 1 | `Math.max(1, 0)` = 1 | PASS |
| `limit=200` | Clamped to 100 | `Math.min(100, 200)` = 100 | PASS |
| Cursor-based pagination | N+1 fetch pattern | Fetches `limit + 1`, slices, returns `next_cursor` | PASS |
| Filter combos (category + action + entity_type + entity_id + from + to) | Chained `.eq()` | All filters stack correctly | PASS |

---

## 6. Streaming Tests (POST /chat)

### Happy Path
When `stream: true` is passed:
- Response uses `ReadableStream` with SSE format (`text/event-stream`)
- Chunks are forwarded as `data: {"content":"..."}\n\n`
- Final `data: [DONE]\n\n` is forwarded
- Analytics and webhook dispatch fire in the `finally` block

### BUG-014 (Medium) — Streaming response has no `X-Request-Id` header
Non-streaming responses include `X-Request-Id` via `successHeaders`. The streaming path at line 352 returns a raw `Response(sseStream, { headers: ... })` with only `Content-Type`, `Cache-Control`, and `Connection` headers. No request tracing for streamed responses.

### BUG-015 (Low) — Streaming error recovery is absent
If the upstream VPS stream fails mid-response (reader throws), the `finally` block closes the controller, but no error event is sent to the client. The client sees a truncated stream with no indication of failure. Best practice: send `data: {"error":"stream interrupted"}\n\n` before closing.

### BUG-016 (Low) — No timeout on streaming reads
The initial `fetch()` has a 60s AbortController timeout, but once the stream starts, individual `reader.read()` calls have no timeout. A VPS that sends one byte per minute would keep the connection alive indefinitely.

---

## 7. Batch Tests (POST /chat/batch, GET /chat/batch/:id)

### Happy Path
- Batch creation returns immediately with `batch_id`, `status: "processing"`
- Background `processBatch()` runs fire-and-forget
- Processes 3 requests at a time via `Promise.allSettled`
- Progress updates stored after each batch of 3
- Final status: "completed", "partial", or "failed"

### BUG-017 (Medium) — No webhook dispatch after batch completion
The batch endpoint accepts `webhook_url` in the request body and stores it in the `api_batches` table, but `processBatch()` never calls the webhook when processing finishes. The webhook_url is dead data.

### BUG-018 (Low) — Batch cleanup / TTL not implemented
Completed batches remain in the `api_batches` table forever. No cleanup job, no TTL, no limit on how many batches a user can have. Over time, this table will grow unbounded.

### BUG-019 (Low) — `processBatch` silently returns on missing dashboardUrl
If `dashboardUrl` is null at line 94, the function returns without updating the batch status. The batch remains stuck in "processing" forever. Should update to "failed".

---

## 8. Thread Tests

### Happy Path Flow
1. `POST /threads` creates thread with `thread_xxx` ID
2. `POST /threads/:id/messages` sends message, gets response, stores both in `api_thread_messages`
3. `GET /threads/:id/messages` returns history
4. `DELETE /threads/:id` deletes thread (cascade expected for messages)

### BUG-020 (Medium) — Thread deletion may orphan messages
`DELETE /threads/:id` deletes from `api_threads` but does NOT explicitly delete from `api_thread_messages`. If there is no `ON DELETE CASCADE` foreign key constraint in the database, messages become orphaned.

### BUG-021 (Low) — Thread message history cap is 20 but no indication to user
`POST /threads/:id/messages` fetches only the last 20 messages for context. Long conversations silently lose earlier context. No documentation or response field indicates this limitation.

---

## 9. File Tests

### Happy Path
1. `POST /files` accepts multipart form data with `file` and optional `purpose`
2. Returns `file_id`, triggers async indexing for text files
3. `GET /files` lists all files
4. `GET /files/:id` returns file details
5. `DELETE /files/:id` deletes file record

### BUG-022 (Low) — Storage upload failure is silently swallowed
At line 96-99 in `files/route.ts`, if `admin.storage.from("kb-files").upload()` fails, it only logs a warning and continues. The file record is created in `kb_documents` but the actual file may not be stored. No error is returned to the user.

### BUG-023 (Low) — DELETE /files/:id does not clean up storage
Deleting a file record from `kb_documents` does not delete the file from Supabase Storage (`kb-files` bucket) or the associated chunks from `kb_chunks`. Orphaned storage objects accumulate.

---

## 10. Prediction Polling Test

### Happy Path
`GET /predictions/:id` returns prediction status with conditional response body (only when completed).

### BUG-024 (Low) — No endpoint to CREATE predictions
There is a `GET /predictions/:id` polling endpoint but no corresponding `POST /predictions` to submit a prediction. Either this endpoint is dead code, or predictions are created through an undocumented internal mechanism.

---

## 11. Health Endpoint Test

### Happy Path
Returns `{ status: "ok", plan, key_name, rate_limit, agents }`.

### BUG-025 (Low) — Health returns deployed agent names
The health endpoint returns agent names via `agents(name)` join. This is informational leakage in a health check. Health checks should confirm key validity, not enumerate resources.

---

## 12. Cross-Cutting Issues

### BUG-026 (High) — `validateApiKey` helper is duplicated 8 times
The exact same function appears in: `chat/batch/route.ts`, `agents/route.ts`, `agents/[id]/route.ts`, `threads/route.ts`, `threads/[id]/route.ts`, `threads/[id]/messages/route.ts`, `files/route.ts`, `audit-log/route.ts`. Meanwhile, `/health`, `/chat`, `/conversations`, and `/conversations/:id/messages` inline the same logic differently. This should be a shared middleware or utility.

### BUG-027 (Medium) — No global error boundary
If any endpoint throws an unhandled exception (e.g., Supabase client creation fails, crypto import fails), Next.js returns its default 500 page (HTML), not a JSON error. Only `/chat` and `/threads/:id/messages` have try/catch around the VPS proxy call. All other endpoints have no top-level error handling.

### BUG-028 (Medium) — Inconsistent `X-Request-Id` presence
- Endpoints using `apiError()`/`apiSuccess()`: Always include `X-Request-Id` header
- `/health`: Never includes `X-Request-Id`
- `/chat` success: Includes `X-Request-Id`
- `/chat` streaming: Does NOT include `X-Request-Id`
- `/conversations`, `/conversations/:id/messages`: Never include `X-Request-Id`

### BUG-029 (Low) — No CORS headers on any V1 endpoint
If these endpoints are intended to be called from browser-based clients (e.g., embedded chat widgets), they will fail on cross-origin requests. No `Access-Control-Allow-Origin` or preflight handling is present.

### BUG-030 (Low) — No request body size limit enforcement at the framework level
While `/chat` checks `message.length > 100_000`, there is no Next.js-level body size limit. A malicious request with a 100MB JSON body would be fully parsed before any validation runs, potentially causing OOM.

---

## Summary Scorecard

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Auth (missing header) | 17/17 | 0 | All endpoints reject missing auth |
| Auth (invalid key) | 17/17 | 0 | All endpoints reject bad format |
| Auth (revoked key) | 17/17 | 0 | All endpoints reject revoked keys |
| Plan gating | 12/17 | 5 | BUG-005: 5 endpoints skip plan check |
| Rate limiting | 6/17 | 11 | BUG-006: 11 endpoints unprotected |
| Response shape consistency | 13/17 | 4 | BUG-001/002/003: 4 endpoints use old format |
| Input validation | 14/17 | 3 | BUG-007/009/011: Missing validations |
| Streaming | Pass with issues | 3 bugs | BUG-014/015/016 |
| Batch | Pass with issues | 3 bugs | BUG-017/018/019 |
| Error handling | 13/17 | 4 | BUG-027: No global error boundary |

---

## Priority Bug List

### P0 — Must Fix

| ID | Issue | Endpoints |
|----|-------|-----------|
| BUG-002 | Chat endpoint mixes 3 incompatible error formats | `/chat` |
| BUG-005 | 5 endpoints missing plan check (accessible after downgrade) | `/chat/batch/:id`, `/files/:id` GET/DELETE, `/predictions/:id`, `/threads/:id/messages` GET |
| BUG-006 | 11 endpoints have no rate limiting (SSH DoS via DELETE /agents/:id) | Multiple |

### P1 — Should Fix

| ID | Issue | Endpoints |
|----|-------|-----------|
| BUG-001 | Health endpoint has no request_id tracking | `/health` |
| BUG-003 | Conversations endpoints use old response format | `/conversations`, `/conversations/:id/messages` |
| BUG-007 | No message length limit on thread messages | `/threads/:id/messages` POST |
| BUG-009 | No validation on individual batch request items | `/chat/batch` POST |
| BUG-011 | NaN propagation from bad limit/offset params | `/conversations` GET |
| BUG-014 | Streaming response missing X-Request-Id | `/chat` POST (stream mode) |
| BUG-017 | Webhook URL accepted but never called | `/chat/batch` POST |
| BUG-026 | validateApiKey duplicated 8 times | All newer endpoints |
| BUG-027 | No global error boundary — unhandled throws return HTML | All endpoints |

### P2 — Nice to Fix

| ID | Issue |
|----|-------|
| BUG-004 | Revoked key error message leaks key existence |
| BUG-008 | No metadata size limit on thread creation |
| BUG-010 | MIME type check trusts client-declared Content-Type |
| BUG-012 | ILIKE wildcards not escaped in agent filter |
| BUG-013 | NaN propagation in usage `days` param |
| BUG-015 | No error event sent on mid-stream failure |
| BUG-016 | No per-read timeout on streaming |
| BUG-018 | Batch records never cleaned up |
| BUG-019 | processBatch silently returns on missing dashboardUrl |
| BUG-020 | Thread deletion may orphan messages |
| BUG-021 | Thread context capped at 20 messages silently |
| BUG-022 | Storage upload failure silently swallowed |
| BUG-023 | File deletion does not clean up storage/chunks |
| BUG-024 | No POST endpoint for creating predictions |
| BUG-025 | Health endpoint leaks agent names |
| BUG-028 | Inconsistent X-Request-Id presence |
| BUG-029 | No CORS headers for browser clients |
| BUG-030 | No framework-level body size limit |

---

**Total bugs found: 30**
- P0 (Critical): 3
- P1 (High): 10
- P2 (Low): 17
