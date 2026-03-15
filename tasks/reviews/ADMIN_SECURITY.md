# ClawHQ Admin Panel Security Audit

**Auditor:** Claude Opus 4.6 (1M context)
**Date:** 2026-03-16
**Scope:** All admin pages, components, and API routes
**Severity Scale:** CRITICAL / HIGH / MEDIUM / LOW / INFO

---

## Executive Summary

The admin panel has a solid foundation: every API route checks `role === "admin"`, 2FA is enforced at the middleware level, and most destructive actions are audit-logged. However, there are several significant findings, including credentials returned in plaintext API responses, missing audit coverage for sensitive reads, no rate limiting on bulk operations, and incomplete cleanup on customer deletion. Below are detailed findings organized by the 15 audit categories.

---

## 1. Admin Role Verification

**Verdict: PASS (with notes)**

Every admin API route follows the same pattern:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return 401;
const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
if (!profile || profile.role !== "admin") return 403;
```

This is correct. The check uses `getUser()` (which validates the JWT against Supabase auth servers), not `getSession()` (which only reads the cookie JWT without server validation). This prevents token forgery.

**Routes verified (all pass):**
- `POST/GET /api/admin/provision`
- `GET/POST /api/admin/vps-password`
- `GET/POST/DELETE /api/admin/api-keys`
- `GET /api/admin/audit-logs`
- `POST/PATCH /api/admin/tickets/[id]`
- `DELETE /api/admin/customers/[id]`
- `PATCH /api/admin/customers/[id]/vps`
- `POST /api/admin/customers/[id]/subscription`
- `POST /api/admin/customers/bulk`
- `GET /api/admin/customers/[id]/health`
- `POST /api/admin/customers/[id]/auto-restart`
- `POST /api/admin/customers/[id]/migrate-docker`
- `GET /api/admin/customers/[id]/full`
- `GET /api/admin/customers/[id]/services`
- `POST /api/admin/customers/[id]/actions`

**Layout-level check:** `src/app/admin/layout.tsx` also checks `role === "admin"` server-side and redirects non-admins. This is defense-in-depth.

| Finding | Severity |
|---------|----------|
| No bypass found. All 15+ routes check correctly. | PASS |

---

## 2. Two-Factor Authentication (2FA)

**Verdict: PASS**

**Middleware enforcement** (`src/middleware.ts`, lines 104-137):
- All `/admin/*` routes (except `/admin/verify-2fa`) check the MFA assurance level.
- If admin has TOTP enrolled and `currentLevel !== "aal2"`, they are redirected to `/admin/verify-2fa`.
- The verify page uses Supabase MFA challenge/verify flow correctly.

**Potential concerns addressed:**
- The verify-2fa page is itself under the `/admin` layout, which checks `role === "admin"`. Non-admins cannot access it.
- If an admin has no MFA enrolled, they can access admin pages without 2FA. This is by design (security page allows enrollment).

| Finding | Severity |
|---------|----------|
| 2FA is enforced via middleware for admins who have it enabled. Cannot be bypassed. | PASS |
| 2FA is optional -- admin can disable it from `/admin/security` | LOW |

**Recommendation:** Consider making 2FA mandatory for all admin accounts. Currently, if an admin disables 2FA, they get full access without it.

---

## 3. Impersonation

**Verdict: NOT IMPLEMENTED**

There is no impersonation feature in the current codebase. Admin views customer data through the admin detail page (`/admin/customers/[id]`) using the service role client, not by impersonating the user's session.

| Finding | Severity |
|---------|----------|
| No impersonation feature exists. N/A. | INFO |

---

## 4. SSH Terminal

**Verdict: NO WebSocket TERMINAL (with SSH command execution concerns)**

There is no WebSocket-based SSH terminal. However, the admin panel executes arbitrary systemd commands on customer VPSes via SSH through several API routes:

- `/api/admin/customers/[id]/actions` -- restart/start/stop services, view logs
- `/api/admin/customers/[id]/health` -- SSH to check gateway status
- `/api/admin/customers/[id]/services` -- SSH to check all services + resources
- `/api/admin/customers/[id]/migrate-docker` -- extensive SSH operations
- `/api/admin/customers/[id]/auto-restart` -- enables auto-restart via SSH

**Command injection analysis:**

The `actions` route uses a whitelist of valid actions (`VALID_ACTIONS`) and maps them to a fixed `SERVICE_MAP`. The `action` field from the request body is validated against this whitelist before being used. No user-controlled strings are interpolated into SSH commands.

```ts
const VALID_ACTIONS = ["restart_openclaw", "restart_nginx", ...] as const;
if (!VALID_ACTIONS.includes(action)) return 400;
const service = SERVICE_MAP[action]; // Fixed lookup
command = `systemctl restart ${service}`; // service is from hardcoded map
```

This is safe against command injection.

| Finding | Severity |
|---------|----------|
| No WebSocket SSH terminal exists | PASS |
| SSH command execution uses hardcoded service names, no injection vector | PASS |
| SSH credentials (password) are fetched from DB per request, not cached dangerously | PASS |

---

## 5. Password Display

**Verdict: MIXED -- Good UI, Missing Audit**

**Dashboard password (`admin-dashboard-auth.tsx`):**
- Has show/hide toggle (Eye/EyeOff icons) -- PASS
- Has copy button -- PASS
- Password is masked by default (`type="password"`) -- PASS
- Viewing (toggling show) is NOT logged to audit -- **HIGH**
- Fetching credentials via `GET /api/admin/vps-password` is NOT logged to audit -- **HIGH**

**SSH password (`admin-vps-editor.tsx`):**
- Has show/hide toggle -- PASS
- SSH password is displayed in the edit form, masked by default -- PASS
- The `GET /api/admin/customers/[id]/full` route returns the full VPS record including `ssh_password` and `dashboard_password` in the response body -- **HIGH**
- Viewing SSH password is NOT logged to audit -- **HIGH**

| Finding | Severity |
|---------|----------|
| Password viewing is not audit-logged | HIGH |
| `GET /api/admin/vps-password` does not log credential access | HIGH |
| `GET /api/admin/customers/[id]/full` returns all credentials in response | HIGH |
| Show/hide toggle and copy button work correctly | PASS |

**Recommendations:**
1. Add audit logging for `GET /api/admin/vps-password` (credential viewed).
2. Add audit logging for `GET /api/admin/customers/[id]/full` (customer data viewed, includes credentials).
3. Consider not returning `ssh_password` and `dashboard_password` in the `/full` response. Instead, have separate endpoints that log access.

---

## 6. Cross-Admin Isolation

**Verdict: LOW RISK (single-admin system)**

Based on the codebase, there appears to be only one admin user. However, the audit log system records `admin_id` for each action and displays the admin's name/email in the audit log table. If multiple admins existed:

- All admins can see all audit logs (no admin-scoping).
- All admins can see all customer data.
- There is no role hierarchy (no "super-admin" vs "admin").

| Finding | Severity |
|---------|----------|
| No admin-level permissions/scoping (all admins see everything) | LOW |
| Audit logs correctly record which admin performed each action | PASS |

---

## 7. Credential Exposure

**Verdict: CRITICAL CONCERNS**

### 7a. Credentials in API Response Bodies

The following credentials are returned in API response bodies:

| Endpoint | Credential | Notes |
|----------|-----------|-------|
| `GET /api/admin/vps-password` | `dashboard_password`, `dashboard_username` | Plaintext in JSON |
| `POST /api/admin/vps-password` | `password` (new password) | Returns newly generated password |
| `GET /api/admin/customers/[id]/full` | Full `vps` object including `ssh_password`, `dashboard_password`, `data_api_token` | ALL credentials in one response |
| `POST /api/admin/provision` | SSH password in request body | Admin submits it -- acceptable |

### 7b. Credentials in React State

The `admin-customer-detail.tsx` component fetches the full customer record and stores it in React state:
```ts
const [data, setData] = useState<CustomerData | null>(null);
```
This includes `vps.ssh_password`, `vps.dashboard_password`, and `vps.data_api_token`. These values are held in memory for the lifetime of the component.

### 7c. localStorage / sessionStorage

No credentials are stored in localStorage or sessionStorage. Supabase auth tokens are managed via cookies.

### 7d. Error Message Leakage

Several routes expose internal details in error responses:

- `POST /api/admin/api-keys`: Returns `SSH config failed: ${result.error}` which may include internal SSH error messages
- `POST /api/admin/vps-password`: Returns `SSH error: ${result.error}`
- `POST /api/admin/customers/[id]/migrate-docker`: Returns container logs and step details on failure

| Finding | Severity |
|---------|----------|
| `GET /full` returns SSH password, dashboard password, and data API token in one response | CRITICAL |
| Dashboard password returned in plaintext from vps-password endpoint | HIGH |
| SSH credentials held in React state | MEDIUM |
| Error messages from SSH operations may leak internal details | MEDIUM |
| No localStorage credential storage | PASS |

**Recommendations:**
1. Never return `ssh_password` in the `/full` endpoint. Use a separate, audit-logged endpoint.
2. Mask or omit `data_api_token` from general-purpose responses.
3. Sanitize SSH error messages before returning them to the client.

---

## 8. Customer Data Access (RLS Bypass)

**Verdict: CORRECT**

All admin API routes use `createAdminClient()` (service role) to bypass RLS, which is correct for admin operations. The service role client is:
- Only created in API routes (server-side), never in client components.
- `createClient()` (cookie-based, RLS-respecting) is used for auth verification.
- `createAdminClient()` is used for data operations after auth is confirmed.

Admin cannot accidentally modify customer data through their own session because:
1. Auth verification uses `createClient()` (user's session).
2. Data operations use `createAdminClient()` (service role) with explicit `user_id` filters.

| Finding | Severity |
|---------|----------|
| RLS bypass is correctly scoped to admin operations only | PASS |
| Service role client is never exposed to the browser | PASS |

---

## 9. Bulk Operations

**Verdict: CONCERNS**

**Bulk endpoint:** `POST /api/admin/customers/bulk`

Available actions: `suspend`, `activate` (subscription status changes only).

| Concern | Status |
|---------|--------|
| No rate limiting | **MEDIUM** |
| No maximum batch size limit | **MEDIUM** |
| Self-action prevention (admin cannot bulk-suspend themselves) | PASS |
| Only subscription status changes (no bulk delete) | PASS |
| Action whitelist (`suspend`, `activate` only) | PASS |
| Audit logged with all userIds | PASS |

**No bulk delete exists** -- the delete operation is per-customer only, with a confirmation dialog requiring typing "confirm". This is good.

| Finding | Severity |
|---------|----------|
| No rate limiting on bulk operations | MEDIUM |
| No maximum userIds array size limit (could send thousands) | MEDIUM |
| No confirmation step for bulk actions (client-side only) | LOW |
| Cannot bulk-delete customers | PASS |

**Recommendations:**
1. Add server-side limit on `userIds.length` (e.g., max 50).
2. Add rate limiting (e.g., max 1 bulk action per 30 seconds).

---

## 10. Provisioning (Duplicate VPS)

**Verdict: PARTIALLY PROTECTED**

**Active job check:** The provision route checks for an active job before starting:
```ts
const active = getActiveJob();
if (active) return 409; // "A provisioning job is already running"
```
This prevents concurrent provisioning but only for simultaneous jobs, not for re-provisioning an already-provisioned customer.

**Overwrite behavior:** If a customer already has a VPS:
- The UI shows a warning: "This customer already has a VPS. Provisioning will overwrite it."
- The API upserts the VPS record (checks for `existing`, then `update` or `insert`).
- No confirmation is required server-side.

| Finding | Severity |
|---------|----------|
| Concurrent provisioning blocked (global active job check) | PASS |
| Re-provisioning overwrites existing VPS without server-side confirmation | MEDIUM |
| Only one provisioning job can run globally at a time | PASS |
| Job store uses `globalThis` (in-memory, lost on server restart) | LOW |

**Recommendation:** Add a server-side confirmation flag (e.g., `force: true`) when overwriting an existing VPS to prevent accidental re-provision.

---

## 11. Audit Trail

**Verdict: GOOD COVERAGE WITH GAPS**

### Actions that ARE logged:
| Action | Route | Logged |
|--------|-------|--------|
| VPS provisioned | `POST /provision` | YES |
| VPS password changed | `POST /vps-password` | YES |
| API key configured | `POST /api-keys` | YES |
| API key deleted | `DELETE /api-keys` | YES |
| Customer deleted | `DELETE /customers/[id]` | YES |
| VPS details updated | `PATCH /customers/[id]/vps` | YES |
| Subscription updated | `POST /customers/[id]/subscription` | YES |
| Bulk action | `POST /customers/bulk` | YES |
| Auto-restart enabled | `POST /auto-restart` | YES |
| Docker migration | `POST /migrate-docker` | YES |
| Ticket replied | `POST /tickets/[id]` | YES |
| Ticket updated | `PATCH /tickets/[id]` | YES |
| VPS actions (restart/stop/start) | `POST /actions` | YES |

### Actions that are NOT logged:
| Action | Route | Severity |
|--------|-------|----------|
| Credential viewed (dashboard password) | `GET /vps-password` | **HIGH** |
| Customer data viewed (includes all credentials) | `GET /customers/[id]/full` | **HIGH** |
| API keys listed | `GET /api-keys` | MEDIUM |
| Audit logs viewed | `GET /audit-logs` | LOW |
| Health check performed | `GET /health` | LOW |
| Services checked | `GET /services` | LOW |
| VPS logs viewed | `POST /actions` (view_logs) | MEDIUM |
| Admin login / session start | Middleware | **HIGH** |

| Finding | Severity |
|---------|----------|
| 13 admin write actions are logged -- good coverage | PASS |
| Credential read/view operations are not logged | HIGH |
| Admin login not logged (no audit entry for session start) | HIGH |
| Log viewing (view_logs action) not audit-logged | MEDIUM |
| Audit log includes IP address, admin ID, entity ID, and details | PASS |

**Recommendations:**
1. Log every credential access (`GET /vps-password`, SSH password viewed).
2. Log admin login events.
3. Log when admin views VPS logs (the `view_logs` action in `/actions` route does log the action, but the audit detail doesn't indicate what was read).

---

## 12. Session Management

**Verdict: RELIES ON SUPABASE DEFAULTS**

Session management is handled entirely by Supabase Auth:
- Sessions are stored in HTTP-only cookies (via `@supabase/ssr`).
- The middleware uses `getSession()` for fast route protection.
- API routes use `getUser()` for full JWT validation against the Supabase auth server.
- No custom session timeout is configured -- Supabase defaults apply.

**Cookie security:**
- Supabase SSR library handles `Secure`, `HttpOnly`, `SameSite` attributes.
- The middleware correctly passes cookies through in its response.

| Finding | Severity |
|---------|----------|
| No custom admin session timeout (uses Supabase defaults, typically 1 hour JWT + refresh) | MEDIUM |
| No "force logout all sessions" capability | LOW |
| Supabase handles cookie security attributes | PASS |

**Recommendations:**
1. Consider a shorter session timeout for admin accounts.
2. Add ability to revoke all admin sessions.

---

## 13. VPS Data API Access

**Verdict: CORRECTLY IMPLEMENTED**

The `vps-data-api.ts` helper:
- Fetches the customer's `data_api_token` from Supabase.
- Uses that token as `Authorization: Bearer ${token}` when calling the customer's VPS Data API.
- Each customer has their own token -- no shared credentials.
- Token is cached for 5 minutes with automatic eviction.
- Requests have a 10-second timeout with AbortController.

| Finding | Severity |
|---------|----------|
| Customer's own token used for VPS Data API calls | PASS |
| Token cached with TTL and eviction | PASS |
| Request timeout prevents hanging connections | PASS |
| Token is fetched using service role client (admin bypass) | PASS |

---

## 14. Delete Customer Cleanup

**Verdict: INCOMPLETE**

The `DELETE /api/admin/customers/[id]` route performs cascade deletion in this order:
1. Chat messages (via conversations)
2. Chat conversations
3. Ticket messages (via tickets)
4. Support tickets
5. User agents
6. Channels
7. User API keys
8. Models
9. VPS instances (DB record only)
10. Subscriptions
11. Users table row
12. Supabase auth user

### Missing cleanup:

| Missing Item | Severity | Notes |
|-------------|----------|-------|
| **VPS not deprovisioned** | **CRITICAL** | The VPS instance DB record is deleted, but the actual VPS server is not shut down or destroyed. The running VPS remains accessible with the old SSH credentials. |
| **Supabase Storage files** | **HIGH** | If the customer uploaded avatars or attachments, those remain in Supabase Storage buckets. |
| **DNS record** | **HIGH** | The Cloudflare DNS A record (e.g., `customer.clawhq.tech`) is not removed. It continues pointing to the now-orphaned VPS. |
| **Hostinger firewall rules** | MEDIUM | Firewall rules created during provisioning are not cleaned up. |
| **Webhooks** | MEDIUM | Webhooks table is not deleted (but is fetched in `/full` -- table may exist). |
| **Payments** | LOW | Payment records may be orphaned. |
| **SIEM configs** | LOW | SIEM webhook configurations are not cleaned up. |
| **Audit logs** | INFO | Audit logs referencing the deleted user are not cleaned up (this is probably intentional for accountability). |
| **VPS Data API data** | **HIGH** | All data on the customer's VPS (SQLite databases with events, sessions, analytics, KB data) remains on the orphaned VPS. |

| Finding | Severity |
|---------|----------|
| VPS server not deprovisioned on customer delete | CRITICAL |
| DNS record not cleaned up | HIGH |
| Storage files not cleaned up | HIGH |
| VPS data (SQLite on server) not cleaned up | HIGH |
| Self-deletion prevention works correctly | PASS |
| Confirmation dialog requires typing "confirm" | PASS |

**Recommendations:**
1. Before deleting the DB record, SSH into the VPS and run cleanup (or at minimum, stop all services).
2. Call the Cloudflare API to delete the DNS record.
3. Delete Supabase Storage files for the user.
4. Consider a "soft delete" approach that marks the user for deletion and runs cleanup asynchronously.

---

## 15. Error Messages

**Verdict: MINOR CONCERNS**

Error responses in admin routes:

| Route | Error Pattern | Concern |
|-------|-------------|---------|
| `POST /api-keys` | `SSH config failed: ${result.error}` | May leak SSH host info |
| `POST /vps-password` | `SSH error: ${result.error}` | May leak SSH connection details |
| `POST /migrate-docker` | Returns container logs on failure | May leak VPS internal state |
| `GET /health` | `error: err.message` | May leak SSH connection errors |
| `GET /services` | `error: err.message` | May leak SSH errors |
| `POST /actions` | Returns `result.stderr` | May leak system error output |
| `DELETE /customers/[id]` | Generic "Failed to delete customer" | GOOD -- does not leak details |
| `GET /audit-logs` | Generic "Failed to fetch audit logs" | GOOD |

| Finding | Severity |
|---------|----------|
| SSH error messages forwarded to client may reveal internal details | MEDIUM |
| Container logs returned in migrate-docker failure response | MEDIUM |
| Most deletion/update errors use generic messages | PASS |

**Recommendation:** Wrap SSH/system errors in generic messages. Log the detailed error server-side for debugging, return a sanitized message to the client.

---

## Summary of Findings by Severity

### CRITICAL (1)
1. **Customer deletion does not deprovision VPS** -- orphaned servers remain running with valid SSH credentials and customer data.

### HIGH (7)
2. `GET /api/admin/customers/[id]/full` returns SSH password, dashboard password, and data API token in a single response.
3. `GET /api/admin/vps-password` returns credentials without audit logging.
4. Password viewing (show/hide toggle) is not audit-logged.
5. Admin login/session events are not audit-logged.
6. Customer deletion does not clean up DNS records.
7. Customer deletion does not clean up Supabase Storage files.
8. Customer deletion does not clean up VPS-hosted data.

### MEDIUM (7)
9. No rate limiting on bulk operations.
10. No maximum batch size for bulk userIds.
11. SSH error messages leak internal details to client.
12. Container logs returned in error responses.
13. No custom admin session timeout.
14. Re-provisioning overwrites existing VPS without server-side confirmation.
15. VPS log viewing not distinctly audit-logged.

### LOW (4)
16. 2FA is optional for admin accounts.
17. No admin-level permission scoping (all admins equal).
18. No confirmation step for bulk suspend/activate (server-side).
19. Job store is in-memory (lost on server restart).

---

## Recommended Priority Actions

1. **[CRITICAL] Add VPS deprovisioning to customer delete flow** -- at minimum stop services, ideally destroy the VPS.
2. **[HIGH] Split credential access into separate, audit-logged endpoints** -- do not return `ssh_password` or `dashboard_password` in the `/full` response.
3. **[HIGH] Add audit logging for all credential read operations** -- `GET /vps-password`, viewing SSH credentials.
4. **[HIGH] Add admin login audit events** -- log when an admin session starts.
5. **[HIGH] Clean up DNS and Storage on customer delete** -- call Cloudflare API and Supabase Storage API.
6. **[MEDIUM] Add rate limiting and batch size limits** on bulk operations.
7. **[MEDIUM] Sanitize SSH/system error messages** before returning to client.
8. **[MEDIUM] Enforce mandatory 2FA** for admin accounts.
9. **[MEDIUM] Add shorter session timeout** for admin sessions.

---

## Files Audited

### Admin Pages (11 files)
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/verify-2fa/page.tsx`
- `src/app/admin/customers/page.tsx`
- `src/app/admin/customers/[id]/page.tsx`
- `src/app/admin/audit-logs/page.tsx`
- `src/app/admin/deploy/page.tsx`
- `src/app/admin/security/page.tsx`
- `src/app/admin/tickets/page.tsx`
- `src/app/admin/tickets/[id]/page.tsx`
- `src/app/admin/health/page.tsx`

### Admin Components (12 files)
- `src/components/dashboard/admin-2fa-setup.tsx`
- `src/components/dashboard/admin-audit-logs.tsx`
- `src/components/dashboard/admin-dashboard-auth.tsx`
- `src/components/dashboard/admin-delete-customer.tsx`
- `src/components/dashboard/admin-subscription-editor.tsx`
- `src/components/dashboard/admin-ticket-thread.tsx`
- `src/components/dashboard/admin-tickets.tsx`
- `src/components/dashboard/admin-vps-health.tsx`
- `src/components/dashboard/admin-api-keys.tsx`
- `src/components/dashboard/admin-deploy.tsx`
- `src/components/dashboard/admin-vps-editor.tsx`
- `src/components/dashboard/admin-customer-detail.tsx`
- `src/components/dashboard/admin-customers.tsx`
- `src/components/dashboard/admin-bulk-health.tsx`

### Admin API Routes (15 files)
- `src/app/api/admin/provision/route.ts`
- `src/app/api/admin/vps-password/route.ts`
- `src/app/api/admin/api-keys/route.ts`
- `src/app/api/admin/audit-logs/route.ts`
- `src/app/api/admin/tickets/[id]/route.ts`
- `src/app/api/admin/customers/[id]/route.ts`
- `src/app/api/admin/customers/[id]/vps/route.ts`
- `src/app/api/admin/customers/[id]/subscription/route.ts`
- `src/app/api/admin/customers/bulk/route.ts`
- `src/app/api/admin/customers/[id]/health/route.ts`
- `src/app/api/admin/customers/[id]/auto-restart/route.ts`
- `src/app/api/admin/customers/[id]/migrate-docker/route.ts`
- `src/app/api/admin/customers/[id]/full/route.ts`
- `src/app/api/admin/customers/[id]/services/route.ts`
- `src/app/api/admin/customers/[id]/actions/route.ts`

### Supporting Files
- `src/middleware.ts`
- `src/lib/audit-log.ts`
- `src/lib/vps-data-api.ts`
