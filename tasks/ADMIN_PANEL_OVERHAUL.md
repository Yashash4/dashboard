# Admin Panel — Full Overhaul Guide

**Owner:** Admin Agent (separate from 59/129/350)
**Scope:** Internal operations tool — only admin sees this. Show EVERYTHING. No restrictions on provider names, passwords, credentials. This is for debugging and customer management.
**Last updated:** 2026-03-15

---

## CONTEXT

### Who uses the admin panel?
Only the ClawHQ admin (you). No customers ever see this. This is your internal operations dashboard to:
- Monitor all customers and their VPSes
- Debug issues by viewing customer data, credentials, configs
- Manage subscriptions, provisioning, support tickets
- See real-time platform health
- Take actions: restart VPS, reset passwords, impersonate users

### What exists now?

**Pages:**
- `/admin` — stats overview (customers, revenue, tickets, VPS health)
- `/admin/customers` — customer list
- `/admin/customers/[id]` — single customer detail
- `/admin/deploy` — deploy VPS form
- `/admin/tickets` — all tickets
- `/admin/tickets/[id]` — ticket thread (admin reply)
- `/admin/audit-logs` — audit viewer
- `/admin/security` — security settings
- `/admin/verify-2fa` — 2FA verification

**Components:**
- `admin-customers.tsx`, `admin-deploy.tsx`, `admin-vps-editor.tsx`, `admin-subscription-editor.tsx`
- `admin-delete-customer.tsx`, `admin-ticket-thread.tsx`, `admin-tickets.tsx`
- `admin-audit-logs.tsx`, `admin-vps-health.tsx`, `admin-api-keys.tsx`
- `admin-2fa-setup.tsx`, `admin-dashboard-auth.tsx`

**API routes:**
- `/api/admin/provision` — VPS provisioning (12-step pipeline)
- `/api/admin/customers/[id]` — customer CRUD
- `/api/admin/customers/[id]/vps` — VPS management
- `/api/admin/customers/[id]/subscription` — subscription management
- `/api/admin/customers/[id]/health` — VPS health check
- `/api/admin/customers/[id]/auto-restart` — auto restart config
- `/api/admin/customers/[id]/migrate-docker` — Docker migration
- `/api/admin/customers/bulk` — bulk operations
- `/api/admin/tickets/[id]` — ticket management
- `/api/admin/vps-password` — VPS password management
- `/api/admin/api-keys` — API key management
- `/api/admin/audit-logs` — audit log viewing

### What's wrong?
- **Hardcoded IPs** in deploy form placeholder (`72.61.232.87`)
- **"Hostinger VM ID"** label exposed
- **"Ollama"** in API keys dropdown
- **SSH passwords in plaintext React state** (actually correct for admin — keep this)
- **Customer detail is basic** — doesn't show full customer data
- **No SSH terminal** — have to SSH manually for debugging
- **No impersonation** — can't see what the customer sees
- **No bulk health check** — check VPS health one by one
- **No revenue analytics** — just a total number, no trends
- **No model management** — can't see/change which models users have
- **No platform-wide monitoring** — no overview of all VPSes, all agents, all channels
- **No automated alerts** — admin doesn't know when things break

---

## PART 1: ADMIN OVERVIEW (Stats Dashboard)

### What it has now
7 stat cards (customers, active subs, revenue, open tickets, VPS running/total, pro customers, starter customers) + recent tickets table + VPS health list + quick actions.

### What to add

- [ ] **1.1 Revenue Analytics**
  Not just a total — show: monthly trend chart (last 12 months), MRR breakdown by plan (Starter/Pro/Ultra/Enterprise), new vs churned this month, ARR projection. Use Recharts.

- [ ] **1.2 Customer Growth Chart**
  New signups per week/month. Line chart. Show: total customers over time, new this week, churn this week.

- [ ] **1.3 Platform Health Overview**
  All VPSes at a glance: how many running/stopped/error. CPU/RAM averages across all VPSes. Alert if any VPS is at >90% resources. "Platform Health Score" percentage.

- [ ] **1.4 Active Alerts Banner**
  Top of admin dashboard: critical issues needing attention. "3 VPSes have high CPU", "2 support tickets unresolved for 24+ hours", "1 customer's VPS is stopped". Red/yellow/green banner.

- [ ] **1.5 Quick Stats Row**
  Add: Ultra customers count, total agents deployed across all users, total channels connected, total messages today (from `analytics_daily_summary`).

- [ ] **1.6 Recent Activity Feed**
  Last 20 admin actions: "Provisioned VPS for user@email.com", "Replied to ticket #145", "Restarted VPS for user@email.com". From admin audit log.

---

## PART 2: CUSTOMER LIST

### What to improve

- [ ] **2.1 Advanced Search & Filter**
  Search by: name, email, plan, VPS status, hostname, IP address. Filter by: plan (Starter/Pro/Ultra/Enterprise), status (active/cancelled/past_due), VPS status (running/stopped/provisioning/none). Sort by: created date, plan, revenue, last active.

- [ ] **2.2 Customer Cards (Enhanced)**
  Each customer row shows: name, email, plan badge, VPS status dot, monthly revenue, last active, messages this week, open tickets count. Click → full detail page.

- [ ] **2.3 Bulk Actions**
  Select multiple customers → bulk: send email, restart all VPSes, export list as CSV.

- [ ] **2.4 Export Customer List**
  CSV/JSON export with all customer data (for accounting, analytics).

---

## PART 3: CUSTOMER DETAIL PAGE (THE BIG ONE)

This is the most important page. When you click a customer, you see EVERYTHING about them.

### 3.1 Profile & Account

- [ ] **Basic info:** Name, email, user ID, role, created date, last login (from Supabase Auth `last_sign_in_at`)
- [ ] **Account status:** Active/suspended/deleted
- [ ] **Auth details:** email verified?, password last changed, 2FA enabled?
- [ ] **Actions:** Edit name, reset password (generate new), suspend account, delete account
- [ ] **"Login As" button** — impersonate this customer (see their dashboard as they see it). Opens new tab logged in as them. Admin can debug their exact view.

### 3.2 Subscription & Billing

- [ ] **Current plan:** Starter/Pro/Ultra/Enterprise with badge
- [ ] **Billing cycle:** Monthly/annual
- [ ] **Price:** $59/$129/$350
- [ ] **Status:** Active/cancelled/past_due/expired
- [ ] **Dates:** Start date, renewal date, expiry date
- [ ] **Payment history:** All payments with dates, amounts, statuses, payment method
- [ ] **Actions:** Change plan (upgrade/downgrade), change billing cycle, apply coupon, cancel subscription, refund last payment, extend subscription
- [ ] **Revenue tracking:** Total lifetime revenue from this customer, average monthly, months active

### 3.3 VPS Details (FULL ACCESS)

- [ ] **VPS status:** Running/stopped/provisioning/error with large status badge
- [ ] **VPS specs:** CPU cores, RAM GB, storage GB, bandwidth TB
- [ ] **Network:** IP address (copyable), hostname (copyable), custom domains list
- [ ] **SSH Credentials (VISIBLE):**
  - SSH user: `root` (copyable)
  - SSH password: `actualpassword` (shown, copyable, with show/hide toggle)
  - SSH port: `22`
  - Quick copy button: `ssh root@1.2.3.4 -p 22`
- [ ] **Dashboard Credentials (VISIBLE):**
  - Dashboard URL: `https://user.clawhq.tech`
  - Username: `admin` (copyable)
  - Password: `actualpassword` (shown, copyable)
- [ ] **Data API token (VISIBLE):** The token for port 5556 (copyable)
- [ ] **Hostinger VM ID:** Show the actual VM ID (internal use only)
- [ ] **Services status:** OpenClaw (18789), Nginx (443), Embeddings (5555), Data API (5556) — green/red for each
- [ ] **Resource monitoring:** Live CPU%, RAM%, Disk%, Network usage (same gauges as user's monitoring page but always visible for admin)
- [ ] **OpenClaw version:** What version is running
- [ ] **SSL certificate:** Status, expiry date, domains covered
- [ ] **Uptime:** How long VPS has been running
- [ ] **Actions:**
  - Start / Stop / Restart VPS
  - Restart OpenClaw only
  - Restart specific service (nginx, embeddings, data API)
  - Update SSH password
  - Update dashboard password
  - Re-provision VPS (re-run all provisioning steps)
  - Resize VPS (change specs)
  - **SSH Terminal** — in-browser terminal connected to this VPS via SSH. Use `xterm.js` + WebSocket → SSH proxy. Full terminal access without leaving the browser.
  - View VPS logs (last 1000 lines)
  - Download VPS config (openclaw.json)

### 3.4 Model Configuration

- [ ] **Current model:** Name, context limit
- [ ] **Pending change:** If any (model name, effective date)
- [ ] **Changes this cycle:** X of 5 used
- [ ] **Change history:** All model switches with dates
- [ ] **Per-agent models:** If multi-model is configured, show per-agent assignments + fallbacks
- [ ] **Actions:** Force switch model (instant, bypasses limits), cancel pending change, reset change counter

### 3.5 Agents

- [ ] **Deployed agents list:** Name, category, status (healthy/error/stopped), messages handled, last active
- [ ] **Agent config viewer:** Click any agent → see SOUL.md, identity.md, TOOLS.md, config.json content (full text, not truncated)
- [ ] **Agent health:** Real health check per agent (same as user's 4.1 but admin always sees it)
- [ ] **Store agents owned:** Which store agents they've added
- [ ] **Actions:** Deploy/undeploy agent for the user, edit agent config, restart agent

### 3.6 Channels

- [ ] **Connected channels:** Type, status, connection date, last message date, message count
- [ ] **Channel credentials (VISIBLE):** Bot tokens, app IDs, passwords — all visible for debugging
- [ ] **Health status:** Real connection test per channel
- [ ] **Agent routing:** Which agent handles which channel
- [ ] **Actions:** Connect/disconnect channel for the user, test connection, view channel logs

### 3.7 Chat Activity

- [ ] **Conversation list:** Recent conversations with agent, channel, message count, timestamp
- [ ] **Read conversations:** Click any conversation → see full message history (user + agent messages)
- [ ] **Chat stats:** Total messages (today/week/month), avg response time, conversations per day
- [ ] **Note:** Chat data is on VPS — admin reads via VPS Data API or SSH

### 3.8 Knowledge Base

- [ ] **Documents list:** Name, type, size, status (indexed/pending/error), chunk count, retrieval count
- [ ] **Document content:** Click → see the actual document text
- [ ] **Chunk viewer:** See how the document was chunked (same as user's chunk viewer)
- [ ] **Embedding status:** Which docs have embeddings, which are pending
- [ ] **Storage used:** Total KB storage on VPS
- [ ] **Actions:** Delete document, re-index, force re-embed

### 3.9 Webhooks (Pro/Ultra only)

- [ ] **Webhook list:** URL, events, status (enabled/paused/disabled), success rate, last triggered
- [ ] **Webhook secrets (VISIBLE):** Full secret displayed
- [ ] **Delivery history:** Last 50 deliveries per webhook
- [ ] **Actions:** Disable webhook, delete, test, replay delivery

### 3.10 API Keys (Pro/Ultra only)

- [ ] **Key list:** Name, key hash (first 8 chars), created, last used, usage count, rate limit, status
- [ ] **Full key (VISIBLE):** Show the full API key for debugging (this is an admin override — normally the full key is only shown once on creation)
- [ ] **Actions:** Revoke key, change rate limit

### 3.11 Support Tickets

- [ ] **Ticket list:** All tickets for this customer with status, priority, category, created date
- [ ] **Click ticket → full thread** with admin reply capability
- [ ] **Satisfaction ratings:** If they rated, show the rating
- [ ] **Actions:** Reply, resolve, reopen, change priority, change category

### 3.12 Audit Trail

- [ ] **Full audit log** for this customer — every action they've taken
- [ ] **Filter by category, date range, action type**
- [ ] **Note:** Audit data may be on VPS — read via Data API

### 3.13 Usage & Analytics

- [ ] **Messages:** Today, this week, this month (from `analytics_daily_summary` or VPS)
- [ ] **Response times:** Average, min, max
- [ ] **Per-agent usage:** Which agents handle most traffic
- [ ] **Per-channel usage:** Which channels are most active
- [ ] **Peak hours:** When are they most active
- [ ] **Rate limit status:** How close are they to their limits

### 3.14 Mission Control (Ultra only)

- [ ] **Task board summary:** Total tasks, by column, overdue count
- [ ] **Agent roster summary:** Online/offline/working agents
- [ ] **Recent events:** Last 10 MC events
- [ ] **Sessions:** Active sessions, recent completed

### 3.15 Danger Zone

- [ ] **Suspend account** — blocks login, keeps data
- [ ] **Delete account** — full deletion (VPS deprovision, data deletion, Supabase cleanup). Confirmation with email typed.
- [ ] **Force logout** — invalidate all sessions
- [ ] **Reset password** — generate new password, email to user (or show to admin)

---

## PART 4: ADMIN TOOLS

### 4.1 SSH Terminal in Browser

- [ ] **What:** In-browser terminal connected to any customer's VPS via SSH
- [ ] **How:** `xterm.js` frontend + WebSocket backend → SSH proxy via `node-ssh`
- [ ] **UI:** Select customer from dropdown (or from customer detail page) → terminal opens in a tab/panel
- [ ] **Security:** Only admin can access, 2FA required, session logged to admin audit trail
- [ ] **Implementation:**

```typescript
// WebSocket endpoint: /api/admin/ssh-terminal
// Accepts WebSocket upgrade
// On connect: get customer ID from query params → fetch SSH creds from DB → connect via node-ssh
// On message from client (terminal input) → send to SSH
// On SSH output → send to client (terminal display)
// On disconnect → close SSH session

// Frontend: xterm.js terminal component
// npm install xterm @xterm/addon-fit @xterm/addon-web-links
```

### 4.2 Impersonation ("Login As Customer")

- [ ] **What:** Admin clicks "Login As" on a customer → opens new tab as that customer
- [ ] **How:**

```typescript
// POST /api/admin/impersonate
// Body: { user_id: "customer-uuid" }
// Creates a temporary auth session for the target user
// Returns: { redirect_url: "/dashboard", session_token: "..." }
// Sets a special cookie: `admin_impersonating=true` + `real_admin_id=admin-uuid`
// Frontend shows a banner: "You are viewing as user@email.com [Exit Impersonation]"
// "Exit" clears the impersonation session and returns to admin dashboard
```

- [ ] **Safety:** Log every impersonation to admin audit trail. Show yellow banner on impersonated session. Auto-expire after 30 minutes.

### 4.3 Bulk VPS Health Check

- [ ] **What:** Check health of ALL VPSes at once (or selected ones)
- [ ] **How:** SSH into each VPS in parallel (max 5 at a time), check CPU/RAM/disk/services
- [ ] **UI:** Table showing all VPSes with health indicators, sortable by health score. Red highlight on unhealthy ones.
- [ ] **Schedule:** Option to run automatically every hour via cron and show last check results

### 4.4 Platform Monitoring Dashboard

- [ ] **What:** Real-time overview of the entire platform
- [ ] **Shows:**
  - Total VPSes: running/stopped/error (pie chart)
  - Average CPU/RAM across all VPSes (gauge)
  - Total messages today across all users
  - Most active customers (top 10 by messages)
  - Most problematic customers (top 10 by errors/tickets)
  - Revenue trend (line chart, MRR over time)
  - Customer growth (line chart, signups over time)
  - Churn tracking (who cancelled, when, why if captured)

### 4.5 Provisioning Management

- [ ] **What:** Improve the deploy page
- [ ] **Current:** Form with customer email + VPS details → triggers 12-step provisioning
- [ ] **Add:**
  - Auto-detect customer from email (fill in user ID)
  - Plan selector (auto-sets VPS specs based on plan)
  - Progress tracking: real-time display of all 12 provisioning steps
  - Error recovery: if step 7 fails, option to retry from step 7 (not from scratch)
  - Provisioning history: log of all past provisions with success/failure status
  - Re-provision: re-run provisioning on an existing VPS (update/fix without destroying)
  - Batch provisioning: provision multiple customers at once

### 4.6 Model Management

- [ ] **What:** See and manage which models are available to users
- [ ] **Shows:**
  - Available models list (from `available_models` table) with descriptions, capabilities
  - Which customers are using which model
  - Model change requests queue (pending Starter changes)
  - Usage per model (which model gets the most traffic)
- [ ] **Actions:**
  - Add/edit/remove models from the available list
  - Force-switch a customer's model
  - Approve/reject pending model changes
  - Set model as default for new signups

### 4.7 Admin Notifications

- [ ] **What:** Admin gets notified when things need attention
- [ ] **Triggers:**
  - Customer VPS goes down
  - VPS resource usage > 90%
  - Support ticket unresolved for 24+ hours
  - New customer signup
  - Customer cancels subscription
  - Provisioning failure
  - SSL certificate expiring within 7 days
- [ ] **Channels:** Dashboard bell icon (same as user notifications but admin-specific), email, optional Slack webhook

### 4.8 Admin Audit Log (Enhanced)

- [ ] **What:** Log every admin action for accountability
- [ ] **Track:** Login, impersonation start/end, customer data view, VPS restart, password view, subscription change, ticket reply, provisioning trigger
- [ ] **Show:** Full audit trail with admin name, action, target customer, timestamp, IP

---

## PART 5: CLEAN UP EXISTING ISSUES

- [ ] **5.1 Remove "Hostinger VM ID" label** — rename to "VM ID" or "Instance ID" (even in admin, keep it generic for consistency)
- [ ] **5.2 Remove "Ollama" from API keys dropdown** — rename to "ClawHQ Models" or "Default Provider"
- [ ] **5.3 Replace hardcoded IP `72.61.232.87`** in deploy form placeholder — use `192.0.2.1` (RFC 5737)
- [ ] **5.4 Fix SSH password handling** — currently in plaintext React state, which is correct for admin (we WANT to see it). But add show/hide toggle and copy button. Don't change the architecture — just improve the UX.
- [ ] **5.5 Remove console.log statements** from admin API routes (already flagged in 59 audit — 6 in `provision/route.ts`)

---

## PART 6: ADMIN LAYOUT & NAVIGATION

### Current nav
Sidebar with: Overview, Customers, Deploy, Tickets, Audit Logs, Security

### New nav

```
Admin Dashboard
├── Overview (stats + alerts + recent activity)
├── Customers
│   ├── Customer List (search, filter, sort)
│   └── Customer Detail [id] (the big page from Part 3)
├── Provisioning
│   ├── Deploy New VPS
│   └── Provisioning History
├── Platform
│   ├── Monitoring Dashboard (all VPSes health)
│   ├── Model Management
│   └── Revenue Analytics
├── Support
│   ├── All Tickets
│   └── Ticket [id] (thread + reply)
├── Tools
│   ├── SSH Terminal
│   ├── Bulk Health Check
│   └── Impersonate User
├── Security
│   ├── Admin Audit Log
│   ├── 2FA Settings
│   └── Admin Activity
└── Settings
    └── Admin Notifications Config
```

---

## PART 7: DATA SOURCES

Admin reads data from BOTH Supabase AND VPS:

| Data | Read From | How |
|------|-----------|-----|
| User profiles, subscriptions, payments | Supabase (admin client, bypasses RLS) | Direct query |
| VPS details (IP, SSH creds, status) | Supabase `vps_instances` | Direct query |
| Agent ownership | Supabase `user_agents` | Direct query |
| Channel configs + credentials | Supabase `channels` + `channel_credentials` (decrypt) | Direct query |
| Webhook configs | Supabase `webhooks` | Direct query |
| API keys | Supabase `api_keys` | Direct query (admin sees full key hash) |
| Support tickets | Supabase `support_tickets` | Direct query |
| MC tasks, agent status | Supabase `mc_*` tables | Direct query |
| Chat messages | Customer's VPS via `vpsDataFetch()` or SSH | VPS port 18789 or 5556 |
| KB documents/chunks | Customer's VPS via `vpsDataFetch()` | VPS port 5556 |
| Audit logs | Customer's VPS via `vpsDataFetch()` | VPS port 5556 |
| Analytics details | Customer's VPS via `vpsDataFetch()` | VPS port 5556 |
| MC events/sessions | Customer's VPS via `vpsDataFetch()` | VPS port 5556 |
| Webhook deliveries | Customer's VPS via `vpsDataFetch()` | VPS port 5556 |
| VPS resource monitoring | SSH to customer's VPS | `getVPSStats()` from `ssh.ts` |
| Service status | SSH to customer's VPS | systemctl/docker checks |
| VPS logs | SSH to customer's VPS | docker logs / journalctl |
| SSH terminal | WebSocket → SSH proxy | node-ssh real-time |

**Admin helper function:**
```typescript
// For VPS data, admin needs to call vpsDataFetch with the CUSTOMER's user ID, not admin's:
const data = await vpsDataFetch(customerId, "/api/events?limit=50");
```

---

## PART 8: SECURITY

Even though this is admin-only, still secure it:

- [ ] **8.1 2FA required** for admin login (already exists — verify it works)
- [ ] **8.2 Admin role check** on ALL admin API routes (already exists in middleware)
- [ ] **8.3 Impersonation logging** — every impersonation logged with start/end times
- [ ] **8.4 Password viewing logged** — when admin views a customer's SSH/dashboard password, log it to admin audit
- [ ] **8.5 SSH terminal sessions logged** — every SSH command logged to admin audit
- [ ] **8.6 Auto-logout** — admin session expires after 4 hours of inactivity
- [ ] **8.7 IP allowlist** (optional) — restrict admin access to specific IPs

---

## BUILD ORDER

```
PHASE 1 — Clean up + fix existing issues (Part 5):
  5.1-5.5 (remove exposed names, fix placeholders, clean console.logs)

PHASE 2 — Customer Detail Page (Part 3 — the core):
  3.1 Profile (with impersonation button)
  3.2 Subscription
  3.3 VPS Details (full SSH/dashboard creds visible, services, monitoring)
  3.4 Model config
  3.5 Agents (configs visible)
  3.6 Channels (credentials visible)
  3.7 Chat activity (from VPS)
  3.8 KB (from VPS)
  3.9-3.10 Webhooks + API keys
  3.11 Support tickets
  3.12 Audit trail (from VPS)
  3.13 Usage analytics
  3.14 MC summary (Ultra only)
  3.15 Danger zone

PHASE 3 — Admin Tools (Part 4):
  4.1 SSH Terminal (xterm.js)
  4.2 Impersonation
  4.3 Bulk health check
  4.5 Provisioning improvements

PHASE 4 — Overview + Monitoring (Parts 1, 4.4):
  1.1-1.6 Overview enhancements
  4.4 Platform monitoring dashboard
  4.6 Model management
  4.7 Admin notifications
  4.8 Enhanced audit log

PHASE 5 — Customer List + Navigation (Parts 2, 6):
  2.1-2.4 Advanced search, filters, bulk actions
  Updated sidebar navigation

PHASE 6 — Security (Part 8):
  8.1-8.7 Security hardening
```

---

## RULES FOR ADMIN AGENT

1. **Show EVERYTHING** — passwords, tokens, SSH creds, VPS IPs, provider names. This is admin-only.
2. **Log EVERYTHING** — every admin action goes to admin audit trail
3. **2FA required** — don't bypass security for convenience
4. **Same design system** — dark theme, Geist Mono, same colors as rest of ClawHQ
5. **Performance** — admin may view dozens of customers. Paginate lists. Don't fetch all VPS stats on page load.
6. **VPS data** — use `vpsDataFetch(customerId, path)` to read from customer's VPS. Use SSH for real-time commands.
7. **Don't modify user-facing pages** — admin panel is `/admin/*` only. Don't change dashboard pages.
8. **Impersonation is sensitive** — log everything, auto-expire sessions, show banner
