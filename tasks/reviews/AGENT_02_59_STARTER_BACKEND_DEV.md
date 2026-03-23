# Agent 02 — 59-Starter Dashboard — Backend Developer Review

**Reviewer:** Backend Developer (Agent 02)
**Date:** 2026-03-21
**Files Reviewed:**
- All files under `src/app/api/vps/`, `src/app/api/agents/`, `src/app/api/keys/`, `src/app/api/channels/`, `src/app/api/chat/`, `src/app/api/tickets/`, `src/app/api/account/`, `src/app/api/payments/`
- `src/lib/ssh.ts`, `src/lib/rate-limit.ts`, `src/lib/provision-v3.ts`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 5 |
| MEDIUM | 6 |
| LOW | 4 |

---

## CRITICAL Issues

### [C01] — SSRF via SSL Certificate Check
**File:** `src/app/api/vps/ssl-check/route.ts:36`
**Description:** The `checkSSL()` function accepts a `hostname` from the database and immediately makes an HTTPS request to it (`hostname: vps.hostname, port: 443`). There is no validation that the hostname is a legitimate ClawHQ VPS domain. An attacker with write access to `vps_instances` (e.g., via a compromised admin account or SQL injection elsewhere) could set a malicious hostname like `169.254.169.254` (AWS metadata), `localhost`, or an internal IP, causing the Next.js server to make arbitrary HTTPS requests to internal infrastructure.
**Severity:** CRITICAL
**Code:**
```ts
const certInfo = await checkSSL(vps.hostname); // vps.hostname from DB, no validation
```
**Suggested Fix:** Validate that `vps.hostname` matches a known pattern (e.g., ends with the platform domain, or validate against a allowlist of approved TLDs). Alternatively, resolve the hostname via DNS and verify the resolved IP is in the expected CIDR range or belongs to the Hostinger/Cloudflare infrastructure.

---

### [C02] — Missing Auth Check on GET /api/vps/scheduled-restart
**File:** `src/app/api/vps/scheduled-restart/route.ts:11`
**Description:** The GET handler for `/api/vps/scheduled-restart` does not call `rateLimit()` or any authentication. Every authenticated user can hit it, but the concern is that it reads from the database and exposes the user's restart schedule. More critically, the DELETE handler does call `rateLimit` but does not validate any input. Actually, re-checking — DELETE does auth check via `createClient().auth.getUser()`. But the GET handler is accessible to any authenticated user without proper user scoping in the rate limit key or the query. The `rateLimit` key uses `user.id` which is fine, but there is no check that the user has a VPS before querying.
**Severity:** CRITICAL — Actually reviewing again: GET does check auth (`if (!user) return 401`) at line 16. The 401 is present. Let me reclassify.

Re-evaluating: GET at line 16 checks auth. DELETE at line 159 checks auth. POST at line 46 checks auth. All three have auth. The only issue is that the GET query `admin.from("scheduled_restarts").select(...).eq("user_id", user.id)` could return null if no schedule exists, which is fine. This is not a critical issue.

Let me reclassify: No critical issue here. Moving on.
**Severity:** MEDIUM — No VPS existence check before returning schedule data (information exposure of existence of a schedule even if user hasn't deployed).
**Suggested Fix:** Check that user has a VPS before returning schedule data.

---

## HIGH Issues

### [H01] — Missing Input Validation: `agent_id` in Chat Send
**File:** `src/app/api/chat/send/route.ts:46-63`
**Description:** The `agent_id` from the request body is used directly to query `user_agents` without validating that the UUID format is correct or that the requesting user actually owns that `agent_id`. While the query `.eq("user_id", user.id).eq("agent_id", agent_id)` ensures ownership, if the `agent_id` is malformed, Supabase may return unexpected errors. More importantly, the `message` field has a max length of 10000 but no content validation — HTML/script tags could be stored and rendered elsewhere.
**Severity:** HIGH
**Code:**
```ts
const { agent_id, message, new_session } = body as { agent_id?: string; message?: string; new_session?: boolean; };
// ...
if (!agent_id || !message?.trim()) { /* ... */ }
if (message.length > 10000) { /* ... */ }
const { data: userAgent } = await admin.from("user_agents").select("...").eq("user_id", user.id).eq("agent_id", agent_id).eq("deployed", true).single();
```
**Suggested Fix:** Add UUID format validation for `agent_id`. Sanitize or strip HTML from message content before storage, or ensure any rendering of `chat_messages.content` escapes HTML.

---

### [H02] — Wrong Column Name in Account Export (channels)
**File:** `src/app/api/account/export/route.ts:49`
**Description:** The query selects `platform` from the `channels` table, but the schema uses `channel_type` for all channel routes. This silently returns `null` for that field. Similarly, the `chat_messages` query uses `session_id` which may not be the correct column for grouping sessions (most chat routes use `conversation_id`).
**Severity:** HIGH
**Code:**
```ts
admin
  .from("channels")
  .select("platform, status, created_at")  // "platform" does not exist in channels table
  .eq("user_id", user.id),
```
Also in the same file:
```ts
admin.from("chat_messages")
  .select("session_id, content, created_at", { count: "exact" })
  .eq("user_id", user.id)
  .eq("agent_id", agentId)  // chat_messages may not have agent_id column
```
**Suggested Fix:** Replace `platform` with `channel_type`. Verify `session_id` column exists in `chat_messages` or use `conversation_id` with a join.

---

### [H03] — In-Memory Rate Limiting on Serverless (DURABLE)
**File:** `src/lib/rate-limit.ts:28`
**Description:** The synchronous `rateLimit()` function uses an in-memory `Map<string, number[]>` (`store`) for all rate limiting. On serverless platforms (Vercel, AWS Lambda), each cold start creates a fresh instance with an empty `store`, completely bypassing rate limits until the in-memory state is built up. The Supabase-backed `rateLimitAsync()` exists but is NOT used by any of the dashboard API routes — they all use the synchronous `rateLimit()`. An attacker can exploit cold starts to bypass rate limits entirely.
**Severity:** HIGH
**Code:**
```ts
const store = new Map<string, number[]>();
// All routes use rateLimit(identifier, limit, windowMs) — synchronous, in-memory only
```
**Suggested Fix:** Replace all synchronous `rateLimit()` calls with `await rateLimitAsync()` in security-critical paths (auth, payments, key management, account deletion).

---

### [H04] — Scheduled Restart Route: No Plan Access Check
**File:** `src/app/api/vps/scheduled-restart/route.ts`
**Description:** None of the three handlers (GET, POST, DELETE) check whether the user is on a plan that supports scheduled restarts. Any user (including Starter plan) can create, view, and delete their scheduled restart configuration. This feature may be intended for Pro+ only.
**Severity:** HIGH
**Code:**
```ts
// GET handler: no hasAccess() check
const { data: schedule, error } = await admin.from("scheduled_restarts").select("...").eq("user_id", user.id).maybeSingle();
// POST handler: no hasAccess() check
```
**Suggested Fix:** Add `hasAccess(plan, "pro")` check to POST handler. Consider whether GET/DELETE should also be gated.

---

### [H05] — No Agent-Ownership Check on Per-Agent Model Update
**File:** `src/app/api/agents/[id]/model/route.ts:37-46`
**Description:** The route verifies the agent belongs to the user via `user_agents` but does not verify the agent is actually deployed. A user could update model config for an agent they own but have not deployed, and the change would be saved to the DB with no effect until deployment.
**Severity:** MEDIUM (related: H01)
**Code:**
```ts
const { data: userAgent } = await admin.from("user_agents").select("id, agent_id, deployed").eq("user_id", user.id).eq("agent_id", id).single();
if (!userAgent) { /* 404 */ }
// No check that userAgent.deployed === true
```
**Suggested Fix:** Either gate this behind a "deployed" check or clarify that model preferences can be set pre-deployment.

---

### [H06] — Race Condition on Agent Purchase
**File:** `src/app/api/agents/purchase/route.ts:64-77`
**Description:** The "already owned" check and the insert are not atomic. Two concurrent requests from the same user for the same free agent could both pass the ownership check and create duplicate `user_agents` entries before either hits the unique constraint (if one exists).
**Severity:** HIGH
**Code:**
```ts
const { data: existing } = await admin.from("user_agents").select("id").eq("user_id", user.id).eq("agent_id", agent_id).single();
if (existing) { return 400 "already owned"; }
// <<< Race window here
const { error: insertError } = await admin.from("user_agents").insert({ user_id: user.id, agent_id, deployed: false });
```
**Suggested Fix:** Use a database unique constraint on `(user_id, agent_id)` and handle the constraint violation error on insert, or use `INSERT ... ON CONFLICT DO NOTHING` with proper error handling.

---

## MEDIUM Issues

### [M01] — N+1 Query in `/api/agents/[id]/stats`
**File:** `src/app/api/agents/[id]/stats/route.ts:44-54`
**Description:** The route fetches `userAgent` then makes a second query for analytics. While not a classic N+1 (no loop over items), the analytics query is a second round-trip that could be avoided by joining in the first query if the analytics table has a user_id index.
**Severity:** MEDIUM
**Code:**
```ts
const { data: userAgent } = await admin.from("user_agents").select("id").eq("user_id", user.id).eq("agent_id", agentId).single();
// ... then:
const { data: analytics } = await admin.from("agent_analytics").select("...").eq("user_id", user.id).eq("agent_id", agentId)...
```
**Suggested Fix:** Combine into a single query or use `Promise.all` if truly parallel. Not critical since both are indexed queries.

---

### [M02] — `channel_id` Upsert Without Constraint Check
**File:** `src/app/api/channels/[id]/routing/route.ts:117-128`
**Description:** The upsert uses `onConflict: "channel_id"` but it's unclear if there is a unique constraint on `channel_id` in the `channel_agent_routing` table. If no constraint exists, this will duplicate rows rather than upsert.
**Severity:** MEDIUM
**Code:**
```ts
await admin.from("channel_agent_routing").upsert({
  channel_id: channelId,
  agent_id,
  priority: 1,
  user_id: user.id,
}, { onConflict: "channel_id" });
```
**Suggested Fix:** Verify the unique constraint exists on `channel_id` (or composite `(channel_id, user_id)`) in the database schema.

---

### [M03] — No Validation of `notification_preferences` Object Structure
**File:** `src/app/api/account/preferences/route.ts:78-79`
**Description:** The `preferences` field from the request body is stored directly without validating its structure. A malicious or malformed preferences object could store arbitrary keys/values.
**Severity:** MEDIUM
**Code:**
```ts
if (preferences) {
  updateData.notification_preferences = preferences; // Stored directly
}
```
**Suggested Fix:** Validate that `preferences` matches the `DEFAULT_PREFERENCES` structure before storing.

---

### [M04] — `channel_connect` Does Not Validate Credential Field Names
**File:** `src/app/api/channels/connect/route.ts:42-45`
**Description:** The `credentials` object from the request is passed directly to `configureChannel()` and then mapped via `CREDENTIAL_FIELD_MAP`. If a credential field name is not in the map, it's passed through as-is. This is generally safe because `configureChannel` writes to the OpenClaw config, but the values themselves (e.g., extremely long tokens) are not validated.
**Severity:** MEDIUM
**Code:**
```ts
const { channel_type, credentials } = body as { channel_type?: string; credentials?: Record<string, string>; };
// credentials passed directly to configureChannel
```
**Suggested Fix:** Add max-length validation for credential string values (e.g., max 2048 chars per field, max 50000 total as done in agent config).

---

### [M05] — `dispatchWebhooks` Called Without Await in `chat/send`
**File:** `src/app/api/chat/send/route.ts:150-155,436-439`
**Description:** `dispatchWebhooks()` is fire-and-forget (`.catch(() => {})`) in `chat/send`. This means if webhook dispatch fails, it is silently ignored. For `session.started` inside the `new_session` block, this is inside an `if (new_session)` block but also fire-and-forget. If webhook delivery is important for downstream integrations, failures should at minimum be logged.
**Severity:** MEDIUM
**Code:**
```ts
dispatchWebhooks(user.id, "session.started", { ... }).catch(() => {});
// and
dispatchWebhooks(user.id, "message.received", { ... }).catch(() => {});
```
**Suggested Fix:** At minimum, log failures: `.catch((e) => console.error("Webhook dispatch failed:", e))`. For critical webhooks, consider making them synchronous or queueing for retry.

---

### [M06] — `enableDashboardEmbedding` Does Not Check VPS Status Before SSH
**File:** `src/app/api/vps/enable-embedding/route.ts:39-44`
**Description:** The route checks `vps.status !== "running"` and returns a 400, which is correct. However, if the VPS status in the DB is stale (e.g., VPS crashed after the status was set to "running"), the SSH connection will fail with a generic 500 error.
**Severity:** MEDIUM
**Code:**
```ts
if (vps.status !== "running") {
  return NextResponse.json({ error: "VPS must be running" }, { status: 400 });
}
// No retry/refresh of VPS status check before SSH
```
**Suggested Fix:** Consider calling `getVM()` from `lib/hostinger.ts` to get a fresh VPS status before attempting SSH, similar to what `vps/status` route does.

---

## LOW Issues

### [L01] — `agent_health`: SSH Without Timeout on DNS Resolution
**File:** `src/app/api/agents/[id]/health/route.ts:71-78`
**Description:** `ssh.connect()` uses `readyTimeout: 10000` but the DNS resolution for `vps.ip_address` is handled by the SSH library with no explicit timeout. If DNS is slow or hijacked, the connection attempt could hang longer than expected.
**Severity:** LOW
**Code:**
```ts
await ssh.connect({
  host: vps.ip_address,
  username: vps.ssh_user,
  password: decryptField(vps.ssh_password),
  port: vps.ssh_port || 22,
  readyTimeout: 10000,
});
```
**Suggested Fix:** Use a DNS resolution check before connecting, or wrap the connection in a timeout.

---

### [L02] — `rebootVPS` in `ssh.ts`: Reboot Scheduling Has No Confirmation
**File:** `src/lib/ssh.ts:1149-1158`
**Description:** The `rebootVPS` function schedules a reboot with `nohup bash -c 'sleep 5 && reboot' &>/dev/null &`. If the SSH connection drops before the reboot fires, there is no confirmation the reboot was scheduled. The function returns `{ success: true }` immediately after the command is sent, not after the reboot completes.
**Severity:** LOW
**Code:**
```ts
await ssh.execCommand("nohup bash -c 'sleep 5 && reboot' &>/dev/null &");
return { success: true }; // Returns before reboot actually happens
```
**Suggested Fix:** Add a comment that this is fire-and-forget. Consider having the caller update VPS status optimistically with a note that the status will sync back after reboot.

---

### [L03] — `analytics/agents` Route Does Not Filter Stale Data
**File:** `src/app/api/agents/analytics/route.ts:44-51`
**Description:** The route fetches analytics rows and filters in JavaScript. If there are thousands of rows, this could be slow. Also, the aggregation logic could produce incorrect results if there are duplicate rows from failed/retried analytics inserts.
**Severity:** LOW
**Code:**
```ts
const { data: rows, error } = await query; // fetches ALL rows for the period
const messages = rows?.filter((r) => r.metric_type === "message") || [];
```
**Suggested Fix:** Use SQL aggregation (`GROUP BY`, `COUNT`, `AVG`) in the Supabase query instead of in-memory filtering.

---

### [L04] — `ssh.ts` `sanitizeFilename`: Incomplete Path Traversal Block
**File:** `src/lib/ssh.ts:372-375`
**Description:** `sanitizeFilename` replaces `..` with `_` but doesn't prevent all path traversal patterns. A filename like `....//....//etc/passwd` would become `......//......//etc/passwd` after the replace, which could still cause issues with some downstream parsing.
**Severity:** LOW
**Code:**
```ts
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, "_");
}
```
**Suggested Fix:** Use a more aggressive approach: after sanitization, verify the resulting filename contains no path separators and is a single component. Or use `path.basename()` to extract just the filename portion.

---

## No Issues Found In

- **`src/app/api/keys/`** — Proper auth, plan checks, input validation, audit logging, correct use of admin client, no request.json() without try/catch
- **`src/app/api/vps/status`** — Correct use of admin client, Hostinger API fallback, proper error handling
- **`src/app/api/vps/restart`**, **`start`**, **`stop`** — Correct VM lifecycle management, dispatchWebhooks fire-and-forget is acceptable for non-critical webhooks
- **`src/app/api/vps/password`** — Good input validation (min/max length), proper SSH password update flow, encrypted storage
- **`src/app/api/vps/uptime`** — Comprehensive uptime calculation, proper SSH cleanup in `finally`
- **`src/app/api/vps/logs`** — Pro plan check, line cap at 500, proper try/catch, rate limiting
- **`src/app/api/agents/deploy`** — Proper ownership verification, agent-vs-builder flow, SSH error handling
- **`src/app/api/agents/undeploy`** — Correct ownership and deployed status checks
- **`src/app/api/agents/config`** — Proper merge of default and custom config, builder_name stripping
- **`src/app/api/agents/generate`** — Pro plan check, VPS running check, proper JSON parsing with strip of thinking tags, 120s timeout
- **`src/app/api/agents/purchase`** — Price check (free agents only), ownership check, proper insert
- **`src/app/api/payments/create-order`** — Server-side audit trail, proper metadata passing, IP logging
- **`src/app/api/payments/verify`** — Server-side order lookup (never trust client metadata), proper payment fulfillment, audit trail
- **`src/app/api/account/password`** — Current password verification via signInWithPassword, proper throwaway client cleanup
- **`src/app/api/account/delete`** — Comprehensive multi-phase cleanup, FK ordering, auth verification, rate limit of 1/hour
- **`src/app/api/account/avatar`** — Magic byte validation for file uploads, emoji validation, proper storage cleanup
- **`src/app/api/tickets/create`** — Proper input validation, orphan ticket cleanup on message insert failure
- **`src/app/api/tickets/list`** — Uses `supabase` (not admin) relying on RLS — correct if RLS policies are in place
- **`src/app/api/tickets/[id]/reply`** — Status check (no replies to closed tickets), proper message trim
- **`src/app/api/tickets/[id]/resolve`** — Uses `supabase` (non-admin) with explicit `eq("user_id", user.id)` — correct RLS approach
- **`src/app/api/tickets/[id]/reopen`** — Same pattern as resolve, uses non-admin client with explicit user scoping
- **`src/app/api/tickets/[id]/rate`** — Rating 1-5 integer validation, only resolved tickets can be rated
- **`src/app/api/tickets/attachment`** — Magic byte validation, signed URL generation, 1-hour expiry, cleanup on error
- **`src/app/api/channels/analytics`** — Proper plan check, in-memory aggregation is acceptable for small datasets
- **`src/app/api/channels/health`** — SSH connection cleanup in finally block, per-channel health status updates
- **`src/app/api/channels/connect`** — Channel type allowlist, admin-setup-only channels blocked, VPS status check
- **`src/app/api/channels/disconnect`** — Channel ownership verification, credentials cleanup
- **`src/app/api/chat/messages`** — Proper conversation lookup, chronological ordering, DELETE clears conversation messages
- **`src/app/api/chat/stream`** — SSE streaming with proper cleanup, fullContent stored after stream ends
- **`src/lib/rate-limit.ts`** — Comments explicitly document the serverless incompatibility and recommend `rateLimitAsync`. The design is sound, the implementation is correct for long-running servers.

---

## Additional Observations

1. **Error response consistency** — Most routes return `{ error: "..." }` with a status code. Some return different shapes (e.g., `ssl-check` returns `{ valid: false, error: "..." }` on catch). This is minor but a shared `ApiError` type would help.

2. **SSH connections not pooled** — Every VPS-facing route creates a new `NodeSSH()` connection. Under high concurrency, this could exhaust SSH connection limits on the VPS. Consider a connection pool or persistent SSH connection manager.

3. **Provision-store uses `globalThis`** — `src/lib/provision-store.ts` uses `globalThis` to persist provisioning jobs across Next.js hot reloads. This is documented as intentional but will reset on true cold starts.

4. **No integration tests observed** — Many routes have complex SSH + DB + external API interactions with no test coverage visible in this review scope.

---

## Top Priority Fixes

1. **[C01]** Add hostname validation in `ssl-check/route.ts` before making HTTPS request
2. **[H03]** Replace synchronous `rateLimit()` with `await rateLimitAsync()` for security-critical routes
3. **[H02]** Fix `platform` → `channel_type` in account export
4. **[H04]** Add plan access check to scheduled-restart POST
5. **[H06]** Add unique constraint or use `ON CONFLICT DO NOTHING` for agent purchase
