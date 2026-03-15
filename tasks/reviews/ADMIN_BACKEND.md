# Admin Backend API Review

**Reviewer role:** Backend Developer
**Scope:** All files under `src/app/api/admin/` (15 route files)
**Date:** 2026-03-16

---

## Files Reviewed

| # | Route File | Methods |
|---|-----------|---------|
| 1 | `admin/api-keys/route.ts` | GET, POST, DELETE |
| 2 | `admin/audit-logs/route.ts` | GET |
| 3 | `admin/customers/[id]/actions/route.ts` | POST |
| 4 | `admin/customers/[id]/auto-restart/route.ts` | POST |
| 5 | `admin/customers/[id]/full/route.ts` | GET |
| 6 | `admin/customers/[id]/health/route.ts` | GET |
| 7 | `admin/customers/[id]/migrate-docker/route.ts` | POST |
| 8 | `admin/customers/[id]/route.ts` | DELETE |
| 9 | `admin/customers/[id]/services/route.ts` | GET |
| 10 | `admin/customers/[id]/subscription/route.ts` | POST |
| 11 | `admin/customers/[id]/vps/route.ts` | PATCH |
| 12 | `admin/customers/bulk/route.ts` | POST |
| 13 | `admin/provision/route.ts` | GET, POST |
| 14 | `admin/tickets/[id]/route.ts` | POST, PATCH |
| 15 | `admin/vps-password/route.ts` | GET, POST |

**Total handlers reviewed:** 22

---

## 1. Admin Role Verification

**Verdict: PASS — every route checks admin role**

All 22 handlers verify the caller is an authenticated admin using the same two-step pattern:

```
1. createClient() → auth.getUser() → 401 if no user
2. query users.role → 403 if not "admin"
```

| Route | Auth Check |
|-------|-----------|
| api-keys GET/POST/DELETE | Per-handler check |
| audit-logs GET | Per-handler check |
| customers/[id]/actions POST | Per-handler check |
| customers/[id]/auto-restart POST | Per-handler check |
| customers/[id]/full GET | Per-handler check |
| customers/[id]/health GET | Per-handler check |
| customers/[id]/migrate-docker POST | Per-handler check |
| customers/[id]/route DELETE | Per-handler check |
| customers/[id]/services GET | Per-handler check |
| customers/[id]/subscription POST | Per-handler check |
| customers/[id]/vps PATCH | Per-handler check |
| customers/bulk POST | Per-handler check |
| provision POST | Per-handler check |
| provision GET | Auth check only (no role check) |
| tickets/[id] POST/PATCH | Shared `verifyAdmin()` helper |
| vps-password GET/POST | Per-handler check |

### Issues Found

**[MEDIUM] `provision/route.ts` GET handler missing admin role check (line 92-127)**

The GET handler for polling job status only checks `auth.getUser()` — it does NOT check `profile.role === "admin"`. Any authenticated user could poll provisioning job status by guessing/knowing a job ID. The same route's POST handler correctly checks admin role.

**[LOW] Duplicated auth boilerplate across 13 files**

The admin auth pattern is copy-pasted in every handler (typically 12 lines). Only `tickets/[id]/route.ts` extracts it into a shared `verifyAdmin()` helper. This creates maintenance risk — a bug in the pattern would need to be fixed in 13 places. Consider a shared middleware or helper.

---

## 2. Supabase Admin Client Usage (RLS Bypass)

**Verdict: PASS**

All routes correctly use `createAdminClient()` (service role, bypasses RLS) for data operations that read/write other users' data. The regular `createClient()` is only used for auth verification of the calling admin. No route accidentally uses the session client for cross-user queries.

No issues found.

---

## 3. SSH Connection Handling

**Verdict: PASS with minor concerns**

Six routes establish direct SSH connections via `NodeSSH`:

| Route | readyTimeout | finally dispose |
|-------|-------------|-----------------|
| actions | 10000ms | Yes |
| health | 8000ms | Yes |
| migrate-docker | 15000ms | Yes |
| services | 10000ms | Yes |
| auto-restart | (delegated to `ssh.ts`) | (delegated) |
| api-keys | (delegated to `ssh.ts`) | (delegated) |
| vps-password | (delegated to `ssh.ts`) | (delegated) |

All direct SSH connections use `try/finally` with `ssh.dispose()` in the `finally` block. No connection leak paths.

### Issues Found

**[LOW] No command-level timeout on SSH exec**

SSH `readyTimeout` only covers the connection handshake. Individual `ssh.execCommand()` calls have no timeout. A hung command (e.g., `systemctl restart` on a frozen service) would block the request indefinitely until the Next.js function timeout kills it. This is especially risky in `services/route.ts` which runs 9 parallel commands, and `migrate-docker/route.ts` which runs many sequential commands.

**[INFO] migrate-docker uses `sleep 30` over SSH**

Line 194 of `migrate-docker/route.ts` does `await ssh.execCommand("sleep 30")`. This holds the SSH connection open for 30 seconds to wait for the container to start. This is acceptable given the 5-minute `maxDuration`, but a polling loop with shorter sleeps would be more resilient.

---

## 4. VPS Data Access

**Verdict: PASS — no vpsDataFetch usage in admin routes**

Admin routes access VPS data exclusively through Supabase (vps_instances table) and direct SSH commands. The `vpsDataFetch` pattern (for user-facing routes hitting the VPS data API) is not used in admin routes, which is correct — admin operations need direct VPS access for management tasks.

The `audit-log.ts` library does conditionally use `vpsDataFetch` when a `userId` is provided and the user has a VPS data API, but admin routes pass `adminId` (not `userId`), so audit logs for admin actions always go to Supabase. This is correct behavior.

No issues found.

---

## 5. Provisioning Pipeline

**Verdict: PASS with minor issues**

The provisioning pipeline in `provision/route.ts` follows the documented 12-step flow:

1. Step 0: Cloudflare DNS (createSubdomain) — error stops pipeline
2. SSL/HTTPS zone settings (ensureSslFull, ensureAlwaysHttps) — failures silently ignored
3. Step 1: Hostinger firewall (ensureFirewallPorts) — non-fatal, gracefully skipped
4. Steps 2-11: SSH provisioning delegated to `provisionVPS()` from `provision-v3.ts` with step callback

### Issues Found

**[MEDIUM] SSL/HTTPS failures silently swallowed (lines 173-178)**

```typescript
const ssl = await ensureSslFull();
if (!ssl.success) {
}
const https = await ensureAlwaysHttps();
if (!https.success) {
}
```

The empty `if` blocks after `ensureSslFull()` and `ensureAlwaysHttps()` indicate these failures are intentionally non-blocking, but they produce no log output, no step update, and no warning. If Cloudflare SSL settings fail, the VPS will be provisioned but HTTPS will be broken. At minimum these should log a warning or add a step note.

**[LOW] Audit log fires before provisioning completes (line 86)**

The `logAudit` call with action `vps_provisioned` fires immediately after creating the background job, before provisioning actually runs. If provisioning fails, the audit log still says "vps_provisioned." The action name should be `vps_provision_started` or the log should fire in `runProvisioning()` on success.

**[LOW] No concurrency guard beyond single-job check**

`getActiveJob()` prevents multiple simultaneous provisions, but it's an in-memory check. In a multi-instance deployment (multiple Next.js server instances), two admins could start provisions simultaneously since they don't share the `globalThis` job store.

**[INFO] randomBytes import unused in provision/route.ts**

Line 3 imports `randomBytes` from `crypto`, but `crypto.randomUUID()` is used on line 71 instead. The `randomBytes` call on line 227 uses the import, so this is not dead code — disregard.

---

## 6. Bulk Operations

**Verdict: PASS with issues**

The bulk route (`customers/bulk/route.ts`) handles suspend/activate operations.

### Issues Found

**[HIGH] No batch size limit on bulk operations**

The route accepts `userIds` as an array with no maximum size. An admin could pass thousands of user IDs in a single request, which would generate a single massive SQL `IN()` clause. This could cause:
- Database timeouts on the Supabase side
- Denial of service from an overly large request body

Add a batch size limit (e.g., `if (userIds.length > 100) return 400`).

**[MEDIUM] No rate limiting on bulk endpoint**

There is no rate limiting on the bulk endpoint. Repeated calls could overload the database. While admin-only access reduces risk, a compromised admin session could abuse this.

**[LOW] Bulk action only updates subscriptions**

The "suspend" action sets subscription status to "cancelled" but does not actually stop the VPS or revoke access. A suspended user's VPS continues running. This may be intentional (billing-level suspension) but should be documented.

---

## 7. Audit Logging

**Verdict: PASS — comprehensive coverage**

| Route | Action Logged |
|-------|--------------|
| api-keys POST | `api_key_configured` |
| api-keys DELETE | `api_key_deleted` |
| customers/[id]/actions POST | `vps_{action}` |
| customers/[id]/auto-restart POST | `auto_restart_enabled` |
| customers/[id]/route DELETE | `customer_deleted` |
| customers/[id]/subscription POST | `subscription_updated` |
| customers/[id]/vps PATCH | `vps_updated` |
| customers/bulk POST | `bulk_action` |
| provision POST | `vps_provisioned` |
| migrate-docker POST | `vps_migrated_docker` |
| tickets/[id] POST | `ticket_replied` |
| tickets/[id] PATCH | `ticket_updated` |
| vps-password POST | `vps_password_changed` |

### Issues Found

**[MEDIUM] Three read-only routes with no audit logging**

The following routes have no audit logging. While they are read-only, accessing sensitive data (SSH credentials, health info) is typically audit-worthy in regulated environments:

- `customers/[id]/full/route.ts` — returns SSH passwords, API keys, full customer profile
- `customers/[id]/health/route.ts` — returns VPS health info
- `customers/[id]/services/route.ts` — returns service status + resource usage

**[LOW] `api-keys GET` and `audit-logs GET` not audit-logged**

Viewing API keys and audit logs themselves are sensitive read operations that are not logged.

**[LOW] `vps-password GET` not audit-logged**

Reading dashboard credentials (username/password) is not logged. Only password changes are logged.

**[INFO] logAudit is fire-and-forget**

All `logAudit` calls are not awaited (the function is async but the `await` is missing in most call sites). This is by design — audit logging is non-blocking. However, if the process exits immediately after the response, audit entries could be lost.

---

## 8. Error Handling

**Verdict: PASS — consistent pattern**

All routes follow a consistent error handling pattern:
- 401 for unauthenticated
- 403 for non-admin
- 400 for invalid input
- 404 for missing resources
- 500 for internal errors
- SSH errors caught in try/catch with informative messages

### Issues Found

**[MEDIUM] Customer DELETE swallows actual error details (line 121)**

```typescript
catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
}
```

The cascade delete (12 sequential operations) catches all errors but returns a generic message. If step 5 of 12 fails, you get no indication which step failed or what the actual error was. The partial delete leaves the database in an inconsistent state with no recovery path. At minimum, log `err.message` server-side.

**[MEDIUM] api-keys DELETE does not check for DB delete errors (line 204-208)**

The `admin.from("user_api_keys").delete()` result is not checked for errors. If the delete fails, the code continues to re-push keys to VPS (which would still include the "deleted" key).

**[LOW] health/route.ts returns 200 on SSH failure (line 107)**

When SSH connection fails, the health endpoint returns `{ gateway_active: false, error: "..." }` with status 200. The caller must check the `error` field to distinguish "VPS is down" from "SSH failed." This is arguably intentional (health check semantics) but inconsistent with other routes that return 500 on SSH failure.

---

## 9. Response Consistency

**Verdict: MOSTLY CONSISTENT**

Success responses use `{ success: true, ... }` or return data directly.
Error responses use `{ error: "message" }` with appropriate HTTP status.

### Issues Found

**[LOW] Mixed success response patterns**

Some routes return `{ success: true }` (actions, auto-restart, subscription, vps, bulk, tickets, vps-password), while others return data directly without a `success` field (api-keys GET returns `{ keys: [] }`, full GET returns data object, health GET returns health data). This is fine for GETs but could be standardized.

**[LOW] api-keys POST returns `debug` field in production (line 167)**

```typescript
return NextResponse.json({ success: true, configured: true, debug: result.debug });
```

The `debug` field from SSH operations is returned to the client. This could leak internal VPS path information or command output.

---

## 10. Dead Code

**Verdict: PASS — minimal dead code**

### Issues Found

**[LOW] Empty if-blocks in provision/route.ts (lines 175, 178)**

```typescript
if (!ssl.success) {
}
if (!https.success) {
}
```

These are effectively dead branches that should either handle the error or be removed.

**[INFO] `randomBytes` import in provision/route.ts**

Imported on line 3 and used on line 227. Not dead code, but `crypto.randomUUID()` is used for the job ID instead. Consistent.

---

## Summary of All Issues

### HIGH (1)
| # | File | Issue |
|---|------|-------|
| 1 | `customers/bulk/route.ts` | No batch size limit on userIds array — unbounded IN() clause |

### MEDIUM (6)
| # | File | Issue |
|---|------|-------|
| 2 | `provision/route.ts` GET | Missing admin role check — any authenticated user can poll job status |
| 3 | `provision/route.ts` | SSL/HTTPS failures silently swallowed with empty if-blocks |
| 4 | `provision/route.ts` | Audit log says "vps_provisioned" before provisioning actually runs |
| 5 | `customers/[id]/full/route.ts` | No audit logging for accessing sensitive customer data (SSH creds, API keys) |
| 6 | `customers/[id]/route.ts` | DELETE cascade swallows error details, no partial-failure recovery |
| 7 | `api-keys/route.ts` | DELETE handler does not check DB delete result before re-pushing keys |

### LOW (10)
| # | File | Issue |
|---|------|-------|
| 8 | All 13 files | Duplicated auth boilerplate (12 lines per handler) |
| 9 | actions, health, services, migrate-docker | No command-level timeout on SSH execCommand |
| 10 | `provision/route.ts` | Audit log fires before provisioning succeeds |
| 11 | `provision/route.ts` | Single-process concurrency guard won't work in multi-instance deploy |
| 12 | `customers/bulk/route.ts` | Suspend only changes subscription status, does not stop VPS |
| 13 | `customers/bulk/route.ts` | No rate limiting on bulk endpoint |
| 14 | `health/route.ts` | Returns 200 on SSH failure (error in body, not status code) |
| 15 | `api-keys/route.ts` | POST returns `debug` field that could leak internal info |
| 16 | `vps-password/route.ts` GET | Reading credentials not audit-logged |
| 17 | `provision/route.ts` | Empty if-blocks (dead branches) for SSL/HTTPS failures |

---

## Recommended Fixes (Priority Order)

1. **Add batch size limit to bulk route** — `if (userIds.length > 50) return 400`
2. **Add admin role check to provision GET handler** — copy the same pattern from POST
3. **Log or surface SSL/HTTPS failures** during provisioning — at minimum `console.warn`
4. **Rename audit action** from `vps_provisioned` to `vps_provision_started`, or log on completion
5. **Add audit logging** to `customers/[id]/full` GET (sensitive data access)
6. **Check DB delete result** in api-keys DELETE before re-pushing to VPS
7. **Add error details** to customer DELETE catch block (log server-side, return which step failed)
8. **Extract shared `verifyAdmin()` helper** to a common utility (like tickets route already does)
9. **Remove `debug` field** from api-keys POST production response
10. **Add command timeouts** to SSH exec calls in routes that run direct commands
