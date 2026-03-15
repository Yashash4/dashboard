# Admin Panel Operations Manager Review

**Reviewer:** ClawHQ Owner (Daily Operations Perspective)
**Date:** 2026-03-16
**Scope:** All admin pages, components, and API routes under `/admin`

---

## Morning Routine

### 1. Platform health at a glance (VPS count, issues)
**CAN DO**

The admin overview page (`/admin`) shows VPS Running X / Y total, plus an alerts banner that surfaces critical issues (stopped VPSes, open tickets). The `/admin/health` page provides a bulk health check across all VPSes with service-level status (OpenClaw, Nginx, Embeddings, Data API), CPU, RAM, and disk per instance. The `AdminBulkHealth` component checks services in batches of 5 concurrently.

### 2. New signups overnight
**PARTIALLY**

The customers page (`/admin/customers`) lists all customers sorted by `created_at` descending, so new signups appear at the top. However, there is **no dedicated "new signups" counter, no date-range filter, and no "last 24h" badge** on the overview. You can see them but you have to eyeball dates. The overview page only shows total customers, not new ones.

**Missing:** A "New today" / "New this week" metric card on the overview dashboard.

### 3. VPS went down detection
**CAN DO**

The overview page automatically flags stopped VPSes in the alerts banner with `stoppedVps.length > 0` triggering a critical-level alert. The health page lets you check all VPSes at once and shows unhealthy/degraded/error states. Each customer detail page shows VPS status and has a "Check Services" button.

**Caveat:** This is **on-demand only**. There is no background cron or polling -- you have to visit the page or manually trigger checks. See item #21.

### 4. Unresolved support tickets
**CAN DO**

The overview shows open ticket count and lists the 5 most recent tickets. The `/admin/tickets` page shows all tickets with status/priority filtering. Individual ticket pages (`/admin/tickets/[id]`) support threaded replies, status changes, and priority changes. This works well.

### 5. Revenue dashboard (MRR, ARR, growth)
**PARTIALLY**

The overview shows MRR (calculated from active subscription prices) and ARR (MRR x 12). It also breaks down MRR by plan (Starter, Pro, Ultra, Enterprise). Plan counts are shown.

**Missing:**
- No historical MRR tracking (no graphs, no month-over-month comparison)
- No growth rate calculation
- No churn rate
- No ARPU (average revenue per user)
- No revenue trend line

---

## Customer Support

### 6. Customer reports "my agent isn't responding" -- quick debug workflow
**CAN DO**

From `/admin/customers/[id]`, you can:
- See the customer's VPS status at a glance
- Click "Check Services" to SSH in and verify OpenClaw, Nginx, Embeddings, Data API status
- See CPU/RAM/disk usage to rule out resource exhaustion
- Restart individual services (OpenClaw, Nginx, Embeddings, Data API) with one click
- View the last 200 lines of logs via "View Logs"
- Copy SSH credentials to connect manually if needed
- See their deployed agents and channel status

This workflow is solid.

### 7. Customer says "my WhatsApp isn't working" -- check channel credentials
**PARTIALLY**

The customer detail page shows channels with type, status, and connection date. Channel config data is fetched from the DB.

**Missing:**
- Cannot view the actual channel credentials/tokens from the admin panel (the `config` field is fetched but not displayed in detail -- the UI just shows type and status)
- No "test connection" button for channels
- Cannot re-configure or reconnect a channel from admin

### 8. Force-switch a customer's model
**CANNOT DO**

The customer detail page shows the current model, context limit, pending change request, and changes this cycle -- but it is **read-only**. There is no UI or API route to force-change a model from the admin panel. The `/api/models/change` route exists for customers but there is no admin override.

**Missing:** An admin action to force-set `current_model` and push the config to the VPS.

### 9. Customer wants a refund -- see payment history, issue refund
**PARTIALLY**

The customer detail page shows payment history (amount, status, date, payment method) from the `payments` table.

**Missing:**
- No refund action/button
- No Stripe/payment gateway integration visible in admin
- Cannot issue a refund from the panel

### 10. Customer locked out -- reset password, check login history
**PARTIALLY**

- **Login history:** The detail page shows `last_sign_in_at` and `email_confirmed_at` from Supabase auth metadata. No full login history/IP log.
- **Password reset:** No admin-initiated password reset endpoint. The VPS dashboard password can be reset via `/api/admin/vps-password`, but the Supabase auth password (for the ClawHQ dashboard login) cannot be reset from admin.

**Missing:** Admin-triggered Supabase auth password reset, full login history with IPs.

---

## Debugging

### 11. SSH into a customer's VPS without leaving the browser
**CANNOT DO**

The admin panel shows SSH credentials (user, password, port, IP) with copy buttons and even provides a ready-to-copy `ssh user@ip -p port` command. But there is no in-browser terminal/WebSSH. You must open an external SSH client.

**Missing:** Browser-based SSH terminal (e.g., xterm.js + WebSocket proxy).

### 12. View customer's chat history to debug agent responses
**CANNOT DO**

The `full` API route does NOT fetch chat conversations or messages. The `CustomerData` type has no chat fields. The detail page has no chat section.

**Missing:** Chat conversation list and message viewer on the customer detail page. The data exists in `chat_conversations` and `chat_messages` tables (we know because the DELETE cascade handles them).

### 13. View customer's KB documents to check RAG
**CANNOT DO**

No knowledge base / document viewer in the admin panel. KB data lives on the VPS filesystem, not in Supabase. There is no API route to list or view KB files.

**Missing:** API route to SSH in and list/read KB documents from the VPS.

### 14. View webhook delivery logs to debug integrations
**CANNOT DO**

The customer detail page shows webhook configurations (URL, events, secret, enabled status) but there are **no delivery logs**. No record of what was sent, response codes, or retry status.

**Missing:** Webhook delivery log table/API, possibly stored on VPS or in a separate table.

### 15. Impersonate a customer (see what they see)
**CANNOT DO**

No impersonation feature. No "login as" button. The admin layout checks `role === "admin"` but there is no mechanism to assume a customer session.

**Missing:** Admin impersonation with audit trail.

---

## Management

### 16. Provision a new VPS end-to-end
**CAN DO**

The `/admin/deploy` page provides a full provisioning flow. The `POST /api/admin/provision` route runs a 12-step pipeline: DNS setup (Cloudflare), firewall (Hostinger), SSH provisioning (OpenClaw install, nginx config, SSL cert, gateway setup). Job progress is tracked in real-time via polling. On success, VPS details are saved to DB. This is the core product workflow and it works.

### 17. Upgrade/downgrade a customer's plan
**CAN DO**

The customer detail page includes subscription management (visible in the `AdminSubscriptionEditor` component referenced in the codebase). The `POST /api/admin/customers/[id]/subscription` route supports setting plan (starter/pro/ultra/enterprise), status, billing_cycle, and price. Upserts correctly.

### 18. See which models are most popular
**CANNOT DO**

No model analytics or aggregation. The admin can see individual customer models but there is no summary view of model distribution across the platform.

**Missing:** Model popularity dashboard (count by model name, pie chart or table).

### 19. Bulk-restart all VPSes (e.g., after an update)
**CANNOT DO**

The bulk health page (`/admin/health`) can **check** all VPSes at once, but the only bulk **action** available is suspend/activate subscriptions via `POST /api/admin/customers/bulk`. There is no bulk VPS restart or bulk service restart.

**Missing:** Bulk VPS actions (restart all, restart OpenClaw on all, update all).

### 20. Export customer data for accounting
**CAN DO**

The customers page has a CSV export button that exports Name, Email, Plan, Status, VPS Status, IP, Price, and Created date. This covers basic accounting needs.

**Missing:** More detailed export (payment history, invoice data).

---

## Missing Capabilities That Would Make Daily Life Easier

### 21. Automated alerts when things break
**CANNOT DO**

No background health monitoring. No cron job, no webhook alert, no email/Slack notification when a VPS goes down or a service crashes. The admin must manually visit the health page.

**Priority: HIGH.** This is the single biggest operational gap. A background worker that checks VPS health every 5 minutes and sends alerts would save significant time.

### 22. Dashboard for tracking customer churn
**CANNOT DO**

No churn tracking. No visualization of cancelled subscriptions over time, no churn rate calculation, no cohort analysis. Cancelled customers are visible in the customer list with status filter, but there is no trend data.

**Priority: MEDIUM.**

### 23. Revenue forecasting
**CANNOT DO**

No forecasting. MRR is current-snapshot only. No historical MRR storage, no projections, no what-if analysis.

**Priority: LOW** (nice-to-have at current scale).

### 24. Scheduled maintenance window UI
**CANNOT DO**

No maintenance scheduling. No way to set a maintenance window, notify customers in advance, or temporarily show a maintenance page. The Docker migration route exists for one-off upgrades but there is no maintenance workflow.

**Priority: MEDIUM.**

### 25. Customer communication tool (email all customers)
**CANNOT DO**

No broadcast/email system. No way to send an email to all customers, a plan segment, or an individual customer from within the admin panel.

**Priority: MEDIUM.**

---

## Summary Scorecard

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| 1 | Platform health at a glance | CAN DO | Overview + bulk health page |
| 2 | New signups overnight | PARTIALLY | Visible but no metric card |
| 3 | VPS down detection | CAN DO | On-demand only, no automation |
| 4 | Unresolved tickets | CAN DO | Full ticket system |
| 5 | Revenue dashboard | PARTIALLY | MRR/ARR shown, no history/growth |
| 6 | Debug "agent not responding" | CAN DO | Full workflow: check, restart, logs |
| 7 | Debug channel issues | PARTIALLY | Can see config but no test/reconnect |
| 8 | Force-switch model | CANNOT DO | Read-only model view |
| 9 | Issue refund | PARTIALLY | Can see payments, no refund action |
| 10 | Reset customer password | PARTIALLY | VPS password yes, auth password no |
| 11 | Browser SSH | CANNOT DO | Copy credentials only |
| 12 | View chat history | CANNOT DO | Not fetched or displayed |
| 13 | View KB documents | CANNOT DO | Data on VPS, no API |
| 14 | Webhook delivery logs | CANNOT DO | Config visible, no delivery logs |
| 15 | Customer impersonation | CANNOT DO | No feature exists |
| 16 | Provision VPS | CAN DO | Full end-to-end pipeline |
| 17 | Upgrade/downgrade plan | CAN DO | Full subscription editor |
| 18 | Model popularity stats | CANNOT DO | No aggregation |
| 19 | Bulk VPS restart | CANNOT DO | Bulk check yes, bulk restart no |
| 20 | Export for accounting | CAN DO | CSV export with key fields |
| 21 | Automated alerts | CANNOT DO | No background monitoring |
| 22 | Churn dashboard | CANNOT DO | No trend tracking |
| 23 | Revenue forecasting | CANNOT DO | Snapshot only |
| 24 | Maintenance window UI | CANNOT DO | No feature exists |
| 25 | Customer email broadcast | CANNOT DO | No feature exists |

**Totals:** 7 CAN DO | 6 PARTIALLY | 12 CANNOT DO

---

## Top Priority Gaps (Ordered by Operational Impact)

1. **Automated health monitoring + alerts** -- Without this, outages go unnoticed until a customer reports them. Background cron + Slack/email alerts.
2. **Force-switch model from admin** -- Customers ask for this and you cannot fulfill it without SSH.
3. **View customer chat history** -- Critical for debugging agent behavior complaints. Data exists, just not exposed.
4. **Bulk VPS restart** -- Essential after platform updates. Currently requires visiting each customer one at a time.
5. **New signup counter on overview** -- Quick win, important for morning routine.
6. **Browser SSH terminal** -- Would eliminate context switching to external SSH clients.
7. **Revenue history + growth metrics** -- Needed to track business trajectory.
8. **Admin password reset for customer auth** -- Supabase admin API supports this, just needs an endpoint.

---

## What Works Well

- The customer detail page is comprehensive -- VPS, subscription, agents, channels, webhooks, API keys, tickets, payments all in one view
- Service-level health checks with resource gauges (CPU/RAM/disk) are excellent
- One-click service restart (OpenClaw, Nginx, Embeddings, Data API) is very operational
- Log viewer pulls the last 200 lines without needing SSH
- Audit logging is consistent across all admin actions
- 2FA enforcement for admin access is proper security
- VPS provisioning pipeline is fully automated
- CSV export for accounting is available
- Bulk suspend/activate for subscriptions works
- Docker migration path exists as a one-click operation
