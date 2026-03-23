# Agent 31 — V1 API — QA Tester Review
**Total Issues Found: 18**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 6 / LOW: 4

---

### [QA-01] — Rate limiter never actually records hits, always allows requests
**File:** `src/lib/rate-limit.ts:74-82`
**Severity:** CRITICAL
**Description:** The `rateLimit()` function checks remaining capacity via `getRateLimitStatus()` but never actually records the new hit. It reads the timestamps array from the `store` Map but never pushes a new timestamp into it. Every call will see the same count (zero hits), so the rate limiter will always return `{ success: true }` and never enforce limits.
**Steps to Reproduce:** Send 1000 requests in 1 second with the same API key. All will succeed because no timestamps are ever written to the in-memory store.
**Expected vs Actual:**
- Expected: After N requests equal to the limit, subsequent requests should get 429 "Rate limit exceeded".
- Actual: All requests pass because `rateLimit()` never mutates the store — it only reads.

---

### [QA-02] — Batch POST returns "processing" status but batch is already complete
**File:** `src/app/api/v1/chat/batch/route.ts:89-99`
**Severity:** HIGH
**Description:** The `processBatch()` call on line 90 is `await`ed, meaning the entire batch finishes executing before the response on line 92 is returned. However, the response hardcodes `status: "processing"` and `completed: 0, failed: 0`. By the time the client receives this response, the batch has already completed in the DB with its real status. The response body is a lie.
**Steps to Reproduce:** Submit a batch of 2 messages. The HTTP response will say `{ status: "processing", completed: 0 }` even though all messages have already been processed.
**Expected vs Actual:**
- Expected: Either return the actual final status, or process in the background (don't await) so the status is genuinely "processing" when returned.
- Actual: Response says "processing" but DB already says "completed" or "partial".

---

### [QA-03] — Predictions endpoint creates records but never processes them
**File:** `src/app/api/v1/predictions/route.ts:7-44`
**Severity:** CRITICAL
**Description:** The POST handler creates a prediction record with `status: "pending"` in the `api_predictions` table but never actually triggers any processing. There is no background worker, no queue dispatch, no call to the VPS, and no webhook. The prediction will remain "pending" forever.
**Steps to Reproduce:** POST to `/api/v1/predictions` with a valid input. Poll GET `/api/v1/predictions/:id`. It will always return `status: "pending"`.
**Expected vs Actual:**
- Expected: The prediction should eventually transition to "completed" or "failed".
- Actual: Prediction stays "pending" indefinitely — the feature is non-functional.

---

### [QA-04] — Thread messages POST has no content moderation unlike chat endpoint
**File:** `src/app/api/v1/threads/[id]/messages/route.ts:58-187`
**Severity:** HIGH
**Description:** The `/v1/chat` POST endpoint applies content moderation via `moderateApiInput()` (line 76-81 in chat/route.ts), but the thread messages POST endpoint sends user messages directly to the VPS without any moderation check. This allows bypassing content policy by using threads instead of direct chat.
**Steps to Reproduce:** Send a harmful message via POST `/api/v1/threads/:id/messages` that would be blocked by POST `/api/v1/chat`.
**Expected vs Actual:**
- Expected: Content moderation applied consistently across all chat-like endpoints.
- Actual: Thread messages endpoint has no moderation, allowing policy bypass.

---

### [QA-05] — Batch processing does not validate agent existence before proxying
**File:** `src/app/api/v1/chat/batch/route.ts:139-153`
**Severity:** MEDIUM
**Description:** In `processBatch()`, the agent slug is derived directly from user input (`req.agent || "default"`) and passed to the VPS as `openclaw:${agentSlug}` without verifying the agent exists or is deployed. The main chat endpoint validates agents against the `user_agents` table, but batch skips this. An invalid agent name will produce a cryptic "Failed to get response from agent" error rather than a clear "agent not found".
**Steps to Reproduce:** Submit a batch with `agent: "nonexistent_agent"`. The batch item will fail with a generic error.
**Expected vs Actual:**
- Expected: Clear "Agent not found" error per batch item, or pre-validate all agents before processing.
- Actual: Generic upstream error that doesn't tell the user what went wrong.

---

### [QA-06] — Conversations list advertises "cursor-based pagination" but implements offset-based
**File:** `src/app/api/v1/conversations/route.ts:5,38`
**Severity:** LOW
**Description:** The doc comment on line 5 says "cursor-based pagination" and line 38 returns `next_cursor: null` in the empty result case, but the implementation uses `offset` and `limit` query params (offset-based pagination). The `next_cursor` field only appears in the empty-result branch and is never returned in the normal success path on line 59. This is a documentation/API contract inconsistency.
**Steps to Reproduce:** Call GET `/api/v1/conversations` and observe offset/limit params are used, not cursors.
**Expected vs Actual:**
- Expected: Either implement cursor-based pagination or fix the comment and remove `next_cursor`.
- Actual: Mixed signals — comment says cursor, implementation uses offset, `next_cursor` appears only in edge case.

---

### [QA-07] — Thread messages POST doesn't use per-tag rate limit like other endpoints
**File:** `src/app/api/v1/threads/[id]/messages/route.ts:66`
**Severity:** MEDIUM
**Description:** The POST handler for thread messages calls `validateV1Auth(request)` with no rate limit tag or override (line 66), while every other endpoint uses a specific tag and limit. This means thread message sends share the generic `apikey:<id>` rate limit bucket with the main `/v1/chat` endpoint. A user sending thread messages and chat messages simultaneously would compete for the same rate limit pool, and the combined rate is the key's base RPM rather than a specific per-endpoint limit.
**Steps to Reproduce:** Send messages via both `/v1/chat` and `/v1/threads/:id/messages` concurrently. They consume from the same rate limit bucket.
**Expected vs Actual:**
- Expected: Thread messages should have their own rate limit tag (e.g., `"thread_messages"`).
- Actual: Shares the default `apikey:<id>` bucket with `/v1/chat`.

---

### [QA-08] — File upload continues after storage upload failure
**File:** `src/app/api/v1/files/route.ts:131-134`
**Severity:** HIGH
**Description:** When the Supabase storage upload fails (line 131), the code only logs a warning and continues to create the KB document record with the `storage_path` pointing to a non-existent file. The response returns `status: "processing"` but the file content may never be retrievable. For binary files (PDF, images) that can't be extracted as text, the document record points to nothing.
**Steps to Reproduce:** Upload a PDF file when the storage bucket doesn't exist or storage is misconfigured. The document record is created, indexing is not attempted (PDF has no text extraction path here), and the file is permanently lost.
**Expected vs Actual:**
- Expected: Return an error if the storage upload fails, or at minimum set a different status.
- Actual: Success response returned despite file content being lost.

---

### [QA-09] — File upload missing text extraction for PDF files
**File:** `src/app/api/v1/files/route.ts:142-163`
**Severity:** HIGH
**Description:** The text extraction logic on line 142 only handles `text/plain`, `text/markdown`, `text/csv`, and `application/json`. PDF files (`application/pdf`) — which are listed as an allowed type — are never extracted or indexed. The document record is created with `status: "processing"` but no indexing ever occurs, so it stays in "processing" until the stale threshold marks it as "failed" after 5 minutes.
**Steps to Reproduce:** Upload a PDF file via POST `/api/v1/files`. Check its status after 5 minutes — it will be "failed".
**Expected vs Actual:**
- Expected: PDF files should be parsed and indexed, or the API should clearly indicate PDFs are not yet supported for KB indexing.
- Actual: PDF is accepted, appears to work, then silently fails after 5 minutes.

---

### [QA-10] — Audit log exposes IP addresses via API without access control
**File:** `src/app/api/v1/audit-log/route.ts:25,54`
**Severity:** MEDIUM
**Description:** The audit log endpoint returns `ip_address` in every entry (line 54). Any user with a Pro+ API key can retrieve IP addresses from their audit log. While these are the user's own IPs, if shared accounts or team access is ever implemented, one team member could see another's IP addresses. Additionally, the field is selected from the DB (line 25) and returned directly without any consideration.
**Steps to Reproduce:** Call GET `/api/v1/audit-log` and observe `ip_address` in each entry.
**Expected vs Actual:**
- Expected: IP addresses should be masked or omitted unless the caller has elevated permissions.
- Actual: Full IP addresses returned to any authenticated API caller.

---

### [QA-11] — Agent DELETE silently succeeds even when SSH undeploy fails
**File:** `src/app/api/v1/agents/[id]/route.ts:69-77`
**Severity:** MEDIUM
**Description:** When the SSH `undeployAgent` call fails (line 75 catch block is empty), the handler still marks the agent as undeployed in the database (line 80) and returns success. The agent process may still be running on the VPS but the DB says it's undeployed. The user has no indication that the actual undeploy failed.
**Steps to Reproduce:** Call DELETE `/api/v1/agents/:id` when the VPS SSH is unreachable. The response says `{ undeployed: true }` but the agent is still running.
**Expected vs Actual:**
- Expected: At minimum, return a warning that the agent was marked as undeployed in the DB but the VPS undeploy failed.
- Actual: Silent success with no indication of partial failure.

---

### [QA-12] — Chat endpoint default agent selection is non-deterministic
**File:** `src/app/api/v1/chat/route.ts:118-124`
**Severity:** MEDIUM
**Description:** When no `agent` parameter is provided, the code queries for the first deployed agent with `.limit(1).single()` but without an explicit `.order()`. The result is non-deterministic — Supabase returns rows in no guaranteed order. Different requests could route to different agents depending on database internals.
**Steps to Reproduce:** Deploy 3 agents. Send POST `/api/v1/chat` without `agent` field multiple times. The response may come from different agents.
**Expected vs Actual:**
- Expected: Consistent default agent selection (e.g., order by `deployed_at` ascending to pick the first deployed, or order by name).
- Actual: Non-deterministic selection due to missing ORDER BY clause.

---

### [QA-13] — Batch processing doesn't clean up on VPS unavailability
**File:** `src/app/api/v1/chat/batch/route.ts:117-124`
**Severity:** MEDIUM
**Description:** When the VPS is not running or has no dashboard URL (lines 117-123), the `processBatch` function updates the batch status to "failed" (line 118) but only in the VPS-not-running case. When `dashboardUrl` is null (line 123), it just `return`s without updating the batch status, leaving it stuck as "processing" forever.
**Steps to Reproduce:** Have a VPS with no `openclaw_dashboard_url` and no `hostname`. Submit a batch. It will stay in "processing" status indefinitely.
**Expected vs Actual:**
- Expected: Batch should be marked as "failed" when the dashboard URL cannot be determined.
- Actual: Batch stays in "processing" forever.

---

### [QA-14] — Thread messages include the just-inserted user message in history sent to model
**File:** `src/app/api/v1/threads/[id]/messages/route.ts:86-101`
**Severity:** LOW
**Description:** The user message is inserted into `api_thread_messages` on line 88, then the conversation history is fetched on lines 96-101 (last 20 messages descending, reversed). Since the user message was just inserted, it will be included in the `history` array. This means the user's message appears in the `messages` array sent to the model as part of history, which is the intended behavior for multi-turn. However, if the insert is slow or there's eventual consistency, the just-inserted message may not appear, making the model miss the user's current message. There's a race condition between the insert and the select.
**Steps to Reproduce:** Under high DB load, the select may execute before the insert is fully committed (though Supabase typically ensures sequential consistency within the same client).
**Expected vs Actual:**
- Expected: History always includes the latest user message.
- Actual: Under edge conditions, the latest user message could be missing from history.

---

### [QA-15] — Idempotency key length validation allows empty string
**File:** `src/app/api/v1/chat/route.ts:34`
**Severity:** LOW
**Description:** The idempotency check on line 34 requires `idempotencyKey && idempotencyKey.length <= 64`. An empty string is falsy in JavaScript so it won't enter the block, which is fine. However, a single-character key like `"a"` is valid. More importantly, there's no minimum length validation — a key like `"1"` would create collisions between different users sending the same trivial key. The `checkIdempotency` function is called with `apiKey.user_id` as a namespace (line 35), so cross-user collision is prevented, but single-character keys from the same user are fragile.
**Steps to Reproduce:** Send two different messages with `X-Idempotency-Key: 1`. The second will return the first's cached response.
**Expected vs Actual:**
- Expected: A reasonable minimum length (e.g., 8+ characters) or UUID format enforcement.
- Actual: Any string 1-64 characters is accepted.

---

### [QA-16] — Batch webhook sends full results payload including all response content
**File:** `src/app/api/v1/chat/batch/route.ts:218-232`
**Severity:** HIGH
**Description:** The webhook callback on line 221-229 sends the full `results` array (including all agent response content) to the user-provided `webhook_url`. While there is SSRF protection against private IPs (line 66), the webhook could be any public URL — including one controlled by an attacker who obtained a victim's API key. The full conversation content is sent in cleartext to an arbitrary URL. If a key is compromised, the attacker can configure a webhook to exfiltrate all batch responses.
**Steps to Reproduce:** Create a batch with `webhook_url` pointing to an attacker-controlled server. All batch results (including agent responses) are POSTed there.
**Expected vs Actual:**
- Expected: Webhook should send only a notification with batch_id and status, requiring the client to fetch results via the authenticated API.
- Actual: Full response content is sent to the unverified webhook URL.

---

### [QA-17] — Usage endpoint fetches all analytics rows into memory
**File:** `src/app/api/v1/usage/route.ts:16-19`
**Severity:** MEDIUM (performance)
**Description:** The usage endpoint queries `agent_analytics` for all rows within the time range (up to 90 days) with no pagination or limit. A heavily-used API key could have millions of analytics rows. All of them are loaded into Node.js memory for client-side aggregation (lines 26-33). This could cause OOM errors or extreme latency.
**Steps to Reproduce:** Have an API key with 100k+ analytics entries over 90 days. Call GET `/api/v1/usage?days=90`. The query will load all rows into memory.
**Expected vs Actual:**
- Expected: Use a DB-level GROUP BY aggregation or materialized view, or at minimum paginate/limit the query.
- Actual: Unbounded SELECT loads all rows into memory.

---

### [QA-18] — Auth validation leaks key hash prefix in server logs
**File:** `src/lib/v1-auth.ts:78`
**Severity:** LOW
**Description:** On auth failure (key not found), the code logs the first 16 characters of the SHA-256 hash: `key_hash: ${keyHash.slice(0, 16)}...`. While this is a hash prefix (not the raw key), logging hash prefixes in server logs could aid an attacker with log access in performing offline brute-force attacks against the key space, especially since keys have a known format (`clw_` prefix, 36 chars total, meaning only 32 chars of entropy).
**Steps to Reproduce:** Send a request with an invalid API key. Server logs will contain the first 16 hex chars of the key's SHA-256 hash.
**Expected vs Actual:**
- Expected: Log only a short prefix of the raw key (already done on line 53) or omit the hash entirely.
- Actual: Hash prefix is logged, providing additional information to attackers with log access.
