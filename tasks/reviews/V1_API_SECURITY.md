# V1 API Security Audit Report

**Date:** 2026-03-16
**Scope:** All endpoints under `src/app/api/v1/` and supporting libraries
**Auditor:** Claude Opus 4.6 (automated)

---

## Summary

17 route handlers across 17 files were audited. **3 CRITICAL**, **5 HIGH**, **6 MEDIUM**, and **4 LOW** severity findings identified. The authentication pattern is largely consistent but has notable gaps, and several injection/DoS vectors exist.

---

## 1. API Key Validation

**Status: INCONSISTENT -- MEDIUM RISK**

The auth pattern (Bearer extract -> format check -> SHA-256 hash -> DB lookup -> active check -> plan check) is implemented in every endpoint, BUT it is **copy-pasted inline** in every route handler rather than centralized into shared middleware. This creates drift risk.

### Observed variations:

| Endpoint | Uses `validateApiKey()` helper? | Uses `apiError()` helper? | Revoked key message |
|---|---|---|---|
| `chat/route.ts` | No (inline) | Mixed (inline JSON + apiError) | "API key has been revoked" |
| `chat/batch/route.ts` | Yes | Yes | "Invalid or revoked API key" |
| `chat/batch/[id]/route.ts` | No (inline) | Yes | "Invalid API key" |
| `health/route.ts` | No (inline) | No (raw NextResponse.json) | "API key has been revoked" |
| `models/route.ts` | No (inline) | Yes | "Invalid or revoked API key" |
| `usage/route.ts` | No (inline) | Yes | "Invalid or revoked API key" |
| `agents/route.ts` | Yes | Yes | "Invalid or revoked API key" |
| `agents/[id]/route.ts` | Yes | Yes | "Invalid API key" |
| `threads/route.ts` | Yes | Yes | "Invalid or revoked API key" |
| `threads/[id]/route.ts` | Yes | Yes | "Invalid API key" |
| `threads/[id]/messages/route.ts` | Yes | Yes | "Invalid API key" |
| `conversations/route.ts` | No (inline) | No (raw NextResponse.json) | "Invalid or revoked API key" |
| `conversations/[id]/messages/route.ts` | No (inline) | No (raw NextResponse.json) | "Invalid or revoked API key" |
| `predictions/[id]/route.ts` | No (inline) | Yes | "Invalid API key" |
| `files/route.ts` | Yes | Yes | "Invalid API key" |
| `files/[id]/route.ts` | No (inline) | Yes | "Invalid API key" |
| `audit-log/route.ts` | Yes | Yes | "Invalid or revoked API key" |

**Recommendation:** Extract the entire auth pipeline (Bearer -> hash -> lookup -> active check -> plan check -> rate limit) into a single `withApiKeyAuth(handler)` wrapper. This eliminates drift and ensures every new endpoint gets the full chain automatically.

---

## 2. Revoked Key Handling

**Status: PASS with caveats**

Every endpoint checks `apiKey.status !== "active"` and returns 401. However, some endpoints merge the invalid/revoked check into a single condition (`!apiKey || apiKey.status !== "active"`), which means a revoked key gets the same error message as a nonexistent key. This is acceptable from a security standpoint (doesn't leak whether a key exists) but inconsistent with `chat/route.ts` which gives a distinct "revoked" message.

**Finding:** `chat/route.ts` lines 47-52 return a distinct `revoked_api_key` code, while `chat/batch/route.ts` line 24 returns `invalid_api_key` for both missing and revoked keys. The distinct message in `chat/route.ts` technically confirms to an attacker that the key once existed.

**Recommendation:** Unify to always return `invalid_api_key` with a generic message. Never confirm a key was previously valid.

---

## 3. Plan Gating

**Status: PASS**

Every endpoint checks that the user's plan is one of `["pro", "ultra", "enterprise"]`. A Starter user will receive a 403.

**Minor note:** The `predictions/[id]/route.ts` endpoint does NOT perform a plan check. It only checks key validity and ownership. A downgraded user could still poll prediction results.

**Recommendation:** Add plan check to `predictions/[id]/route.ts`.

---

## 4. Rate Limiting

**Status: PARTIAL -- HIGH RISK**

### Endpoints WITH rate limiting:
| Endpoint | Identifier | Limit | Window |
|---|---|---|---|
| `chat/route.ts` POST | `apikey:{id}` | Per-key RPM (default 60) | 60s |
| `chat/batch/route.ts` POST | `{user_id}:batch` | 5 | 60s |
| `threads/route.ts` POST | `{user_id}:thread_create` | 30 | 60s |
| `threads/[id]/messages/route.ts` POST | `apikey:{id}` | Per-key RPM | 60s |
| `files/route.ts` POST | `{user_id}:file_upload` | 10 | 60s |
| `audit-log/route.ts` GET | `{user_id}:v1_audit` | 30 | 60s |

### Endpoints WITHOUT rate limiting (CRITICAL):
- `health/route.ts` GET -- can be polled unlimited times
- `models/route.ts` GET -- unlimited DB queries
- `usage/route.ts` GET -- unlimited analytics queries (potentially expensive)
- `agents/route.ts` GET -- unlimited
- `agents/[id]/route.ts` GET/DELETE -- **DELETE has no rate limit; attacker could undeploy all agents rapidly**
- `threads/route.ts` GET -- unlimited list queries
- `threads/[id]/route.ts` GET/DELETE -- **DELETE has no rate limit**
- `threads/[id]/messages/route.ts` GET -- unlimited (only POST is rate-limited)
- `conversations/route.ts` GET -- unlimited
- `conversations/[id]/messages/route.ts` GET -- unlimited
- `predictions/[id]/route.ts` GET -- unlimited polling
- `files/[id]/route.ts` GET/DELETE -- **DELETE has no rate limit**
- `chat/batch/[id]/route.ts` GET -- unlimited polling

### In-Memory Rate Limiter is Not Production-Safe:
The rate limiter (`src/lib/rate-limit.ts`) uses an **in-memory Map**. This means:
1. **Resets on every deployment/restart** -- limits evaporate
2. **Not shared across serverless instances** -- if Next.js runs on multiple workers/lambdas, each has its own Map, effectively multiplying the limit by N workers
3. **Memory leak potential** -- the cleanup runs every 5 minutes and only clears entries older than `2 * windowMs`. Under sustained attack, the Map grows unbounded within each 5-minute window.

**Recommendation:** Replace with Redis-backed rate limiter (e.g., `@upstash/ratelimit`) or at minimum Supabase-backed counters. Add rate limiting to ALL endpoints.

---

## 5. Input Injection

### 5a. SQL Injection via `ilike` -- CRITICAL

**File:** `src/app/api/v1/conversations/route.ts`, line 68:
```typescript
.ilike("name", `%${agent}%`);
```

The `agent` query parameter is interpolated directly into the `ilike` pattern WITHOUT sanitizing SQL wildcard characters (`%`, `_`). While Supabase's PostgREST client parameterizes the value (preventing true SQL injection), the **LIKE pattern wildcards are not escaped**, allowing:
- `agent=___` would match any 3+ character agent name
- `agent=%` would match everything

This is a **pattern injection**, not SQL injection. Risk is information disclosure (listing agents the user shouldn't see by name pattern). However, the query is already scoped to `user_id`, limiting impact.

**Recommendation:** Escape `%` and `_` in the agent parameter: `agent.replace(/%/g, '\\%').replace(/_/g, '\\_')`.

### 5b. Message Field -- LOW RISK

The `message` field in `chat/route.ts` is passed through to the upstream OpenClaw LLM. There is no sanitization for prompt injection. However, this is expected behavior for an LLM API -- the user IS the prompt author. The message IS length-limited to 100,000 characters (line 101).

**Note:** The `threads/[id]/messages/route.ts` POST endpoint does NOT enforce a message length limit. An attacker could send arbitrarily large messages through the thread endpoint.

### 5c. Agent Name -- PASS

`sanitizeAgentName()` in `chat/route.ts` strips all non-alphanumeric characters. This is adequate.

### 5d. Session ID -- PASS

Validated against `/^[a-zA-Z0-9_-]+$/` with max 128 chars (chat/route.ts line 108).

### 5e. Metadata Field -- MEDIUM RISK

`threads/route.ts` line 63 accepts arbitrary JSON as `metadata`:
```typescript
const metadata = (body as any)?.metadata || {};
```
This is stored directly in the database with no schema validation, size limit, or depth limit. An attacker could store massive JSON blobs or deeply nested objects.

**Recommendation:** Validate metadata: max depth, max size (e.g., 4KB), and allowed value types.

---

## 6. Request Size

**Status: CRITICAL -- NO GLOBAL BODY SIZE LIMIT**

Next.js does not enforce a request body size limit by default in the App Router. The only size checks are:
- `chat/route.ts`: `message.length > 100_000` (100KB text check)
- `files/route.ts`: `file.size > MAX_FILE_SIZE` (10MB)

**Missing protections:**
- `chat/batch/route.ts`: No limit on total body size. 50 requests x arbitrary message length = potentially massive payload. Individual message length is NOT validated.
- `threads/[id]/messages/route.ts`: No message length limit.
- `threads/route.ts`: No metadata size limit.
- All `request.json()` calls will parse the entire body into memory before any validation.

**Recommendation:** Add `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }` equivalent for App Router, or check `Content-Length` header early. For App Router, use Next.js route segment config:
```typescript
export const runtime = 'nodejs';
export const maxDuration = 60;
```
And add explicit `Content-Length` checks before parsing.

---

## 7. Streaming Security

**Status: HIGH RISK**

`chat/route.ts` streaming (lines 290-359):

1. **No max duration on the stream itself.** The upstream request has a 60-second `AbortController` timeout, but the SSE stream to the client has NO timeout. If the upstream sends data slowly (1 byte/second), the connection stays open indefinitely.
2. **No max bytes on the stream.** A malicious upstream (compromised VPS) could stream unlimited data.
3. **No rate limit headers on streaming responses.** The streaming response (line 352) does not include `X-RateLimit-*` headers.
4. **Stream errors are swallowed.** The `finally` block closes the controller but doesn't signal errors to the client.

**Recommendation:**
- Add a max stream duration (e.g., 5 minutes) via `setTimeout` on the SSE stream.
- Add max bytes counter; abort if exceeded.
- Return rate limit headers on streaming responses.

---

## 8. Batch API

**Status: MEDIUM RISK**

- **Max batch size: 50** -- enforced (line 44).
- **Rate limit: 5 batches/minute** -- enforced.
- **But:** Individual messages within a batch have NO length validation. An attacker can submit 50 requests each with multi-MB messages.
- **Concurrent batch limit:** Not enforced. A user could submit 5 batches/minute x unlimited minutes = unlimited queued work. There's no check for how many batches are already `processing`.
- **Webhook URL:** The `webhook_url` field is stored but never validated. See finding #13.

**Recommendation:** Validate individual message lengths in batch requests. Enforce max concurrent processing batches per user.

---

## 9. Thread Management (Cross-User Isolation)

**Status: PASS**

All thread queries include `.eq("user_id", apiKey.user_id)`:
- `threads/route.ts` GET: scoped to user
- `threads/[id]/route.ts` GET: `.eq("id", id).eq("user_id", apiKey.user_id)`
- `threads/[id]/route.ts` DELETE: `.eq("id", id).eq("user_id", apiKey.user_id)`
- `threads/[id]/messages/route.ts` GET: verifies thread ownership first
- `threads/[id]/messages/route.ts` POST: verifies thread ownership first

User A cannot read, write, or delete User B's threads.

---

## 10. File Upload

**Status: MEDIUM RISK**

### What's good:
- MIME type allowlist: only 8 types allowed
- Size limit: 10MB enforced
- Files stored in Supabase Storage with user-scoped paths
- User isolation: all queries scoped to `user_id`

### Issues:

**10a. MIME type relies on client-provided `file.type`**
The `file.type` comes from the `Content-Type` in the multipart form. An attacker can set any MIME type. The actual file content is NOT validated (no magic byte checks).

**10b. Filename not sanitized for storage path**
Line 90: `const storagePath = `${apiKey.user_id}/${fileId}/${file.name}`;`
The `file.name` is used directly. While Supabase Storage likely prevents path traversal, a filename like `../../etc/passwd` or containing null bytes could cause issues depending on the storage backend.

**10c. No malicious file detection**
No antivirus scanning. Images could contain steganographic payloads. PDFs could contain JavaScript.

**10d. Text file content injected into indexing without sanitization**
Line 108: Text files are decoded and passed to `indexDocument()`. If the indexer uses the content in SQL or vector DB operations, injection is possible.

**Recommendation:** Validate file content (magic bytes), sanitize filenames, and consider ClamAV scanning for uploaded files.

---

## 11. Agent Management (Cross-User Isolation)

**Status: PASS**

- `agents/route.ts` GET: `.eq("user_id", apiKey.user_id)`
- `agents/[id]/route.ts` GET: `.eq("user_id", apiKey.user_id).eq("agent_id", id)`
- `agents/[id]/route.ts` DELETE: `.eq("user_id", apiKey.user_id).eq("agent_id", id)`

User A cannot access or delete User B's agents.

---

## 12. Idempotency

**Status: MEDIUM RISK**

The idempotency system (`src/lib/idempotency.ts`) exists but is **NOT USED by any V1 endpoint**. No endpoint calls `checkIdempotency()` or `storeIdempotency()`.

### Design review of the library itself:
- **Cross-user isolation: PASS** -- keyed on `(key, user_id)` pair
- **TTL: PASS** -- 24-hour expiry via `expires_at` column, checked with `.gt("expires_at", now)`
- **Brute-force:** The `key` is a free-form string with no length or format validation. An attacker could use very long keys to consume storage. No rate limit on idempotency key creation.
- **Error swallowing:** Line 47 `.then(() => {}, () => {})` silently ignores write failures. A cache miss would cause duplicate processing.

**Recommendation:** Integrate idempotency into mutation endpoints (POST /chat, POST /threads, POST /files). Add key length validation (max 256 chars).

---

## 13. Prediction Callbacks / Webhook URLs

**Status: HIGH RISK -- SSRF**

`chat/batch/route.ts` accepts a `webhook_url` field (line 37) and stores it in the database (line 60). While the current code doesn't appear to call the webhook URL directly in this file (it delegates to `dispatchWebhooks`), the stored URL is never validated.

An attacker could supply:
- `http://169.254.169.254/latest/meta-data/` -- AWS metadata endpoint (SSRF)
- `http://localhost:18789/` -- internal OpenClaw gateway
- `http://10.0.0.1/internal-service` -- internal network scan
- `file:///etc/passwd` -- local file read (depending on HTTP client)

**Recommendation:** Validate webhook URLs:
1. Must be `https://` only
2. Resolve DNS and reject private/reserved IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, ::1)
3. Reject localhost, metadata endpoints
4. Allowlist or require domain verification

---

## 14. Tool Use

**Status: NOT APPLICABLE**

No V1 endpoint currently accepts tool definitions from the API caller. Tool calls appear in thread message storage (`tool_calls`, `tool_results` columns) but these come from the upstream LLM, not from API input. No immediate risk.

---

## 15. Multimodal (Base64 / Image URL)

**Status: NOT APPLICABLE**

No V1 endpoint currently accepts multimodal input (base64 images or image URLs). The chat endpoints only accept a `message` string field. If multimodal support is added later, SSRF via `image_url` and memory bombs via oversized base64 payloads would need to be addressed.

---

## 16. Content Moderation

**Status: HIGH RISK -- NOT INTEGRATED**

The `src/lib/moderation.ts` library exists but is **NOT CALLED by any V1 endpoint**. No message content is checked against the moderation system before being sent to the LLM.

### Library review:
- **Bypass via `config.enabled`:** If `enabled` is `false`, moderation is completely skipped.
- **Keyword list is minimal:** Only ~15 words across 4 categories. Easy to bypass with:
  - Unicode homoglyphs: `ki11` instead of `kill`
  - Spacing: `k i l l`
  - Encoding: base64-encoded content
  - Misspelling: `kil` (partial match not checked for category patterns since they use `\b` word boundaries)
- **No LLM-based moderation:** Only regex. Modern content moderation requires ML classifiers.
- **Custom blocked words use `includes()`:** No word boundary checking. Blocking "ass" would also block "class", "assemble", etc.

**Recommendation:** Integrate moderation into `chat/route.ts` and `threads/[id]/messages/route.ts` POST handlers. Consider using an external moderation API (OpenAI Moderation, Perspective API) for production-grade filtering.

---

## 17. Error Messages / Information Leakage

**Status: MEDIUM RISK**

### Good practices observed:
- Most endpoints use `apiError()` which returns structured error codes without stack traces
- `chat/route.ts` catch block (line 432) returns generic "Internal server error"
- Request IDs are returned for debugging without exposing internals

### Issues:

**17a. Error analytics logs raw error messages**
`chat/route.ts` line 422: `metadata: { error: err instanceof Error ? err.message : "unknown" }` -- Error messages (which could contain SQL errors, connection strings, etc.) are stored in the analytics table. If the analytics data is ever exposed via the usage endpoint, this leaks.

**17b. Batch processing leaks upstream error details**
`chat/batch/route.ts` line 135: `error: err instanceof Error ? err.message : "Unknown error"` -- Raw error messages from fetch failures (which could include internal hostnames, ports, connection details) are stored in batch results and returned to the user via the batch status endpoint.

**17c. `health/route.ts` returns `key_name` and `rate_limit`**
Line 67-71: Returns the key's display name and rate limit. The rate limit disclosure lets attackers know exactly how fast they can go.

**17d. Console.warn statements**
Multiple `console.warn` calls include internal details: `"[v1/chat] increment_api_key_usage failed:"`. While these don't reach the user in API responses, they could appear in logging systems.

**Recommendation:** Sanitize error messages before storing in batch results. Remove rate limit value from health endpoint (return only remaining/reset). Ensure analytics metadata is never exposed via API.

---

## 18. Timing Attacks

**Status: MEDIUM RISK**

The key validation flow has timing differences:

1. **Format check fails fast:** If the key doesn't start with `clw_` or isn't 36 chars, the response returns immediately (no DB query). This is ~0ms.
2. **Hash lookup:** If the format is valid but the key doesn't exist, a DB query runs (~50-200ms).
3. **Active check:** If the key exists but is revoked, the response returns after the DB query.
4. **Plan check:** If the key is valid, an additional DB query runs for the subscription.

An attacker can distinguish:
- Invalid format vs. valid format (timing difference: no DB vs. DB query)
- Nonexistent key vs. existing key (potentially same timing due to `.single()` returning error either way)
- Active key vs. revoked key (extra subscription query for active keys)

**Recommendation:** For public-facing APIs, add a constant-time delay floor (e.g., always take at least 100ms for auth responses). Or accept the risk since the key format prefix (`clw_`) is public knowledge and brute-forcing a 32-char random key is computationally infeasible.

---

## Additional Findings

### 19. No CORS Configuration -- LOW RISK

No CORS headers are set on V1 API responses. This means browser-based JavaScript cannot call these APIs cross-origin. This is actually good for security (prevents CSRF-like attacks from malicious websites using a user's API key). However, if developers need to call the API from frontend apps, they'll need a backend proxy.

### 20. No Request Logging / Audit Trail for Auth Failures -- MEDIUM

Failed authentication attempts are not logged. An attacker could brute-force API keys without detection. The audit log endpoint only exposes existing audit entries; it doesn't create entries for API auth events.

**Recommendation:** Log all authentication failures (IP, timestamp, key prefix) to enable brute-force detection and alerting.

### 21. VPS Credentials in Memory -- LOW RISK

`chat/route.ts` fetches VPS `dashboard_username` and `dashboard_password` from the database on every request. These are used to construct Basic Auth headers to the upstream. While necessary, this means VPS credentials transit through the API server on every chat request.

### 22. No Request Deduplication for Chat

If a client retries a failed request (network timeout), the same message will be processed twice since idempotency is not integrated. This could result in duplicate charges/analytics and duplicate messages in threads.

---

## Priority Fix List

| Priority | Finding | Effort |
|---|---|---|
| **P0 CRITICAL** | #6 -- No global body size limit | Low |
| **P0 CRITICAL** | #13 -- SSRF via webhook_url | Low |
| **P0 CRITICAL** | #5a -- ilike pattern injection in conversations | Low |
| **P1 HIGH** | #4 -- In-memory rate limiter not production-safe | Medium |
| **P1 HIGH** | #4 -- Multiple endpoints missing rate limits | Medium |
| **P1 HIGH** | #7 -- No max duration/bytes on SSE streams | Medium |
| **P1 HIGH** | #16 -- Content moderation not integrated | Medium |
| **P1 HIGH** | #17b -- Batch results leak upstream errors | Low |
| **P2 MEDIUM** | #1 -- Auth logic copy-pasted, not centralized | Medium |
| **P2 MEDIUM** | #5e -- Metadata field no validation | Low |
| **P2 MEDIUM** | #8 -- No concurrent batch limit | Low |
| **P2 MEDIUM** | #10a/10b -- File upload MIME spoofing, filename unsanitized | Low |
| **P2 MEDIUM** | #12 -- Idempotency not integrated | Medium |
| **P2 MEDIUM** | #20 -- No auth failure logging | Medium |
| **P3 LOW** | #2 -- Revoked key message inconsistency | Low |
| **P3 LOW** | #3 -- Predictions endpoint missing plan check | Low |
| **P3 LOW** | #17c -- Health endpoint discloses rate limit | Low |
| **P3 LOW** | #18 -- Timing side-channel on auth | Low |

---

## Files Audited

### Endpoint Routes
- `src/app/api/v1/chat/route.ts`
- `src/app/api/v1/chat/batch/route.ts`
- `src/app/api/v1/chat/batch/[id]/route.ts`
- `src/app/api/v1/health/route.ts`
- `src/app/api/v1/models/route.ts`
- `src/app/api/v1/usage/route.ts`
- `src/app/api/v1/agents/route.ts`
- `src/app/api/v1/agents/[id]/route.ts`
- `src/app/api/v1/threads/route.ts`
- `src/app/api/v1/threads/[id]/route.ts`
- `src/app/api/v1/threads/[id]/messages/route.ts`
- `src/app/api/v1/conversations/route.ts`
- `src/app/api/v1/conversations/[id]/messages/route.ts`
- `src/app/api/v1/predictions/[id]/route.ts`
- `src/app/api/v1/files/route.ts`
- `src/app/api/v1/files/[id]/route.ts`
- `src/app/api/v1/audit-log/route.ts`

### Supporting Libraries
- `src/lib/api-errors.ts`
- `src/lib/idempotency.ts`
- `src/lib/moderation.ts`
- `src/lib/rate-limit.ts`
