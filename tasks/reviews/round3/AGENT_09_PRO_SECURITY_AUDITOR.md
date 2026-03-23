# Agent 09 — Pro Tier — Security Auditor Review

**Total Issues Found: 18**
- CRITICAL: 2
- HIGH: 5
- MEDIUM: 7
- LOW: 4

---

## CRITICAL

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| PRO_S_CRIT_01 | `src/lib/rate-limit.ts:74-82` | In-memory rate limiter never increments — `rateLimit()` calls `getRateLimitStatus()` which only reads timestamps, but never pushes a new timestamp into the `store` Map. Every call sees `remaining > 0` and returns `success: true`. Rate limiting is completely non-functional across all V1 API endpoints and session-based routes. | A07:2021 Identification and Authentication Failures | `getRateLimitStatus` at line 68 does `const timestamps = store.get(identifier) \|\| []` and filters, but no code ever calls `store.set()` or `timestamps.push(Date.now())`. The `rateLimit()` function at line 74 reads remaining and returns success, but never records the hit. An attacker can make unlimited requests. |
| PRO_S_CRIT_02 | `src/app/api/cron/apply-pending-changes/route.ts:143` | Cron route leaks internal error messages including SSH failure details, VPS IP addresses, and system paths in the JSON response body. The `err.message` from SSH operations can contain hostnames, IPs, and file system paths. | A04:2021 Insecure Design | Line 143-148: `status: \`error: ${err.message}\`` — raw exception messages from SSH operations are returned in the response. While the route is cron-secret protected, if the secret leaks, the response reveals full infrastructure details. |

## HIGH

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| PRO_S_HIGH_01 | `src/app/api/v1/chat/route.ts:45-46` | Body size check relies on `Content-Length` header as first check, which can be spoofed. While the actual body is also checked at line 52, there is a window where a slow-loris style attack could stream a huge body before the `request.text()` call completes since Node.js will buffer the entire body in memory. The 100KB limit mitigates this somewhat. | A05:2021 Security Misconfiguration | Lines 45-53: Content-Length header is checked first, but the actual body is fully read into memory via `request.text()` before checking length. A client sending no Content-Length header with a multi-MB body bypasses the header check and forces full memory allocation. |
| PRO_S_HIGH_02 | `src/app/api/mission-control/tasks/bulk-action/route.ts:10-11` | Bulk action route reads body via `request.json()` without checking `maxBodySize` at the actual body level. The guard checks Content-Length header at line 73 of mc-route-guard.ts, but the actual body is never size-validated after parsing. A client can send a body with spoofed Content-Length header. | A04:2021 Insecure Design | Line 10: `const body = await request.json()` — body is parsed without any actual size check. `guardMCRoute` only checks the `Content-Length` header (mc-route-guard.ts:71-73) which can be set to any value by the client regardless of actual body size. |
| PRO_S_HIGH_03 | `src/app/api/mission-control/tasks/bulk-action/route.ts:31-46` | Missing validation of `value` field for `move` and `priority` actions. An attacker can move tasks to arbitrary column names or set arbitrary priority values since `value` is used directly in the database update without validation against the whitelist. | A03:2021 Injection | Line 33: `column_id: value` and line 45: `priority: value` — the `value` parameter is inserted directly into Supabase update queries without validating against VALID_COLUMNS or VALID_PRIORITIES whitelists (unlike the task creation route which validates both). |
| PRO_S_HIGH_04 | `src/lib/knowledge-base.ts:241` | SSRF via VPS IP — the `getEmbeddings()` function fetches `http://${vpsIp}:5555/embed` where `vpsIp` comes from the database. If an attacker can manipulate their `vps_instances.ip_address` value (e.g., through a compromised admin account or SQL injection elsewhere), they could redirect embedding requests to arbitrary internal services. | A10:2021 Server-Side Request Forgery | Line 241: `fetch(\`http://${vpsIp}:5555/embed\`, ...)` — IP comes from DB lookup. Similarly at line 612: `fetch(\`http://${vpsIp}:5555/rerank\`, ...)`. No validation that `vpsIp` is actually a valid, non-private IP. The `isPrivateUrl()` function exists but is not applied to VPS IPs used for embedding/reranking calls. |
| PRO_S_HIGH_05 | `src/app/api/v1/chat/batch/route.ts:214-236` | Webhook URL undergoes SSRF check at submission time (line 66), but the actual fetch at line 218 uses the URL re-read from the database. A TOCTOU race exists: if the webhook_url is modified in the database between submission and completion (unlikely but possible with direct DB access), the SSRF check is bypassed. More importantly, DNS rebinding attacks can bypass the `isPrivateUrl()` check since it validates the URL string but not the resolved IP at fetch time. | A10:2021 Server-Side Request Forgery | Line 218: `await fetch(batchRecord.webhook_url, ...)` fires after the batch completes. The `isPrivateUrl()` check at line 66 validates URL format but cannot prevent DNS rebinding where a domain initially resolves to a public IP during validation but resolves to 127.0.0.1 at fetch time. |

## MEDIUM

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| PRO_S_MED_01 | `src/app/api/v1/chat/route.ts:419` | Error metadata includes raw exception messages from upstream VPS calls. While the API response is sanitized (line 427 returns "Internal server error"), the analytics insert at line 419 stores `err.message` which could contain sensitive data from the upstream VPS. If the analytics table is exposed via another endpoint, this leaks internal details. | A09:2021 Security Logging and Monitoring Failures | Line 419: `metadata: { error: err instanceof Error ? err.message : "unknown" }` — raw error messages from `fetch()` failures could contain URLs with credentials (Basic auth header) or internal hostnames. |
| PRO_S_MED_02 | `src/app/api/logs/alerts/route.ts:49-56` | The `condition_config` field is stored as arbitrary JSON without schema validation or size limits. A user could store a very large JSON blob or include unexpected keys that could cause issues when the alert rules are later evaluated. | A03:2021 Injection | Lines 53: `condition_config: condition_config \|\| {}` — the entire JSON object from the request body is stored directly without validating its structure, depth, or size. Compare with threads route which validates metadata size and depth. |
| PRO_S_MED_03 | `src/app/api/logs/alerts/route.ts:55` | The `notification_target` field accepts arbitrary strings without validation. If this is later used as a URL for webhook notifications, it could be an SSRF vector. No `isPrivateUrl()` check is applied. | A10:2021 Server-Side Request Forgery | Line 55: `notification_target: notification_target \|\| null` — accepts any string value. If notification_channel is "webhook", this value would presumably be fetched later. No URL validation or SSRF protection. |
| PRO_S_MED_04 | `src/app/api/mission-control/automation-rules/route.ts:30-32` | Automation rule body is parsed via `request.json()` without actual body size validation — only the Content-Length header is checked by guardMCRoute. The `trigger_value` and `action_value` fields accept arbitrary unvalidated strings. | A03:2021 Injection | Lines 32: `const { name, trigger_type, trigger_value, action_type, action_value } = body` — `trigger_value` and `action_value` are stored directly without any validation of content, length, or format. These are later used by `processAutomationRules()` which could execute actions based on unsanitized values. |
| PRO_S_MED_05 | `src/app/api/mission-control/events/route.ts:77-83` | The `payload` field in event creation accepts arbitrary JSON objects without size or depth validation. A user could submit events with very large payloads to fill storage. | A04:2021 Insecure Design | Line 79: `payload = {}` — accepts arbitrary JSON. While `maxBodySize` is set to 51200 in guardMCRoute, the Content-Length check can be spoofed. No per-field validation on the payload object structure or size. |
| PRO_S_MED_06 | `src/app/api/v1/agents/[id]/route.ts:18` | Agent detail endpoint selects `custom_config` field which could contain sensitive configuration data (API keys, model settings). While the response at line 25-37 does not directly expose `custom_config`, the Supabase query fetches it unnecessarily, increasing the risk of accidental exposure in future code changes. | A01:2021 Broken Access Control | Line 18: `.select("agent_id, deployed, deployed_at, primary_model, fallback_model, custom_config, agents(name, description)")` — `custom_config` is fetched but not returned. Defense-in-depth: query should only select fields that are actually returned. |
| PRO_S_MED_07 | `src/app/api/audit-log/route.ts:55-58` | The search parameter is used in a PostgREST `.or()` filter with `.ilike()`. While `%` and `_` wildcards are escaped at line 53, the value is still interpolated into the PostgREST filter string. Special PostgREST operators like parentheses, commas, or periods in the search string could potentially manipulate the filter logic. | A03:2021 Injection | Line 55-57: `query.or(\`action.ilike.%${safe}%,entity_type.ilike.%${safe}%\`)` — the `safe` value is string-interpolated into a PostgREST filter expression. If `safe` contains PostgREST syntax characters (e.g., commas, parentheses, dots), it could alter the intended filter structure. |

## LOW

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| PRO_S_LOW_01 | `src/lib/v1-auth.ts:78` | API key hash prefix is logged on auth failure, revealing partial hash information. While 16 chars of a SHA-256 hash is not practically exploitable, it is unnecessary information disclosure in logs. | A09:2021 Security Logging and Monitoring Failures | Line 78: `key_hash: ${keyHash.slice(0, 16)}...` — logs a portion of the hash for debugging. The key_prefix (first 8 chars of the raw key) logged at line 61 is more appropriate for identification. |
| PRO_S_LOW_02 | `src/app/api/v1/health/route.ts:24-25` | Health endpoint reveals the API key name and exact rate limit configuration. This information could help an attacker understand account configuration without needing to probe other endpoints. | A01:2021 Broken Access Control | Lines 24-25: `key_name: apiKey.name, rate_limit: apiKey.rate_limit_per_min` — exposes internal key metadata. The `plan` field at line 22 also reveals the user's subscription tier. |
| PRO_S_LOW_03 | `src/app/api/keys/route.ts:37-39` | API key listing reveals `key_prefix`, `usage_count`, `last_used_at`, and `rate_limit_per_min` for all keys. While these are legitimate for the key owner, combined with the `id` field, they could aid in targeted attacks if the session is hijacked. | A01:2021 Broken Access Control | Line 37: `.select("id, name, key_prefix, usage_count, last_used_at, status, rate_limit_per_min, created_at")` — includes internal DB `id` field. The `id` (UUID) could be used in other queries if IDOR vulnerabilities exist elsewhere. |
| PRO_S_LOW_04 | `src/app/api/analytics/funnels/route.ts:22` | The `days` parameter is not validated for NaN. `parseInt("abc")` returns `NaN`, and `Math.min(90, NaN)` returns `NaN`, which would create an invalid date in the `since` calculation, potentially returning all conversations ever created. | A04:2021 Insecure Design | Line 22: `const days = Math.min(90, parseInt(url.searchParams.get("days") \|\| "7"))` — no NaN check. If `days` is NaN, the `since` date becomes `Invalid Date` and the `.gte("created_at", since)` filter passes an invalid value to Supabase, which may return all rows or error. |

---

## Summary of Key Findings

### Most Critical: Rate Limiter is Non-Functional (PRO_S_CRIT_01)

The in-memory `rateLimit()` function never records request timestamps. The `store` Map is never populated because `getRateLimitStatus()` only reads from the store and `rateLimit()` never writes to it. This means:

- All V1 API endpoints (`/api/v1/*`) have zero effective rate limiting
- All session-based Pro routes (analytics, logs, keys, audit-log) have zero effective rate limiting
- All Mission Control routes have zero effective rate limiting
- The `rateLimitAsync()` function's in-memory pre-check always passes, but the Supabase RPC fallback may provide some protection if the `rate_limit_check` function exists in the database

**Immediate fix**: Add `store.set(identifier, [...(store.get(identifier) || []), Date.now()])` after the success check in `rateLimit()`.

### Authorization Model is Solid

The codebase demonstrates good ownership checks across V1 API routes:
- All resource queries include `.eq("user_id", apiKey.user_id)`
- Conversation messages verify conversation ownership before returning messages
- Thread messages verify thread ownership before returning messages
- Batch status checks include user_id filter
- File operations include user_id filter
- Mission Control routes use session auth + plan check via `guardMCRoute`

### SSRF Protection Exists but Has Gaps

The `isPrivateUrl()` function in knowledge-base.ts is comprehensive (covers IPv4/IPv6 private ranges, octal/hex notation, decimal IPs, link-local addresses). However, it is only applied to the batch webhook URL, not to VPS IP addresses used for embedding/reranking requests.
