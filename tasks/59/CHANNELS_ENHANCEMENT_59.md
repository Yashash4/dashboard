# Channels Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 7
**Total features:** 8 (plus Channel Analytics + Auto-Responses already planned in 129 scope)
**Last updated:** 2026-03-15

---

## CONTEXT: Current Channels Page

**Files:**
- `src/app/dashboard/channels/page.tsx` — server component, fetches channels + VPS status
- `src/components/dashboard/channel-manager.tsx` — client component with channel cards, connect/disconnect
- `src/components/dashboard/channel-setup-wizard.tsx` — step-by-step setup instructions per channel
- `src/app/api/channels/connect/route.ts` — connect channel via SSH
- `src/app/api/channels/disconnect/route.ts` — disconnect via SSH
- `src/app/api/channels/health/route.ts` — health check via SSH

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ Channels                                              │
│ ⚠️ VPS not running (if applicable)                    │
├──────────────────────────────────────────────────────┤
│ Connected Channels                                    │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ 📱 Telegram│ │ 💬 Discord │ │ 🌐 Webchat │        │
│ │ Connected  │ │ Connected  │ │ Connected  │        │
│ │ Mar 10     │ │ Mar 12     │ │ Mar 1      │        │
│ │ [Health]   │ │ [Health]   │ │ [Health]   │        │
│ │ [Discon.]  │ │ [Discon.]  │ │ [Discon.]  │        │
│ └────────────┘ └────────────┘ └────────────┘        │
├──────────────────────────────────────────────────────┤
│ Connect New Channel                                   │
│ [Telegram] [Discord] [Slack] [Teams] [Webchat]       │
│ Requires Setup: [WhatsApp] [Signal]                  │
└──────────────────────────────────────────────────────┘
```

**7 channel types:**
- Self-service (5): Telegram, Discord, Slack, Teams, Webchat
- Admin-setup (2): WhatsApp (QR pairing), Signal (phone registration)

**Current health check:** SSH reads OpenClaw config file, checks if channel is listed and enabled. Doesn't actually test if messages flow.

---

## 7.1 CHANNEL STATUS HISTORY

### What it is
Log when each channel went up/down. "WhatsApp was down from 3am to 5am" — users see the history.

### Current state
Only current status shown (connected/disconnected). No history. If a channel was flapping (connecting and disconnecting), user has no visibility.

### Database

```sql
CREATE TABLE channel_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL,
  channel_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'connected', 'disconnected', 'error', 'health_ok', 'health_fail'
  message TEXT, -- "Health check passed" or "Connection lost: timeout"
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_channel_history_channel ON channel_status_history(channel_id, created_at DESC);
CREATE INDEX idx_channel_history_user ON channel_status_history(user_id, created_at DESC);
```

### Track status changes automatically

```typescript
// src/lib/channel-status.ts

export async function logChannelStatus(params: {
  userId: string;
  channelId: string;
  channelType: string;
  status: string;
  message?: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("channel_status_history").insert({
    user_id: params.userId,
    channel_id: params.channelId,
    channel_type: params.channelType,
    status: params.status,
    message: params.message,
  }).catch(() => {});

  // Keep max 100 entries per channel — delete oldest
  const { data: old } = await admin
    .from("channel_status_history")
    .select("id")
    .eq("channel_id", params.channelId)
    .order("created_at", { ascending: true })
    .range(100, 10000);

  if (old?.length) {
    await admin.from("channel_status_history")
      .delete()
      .in("id", old.map(h => h.id))
      .catch(() => {});
  }
}
```

**Where to log:**
- `channels/connect/route.ts` → after successful connect: `logChannelStatus({ status: "connected", message: "Channel connected successfully" })`
- `channels/disconnect/route.ts` → after disconnect: `logChannelStatus({ status: "disconnected", message: "Channel disconnected by user" })`
- `channels/health/route.ts` → after health check: `logChannelStatus({ status: result ? "health_ok" : "health_fail", message: result ? "Health check passed" : "Health check failed" })`

### API

```typescript
// GET /api/channels/[id]/history?limit=20
// Auth + verify channel belongs to user
// Returns: {
//   history: [
//     { status: "health_ok", message: "Health check passed", created_at: "..." },
//     { status: "connected", message: "Channel connected", created_at: "..." },
//   ]
// }
```

### UI — status history timeline

Click "History" on a channel card → expand or dialog:

```
Channel History: Telegram
┌──────────────────────────────────────────────────────┐
│ 🟢 10:30 AM  Health check passed                     │
│ 🟢  8:00 AM  Health check passed                     │
│ 🔴  3:15 AM  Health check failed — timeout           │
│ 🔴  3:00 AM  Health check failed — connection refused│
│ 🟢  2:45 AM  Health check passed                     │
│ 🟢 Yesterday  Connected by user                      │
└──────────────────────────────────────────────────────┘
```

Vertical timeline with color dots. Each entry: status icon + time + message.

**Uptime calculation:**
```typescript
// From history, calculate: uptime percentage (last 7 days)
// uptime = time_in_connected_or_healthy / total_time * 100
// Show on channel card: "Uptime: 99.2% (7d)"
```

### Files to create
- `src/lib/channel-status.ts`
- `src/app/api/channels/[id]/history/route.ts`

### Files to modify
- `src/app/api/channels/connect/route.ts` — log status
- `src/app/api/channels/disconnect/route.ts` — log status
- `src/app/api/channels/health/route.ts` — log status
- `src/components/dashboard/channel-manager.tsx` — add history UI + uptime badge

---

## 7.2 PER-CHANNEL AGENT ROUTING

### What it is
Assign which agent handles which channel. "Support Bot on WhatsApp, Sales Bot on Discord, Research Bot on Telegram."

### Current state
All deployed agents respond on all channels. No routing control. If you have 3 agents deployed, any of them might respond to a WhatsApp message — no predictability.

### Database

```sql
CREATE TABLE channel_agent_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL,
  channel_type TEXT NOT NULL,
  agent_id UUID NOT NULL, -- references user_agents.agent_id
  agent_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- lower = higher priority, for fallback routing
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, agent_id)
);
```

### How routing works

When a message comes in on a channel:
1. Check `channel_agent_routing` for this channel
2. If routing exists → send to the assigned agent (highest priority)
3. If no routing → send to the default agent (first deployed, current behavior)
4. If assigned agent is not deployed → fall back to next priority agent → fall back to default

**This requires changes in the OpenClaw config** — the `channels` section in `openclaw.json` needs to specify which agent handles which channel. Or the routing logic happens in our chat proxy before forwarding to OpenClaw.

**Simpler approach (proxy-side routing):**

In `chat/send/route.ts`, when a message comes with a `channel_type`:
```typescript
// Determine which agent should handle this channel
const routing = await admin
  .from("channel_agent_routing")
  .select("agent_name")
  .eq("user_id", user.id)
  .eq("channel_type", channelType)
  .eq("is_enabled", true)
  .order("priority", { ascending: true })
  .limit(1)
  .single();

const targetAgent = routing?.data?.agent_name || defaultAgent;
// Forward to this specific agent
```

### UI — routing config per channel

On each connected channel card, add "Agent" section:

```
┌────────────────────────────────────┐
│ 📱 Telegram          🟢 Connected  │
│ Agent: [Support Bot ▼]            │
│ Connected: Mar 10 · Uptime: 99.2% │
│ [Test] [History] [Disconnect]      │
└────────────────────────────────────┘
```

Agent dropdown shows deployed agents. "Any Agent" = default (no routing, current behavior).

**For multiple agents per channel (advanced):**
Show priority list: "Primary: Support Bot, Fallback: General Bot". Drag to reorder priority.

### API

```typescript
// PUT /api/channels/[id]/routing
// Body: { agent_id: "uuid", agent_name: "support-bot" }
// OR for multiple: { agents: [{ agent_id, agent_name, priority }] }
// Returns: { routing: { ... } }

// DELETE /api/channels/[id]/routing
// Remove routing (revert to any-agent default)
```

### Files to create
- `src/app/api/channels/[id]/routing/route.ts`

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — add agent selector per channel
- `src/app/api/chat/send/route.ts` — use routing table to determine target agent
- Migration for `channel_agent_routing` table

---

## 7.3 CONNECTION TEST BUTTON

### What it is
Actually verify messages can flow through a channel — not just "is it in the config file?" but "can we send/receive?"

### Current state
Health check reads the OpenClaw config file via SSH. If the channel is listed and enabled, it's "healthy." But the actual messaging service could be down (Telegram bot token expired, Discord bot offline, Slack socket disconnected).

### What to build

**Real connection test per channel type:**

```typescript
// src/lib/channel-test.ts

export async function testChannel(
  channelType: string,
  credentials: Record<string, string>,
  vpsIp: string,
  sshCreds: VPSCredentials
): Promise<{ success: boolean; message: string; latency_ms: number }> {
  const startTime = Date.now();

  switch (channelType) {
    case "telegram": {
      // Test: call Telegram Bot API getMe endpoint
      const botToken = credentials.bot_token;
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (data.ok) {
          return {
            success: true,
            message: `Bot "@${data.result.username}" is responding`,
            latency_ms: Date.now() - startTime,
          };
        }
        return { success: false, message: `Telegram API error: ${data.description}`, latency_ms: Date.now() - startTime };
      } catch {
        return { success: false, message: "Cannot reach Telegram API", latency_ms: Date.now() - startTime };
      }
    }

    case "discord": {
      // Test: call Discord API to verify bot token
      const botToken = credentials.bot_token;
      try {
        const res = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bot ${botToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            message: `Bot "${data.username}" is online`,
            latency_ms: Date.now() - startTime,
          };
        }
        return { success: false, message: `Discord API error: ${res.status}`, latency_ms: Date.now() - startTime };
      } catch {
        return { success: false, message: "Cannot reach Discord API", latency_ms: Date.now() - startTime };
      }
    }

    case "slack": {
      // Test: call Slack auth.test endpoint
      const botToken = credentials.bot_token;
      try {
        const res = await fetch("https://slack.com/api/auth.test", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${botToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (data.ok) {
          return {
            success: true,
            message: `Connected to workspace "${data.team}"`,
            latency_ms: Date.now() - startTime,
          };
        }
        return { success: false, message: `Slack error: ${data.error}`, latency_ms: Date.now() - startTime };
      } catch {
        return { success: false, message: "Cannot reach Slack API", latency_ms: Date.now() - startTime };
      }
    }

    case "webchat": {
      // Test: verify OpenClaw gateway is responding
      const ssh = await connect(sshCreds);
      try {
        const result = await ssh.execCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/health`
        );
        const status = parseInt(result.stdout.trim());
        if (status === 200) {
          return { success: true, message: "Webchat gateway is responding", latency_ms: Date.now() - startTime };
        }
        return { success: false, message: `Gateway returned ${status}`, latency_ms: Date.now() - startTime };
      } finally {
        ssh.dispose();
      }
    }

    case "teams": {
      // Test: verify Azure Bot credentials (call Bot Framework API)
      // Simplified: just verify the credentials aren't empty and format is valid
      if (credentials.app_id && credentials.app_password && credentials.tenant_id) {
        return { success: true, message: "Credentials configured (live test requires Microsoft callback)", latency_ms: Date.now() - startTime };
      }
      return { success: false, message: "Missing Teams credentials", latency_ms: Date.now() - startTime };
    }

    case "whatsapp":
    case "signal": {
      // Admin-setup channels: check if configured in OpenClaw via SSH
      const ssh = await connect(sshCreds);
      try {
        const result = await ssh.execCommand(
          `cat /root/.openclaw/openclaw.json 2>/dev/null || cat /home/node/.openclaw/openclaw.json 2>/dev/null`
        );
        if (result.stdout.includes(`"${channelType}"`)) {
          return { success: true, message: `${channelType} is configured in OpenClaw`, latency_ms: Date.now() - startTime };
        }
        return { success: false, message: `${channelType} not found in OpenClaw config`, latency_ms: Date.now() - startTime };
      } finally {
        ssh.dispose();
      }
    }

    default:
      return { success: false, message: "Unknown channel type", latency_ms: Date.now() - startTime };
  }
}
```

### API

```typescript
// POST /api/channels/[id]/test
// Auth + verify channel belongs to user + rate limit (5/min)
// Fetches channel credentials (decrypted) + VPS creds
// Calls testChannel()
// Returns: { success, message, latency_ms }
// Also logs to channel_status_history
```

### UI

Replace current "Health Check" button with "Test Connection":

```
┌────────────────────────────────────┐
│ 📱 Telegram          🟢 Connected  │
│ Last test: ✅ 2 min ago (120ms)    │
│ [🔍 Test Connection]               │
└────────────────────────────────────┘

// After clicking:
// [🔍 Testing...] (loading spinner)
// Then:
// ✅ Bot "@mybot" is responding (120ms)
// OR:
// ❌ Cannot reach Telegram API — check your bot token
```

### Files to create
- `src/lib/channel-test.ts`
- `src/app/api/channels/[id]/test/route.ts`

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — replace health check with test button

---

## 7.4 QR CODE FOR WHATSAPP (Self-Service)

### What it is
Currently WhatsApp requires admin setup (QR pairing done server-side). Enable self-service: show QR code in the dashboard, user scans with their phone.

### What to build

**This depends on how OpenClaw handles WhatsApp pairing.** If OpenClaw uses the WhatsApp Web protocol (puppeteer-based), it generates a QR code that the user must scan.

**Flow:**
1. User clicks "Connect WhatsApp"
2. Dashboard calls API → SSH triggers QR generation on VPS
3. QR code image is returned to dashboard
4. User scans with their WhatsApp phone app
5. Connection establishes
6. Status updates to "connected"

```typescript
// POST /api/channels/whatsapp/pair
// SSH into VPS → trigger OpenClaw WhatsApp pairing
// OpenClaw generates QR → returns as base64 image or URL
// Returns: { qr_code: "data:image/png;base64,...", session_id: "..." }

// GET /api/channels/whatsapp/pair/status?session_id=...
// Poll for pairing status
// Returns: { status: "waiting" | "scanning" | "connected" | "timeout" }
```

**UI — WhatsApp connect dialog:**

```
┌──────────────────────────────────────────────┐
│ Connect WhatsApp                      [Close] │
├──────────────────────────────────────────────┤
│                                               │
│ Scan this QR code with WhatsApp:              │
│                                               │
│         ┌─────────────────┐                   │
│         │  █▀▀▀▀▀▀▀▀▀█   │                   │
│         │  █ QR CODE  █   │                   │
│         │  █          █   │                   │
│         │  █▄▄▄▄▄▄▄▄▄█   │                   │
│         └─────────────────┘                   │
│                                               │
│ 1. Open WhatsApp on your phone               │
│ 2. Go to Settings → Linked Devices            │
│ 3. Tap "Link a Device"                        │
│ 4. Scan this QR code                          │
│                                               │
│ Status: ⏳ Waiting for scan...                │
│                                               │
│ QR expires in 45s [Refresh QR]                │
└──────────────────────────────────────────────┘
```

Poll status every 3 seconds. When connected → auto-close dialog → show success toast.

**Note:** This may not be possible depending on OpenClaw's WhatsApp implementation. If OpenClaw uses the WhatsApp Business API (not Web protocol), QR pairing isn't applicable — it uses API keys instead. Check OpenClaw's WhatsApp docs.

**If QR pairing isn't possible:** Keep as admin-setup but improve the request flow: user clicks "Request WhatsApp Setup" → creates a support ticket automatically → admin handles it → user gets notified when done.

### Files to create
- `src/app/api/channels/whatsapp/pair/route.ts` (POST — start pairing, GET — check status)
- WhatsApp pairing dialog component

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — replace "admin-setup" with QR flow or improved request flow

---

## 7.5 CHANNEL MESSAGE PREVIEW

### What it is
Show the last few messages received on each channel. "Is anything coming through on Telegram?" — quick glance without opening Chat.

### What to build

**API:**
```typescript
// GET /api/channels/[id]/messages?limit=5
// Auth + verify channel belongs to user
// Query recent messages from this channel (from chat data on VPS or Supabase)
// Returns: {
//   messages: [
//     { from: "user", preview: "Can I return my order?", timestamp: "10:30 AM" },
//     { from: "agent", preview: "Of course! Our return...", timestamp: "10:30 AM" },
//   ]
// }
```

**UI — on channel card, expandable section:**

```
┌────────────────────────────────────┐
│ 📱 Telegram          🟢 Connected  │
│ Agent: Support Bot                  │
│ Last message: 10 min ago           │
│ [▼ Recent Messages]                │
├────────────────────────────────────┤
│ 10:30 👤 Can I return my order?   │
│ 10:30 🤖 Of course! Our return... │
│ 10:15 👤 What's your shipping?    │
│ [View Full Chat →]                 │
└────────────────────────────────────┘
```

Click "Recent Messages" to expand. Click "View Full Chat" → navigates to Chat page filtered to this channel's conversations.

**"Last message: X ago"** shown on the card without expanding — gives instant signal of activity.

### Files to create
- `src/app/api/channels/[id]/messages/route.ts`

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — add expandable message preview + last activity timestamp

---

## 7.6 RECONNECT BUTTON

### What it is
One-click fix for disconnected channels. Instead of disconnect → reconnect manually with credentials, just "Reconnect" with the saved credentials.

### Current state
If a channel disconnects (token expired, service error), user must disconnect and re-enter credentials. Tedious if credentials haven't changed.

### What to build

**Reconnect = reconfigure with existing stored credentials:**

```typescript
// POST /api/channels/[id]/reconnect
// Auth + verify channel belongs to user
// Fetch stored encrypted credentials from channel_credentials table
// Decrypt them
// Call the same SSH configureChannel() function used during initial connect
// Update channel status
// Returns: { success, message }

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Auth check ...

  // Get channel + credentials
  const { data: channel } = await admin
    .from("channels")
    .select("*, channel_credentials(*)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json({ error: "VPS must be running to reconnect" }, { status: 400 });
  }

  // Decrypt stored credentials
  const decryptedCreds = decryptCredentials(channel.channel_credentials);

  // Reconfigure via SSH (same function as initial connect)
  try {
    await configureChannel(
      { host: vps.ip_address, username: vps.ssh_user, password: vps.ssh_password, port: vps.ssh_port },
      channel.channel_type,
      decryptedCreds
    );

    // Update status
    await admin.from("channels").update({ status: "connected" }).eq("id", params.id);

    // Log status
    await logChannelStatus({
      userId: user.id,
      channelId: params.id,
      channelType: channel.channel_type,
      status: "connected",
      message: "Channel reconnected successfully",
    });

    return NextResponse.json({ success: true, message: "Channel reconnected" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reconnect" }, { status: 500 });
  }
}
```

### UI

On disconnected channel cards, show "Reconnect" button prominently:

```
┌────────────────────────────────────┐
│ 📱 Telegram          🔴 Disconnected│
│ Last connected: 2 hours ago        │
│ [🔄 Reconnect]  [Disconnect]       │
└────────────────────────────────────┘
```

"Reconnect" uses saved credentials. If reconnect fails → show error + option to re-enter credentials: "Reconnect failed. Your credentials may have changed. [Update Credentials]"

### Files to create
- `src/app/api/channels/[id]/reconnect/route.ts`

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — add Reconnect button for disconnected channels

---

## 7.7 CHANNEL ORDERING / PRIORITY

### What it is
Drag to reorder channels. Set a "primary" channel that shows first.

### What to build

**Simple approach — localStorage:**

Store channel order in localStorage. No DB change needed. Just UI preference.

```typescript
// In channel-manager.tsx:
const [channelOrder, setChannelOrder] = useState<string[]>(() => {
  const stored = localStorage.getItem("clawhq-channel-order");
  return stored ? JSON.parse(stored) : [];
});

const orderedChannels = useMemo(() => {
  if (channelOrder.length === 0) return channels;

  return [...channels].sort((a, b) => {
    const aIdx = channelOrder.indexOf(a.id);
    const bIdx = channelOrder.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}, [channels, channelOrder]);
```

**UI:** Drag handle on each channel card (like task board cards). Or simpler: up/down arrow buttons. Or even simpler: "Set as Primary" option in the channel menu → moves it to first position.

**"Primary" badge:** First channel in the list shows a small "Primary" badge. This is visual only — no backend behavior difference.

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — add ordering logic + primary badge

---

## 7.8 CHANNEL BRANDING

### What it is
Customize how your bot appears on each channel — custom name and avatar per channel.

### Current state
The bot uses whatever name/avatar was set in the channel platform (Telegram BotFather, Discord developer portal, etc.). No control from ClawHQ dashboard.

### What to build

**For some channels, we CAN control the display name via API:**
- **Telegram:** Bot name is set in BotFather — we can't change it from our side. But we CAN update the bot's profile photo via Telegram API.
- **Discord:** Bot name/avatar can be changed via Discord API.
- **Slack:** Bot name/avatar set in app config — can be changed via Slack API.
- **Webchat:** Fully customizable — we control the widget.
- **WhatsApp/Signal/Teams:** Name set during registration — limited control.

**Realistic scope:** Channel branding UI for Webchat (full control) and display name guidance for others.

**Database:**
```sql
ALTER TABLE channels ADD COLUMN display_name TEXT;
ALTER TABLE channels ADD COLUMN avatar_emoji TEXT;
ALTER TABLE channels ADD COLUMN branding_config JSONB DEFAULT '{}';
-- branding_config: { greeting_name: "Company AI", avatar_url: "...", theme_color: "#..." }
```

**UI — branding section per channel card (expandable):**

```
Branding: Webchat
┌──────────────────────────────────────┐
│ Display Name: [Company AI Support   ] │
│ Avatar: [🤝 ▼] (emoji picker)        │
│ Theme Color: [#22c55e] (color picker) │
│ [Save]                                │
└──────────────────────────────────────┘

Branding: Telegram
┌──────────────────────────────────────┐
│ ℹ️ Bot name is set in Telegram       │
│    BotFather. To change it:          │
│    1. Open @BotFather                │
│    2. /setname → select your bot     │
│    3. Enter new name                 │
│ Current bot: @mycompany_support_bot  │
└──────────────────────────────────────┘
```

For channels where we can't programmatically change the name, show instructions for how to change it in the platform's settings.

### Files to modify
- `src/components/dashboard/channel-manager.tsx` — add branding section per channel
- Migration for new columns

---

## BUILD ORDER

```
7.3 Connection Test (FIRST — highest impact, replaces weak health check)
  ↓
7.1 Channel Status History (uses test results, builds over time)
  ↓
7.6 Reconnect Button (quick win, high usability)
  ↓
7.2 Per-Channel Agent Routing (big feature, changes message flow)
  ↓
7.5 Channel Message Preview (needs chat data access)
  ↓
7.4 QR Code for WhatsApp (depends on OpenClaw's WhatsApp implementation)
  ↓
7.7 Channel Ordering (UI-only, localStorage)
  ↓
7.8 Channel Branding (cosmetic, low priority)
```

7.3 (real connection test) is the most impactful — it replaces the current fake health check with actual API verification. 7.1 + 7.6 build on top of it. 7.2 (agent routing) is the biggest behavioral change.
