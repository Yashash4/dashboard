# Agent 34 — V1 API — Security Auditor Review

**Total Issues Found: 14**
- CRITICAL: 1 / HIGH: 4 / MEDIUM: 5 / LOW: 4

---

## CRITICAL

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| C1 | `src/lib/rate-limit.ts:74-82` | **Rate limiter is completely non-functional** — `rateLimit()` reads timestamps from the in-memory `store` Map but never writes to it. No request timestamp is ever recorded, so `remaining` always equals `limit` and `success` is always `true`. Every V1 API route calls `validateV1Auth()` which uses this broken synchronous `rateLimit()` (v1-auth.ts:121). The API has zero rate limiting protection, enabling unlimited request volume, brute-force attacks, and resource exhaustion. | A04:2021 Insecure Design | `rateLimit()` calls `getRateLimitStatus()` which filters `store.get(identifier)` — but no function ever calls `store.set()` with a new timestamp (line 44 `store.set` is only in `cleanup()`). The function returns `{ success: remaining > 0 }` where `remaining` is always `limit` because the store is always empty for new identifiers. |

## HIGH

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| H1 | `src/lib/v1-auth.ts:102-127` | **Rate limit uses in-memory store on serverless** — Even if the `rateLimit()` bug (C1) were fixed, `validateV1Auth` uses the synchronous in-memory `rateLimit()` instead of the durable `rateLimitAsync()`. On serverless (Vercel), each cold start resets the Map, making rate limits trivially bypassable by waiting for instance rotation. The code comment at rate-limit.ts:50-56 explicitly warns about this. | A04:2021 Insecure Design | Line 121: `const rl = rateLimit(identifier, rpm, 60_000);` — should be `await rateLimitAsync(...)` for the externally-facing API. |
| H2 | `src/app/api/v1/chat/batch/route.ts:214-236` | **DNS rebinding SSRF on webhook callback** — `webhook_url` is validated against private IPs at submission time (line 65-68) using `isPrivateUrl()`, but the actual HTTP request to the webhook happens minutes later (line 218) after batch processing completes. An attacker can register a domain that initially resolves to a public IP (passing validation) then changes DNS to resolve to `127.0.0.1` or `169.254.169.254` (cloud metadata) at callback time. | A10:2021 SSRF | Line 218: `await fetch(batchRecord.webhook_url, ...)` executes against a URL validated potentially minutes earlier. No re-validation or DNS pinning is performed at fetch time. |
| H3 | `src/app/api/v1/threads/[id]/messages/route.ts:82-84` | **No content moderation on thread messages** — The `/api/v1/chat` route applies `moderateApiInput()` (chat/route.ts:76-81) to block harmful content, but the `/api/v1/threads/:id/messages` POST endpoint has no content moderation at all. Attackers can bypass moderation by using threads instead of the chat endpoint. | A04:2021 Insecure Design | Compare chat/route.ts:76 `const modResult = moderateApiInput(message)` with threads/[id]/messages/route.ts which has no such call. |
| H4 | `src/app/api/v1/usage/route.ts:16-19` | **Unbounded query — denial of service via large analytics fetch** — The usage endpoint fetches all `agent_analytics` rows for a key over a 90-day window with no row limit (`select` without `.limit()`). A heavily-used API key could have millions of rows, causing memory exhaustion and timeouts on the server. All rows are loaded into memory for client-side aggregation (lines 26-33). | A04:2021 Insecure Design | Line 16-19: `.select("metric_type, response_time_ms, created_at").eq("api_key_id", apiKey.id).gte("created_at", since)` — no `.limit()` applied. With 90 days of data at high request volume, this could return hundreds of thousands of rows. |

## MEDIUM

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| M1 | `src/app/api/v1/audit-log/route.ts:21-22` | **Unvalidated date parameters enable query manipulation** — The `from` and `to` query parameters are passed directly to Supabase `.gte()` and `.lte()` without format validation. Malformed strings could cause unexpected query behavior or errors that leak information. | A03:2021 Injection | Lines 30-35: `if (from) query = query.gte("created_at", from)` — no ISO-8601 format validation on user input. |
| M2 | `src/app/api/v1/threads/route.ts:51-52` | **No input validation on `agent` field** — Thread creation accepts arbitrary string for `agent` field with no length limit or character validation. Stored directly to database. Could be used for stored XSS if value is rendered in a dashboard, or for data pollution. | A03:2021 Injection | Line 51: `const agent = (body as any)?.agent || "default"` — no sanitization, length check, or character validation before DB insert at line 75-80. |
| M3 | `src/app/api/v1/threads/route.ts:52` | **No validation on `metadata` key names** — While metadata size and depth are validated (lines 55-71), there is no validation on key names. Keys like `__proto__`, `constructor`, or extremely long key names could cause prototype pollution or storage issues. | A03:2021 Injection | Line 52: `const metadata = (body as any)?.metadata || {}` — only size/depth checked, not key names. JSON stored in DB column. |
| M4 | `src/app/api/v1/files/route.ts:125` | **Path traversal in storage path via filename** — The uploaded file's original name (`file.name`) is used directly in the storage path without sanitizing directory traversal characters. A filename like `../../other-user/secret.txt` could potentially write to unintended storage locations. | A01:2021 Broken Access Control | Line 125: `const storagePath = \`\${apiKey.user_id}/\${fileId}/\${file.name}\`` — `file.name` is user-controlled and not sanitized for `../` sequences. Depends on Supabase Storage behavior with path traversal characters. |
| M5 | `src/app/api/v1/chat/route.ts:111-112` | **Agent name reflection without encoding** — The `agent` parameter from user input is reflected in error messages (line 111: `Agent "${agent}" not found`) without HTML encoding. While API responses are JSON (not HTML), this could be problematic if error messages are logged to dashboards or forwarded to other systems. | A03:2021 Injection | Line 111: `return apiError("agent_not_found", \`Agent "\${agent}" not found or not deployed\`, ctx)` — user input reflected in response. |

## LOW

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| L1 | `src/app/api/v1/health/route.ts:24-25` | **API key name and rate limit leaked in health response** — The health endpoint returns `key_name` and `rate_limit` values. While not directly exploitable, this reveals internal configuration that could aid attackers in calibrating their attack rate or identifying key purpose. | A01:2021 Broken Access Control | Lines 24-25: `key_name: apiKey.name, rate_limit: apiKey.rate_limit_per_min` exposed in response. |
| L2 | `src/app/api/v1/audit-log/route.ts:25` | **IP addresses exposed via audit log API** — The audit log endpoint returns `ip_address` for each entry. API consumers may not expect their IP addresses to be queryable, and this could leak information about internal infrastructure if admin actions are logged. | A01:2021 Broken Access Control | Line 25: `select("id, action, entity_type, entity_id, category, details, ip_address, ...")` — IP exposed in response at line 54. |
| L3 | Multiple V1 routes | **No audit trail for destructive API operations** — DELETE operations on agents (`agents/[id]/route.ts:46`), files (`files/[id]/route.ts:39`), and threads (`threads/[id]/route.ts:31`) do not create audit log entries. This makes incident investigation and compliance auditing impossible for API-initiated deletions. | A09:2021 Security Logging and Monitoring Failures | No calls to audit logging functions in any DELETE handler across the V1 API. |
| L4 | `src/lib/v1-auth.ts:59` | **Fixed API key format aids brute force** — API keys must be exactly 36 characters starting with `clw_`, leaving only 32 characters of entropy. While 32 alphanumeric characters is sufficient entropy, the strict format check (line 59: `rawKey.length !== 36`) combined with the prefix reduces the search space. Timing differences between format rejection (line 60-62) and hash lookup rejection (line 76-79) could theoretically leak whether a key has the correct format. | A07:2021 Identification and Authentication Failures | Line 59: `if (!rawKey.startsWith("clw_") || rawKey.length !== 36)` — format validated before hash lookup, creating a timing oracle for key format validity. |

---

## Summary of Most Critical Findings

1. **The rate limiter is completely broken (C1)** — This is the single most critical issue. The `rateLimit()` function never records request timestamps, so it always returns `success: true`. Every V1 API endpoint is unprotected against abuse. An attacker can send unlimited requests with no throttling.

2. **Even if fixed, rate limiting would reset on cold starts (H1)** — The V1 auth uses synchronous in-memory rate limiting rather than the available durable `rateLimitAsync()` function. On serverless deployments, rate limit state is lost on every cold start.

3. **DNS rebinding bypasses webhook SSRF protection (H2)** — Batch webhook URLs are validated at submission but fetched minutes later, allowing DNS rebinding attacks to reach internal services or cloud metadata endpoints.

4. **Content moderation bypass via threads (H3)** — The thread messages endpoint lacks the content moderation check present in the main chat endpoint, providing a direct bypass path.

5. **Unbounded analytics query can cause DoS (H4)** — The usage endpoint loads all analytics rows into memory without pagination, risking server memory exhaustion for high-volume API keys.
