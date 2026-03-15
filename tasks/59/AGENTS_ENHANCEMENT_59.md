# Agents Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 4
**Total features:** 8
**Last updated:** 2026-03-15

---

## CONTEXT: Current Agents Page

**Files:**
- `src/app/dashboard/agents/page.tsx` — server component, fetches user agents + subscription + VPS status
- `src/components/dashboard/agent-manager.tsx` — client component with agent cards, deploy/undeploy
- `src/app/api/agents/deploy/route.ts` — deploy agent via SSH
- `src/app/api/agents/undeploy/route.ts` — undeploy agent via SSH
- `src/app/api/agents/config/route.ts` — save/push agent config

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ My Agents                                             │
│ Manage your deployed AI agents                        │
│ ⚠️ VPS is not running (if applicable)                 │
├──────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │Support   │ │Research  │ │Writer    │              │
│ │Bot       │ │Bot       │ │Bot       │              │
│ │Category  │ │Category  │ │Category  │              │
│ │Deployed ✅│ │Not dep ☐ │ │Deployed ✅│              │
│ │[Undeploy]│ │[Deploy]  │ │[Undeploy]│              │
│ └──────────┘ └──────────┘ └──────────┘              │
└──────────────────────────────────────────────────────┘
```

**Empty state:** "No agents yet. Browse the Agent Store" → link to `/store`

---

## 4.1 AGENT HEALTH STATUS

### What it is
Show whether each deployed agent is actually working — not just "deployed" (files on disk) but "healthy" (responding to messages, no errors).

### Current state
Only two states: "Deployed" (green badge) or "Not deployed" (gray). A deployed agent could be crashed, misconfigured, or not responding — user has no idea.

### What to build

**Health check via VPS:**

```typescript
// src/lib/agent-health.ts

export interface AgentHealth {
  status: "healthy" | "degraded" | "error" | "unknown";
  message: string;
  lastActivity?: string;     // timestamp of last message handled
  messagesLast24h?: number;
  avgResponseTime?: number;  // ms
}

export async function checkAgentHealth(
  vpsIp: string,
  agentName: string,
  sshCreds: VPSCredentials
): Promise<AgentHealth> {
  try {
    const ssh = await connect(sshCreds);

    try {
      // Check 1: Is the agent's directory present on VPS?
      const dirCheck = await ssh.execCommand(
        `ls -d /opt/openclaw/data/agents/${sanitizeAgentName(agentName)} 2>/dev/null || echo "NOT_FOUND"`
      );

      if (dirCheck.stdout.trim() === "NOT_FOUND") {
        return { status: "error", message: "Agent files not found on VPS" };
      }

      // Check 2: Is OpenClaw gateway responding?
      const healthCheck = await ssh.execCommand(
        `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/health 2>/dev/null || echo "000"`
      );

      const statusCode = parseInt(healthCheck.stdout.trim());
      if (statusCode !== 200) {
        return { status: "error", message: "OpenClaw gateway is not responding" };
      }

      // Check 3: Can we reach this specific agent?
      const agentCheck = await ssh.execCommand(
        `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/v1/chat/completions -X POST -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"ping"}],"model":"${sanitizeAgentName(agentName)}","max_tokens":1}' 2>/dev/null || echo "000"`
      );

      const agentStatus = parseInt(agentCheck.stdout.trim());
      if (agentStatus >= 200 && agentStatus < 400) {
        return { status: "healthy", message: "Agent is responding" };
      } else if (agentStatus >= 400 && agentStatus < 500) {
        return { status: "degraded", message: "Agent is responding but may have configuration issues" };
      } else {
        return { status: "error", message: "Agent is not responding to requests" };
      }
    } finally {
      ssh.dispose();
    }
  } catch {
    return { status: "unknown", message: "Unable to check agent health" };
  }
}
```

**API endpoint:**

```typescript
// GET /api/agents/[id]/health
// Auth + verify agent belongs to user + verify VPS is running
// Calls checkAgentHealth() via SSH
// Returns: { health: { status, message, lastActivity?, messagesLast24h?, avgResponseTime? } }
// Rate limit: 10/min (SSH calls are heavy)
```

**UI — health indicator on each agent card:**

Replace the simple "Deployed ✅" badge with:

```typescript
// ┌──────────────────────────┐
// │ Support Bot              │
// │ Category: Support        │
// │ 🟢 Healthy — Responding  │    ← or 🟡 Degraded, 🔴 Error
// │ 245 messages today       │
// │ [Undeploy] [Test] [⋮]   │
// └──────────────────────────┘

const HEALTH_BADGES = {
  healthy: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle, label: "Healthy" },
  degraded: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: AlertTriangle, label: "Degraded" },
  error: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle, label: "Error" },
  unknown: { color: "bg-muted text-muted-foreground border-border", icon: HelpCircle, label: "Unknown" },
  not_deployed: { color: "bg-muted text-muted-foreground border-border", icon: Circle, label: "Not Deployed" },
};
```

**Polling:** Check health for all deployed agents on page load. Show cached result, allow manual "Refresh Health" button. Don't poll automatically (too many SSH calls).

### Files to create
- `src/lib/agent-health.ts`
- `src/app/api/agents/[id]/health/route.ts`

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — health badges on cards

---

## 4.2 QUICK TEST / PREVIEW

### What it is
"Send a test message" button right on the agent card — test the agent without navigating to the Chat page.

### What to build

**Inline test dialog:**

When user clicks "Test" on an agent card, open a small dialog:

```typescript
// ┌──────────────────────────────────────────────┐
// │ Test: Support Bot                     [Close] │
// ├──────────────────────────────────────────────┤
// │                                               │
// │ 👤 Hello, can you help me?                    │
// │                                               │
// │ 🤖 Of course! I'm here to help. What do     │
// │    you need assistance with?                  │
// │                                               │
// │ ┌─────────────────────────────────┐ [Send]   │
// │ │ Type a test message...          │           │
// │ └─────────────────────────────────┘           │
// └──────────────────────────────────────────────┘

interface QuickTestDialogProps {
  agentName: string;
  agentSlug: string;
  onClose: () => void;
}

export function QuickTestDialog({ agentName, agentSlug, onClose }: QuickTestDialogProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendTestMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          agent_id: agentSlug,
          // Use a temporary session — don't pollute real conversations
          session_id: `test_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (data.response) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: No response received." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to send message." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Test: {agentName}</DialogTitle>
          <DialogDescription>Send a test message to verify the agent is working.</DialogDescription>
        </DialogHeader>

        {/* Messages */}
        <div className="h-60 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-lg">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Send a message to test this agent
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === "user" ? "text-right" : ""}`}>
              <span className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}>
                {msg.content}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-sm">
              <span className="inline-block px-3 py-2 rounded-lg bg-card border border-border">
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Thinking...
              </span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
            placeholder="Type a test message..."
            disabled={loading}
          />
          <Button onClick={sendTestMessage} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Test messages use your active plan. Max 5 test messages per session.
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

**Max 5 messages per test session** to prevent abuse (test, not full conversation). After 5, show "Test complete. Go to Chat for full conversations."

**"Test" button on each DEPLOYED agent card.** Not shown for undeployed agents.

### Files to create
- `src/components/dashboard/quick-test-dialog.tsx`

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — add "Test" button + dialog

---

## 4.3 AGENT CONFIGURATION VIEW

### What it is
See what an agent is configured to do — its personality (SOUL.md), tools, model, identity. Read-only for Starter users. Editable for Pro users (via Agent Builder).

### What to build

**Fetch config from VPS:**

Already exists: `GET /api/agents/[id]/config` (built by 129 agent for the Agent Builder). This reads the agent's config files from the VPS via SSH and returns them as `Record<string, string>`.

**UI — "View Config" button on agent cards → opens dialog/sheet:**

```
┌──────────────────────────────────────────────────────────┐
│ Configuration: Support Bot                        [Close] │
├──────────────────────────────────────────────────────────┤
│ [SOUL.md] [identity.md] [TOOLS.md] [config.json]        │
├──────────────────────────────────────────────────────────┤
│ # Support Bot                                            │
│                                                          │
│ You are a friendly customer support agent for our        │
│ company. You help customers with:                        │
│ - Order inquiries and tracking                           │
│ - Refund and return requests                             │
│ - Product information and recommendations                │
│ - Technical troubleshooting                              │
│                                                          │
│ Always be polite, patient, and helpful. If you           │
│ can't resolve an issue, offer to create a support        │
│ ticket for follow-up.                                    │
│                                                          │
│ ─── Starter Plan ────────────────────────────────        │
│ This config is read-only. Upgrade to Pro for the         │
│ Agent Builder to create and customize agents.            │
│ [Upgrade to Pro →]                                       │
└──────────────────────────────────────────────────────────┘
```

**Tabs:** One tab per config file. Read-only textareas with monospace font. Markdown preview for SOUL.md.

**Starter:** Read-only view + upgrade CTA for Agent Builder
**Pro:** "Edit in Agent Builder" button → navigates to `/agent-builder?edit={agentId}`

```typescript
// In agent-manager.tsx:
const [viewingConfig, setViewingConfig] = useState<string | null>(null);
const [configFiles, setConfigFiles] = useState<Record<string, string> | null>(null);

async function loadConfig(agentId: string) {
  const res = await fetch(`/api/agents/${agentId}/config`);
  if (res.ok) {
    const data = await res.json();
    setConfigFiles(data.config_files);
    setViewingConfig(agentId);
  } else {
    toast.error("Failed to load agent configuration");
  }
}

// Dialog shows tabs for each file in configFiles
// Each tab: read-only <textarea> or <pre> with the file content
// SOUL.md tab: optional markdown preview toggle
```

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — add "View Config" button + config dialog

**Note:** The `GET /api/agents/[id]/config` endpoint should already exist (built by 129 agent for Agent Builder). If it doesn't, create it:

```typescript
// GET /api/agents/[id]/config
// Auth + verify agent belongs to user
// SSH into VPS → read files from agent directory
// Return: { config_files: { "SOUL.md": "...", "identity.md": "...", ... } }
```

---

## 4.4 PER-AGENT STATS

### What it is
Show how each agent is performing — messages handled, avg response time, last active.

### What to build

**Data source:** From chat analytics. Each message is tagged with the agent name. Aggregate per agent.

```typescript
// In agents page, alongside fetching agents, fetch per-agent stats:
// If analytics are in Supabase (for now):
const { data: agentStats } = await supabase.rpc("get_per_agent_stats", {
  p_user_id: user.id,
  p_days: 7,
});

// Returns:
// [
//   { agent_name: "support-bot", messages: 245, avg_response_ms: 1800, last_active: "2026-03-15T10:30:00Z" },
//   { agent_name: "research-bot", messages: 89, avg_response_ms: 2200, last_active: "2026-03-15T09:15:00Z" },
// ]
```

**RPC function:**
```sql
CREATE OR REPLACE FUNCTION get_per_agent_stats(p_user_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (
  agent_name TEXT,
  messages BIGINT,
  avg_response_ms INT,
  last_active TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.agent_name,
    COUNT(*)::BIGINT AS messages,
    COALESCE(AVG(a.response_time_ms)::INT, 0) AS avg_response_ms,
    MAX(a.created_at) AS last_active
  FROM agent_analytics a
  WHERE a.user_id = p_user_id
    AND a.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY a.agent_name;
END;
$$;
```

**UI — stats on each agent card:**

```
┌──────────────────────────────────┐
│ Support Bot                      │
│ 🟢 Healthy                       │
│ 245 messages · 1.8s avg · 2h ago │
│ [Test] [Config] [Undeploy] [⋮]  │
└──────────────────────────────────┘
```

One line of stats: message count (7d), avg response time, last active relative time.

If no stats (new agent, just deployed): "No messages yet"

### Files to modify
- `src/app/dashboard/agents/page.tsx` — fetch per-agent stats
- `src/components/dashboard/agent-manager.tsx` — display stats on cards
- Migration for RPC function

---

## 4.5 AGENT LOGS (Last 10 Messages)

### What it is
Quick view of the last 10 messages an agent handled. "What did this agent say to the last customer?"

### What to build

**"View Logs" in the agent card "more" menu → opens dialog:**

```
┌──────────────────────────────────────────────────────────┐
│ Recent Messages: Support Bot                      [Close] │
├──────────────────────────────────────────────────────────┤
│ 10:30 AM · WhatsApp                                      │
│ 👤 Can I return my order #12345?                         │
│ 🤖 Of course! Our return policy allows returns within    │
│    30 days of purchase. I can help you start a return.   │
│ ────────────────────────────────────────────────────────── │
│ 10:15 AM · Telegram                                      │
│ 👤 What's your shipping time?                            │
│ 🤖 Standard shipping takes 5-7 business days. Express    │
│    shipping is available for 2-3 business days delivery. │
│ ────────────────────────────────────────────────────────── │
│ 9:45 AM · Discord                                         │
│ 👤 Hi, is anyone there?                                  │
│ 🤖 Hi there! I'm here to help. What can I do for you?   │
│ ────────────────────────────────────────────────────────── │
│ ... (showing last 10 conversations)                       │
│                                                           │
│ [View Full Chat History →]  ← links to /chat             │
└──────────────────────────────────────────────────────────┘
```

**Data source:** From chat conversations/messages. Filter by agent name.

```typescript
// GET /api/agents/[id]/recent-messages?limit=10
// Auth + verify agent belongs to user
// Query recent chat messages for this agent
// Return: { messages: [{ user_message, agent_response, channel, timestamp }] }
```

**If chat data is on VPS (per architecture):** Proxy to OpenClaw API or VPS Data API. If still in Supabase: query `chat_messages` + `chat_conversations` filtered by agent.

### Files to create
- `src/app/api/agents/[id]/recent-messages/route.ts`

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — add "View Logs" menu item + dialog

---

## 4.6 BULK ACTIONS

### What it is
Deploy all, undeploy all, or restart all agents at once. Useful when managing 5+ agents.

### What to build

**Toolbar actions when agents exist:**

```
┌──────────────────────────────────────────────────────┐
│ My Agents (5)                   [Deploy All ▼] [⋮]   │
│                                                       │
│ Deploy All ▼                                          │
│ ├── Deploy All Undeployed                             │
│ ├── Undeploy All                                      │
│ └── Restart All Deployed (undeploy + redeploy)        │
└──────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
async function bulkAction(action: "deploy_all" | "undeploy_all" | "restart_all") {
  const targets = agents.filter(a => {
    if (action === "deploy_all") return !a.deployed;
    if (action === "undeploy_all") return a.deployed;
    if (action === "restart_all") return a.deployed;
    return false;
  });

  if (targets.length === 0) {
    toast.info("No agents to process");
    return;
  }

  // Confirmation dialog
  const confirmed = await confirmDialog({
    title: `${action === "deploy_all" ? "Deploy" : action === "undeploy_all" ? "Undeploy" : "Restart"} ${targets.length} agents?`,
    description: `This will ${action.replace("_all", "")} ${targets.length} agents. This may take a moment.`,
  });

  if (!confirmed) return;

  // Process sequentially (SSH can't handle too many parallel connections)
  setProcessing(true);
  let success = 0;
  let failed = 0;

  for (const agent of targets) {
    try {
      if (action === "restart_all") {
        await fetch(`/api/agents/undeploy`, { method: "POST", body: JSON.stringify({ agent_id: agent.agent_id }) });
        await new Promise(r => setTimeout(r, 1000)); // brief pause
        await fetch(`/api/agents/deploy`, { method: "POST", body: JSON.stringify({ agent_id: agent.agent_id }) });
      } else {
        const endpoint = action === "deploy_all" ? "/api/agents/deploy" : "/api/agents/undeploy";
        await fetch(endpoint, { method: "POST", body: JSON.stringify({ agent_id: agent.agent_id }) });
      }
      success++;
    } catch {
      failed++;
    }
  }

  setProcessing(false);
  toast.success(`${success} agents processed${failed > 0 ? `, ${failed} failed` : ""}`);
  router.refresh();
}
```

**Progress indicator:** Show "Processing 3/5..." during bulk operations.

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — add bulk action dropdown + processing logic

---

## 4.7 AGENT SORTING / FILTERING

### What it is
Sort and filter agents when the user has many. By status, category, activity.

### What to build

**Filter bar above agent cards:**

```
[Status ▼: All | Deployed | Not Deployed]  [Category ▼: All | Support | Sales | ...]  [Sort ▼: Name | Recent | Messages]
```

```typescript
const [statusFilter, setStatusFilter] = useState<"all" | "deployed" | "not_deployed">("all");
const [categoryFilter, setCategoryFilter] = useState<string>("all");
const [sortBy, setSortBy] = useState<"name" | "recent" | "messages">("name");

const filteredAgents = useMemo(() => {
  let result = [...agents];

  // Status filter
  if (statusFilter === "deployed") result = result.filter(a => a.deployed);
  if (statusFilter === "not_deployed") result = result.filter(a => !a.deployed);

  // Category filter
  if (categoryFilter !== "all") result = result.filter(a => a.category === categoryFilter);

  // Sort
  switch (sortBy) {
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "recent":
      result.sort((a, b) => {
        const aTime = agentStats[a.name]?.last_active || "1970-01-01";
        const bTime = agentStats[b.name]?.last_active || "1970-01-01";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      break;
    case "messages":
      result.sort((a, b) => {
        const aCount = agentStats[a.name]?.messages || 0;
        const bCount = agentStats[b.name]?.messages || 0;
        return bCount - aCount;
      });
      break;
  }

  return result;
}, [agents, statusFilter, categoryFilter, sortBy, agentStats]);

// Get unique categories for filter dropdown
const categories = [...new Set(agents.map(a => a.category).filter(Boolean))];
```

**Show result count:** "Showing 3 of 5 agents" when filtered.

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — add filter bar + sorting logic

---

## 4.8 AGENT GROUPING BY CATEGORY

### What it is
Visually group agent cards by category: "Support Agents", "Sales Agents", "Research Agents".

### What to build

**When category filter is "All", group cards under category headers:**

```
Support (2 agents)
┌──────────┐ ┌──────────┐
│ Support  │ │ FAQ      │
│ Bot      │ │ Bot      │
└──────────┘ └──────────┘

Research (1 agent)
┌──────────┐
│ Research │
│ Bot      │
└──────────┘

Uncategorized (1 agent)
┌──────────┐
│ Custom   │
│ Agent    │
└──────────┘
```

**Implementation:**

```typescript
const groupedAgents = useMemo(() => {
  if (categoryFilter !== "all") return null; // don't group when filtered

  const groups: Record<string, typeof filteredAgents> = {};
  for (const agent of filteredAgents) {
    const cat = agent.category || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(agent);
  }
  return groups;
}, [filteredAgents, categoryFilter]);

// Render:
{groupedAgents ? (
  Object.entries(groupedAgents).map(([category, agents]) => (
    <div key={category} className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {category} ({agents.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => <AgentCard key={agent.id} ... />)}
      </div>
    </div>
  ))
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredAgents.map(agent => <AgentCard key={agent.id} ... />)}
  </div>
)}
```

**Toggle:** Add a "Group by category" toggle button. Default on. Off = flat grid (current behavior).

### Files to modify
- `src/components/dashboard/agent-manager.tsx` — add grouping logic + toggle

---

## BUILD ORDER

```
4.4 Per-Agent Stats (FIRST — data needed by other features like sorting/health)
  ↓
4.1 Agent Health Status (uses SSH, high value)
  ↓
4.2 Quick Test / Preview (high value, independent)
  ↓
4.3 Agent Configuration View (uses existing /config API)
  ↓
4.7 Agent Sorting / Filtering (uses stats from 4.4)
  ↓
4.8 Agent Grouping by Category (extends 4.7)
  ↓
4.5 Agent Logs (needs chat data access)
  ↓
4.6 Bulk Actions (independent, nice-to-have)
```
