# TODO: Starter $59 — Full Enhancement Guide

**Owner:** Plan 59 Agent
**Previous work:** 41/46 bug fixes completed. See `COMPLETED_59_STARTER.md`.
**Remaining from previous:** 1 item (monitoring dashboard — building basic version)
**Last updated:** 2026-03-15

---

## PART A: CONTEXT — READ THIS FIRST

### A1. What is ClawHQ?

ClawHQ is a managed OpenClaw hosting SaaS. Users sign up, pick a plan, and ClawHQ provisions a dedicated VPS with OpenClaw (an AI agent framework) installed, configured, and ready to use. Users get a dashboard to manage everything.

**Pricing tiers:**
- **Starter $59/mo** — THIS IS YOUR SCOPE. Dedicated VPS, bundled AI models (no API keys needed), 7 messaging channels, agent store, managed infrastructure. The "it just works" tier.
- **Pro $129/mo** — Everything in Starter + Pro Tools (Logs, Analytics, KB, Webhooks, API Access, Audit Log, Agent Builder, Model Playground). Plan 129 agent owns these.
- **Ultra $350/mo** — Everything in Pro + Mission Control. Plan 350 agent owns this.
- **Enterprise $999+/mo** — Custom.

**Your role:** You own the BASE DASHBOARD — every page that ALL users see regardless of tier. You are the foundation. Pro and Ultra features are layered ON TOP of your pages. Your pages must be polished, reliable, and user-friendly because they're the first thing every customer experiences.

**How AI models work:**
- ClawHQ uses an external cloud AI API (internally "clawhq-models") — users do NOT pay per token
- Flat-rate, unlimited-feel. Rate limiting happens silently in the backend
- **NEVER show cost, tokens, usage percentages, or budget data to users**

**What runs on each user's VPS:**
- OpenClaw framework + gateway (port 18789)
- ClawHQ Embeddings service (port 5555)
- ClawHQ Data API (port 5556) — being built by 350 agent
- Nginx reverse proxy + SSL
- AI models are NOT on the VPS — accessed via external API
- VPS runs 24/7 — guaranteed uptime

### A2. What You Already Built (41/46 bug fixes)

Full record in `COMPLETED_59_STARTER.md`. Summary of fixes:
- Removed 26 console.log/error/warn across 14 files
- Auth flows verified clean (login, register, forgot-password, middleware)
- Overview page verified clean (all 3 states)
- VPS page: fixed start status ("starting" not "running"), stop error fallback, Hostinger API error logging
- Models page: SSH failure warning, scheduled change cron, rate limiting on DELETE
- Agents page: fixed undeploy webhook event name, deploy limit enforcement, Supabase error handling, SSH error logging
- Store page: added error handling, replaced window.location.reload, fixed optimistic purchase
- Chat page: wrapped request.json in try/catch, history load error handling, removed fake status dot, fixed /compact race condition
- Channels page: fixed channelId undefined, Supabase error handling, connectedTypes filter, WhatsApp/Signal error message
- Support page: wrapped reply request.json, ticket message insert check, error state
- Billing page: fixed unknown status fallback, price parsing
- Account page: fixed password verification, metadata error check, name length validation
- Monitoring page: added try/catch, IP null check
- OpenClaw page: fixed subscription query failure, empty embedKey
- Sidebar: renamed duplicate "Mission Control" to "Advanced VPS Controls"
- Landing page: Terms/Privacy placeholder pages, removed dead nav links, fixed hardcoded gradient color
- Cross-cutting: auth failure redirect (not blank null), Supabase error handling pattern, loading.tsx
- Secrets: renamed "Hostinger VM ID" → "VM ID", "Ollama" → "Local Model Provider", replaced real IP with RFC 5737 example
- Form validations: added Zod to ticket creation, account settings, channel connect, dashboard password

### A3. Remaining Items (decided)

| Item | Decision |
|------|----------|
| Cancel subscription button | **SKIP** — contact support |
| Annual billing toggle | **SKIP** — on landing page, not dashboard |
| Downgrade path | **SKIP** — contact support |
| Email change | **SKIP** — not needed |
| monitoring-dashboard.tsx | **BUILD** — basic gauges for Starter, Pro features show upgrade prompt |

### A4. Design System — LOCKED

| Token | Value |
|-------|-------|
| **Body font** | Geist Mono (monospace everywhere) |
| **Code font** | JetBrains Mono |
| **Page background** | `#111111` |
| **Card background** | `#191919` |
| **Muted background** | `#222222` |
| **Hover background** | `#2a2a2a` |
| **Border** | `#201e18` |
| **Primary (sage green)** | `oklch(0.6762 0.0567 132.4479)` |
| **Accent (warm cream)** | `#ffe0c2` |
| **Tier: Starter** | Green |
| **Tier: Pro** | Cream |
| **Tier: Ultra** | Amber |
| **Border radius** | `0.625rem` |
| **Vibe** | "Terminal-luxury SaaS" |

Dark theme only. No light mode. No theme toggle. Use CSS variables. Use shadcn/ui.

### A5. Naming Rules — CRITICAL

| Real (internal) | Use this instead |
|---|---|
| Ollama | `clawhq-models` or `ClawHQ AI` |
| Hostinger | `clawhq-vps` or "your VPS" |
| Blackbox | Never mention |
| Supabase | Never in UI |
| Vercel | Never mention |
| Cloudflare | Never mention |
| Model providers | Just model names ("Kimi K2.5") |

Only visible to users: "ClawHQ", "OpenClaw", model names.

### A6. Tech Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS 3.4 + tailwindcss-animate
- Framer Motion 12
- shadcn/ui (51 components)
- Lucide React (icons)
- Recharts (charts — for monitoring gauges)
- React Query / TanStack Query
- Supabase (auth + database)
- SSH via node-ssh (VPS management)
- Can install ANY npm package needed

### A7. What You Own (and DON'T touch)

**YOUR pages (all users see these):**
- `/dashboard` — Overview (home)
- `/dashboard/vps` — VPS management
- `/dashboard/models` — AI model configuration
- `/dashboard/agents` — Agent management
- `/dashboard/store` — Agent marketplace
- `/dashboard/chat` — Chat with agents
- `/dashboard/channels` — Channel integrations
- `/dashboard/support` — Support tickets (+ `/new`, `/[id]`)
- `/dashboard/billing` — Billing & subscription
- `/dashboard/account` — Account settings
- `/dashboard/monitoring` — VPS monitoring
- `/dashboard/openclaw` — OpenClaw dashboard embed (Pro-gated)
- `/login`, `/register`, `/forgot-password`, `/reset-password` — Auth pages
- `/` — Landing page + `src/components/landing/*`
- Layout: `src/app/dashboard/layout.tsx`, `src/app/layout.tsx`, `src/app/providers.tsx`
- Sidebar: `src/components/dashboard/app-sidebar.tsx`
- Middleware: `src/middleware.ts`

**YOUR API routes:**
- `/api/vps/*` (status, start, stop, restart, monitoring, logs, uptime, gateway-health, password, ssl-check, reboot)
- `/api/models/change`
- `/api/agents/*` (deploy, undeploy, config, purchase, analytics)
- `/api/channels/*` (connect, disconnect, health)
- `/api/tickets/*` (create, [id]/reply, [id]/resolve)
- `/api/chat/*` (send, messages)
- `/api/account/*` (update, password)
- `/api/payments/*` (create-order, verify)
- `/api/cron/*`

**YOUR components:**
- `src/components/dashboard/vps-controls.tsx`
- `src/components/dashboard/model-config.tsx`
- `src/components/dashboard/agent-manager.tsx`
- `src/components/dashboard/agent-store.tsx`
- `src/components/dashboard/agent-chat.tsx`
- `src/components/dashboard/channel-manager.tsx`
- `src/components/dashboard/channel-setup-wizard.tsx`
- `src/components/dashboard/billing-overview.tsx`
- `src/components/dashboard/account-settings.tsx`
- `src/components/dashboard/monitoring-dashboard.tsx` — **BUILD THIS**
- `src/components/dashboard/ticket-list.tsx`
- `src/components/dashboard/ticket-thread.tsx`
- `src/components/dashboard/uptime-display.tsx`
- `src/components/dashboard/dashboard-password.tsx`
- `src/components/dashboard/ssl-checker.tsx`
- `src/components/dashboard/upgrade-prompt.tsx`
- All landing page components in `src/components/landing/*`

**YOUR lib files:**
- `src/lib/supabase.ts`, `supabase-server.ts`, `supabase-admin.ts`
- `src/lib/ssh.ts`, `hostinger.ts`, `cloudflare.ts`
- `src/lib/utils.ts`, `tier.ts`, `rate-limit.ts`, `user-context.tsx`
- `src/lib/provision.ts`, `provision-v3.ts`, `provision-store.ts`
- `src/lib/crypto.ts`, `vps-status.ts`

**DO NOT TOUCH:**
- ALL Pro pages (logs, analytics, knowledge-base, webhooks, api-access, audit-log, model-playground, agent-builder) — Plan 129 agent
- ALL Ultra/Mission Control pages — Plan 350 agent
- `src/lib/knowledge-base.ts` — Plan 129 agent
- `src/lib/webhook-dispatch.ts` — Plan 129 agent
- `src/lib/audit-log.ts` — Plan 129 agent (but you CAN call `logAudit()` from your routes)

### A8. Data Storage Map

**CRITICAL RULE:** User content lives on THEIR VPS, not in our Supabase. Supabase is for small platform configs and business data only. Follow this map exactly.

#### Supabase (small configs + platform data)

| Data | Table | Feature |
|------|-------|---------|
| Auth / users / subscriptions / payments | existing tables | Core |
| VPS instance details (IP, SSH, hostname, status) | `vps_instances` | VPS page |
| Model config (current, pending, change history) | `models` + `model_change_history` (NEW) | Models page |
| Agent catalog (store) | `agents` (+ `avg_rating`, `review_count`, `install_count`, `sample_conversation`, `is_featured` — NEW cols) | Store page |
| Agent ownership + model override | `user_agents` (+ `primary_model`, `fallback_model`) | Agents page |
| Agent reviews | `agent_reviews` (NEW) | Store page |
| Channel connections + credentials | `channels` + `channel_credentials` (encrypted) | Channels page |
| Channel agent routing | `channel_agent_routing` (NEW) | Channels page |
| Channel status history | `channel_status_history` (NEW) | Channels page |
| Custom domains | `custom_domains` (NEW) | VPS page |
| Scheduled restarts | `scheduled_restarts` (NEW) | VPS page |
| Support tickets + messages + attachments | `support_tickets` + `ticket_messages` + `ticket_attachments` (NEW) — auto-delete 48hrs after resolved | Support page |
| Ticket status history | `ticket_status_history` (NEW) | Support page |
| Ticket file attachments | **Supabase Storage** bucket `ticket-attachments` | Support page |
| User avatars | **Supabase Storage** bucket `avatars` | Account page |
| User onboarding progress | `user_onboarding` (NEW) | Overview page |
| User notifications | `user_notifications` (NEW) | Overview page |
| Conversation ratings (CSAT) | `conversation_ratings` (NEW — if in Supabase) | Chat page |
| Chat conversations metadata | `chat_conversations` (+ `pinned`, `starred`, `title`, `last_message_preview` — NEW cols) | Chat page |
| Coupons | `coupons` + `applied_coupons` (NEW) | Billing page |
| Daily analytics summary | `analytics_daily_summary` (1 row/user/day) | Business metrics |
| Available models metadata | `available_models` (+ `description`, `capabilities`, `strengths`, `context_window`, `speed_rating`, `best_for` — NEW cols) | Models page |
| Notification preferences | `users.notification_preferences` (NEW JSONB col) | Account page |
| Timezone | `users.timezone` (NEW col) | Account page |
| Avatar | `users.avatar_url` + `users.avatar_emoji` (NEW cols) | Account page |
| Password changed timestamp | `users.password_changed_at` (NEW col) | Account page |
| Locale | `users.locale` (NEW col) | Account page |
| Satisfaction rating on tickets | `support_tickets.satisfaction_rating` + `satisfaction_comment` + `rated_at` (NEW cols) | Support page |
| Ticket category | `support_tickets.category` (NEW col) | Support page |
| Ticket read tracking | `support_tickets.last_read_at` (NEW col) | Support page |
| Ticket resolved timestamp | `support_tickets.resolved_at` (NEW col) | Support page |
| Ticket reference number | `support_tickets.ticket_number` (NEW SERIAL col) | Support page |

#### VPS Only (user content — on user's VPS)

| Data | Where on VPS | Feature |
|------|-------------|---------|
| Agent config files (SOUL.md, identity.md, TOOLS.md, config.json, USER.md) | Filesystem `/data/agents/{name}/` via SSH `deployAgent()` | Agents page |
| Chat messages / conversation history | OpenClaw on port 18789 (stores internally) | Chat page |
| Monitoring data (CPU, RAM, disk, network) | Fetched live via SSH `getVPSStats()` — not stored | VPS/Monitoring page |
| VPS logs | Fetched live via SSH `docker logs` / `journalctl` — not stored | VPS page |

#### VPS Services

| Port | Service | What |
|------|---------|------|
| 18789 | OpenClaw Gateway | Chat, agents, conversations |
| 5555 | ClawHQ Embeddings | KB vector embeddings |
| 5556 | ClawHQ Data API | Analytics, audit, KB, events, sessions, deliveries (built by 350 agent) |

#### localStorage (UI preferences — no DB)

| Data | Feature |
|------|---------|
| Quick actions order | Overview page |
| Channel ordering | Channels page |
| Chat sound enabled | Chat page |
| View preferences | Various |

#### Migration Note

The VPS Data API (port 5556) is built by the 350 agent. For Starter features, most data is in Supabase or fetched live via SSH. The Data API is mainly used by Pro (KB, analytics, audit) and Ultra (MC events, sessions). Starter features generally don't need it — except for chat history (which reads from OpenClaw on 18789).

### A9. What NOT to Show Users — EVER

- No cost ($), token counts, usage percentages, budget data, or quota bars
- No provider names (Ollama, Hostinger, Blackbox, Supabase, Vercel, Cloudflare)
- No mock/fake data presented as real
- No "Coming Soon" — everything is live
- No light mode or theme toggle
- No reference repo names in code comments

---

## PART B: PAGE-BY-PAGE ENHANCEMENTS

Each page gets its own section. For pages with many features, a separate detailed file is referenced.

---

### 1. OVERVIEW PAGE ENHANCEMENT (9 features)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/OVERVIEW_ENHANCEMENT_59.md` for complete code, schemas, UI specs, and testing steps.

**What we already have:** 7 stat cards (VPS status, plan, model, context, channels, agents, tickets), 3 quick actions (Open OpenClaw, Manage VPS, Raise Ticket), 3 states (no subscription, provisioning, active).

**What best SaaS dashboards have that we don't — adding all 9:**

- [ ] **1.1 Onboarding Checklist** — for new users: "Connect your first channel ☐, Deploy your first agent ☐, Send your first message ☐, Explore the Agent Store ☐." Tracks progress in `user_onboarding` table. Dismissable after completion. Shows progress bar. Disappears after all items checked or manually dismissed. Reference: Notion's setup checklist (60% completion rate, 40% retention bump).

- [ ] **1.2 Health Status Indicator** — replace simple "Running" badge with a health assessment. Green "Healthy" / Yellow "Warning: High CPU (85%)" / Red "Critical: RAM at 95%". Computed from VPS monitoring data (CPU, RAM, disk). Shows on the VPS Status card. One-time fetch on page load (not polling — Starter doesn't need real-time).

- [ ] **1.3 Recent Activity Feed** — last 10 actions: "Agent 'Support Bot' deployed 2h ago", "Telegram channel connected yesterday", "Support ticket #12 resolved". Aggregated from existing tables (user_agents, channels, support_tickets). Chronological list with relative timestamps and action icons. Shows the dashboard is alive, not static.

- [ ] **1.4 Quick Stats Sparklines** — tiny 7-day trend lines on stat cards. Messages card: mini area chart showing daily message count. Agents card: line showing deploys over time. Channels card: step chart showing connections. Uses Recharts `<Sparklines>` or simple SVG paths. Data from VPS (message counts) or Supabase (agent/channel counts by date).

- [ ] **1.5 Getting Started Guide** — first-time-only banner or modal for brand new users. "Welcome to ClawHQ! Here's how to get started:" Step 1: Your VPS is being set up. Step 2: Connect a messaging channel. Step 3: Deploy an AI agent. Step 4: Start chatting! Dismissable. Shows only when `user_onboarding.guide_dismissed = false`.

- [ ] **1.6 Notification Center** — bell icon in sidebar header with unread count badge. Items: support ticket replies from admin, agent deploy failures, VPS status changes, channel disconnections. Click opens dropdown with notification list. Click notification → navigates to relevant page. Mark as read on click. `user_notifications` table stores notifications.

- [ ] **1.7 System Alerts Banner** — persistent top banner for critical issues. "Your VPS is at 92% RAM — consider upgrading" (yellow warning). "Your VPS is stopped — click to start" (red alert). "You have no channels connected — connect one to start receiving messages" (blue info). Auto-detects from VPS status + monitoring data + channel count.

- [ ] **1.8 Customizable Quick Actions** — let users pin/unpin quick action buttons. Default: Open OpenClaw, Manage VPS, Raise Ticket. User can add: Deploy Agent, Connect Channel, Open Chat, View Billing. Stored in localStorage (no DB needed). "Edit Quick Actions" button toggles edit mode with checkboxes.

- [ ] **1.9 Usage Summary** — basic message stats for Starter users (not the full Pro analytics). "Messages this week: 245" with a simple bar chart showing daily counts. "Most active agent: Support Bot (89 messages)". "Most active channel: WhatsApp (156 messages)". Data from VPS (or Supabase analytics if available). Shows value without giving away the full Pro analytics.

---

### 2. VPS PAGE ENHANCEMENT (5 features + 1 build)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/VPS_ENHANCEMENT_59.md` for complete code, schemas, SSH commands, and testing steps.

**What we already have:** Status badge, Start/Stop/Restart buttons, hostname/IP, monitoring charts (Pro-gated), logs viewer, SSL checker, uptime display, dashboard password, Open OpenClaw link.

**Decisions made:**
- Backup: SKIP (handled behind the scenes by provisioning cron, not user-facing)
- Firewall: SKIP (managed by ClawHQ, not user-facing)
- Quick diagnostics: SKIP (too technical for Starter users)
- Cron job manager: SKIP (managed behind the scenes)
- VPS resource history: Pro-only (existing monitoring charts)
- Server notifications: Already covered by Notification Center (1.6)
- Server activity log: Already covered by Audit Log (Pro) and Activity Feed (1.3)

**Build order:** 2.6 → 2.3 → 2.2 → 2.5 → 2.1 → 2.4

- [ ] **2.1 Custom Domain Management** — self-service domain setup: user enters domain → we show DNS instructions → they verify DNS → we provision SSL via certbot. `custom_domains` table. Max 3 domains. DNS verification via `dns.resolve4()`. Nginx config + SSL via SSH. Reference: Cloudways domain management.

- [ ] **2.2 SSL Certificate Enhancement** — enhance existing checker: show expiry date + days remaining + issuer + covered domains + auto-renew status. Color coding (green >30d, yellow 7-30d, red <7d). "Renew Now" button via SSH certbot. Reference: RunCloud SSL management.

- [ ] **2.3 Service Status Panel** — show which services are running on VPS: OpenClaw Gateway (18789), Web Server/Nginx (443), ClawHQ Embeddings (5555), ClawHQ Data API (5556). Green/red dots with uptime. "Restart Service" button for stopped services. Check via SSH `systemctl is-active` or `docker inspect`. Reference: RunCloud service management.

- [ ] **2.4 Scheduled Restart** — auto-restart OpenClaw or full VPS on a weekly schedule. `scheduled_restarts` table. User picks: restart type (OpenClaw/VPS), day of week, time (UTC). Cron endpoint checks every 15 min. Creates notification after restart. Reference: Cloudways scheduled actions.

- [ ] **2.5 Resource Upgrade Button** — display current VPS specs (CPU, RAM, Storage, Bandwidth) with "Need more? View Upgrade Options →" link to billing. No new API — data already in `vps_instances`. Starter users see upgrade CTA.

- [ ] **2.6 Monitoring Dashboard (BUILD FROM SCRATCH)** — `monitoring-dashboard.tsx` component. Starter: 4 gauge cards (CPU%, RAM%, Disk%, Network) with progress bars + health coloring. One-time snapshot, manual refresh. Pro: shows UpgradePrompt for real-time charts, process list, historical data. Full component code in enhancement file.

---

### 3. MODELS PAGE ENHANCEMENT (7 features + 1 config change)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/MODELS_ENHANCEMENT_59.md` for complete code, schemas, and testing steps.

**What we already have:** Current model display, available models list from DB, Starter: request change (queued, 1/month), Pro: instant switch, cancel pending, no provider names shown.

**Config change:** Starter model changes increased from 1 to **5 per billing cycle**.

**Build order:** 3.0 → 3.1+3.2+3.6+3.7 → 3.5 → 3.4 → 3.3

- [ ] **3.0 Change max switches from 1 to 5** — update `maxChanges` in `model-config.tsx:66` and `models/change/route.ts:108`. Update UI: "2 of 5 changes used this cycle". Update landing page if it mentions limit.

- [ ] **3.1 Model Comparison Cards** — rich model cards with: description, capabilities badges, speed rating, best-for tags, context window. DB: add `description`, `capabilities`, `strengths`, `context_window`, `speed_rating`, `best_for` columns to `available_models`. Comparison dialog before switch: "You'll gain X, you'll lose Y" with `generateComparison()` function. Reference: OpenRouter model selector.

- [ ] **3.2 Capabilities Badges** — visual badges per model: Chat, Analysis, Code, Vision, Creative, Fast. Icon + label chips. Part of 3.1 build.

- [ ] **3.3 Model Recommendation** — analyze user's deployed agents, suggest best model. `recommendModel()` function matches agent categories with model best_for. Recommendation banner: "Based on your agents, we suggest X for Y." Dismissable. Reference: OpenRouter model picker product-model fit.

- [ ] **3.4 Model Change History** — track all model switches. `model_change_history` table: from, to, type (instant/scheduled), status (pending/completed/cancelled), dates. History section in UI showing chronological changes. API: `GET /api/models/history`.

- [ ] **3.5 Current Model Performance** — show how the model is performing for this user: avg response time, success rate, message count, fastest/slowest. RPC `get_model_performance()` aggregates from analytics. Performance card below current model info.

- [ ] **3.6 Model Description/Details** — "Learn more" on each model card → dialog with full description, strengths, specs, best-for use cases. Data from enhanced `available_models` columns (part of 3.1).

- [ ] **3.7 Quick Switch Confirmation** — before switching, comparison dialog shows gains/losses (capabilities, speed, context window). Part of 3.1 build.

---

### 4. AGENTS PAGE ENHANCEMENT (8 features)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/AGENTS_ENHANCEMENT_59.md` for complete code, schemas, and testing steps.

**What we already have:** Agent cards with name/category/description/status, deploy/undeploy with SSH, VPS warning, empty state with store link, basic per-agent analytics.

**Build order:** 4.4 → 4.1 → 4.2 → 4.3 → 4.7 → 4.8 → 4.5 → 4.6

- [ ] **4.1 Agent Health Status** — not just "deployed" but "healthy/degraded/error." SSH health check: verify agent directory exists, OpenClaw gateway responds, agent handles requests. Health badges (green/yellow/red) on cards. `checkAgentHealth()` function. API: `GET /api/agents/[id]/health`. Reference: Microsoft Agent 365 monitoring.

- [ ] **4.2 Quick Test / Preview** — "Test" button on deployed agent cards. Opens inline chat dialog (max 5 messages). Uses existing `/api/chat/send` with temporary session. Test without navigating to Chat page. Reference: Botpress test/preview.

- [ ] **4.3 Agent Configuration View** — "View Config" button → dialog showing SOUL.md, identity.md, TOOLS.md, config.json as read-only tabs. Uses `GET /api/agents/[id]/config`. Starter: read-only + "Upgrade to Pro for Agent Builder" CTA. Pro: "Edit in Agent Builder" button.

- [ ] **4.4 Per-Agent Stats** — messages handled, avg response time, last active (7 days). RPC `get_per_agent_stats()` aggregating from analytics. Stats line on each card: "245 messages · 1.8s avg · 2h ago." Reference: AgentRails dashboard.

- [ ] **4.5 Agent Logs (Last 10 Messages)** — "View Logs" menu item → dialog showing last 10 conversations this agent handled. User message + agent response + channel + timestamp. API: `GET /api/agents/[id]/recent-messages`. Link to full Chat page.

- [ ] **4.6 Bulk Actions** — "Deploy All" / "Undeploy All" / "Restart All" dropdown. Sequential processing with progress indicator. Confirmation dialog. Useful for 5+ agents.

- [ ] **4.7 Agent Sorting/Filtering** — filter bar: Status (all/deployed/not deployed), Category dropdown, Sort by (name/recent/messages). Result count: "Showing 3 of 5 agents."

- [ ] **4.8 Agent Grouping by Category** — when showing all categories, group cards under section headers: "Support (2 agents)", "Research (1 agent)". "Group by category" toggle. Default on.

---

### 5. STORE PAGE ENHANCEMENT

**CRITICAL: The store is currently EMPTY.** No agents exist to buy/deploy. Before enhancing the store UI, we need agents IN the store.

**PRE-REQUISITE: Seed 7 Pre-Built Agents**

**The agent configs are created by the PLANNER (not the 59 agent).** Full SOUL.md, identity.md, TOOLS.md, and config.json for all 7 agents are provided in `tasks/STORE_AGENTS_SEED.md`. The 59 agent's job is only to: run the seed SQL, add the "Free — Limited Time" badge logic to the store UI, and verify deployment works.

All FREE for now ("Free — Limited Time" badge). Later they become premium.

| Agent | Category | SOUL Summary | Tools |
|-------|----------|-------------|-------|
| **Support Agent** | Support | Friendly, patient, handles refunds/FAQs/orders | read, web, memory_search |
| **Research Agent** | Research | Thorough, analytical, cites sources | browser, web, read, write, memory_search |
| **Writer Agent** | Content | Creative, brand-aware, adaptable tone | write, edit, read |
| **Data Agent** | Data | Precise, methodical, detail-oriented | read, exec, write, memory_search |
| **Sales Agent** | Sales | Persuasive, warm, goal-oriented | write, browser, memory_search |
| **Reviewer Agent** | Review | Critical, constructive, thorough | read, memory_search, memory_get |
| **Manager Agent** | Management | Strategic, organized, delegation-focused | subagents, agents_list, sessions_list, write |

Each agent gets full OpenClaw config files stored in `agents.config_files` JSONB:

```json
{
  "SOUL.md": "# Support Agent\n\nYou are a friendly customer support agent...(full personality, instructions, boundaries, tone, escalation rules)",
  "identity.md": "# Support Agent\ntheme: helpful customer support specialist\nemoji: 🤝",
  "TOOLS.md": "- read\n- web\n- memory_search",
  "config.json": "{\"model\":{\"primary\":\"clawhq/default\"},\"sandbox\":{\"mode\":\"all\",\"workspaceAccess\":\"rw\",\"scope\":\"agent\"},\"tools\":{\"allow\":[\"read\",\"web\",\"memory_search\"],\"deny\":[\"exec\",\"clawhub\"]}}"
}
```

When user deploys, `deployAgent()` writes these files to their VPS.

**Tasks:**
- [ ] **5.0a Run the seed SQL from `tasks/STORE_AGENTS_SEED.md`** — the planner has written all 7 agent configs with full SOUL.md, identity.md, TOOLS.md, config.json. Create a Supabase migration file from the provided INSERT statements. Run it.

- [ ] **5.0b Add "Free — Limited Time" badge logic** — in the store UI (`agent-store.tsx`), show a badge on agents where `price = 0 AND is_premium = false`: "Free — Limited Time" (green badge). When we later set `is_premium = true` and `price > 0`, the badge disappears and users see the price instead.

- [ ] **5.0c Verify agents appear in store and can be deployed** — after seeding, verify: agents show in store UI → user can "Add" → agent appears in My Agents → deploy works → agent responds in chat.

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/STORE_ENHANCEMENT_59.md` for complete code, schemas, and testing steps.

**What we already have:** Grid of agent cards, category filter, "Owned" badge, free/premium add flow, empty/loading states.

**What's WRONG:** Store is EMPTY, no search, 2-line descriptions only, no detail page, no ratings, no featured section, no sorting, no preview.

**Build order:** 5.0 → 5.1 → 5.2 → 5.3 → 5.4 → 5.8 → 5.7 → 5.6 → 5.5 → 5.9 → 5.10

- [ ] **5.1 Agent Detail Page** — `/dashboard/store/[id]` with: full SOUL.md rendered, capabilities + tools list, identity info, install button, tabs (Overview, Capabilities, Reviews, Setup Guide). Make existing cards clickable → links to detail page. Reference: app store detail pages.

- [ ] **5.2 Search** — search bar above categories. Client-side filter by name + description + category. "Showing X of Y agents" count.

- [ ] **5.3 Featured Hero Section** — spotlight top agents. `is_featured` + `featured_description` columns on agents. Large hero card with full description + rating + install count + CTA. Initially feature Support Agent.

- [ ] **5.4 Filter Tabs** — quick filters: All / Free / Premium / Popular / New. Button group above category filter. Popular sorts by install_count, New by created_at. `install_count` column on agents (increment on add).

- [ ] **5.5 Agent Preview / Demo** — sample conversation demonstrating the agent. `sample_conversation` JSONB column on agents. "Preview" tab in detail page showing scripted user↔agent exchange. Planner provides sample conversations in seed data. Reference: app store screenshots.

- [ ] **5.6 Ratings & Reviews** — 1-5 star ratings + text reviews. `agent_reviews` table (one per user per agent). Must own agent to review. Avg rating + review count denormalized on agents table. Reviews tab in detail page. Star rating on store cards. Reference: app store ratings.

- [ ] **5.7 Install Count** — "Used by 150 users" on each card. Computed from `user_agents` count or denormalized `install_count` column. Increment on add. Social proof / trust signal.

- [ ] **5.8 Sorting** — sort dropdown: Popular, Top Rated, Newest, A-Z. Client-side sort on filtered list.

- [ ] **5.9 Agent Comparison** — compare 2 agents side-by-side. Checkboxes on cards → floating "Compare" bar → comparison dialog showing category, rating, users, tools diff, best-for diff.

- [ ] **5.10 Related Agents** — "Users who deployed this also deployed..." on detail page. Query co-ownership from `user_agents`. Rank by frequency. Show top 3 related agents.

---

### 6. CHAT PAGE ENHANCEMENT (15 features — FULL REBUILD)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/CHAT_ENHANCEMENT_59.md` for complete code, streaming architecture, components, and testing steps.

**What we already have:** Basic agent list, click-to-chat, message send via OpenClaw proxy, markdown rendering, slash commands, VPS warning, auto-scroll, auto-resize textarea.

**What's WRONG:** No streaming (response dumps all at once), no typing indicator (just "Thinking..." text), no conversation history (lost on refresh), fake agent status dot, no file support, no message actions, fragile -m-6 layout hack, not mobile responsive, basic code rendering without syntax highlighting.

**Build order:** Phase 1 (6.1, 6.3, 6.5, 6.10, 6.11) → Phase 2 (6.2, 6.13, 6.7, 6.8) → Phase 3 (6.4, 6.6, 6.14) → Phase 4 (6.9, 6.12, 6.15)

- [ ] **6.1 Streaming Responses** — SSE streaming from OpenClaw. Server: proxy OpenClaw stream via TransformStream + text/event-stream. Client: ReadableStream consumer, accumulate tokens, update message state. Token-by-token display. Strip thinking tags during stream. THE most impactful change. Reference: ChatGPT/Claude streaming.

- [ ] **6.2 Conversation History Sidebar** — left panel with past conversations grouped by date (Pinned, Today, Yesterday, This Week, Older). Search, pin, star. New conversation button. Click to switch. Auto-generate title from first message. `chat_conversations` table enhanced with pinned/starred/title columns. Full CRUD API. Reference: ChatGPT sidebar.

- [ ] **6.3 Typing Indicator** — animated bouncing dots while agent generates. Shows until first streaming token arrives. Agent name: "Support Bot is typing". Replace current "Thinking..." text. Reference: ChatGPT/Claude animations.

- [ ] **6.4 Message Actions** — hover-revealed buttons per message. Assistant: Copy, Regenerate, Thumbs up/down. User: Edit, Copy. Regenerate = resend original message. Edit = inline textarea, resubmit, delete messages after. Reference: ChatGPT message actions.

- [ ] **6.5 Code Block Rendering** — syntax-highlighted code blocks with language badge, copy button per block, dark theme styling. Use `react-syntax-highlighter` with `oneDark` theme. Custom ReactMarkdown code component. Reference: ChatGPT code blocks.

- [ ] **6.6 File/Image Sending** — paperclip button, file picker (images + PDF/TXT/CSV/MD, max 10MB), preview chip, send with message. Images: convert to base64 for multimodal. Text files: extract content, inject as context. Reference: ChatGPT/Claude file upload.

- [ ] **6.7 Search Conversations** — search input in sidebar, filter conversations by message content. API: `GET /api/chat/search?q=...` returns matching conversations with snippets. Part of 6.2 sidebar.

- [ ] **6.8 Pin/Star Conversations** — right-click or swipe to pin/star. Pinned = always at top. Starred = quick access. Part of 6.2 sidebar.

- [ ] **6.9 Export Conversation** — download as .txt, .md, or .json. Copy to clipboard option. Export button in chat header.

- [ ] **6.10 Rich Message Formatting** — enhanced ReactMarkdown components: styled tables with alternating rows, links open in new tab, block quotes with accent border, horizontal rules, inline images. Reference: Claude rendering.

- [ ] **6.11 Responsive Mobile Layout** — sidebar becomes slide-out sheet on mobile. Chat takes full width. Menu button to open sidebar. Input fixed at bottom. Uses `useMediaQuery`. Fixes the current -m-6 hack.

- [ ] **6.12 Agent Avatar + Persona** — show agent's emoji from identity.md as avatar in chat bubbles. Replace generic Bot icon. Agent name styled with theme.

- [ ] **6.13 Conversation Title** — auto-generate from first user message (~50 chars). User can rename via PATCH. Part of 6.2.

- [ ] **6.14 Read Receipts** — message status: ⏳ Sending → ✓ Sent → ✓✓ Delivered (when agent starts responding). Small text under user messages.

- [ ] **6.15 Sound Notification** — optional chime when agent responds and user is in another tab. Toggle in chat header (Volume icon). Sound file at `/public/sounds/message.mp3`. Uses `document.hasFocus()` check.

---

### 7. CHANNELS PAGE ENHANCEMENT (8 features)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/CHANNELS_ENHANCEMENT_59.md` for complete code, API specs, and testing steps.

**What we already have:** Channel cards with type/status/date, connect flow with setup wizard, disconnect with confirmation, 7 channel types (5 self-service, 2 admin-setup), health check via SSH, VPS warning. Channel Analytics and Auto-Responses already planned in 129 scope.

**Build order:** 7.3 → 7.1 → 7.6 → 7.2 → 7.5 → 7.4 → 7.7 → 7.8

- [ ] **7.1 Channel Status History** — log when channels go up/down. `channel_status_history` table. Track connect/disconnect/health events. Timeline UI per channel. Uptime percentage badge (last 7 days). Max 100 entries per channel.

- [ ] **7.2 Per-Channel Agent Routing** — assign which agent handles which channel. "Support Bot on WhatsApp, Sales Bot on Discord." `channel_agent_routing` table with priority. Agent selector dropdown on each channel card. Routing logic in chat/send route. Fallback to default if assigned agent not deployed.

- [ ] **7.3 Connection Test Button** — actually verify messages can flow, not just config file check. Per-channel type: Telegram `getMe` API, Discord `users/@me` API, Slack `auth.test`, Webchat gateway health, Teams credential format check. `testChannel()` function. Shows bot name + latency. Replace current fake health check. Reference: Chatwoot inbox health.

- [ ] **7.4 QR Code for WhatsApp** — self-service WhatsApp pairing via QR code (if OpenClaw supports it). SSH triggers QR generation → base64 image returned → user scans → status polls every 3s → connected. If not possible: improved admin-setup request flow (auto-create support ticket). Depends on OpenClaw WhatsApp implementation.

- [ ] **7.5 Channel Message Preview** — show last 5 messages per channel on the card (expandable). "Last message: 10 min ago" timestamp. Preview: user message + agent response. "View Full Chat →" link. API: `GET /api/channels/[id]/messages`.

- [ ] **7.6 Reconnect Button** — one-click fix for disconnected channels using saved encrypted credentials. `POST /api/channels/[id]/reconnect`. Reconfigures via SSH with stored creds. If fails: "Update Credentials" option. Prominent button on disconnected cards.

- [ ] **7.7 Channel Ordering** — drag or up/down arrows to reorder channels. "Primary" badge on first channel. Stored in localStorage (no DB needed). Visual preference only.

- [ ] **7.8 Channel Branding** — customize bot display name/avatar per channel. Webchat: full control (name, emoji, theme color). Other channels: show instructions for changing name in platform settings (BotFather for Telegram, Developer Portal for Discord). DB: `display_name`, `avatar_emoji`, `branding_config` columns on channels table.

---

### 8. SUPPORT PAGE ENHANCEMENT (14 features — FULL REBUILD)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/SUPPORT_ENHANCEMENT_59.md` for complete code, schemas, and testing steps.

**What we already have:** Ticket list with status tabs, create form (subject + description + priority), ticket thread with reply, resolve button, "new reply" badge (broken), empty state.

**What's WRONG:** Plain text only, no attachments, no ticket numbers (UUIDs), no status timeline, no satisfaction rating, no categories, no search, can't reopen, no email notifications, badge never clears, no auto-delete.

**Build order:** Phase 1 (8.3, 8.12, 8.10, 8.2) → Phase 2 (8.1, 8.4, 8.6, 8.7) → Phase 3 (8.5, 8.8, 8.13, 8.14) → Phase 4 (8.9, 8.11)

- [ ] **8.1 File Attachments** — drag-drop file upload in tickets. Supabase Storage bucket. Max 5 files, 10MB each. Images render inline, files as download links. `ticket_attachments` table. Multipart/form-data for create + reply routes.

- [ ] **8.2 Rich Text Formatting** — markdown toolbar (Bold, Italic, Code, List, Link) + preview toggle. All messages render with ReactMarkdown + remarkGfm. Formatting hint text under textarea.

- [ ] **8.3 Ticket Reference Number** — human-readable `#001, #002...` via SERIAL/sequence column. Replace UUIDs everywhere: list, thread, toasts, notifications, emails. `formatTicketNumber()` pads to 3+ digits.

- [ ] **8.4 Status Timeline** — `ticket_status_history` table tracking every status change (who, when, from/to, note). Vertical timeline in ticket thread with colored dots. Shows auto-delete countdown for resolved tickets.

- [ ] **8.5 Satisfaction Rating** — 1-5 star rating prompt on resolved tickets. `satisfaction_rating` + `satisfaction_comment` columns. Rating UI only shows for resolved unrated tickets. "Thank you" confirmation after rating.

- [ ] **8.6 Ticket Categories/Tags** — category selector in create form: General, Billing, Technical, Account, Channels, Agents, Feature Request. Category badges in list + filter tab. `category` column on support_tickets.

- [ ] **8.7 Search Tickets** — search across subject, description, and message content. API: `GET /api/tickets/search?q=...`. Search input above status tabs. Results with highlighted matching text.

- [ ] **8.8 Reopen Ticket** — "Reopen" button on resolved tickets. Sets status back to "open", re-enables reply. Resets 48hr auto-delete timer. Logs status change.

- [ ] **8.9 Email Notification on Reply** — when admin replies, user gets email with ticket number + reply preview + link. User preference toggle in account settings. `email_notifications` column on users table.

- [ ] **8.10 Read Tracking (Fix Badge)** — `last_read_at` column. Update on ticket view. "New reply" badge logic: `last_admin_message_at > last_read_at`. Fixes the bug where badge never clears.

- [ ] **8.11 Auto-Close / Auto-Delete** — cron endpoint runs hourly. Resolved tickets > 48 hours → delete ticket + messages + attachments (Supabase Storage cleanup). `resolved_at` column for accurate countdown. Show countdown in thread.

- [ ] **8.12 Ticket Priority Visual** — color-coded priority badges: Urgent (red), High (orange), Normal (blue), Low (gray). In ticket list + thread header.

- [ ] **8.13 Canned Responses** — 5 hardcoded quick reply buttons above reply box: "Provide details", "Share screenshot", "Confirm resolved", "Issue returned", "Request update". Click inserts text into reply.

- [ ] **8.14 Estimated Response Time** — static text based on priority: Urgent "within 1 hour", High "4 hours", Normal "12 hours", Low "24 hours". Shown in thread header while awaiting reply + on creation success.

---

### 9. BILLING PAGE ENHANCEMENT (10 features)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/BILLING_ENHANCEMENT_59.md` for complete code, schemas, and testing steps.

**What we already have:** Plan display (name, cycle, price, status, next date), payment history, upgrade buttons, no-sub state, Enterprise mailto.

**What's WRONG:** Upgrade buttons don't show what you GET, no invoice download, no payment method management, hardcoded plan data, no usage summary, no billing cycle switch, no next invoice preview.

**Build order:** Phase 1 (9.9, 9.6, 9.4) → Phase 2 (9.1, 9.7, 9.2) → Phase 3 (9.3, 9.5) → Phase 4 (9.8, 9.10)

- [ ] **9.1 Plan Comparison** — feature matrix on billing page: current plan vs upgrades. 22-row comparison table. Current plan column highlighted. ✅/✗ icons + spec text. "Show all features" expandable. THE #1 upgrade driver.

- [ ] **9.2 Invoice Download** — PDF invoice per payment. HTML invoice page with print CSS. Invoice number format: `INV-YYYYMM-XXXXXX`. Print button → browser PDF. Download icon on each payment row.

- [ ] **9.3 Payment Method Display + Update** — show card last 4 digits + expiry + brand. "Update Card" button → payment provider's hosted form. If provider doesn't support: "Contact support" link.

- [ ] **9.4 Usage Summary** — "Your Usage This Month" card: messages, conversations, agents, channels, uptime, days active. Positive tone ("You're getting great value!"). Subtle upgrade CTA for Starter users.

- [ ] **9.5 Billing Cycle Toggle** — switch monthly ↔ annual from dashboard. Show savings: "Save $109/year with annual." Confirmation dialog with new price + effective date. API updates payment provider subscription.

- [ ] **9.6 Next Invoice Preview** — "Next Invoice: $59.00 on April 15, 2026." From subscription record (no new API). Shows pending plan changes if any. Auto-renew status.

- [ ] **9.7 Plan Change Confirmation** — before upgrade: dialog showing price change, prorated charge, full feature list gained. `UPGRADE_FEATURES` per upgrade path (starter→pro, starter→ultra, pro→ultra). Proration calculation.

- [ ] **9.8 Billing Alerts** — notifications for: payment failed, card expiring (30 days), plan renewing (3 days). Cron checks daily. Shows in notification center + banner on billing page. Email notification optional.

- [ ] **9.9 Billing History Status Badges** — color-coded: Paid (green), Pending (yellow), Failed (red), Refunded (blue). Enhanced table with description column + download/retry buttons per status.

- [ ] **9.10 Referral / Coupon Code** — coupon input on billing page. `coupons` + `applied_coupons` tables. Validation: code exists, active, not expired, not maxed, user hasn't used, applicable plan. Shows discount description after applying.

---

### 10. ACCOUNT PAGE ENHANCEMENT (9 features)

**FULL IMPLEMENTATION GUIDE:** See `tasks/59/ACCOUNT_ENHANCEMENT_59.md` for complete code, schemas, and testing steps.

**What we already have:** Display email/name/creation date/role, edit name, change password. That's it — 3 features.

**Build order:** Phase 1 (10.2, 10.4, 10.1) → Phase 2 (10.3, 10.8) → Phase 3 (10.5, 10.6) → Phase 4 (10.7, 10.9)

- [ ] **10.1 Profile Avatar** — upload photo (resize to 200x200 with `sharp`) or select emoji from grid. Supabase Storage bucket "avatars". Shows in sidebar + chat. `avatar_url` + `avatar_emoji` columns. Priority: uploaded > emoji > initials. Delete avatar option.

- [ ] **10.2 Notification Preferences** — toggle switches for email + dashboard notifications per type: ticket replies, billing alerts, VPS alerts, weekly summary, agent errors, channel disconnects, sound. `notification_preferences` JSONB column. All systems check prefs before sending. Needed by email notifications (8.9).

- [ ] **10.3 Security Section** — account security score (Good/Fair/Weak), password last changed, last login time + device + IP, recent login activity from audit log. `password_changed_at` column. Security score based on password age + email verification.

- [ ] **10.4 Timezone Setting** — timezone dropdown with auto-detect (`Intl.DateTimeFormat`). Shows current time in selected zone. `timezone` column (default 'UTC'). All date formatting functions should use this. Affects: analytics charts, logs, scheduled restarts, business hours.

- [ ] **10.5 Data Export** — "Download My Data" button. Exports JSON with: profile, subscription, tickets, agents, channels, webhooks, API keys. Rate limit 1/day. Note: VPS data (chat, KB, analytics) is on user's VPS. GDPR compliance.

- [ ] **10.6 Account Deletion** — "Delete Account" in Danger Zone. Multi-step confirmation: warning → type email → enter password → final confirm. Cancels subscription, marks VPS for deprovisioning, deletes all Supabase data, removes auth user. VPS cleanup handled by admin. GDPR right to erasure.

- [ ] **10.7 Connected Services** — summary view: X channels connected, Y agents deployed, Z webhooks active, N API keys. Each links to management page. Quick status at a glance. No new API — aggregates existing data.

- [ ] **10.8 Session Management** — show current session info (device + IP). "Sign Out All Other Devices" button. Uses Supabase auth global signout. Simplified approach (Supabase doesn't expose session list).

- [ ] **10.9 Language / Locale** — timezone dropdown ready, language selector with only "English" for now. `locale` column stores preference. Infrastructure for future i18n. More languages added later.

---

### 11. MONITORING PAGE — BUILD FROM SCRATCH

**What to build:** Basic monitoring for Starter users. 4 gauge cards (CPU%, RAM%, Disk%, Network) with current snapshot values. Health badge. Pro features show upgrade prompt.

_Full spec to be planned._

---

### 12. LANDING PAGE & WEBSITE OVERHAUL

**NOT YOUR TASK.** The landing page overhaul is handled by a DEDICATED landing page agent (separate from you). Full spec at `tasks/59/LANDING_ENHANCEMENT_59.md`. Tracked in `tasks/PLANNER_TASKS.md` task #8.

**Do NOT modify:** `src/app/page.tsx`, `src/components/landing/*`, or any landing page components. The landing page agent will handle all of this.

---

## PART C: VPS DATA ARCHITECTURE IMPACT ON STARTER

The VPS Data Architecture affects how Starter features read/write data. Key impacts:

- **Chat messages** → read from VPS OpenClaw (port 18789), NOT Supabase
- **Monitoring data** → fetched live via SSH (no storage needed for Starter — just current snapshot)
- **Agent config files** → VPS only (already the case via deployAgent SSH)
- **Activity feed data** → aggregated from existing Supabase tables OR VPS Data API when ready
- **Support tickets** → Supabase (auto-delete 48hrs after resolved)

Build features using current data sources. When VPS Data API (port 5556) is ready, migrate where needed.

---

## PART D: PLANNING & RESEARCH (Future Pages)

Track research status for each page:

- [x] **Overview** — researched, 9 features planned
- [ ] **VPS** — needs research (Cloudways, RunCloud, ServerPilot, Ploi)
- [ ] **Models** — needs research (AI model management UIs)
- [ ] **Agents** — needs research (agent management dashboards)
- [ ] **Store** — needs research (app marketplaces, plugin stores)
- [ ] **Chat** — needs research (chat UIs, messaging apps)
- [ ] **Channels** — needs research (omnichannel platforms, Chatwoot)
- [ ] **Support** — needs research (help desk UIs, Zendesk, Freshdesk)
- [ ] **Billing** — needs research (billing dashboards, Stripe portal)
- [ ] **Account** — needs research (account settings patterns)
- [ ] **Monitoring** — needs research (server monitoring dashboards, Grafana, Netdata)
- [ ] **Landing** — needs research (landing page best practices, latest trends)
