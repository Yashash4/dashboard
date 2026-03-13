# Agent Prompt: Plan 59 (Starter Tier) — DEPLOY TOMORROW

You are a coder agent for ClawHQ. Read `CLAUDE.md` first. You own ALL starter-tier pages. **We are deploying tomorrow — test everything, fix everything, ship-ready.**

Ignore payments/billing integration for now. Focus on: every page works, every button does something, every flow is complete, no broken UI, no stubs, no console.logs.

---

## Your Files

**Pages you own:**
- `/dashboard` (overview) — `src/app/dashboard/page.tsx`
- `/dashboard/vps` — `src/app/dashboard/vps/page.tsx` + `src/components/dashboard/vps-controls.tsx`
- `/dashboard/models` — `src/app/dashboard/models/page.tsx` + `src/components/dashboard/model-config.tsx`
- `/dashboard/agents` — `src/app/dashboard/agents/page.tsx` + `src/components/dashboard/agent-manager.tsx`
- `/dashboard/store` — `src/app/dashboard/store/page.tsx` + `src/components/dashboard/agent-store.tsx`
- `/dashboard/chat` — `src/app/dashboard/chat/page.tsx` + `src/components/dashboard/agent-chat.tsx`
- `/dashboard/channels` — `src/app/dashboard/channels/page.tsx` + `src/components/dashboard/channel-manager.tsx`
- `/dashboard/support` — `src/app/dashboard/support/page.tsx` + `/new/page.tsx` + `/[id]/page.tsx`
- `/dashboard/billing` — `src/app/dashboard/billing/page.tsx` + `src/components/dashboard/billing-overview.tsx`
- `/dashboard/account` — `src/app/dashboard/account/page.tsx` + `src/components/dashboard/account-settings.tsx`
- `/dashboard/monitoring` — `src/app/dashboard/monitoring/page.tsx` + `src/components/dashboard/monitoring-dashboard.tsx`
- `/dashboard/openclaw` — `src/app/dashboard/openclaw/page.tsx`
- `/login` — `src/app/login/page.tsx`
- `/register` — `src/app/register/page.tsx`
- `/forgot-password` — `src/app/forgot-password/page.tsx`
- Landing page — `src/app/page.tsx` + all `src/components/*.tsx` sections
- Layout — `src/app/dashboard/layout.tsx`, `src/app/layout.tsx`, `src/app/providers.tsx`
- Sidebar — `src/components/dashboard/app-sidebar.tsx`
- Middleware — `src/middleware.ts`
- Supporting components — `uptime-display.tsx`, `dashboard-password.tsx`, `ssl-checker.tsx`, `navigation-progress.tsx`, `upgrade-prompt.tsx`

**API routes you own:**
- `src/app/api/vps/*` (status, start, stop, restart, monitoring, logs, uptime, gateway-health, password, ssl-check, reboot, enable-embedding)
- `src/app/api/models/change/route.ts`
- `src/app/api/agents/*` (deploy, undeploy, config, purchase, analytics)
- `src/app/api/channels/*` (connect, disconnect, health)
- `src/app/api/tickets/*` (create, [id]/reply, [id]/resolve)
- `src/app/api/chat/*` (send, messages)
- `src/app/api/account/*` (update, password)
- `src/app/api/cron/*`

**Lib files you own:**
- `src/lib/supabase.ts`, `supabase-server.ts`, `supabase-admin.ts`
- `src/lib/ssh.ts`, `hostinger.ts`, `cloudflare.ts`
- `src/lib/utils.ts`, `tier.ts`, `rate-limit.ts`, `user-context.tsx`
- `src/lib/provision.ts`, `provision-v3.ts`, `provision-store.ts`
- `src/lib/crypto.ts`, `vps-status.ts`
- `src/middleware.ts`

---

## TASK: Full Deployment Audit & Fix

Go through EVERY page and EVERY API route you own. For each one:

### 1. REMOVE all console.log / console.error
Search every file. Remove them all. Use proper error handling instead (toast on client, JSON error response on server).

### 2. CHECK every user flow end-to-end

**Auth flows:**
- [ ] Register → creates account → redirects to dashboard
- [ ] Login → authenticates → redirects to dashboard
- [ ] Forgot password → sends reset email → user can reset
- [ ] Logout → clears session → redirects to login
- [ ] Middleware blocks unauthenticated users from `/dashboard/*`
- [ ] Middleware redirects authenticated users away from `/login`, `/register`

**Overview page:**
- [ ] New user (no subscription) → shows "Get Started" CTA
- [ ] User with subscription but no VPS → shows "Setting Up" provisioning state
- [ ] User with VPS → shows all stats (VPS status, plan, model, context, channels, agents, tickets)
- [ ] All stat numbers are real (not hardcoded)
- [ ] Quick action buttons work (Open OpenClaw, Manage VPS, Raise Ticket)
- [ ] What if subscription exists but VPS query fails? Error state?

**VPS page:**
- [ ] No VPS → empty state message
- [ ] VPS running → shows status, hostname, IP, controls
- [ ] Start/Stop/Restart buttons → confirmation dialog → API call → toast → status updates
- [ ] Monitoring charts update every 10s (CPU, RAM, Disk, Network)
- [ ] Logs viewer → "View Logs" fetches real logs from SSH
- [ ] SSL checker works
- [ ] Uptime display shows real data
- [ ] Dashboard password change works
- [ ] "Open OpenClaw" link works
- [ ] What if SSH connection fails? Does the UI show an error or hang forever?
- [ ] What if VPS is stopped? Do monitoring/logs gracefully show "VPS is stopped"?
- [ ] Pro-gated features (process list, maintenance) show upgrade prompt for starter users

**Models page:**
- [ ] Shows current model with context limit
- [ ] Available models list loads from DB
- [ ] Starter: "Request Change" → queued for next billing cycle → pending indicator shows
- [ ] Starter: 1 change per month limit enforced → shows "You've used your change" message
- [ ] Cancel pending change works
- [ ] What if no model config exists in DB? Empty/error state?
- [ ] No provider names visible (no "Ollama", "Blackbox" etc.)

**Agents page:**
- [ ] No agents → empty state with link to store
- [ ] Shows agent cards with name, category, description, deploy status
- [ ] Deploy button → confirmation → SSH deploys → status updates
- [ ] Undeploy button → confirmation → SSH removes → status updates
- [ ] What if VPS is stopped when deploying? Error message?
- [ ] Agent analytics show real data

**Store page:**
- [ ] All active agents load from DB
- [ ] Category filter works
- [ ] Owned agents show "Owned" badge
- [ ] Free agents → "Add" button → adds to user's agents
- [ ] Premium agents → purchase flow (SKIP payment for now, but button shouldn't crash)
- [ ] Empty store → "No agents available" state

**Chat page:**
- [ ] No deployed agents → "No agents deployed, go to Agents page" message
- [ ] Agent list shows on left panel
- [ ] Click agent → opens chat
- [ ] Send message → proxies to OpenClaw → shows response
- [ ] Message history loads on conversation open
- [ ] What if OpenClaw is down? Error message in chat?
- [ ] What if VPS is stopped? Shows error?
- [ ] Empty conversation state

**Channels page:**
- [ ] No channels → shows "Connect New Channel" section
- [ ] Connected channels show type, status badge, date
- [ ] Connect flow: select type → fill credentials → SSH configures → status updates
- [ ] Disconnect → confirmation → SSH removes → channel removed
- [ ] All 8 channel types work (WhatsApp, Telegram, Discord, Slack, Signal, Teams, WebChat, Other)
- [ ] What if VPS is stopped when connecting? Error?
- [ ] Channel health check works

**Support page:**
- [ ] Ticket list loads with filters (open, in_progress, resolved, closed)
- [ ] "New Ticket" → form with subject, description, priority → creates ticket
- [ ] Click ticket → opens thread → shows messages
- [ ] Reply to ticket works
- [ ] Resolve ticket works
- [ ] Empty state when no tickets

**Billing page:**
- [ ] Shows current plan, cycle, price, status, dates
- [ ] Payment history loads (skip actual payment flow)
- [ ] Upgrade buttons don't crash (even if payment isn't wired)
- [ ] No subscription → shows plan selection

**Account page:**
- [ ] Shows email, name, creation date, role
- [ ] Edit name → saves to DB
- [ ] Change password → requires current password → saves
- [ ] What if update fails? Error toast?

**Monitoring page:**
- [ ] Starter user → upgrade prompt
- [ ] Pro user → full monitoring dashboard
- [ ] Status bar shows VPS status, gateway health, hostname, uptime
- [ ] 4 stat cards: CPU, RAM, Disk, Network
- [ ] Charts update over time
- [ ] Gateway logs panel works

**OpenClaw page:**
- [ ] Starter → upgrade prompt
- [ ] Pro with no URL → "not configured" message
- [ ] Pro with URL → landing page with feature cards + "Open Dashboard" button
- [ ] Button opens correct URL

**Sidebar:**
- [ ] All nav items link to correct pages
- [ ] Active route highlighting works
- [ ] Pro items hidden for starter users
- [ ] Ultra items hidden for non-ultra users
- [ ] User name/email/plan badge shows correctly
- [ ] Logout button works

**Landing page:**
- [ ] All sections render without errors
- [ ] Pricing matches actual plans (59/129/350)
- [ ] CTA buttons link to register
- [ ] No broken images or links
- [ ] No infrastructure details exposed

### 3. CHECK every edge case
- What happens when the user has no subscription at all?
- What happens when VPS is null/not provisioned?
- What happens when model config doesn't exist?
- What happens when Supabase queries fail (network error)?
- What happens when SSH operations timeout?
- Are all loading states implemented? (skeleton/spinner while fetching)
- Are all error states implemented? (toast or error message when API fails)
- Are all empty states implemented? (message when list is empty)

### 4. CHECK for exposed secrets
Search ALL your files for these strings. They must NEVER appear in UI, error messages, or code comments visible to users:
- "Hostinger"
- "Ollama"
- "Blackbox"
- "ollama"
- "hostinger"
- Any SSH credentials, API keys, or server IPs in frontend code

### 5. CHECK form validations
- Every form should validate on client before submitting
- Every API route should validate input server-side
- Error messages should be user-friendly (not raw error objects)

### 6. FIX everything you find
Don't just report issues — fix them. After fixing, run `next build` to verify zero errors.

---

## Rules
- Follow `CLAUDE.md` conventions
- NEVER expose infrastructure details
- `next build` must pass after every change
- Don't touch Pro-gated pages (logs, analytics, KB, webhooks, smart-routing, api-access, audit-log)
- Don't touch Ultra/Mission Control pages
- Dark theme only, CSS variables only
- Skip payment integration for now
