# Plan 11: Pro Plan ($129) — Dashboard Features

## Context
The $59 Starter dashboard is complete. Now building the $129 Pro plan additions. $299 planned separately later.

**What Pro adds over Starter:**
- Instant & unlimited model changes — **Already works**
- Full context window — **Already works**
- **Agent Chat** — Chat with deployed agents from ClawHQ
- **Embedded OpenClaw Dashboard** — Customer's OpenClaw dashboard inside ClawHQ
- **Agent Monitoring** — Status, activity feed, log viewer (Mission Control-inspired, built natively)
- **Full Agent CRUD** — Create, edit, delete custom agents
- **Priority Support** — Auto-flag Pro tickets

**Key patterns adopted from [Mission Control](https://github.com/builderz-labs/mission-control):**
- Activities table with inline event logging on mutations
- SSE (Server-Sent Events) for real-time updates + smart polling fallback
- Agent health via `last_seen` timestamp + status field (no dedicated heartbeat table)
- Log viewer with level-based color coding and filter by level/source/search
- Event bus pattern for broadcasting events across API routes

---

## 7 Tasks (sequential)

### Task 1: Plan-Gating Foundation

**What:** Sidebar shows Pro-only items, upgrade prompt for Starter.

**Modify `src/components/dashboard/app-sidebar.tsx`:**
- Accept `plan` prop
- 3 new nav items (pro/enterprise only):
  - "Chat" (`MessageCircle`, `/chat`)
  - "Monitoring" (`Activity`, `/monitoring`)
  - "OpenClaw" (`Globe`, `/openclaw`)

**Modify `src/app/dashboard/layout.tsx`:**
- Query `subscriptions` for plan
- Pass `plan` to sidebar

**New `src/components/dashboard/upgrade-prompt.tsx`:**
- Card: lock icon, "Upgrade to Pro", feature bullets, CTA → `/billing`

**Modify `src/middleware.ts`:**
- Add `/chat`, `/monitoring`, `/openclaw` to `DASHBOARD_PATHS` and matcher

---

### Task 2: Agent Chat — Database & API

**New DB tables:**
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
+ RLS: users read/write own conversations and messages only.

**New API routes:**

`POST /api/chat/send`:
- Auth + plan check (pro/enterprise)
- Validate agent is deployed (check `user_agents`)
- Get/create conversation for user+agent pair
- Store user message
- HTTP POST to customer's OpenClaw (`openclaw_dashboard_url`) with message + agent name
- Store assistant response
- Return response + conversation_id

`GET /api/chat/conversations`:
- List user's conversations with agent name + last message preview + updated_at

`GET /api/chat/conversations/[agent_id]`:
- Get messages for agent conversation, ordered by created_at
- Paginated (limit 50, cursor-based)

**New `src/lib/openclaw-api.ts`:**
```typescript
export async function sendAgentMessage(
  openclawUrl: string,
  agentName: string,
  message: string,
  history?: { role: string; content: string }[]
): Promise<string> {
  // POST to OpenClaw's chat API
  // Timeout: 30s
  // Retry: 1 attempt on timeout
  // Never expose VPS/URL in error messages
}
```

---

### Task 3: Agent Chat — UI

**New `src/app/dashboard/chat/page.tsx`:**
- Server component: fetch deployed agents + plan
- Starter → `<UpgradePrompt />`
- No agents deployed → empty state with link to `/agents`

**New `src/components/dashboard/agent-chat.tsx`:**

Layout (split-panel):
```
┌──────────────────┬──────────────────────────────────────┐
│ Deployed Agents   │  Chat with [Agent Name]              │
│                   │                                      │
│ ▸ Customer Bot    │  ┌─────────────────────────────┐     │
│   Sales Agent     │  │ User: How do I reset my...  │     │
│   Support Bot     │  │ Agent: To reset your pass.. │     │
│                   │  │ User: Thanks!               │     │
│                   │  └─────────────────────────────┘     │
│                   │                                      │
│                   │  ┌─────────────────────────┐ [Send]  │
│                   │  │ Type a message...        │         │
│                   │  └─────────────────────────┘         │
└──────────────────┴──────────────────────────────────────┘
```

- Left panel: agent list with status dot (green=deployed), click to select
- Right panel: chat messages + input
  - User messages: right-aligned, orange tint background
  - Agent messages: left-aligned, muted background
  - Loading: typing indicator while waiting for response
  - Auto-scroll to bottom on new messages
- Fetch history on agent select → `GET /api/chat/conversations/[agent_id]`
- Send → `POST /api/chat/send` → optimistic UI (show user msg immediately, append response)

---

### Task 4: Agent Monitoring (Mission Control-inspired)

**What:** Status dashboard, activity feed, log viewer. All built natively in ClawHQ design system.

**New DB table:**
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);
```

Activity types (matching Mission Control pattern):
- `agent_deployed`, `agent_undeployed`, `agent_created`, `agent_deleted`
- `model_changed`, `model_change_scheduled`, `model_change_cancelled`
- `channel_connected`, `channel_disconnected`
- `vps_started`, `vps_stopped`, `vps_restarted`
- `config_changed`

**Activity logging:** Add to existing API routes (deploy, undeploy, model change, channel connect/disconnect, VPS start/stop/restart) — insert into `activities` table after the action succeeds.

**New `src/app/dashboard/monitoring/page.tsx`:**
- Server component: fetch deployed agents + plan
- Starter → UpgradePrompt

**New `src/components/dashboard/agent-monitoring.tsx`:**

Three sections:

**1. Agent Status Grid (top)**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🟢 Support   │ │ 🟢 Sales     │ │ 🔴 Research  │
│   Bot        │ │   Agent      │ │   Agent      │
│ Healthy      │ │ Healthy      │ │ Offline      │
│ Since 2h ago │ │ Since 1d ago │ │ Last: 3d ago │
└──────────────┘ └──────────────┘ └──────────────┘
```
- Card per deployed agent
- Color: green (healthy) / red (offline) based on VPS process check
- Shows agent name, status, deployed since
- Auto-refresh every 30s (smart polling — pauses when tab hidden, like Mission Control)

**2. Activity Feed (middle)**
- Chronological list of events
- Each: icon (color per type) + description + relative timestamp ("2m ago")
- Filter by: event type dropdown, agent dropdown
- Paginated (last 100)
- `since` parameter for efficient polling (only fetch new events)
- Uses `GET /api/agents/events?type=&agent_id=&since=&limit=100`

**3. Log Viewer (bottom, expandable)**
- Select agent → see last 50 log lines from VPS
- Level-based color coding: red (error), yellow (warn), blue (info), gray (debug)
- Copy logs button
- Manual refresh button
- Uses `GET /api/agents/[id]/logs?lines=50`

**New API routes:**

`GET /api/agents/monitoring`:
- Auth + plan check
- For each deployed agent: SSH into VPS, check if agent dir exists + process responding
- Return: `[{ agent_id, name, status: "healthy"|"offline", deployed_at }]`
- Cache result for 15s to avoid SSH spam

`GET /api/agents/events`:
- Auth + plan check
- Query params: `type`, `agent_id`, `since` (ISO timestamp), `limit` (max 100)
- Returns: `{ events: Activity[], total: number }`

`GET /api/agents/[id]/logs`:
- Auth + plan check + ownership
- SSH → read agent-specific logs
- Return: `{ logs: string[], agent_name: string }`

**SSH additions in `src/lib/ssh.ts`:**

`getAgentHealth(creds, agentName)`:
- Check if agent directory exists in data dir
- Check if OpenClaw process is running
- Return: `{ status: "healthy" | "offline", lastSeen?: string }`

`getAgentLogs(creds, agentName, lines)`:
- Docker: `docker logs openclaw --tail {lines} 2>&1 | grep -i {agentName}`
- Native: `journalctl` or log file grep for agent name
- Return: array of log line strings

**Inline event logging additions to existing routes:**
- `src/app/api/agents/deploy/route.ts` → insert `agent_deployed` activity
- `src/app/api/agents/undeploy/route.ts` → insert `agent_undeployed` activity
- `src/app/api/models/change/route.ts` → insert `model_changed` or `model_change_scheduled`
- `src/app/api/channels/connect/route.ts` → insert `channel_connected`
- `src/app/api/channels/disconnect/route.ts` → insert `channel_disconnected`
- `src/app/api/vps/start/route.ts` → insert `vps_started`
- `src/app/api/vps/stop/route.ts` → insert `vps_stopped`
- `src/app/api/vps/restart/route.ts` → insert `vps_restarted`

---

### Task 5: Embedded OpenClaw Dashboard

**New `src/app/dashboard/openclaw/page.tsx`:**
- Server: fetch `vps_instances.openclaw_dashboard_url` + plan
- Starter → UpgradePrompt
- No URL → "OpenClaw dashboard not configured yet" message
- Pro → full-height iframe (`h-[calc(100vh-4rem)]`)
- Header bar: "OpenClaw Dashboard" + "Open in new tab" button (ExternalLink icon)

---

### Task 6: Enhanced Agent Management (Full CRUD)

**Modify `src/components/dashboard/agent-manager.tsx`:**
- Add "Create Agent" button in header (Pro only)
- Add "Edit" pencil icon + "Delete" trash icon on each agent card (Pro only)
- Starter users: no change (deploy/undeploy only)

**New `src/components/dashboard/agent-form-dialog.tsx`:**
- Sheet/Dialog component for create + edit
- Fields:
  - Name (required, text input)
  - Description (optional, textarea)
  - Category (optional, select: general/support/sales/research/custom)
  - System Prompt (required for custom agents, large textarea)
  - Additional config (optional, JSON editor or key-value pairs)
- Create mode: POST to `/api/agents/create`
- Edit mode: PUT to `/api/agents/[id]/update`

**New API routes:**

`POST /api/agents/create`:
- Auth + plan check (pro/enterprise)
- Validate: name required, system prompt required
- Insert into `agents` with `is_premium: false` (custom agent)
- Insert into `user_agents` linking to user
- Optionally auto-deploy (if user checks "Deploy immediately")
- Log `agent_created` activity

`PUT /api/agents/[id]/update`:
- Auth + ownership + plan check
- Update agent fields
- If deployed: re-deploy via SSH (write updated config files, restart)
- Log `config_changed` activity

`DELETE /api/agents/[id]`:
- Auth + ownership + plan check
- If deployed: undeploy from VPS first
- Delete from `user_agents` and `agents`
- Log `agent_deleted` activity

`GET /api/agents/[id]/health`:
- Auth + ownership
- SSH check: agent dir exists + process running
- Return status

---

### Task 7: Priority Support

**DB:** `ALTER TABLE support_tickets ADD COLUMN is_priority BOOLEAN DEFAULT false`

**Modify `src/app/api/tickets/create/route.ts`:**
- After auth, query subscription plan
- If pro/enterprise: set `is_priority: true` on insert

**Modify `src/components/dashboard/ticket-list.tsx`:**
- Show orange "Priority" badge next to status badge for priority tickets

**Modify `src/components/dashboard/ticket-thread.tsx`:**
- Show "Priority Support" banner at top of thread for priority tickets

---

## Files Summary

### New Files (17)
| File | Purpose |
|------|---------|
| `src/components/dashboard/upgrade-prompt.tsx` | Starter → Pro upgrade prompt |
| `src/app/dashboard/chat/page.tsx` | Chat page |
| `src/components/dashboard/agent-chat.tsx` | Split-panel chat UI |
| `src/lib/openclaw-api.ts` | HTTP client for OpenClaw |
| `src/app/api/chat/send/route.ts` | Send message to agent |
| `src/app/api/chat/conversations/route.ts` | List conversations |
| `src/app/api/chat/conversations/[agent_id]/route.ts` | Get conversation messages |
| `src/app/dashboard/monitoring/page.tsx` | Monitoring page |
| `src/components/dashboard/agent-monitoring.tsx` | Status grid + activity feed + logs |
| `src/app/api/agents/monitoring/route.ts` | All agents health |
| `src/app/api/agents/events/route.ts` | Activity feed events |
| `src/app/api/agents/[id]/logs/route.ts` | Agent logs via SSH |
| `src/app/dashboard/openclaw/page.tsx` | Embedded OpenClaw iframe |
| `src/components/dashboard/agent-form-dialog.tsx` | Create/edit agent dialog |
| `src/app/api/agents/create/route.ts` | Create custom agent |
| `src/app/api/agents/[id]/route.ts` | Update/delete agent |
| `src/app/api/agents/[id]/health/route.ts` | Agent health check |

### Modified Files (12)
| File | Changes |
|------|---------|
| `src/components/dashboard/app-sidebar.tsx` | +Chat, +Monitoring, +OpenClaw (Pro) |
| `src/app/dashboard/layout.tsx` | Pass plan to sidebar |
| `src/middleware.ts` | Add new paths |
| `src/components/dashboard/agent-manager.tsx` | Create/Edit/Delete for Pro |
| `src/lib/ssh.ts` | +getAgentHealth(), +getAgentLogs() |
| `src/app/api/tickets/create/route.ts` | Auto-set priority |
| `src/app/api/agents/deploy/route.ts` | Log activity |
| `src/app/api/agents/undeploy/route.ts` | Log activity |
| `src/app/api/models/change/route.ts` | Log activity |
| `src/app/api/channels/connect/route.ts` | Log activity |
| `src/components/dashboard/ticket-list.tsx` | Priority badge |
| `src/components/dashboard/ticket-thread.tsx` | Priority banner |

### SQL (4 new tables/columns)
```sql
-- 1. Chat conversations
CREATE TABLE chat_conversations (...);
-- 2. Chat messages
CREATE TABLE chat_messages (...);
-- 3. Activities (Mission Control-inspired)
CREATE TABLE activities (...);
-- 4. Priority support
ALTER TABLE support_tickets ADD COLUMN is_priority BOOLEAN DEFAULT false;
```
+ RLS policies for all + mock data

## Verification
After each task: `next build` → zero errors → user tests → approve → next.
