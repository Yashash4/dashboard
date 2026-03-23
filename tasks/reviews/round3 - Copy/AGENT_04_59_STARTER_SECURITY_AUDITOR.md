---
name: AGENT_04_59_STARTER_SECURITY_AUDITOR
description: Security Auditor review of Starter Dashboard (Area 59) — auth, RBAC, input validation, SSRF, rate limiting, secrets
type: review
agent_number: 4
area: 59_STARTER
poo: SECURITY_AUDITOR
---

# Security Audit Report: Starter Dashboard (Area 59)

## Scope
Authentication, authorization, input validation, injection attacks, XSS, CSRF, SSRF, rate limiting, secrets exposure, data leakage, CORS, cookie security, RBAC/RLS.

Key files reviewed:
- `src/middleware.ts`
- `src/lib/v1-auth.ts`
- `src/lib/rate-limit.ts`
- `src/lib/supabase-admin.ts`
- `src/lib/supabase-server.ts`
- `src/lib/supabase.ts`
- `src/lib/api-errors.ts`
- `src/lib/mc-route-guard.ts`
- `src/lib/webhook-dispatch.ts`
- `src/lib/audit-log.ts`
- `src/lib/ssh.ts`
- `src/lib/vps-data-api.ts`
- `src/lib/idempotency.ts`
- `src/lib/knowledge-base.ts`
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/api/keys/route.ts`
- `src/app/api/admin/provision/route.ts`
- `src/app/api/admin/customers/bulk/route.ts`
- `src/app/api/admin/customers/[id]/actions/route.ts`
- `src/app/api/admin/api-keys/route.ts`
- `src/app/api/admin/tickets/[id]/route.ts`
- `src/app/api/cron/apply-pending-changes/route.ts`
- `src/app/api/v1/agents/route.ts`
- `src/app/api/v1/chat/route.ts`
- `src/app/api/v1/files/route.ts`
- `src/app/api/v1/conversations/route.ts`
- `src/app/api/v1/threads/route.ts`
- `src/app/api/v1/predictions/route.ts`
- `src/app/api/vps/uptime/route.ts`

---

## CRITICAL

### 59S_CRIT_01: SSRF — vpsDataFetch fetches user-controlled hostname without re-validation

**File:** `src/lib/vps-data-api.ts:75`

```typescript
const response = await fetch(`https://${vps.hostname}:5556${path}`, {
```

The `vps.hostname` is read from `vps_instances` table and used directly as the fetch target. While the hostname is initially set during provisioning via `createSubdomain()`, nothing prevents a user from updating their hostname record in `vps_instances` to any arbitrary domain or IP after provisioning.

The `vpsDataFetch()` function is called by `audit-log.ts` to stream audit events to the VPS Data API (port 5556). An attacker who modifies their `hostname` to `169.254.169.254` (AWS/metadata) or an internal IP could trigger SSRF against cloud provider metadata services or internal infrastructure.

The `isPrivateUrl()` guard in `knowledge-base.ts` is NOT applied to `vps.hostname` before the fetch in `vps-data-api.ts`.

**Recommendation:** Re-validate `vps.hostname` through `isPrivateUrl()` before making the fetch call, or store a cryptographically signed/validated hostname that cannot be changed post-provisioning.

---

### 59S_CRIT_02: Rate limiting uses in-memory store only in V1 API auth path — bypassable on serverless

**File:** `src/lib/v1-auth.ts:117-127`

```typescript
const rpm = apiKey.rate_limit_per_min || 60;
const identifier = rateLimitTag
  ? `${apiKey.user_id}:${rateLimitTag}`
  : `apikey:${apiKey.id}`;
const rl = rateLimit(identifier, rpm, 60_000);  // ← in-memory only!
if (!rl.success) {
  return apiError("rate_limited", "Rate limit exceeded. Try again later.", ctx);
}
```

The `validateV1Auth()` function uses the synchronous `rateLimit()` (in-memory Map) rather than `rateLimitAsync()` (Supabase-backed). On serverless platforms (Vercel), each cold start resets the in-memory Map. An attacker can:
1. Wait for cold start / make first request to fresh instance
2. Send up to `rate_limit_per_min` requests with zero counter
3. Repeat across instances to get unbounded requests

**Recommendation:** Use `rateLimitAsync()` instead of `rateLimit()` in `validateV1Auth()` for security-critical rate limiting enforcement.

---

## HIGH

### 59S_HIGH_01: No Row Level Security (RLS) verification for critical tables

**Files:** Multiple API routes

No RLS policy definitions were found in the reviewed files. Several critical tables (`api_keys`, `subscriptions`, `user_api_keys`, `vps_instances`) rely entirely on application-level `.eq("user_id", userId)` filters. If any query path misses the user filter (e.g., due to a programming error), all users' data would be accessible to any authenticated user.

Additionally, if RLS is not enabled, a compromised service role key would grant full database access with no per-user boundaries.

**Recommendation:** Verify RLS is enabled on all user-scoped tables. Add per-table RLS policies as a defense-in-depth layer, even if application-level filters are present.

---

### 59S_HIGH_02: Subdomain field not validated in provisioning route

**File:** `src/app/api/admin/provision/route.ts:43-53`

```typescript
const { userId, ip, sshUser, sshPassword, sshPort, subdomain, email } =
  body as { ... };
```

The `subdomain` is accepted from the request body without format validation. It flows through `createSubdomain()` to Cloudflare and into `provisionVPS()` as part of the hostname. No regex validation (e.g., `/^[a-z0-9-]+$/`) is applied to `subdomain`.

A malicious admin could supply a subdomain containing characters that cause issues in shell contexts during provisioning, or craft a value that exploits edge cases in DNS zone handling.

**Recommendation:** Add explicit subdomain format validation: `if (!/^[a-z0-9-]+$/.test(subdomain)) return 400`.

---

### 59S_HIGH_03: SIEM webhook delivery has no SSRF protection

**File:** `src/lib/audit-log.ts:138`

```typescript
await fetch(config.destination_url, {
  method: "POST",
  headers,
  body,
  signal: controller.signal,
});
```

The `destination_url` is a user-configured URL from `siem_configs`. The `streamToSIEM()` function does not call `isPrivateUrl()` before making the fetch. A user could configure a SIEM destination pointing to `127.0.0.1:5556`, `169.254.169.254`, or private AWS/GCP metadata endpoints, exfiltrating audit log data to an attacker-controlled endpoint.

**Recommendation:** Validate `destination_url` with `isPrivateUrl()` before making the fetch call.

---

### 59S_HIGH_04: No rate limiting on cron job route

**File:** `src/app/api/cron/apply-pending-changes/route.ts:1-156`

The `GET /api/cron/apply-pending-changes` authenticates via `CRON_SECRET` bearer token (adequate) but has no rate limiting. If called repeatedly, it could:
1. Process an unbounded number of pending model changes
2. Establish many concurrent SSH connections to many user VPSes
3. Overwhelm the SSH infrastructure or cause cascading failures

**Recommendation:** Add rate limiting to the cron route keyed on the CRON_SECRET or source IP.

---

## MEDIUM

### 59S_MED_01: KB documentName from user upload reflected in API response without sanitization

**File:** `src/app/api/v1/chat/route.ts:169-171`

```typescript
kbContext = kbResults
  .map((r) => `[Source: ${r.documentName}]\n${r.content}`)
  .join("\n\n---\n\n");
```

The `documentName` comes from `kb_documents` table (uploaded file name, user-controlled). It is embedded directly into the prompt sent to the AI model. While the model output is subsequently stripped of thinking tags, if the `documentName` itself contained malicious content (e.g., prompt injection), it could influence the AI's response. Additionally, if any client code renders `documentName` without escaping, XSS could occur.

**Recommendation:** Sanitize `documentName` (strip HTML tags, truncate length) before including in context.

---

### 59S_MED_02: Agent name matching in chat route could cause unexpected agent selection

**File:** `src/app/api/v1/chat/route.ts:102-108`

```typescript
const match = (userAgents || []).find((ua: any) => {
  const name = ua.agents?.name || "";
  return (
    sanitizeAgentName(name) === agent.toLowerCase() ||
    name.toLowerCase() === agent.toLowerCase()
  );
});
```

The `sanitizeAgentName()` function lowercases and replaces non-alphanumeric chars with underscores. A user could pass an `agent` parameter like `"admin"` that matches any agent named "Admin", "admin", "SYS_ADMIN", etc. if multiple deployed agents have similar names. This is more of an authorization issue — users should only see/deploy agents they own, but the name-based matching could select the wrong agent in ambiguous cases.

**Recommendation:** Prefer matching by agent ID rather than name when possible.

---

### 59S_MED_03: API key plan check has TOCTOU window between key lookup and subscription check

**File:** `src/lib/v1-auth.ts:70-100`

The plan check at line 96 happens after the API key is looked up. If a user's subscription is downgraded or deleted between the `api_keys` query and the `subscriptions` query, the user's current API key session would still be valid for the remainder of the request. This is a minor race condition.

**Recommendation:** Consider caching the plan decision for the duration of the request or using a single atomic query that joins api_keys and subscriptions.

---

### 59S_MED_04: Idempotency key scoped to user_id + key but not API route

**File:** `src/app/api/v1/chat/route.ts:33-42`

```typescript
if (idempotencyKey && idempotencyKey.length <= 64) {
  const cached = await checkIdempotency(apiKey.user_id, idempotencyKey);
```

The idempotency cache key is `user_id + idempotency_key`. The same idempotency key used for `/api/v1/chat` would also be valid for other endpoints (e.g., `/api/v1/threads`). If a client mistakenly reuses an idempotency key across different endpoints, the wrong cached response could be replayed.

**Recommendation:** Include the API route/path in the idempotency cache key.

---

### 59S_MED_05: Response body truncation in webhook delivery (1024 bytes) may leak sensitive data

**File:** `src/lib/webhook-dispatch.ts:229`

```typescript
response_body: responseBody.slice(0, 1024),
```

The `response_body` from the webhook target URL is stored (truncated to 1024 bytes) in `webhook_deliveries`. If the webhook target returns sensitive data in the response body (e.g., internal error messages, stack traces), these are stored in the ClawHQ database and could be exposed.

**Recommendation:** Consider not storing the response body at all, or storing only a status indicator rather than the raw body content.

---

## LOW

### 59S_LOW_01: Fire-and-forget analytics inserts swallow errors silently

**Files:** `src/app/api/v1/chat/route.ts:231-241`, `src/app/api/v1/chat/route.ts:367-381`

```typescript
admin.from("agent_analytics").insert({...})
  .then(() => {}, (e) => console.warn("[v1/chat] analytics insert failed:", e?.message));
```

Analytics failures are silently ignored. While this prevents blocking on analytics, it means the usage tracking can fail silently, which could have billing/compliance implications. Low severity since analytics are non-critical.

---

### 59S_LOW_02: Hardcoded fallback app URL in cron job

**File:** `src/app/api/cron/apply-pending-changes/route.ts:112`

```typescript
appUrl: "https://app.clawhq.tech",
```

Uses hardcoded fallback instead of `process.env.NEXT_PUBLIC_APP_URL`. Minor consistency issue.

---

### 59S_LOW_03: Login audit POST has no error handling or retry

**File:** `src/app/login/page.tsx:81`

```typescript
fetch("/api/auth/login-audit", { method: "POST" }).catch(() => {});
```

Fire-and-forget. Login success/failure is not logged if the fetch fails. Low impact since the primary auth still works.

---

## Positive Security Findings

The following are well-implemented and should be preserved:

1. **`getUser()` over `getSession()`** — `src/middleware.ts:77` correctly uses `getUser()` for server-validated sessions, preventing use of expired/revoked tokens.

2. **API key format validation** — `src/lib/v1-auth.ts:59` validates `clw_` prefix and 36-character length before hashing.

3. **HMAC webhook signatures** — `src/lib/webhook-dispatch.ts:196-199` uses `crypto.createHmac("sha256", secret)` with timestamp prefix to prevent replay attacks.

4. **Magic byte file validation** — `src/app/api/v1/files/route.ts:36-43` validates file content matches declared MIME type using magic bytes.

5. **`isPrivateUrl()` SSRF protection** — `src/lib/knowledge-base.ts:28-100` has comprehensive SSRF protection including IPv6, octal/hex notation, private CIDRs, and TLD blocks. Applied to KB URLs and webhook URLs.

6. **Plan allowlist in V1 auth** — `src/lib/v1-auth.ts:96` uses explicit `includes()` check against hardcoded plan array.

7. **Admin role check in provision route** — `src/app/api/admin/provision/route.ts:106-115` was previously missing (noted as 2.22 fix), now correctly enforced.

8. **Self-action prevention** — `src/app/api/admin/customers/bulk/route.ts:32` prevents admins from bulk-suspending themselves.

9. **Service name allowlist in VPS actions** — `src/app/api/admin/customers/[id]/actions/route.ts:22-29` uses a hardcoded `SERVICE_MAP` to prevent arbitrary systemctl commands.

10. **CSRF-safe design** — Supabase cookie auth with `httpOnly` cookies provides inherent CSRF protection for session-based routes.

11. **Idempotency support** — `src/app/api/v1/chat/route.ts:33-42` provides idempotency key support to prevent duplicate message processing.

12. **Content moderation** — `src/app/api/v1/chat/route.ts:76-81` blocks harmful inputs before sending to AI model.

13. **Streaming timeout protection** — `src/app/api/v1/chat/route.ts:254-262` closes SSE streams after 60s to prevent runaway connections.

14. **SSH connection timeout** — `src/app/api/vps/uptime/route.ts:54` sets `readyTimeout: 10000` on SSH connections.

---

## Summary

| Category | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH     | 4 |
| MEDIUM   | 5 |
| LOW      | 3 |
| Total    | 14 |

The most urgent issues to address are:
1. **SSRF in `vpsDataFetch`** — direct path to cloud metadata and internal services
2. **In-memory rate limiting in V1 API** — allows unlimited requests on serverless cold start
3. **Missing RLS verification** — no defense-in-depth for cross-user data access
4. **SSRF in SIEM webhook delivery** — audit data exfiltration vector
5. **Unvalidated subdomain in provisioning** — potential injection vector in admin flow
