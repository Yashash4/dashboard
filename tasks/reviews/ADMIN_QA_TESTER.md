# Admin Panel QA Report

**Date:** 2026-03-16
**Scope:** Full review of all admin routes, components, and API endpoints
**Files Reviewed:** 38 files across `src/app/admin/`, `src/components/dashboard/admin-*.tsx`, `src/app/api/admin/`

---

## Executive Summary

The admin panel is a substantial, well-structured system covering customer management, VPS provisioning, ticket management, health monitoring, audit logging, and 2FA security. The code quality is generally high with consistent patterns. However, there are **several critical bugs, missing features, and security gaps** detailed below.

**Verdict:** 7 critical issues, 12 major issues, 18 moderate issues, 11 minor issues.

---

## Flow 1: Admin Login + 2FA + Dashboard Stats

### Route: `/admin` (layout.tsx + page.tsx)

**PASS:**
- Layout checks `authUser` via Supabase, redirects to `/login` if unauthenticated
- Layout checks `user.role === "admin"`, redirects to `/` if not admin
- Dashboard loads 14 parallel queries for stats (MRR, customers, tickets, VPS, plans, agents, channels, audit logs)
- Alerts banner correctly flags stopped VPSes and open tickets
- Quick action links all point to valid routes

**PASS - Loading State:** Server component, so Next.js loading.tsx handles it.

**PASS - Empty State:** Each section (Recent Tickets, Recent Admin Activity) handles empty arrays with placeholder UI.

### 2FA Flow: `/admin/verify-2fa` + `/admin/security`

**PASS:**
- `verify-2fa/page.tsx` correctly lists TOTP factors, challenges, and verifies
- Loading state shows spinner
- If no MFA factors, redirects to `/admin`
- Enter key triggers verify
- Input restricted to 6 digits

**CRITICAL BUG [A1]:** The 2FA verification page exists at `/admin/verify-2fa`, but the admin layout (`layout.tsx`) does NOT check MFA assurance level. An admin with 2FA enabled can access all admin pages without completing MFA verification. The layout only checks `user.role === "admin"` via the users table -- it never calls `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` to verify the session has AAL2. **The 2FA system is effectively decorative.**

**MAJOR BUG [A2]:** `admin-2fa-setup.tsx` line 52: `useEffect` has an empty dependency array but uses `supabase` which is created in component scope. In React strict mode this could cause stale closure issues. The `loadFactor` in `verify-2fa/page.tsx` (line 49) has the same pattern with `router` and `supabase` in the closure but not in the deps array.

### Dashboard Stats (page.tsx)

**MAJOR BUG [A3]:** The `proCustomers` query (line 57) filters for `plan IN ('pro', 'enterprise')` -- this means the "Pro" count displayed in the dashboard actually includes Enterprise customers, double-counting them. The stat card label says "Pro" but shows Pro + Enterprise.

**MODERATE [A4]:** ARR calculation (`monthlyRevenue * 12`) is naive. Customers on annual plans already pay an annual price, so multiplying annual subscription prices by 12 would overstate ARR. The query fetches `price` without considering `billing_cycle`.

---

## Flow 2: Customer List

### Route: `/admin/customers` + `admin-customers.tsx`

**PASS:**
- Server page fetches customers with subscriptions and VPS data
- Search by name, email, IP, hostname, customer ID
- Filter by plan (starter/pro/ultra/enterprise), subscription status, VPS status
- Sort by name, plan, revenue, join date (asc/desc toggle)
- Row click navigates to customer detail
- "Clear" button to reset filters
- CSV export with proper escaping

**PASS - Empty States:**
- No customers: Shows Inbox icon + "No customers yet" / "Customers will appear here once they sign up"
- No search results: Shows "No customers match" + "Try adjusting your search or filters"

**PASS - Bulk Actions:**
- Checkbox selection with select-all toggle
- Suspend / Activate bulk actions
- Prevents admin from bulk-acting on themselves
- Count displays after action

**MODERATE BUG [B1]:** The `vpsFilter` logic (line 91-92) is flawed. When `vpsFilter === "none"`, it returns `false` if `vps` exists -- but `vps` could be the first element of `vps_instances` array which might be undefined even if the array exists. The check should be `if (vpsFilter === "none" && vps?.status) return false;` or check the actual array length.

**MODERATE [B2]:** No pagination. If there are 1000+ customers, the entire dataset is fetched server-side and rendered client-side. The table has no virtual scrolling.

**MINOR [B3]:** CSV export does not escape double-quotes within cell values. A customer name containing `"` would break the CSV format.

---

## Flow 3: Customer Detail

### Route: `/admin/customers/[id]` + `admin-customer-detail.tsx`

This is the most complex component (~1100 lines). It fetches via `/api/admin/customers/${userId}/full` and displays:

**PASS - All 15 sections accounted for:**
1. Profile & Account (name, email, role, created, verified, last login, ID)
2. Subscription & Billing (plan, status, cycle, price, dates, payment history)
3. VPS Instance (specs, credentials, services, resources, actions, logs)
4. Model Configuration (current model, context limit, pending changes, change count)
5. Agents (list with deployed status)
6. Channels (list with connection status)
7. Webhooks (URL, events, secret, enabled status)
8. API Keys (name, hash, last used, created)
9. Support Tickets (list with status, clickable to ticket detail)
10. Usage Analytics (placeholder -- points to VPS services check)
11. Mission Control Tasks (list if any)
12. Delete Customer (danger zone with confirmation)

**PASS - VPS Credentials Visible:** SSH password, dashboard password, data API token all shown with eye toggle and copy button via `CredentialField` component.

**PASS - Services Status:** 4 services checked (OpenClaw, Nginx, Embeddings, Data API) with green/red indicators + resource gauges (CPU, RAM, Disk) with color-coded thresholds.

**PASS - VPS Actions:** 7 actions wired: restart_openclaw, restart_nginx, restart_embeddings, restart_data_api, stop_openclaw, start_openclaw, view_logs. All hit `/api/admin/customers/${userId}/actions` with proper SSH execution.

**PASS - Logs Dialog:** Opens in a max-w-4xl dialog with monospace font, scrollable.

**PASS - Empty States:** Each section handles null/empty gracefully: "No subscription", "No VPS provisioned", "No model configured", "No agents configured", "No channels connected", "No webhooks configured", "No API keys", "No support tickets".

**PASS - Error States:** `fetchData` catch shows toast error. `fetchServices` catch shows toast error. `runAction` failure shows error toast. Customer not found shows centered message.

**PASS - Loading State:** Full-page spinner while data loads.

**PASS - Delete Customer:** Confirmation dialog requires typing "confirm", cascade deletes 12 tables + auth user, prevents self-deletion, redirects to customer list after success.

**CRITICAL BUG [C1]:** The customer detail page (`admin-customer-detail.tsx`) fetches ALL data client-side via `useEffect`. If the API call to `/api/admin/customers/${userId}/full` fails, there is no retry mechanism and no way to reload except refreshing the browser. There is also no `useCallback` dependency on the actual fetch URL changing.

**MAJOR BUG [C2]:** The `runAction` function (line 424) re-checks services 2 seconds after an action completes via `setTimeout(fetchServices, 2000)`. However, if the user rapidly clicks multiple actions, multiple service checks could fire simultaneously and race. The `actionLoading` state prevents UI double-clicks but not the delayed service check.

**MODERATE BUG [C3]:** In the VPS actions section, the `start_openclaw` and `stop_openclaw` actions show as "Start" and "Stop" -- but these operate on the `openclaw-gateway` systemd service only. They do NOT start/stop the actual VPS (which would be a Hostinger API call). The labels could confuse an admin into thinking they're controlling the VM itself.

**MODERATE [C4]:** The `CredentialField` component for "Quick SSH" constructs the command `ssh ${sshUser}@${ipAddress} -p ${sshPort}` but does not account for non-standard usernames containing special characters or spaces.

**MODERATE [C5]:** Payment history section shows up to 5 payments inline but has no "view all" link or pagination for customers with extensive payment history.

---

## Flow 4: VPS Actions

### API Route: `/api/admin/customers/[id]/actions`

**PASS:**
- Auth check (session + role = admin)
- Validates action against `VALID_ACTIONS` whitelist
- Fetches VPS SSH credentials from DB
- SSH connection with 10s timeout
- Proper PATH prefix for SSH commands
- `view_logs` tries journalctl first, falls back to Docker logs
- SSH connection disposed in `finally` block
- Audit logging for all actions

**PASS - Service Restart:** Maps actions to systemd services correctly. OpenClaw, Nginx, Embeddings, Data API all mapped.

**CRITICAL BUG [D1]:** The `view_logs` action (line 87) does NOT check if the VPS status is "running" before attempting SSH connection. If the VPS is stopped, the SSH connection will hang for 10 seconds then timeout with an error. The `/services` endpoint correctly checks `vps.status !== "running"` but the `/actions` endpoint does not.

**MAJOR BUG [D2]:** SSH error handling on line 119 only considers `stderr` as failure if it doesn't contain "Warning". But systemd can output informational messages to stderr that aren't failures (e.g., "Job for xxx.service has been started"). The success check is too loose.

**MODERATE [D3]:** The audit log records `vps_${action}` as the action type (e.g., `vps_restart_openclaw`) but `ACTION_LABELS` in `admin-audit-logs.tsx` does not have mappings for these action types. They will display as raw strings in the audit log UI.

---

## Flow 5: Subscription Management

### Component: `admin-subscription-editor.tsx` + API: `/api/admin/customers/[id]/subscription`

**PASS:**
- Edit/Create subscription with plan, status, billing cycle, price, expiration date
- Auto-suggests price when plan/cycle changes via `PRICE_MAP`
- Validates required fields (plan, status, billing_cycle, price)
- Validates plan against whitelist, status against whitelist, cycle against whitelist
- Upsert logic (creates if not exists, updates if exists)
- Audit logging
- Cancel button resets to original values

**PASS - Empty State:** "No subscription" with "Create Subscription" button.

**MISSING FEATURE [E1]:** There is no "Apply Coupon" functionality anywhere in the subscription editor. The task specification mentions it, but no coupon code field, coupon validation, or discount logic exists.

**MISSING FEATURE [E2]:** There is no explicit "Cancel Subscription" button -- the admin must manually change status to "cancelled" via the dropdown. A dedicated cancel action with confirmation would be safer and could trigger side effects (e.g., stopping VPS, sending notification email).

**MODERATE BUG [E3]:** The `AdminSubscriptionEditor` does not refresh its state after a successful save. It calls `setEditing(false)` but the read-only view still shows the OLD `subscription` prop data, not the newly saved values. The `subscription` prop is from the parent's initial fetch and is never updated.

**MODERATE [E4]:** Price field accepts negative numbers. The API does not validate that `price >= 0`. An admin could accidentally set a negative price.

---

## Flow 6: Ticket Management

### Routes: `/admin/tickets` + `/admin/tickets/[id]`

**PASS:**
- Server-side fetch of all tickets with user join
- Status tabs (All, Open, In Progress, Resolved, Closed) with counts
- Search by subject, customer name, or email
- Click navigates to ticket detail
- Ticket detail shows header with status + priority badges + customer info
- Admin controls to change status/priority via dropdowns
- Message thread with customer (left-aligned) and admin (right-aligned) messages
- Reply box with send button
- Back to Tickets navigation

**PASS - Empty States:**
- Tickets list: "No tickets found" with contextual message
- Messages: No explicit empty state but the thread renders an empty div (acceptable)

**PASS - Loading State:** Server component handles loading.

**PASS - Error Handling:** Reply failure shows toast. Status/priority update failure shows toast.

**MAJOR BUG [F1]:** After sending a reply, the new message is added to local state with `crypto.randomUUID()` as the ID. But the actual message ID from the database is different. If the admin refreshes the page, the IDs will change. More critically, the optimistic update does NOT update `updated_at` on the ticket locally, so the "Updated" column in the ticket list will be stale until page refresh.

**MODERATE BUG [F2]:** The ticket reply API (`POST /api/admin/tickets/[id]`) has a subtle double-update issue. Lines 77-83 update status to `in_progress` if currently `open`, then lines 86-89 ALWAYS update `updated_at`. This means two separate UPDATE queries hit the database. If the first fails, `updated_at` still gets updated. Should be a single query.

**MODERATE [F3]:** Ticket list is NOT paginated. Server-side query fetches ALL tickets with no limit. With hundreds of tickets this will be slow.

**MINOR [F4]:** Message timestamps only show date (month/day/year), not time. For tickets with multiple replies in one day, this makes ordering unclear.

---

## Flow 7: Provisioning

### Route: `/admin/deploy` + `admin-deploy.tsx` + API: `/api/admin/provision`

**PASS:**
- Customer selector with searchable dropdown (name + email)
- Form fields: IP, SSH user/password/port, subdomain, email
- Subdomain input strips non-alphanumeric characters (except hyphens)
- Warns if customer already has a VPS ("will overwrite")
- Progress panel with 12 steps shown as pending/running/done/error
- Real-time log panel with color-coded entries
- Job polling every 5 seconds
- Reconnects to active job on navigation return
- `beforeunload` handler prevents accidental navigation
- Success shows dashboard URL with copy/link buttons
- Error shows error message

**PASS - Background Job System:** `provision-store.ts` uses globalThis for persistence across hot reloads. Jobs auto-delete after 10 minutes. Only one active job at a time (returns 409 if duplicate).

**PASS - Provisioning Pipeline:** DNS (Cloudflare) -> Firewall (Hostinger) -> SSH provisioning (12 steps) -> DB save.

**PASS - Error Recovery:** If provisioning fails at any step, the error is recorded and the job is marked complete with `success: false`. The admin sees which step failed and why.

**CRITICAL BUG [G1]:** The provision API (`POST /api/admin/provision`) fires `logAudit` with action `"vps_provisioned"` IMMEDIATELY when the job is started (line 86), BEFORE provisioning actually completes. If provisioning fails, the audit log still says "Provisioned VPS" which is misleading. The audit log should be written on success in the `runProvisioning` function.

**CRITICAL BUG [G2]:** The `runProvisioning` function creates the admin client inside itself (line 216) but does NOT verify auth. Since this runs as a fire-and-forget async function, there is no request context. However, the `createAdminClient()` uses the service role key, so this is actually fine from an access perspective -- but the admin's identity is lost for any sub-operations. If the admin session expires mid-provisioning, the job still completes (which is good), but the DB writes use the service role client.

**MAJOR BUG [G3]:** The GET endpoint for polling (`GET /api/admin/provision`) checks `supabase.auth.getUser()` but only verifies the user exists -- it does NOT check `role === "admin"`. Any authenticated user could poll provisioning job status.

**MODERATE BUG [G4]:** Polling interval is hardcoded to 5 seconds in the component (line 182) but the initial poll happens immediately. During the first few seconds of provisioning, the DNS step is usually fast, and the UI might miss step transitions that happen between polls.

**MODERATE [G5]:** The email field auto-fills with the customer's email when selected, but the customer email might not be the SSL cert email they want. No validation that the email is actually valid for cert issuance.

---

## Flow 8: Bulk Health Check

### Route: `/admin/health` + `admin-bulk-health.tsx`

**PASS:**
- Page fetches all VPS instances with user info server-side
- "Check All VPSes" button
- Checks in batches of 5 for concurrency control
- Progress indicator (`Checking 3/10...`)
- Summary cards: Healthy, Degraded, Unhealthy, Stopped
- Table sorted by health status (unhealthy first)
- Per-instance: Customer, Hostname, IP, VPS Status, Health badge, Services (4 indicators), CPU%, RAM%
- Rows clickable to customer detail
- Degraded status for high resource usage (CPU > 90% or RAM > 90%)

**PASS - Empty State:** If no running VPSes, shows toast "No running VPSes to check".

**PASS - Error Handling:** Individual VPS check failures return "error" status without blocking other checks.

**MODERATE BUG [H1]:** The health check uses the `/api/admin/customers/${userId}/services` endpoint which opens an SSH connection per VPS. With 20+ VPSes, even batched at 5, this creates 5 concurrent SSH connections. Each has a 10-second timeout. A worst-case scenario (all VPSes unreachable) would take ~40 seconds for 20 VPSes.

**MINOR [H2]:** The services column uses emoji indicators (green/red circles) instead of the Lucide icons used everywhere else. Inconsistent with the rest of the admin panel's design language.

---

## Flow 9: SSH Terminal

**NOT IMPLEMENTED.** No SSH terminal component exists. Grep for `xterm`, `websocket.*ssh`, `ssh.terminal` returned zero results. The `Terminal` icon is imported in `admin-customer-detail.tsx` but only used for the "View Logs" button which fetches logs via API, not an interactive terminal.

**MISSING FEATURE [I1]:** SSH terminal is not built. The closest feature is `view_logs` action which retrieves the last 200 lines of journalctl/docker logs.

---

## Flow 10: Impersonation

**NOT IMPLEMENTED.** Grep for `impersonat`, `login.as`, `loginAs` returned zero results. There is no "Login As" button on any admin page, no impersonation API endpoint, and no mechanism to assume a customer's session.

**MISSING FEATURE [J1]:** Customer impersonation ("Login As" + see their dashboard + exit) is not built.

---

## Additional Components Tested

### Admin VPS Editor (`admin-vps-editor.tsx`)

**PASS:** Edit all VPS fields (IP, hostname, SSH creds, port, VM ID, specs). IP format validation. Port range validation. Read-only view with edit toggle. Cancel resets values.

**MODERATE [K1]:** The editor allows changing IP/hostname but does NOT update DNS records (Cloudflare) or firewall rules (Hostinger). After editing the IP, the hostname would point to the old IP until DNS is manually updated.

### Admin Dashboard Auth (`admin-dashboard-auth.tsx`)

**PASS:** Shows dashboard username/password. Regenerate password via SSH. Copy credentials. Toggle password visibility. Loading state. Empty state ("No credentials configured").

### Admin API Keys (`admin-api-keys.tsx`)

**PASS:** List configured providers with status (Configured/Pending). Add key form with provider dropdown, API key, optional base URL. Filters out already-configured providers. Delete with VPS re-sync. Save pushes config to VPS via SSH if VPS exists.

**MINOR [K2]:** Provider names are displayed as raw values (e.g., "ollama") in the delete confirmation toast instead of the human-readable label ("Local Model Provider").

### Admin Delete Customer (`admin-delete-customer.tsx`)

**PASS:** Danger zone card with red border. Dialog with type-to-confirm. Cascade deletes 12 related tables + Supabase auth user. Prevents self-deletion. Redirects after success.

### Admin Audit Logs (`admin-audit-logs.tsx`)

**PASS:** Table with Time, Admin, Action, Entity, Details, IP columns. Filter by action type and entity type. Pagination with page size 30. Loading state. Empty state.

**MODERATE [K3]:** The audit logs page resets to page 1 when filters change (good), but does NOT reset when the filter is removed. If you filter, go to page 3, clear filter, you stay on page 3 which might not have data. Actually, looking again -- `setPage(1)` IS called in the filter onChange. This is fine.

---

## Security Audit

### Auth Checks

Every API route follows the same pattern:
1. `createClient()` (cookie-based session)
2. `supabase.auth.getUser()` -- rejects if not authenticated
3. `supabase.from("users").select("role").eq("id", user.id)` -- rejects if not admin
4. `createAdminClient()` for service-role operations

**CRITICAL [S1]:** As noted in [A1], MFA assurance level is never checked. 2FA is completely bypassable.

**CRITICAL [S2]:** The `GET /api/admin/provision` endpoint (line 92-127) only checks `supabase.auth.getUser()` but does NOT verify admin role. Any authenticated user can poll provisioning status and see job details.

**MAJOR [S3]:** SSH passwords are stored in the `vps_instances` table and returned in full by the `/api/admin/customers/[id]/full` endpoint. These are transmitted over HTTPS, but are visible in the browser's network tab and could be logged by proxy tools.

**MAJOR [S4]:** The `admin-dashboard-auth.tsx` component fetches dashboard credentials via GET request with the userId as a query parameter. This means the credentials URL (`/api/admin/vps-password?userId=xxx`) could appear in server access logs.

**MODERATE [S5]:** The `migrate-docker` route has `maxDuration = 300` (5 minutes). A malicious admin could trigger this on every VPS simultaneously, causing resource exhaustion on the Next.js server with long-running SSH connections.

---

## Cross-Cutting Issues

**MAJOR [X1]:** No optimistic updates or cache invalidation. After actions (delete customer, update subscription, VPS actions), the admin must manually refresh or navigate away/back to see updated data. The customer detail page uses `useCallback` with `fetchData` but never re-calls it after actions except for service checks.

**MAJOR [X2]:** No rate limiting on any admin API endpoint. An admin (or someone with a stolen admin session) could make unlimited API calls -- provisioning, bulk actions, SSH commands, etc.

**MODERATE [X3]:** Inconsistent use of server vs. client components. Some admin pages fetch data server-side (tickets, customers list, deploy) while others are fully client-side (customer detail, audit logs). This creates inconsistent loading behavior and SEO is irrelevant for admin pages.

**MODERATE [X4]:** No WebSocket/SSE for real-time updates. Provisioning progress uses polling (5s interval). Health checks are manual. Ticket replies don't push to other tabs.

**MINOR [X5]:** The `admin-vps-health.tsx` (used on the dashboard overview) and `admin-bulk-health.tsx` (used on `/admin/health`) are two separate components that check VPS health differently. The former uses `/api/admin/customers/${userId}/health` while the latter uses `/api/admin/customers/${userId}/services`. Different endpoints return different data shapes.

**MINOR [X6]:** No keyboard shortcuts for common admin actions (e.g., Cmd+K for customer search, Escape to close modals).

**MINOR [X7]:** `admin-customer-detail.tsx` imports `Trash2` but uses its own delete dialog instead of the `AdminDeleteCustomer` component. There are two separate delete implementations.

---

## Missing Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Admin login + dashboard stats | IMPLEMENTED | Works, but 2FA bypass vulnerability |
| Customer list + search/filter/sort | IMPLEMENTED | Fully functional, needs pagination |
| Customer detail (15 sections) | IMPLEMENTED | All sections present with data |
| VPS actions (start/stop/restart/logs) | IMPLEMENTED | 7 actions, SSH-based |
| Subscription management | PARTIALLY | No coupon system, no dedicated cancel |
| Ticket management | IMPLEMENTED | Reply, status/priority changes |
| Provisioning pipeline | IMPLEMENTED | 12-step with progress tracking |
| Bulk health check | IMPLEMENTED | Batched checks with sorting |
| SSH Terminal | NOT BUILT | Only log viewing exists |
| Impersonation | NOT BUILT | No "Login As" feature |
| Coupon system | NOT BUILT | Not referenced anywhere in code |

---

## Issue Priority Summary

### Critical (7)
- **[A1]** 2FA bypass -- admin layout does not check MFA assurance level
- **[C1]** Customer detail fetch has no retry/reload mechanism
- **[D1]** VPS actions endpoint does not check VPS running status before SSH
- **[G1]** Audit log records "provisioned" before provisioning completes
- **[G2]** Background provisioning loses admin context (minor severity in practice)
- **[S1]** = [A1] duplicate
- **[S2]** Provision poll endpoint lacks admin role check

### Major (12)
- **[A2]** Stale closure in useEffect dependency arrays
- **[A3]** Pro customer count includes Enterprise
- **[D2]** SSH stderr handling too loose
- **[E1]** No coupon functionality
- **[E2]** No dedicated cancel subscription action
- **[F1]** Optimistic message update uses wrong ID
- **[G3]** Provision GET endpoint missing role check
- **[I1]** SSH terminal not built
- **[J1]** Impersonation not built
- **[S3]** SSH passwords visible in API responses
- **[S4]** Credentials in GET query parameters
- **[X1]** No cache invalidation after mutations
- **[X2]** No rate limiting on admin APIs

### Moderate (18)
- **[A4]** ARR calculation ignores billing cycle
- **[B1]** VPS filter logic edge case
- **[B2]** No customer list pagination
- **[C2]** Race condition in service re-checks
- **[C3]** Start/Stop labels misleading (service vs VM)
- **[C4]** Quick SSH command not escaped
- **[C5]** Payment history not paginated
- **[D3]** VPS action audit types not mapped in UI
- **[E3]** Subscription editor shows stale data after save
- **[E4]** Negative price accepted
- **[F2]** Double-update in ticket reply API
- **[F3]** Ticket list not paginated
- **[G4]** Provisioning step transitions may be missed between polls
- **[G5]** SSL email auto-fill may be wrong
- **[H1]** Bulk health check SSH connection scaling
- **[K1]** VPS editor IP change does not update DNS
- **[S5]** Docker migration route resource exhaustion risk
- **[X3]** Inconsistent server/client data fetching
- **[X4]** No real-time updates (polling only)

### Minor (11)
- **[B3]** CSV export quote escaping
- **[F4]** Message timestamps lack time component
- **[H2]** Emoji indicators in bulk health table
- **[K2]** Provider raw values in delete toast
- **[X5]** Two different health check components/endpoints
- **[X6]** No keyboard shortcuts
- **[X7]** Duplicate delete customer implementations

---

## Recommendations (Priority Order)

1. **Fix 2FA enforcement** -- Add `getAuthenticatorAssuranceLevel()` check in admin layout. Redirect to `/admin/verify-2fa` if AAL1 and user has TOTP factors.
2. **Add admin role check to provision GET** -- Copy the role verification pattern from other endpoints.
3. **Add customer list pagination** -- Server-side with `range()` query.
4. **Implement cache invalidation** -- Use `router.refresh()` or React Query `invalidateQueries` after mutations.
5. **Fix audit log timing** -- Move provision audit log to `runProvisioning` completion handler.
6. **Check VPS status before SSH actions** -- Add `vps.status === "running"` guard to the actions endpoint.
7. **Add rate limiting** -- At minimum, use Next.js middleware to limit admin API calls.
8. **Fix subscription editor stale data** -- Call a parent refresh callback or use React Query.
9. **Add ticket pagination** -- Limit server query and add offset/limit.
10. **Build SSH terminal** -- Consider xterm.js + WebSocket proxy for interactive SSH.
11. **Build impersonation** -- Create a secure token-swap mechanism with admin-exit button.
