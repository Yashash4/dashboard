# Security Audit Report -- Starter-Tier API Routes & Infrastructure

**Date:** 2026-03-16
**Scope:** All API routes under `/api/vps/*`, `/api/models/*`, `/api/agents/*`, `/api/channels/*`, `/api/chat/*`, `/api/tickets/*`, `/api/account/*`, `/api/billing/*`, `/api/onboarding/*`, `/api/notifications/*`, `/api/cron/*` plus core libraries (`middleware.ts`, `supabase*.ts`, `rate-limit.ts`, `crypto.ts`, `ssh.ts`)
**Methodology:** OWASP Top 10 2021 + custom checks for hosting platform-specific risks

---

## Executive Summary

The codebase demonstrates **strong baseline security practices**: every user-facing API route authenticates via `supabase.auth.getUser()`, queries consistently filter by `user_id`, rate limiting is applied to all routes, and credentials are encrypted at rest with AES-256-GCM. However, there are **several findings ranging from CRITICAL to LOW** that should be addressed.

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH     | 5 |
| MEDIUM   | 7 |
| LOW      | 6 |
| INFO     | 4 |

---

## CRITICAL Findings

### C1. Dashboard Password Stored in Plaintext in Database
**File:** `src/app/api/vps/password/route.ts` (line 114)
**Category:** OWASP A02 - Cryptographic Failures

The VPS dashboard password is stored as plaintext in the `vps_instances.dashboard_password` column:

```typescript
await admin.from("vps_instances").update({ dashboard_password: password }).eq("user_id", user.id);
```

The GET endpoint also returns this plaintext password directly to the client (line 38). While this is an nginx Basic Auth password (not the user's account password), it is still a credential that protects the OpenClaw dashboard. If the Supabase database is compromised, all dashboard passwords are immediately exposed.

**Impact:** Full compromise of all customer OpenClaw dashboards if the database is breached.
**Recommendation:** Encrypt the dashboard password using the existing `encryptCredentials()` from `crypto.ts` before storing. Only decrypt when needed for SSH operations. Alternatively, store a salted hash and regenerate the htpasswd entry when needed.

---

### C2. SSH Credentials (Root Passwords) Stored in Plaintext in Database
**File:** All VPS routes read `ssh_user, ssh_password` from `vps_instances` table
**Category:** OWASP A02 - Cryptographic Failures

Every VPS management route fetches `ssh_password` from the database and uses it directly. These are root-level SSH passwords stored unencrypted:

```typescript
const { data: vps } = await admin.from("vps_instances")
  .select("ip_address, ssh_user, ssh_password, ssh_port, ...")
```

**Impact:** Database breach exposes root SSH credentials for every customer VPS, enabling full server takeover.
**Recommendation:** Encrypt SSH passwords using `encryptCredentials()` before storing. Decrypt only when establishing SSH connections. Better yet, migrate to SSH key-based authentication, which eliminates password storage entirely.

---

## HIGH Findings

### H1. Cron Routes Missing Authentication: `mc-recurring` and `webhook-retry`
**Files:**
- `src/app/api/cron/mc-recurring/route.ts` -- **No auth check at all**
- `src/app/api/cron/webhook-retry/route.ts` -- **No auth check at all**
**Category:** OWASP A01 - Broken Access Control

Two cron endpoints have zero authentication. Compare with the other cron routes (`apply-pending-changes`, `cleanup-tickets`, `log-alerts`) which properly verify `CRON_SECRET`:

```typescript
// mc-recurring -- no auth
export async function GET() {
  const supabase = createAdminClient();
  // ... processes all users' recurring tasks
```

```typescript
// webhook-retry -- no auth
export async function GET() {
  const admin = createAdminClient();
  // ... retries webhooks for all users
```

Any unauthenticated request to `GET /api/cron/mc-recurring` or `GET /api/cron/webhook-retry` will execute admin operations.

**Impact:** Anyone can trigger recurring task creation for all users. Anyone can trigger webhook retries, potentially causing webhook floods to customer endpoints.
**Recommendation:** Add `CRON_SECRET` verification identical to the other cron routes.

---

### H2. `log-alerts` Cron Has Weak Auth Check
**File:** `src/app/api/cron/log-alerts/route.ts` (line 19)
**Category:** OWASP A01 - Broken Access Control

```typescript
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
```

The condition `if (cronSecret && ...)` means that if `CRON_SECRET` is not set in the environment, the check is **completely bypassed** and the route runs unauthenticated. The other cron routes (`apply-pending-changes`, `cleanup-tickets`) correctly fail-closed by returning 500 when `CRON_SECRET` is missing.

**Impact:** In any deployment where `CRON_SECRET` is accidentally not set, the log-alerts cron is publicly accessible and will SSH into all customer VPS instances.
**Recommendation:** Change to fail-closed pattern:
```typescript
if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 500 });
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

---

### H3. Middleware Does Not Protect API Routes
**File:** `src/middleware.ts` (lines 152-182)
**Category:** OWASP A01 - Broken Access Control

The middleware matcher does NOT include `/api/*` paths. This means:
- API route protection relies **entirely** on each route checking `supabase.auth.getUser()` individually
- If a developer forgets the auth check in a new route, it is fully public
- There is no defense-in-depth for API endpoints

```typescript
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    // NO /api/* entries
  ],
};
```

**Impact:** Any API route missing its auth check (like the cron routes above) is silently exposed.
**Recommendation:** Add `/api/:path*` to the middleware matcher (excluding public endpoints like webhook callbacks). Apply a blanket auth check for all `/api/*` routes except explicitly whitelisted paths.

---

### H4. Middleware Uses `getSession()` Instead of `getUser()` for Route Protection
**File:** `src/middleware.ts` (line 75)
**Category:** OWASP A07 - Identification and Authentication Failures

```typescript
// Use getSession() for fast route protection (reads JWT from cookie, no network call)
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user || null;
```

The comment acknowledges this is a performance shortcut. `getSession()` only reads the JWT from the cookie locally without verifying it against the Supabase server. An expired or revoked session token will still pass the middleware check. While individual API routes call `getUser()` (which does validate), the page-level protection relies on an unverified token.

**Impact:** A user with a revoked/expired session can still see dashboard pages (though API calls will fail). Could expose UI-level information.
**Recommendation:** This is an accepted tradeoff documented in the code. Keep as-is but ensure all API routes always use `getUser()` (which they do currently).

---

### H5. SSRF Risk in Webhook Retry and Agent Generate
**Files:**
- `src/app/api/cron/webhook-retry/route.ts` -- fetches `webhook.url` (user-provided)
- `src/app/api/agents/generate/route.ts` -- fetches `vps.openclaw_dashboard_url` (admin-set, lower risk)
**Category:** OWASP A10 - Server-Side Request Forgery

The webhook retry route fetches user-provided URLs. While there is an `isPrivateUrl()` check (line 37), the effectiveness depends on its implementation. If `isPrivateUrl()` can be bypassed (e.g., DNS rebinding, IPv6 loopback, octal notation), the server could be used to scan internal networks.

**Impact:** Potential internal network scanning, access to cloud metadata endpoints (e.g., `http://169.254.169.254/`).
**Recommendation:** Verify that `isPrivateUrl()` covers all bypass techniques. Consider using an allowlist approach or resolving DNS before checking.

---

## MEDIUM Findings

### M1. Account Deletion Does Not Delete All User Data
**File:** `src/app/api/account/delete/route.ts`
**Category:** OWASP A04 - Insecure Design

The deletion logic misses several tables that were added after the initial implementation:

**Missing from deletion:**
- `vps_instances` -- VPS record with SSH credentials persists after account deletion
- `user_api_keys` -- API keys for model providers remain
- `scheduled_restarts` -- Scheduled restart config remains
- `model_change_history` -- Model change audit trail remains
- `auto_responses` -- Auto-response rules remain
- `business_hours` -- Business hours config remains
- `log_alert_rules` / `log_alert_history` -- Alert configurations remain
- `conversation_intents` -- Intent analytics remain
- `channel_agent_routing` -- Routing configs remain
- `webhooks` / `webhook_deliveries` -- Webhook configs and delivery history remain
- `mc_tasks` / `mc_recurring_tasks` / `mc_templates` -- Mission control data remains
- `knowledge_base_*` tables -- Knowledge base documents and chunks remain
- `ticket-attachments` storage bucket -- Individual attachment files within ticket folders

**Impact:** Zombie SSH credentials in the database. PII and configuration data persists after deletion. Potential GDPR/privacy compliance violation.
**Recommendation:** Add all missing tables to the deletion cascade. Delete the `vps_instances` record. Clean up Supabase Storage buckets comprehensively.

---

### M2. In-Memory Rate Limiter Resets on Deployment
**File:** `src/lib/rate-limit.ts`
**Category:** OWASP A04 - Insecure Design

The rate limiter uses an in-memory `Map`. On Vercel (serverless), each function invocation may run in a different instance, and cold starts reset the store. This means:
- Rate limits are per-instance, not global
- A determined attacker can bypass limits by hitting different edge regions or waiting for cold starts
- Horizontal scaling dilutes rate limit effectiveness

**Impact:** Rate limits are ineffective against distributed attacks. Brute-force protection on sensitive endpoints (password change, account delete) is weakened.
**Recommendation:** For critical endpoints (login, password change, account deletion), consider using a Redis-backed or database-backed rate limiter. At minimum, acknowledge this limitation.

---

### M3. No Input Sanitization on VPS Logs `lines` Parameter
**File:** `src/app/api/vps/logs/route.ts` (line 46)
**Category:** OWASP A03 - Injection

```typescript
const lines = parseInt(request.nextUrl.searchParams.get("lines") || "100");
// ... later:
const logs = await getOpenClawLogs({ ... }, Math.min(lines, 500));
```

While `parseInt` + `Math.min` prevents excessively large values, `parseInt` of a non-numeric string returns `NaN`, and `Math.min(NaN, 500)` returns `NaN`. The `getOpenClawLogs` function would then execute `tail -n NaN` on the SSH command, which bash interprets as `tail -n 0` (harmless). No actual injection risk here due to how the value flows through `parseInt`, but it is sloppy input validation.

**Impact:** Minimal -- NaN handling is benign but indicates lack of input validation discipline.
**Recommendation:** Add `const clampedLines = Math.min(Math.max(parseInt(lines) || 100, 1), 500)`.

---

### M4. Ticket Attachment Storage Uses Public URLs
**File:** `src/app/api/tickets/attachment/route.ts` (line 101-102)
**Category:** OWASP A01 - Broken Access Control

```typescript
const { data: urlData } = admin.storage
  .from("ticket-attachments")
  .getPublicUrl(fileName);
```

Ticket attachments are stored with public URLs. While the file path includes `ticketId` (a UUID), anyone who knows or guesses the URL can access any ticket attachment without authentication. This applies to all ticket attachments including potentially sensitive screenshots, documents, etc.

**Impact:** Ticket attachments are accessible to anyone with the URL. URLs could be leaked via referrer headers, browser history, or logs.
**Recommendation:** Use signed URLs with expiration instead of public URLs. Or configure the `ticket-attachments` bucket as private and generate short-lived signed URLs on demand.

---

### M5. Avatar Upload Allows Any Image Type (No Server-Side Validation of Content)
**File:** `src/app/api/account/avatar/route.ts` (line 56)
**Category:** OWASP A08 - Software and Data Integrity Failures

```typescript
if (!file.type.startsWith("image/")) {
  return NextResponse.json({ error: "File must be an image" }, { status: 400 });
}
```

The MIME type check relies on the `Content-Type` provided by the client, which can be spoofed. A malicious user could upload an HTML file or SVG with embedded JavaScript while claiming `Content-Type: image/png`. The file is then served from Supabase Storage with its original content type.

**Impact:** Stored XSS if SVG files are uploaded and served inline. Content type spoofing could allow serving malicious content.
**Recommendation:** Validate file content (magic bytes) in addition to the declared MIME type. Reject SVG uploads entirely (they can contain JavaScript). Set `Content-Disposition: attachment` on served files.

---

### M6. SSL Check Route Uses `rejectUnauthorized: false`
**File:** `src/app/api/vps/ssl-check/route.ts` (line 61)
**Category:** OWASP A02 - Cryptographic Failures

```typescript
const req = https.request({
  hostname,
  port: 443,
  method: "HEAD",
  timeout: 10000,
  rejectUnauthorized: false,
});
```

This is intentional for the SSL checking use case (you need to see the cert even if it is invalid). However, the hostname comes from the database (`vps.hostname`), which should be safe. **Not a real vulnerability** -- documented here for completeness.

---

### M7. Payment Verification Trusts Client-Provided Metadata
**File:** `src/app/api/payments/verify/route.ts` (lines 50-51, 73-119)
**Category:** OWASP A08 - Software and Data Integrity Failures

```typescript
const meta = metadata || {};
// ... later:
await admin.from("subscriptions").upsert({
  plan: meta.plan,
  price: meta.amount || 0,
  // ...
});
```

After payment verification with the provider, the fulfillment logic uses `metadata` from the client request body to determine what plan to set and at what price. If the `verifyPayment()` function only checks that a payment occurred but not the amount/details, a user could pay $1 but submit metadata claiming they bought the Pro plan.

**Impact:** Users could potentially upgrade their subscription or buy agents at any price.
**Recommendation:** Store the expected payment amount and metadata server-side when creating the order (in a `pending_orders` table). During verification, compare the verified payment amount against the stored expected amount, not client-provided metadata.

---

## LOW Findings

### L1. No CORS Configuration
**Category:** OWASP A05 - Security Misconfiguration

There is no explicit CORS configuration in `next.config.ts` or middleware. Next.js API routes default to same-origin, which is generally safe. However, without explicit CORS headers, there is no protection against CSRF on state-changing POST endpoints beyond what Supabase session cookies provide (which use `SameSite=Lax` by default).

**Impact:** Low -- Supabase's `SameSite=Lax` cookies prevent most CSRF scenarios.
**Recommendation:** Consider adding explicit CORS headers to API routes if the API will be consumed from other origins.

---

### L2. Error Message Leaks Internal Details in VPS Status Route
**File:** `src/app/api/vps/status/route.ts` (line 71)
**Category:** OWASP A05 - Security Misconfiguration

```typescript
_stale_reason: `Status sync failed: ${message}`,
```

The Hostinger API error message is passed directly to the client. This could leak internal infrastructure details (API endpoint URLs, authentication errors, etc.).

**Impact:** Information disclosure about backend infrastructure.
**Recommendation:** Return a generic stale reason like `"Status sync temporarily unavailable"`.

---

### L3. Admin Role Check in Middleware Uses RLS-Scoped Client
**File:** `src/middleware.ts` (lines 111-116)
**Category:** OWASP A01 - Broken Access Control

```typescript
const { data: profile } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();
```

The admin role check uses the user-scoped Supabase client. If the RLS policy on the `users` table allows users to see their own row (typical), this works fine. But if a bug in RLS ever hides the user's own row, the admin check would fail-closed (denying access), which is the safe direction.

**Impact:** None currently -- this is fail-safe. Noted for awareness.

---

### L4. Channel Routing GET Endpoint Missing Rate Limit
**File:** `src/app/api/channels/[id]/routing/route.ts` (GET handler)
**Category:** OWASP A04 - Insecure Design

The GET handler for channel routing has no rate limit, while the PUT handler does. This is a minor inconsistency since GET endpoints are less costly, but it could allow rapid enumeration.

**Impact:** Minimal -- GET endpoints are typically cacheable and less resource-intensive.
**Recommendation:** Add rate limiting for consistency.

---

### L5. `ssh.ts` Does Not Sanitize `serviceName` in systemctl Commands
**File:** `src/lib/ssh.ts` (line 157)
**Category:** OWASP A03 - Injection

```typescript
await ssh.execCommand(`systemctl start ${serviceName}`);
```

The `serviceName` variable comes from parsing `systemctl list-unit-files` output, not from user input. Since it is derived from the VPS's own systemd configuration, command injection is not realistic here. However, if the VPS has a maliciously named service, it could theoretically inject commands.

**Impact:** Theoretical only -- attacker would need to already control the VPS to exploit this.
**Recommendation:** Wrap `serviceName` in quotes: `systemctl start "${serviceName}"`.

---

### L6. `deployAgent()` Filename Parameter Not Fully Sanitized
**File:** `src/lib/ssh.ts` (line 394)
**Category:** OWASP A03 - Injection

```typescript
await ssh.execCommand(
  `echo '${contentB64}' | base64 -d | docker exec -i openclaw sh -c 'cat > ${agentDir}/${filename}'`
);
```

The `filename` comes from `Object.entries(configFiles)` where `configFiles` is user-provided in the agent deploy/config routes. While `agentDir` is sanitized via `sanitizeAgentName()`, the `filename` keys of the config object are not sanitized. A malicious filename like `../../etc/passwd` could write files outside the agent directory.

**Impact:** Path traversal on the user's own VPS (which they already have root access to via the dashboard). Low actual impact since users already control their VPS.
**Recommendation:** Sanitize config file keys to alphanumeric + dots + hyphens only: `filename.replace(/[^a-zA-Z0-9._-]/g, '_')`.

---

## INFO Findings

### I1. Positive: Consistent Auth Pattern
Every user-facing API route follows the pattern:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
This uses `getUser()` which validates the token server-side. All database queries filter by `user_id`. No IDOR vulnerabilities were found in user-facing routes.

### I2. Positive: Encryption at Rest for Channel Credentials
Channel credentials (bot tokens, API keys) are encrypted with AES-256-GCM via `src/lib/crypto.ts` before storage. The implementation is correct: random IV per encryption, authenticated encryption (GCM), proper key management via environment variable.

### I3. Positive: Rate Limiting Coverage
All user-facing endpoints have rate limiting applied, with appropriate limits per action type (e.g., 3/min for password changes, 60/min for status polling).

### I4. Positive: Admin Route MFA Enforcement
Admin routes require role check + MFA (TOTP AAL2) when enrolled, providing strong protection for the admin panel.

---

## Summary of Recommendations (Prioritized)

### Immediate (P0 -- Do This Week)
1. **Add CRON_SECRET auth to `mc-recurring` and `webhook-retry`** -- publicly accessible admin endpoints
2. **Fix `log-alerts` fail-open auth** -- change to fail-closed pattern
3. **Encrypt SSH passwords in database** -- use existing `encryptCredentials()` from crypto.ts

### Short-term (P1 -- Do This Sprint)
4. **Encrypt dashboard passwords in database** -- same mechanism as SSH passwords
5. **Add `/api/*` to middleware matcher** -- defense-in-depth for API auth
6. **Fix account deletion to cover all tables** -- especially `vps_instances` and `user_api_keys`
7. **Use signed URLs for ticket attachments** -- not public URLs
8. **Validate payment metadata server-side** -- do not trust client metadata for fulfillment

### Medium-term (P2 -- Do This Month)
9. **Validate avatar upload content** (magic bytes, reject SVG)
10. **Sanitize config file keys in agent deploy** -- prevent path traversal
11. **Sanitize error messages** -- do not leak internal details
12. **Consider Redis-backed rate limiter** for critical endpoints
13. **Review `isPrivateUrl()` implementation** for SSRF bypass resistance

### Low Priority (P3 -- Track)
14. Add rate limiting to channel routing GET endpoint
15. Quote shell variables in SSH commands
16. Add explicit CORS headers

---

## Files Reviewed

**Core Infrastructure:**
- `src/middleware.ts`
- `src/lib/supabase.ts`, `supabase-server.ts`, `supabase-admin.ts`
- `src/lib/rate-limit.ts`
- `src/lib/crypto.ts`
- `src/lib/ssh.ts`

**VPS Routes (14 files):**
- `src/app/api/vps/status/route.ts`
- `src/app/api/vps/start/route.ts`
- `src/app/api/vps/stop/route.ts`
- `src/app/api/vps/restart/route.ts`
- `src/app/api/vps/logs/route.ts`
- `src/app/api/vps/logs/stream/route.ts`
- `src/app/api/vps/monitoring/route.ts`
- `src/app/api/vps/gateway-health/route.ts`
- `src/app/api/vps/password/route.ts`
- `src/app/api/vps/enable-embedding/route.ts`
- `src/app/api/vps/processes/route.ts`
- `src/app/api/vps/reboot/route.ts`
- `src/app/api/vps/scheduled-restart/route.ts`
- `src/app/api/vps/services/route.ts`
- `src/app/api/vps/ssl-check/route.ts`
- `src/app/api/vps/uptime/route.ts`

**Models Routes (3 files):**
- `src/app/api/models/change/route.ts`
- `src/app/api/models/history/route.ts`
- `src/app/api/models/performance/route.ts`

**Agents Routes (10 files):**
- `src/app/api/agents/deploy/route.ts`
- `src/app/api/agents/undeploy/route.ts`
- `src/app/api/agents/config/route.ts`
- `src/app/api/agents/generate/route.ts`
- `src/app/api/agents/analytics/route.ts`
- `src/app/api/agents/purchase/route.ts`
- `src/app/api/agents/[id]/config/route.ts`
- `src/app/api/agents/[id]/health/route.ts`
- `src/app/api/agents/[id]/model/route.ts`
- `src/app/api/agents/[id]/stats/route.ts`
- `src/app/api/agents/[id]/recent-messages/route.ts`

**Channels Routes (6 files):**
- `src/app/api/channels/connect/route.ts`
- `src/app/api/channels/disconnect/route.ts`
- `src/app/api/channels/health/route.ts`
- `src/app/api/channels/analytics/route.ts`
- `src/app/api/channels/[id]/messages/route.ts`
- `src/app/api/channels/[id]/routing/route.ts`

**Chat Routes (3 files):**
- `src/app/api/chat/send/route.ts`
- `src/app/api/chat/messages/route.ts`
- `src/app/api/chat/stream/route.ts`

**Tickets Routes (5 files):**
- `src/app/api/tickets/create/route.ts`
- `src/app/api/tickets/list/route.ts`
- `src/app/api/tickets/attachment/route.ts`
- `src/app/api/tickets/[id]/reply/route.ts`
- `src/app/api/tickets/[id]/resolve/route.ts`
- `src/app/api/tickets/[id]/reopen/route.ts`
- `src/app/api/tickets/[id]/rate/route.ts`

**Account Routes (5 files):**
- `src/app/api/account/update/route.ts`
- `src/app/api/account/password/route.ts`
- `src/app/api/account/delete/route.ts`
- `src/app/api/account/avatar/route.ts`
- `src/app/api/account/export/route.ts`
- `src/app/api/account/preferences/route.ts`

**Billing/Payments (3 files):**
- `src/app/api/billing/coupon/route.ts`
- `src/app/api/payments/create-order/route.ts`
- `src/app/api/payments/verify/route.ts`

**Other (3 files):**
- `src/app/api/onboarding/route.ts`
- `src/app/api/notifications/route.ts`

**Cron Routes (5 files):**
- `src/app/api/cron/apply-pending-changes/route.ts`
- `src/app/api/cron/cleanup-tickets/route.ts`
- `src/app/api/cron/log-alerts/route.ts`
- `src/app/api/cron/mc-recurring/route.ts`
- `src/app/api/cron/webhook-retry/route.ts`
