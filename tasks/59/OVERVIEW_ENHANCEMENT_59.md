# Overview Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 1
**Total features:** 9
**Last updated:** 2026-03-15

---

## CONTEXT: Current Overview Page

**File:** `src/app/dashboard/page.tsx` (server component, ~277 lines)

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ Overview                                              │
│ Your ClawHQ dashboard at a glance.                    │
├──────────┬──────────┬──────────┬──────────────────────┤
│ VPS      │ Current  │ AI Model │ Context              │
│ Status   │ Plan     │          │ Limit                │
│ 🟢 Run   │ Starter  │ Kimi K2.5│ 128K                 │
├──────────┴──────────┴──────────┴──────────────────────┤
├──────────┬──────────┬──────────────────────────────────┤
│ Channels │ Agents   │ Open                             │
│ Connected│ Deployed │ Tickets                          │
│ 3        │ 2        │ 1                                │
├──────────┴──────────┴──────────────────────────────────┤
│ Quick Actions                                         │
│ [Open OpenClaw] [Manage VPS] [Raise Ticket]           │
└──────────────────────────────────────────────────────┘
```

**3 states handled:**
1. No subscription → "Get Started" CTA → `/billing`
2. Subscription but no VPS → "Setting Up" with pulse animation
3. Active VPS → full dashboard above

**Data fetching:** Server component, `Promise.all` fetches: subscription, VPS, model config, channel count, agent count, ticket count.

---

## 1.1 ONBOARDING CHECKLIST

### What it is
A step-by-step checklist that guides new users through their first actions. Appears on the Overview page until all steps are completed or the user dismisses it.

### Why it matters
New users log in, see the dashboard, and think "now what?" The checklist tells them exactly what to do next. Industry data: Notion's checklist → 60% onboarding completion, 40% retention bump at 30 days.

### Database

```sql
CREATE TABLE user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_dismissed BOOLEAN DEFAULT false,
  steps_completed JSONB DEFAULT '{}',
  -- steps_completed shape:
  -- {
  --   "vps_ready": true,           -- auto-set when VPS provisions
  --   "channel_connected": false,   -- auto-set when first channel connects
  --   "agent_deployed": false,      -- auto-set when first agent deploys
  --   "first_message_sent": false,  -- auto-set when first chat message sent
  --   "store_visited": false,       -- auto-set when store page visited
  -- }
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ -- set when all steps done
);
```

### Auto-tracking step completion

Each step is auto-completed when the relevant action happens. No manual checkbox clicking needed.

**In relevant API routes:**

```typescript
// Helper function
async function completeOnboardingStep(userId: string, step: string): Promise<void> {
  const admin = createAdminClient();

  // Get current steps
  const { data: onboarding } = await admin
    .from("user_onboarding")
    .select("steps_completed, guide_dismissed")
    .eq("user_id", userId)
    .single();

  if (!onboarding || onboarding.guide_dismissed) return; // dismissed, skip

  const steps = onboarding.steps_completed || {};
  if (steps[step]) return; // already completed

  steps[step] = true;

  // Check if all steps done
  const allDone = ["vps_ready", "channel_connected", "agent_deployed", "first_message_sent", "store_visited"]
    .every(s => steps[s]);

  await admin.from("user_onboarding").update({
    steps_completed: steps,
    ...(allDone ? { completed_at: new Date().toISOString() } : {}),
  }).eq("user_id", userId);
}
```

**Where to call it:**
- `provision-v3.ts` → after successful provisioning: `completeOnboardingStep(userId, "vps_ready")`
- `channels/connect/route.ts` → after channel connect: `completeOnboardingStep(userId, "channel_connected")`
- `agents/deploy/route.ts` → after agent deploy: `completeOnboardingStep(userId, "agent_deployed")`
- `chat/send/route.ts` → after first message: `completeOnboardingStep(userId, "first_message_sent")`
- `store/page.tsx` → on page load: `completeOnboardingStep(userId, "store_visited")`

**Create onboarding row on registration:**

In the register flow or after first login, insert a row:
```typescript
await admin.from("user_onboarding").upsert({
  user_id: userId,
  guide_dismissed: false,
  steps_completed: {},
});
```

### UI Component

```typescript
// src/components/dashboard/onboarding-checklist.tsx

interface OnboardingChecklistProps {
  steps: Record<string, boolean>;
  onDismiss: () => void;
}

// Layout:
// ┌──────────────────────────────────────────────────────────┐
// │ 🚀 Get Started with ClawHQ          [Dismiss ×]         │
// │ Complete these steps to get your AI agents up and running │
// │                                                          │
// │ ████████████░░░░░░░░░ 3/5 complete                       │
// │                                                          │
// │ ✅ VPS provisioned and running                            │
// │ ✅ Connected your first channel (Telegram)                │
// │ ✅ Deployed your first agent (Support Bot)                │
// │ ☐ Send your first message → [Go to Chat]                 │
// │ ☐ Explore the Agent Store → [Browse Store]                │
// └──────────────────────────────────────────────────────────┘

const ONBOARDING_STEPS = [
  {
    key: "vps_ready",
    title: "VPS provisioned and running",
    description: "Your dedicated server is set up",
    icon: Server,
    link: null, // auto-completed, no action needed
  },
  {
    key: "channel_connected",
    title: "Connect your first channel",
    description: "WhatsApp, Telegram, Discord, or any messaging platform",
    icon: MessageSquare,
    link: "/channels",
    cta: "Connect Channel",
  },
  {
    key: "agent_deployed",
    title: "Deploy your first agent",
    description: "Get an AI agent running on your channels",
    icon: Bot,
    link: "/store",
    cta: "Browse Agents",
  },
  {
    key: "first_message_sent",
    title: "Send your first message",
    description: "Chat with your deployed agent",
    icon: Send,
    link: "/chat",
    cta: "Go to Chat",
  },
  {
    key: "store_visited",
    title: "Explore the Agent Store",
    description: "Discover pre-built agents for your use case",
    icon: ShoppingBag,
    link: "/store",
    cta: "Browse Store",
  },
];

export function OnboardingChecklist({ steps, onDismiss }: OnboardingChecklistProps) {
  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = ONBOARDING_STEPS.length;
  const allDone = completedCount === totalSteps;

  if (allDone) return null; // auto-hide when complete

  return (
    <Card className="border-primary/30 mb-6">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Get Started with ClawHQ
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Complete these steps to get your AI agents up and running
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{completedCount}/{totalSteps} complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step) => {
            const completed = steps[step.key];
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {completed ? <Check className="h-3 w-3" /> : <step.icon className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : ""}`}>
                    {step.title}
                  </p>
                  {!completed && step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
                {!completed && step.link && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={step.link}>{step.cta}</Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### API endpoints

```typescript
// GET /api/onboarding
// Auth required
// Returns: { steps_completed: {...}, guide_dismissed: boolean }

// POST /api/onboarding/dismiss
// Auth required
// Sets guide_dismissed = true
// Returns: { success: true }

// POST /api/onboarding/complete-step
// Body: { step: "channel_connected" }
// Auth required (also called server-side from other routes)
// Returns: { steps_completed: {...} }
```

### Integration in Overview page

In `src/app/dashboard/page.tsx`:

```typescript
// Fetch onboarding status alongside other data
const [subRes, vpsRes, modelRes, ..., onboardingRes] = await Promise.all([
  // ... existing queries ...
  supabase.from("user_onboarding").select("*").eq("user_id", user.id).single(),
]);

const onboarding = onboardingRes.data;

// In the render, BEFORE the stat cards:
{onboarding && !onboarding.guide_dismissed && !onboarding.completed_at && (
  <OnboardingChecklist
    steps={onboarding.steps_completed || {}}
    onDismiss={async () => {
      await fetch("/api/onboarding/dismiss", { method: "POST" });
      router.refresh();
    }}
  />
)}
```

### Files to create
- `src/components/dashboard/onboarding-checklist.tsx`
- `src/app/api/onboarding/route.ts` (GET)
- `src/app/api/onboarding/dismiss/route.ts` (POST)
- `src/app/api/onboarding/complete-step/route.ts` (POST)
- Migration for `user_onboarding` table

### Files to modify
- `src/app/dashboard/page.tsx` — fetch + render checklist
- `src/app/api/channels/connect/route.ts` — call completeOnboardingStep
- `src/app/api/agents/deploy/route.ts` — call completeOnboardingStep
- `src/app/api/chat/send/route.ts` — call completeOnboardingStep
- `src/lib/provision-v3.ts` — call completeOnboardingStep after provisioning
- Register flow — create onboarding row

### Testing
1. New user registers → onboarding checklist appears on overview
2. VPS provisions → "VPS provisioned" step auto-checks
3. Connect Telegram → "Connect channel" step auto-checks
4. Deploy agent → step auto-checks
5. Send chat message → step auto-checks
6. Visit store → step auto-checks
7. All done → checklist auto-hides
8. Click "Dismiss" before completion → checklist hides permanently
9. Progress bar animates as steps complete

---

## 1.2 HEALTH STATUS INDICATOR

### What it is
Replace the simple "Running" / "Stopped" VPS status badge with a health assessment that tells users if their VPS is actually healthy.

### Current state
VPS Status card shows: badge with "Running" (green), "Stopped" (red), "Provisioning" (yellow). No indication of resource health.

### What to build

**Health calculation (server-side):**

```typescript
// In src/app/dashboard/page.tsx, add a health check alongside VPS status:

interface VPSHealth {
  status: "healthy" | "warning" | "critical" | "offline" | "unknown";
  message: string;
  details?: { cpu: number; ram: number; disk: number };
}

async function getVPSHealth(vps: any): Promise<VPSHealth> {
  if (!vps || vps.status !== "running") {
    return { status: "offline", message: "VPS is not running" };
  }

  try {
    // Quick health check — fetch current CPU/RAM/disk
    // Reuse the monitoring API internally
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://app.clawhq.tech"}/api/vps/monitoring`,
      {
        headers: { Cookie: request.headers.get("cookie") || "" },
      }
    );

    if (!response.ok) return { status: "unknown", message: "Unable to check health" };

    const data = await response.json();
    const cpu = data.cpu_percent || 0;
    const ram = data.ram_percent || 0;
    const disk = data.disk_percent || 0;

    // Determine health
    const maxUsage = Math.max(cpu, ram, disk);

    if (maxUsage >= 90) {
      const resource = cpu >= 90 ? "CPU" : ram >= 90 ? "RAM" : "Disk";
      return {
        status: "critical",
        message: `${resource} at ${Math.round(maxUsage)}%`,
        details: { cpu, ram, disk },
      };
    }

    if (maxUsage >= 75) {
      const resource = cpu >= 75 ? "CPU" : ram >= 75 ? "RAM" : "Disk";
      return {
        status: "warning",
        message: `${resource} at ${Math.round(maxUsage)}%`,
        details: { cpu, ram, disk },
      };
    }

    return {
      status: "healthy",
      message: "All systems normal",
      details: { cpu, ram, disk },
    };
  } catch {
    return { status: "unknown", message: "Unable to check health" };
  }
}
```

**Alternative approach (simpler — use SSH directly in the server component):**

Since the Overview page is a server component, call the SSH functions directly instead of making an internal API call:

```typescript
import { getVPSStats } from "@/lib/ssh";

// In OverviewPage():
let health: VPSHealth = { status: "unknown", message: "Checking..." };
if (vps?.status === "running") {
  try {
    const stats = await getVPSStats({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: vps.ssh_password,
      port: vps.ssh_port,
    });
    const cpu = stats.cpu_percent || 0;
    const ram = (stats.ram_used / stats.ram_total) * 100 || 0;
    const disk = (stats.disk_used / stats.disk_total) * 100 || 0;
    // ... same health calculation as above
  } catch {
    health = { status: "unknown", message: "Unable to check health" };
  }
}
```

**Note:** This adds ~1-2 seconds to the overview page load (SSH call). To mitigate:
- Cache the health result for 5 minutes (use a simple in-memory cache or Supabase)
- Show a skeleton for the health badge while loading
- Or make it a client-side fetch after initial render

**UI — Health badge on VPS Status card:**

```
// Replace current:
VPS Status
🟢 Running

// With:
VPS Status
🟢 Healthy — All systems normal
   CPU: 23%  RAM: 45%  Disk: 34%

// Or warning:
VPS Status
🟡 Warning — RAM at 78%
   CPU: 23%  RAM: 78%  Disk: 34%

// Or critical:
VPS Status
🔴 Critical — CPU at 92%
   CPU: 92%  RAM: 45%  Disk: 34%
```

Health badge config:
```typescript
const HEALTH_CONFIG = {
  healthy: { label: "Healthy", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  warning: { label: "Warning", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: AlertTriangle },
  critical: { label: "Critical", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertOctagon },
  offline: { label: "Offline", className: "bg-muted text-muted-foreground border-border", icon: Power },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-border", icon: HelpCircle },
};
```

Mini resource bars (3 tiny horizontal bars under the badge):
```typescript
<div className="flex gap-2 mt-2 text-xs text-muted-foreground">
  <span>CPU {Math.round(cpu)}%</span>
  <span>RAM {Math.round(ram)}%</span>
  <span>Disk {Math.round(disk)}%</span>
</div>
```

### Files to modify
- `src/app/dashboard/page.tsx` — add health fetch + render enhanced VPS card

### Testing
1. VPS running, low usage → green "Healthy"
2. VPS running, RAM at 80% → yellow "Warning — RAM at 80%"
3. VPS running, CPU at 95% → red "Critical — CPU at 95%"
4. VPS stopped → gray "Offline"
5. SSH fails → gray "Unknown"

---

## 1.3 RECENT ACTIVITY FEED

### What it is
A chronological list of the last 10 actions the user has taken. Makes the dashboard feel alive and gives context about what happened recently.

### What to build

**Aggregate from existing tables — no new table needed:**

```typescript
// src/lib/recent-activity.ts

interface ActivityItem {
  id: string;
  type: "agent_deploy" | "agent_undeploy" | "channel_connect" | "channel_disconnect" |
        "ticket_created" | "ticket_resolved" | "model_change" | "vps_action" | "chat_message";
  title: string;
  description?: string;
  icon: LucideIcon;
  timestamp: string;
  link?: string;
}

export async function getRecentActivity(userId: string, limit: number = 10): Promise<ActivityItem[]> {
  const admin = createAdminClient();

  // Fetch recent items from multiple tables in parallel
  const [agents, channels, tickets, chatActivity] = await Promise.all([
    // Recent agent deploys/undeploys
    admin.from("user_agents")
      .select("agent_id, deployed, deployed_at, agents(name)")
      .eq("user_id", userId)
      .not("deployed_at", "is", null)
      .order("deployed_at", { ascending: false })
      .limit(5),

    // Recent channel connections
    admin.from("channels")
      .select("id, channel_type, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent tickets
    admin.from("support_tickets")
      .select("id, subject, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5),

    // Recent chat conversations (count from today)
    admin.from("chat_conversations")
      .select("id, agent_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const activities: ActivityItem[] = [];

  // Map agent activity
  for (const ua of agents.data || []) {
    const agentName = Array.isArray(ua.agents) ? ua.agents[0]?.name : ua.agents?.name;
    activities.push({
      id: `agent-${ua.agent_id}`,
      type: ua.deployed ? "agent_deploy" : "agent_undeploy",
      title: ua.deployed ? `Deployed "${agentName || "Agent"}"` : `Undeployed "${agentName || "Agent"}"`,
      icon: ua.deployed ? Rocket : Power,
      timestamp: ua.deployed_at,
      link: "/agents",
    });
  }

  // Map channel activity
  for (const ch of channels.data || []) {
    activities.push({
      id: `channel-${ch.id}`,
      type: ch.status === "connected" ? "channel_connect" : "channel_disconnect",
      title: `${ch.status === "connected" ? "Connected" : "Disconnected"} ${ch.channel_type}`,
      icon: MessageSquare,
      timestamp: ch.created_at,
      link: "/channels",
    });
  }

  // Map ticket activity
  for (const t of tickets.data || []) {
    activities.push({
      id: `ticket-${t.id}`,
      type: t.status === "resolved" ? "ticket_resolved" : "ticket_created",
      title: t.status === "resolved" ? `Resolved: "${t.subject}"` : `Created ticket: "${t.subject}"`,
      icon: Ticket,
      timestamp: t.updated_at || t.created_at,
      link: `/support/${t.id}`,
    });
  }

  // Map chat activity
  for (const c of chatActivity.data || []) {
    activities.push({
      id: `chat-${c.id}`,
      type: "chat_message",
      title: `Chatted with ${c.agent_name || "agent"}`,
      icon: MessageCircle,
      timestamp: c.created_at,
      link: "/chat",
    });
  }

  // Sort by timestamp (most recent first), take top N
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
```

**UI component:**

```typescript
// In overview page, after stat cards:

<Card className="border-border">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
  </CardHeader>
  <CardContent>
    {activities.length === 0 ? (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No recent activity. Start by connecting a channel or deploying an agent.
      </p>
    ) : (
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3">
            <activity.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{activity.title}</p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

### Files to create
- `src/lib/recent-activity.ts`

### Files to modify
- `src/app/dashboard/page.tsx` — fetch + render activity feed

---

## 1.4 QUICK STATS SPARKLINES

### What it is
Tiny 7-day trend lines on the stat cards showing whether numbers are going up or down.

### What to build

Use Recharts `<Area>` in a tiny container (60px wide, 20px tall) with no axes, no labels — just the line shape.

```typescript
// src/components/dashboard/sparkline.tsx

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[]; // 7 values for 7 days
  color?: string;
}

export function Sparkline({ data, color = "hsl(var(--primary))" }: SparklineProps) {
  const chartData = data.map((value, i) => ({ day: i, value }));

  return (
    <div className="w-16 h-5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.1}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Data:** Need 7-day counts for messages, agents, channels. Get from:
- Messages: count from `chat_conversations` grouped by day (or analytics)
- Agents: count from `user_agents` where `deployed = true` (snapshot — may need daily log)
- Channels: count from `channels` where `status = 'connected'`

For simplicity v1: just show the sparkline on the "Channels Connected" and "Agents Deployed" cards using the last 7 days of data. Messages sparkline requires data that may not be easily available for Starter users (no analytics table access).

**Integration in stat cards:**

```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">Channels Connected</CardTitle>
    <MessageSquare className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent className="flex items-end justify-between">
    <p className="text-2xl font-bold">{channelsConnected ?? 0}</p>
    <Sparkline data={channelTrend} /> {/* [0,0,1,1,2,3,3] */}
  </CardContent>
</Card>
```

### Files to create
- `src/components/dashboard/sparkline.tsx`

### Files to modify
- `src/app/dashboard/page.tsx` — fetch 7-day trends + add sparklines to cards

---

## 1.5 GETTING STARTED GUIDE

### What it is
A first-time-only welcome experience for brand new users who just signed up and are seeing the dashboard for the first time.

### What to build

**This overlaps with 1.1 (Onboarding Checklist).** The getting started guide is the FIRST thing they see (a modal or full-page welcome), and the checklist is the persistent tracker that stays on the dashboard.

**Implementation — welcome banner (not modal, less intrusive):**

```typescript
// Shows only when: user has subscription, VPS is provisioning or just ready, and onboarding not dismissed

{onboarding && !onboarding.guide_dismissed && !onboarding.steps_completed?.vps_ready && (
  <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-6">
    <h2 className="text-lg font-semibold mb-2">Welcome to ClawHQ! 🎉</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Your managed OpenClaw instance is being set up. Here's what happens next:
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-sm">1</div>
        <div>
          <p className="text-sm font-medium">We set up your VPS</p>
          <p className="text-xs text-muted-foreground">Usually takes 15-30 minutes</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-mono text-sm">2</div>
        <div>
          <p className="text-sm font-medium">Connect a channel</p>
          <p className="text-xs text-muted-foreground">WhatsApp, Telegram, Discord...</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-mono text-sm">3</div>
        <div>
          <p className="text-sm font-medium">Deploy an AI agent</p>
          <p className="text-xs text-muted-foreground">Start chatting with your users</p>
        </div>
      </div>
    </div>
  </div>
)}
```

**After VPS is ready:** The welcome banner disappears and the onboarding checklist (1.1) takes over with the step-by-step tracker.

### Files to modify
- `src/app/dashboard/page.tsx` — add welcome banner before checklist

---

## 1.6 NOTIFICATION CENTER

### What it is
Bell icon in the sidebar/header with unread notification count. Dropdown shows recent notifications with links to relevant pages.

### Database

```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'ticket_reply', 'agent_error', 'vps_status', 'channel_disconnect', 'system'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- page to navigate to
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON user_notifications(user_id, read);
```

**Create notifications from existing events:**

```typescript
// Helper function — called from relevant routes
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("user_notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
  }).catch(() => {});

  // Keep max 50 notifications per user — delete oldest
  const { data: old } = await admin
    .from("user_notifications")
    .select("id")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: true })
    .range(50, 1000); // everything after 50th

  if (old?.length) {
    await admin.from("user_notifications")
      .delete()
      .in("id", old.map(n => n.id));
  }
}
```

**Where to create notifications:**
- `tickets/[id]/reply/route.ts` → when admin replies: `createNotification({ type: "ticket_reply", title: "New reply on your ticket", link: "/support/[id]" })`
- `agents/deploy/route.ts` → on deploy failure: `createNotification({ type: "agent_error", title: "Agent deploy failed", message: error })`
- `vps/status` → on status change detected: `createNotification({ type: "vps_status", title: "VPS restarted" })`
- `channels/health` → on channel disconnect: `createNotification({ type: "channel_disconnect", title: "Telegram disconnected" })`

**API:**
```typescript
// GET /api/notifications?unread=true
// Returns: { notifications: [...], unread_count: 3 }

// POST /api/notifications/read
// Body: { id: "notification-uuid" } or { all: true }
// Marks as read
```

**UI — Bell icon in sidebar:**

```typescript
// In app-sidebar.tsx, near the user info section:
<div className="relative">
  <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(!notificationsOpen)}>
    <Bell className="h-4 w-4" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </Button>

  {notificationsOpen && (
    <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-medium">Notifications</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
        ) : (
          notifications.map(n => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className={`flex gap-3 p-3 hover:bg-muted/50 border-b border-border/50 ${!n.read ? "bg-primary/5" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <NotificationIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-medium" : ""}`}>{n.title}</p>
                {n.message && <p className="text-xs text-muted-foreground truncate">{n.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(n.created_at)}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </Link>
          ))
        )}
      </div>
    </div>
  )}
</div>
```

**Poll for new notifications:** Every 30 seconds, fetch unread count. Or use Supabase Realtime subscription.

### Files to create
- `src/lib/notifications.ts` — `createNotification()` helper
- `src/app/api/notifications/route.ts` (GET)
- `src/app/api/notifications/read/route.ts` (POST)
- Notification bell component (can be in sidebar or as separate component)

### Files to modify
- `src/components/dashboard/app-sidebar.tsx` — add bell icon
- Ticket reply route — create notification
- Agent deploy route — create notification on failure
- Channel health route — create notification on disconnect

---

## 1.7 SYSTEM ALERTS BANNER

### What it is
Persistent top banner on the overview page showing critical issues that need attention.

### What to build

**Alert detection (server-side in overview page):**

```typescript
interface SystemAlert {
  type: "critical" | "warning" | "info";
  message: string;
  action?: { label: string; href: string };
}

function detectAlerts(vps: any, health: VPSHealth, channelCount: number, agentCount: number): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  // Critical: VPS not running
  if (vps && vps.status === "stopped") {
    alerts.push({
      type: "critical",
      message: "Your VPS is stopped. Your agents and channels are offline.",
      action: { label: "Start VPS", href: "/vps" },
    });
  }

  // Warning: High resource usage
  if (health.status === "critical") {
    alerts.push({
      type: "warning",
      message: `${health.message}. Consider upgrading your plan for more resources.`,
      action: { label: "View Plans", href: "/billing" },
    });
  }

  // Info: No channels
  if (channelCount === 0 && vps?.status === "running") {
    alerts.push({
      type: "info",
      message: "No channels connected. Connect a channel to start receiving messages.",
      action: { label: "Connect Channel", href: "/channels" },
    });
  }

  // Info: No agents
  if (agentCount === 0 && vps?.status === "running") {
    alerts.push({
      type: "info",
      message: "No agents deployed. Deploy an agent to start using AI.",
      action: { label: "Browse Store", href: "/store" },
    });
  }

  return alerts;
}
```

**UI — alert banners at the top of overview:**

```typescript
{alerts.map((alert, i) => {
  const config = {
    critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-500", icon: AlertOctagon },
    warning: { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-500", icon: AlertTriangle },
    info: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-500", icon: Info },
  }[alert.type];

  return (
    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border mb-3 ${config.bg}`}>
      <config.icon className={`h-4 w-4 ${config.text} flex-shrink-0`} />
      <p className="text-sm flex-1">{alert.message}</p>
      {alert.action && (
        <Button variant="outline" size="sm" asChild>
          <Link href={alert.action.href}>{alert.action.label}</Link>
        </Button>
      )}
    </div>
  );
})}
```

### Files to modify
- `src/app/dashboard/page.tsx` — add alert detection + render banners

---

## 1.8 CUSTOMIZABLE QUICK ACTIONS

### What it is
Let users pin/unpin which quick action buttons appear on the overview.

### What to build

**Storage:** localStorage (no DB needed — this is a UI preference).

```typescript
// Available actions
const ALL_ACTIONS = [
  { id: "open_openclaw", label: "Open OpenClaw", icon: ExternalLink, href: null, type: "external" },
  { id: "manage_vps", label: "Manage VPS", icon: Server, href: "/vps" },
  { id: "raise_ticket", label: "Raise Ticket", icon: Ticket, href: "/support/new" },
  { id: "deploy_agent", label: "Deploy Agent", icon: Bot, href: "/store" },
  { id: "connect_channel", label: "Connect Channel", icon: MessageSquare, href: "/channels" },
  { id: "open_chat", label: "Open Chat", icon: MessageCircle, href: "/chat" },
  { id: "view_billing", label: "View Billing", icon: CreditCard, href: "/billing" },
  { id: "account_settings", label: "Account Settings", icon: Settings, href: "/account" },
];

// Default pinned (first 3)
const DEFAULT_PINNED = ["open_openclaw", "manage_vps", "raise_ticket"];

// Read/write from localStorage
function getPinnedActions(): string[] {
  if (typeof window === "undefined") return DEFAULT_PINNED;
  const stored = localStorage.getItem("clawhq-quick-actions");
  return stored ? JSON.parse(stored) : DEFAULT_PINNED;
}

function setPinnedActions(ids: string[]): void {
  localStorage.setItem("clawhq-quick-actions", JSON.stringify(ids));
}
```

**UI:**
- Show pinned action buttons (current behavior but with user's selection)
- "Edit" pencil icon → toggles edit mode
- Edit mode: all actions shown as cards with checkboxes, drag to reorder
- "Done" saves to localStorage

### Files to modify
- `src/app/dashboard/page.tsx` — replace hardcoded quick actions with customizable component

---

## 1.9 USAGE SUMMARY (Non-Pro)

### What it is
Basic message stats for Starter users — not the full Pro analytics, just a simple "here's how much you're using" summary.

### What to build

**Data source:** Aggregate from chat conversations or VPS Data API (when ready).

For now, a simple count from `chat_conversations` table:

```typescript
// In overview page:
const { count: messagesThisWeek } = await supabase
  .from("chat_conversations")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .gte("created_at", oneWeekAgo);
```

**UI — simple summary card:**

```
┌────────────────────────────────────────┐
│ This Week                              │
│ 245 messages · 34 conversations        │
│ Most active: Support Bot (89 messages) │
│                                        │
│ Want detailed analytics?               │
│ [Upgrade to Pro →]                     │
└────────────────────────────────────────┘
```

Shows basic numbers + a subtle upgrade CTA for Pro analytics. Not a full chart — just text stats.

If they're on Pro, this card doesn't show (they have the full analytics page).

### Files to modify
- `src/app/dashboard/page.tsx` — add usage summary card (Starter only)

---

## BUILD ORDER

```
1.1 Onboarding Checklist (FIRST — most impactful for new users)
  ↓
1.5 Getting Started Guide (welcome banner, leads into checklist)
  ↓
1.2 Health Status Indicator (enhances existing VPS card)
  ↓
1.7 System Alerts Banner (uses health data from 1.2)
  ↓
1.3 Recent Activity Feed (independent)
  ↓
1.6 Notification Center (independent, but biggest build)
  ↓
1.4 Quick Stats Sparklines (independent, small)
  ↓
1.8 Customizable Quick Actions (independent, small)
  ↓
1.9 Usage Summary (independent, small)
```

1.1 + 1.5 together = onboarding experience. 1.2 + 1.7 together = health awareness. Rest are independent.
