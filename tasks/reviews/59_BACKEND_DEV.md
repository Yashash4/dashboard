# Backend API Route Review -- Task 59

**Reviewer:** Backend Developer
**Date:** 2026-03-16
**Scope:** All Starter API routes under `src/app/api/`

---

## Executive Summary

**37 route files** reviewed across 14 API domains. The codebase is **well-structured overall** -- every route has auth, rate limiting, and user_id filtering on DB queries. The patterns are consistent and show good security discipline. However, there are **several concrete issues** that should be fixed, ranging from critical (password stored in plaintext, missing request body try/catch) to moderate (in-memory rate limiter, missing max-length validations).

### Severity Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 5 |
| MEDIUM | 10 |
| LOW | 7 |

---

## CRITICAL Issues

### C1. Dashboard password stored in plaintext in Supabase
**File:** `src/app/api/vps/password/route.ts` (line 113)
```ts
await admin.from("vps_instances").update({ dashboard_password: password }).eq("user_id", user.id);
```
The user's chosen dashboard password is written as raw plaintext to `vps_instances.dashboard_password`. This same plaintext is also returned via GET (line 38). If the Supabase DB is ever compromised or an admin account is breached, all customer dashboard passwords are exposed.

**Recommendation:** Hash the stored password (bcrypt/argon2), or at minimum encrypt it with `encryptCredentials()` (already used for channel credentials). The GET endpoint should never return the raw password -- return a masked version or a "password is set" boolean.

### C2. Payment verification route missing request.json() try/catch
**File:** `src/app/api/payments/verify/route.ts` (line 17)
```ts
const body = await request.json();
```
This is the only payment route without a try/catch around `request.json()`. A malformed body will throw an unhandled exception, returning a 500 with potentially leaky stack trace. Every other POST route in the codebase wraps this correctly.

**Recommendation:** Wrap in try/catch like every other route:
```ts
let body;
try { body = await request.json(); } catch {
  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}
```

### C3. Payment verification has no rate limiting
**File:** `src/app/api/payments/verify/route.ts`
Unlike `payments/create-order` which has rate limiting, the verify endpoint has none. An attacker could brute-force payment signatures or replay attack the endpoint without throttling.

**Recommendation:** Add `rateLimit(\`${user.id}:payment_verify\`, 10, 60_000)`.

---

## HIGH Issues

### H1. In-memory rate limiter resets on every serverless cold start
**File:** `src/lib/rate-limit.ts`
The rate limiter uses a `Map` stored in process memory. On Vercel (serverless), each function invocation may be a new instance, making the rate limiter effectively useless under serverless deployment. Limits only work if the same instance handles consecutive requests.

**Impact:** All 37 routes' rate limiting is unreliable in production.

**Recommendation:** Use an external store (Upstash Redis, Vercel KV) or Vercel's built-in rate limiting. If staying on Vercel Edge, at minimum document this as a known limitation.

### H2. SSL check route uses regular Supabase client instead of admin client
**File:** `src/app/api/vps/ssl-check/route.ts` (line 23)
```ts
const { data: vps } = await supabase.from("vps_instances")...
```
Every other VPS route uses `createAdminClient()` to bypass RLS, but `ssl-check` uses the user's Supabase client directly. If RLS policies on `vps_instances` are restrictive (which they should be since other routes use admin), this query may silently return null and always return "No VPS found."

**Recommendation:** Switch to `createAdminClient()` for consistency with all other VPS routes.

### H3. `webhooks/route.ts` POST missing try/catch around request.json()
**File:** `src/app/api/webhooks/route.ts` (line 82)
```ts
const body = await request.json();
```
Same issue as C2. Missing try/catch on JSON parse.

### H4. `keys/[id]/route.ts` PATCH missing try/catch around request.json()
**File:** `src/app/api/keys/[id]/route.ts` (line 92)
```ts
const body = await request.json();
```
Same pattern. Missing try/catch on JSON parse.

### H5. `payments/create-order/route.ts` missing try/catch around request.json()
**File:** `src/app/api/payments/create-order/route.ts` (line 23)
```ts
const body = await request.json();
```
Same issue -- payment endpoint with no body parse protection.

---

## MEDIUM Issues

### M1. No max-length on VPS dashboard password
**File:** `src/app/api/vps/password/route.ts` (line 70)
Validates minimum 8 chars but no maximum. A user could send a multi-MB password string, which would be written to the DB and piped over SSH.

**Recommendation:** Add `password.length > 128` check.

### M2. No max-length on ticket subject/description
**File:** `src/app/api/tickets/create/route.ts`
Subject and description have `trim()` checks but no max-length validation. A user could submit a ticket with a 10MB description.

**Recommendation:** Add `subject.length > 200` and `description.length > 10000` guards.

### M3. No max-length on ticket reply message
**File:** `src/app/api/tickets/[id]/reply/route.ts`
Same issue -- `message.trim()` is checked but no length limit.

**Recommendation:** Add `message.length > 10000` check.

### M4. No max-length on chat message
**File:** `src/app/api/chat/send/route.ts` (line 49)
`message.trim()` is required but no cap on length. This is especially concerning because the message is sent to the OpenClaw API and could cause large token consumption.

**Recommendation:** Cap at 8000-16000 characters.

### M5. No max-length on webhook description
**File:** `src/app/api/webhooks/route.ts`
URL has a 2048 max but `description` has no limit.

**Recommendation:** Add `description.length > 500` check.

### M6. No max-length on agent config values
**File:** `src/app/api/agents/config/route.ts`
The `config` object is validated as an object but individual key/value sizes are unchecked. Arbitrarily large config values would be written to DB and pushed over SSH.

**Recommendation:** Check `JSON.stringify(config).length < 50000`.

### M7. Notification PATCH `body.ids` array not length-limited
**File:** `src/app/api/notifications/route.ts` (line 55)
```ts
if (Array.isArray(body.ids) && body.ids.length > 0) {
```
No limit on array size. A user could send thousands of IDs in a single request. The `.in()` clause has database limits.

**Recommendation:** Cap `body.ids.slice(0, 100)`.

### M8. Audit log search parameter allows SQL-like injection via `.ilike`
**File:** `src/app/api/audit-log/route.ts` (line 52-55)
```ts
const safe = search.replace(/[,%().\\/_]/g, "");
query = query.or(`action.ilike.%${safe}%,entity_type.ilike.%${safe}%`);
```
The sanitization strips some characters but not all PostgREST-special characters. While Supabase parameterizes queries, the `ilike` pattern syntax could still be abused with `_` (single-char wildcard) -- though `_` is stripped. This is acceptable but fragile.

**Recommendation:** Consider using `.textSearch()` or a simpler `.ilike` with only alphanumeric allowed.

### M9. VPS status route leaks `_stale_reason` with internal error message
**File:** `src/app/api/vps/status/route.ts` (line 71)
```ts
_stale_reason: `Status sync failed: ${message}`,
```
Hostinger API error messages could contain internal details (API keys, URLs, etc.).

**Recommendation:** Return a generic message: `"Status may be stale -- could not sync with hosting provider"`.

### M10. Chat send route has a 60s fetch timeout but no maxDuration export
**File:** `src/app/api/chat/send/route.ts`
The route uses a 60s AbortController timeout for the OpenClaw fetch, but Vercel serverless functions default to 10s (Hobby) or 60s (Pro). If on Hobby, the function will be killed before the timeout fires.

**Recommendation:** Add `export const maxDuration = 60;` (already done correctly in `cron/apply-pending-changes`).

---

## LOW Issues

### L1. Cron route returns internal user IDs and model names in response
**File:** `src/app/api/cron/apply-pending-changes/route.ts`
The response includes `userId` and `model` for every processed change. While the cron endpoint is auth-protected, the response is unnecessarily verbose.

### L2. VPS uptime error response returns 200 with error field
**File:** `src/app/api/vps/uptime/route.ts` (line 127)
On SSH failure, returns `{ uptime_percentage: 0, ..., error: "..." }` with HTTP 200. This is inconsistent with other routes that return 500 on failure.

### L3. Model history silently swallows errors
**File:** `src/app/api/models/history/route.ts` (line 36-41)
Both the error case and the catch block return `{ history: [] }`. If the table is genuinely broken, the user sees empty history with no indication of failure.

### L4. Gateway health returns 200 on SSH failure
**File:** `src/app/api/vps/gateway-health/route.ts` (line 89-92)
Returns `{ active: false, httpOk: false, ... }` with 200 status on SSH connection failure. Could add a `_error: true` flag.

### L5. `vps/stop` sets status to "stopped" immediately
**File:** `src/app/api/vps/stop/route.ts` (line 54)
Unlike `vps/start` (which sets "starting"), the stop route sets "stopped" immediately after calling `stopVM()`, even though the VM may still be shutting down. The start route correctly uses a transitional state.

**Recommendation:** Set to "stopping" and let the status sync route update to "stopped".

### L6. Unused `err` variable in several catch blocks
Multiple routes capture `err` but never use it (e.g., `vps/restart`, `vps/enable-embedding`). Not a bug but adds noise.

### L7. Mission control task queue uses regular Supabase client (with RLS)
**File:** `src/app/api/mission-control/tasks/queue/route.ts`
Uses `supabase` (RLS client) for all queries. This is actually *correct* if RLS is properly configured (user_id = auth.uid()), making it defense-in-depth. However, it's inconsistent with most other routes that use admin client + manual `.eq("user_id", user.id)`.

---

## Route-by-Route Checklist

| Route | Auth | Rate Limit | Input Validation | Error Handling | DB user_id Filter | SSH Cleanup |
|-------|------|-----------|------------------|----------------|-------------------|-------------|
| `vps/status` | OK | 60/min | N/A (GET) | OK | OK | N/A |
| `vps/start` | OK | 10/min | N/A | OK | OK | N/A |
| `vps/stop` | OK | 10/min | N/A | OK (see L5) | OK | N/A |
| `vps/restart` | OK | 10/min | N/A | OK | OK | N/A |
| `vps/monitoring` | OK | 30/min | N/A | OK | OK | via lib/ssh |
| `vps/logs` | OK | 20/min | lines capped 500 | OK | OK | via lib/ssh |
| `vps/gateway-health` | OK | 30/min | N/A | OK (see L4) | OK | OK (dispose in finally) |
| `vps/password` GET | OK | 5/min | N/A | OK (see C1) | OK | N/A |
| `vps/password` POST | OK | 5/min | min 8 (see M1) | OK (see C1) | OK | via lib/ssh |
| `vps/ssl-check` | OK | 10/min | N/A | OK (see H2) | OK* (see H2) | N/A |
| `vps/reboot` | OK | 3/5min | N/A | OK | OK | via lib/ssh |
| `vps/uptime` | OK | 20/min | N/A | OK (see L2) | OK | OK (dispose in finally) |
| `vps/processes` | OK | 20/min | N/A | OK | OK | via lib/ssh |
| `vps/enable-embedding` | OK | 5/min | N/A | OK | OK | via lib/ssh |
| `models/change` POST | OK | 3/min | model required | OK | OK | via lib/ssh |
| `models/change` DELETE | OK | 3/min | N/A | OK | OK | N/A |
| `models/history` | OK | 10/min | N/A | OK (see L3) | OK | N/A |
| `models/performance` | OK | 10/min | N/A | OK | OK | N/A |
| `agents/deploy` | OK | 5/min | agent_id required | OK | OK | via lib/ssh |
| `agents/undeploy` | OK | 5/min | agent_id required | OK | OK | via lib/ssh |
| `agents/config` | OK | 10/min | Partial (see M6) | OK | OK | via lib/ssh |
| `agents/purchase` | OK | 10/min | agent_id required | OK | OK | N/A |
| `agents/analytics` | OK | 20/min | days clamped 1-90 | OK | OK | N/A |
| `channels/connect` | OK | 5/min | type + creds validated | OK | OK | via lib/ssh |
| `channels/disconnect` | OK | 5/min | channel_id required | OK | OK | via lib/ssh |
| `channels/health` | OK | 10/min | N/A | OK | OK | OK (dispose in finally) |
| `chat/send` | OK | 30/min | agent_id + msg (see M4) | OK | OK | N/A |
| `chat/messages` GET | OK | 60/min | agent_id required | OK | OK | N/A |
| `chat/messages` DELETE | OK | 5/min | agent_id required | OK | OK | N/A |
| `tickets/create` | OK | 5/min | Partial (see M2) | OK | OK | N/A |
| `tickets/[id]/reply` | OK | 10/min | Partial (see M3) | OK | OK | N/A |
| `tickets/[id]/resolve` | OK | 5/min | N/A | OK | OK | N/A |
| `tickets/[id]/reopen` | OK | 5/min | N/A | OK | OK | N/A |
| `account/update` | OK | 10/min | 2-100 chars | OK | OK | N/A |
| `account/password` | OK | 3/min | min 8 chars | OK | OK | N/A |
| `payments/create-order` | OK | 10/min | amount+type (see H5) | OK | OK | N/A |
| `payments/verify` | OK | **MISSING (C3)** | Partial (see C2) | OK | OK | N/A |
| `billing/coupon` | OK | 5/min | 4-20 alphanum | OK | OK | N/A |
| `onboarding` GET | OK | 30/min | N/A | OK | OK | N/A |
| `onboarding` PATCH | OK | 20/min | boolean whitelist | OK | OK | N/A |
| `notifications` GET | OK | 30/min | N/A | OK | OK | N/A |
| `notifications` PATCH | OK | 20/min | Partial (see M7) | OK | OK | N/A |
| `webhooks` GET | OK | 20/min | N/A | OK | OK | N/A |
| `webhooks` POST | OK | 5/min | URL+events validated | OK (see H3) | OK | N/A |
| `keys/[id]` DELETE | OK | 10/min | N/A | OK | OK | N/A |
| `keys/[id]` PATCH | OK | 10/min | Partial (see H4) | OK | OK | N/A |
| `audit-log` | OK | 20/min | page/limit clamped | OK (see M8) | OK | N/A |
| `knowledge-base` GET | OK | 30/min | N/A | OK | OK | N/A |
| `knowledge-base/[id]` DEL | OK | 20/min | N/A | OK | OK | N/A |
| `analytics/usage` | OK | 10/min | range whitelisted | OK | OK (RPC param) | N/A |
| `mission-control/tasks/queue` | OK | None | agent_id required | OK | OK (via RLS) | N/A |
| `cron/apply-pending-changes` | OK (Bearer) | N/A | N/A | OK | N/A (system) | via lib/ssh |

---

## Positive Patterns Observed

1. **Consistent auth pattern** -- Every user-facing route calls `supabase.auth.getUser()` and returns 401 if null.
2. **user_id filtering** -- Every DB query includes `.eq("user_id", user.id)` or equivalent ownership check.
3. **Rate limiting everywhere** -- 36 of 37 user-facing routes have rate limits (only `payments/verify` is missing).
4. **SSH connection cleanup** -- Routes using direct `NodeSSH` all call `ssh.dispose()` in `finally` blocks.
5. **Webhook dispatch fire-and-forget** -- `.catch(() => {})` prevents webhook failures from affecting user requests.
6. **Tier gating** -- Pro-only features consistently check `hasAccess(plan, "pro")`.
7. **Atomic model change slot claiming** -- `models/change` uses conditional DB updates to prevent race conditions on the change counter.
8. **Safe JSON body parsing** -- Most POST routes wrap `request.json()` in try/catch (5 exceptions noted above).
9. **Channels encryption** -- Channel credentials are encrypted before storage using `encryptCredentials()`.
10. **SSRF protection** -- Webhook URLs are validated with `isPrivateUrl()` check.

---

## Recommended Priority Order

1. **C2 + C3**: Fix payment verify route (try/catch + rate limit) -- security-critical payment path
2. **C1**: Stop storing plaintext dashboard passwords; encrypt or hash
3. **H1**: Evaluate rate limiter for production reliability (consider Upstash Redis)
4. **H2**: Fix ssl-check to use admin client
5. **H3-H5**: Add try/catch to the 3 remaining routes missing it
6. **M1-M6**: Add max-length validations across all text inputs
7. **M10**: Add `maxDuration` export to chat/send route
