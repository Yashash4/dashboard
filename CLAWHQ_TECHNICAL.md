# ClawHQ — Technical Plan

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email + password)
- **Deployment:** Vercel only
- **Domain:** app.clawhq.tech
- **Styling:** Tailwind CSS + shadcn/ui
- **VPS Automation:** SSH via `node-ssh` from Next.js API routes
- **Customer VPS:** Hostinger, Docker-based OpenClaw deployment
- **Payments:** XPay Checkout (xpaycheckout.com)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   VERCEL                         │
│                                                  │
│  ┌──────────────┐    ┌───────────────────────┐   │
│  │  Landing Page │    │  Dashboard App        │   │
│  │  clawhq.tech  │    │  app.clawhq.tech      │   │
│  │  (co-founder) │    │  Next.js + API Routes │   │
│  └──────────────┘    └──────────┬────────────┘   │
│                                  │                │
└──────────────────────────────────┼────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │               │
                    ▼              ▼               ▼
              ┌──────────┐  ┌──────────┐   ┌──────────┐
              │ Supabase  │  │  XPay    │   │ Hostinger│
              │ (DB+Auth) │  │ Checkout │   │ VPS (SSH)│
              └──────────┘  └──────────┘   └─────┬────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │              │
                                    ▼             ▼              ▼
                              ┌──────────┐ ┌──────────┐  ┌──────────┐
                              │Customer 1│ │Customer 2│  │Customer N│
                              │  VPS     │ │  VPS     │  │  VPS     │
                              │ Docker:  │ │ Docker:  │  │ Docker:  │
                              │ OpenClaw │ │ OpenClaw │  │ OpenClaw │
                              └────┬─────┘ └────┬─────┘  └────┬─────┘
                                   │             │              │
                                   ▼             ▼              ▼
                              ┌──────────────────────────────────┐
                              │     Your API Infra               │
                              │     (Ollama-like, models served) │
                              │     Kimi K2.5, MiniMax M2.5 etc  │
                              └──────────────────────────────────┘
```

---

## Docker Deployment (Per Customer VPS)

### Initial Setup (SSH into customer VPS)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Pull and run OpenClaw
docker run -d \
  --name openclaw \
  --restart=always \
  -p 3000:3000 \
  -v /opt/openclaw/data:/data \
  -v /opt/openclaw/config:/config \
  -e OPENCLAW_API_BASE_URL=https://your-api-infra.com/v1 \
  -e OPENCLAW_API_KEY=customer_specific_key \
  -e OPENCLAW_MODEL=kimi-k2.5 \
  -e OPENCLAW_NUM_CTX=128000 \
  openclaw/openclaw:latest
```

### Key Docker Commands (triggered from dashboard API routes)
```bash
docker start openclaw       # Start
docker stop openclaw        # Stop
docker restart openclaw     # Restart
docker logs openclaw        # View logs
docker stats openclaw       # CPU/RAM usage
docker exec openclaw cat /config/openclaw.json  # Read config
```

### Model Change (via SSH)
```bash
# Update model in config
docker exec openclaw sed -i 's/"model":"old_model"/"model":"new_model"/' /config/openclaw.json
docker restart openclaw
```

### Agent Deployment (via SSH)
```bash
# Create agent directory
docker exec openclaw mkdir -p /data/agents/agent_name
# Copy agent files (via SFTP or echo)
# Restart to pick up new agent
docker restart openclaw
```

### Auto-restart
`--restart=always` flag means if OpenClaw crashes or VPS reboots, Docker auto-restarts the container. No manual intervention needed.

---

## Database Schema (Supabase)

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Auth handled by Supabase Auth, links to this table via id
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  xpay_subscription_id TEXT,
  UNIQUE(user_id)
);
```

### vps_instances
```sql
CREATE TABLE vps_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hostname TEXT, -- DuckDNS or custom domain
  ip_address TEXT NOT NULL,
  ssh_user TEXT NOT NULL,
  ssh_password TEXT NOT NULL, -- encrypted
  ssh_port INTEGER DEFAULT 22,
  vps_provider TEXT DEFAULT 'hostinger',
  cpu_cores INTEGER,
  ram_gb INTEGER,
  storage_gb INTEGER,
  bandwidth_tb INTEGER,
  openclaw_dashboard_url TEXT,
  status TEXT DEFAULT 'provisioning' CHECK (status IN ('running', 'stopped', 'restarting', 'provisioning', 'error')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### models
```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_model TEXT NOT NULL DEFAULT 'kimi-k2.5',
  requested_model TEXT, -- null if no change pending
  change_effective_date TIMESTAMPTZ, -- next billing date
  context_limit INTEGER DEFAULT 128000, -- null = unlimited (Tier 2)
  UNIQUE(user_id)
);
```

### agents
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  config_files JSONB NOT NULL, -- agent config data
  price DECIMAL(10,2) DEFAULT 0, -- 0 = free agent
  is_premium BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### user_agents
```sql
CREATE TABLE user_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  deployed BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agent_id)
);
```

### channels
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'telegram', 'discord', 'slack', 'signal', 'teams', 'webchat', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('connected', 'disconnected', 'pending')),
  configured_at TIMESTAMPTZ
);
```

### support_tickets
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ticket_messages
```sql
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Customer Dashboard Pages

### 1. /dashboard (Home/Overview)
- VPS status badge (running/stopped/error)
- Current plan (Starter/Pro/Enterprise)
- OpenClaw dashboard link (clickable, new tab)
- Current model name + context limit
- Quick stats: channels connected, agents installed
- Quick actions: Start/Stop VPS, Open OpenClaw, Raise Ticket

### 2. /dashboard/vps (VPS Controls)
- Start / Stop / Restart buttons
- VPS monitoring (CPU, RAM, disk — from `docker stats` via SSH)
- VPS specs display
- Uptime indicator
- API: SSH into VPS → run `docker stats openclaw --no-stream --format json`

### 3. /dashboard/models (Model Settings)
- Current model + context limit display
- **Tier 1:** "Request Change" → dropdown → queued for next billing cycle
- **Tier 2:** Change instantly → SSH command → config update → docker restart
- Show pending model change if exists

### 4. /dashboard/agents (Agents)
- List all agents (premium + custom)
- Each: name, description, status, source (premium/custom)
- Premium: "Purchased" badge
- Link to landing page to buy more
- Purchase triggers: DB record + SSH deploy + docker restart

### 5. /dashboard/channels (Channels)
- Status list: channel type + connected/disconnected/pending
- "Request new channel" → creates support ticket
- Display only — you configure via SSH

### 6. /dashboard/support (Support)
- Create ticket (subject, description, priority)
- Ticket list with status filters
- Ticket detail → conversation thread
- Email notification on admin reply

### 7. /dashboard/billing (Billing)
- Current plan + price
- Billing cycle (monthly/annual)
- Next payment date
- Subscription status
- Upgrade/downgrade buttons
- Payment history (from XPay)

### 8. /dashboard/account (Account)
- Email, name
- Change password
- OpenClaw dashboard URL
- DuckDNS link / hostname
- Plan summary

---

## Admin Dashboard Pages

### 1. /admin (Home)
- Active customers count
- This month's revenue
- Total VPS costs (manual or calculated)
- Profit
- New customers this month
- Open tickets count

### 2. /admin/customers (Customer List)
- Table: name, email, plan, VPS IP, status, created date
- Click → full detail + actions
- Actions: trigger model change, deploy agent, suspend/activate

### 3. /admin/deploy (Deploy Controls)
- Select customer dropdown
- Model change: select model → triggers SSH → updates config → restarts
- Agent deploy: select agent → triggers SSH → deploys files → restarts
- Deployment log

### 4. /admin/tickets (Tickets)
- All tickets, filterable by status
- Click → reply to customer
- Change ticket status

---

## API Routes

```
# Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

# VPS
GET    /api/vps/status
POST   /api/vps/start
POST   /api/vps/stop
POST   /api/vps/restart
GET    /api/vps/monitoring

# Models
GET    /api/models/current
POST   /api/models/change
GET    /api/models/available

# Agents
GET    /api/agents/list
POST   /api/agents/purchase
POST   /api/agents/deploy          # admin only

# Channels
GET    /api/channels/list

# Support
POST   /api/tickets/create
GET    /api/tickets/list
GET    /api/tickets/[id]
POST   /api/tickets/[id]/reply

# Billing
GET    /api/billing/subscription
POST   /api/billing/upgrade
GET    /api/billing/invoices

# Admin
GET    /api/admin/stats
GET    /api/admin/customers
GET    /api/admin/customers/[id]
POST   /api/admin/deploy/model
POST   /api/admin/deploy/agent
GET    /api/admin/tickets
POST   /api/admin/tickets/[id]/reply
```

---

## File Structure

```
app.clawhq.tech/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # redirect to /dashboard or /login
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # sidebar + nav
│   │   │   ├── page.tsx               # overview
│   │   │   ├── vps/page.tsx
│   │   │   ├── models/page.tsx
│   │   │   ├── agents/page.tsx
│   │   │   ├── channels/page.tsx
│   │   │   ├── support/
│   │   │   │   ├── page.tsx           # ticket list
│   │   │   │   ├── new/page.tsx       # create ticket
│   │   │   │   └── [id]/page.tsx      # ticket detail
│   │   │   ├── billing/page.tsx
│   │   │   └── account/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # admin home/stats
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx           # list
│   │   │   │   └── [id]/page.tsx      # detail
│   │   │   ├── deploy/page.tsx
│   │   │   └── tickets/
│   │   │       ├── page.tsx           # list
│   │   │       └── [id]/page.tsx      # detail + reply
│   │   └── api/
│   │       ├── auth/
│   │       ├── vps/
│   │       ├── models/
│   │       ├── agents/
│   │       ├── channels/
│   │       ├── tickets/
│   │       ├── billing/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── VpsStatusBadge.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── ChannelStatus.tsx
│   │   │   ├── TicketForm.tsx
│   │   │   └── StatsCard.tsx
│   │   └── admin/
│   │       ├── CustomerTable.tsx
│   │       ├── DeployForm.tsx
│   │       └── RevenueChart.tsx
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── supabase-server.ts         # Server-side Supabase
│   │   ├── ssh.ts                     # SSH helper (node-ssh wrapper)
│   │   ├── xpay.ts                    # XPay payment integration
│   │   └── utils.ts                   # General utilities
│   └── middleware.ts                   # Auth + admin role protection
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── .env.local
    # NEXT_PUBLIC_SUPABASE_URL=
    # NEXT_PUBLIC_SUPABASE_ANON_KEY=
    # SUPABASE_SERVICE_ROLE_KEY=
    # XPAY_API_KEY=
    # XPAY_WEBHOOK_SECRET=
```

---

## SSH Helper (lib/ssh.ts)

```typescript
// Wrapper around node-ssh for common operations
// Functions:
//   connectToVPS(ip, user, password) → SSH connection
//   startOpenClaw(connection) → docker start openclaw
//   stopOpenClaw(connection) → docker stop openclaw
//   restartOpenClaw(connection) → docker restart openclaw
//   getVPSStats(connection) → docker stats output (CPU, RAM, disk)
//   changeModel(connection, newModel) → update config + restart
//   deployAgent(connection, agentFiles) → create agent dir + write files + restart
//   getOpenClawLogs(connection, lines) → docker logs --tail N
```

---

## Implementation Priority

### Phase 1 — Core (Day 1-2)
1. Next.js project + Supabase setup + Vercel deploy
2. Auth (login/register) with Supabase Auth
3. Dashboard layout (sidebar + nav)
4. Dashboard overview page
5. Account page
6. Middleware (auth protection + admin check)

### Phase 2 — VPS & Models (Day 3-4)
7. SSH helper library (lib/ssh.ts)
8. VPS controls page (start/stop/restart)
9. VPS monitoring (docker stats via SSH)
10. Model settings page
11. Model change API (Tier 1: queued, Tier 2: instant)

### Phase 3 — Agents & Channels (Day 5)
12. Agents list page
13. Agent purchase API (DB record)
14. Agent deploy API (SSH + docker restart)
15. Channels status page

### Phase 4 — Support & Billing (Day 6)
16. Ticket creation + listing
17. Ticket conversation thread
18. XPay integration (subscription creation, webhooks)
19. Billing page

### Phase 5 — Admin (Day 7)
20. Admin stats page (revenue, customers, costs)
21. Customer list + detail
22. Deploy controls (model + agent triggers)
23. Admin ticket management

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "latest",
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest",
    "node-ssh": "latest",
    "tailwindcss": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  }
}
```
Plus shadcn/ui components installed via CLI.

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# XPay
XPAY_API_KEY=xxx
XPAY_WEBHOOK_SECRET=xxx

# App
NEXT_PUBLIC_APP_URL=https://app.clawhq.tech
```

---

## Security Considerations

- SSH passwords encrypted in Supabase (use pgcrypto or app-level encryption)
- Admin routes protected by middleware (role check)
- Customer can only access their own data (RLS policies in Supabase)
- No customer SSH access to VPS
- API routes validate session + ownership before any action
- XPay webhooks verified with signature
- Rate limiting on API routes (prevent abuse)
