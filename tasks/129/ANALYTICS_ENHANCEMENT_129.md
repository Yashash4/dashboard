# Usage Analytics Enhancement — Full Implementation Guide

**Owner:** Plan 129 Agent
**Referenced from:** `TODO_129_PRO.md` Section 10
**Total features:** 16
**Last updated:** 2026-03-15

---

## CONTEXT: Current Analytics Architecture

**How analytics currently works:**

```
User sends message via chat → chat/send/route.ts
  → after model response, inserts analytics record into Supabase agent_analytics table
  → record: agent_name, response_time_ms, timestamp

User opens /dashboard/analytics → usage-analytics.tsx
  → calls GET /api/analytics/usage?days=7
  → API calls Supabase RPC get_analytics_usage(user_id, days)
  → RPC aggregates from agent_analytics table
  → Returns: daily totals, hourly distribution, per-agent breakdown, summary stats
  → Frontend renders 4 charts + 4 summary cards
```

**Key files:**
- `src/components/dashboard/usage-analytics.tsx` — UI component
- `src/app/api/analytics/usage/route.ts` — API route
- Supabase RPC `get_analytics_usage` — aggregation function

**Current charts:**
1. Messages over time (area chart, by day)
2. Requests by hour (bar chart, 24 hours)
3. Messages by agent (pie/donut chart)
4. Daily conversations & messages (dual area chart)

**Current summary cards:**
- Total Messages (with % change vs previous period)
- Total Conversations
- Avg Response Time (ms)
- Peak Hour

**Data will migrate to VPS** per architecture decision. For now, build against Supabase. When VPS Data API is ready, swap data source.

---

## 10.1 CONVERSATION FUNNELS

### What it is
Visualize how users progress through multi-step conversations. Where do they drop off? Where do they succeed? Like a sales funnel but for AI agent conversations.

### Why it matters
Users ask "is my support agent actually resolving issues?" Without funnels, they can only see raw message counts. With funnels, they see: "100 conversations started → 80 reached resolution step → 65 confirmed resolved → 15 abandoned."

### What to build

**Define funnel stages for AI conversations:**

Unlike traditional product funnels (signup → onboarding → purchase), AI agent conversations have these natural stages:
1. **Started** — conversation initiated
2. **Engaged** — user sent 2+ messages (not just "hi")
3. **Substantive** — agent used KB context or tools (real work, not just chat)
4. **Resolved** — conversation reached a conclusion (detected by: user said "thanks", agent provided a definitive answer, no follow-up for 30+ minutes)
5. **Satisfied** — user gave positive feedback (if feedback feature 8.10 is built)

**Data tracking:**

Each conversation needs stage tracking. Add to analytics records or create a new table:

```sql
-- On VPS (when Data API is ready) or Supabase for now
CREATE TABLE conversation_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  agent_name TEXT,
  channel_type TEXT,
  stage TEXT NOT NULL, -- 'started', 'engaged', 'substantive', 'resolved', 'satisfied'
  reached_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, stage)
);
CREATE INDEX idx_conv_stages_user ON conversation_stages(user_id);
CREATE INDEX idx_conv_stages_date ON conversation_stages(reached_at);
```

**Stage detection logic** (in `chat/send/route.ts`):

```typescript
// After processing a message, determine which stages were reached:

async function trackConversationStages(
  userId: string,
  conversationId: string,
  agentName: string,
  channelType: string,
  messageCount: number,
  usedKBContext: boolean,
  userMessage: string,
  agentResponse: string
) {
  const stages: string[] = [];

  // Stage 1: Started (always, on first message)
  if (messageCount === 1) stages.push("started");

  // Stage 2: Engaged (2+ messages from user)
  if (messageCount === 2) stages.push("engaged");

  // Stage 3: Substantive (agent used KB, tools, or gave a detailed response)
  if (usedKBContext || agentResponse.length > 200) stages.push("substantive");

  // Stage 4: Resolved (heuristic: user says thanks/resolved, or conversation ends naturally)
  const resolutionPatterns = /\b(thanks|thank you|that helps|got it|perfect|solved|resolved|great)\b/i;
  if (resolutionPatterns.test(userMessage)) stages.push("resolved");

  // Insert stages (upsert — don't duplicate if already reached)
  for (const stage of stages) {
    await admin.from("conversation_stages").upsert({
      user_id: userId,
      conversation_id: conversationId,
      agent_name: agentName,
      channel_type: channelType,
      stage,
      reached_at: new Date().toISOString(),
    }, { onConflict: "conversation_id,stage" }).catch(() => {});
  }
}
```

**API endpoint:**

```typescript
// GET /api/analytics/funnels?days=30&agent=support-bot
// Response:
{
  "funnel": {
    "stages": [
      { "name": "Started", "count": 450, "percentage": 100 },
      { "name": "Engaged", "count": 380, "percentage": 84.4 },
      { "name": "Substantive", "count": 290, "percentage": 64.4 },
      { "name": "Resolved", "count": 220, "percentage": 48.9 },
      { "name": "Satisfied", "count": 180, "percentage": 40.0 }
    ],
    "drop_offs": [
      { "from": "Started", "to": "Engaged", "dropped": 70, "drop_rate": 15.6 },
      { "from": "Engaged", "to": "Substantive", "dropped": 90, "drop_rate": 23.7 },
      { "from": "Substantive", "to": "Resolved", "dropped": 70, "drop_rate": 24.1 },
      { "from": "Resolved", "to": "Satisfied", "dropped": 40, "drop_rate": 18.2 }
    ],
    "period": "30d",
    "agent": "support-bot"
  }
}
```

**UI component:**

Horizontal funnel chart (common visualization):
```
Started    ████████████████████████████████████  450 (100%)
Engaged    ██████████████████████████████       380 (84%)
Substantive ████████████████████████            290 (64%)
Resolved    ██████████████████                  220 (49%)
Satisfied   ████████████████                    180 (40%)
```

Each bar is clickable → drills down to show the actual conversations at that stage (ties into 10.14).

Show drop-off percentages between stages with red arrows: "↓ 16% dropped here"

Filter by: agent, channel, date range.

### Files to create
- `src/app/api/analytics/funnels/route.ts`
- Funnel chart component (horizontal bar chart with drop-off indicators)

### Files to modify
- `src/app/api/chat/send/route.ts` — add `trackConversationStages()` call after each message
- `src/components/dashboard/usage-analytics.tsx` — add "Funnels" tab

---

## 10.2 USER/CONVERSATION PATHS

### What it is
Visualize the actual routes users take through conversations. Not the designed flow, but what actually happens. "Users ask about pricing → then ask about features → then ask about competitors → then say thanks."

### What to build

**Track conversation topic/intent per message:**

```typescript
// After each message, classify the topic/intent:
function classifyIntent(message: string): string {
  // Simple keyword-based classification (no model call needed)
  const intents: Record<string, RegExp> = {
    "greeting": /^(hi|hello|hey|good morning|good afternoon)\b/i,
    "pricing": /\b(price|pricing|cost|plan|subscription|pay|billing)\b/i,
    "support": /\b(help|issue|problem|bug|error|broken|not working|fix)\b/i,
    "refund": /\b(refund|return|money back|cancel|cancellation)\b/i,
    "features": /\b(feature|capability|can you|does it|support for|integration)\b/i,
    "setup": /\b(setup|install|configure|get started|onboard)\b/i,
    "comparison": /\b(vs|versus|compare|alternative|competitor|better than)\b/i,
    "thanks": /\b(thanks|thank you|appreciate|great|perfect|solved)\b/i,
    "other": /.*/,  // fallback
  };

  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(message)) return intent;
  }
  return "other";
}
```

**Store intent sequence per conversation:**

```sql
CREATE TABLE conversation_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id TEXT NOT NULL,
  message_index INTEGER NOT NULL,
  intent TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**API endpoint:**

```typescript
// GET /api/analytics/paths?days=30
// Response:
{
  "paths": [
    {
      "sequence": ["greeting", "support", "support", "thanks"],
      "count": 45,
      "percentage": 15.2,
      "avg_messages": 4.2,
      "resolution_rate": 89
    },
    {
      "sequence": ["pricing", "features", "comparison", "pricing"],
      "count": 32,
      "percentage": 10.8,
      "avg_messages": 5.1,
      "resolution_rate": 62
    }
  ],
  "top_transitions": [
    { "from": "greeting", "to": "support", "count": 120 },
    { "from": "support", "to": "thanks", "count": 85 },
    { "from": "pricing", "to": "features", "count": 67 }
  ],
  "total_conversations": 296
}
```

**UI — Sankey diagram or flow chart:**

```
greeting ──────────┐
  │                ├──→ support ──────→ thanks (45)
  │                │       │
  │                │       └──→ refund ──→ thanks (12)
  │                │
pricing ───────────┤
  │                ├──→ features ──→ comparison ──→ pricing (32)
  │                │
setup ─────────────┘
  │
  └──→ support ──→ thanks (28)
```

Use a Sankey chart library (`recharts` doesn't have Sankey — consider `d3-sankey` or `react-flow` for simple flow visualization, or a simpler table of top paths).

**Simpler alternative (if Sankey is too complex):** Top 10 conversation paths as a table with sequence badges:

```
#  Path                                          Count  Resolution
1  greeting → support → support → thanks          45    89%
2  pricing → features → comparison → pricing       32    62%
3  greeting → setup → setup → thanks              28    93%
```

Each intent shown as a colored badge/chip. Click to see actual conversations.

### Files to create
- `src/app/api/analytics/paths/route.ts`
- Path visualization component
- `src/lib/intent-classifier.ts`

### Files to modify
- `src/app/api/chat/send/route.ts` — classify and store intent per message

---

## 10.3 RESOLUTION RATE

### What it is
Percentage of conversations that were successfully resolved without human escalation. THE most important metric for AI agent performance.

### What to build

**Resolution detection** (already partially done in 10.1 funnels):

A conversation is "resolved" if:
- User explicitly confirmed: "thanks", "that helped", "perfect"
- User gave positive feedback (thumbs up)
- Conversation ended naturally (no messages for 30+ min after agent's last response)
- No support ticket was created during/after the conversation

A conversation is "unresolved" if:
- User created a support ticket (escalation)
- User expressed frustration: "this isn't helping", "talk to a human", "useless"
- Conversation was abandoned mid-flow (user stopped responding after asking a question)

**Metric calculation:**

```typescript
// resolution_rate = resolved_conversations / total_conversations * 100
// escalation_rate = escalated_to_human / total_conversations * 100
// abandonment_rate = abandoned / total_conversations * 100
```

**API response (add to existing analytics endpoint):**

```json
{
  "resolution": {
    "total_conversations": 450,
    "resolved": 350,
    "escalated": 40,
    "abandoned": 60,
    "resolution_rate": 77.8,
    "escalation_rate": 8.9,
    "abandonment_rate": 13.3,
    "trend": { "current": 77.8, "previous": 72.1, "change": 5.7, "direction": "up" },
    "by_agent": [
      { "agent": "support-bot", "rate": 85.2, "total": 200 },
      { "agent": "sales-bot", "rate": 68.5, "total": 150 }
    ],
    "by_channel": [
      { "channel": "whatsapp", "rate": 82.1, "total": 180 },
      { "channel": "telegram", "rate": 74.3, "total": 120 }
    ]
  }
}
```

**UI — Resolution dashboard card + chart:**

Summary card: "Resolution Rate: 77.8% ↑5.7%" (large number, green/red arrow)

Charts:
1. Resolution rate over time (line chart by day/week)
2. Resolution by agent (horizontal bar chart)
3. Resolution by channel (horizontal bar chart)
4. Breakdown pie: Resolved / Escalated / Abandoned

### Files to modify
- `src/app/api/analytics/usage/route.ts` — add resolution metrics
- `src/components/dashboard/usage-analytics.tsx` — add resolution card + charts

---

## 10.4 CSAT / SATISFACTION SCORING

### What it is
After conversations, ask users to rate their experience. Track satisfaction scores over time.

### What to build

**In-chat CSAT prompt:**

After a conversation seems resolved (user says "thanks" or 30min of inactivity), the agent automatically sends a CSAT request:

```
"I'm glad I could help! How would you rate this conversation?"
⭐⭐⭐⭐⭐ (1-5 stars)
```

Or simpler: thumbs up / thumbs down (ties into KB feedback 8.10).

**Database:**

```sql
CREATE TABLE conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id TEXT NOT NULL UNIQUE,
  agent_name TEXT,
  channel_type TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  comment TEXT, -- optional feedback text
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**CSAT calculation:**
```
CSAT Score = (ratings of 4 or 5) / total_ratings * 100
```
Industry standard: ratings 4-5 = satisfied, 1-3 = unsatisfied.

**API response:**

```json
{
  "csat": {
    "score": 82.5,
    "total_ratings": 200,
    "distribution": { "1": 8, "2": 12, "3": 15, "4": 65, "5": 100 },
    "response_rate": 44.4,
    "trend": { "current": 82.5, "previous": 79.1, "change": 3.4, "direction": "up" },
    "by_agent": [
      { "agent": "support-bot", "score": 88.2, "ratings": 120 },
      { "agent": "sales-bot", "score": 74.1, "ratings": 80 }
    ]
  }
}
```

**UI:**
- Large CSAT score card: "82.5% ↑3.4%"
- Star distribution bar chart (1-5 stars)
- CSAT trend line over time
- Per-agent CSAT comparison

**Chat UI change:**
In `agent-chat.tsx`, after detecting conversation resolution, inject a system message with rating buttons:

```typescript
// After resolution detection:
addSystemMessage({
  type: "csat_prompt",
  content: "How would you rate this conversation?",
  ratingOptions: [1, 2, 3, 4, 5], // rendered as star icons
});
```

When user clicks a rating → `POST /api/analytics/ratings` → stores rating → shows "Thank you for your feedback!"

### Files to create
- `src/app/api/analytics/ratings/route.ts`
- CSAT prompt component in chat

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — add CSAT prompt after resolution
- `src/components/dashboard/usage-analytics.tsx` — add CSAT section

---

## 10.5 REAL-TIME LIVE DASHBOARD

### What it is
A live view showing what's happening RIGHT NOW: active conversations, messages per minute, agents online, current response times.

### What to build

**Live metrics (polling every 5 seconds or via Supabase Realtime):**

```json
{
  "live": {
    "active_conversations": 3,
    "messages_last_5_min": 12,
    "messages_per_minute": 2.4,
    "avg_response_time_current": 1800,
    "agents_online": 2,
    "agents_busy": 1,
    "longest_waiting": null,
    "channels_active": ["whatsapp", "telegram"]
  }
}
```

**UI — Live banner at top of analytics page:**

```
┌───────────────────────────────────────────────────────┐
│ 🟢 LIVE   3 active conversations   2.4 msg/min       │
│ Agents: 2 online, 1 busy   Avg response: 1.8s        │
│ Channels: WhatsApp (2), Telegram (1)                  │
└───────────────────────────────────────────────────────┘
```

Numbers update every 5 seconds. Green pulsing dot indicates live data.

**API endpoint:**
```typescript
// GET /api/analytics/live
// Returns current snapshot — queries recent data (last 5 minutes)
// Rate limit: 60/min (allows 5-second polling)
```

### Files to create
- `src/app/api/analytics/live/route.ts`
- Live dashboard banner component

---

## 10.6 CUSTOM DASHBOARDS

### What it is
Users build their own analytics dashboard with widgets they choose. Drag-drop chart placement.

### What to build

**Dashboard config stored per user:**

```sql
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  layout JSONB NOT NULL DEFAULT '[]',
  -- layout: [
  --   { widgetId: "messages_trend", position: { x: 0, y: 0, w: 6, h: 4 }, config: { days: 30 } },
  --   { widgetId: "agent_comparison", position: { x: 6, y: 0, w: 6, h: 4 }, config: {} },
  -- ]
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Available widgets:**

```typescript
const AVAILABLE_WIDGETS = [
  { id: "messages_trend", name: "Messages Over Time", type: "area_chart", category: "volume" },
  { id: "hourly_distribution", name: "Messages by Hour", type: "bar_chart", category: "volume" },
  { id: "agent_breakdown", name: "Messages by Agent", type: "pie_chart", category: "agents" },
  { id: "resolution_rate", name: "Resolution Rate", type: "stat_card", category: "performance" },
  { id: "csat_score", name: "CSAT Score", type: "stat_card", category: "satisfaction" },
  { id: "csat_trend", name: "CSAT Trend", type: "line_chart", category: "satisfaction" },
  { id: "response_time", name: "Avg Response Time", type: "stat_card", category: "performance" },
  { id: "conversation_funnel", name: "Conversation Funnel", type: "funnel_chart", category: "conversion" },
  { id: "top_questions", name: "Top Questions", type: "table", category: "content" },
  { id: "failed_conversations", name: "Failed Conversations", type: "table", category: "issues" },
  { id: "channel_comparison", name: "Channel Comparison", type: "bar_chart", category: "channels" },
  { id: "live_metrics", name: "Live Metrics", type: "live_banner", category: "realtime" },
  { id: "retention_curve", name: "User Retention", type: "line_chart", category: "engagement" },
  { id: "period_comparison", name: "Period Comparison", type: "comparison_table", category: "trends" },
];
```

**UI — Dashboard builder:**

Use `react-grid-layout` for drag-drop widget placement:

```
┌──────────────────────────────────────────────────────────┐
│ My Dashboard          [+ Add Widget] [Edit Layout] [Save] │
├──────────┬──────────┬──────────────────────────────────────┤
│ Messages │ Resoluti │ CSAT Score                           │
│ Trend    │ on Rate  │ 82.5% ↑3.4%                         │
│ ▄▄▆█▇▅▄  │  77.8%  │ ⭐⭐⭐⭐☆                            │
├──────────┴──────────┴──────────────────────────────────────┤
│ Conversation Funnel                                        │
│ ████████████████ 450  Started                              │
│ ██████████████   380  Engaged                              │
│ ████████████     290  Substantive                          │
│ ██████████       220  Resolved                             │
└──────────────────────────────────────────────────────────┘
```

"Add Widget" opens a picker dialog showing all available widgets grouped by category. Click to add. Drag to rearrange. Resize handles on corners. "Edit Layout" toggles edit mode. "Save" persists to DB.

**Install:** `npm install react-grid-layout`

**Each widget is a self-contained component** that fetches its own data via the appropriate API endpoint.

### Files to create
- `src/components/dashboard/custom-dashboard.tsx`
- `src/components/dashboard/widgets/` (one component per widget type)
- `src/app/api/analytics/dashboards/route.ts` (CRUD)

---

## 10.7 BEHAVIORAL COHORTS

### What it is
Group users by their behavior: "users who asked about refunds," "users who used the API," "users who gave low CSAT." Then analyze each group's patterns.

### What to build

**Cohort definition:**

```typescript
interface CohortDefinition {
  name: string;
  conditions: CohortCondition[];
  operator: "AND" | "OR"; // how conditions combine
}

interface CohortCondition {
  type: "intent" | "channel" | "agent" | "message_count" | "csat" | "resolution";
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: string | number;
  timeframe?: string; // "7d", "30d"
}
```

Examples:
- "Refund seekers": intent contains "refund" in last 30 days
- "Power users": message_count > 50 in last 30 days
- "Unhappy users": csat < 3 in last 30 days
- "WhatsApp users": channel equals "whatsapp"

**API:**
```
POST /api/analytics/cohorts — create cohort definition
GET /api/analytics/cohorts — list cohorts
GET /api/analytics/cohorts/[id]/stats — get cohort analytics (messages, resolution rate, CSAT for this group)
DELETE /api/analytics/cohorts/[id]
```

**UI:** Cohort builder with condition rows. Each row: field dropdown + operator dropdown + value input. Add/remove conditions. "AND"/"OR" toggle. Preview: "This cohort contains 45 conversations matching your criteria."

### Files to create
- `src/app/api/analytics/cohorts/route.ts`
- Cohort builder component

---

## 10.8 RETENTION ANALYSIS

### What it is
Do users come back to chat with agents again? Weekly/monthly retention curves show engagement over time.

### What to build

**Retention calculation:**

```typescript
// For each cohort of users (grouped by first conversation week):
// Week 0: 100 users had first conversation
// Week 1: 65 of those 100 came back (65% retention)
// Week 2: 42 came back (42%)
// Week 3: 38 came back (38%)

// This creates a retention curve:
// Week 0: 100%
// Week 1: 65%
// Week 2: 42%
// Week 3: 38%
// ...
```

**API:**
```
GET /api/analytics/retention?period=weekly&cohorts=8
Response:
{
  "retention": {
    "period": "weekly",
    "cohorts": [
      {
        "cohort_start": "2026-03-01",
        "initial_users": 45,
        "retention": [100, 68, 52, 48, 45, 42, 40, 38]  // % for each period
      },
      {
        "cohort_start": "2026-03-08",
        "initial_users": 52,
        "retention": [100, 71, 55, 50, 47]
      }
    ]
  }
}
```

**UI — Retention table (heatmap):**

```
Cohort     Week 0  Week 1  Week 2  Week 3  Week 4
Mar 1-7    100%    68%     52%     48%     45%
Mar 8-14   100%    71%     55%     50%     —
Mar 15-21  100%    65%     —       —       —
```

Cells color-coded: green (high retention) → red (low retention). Common retention heatmap pattern used by PostHog/Mixpanel/Amplitude.

### Files to create
- `src/app/api/analytics/retention/route.ts`
- Retention heatmap component

---

## 10.9 ANOMALY DETECTION / ALERTS

### What it is
Automatically detect unusual changes in analytics metrics: sudden drop in messages, spike in response time, drop in resolution rate.

### What to build

Similar to log alerting (9.3) but for analytics metrics:

```typescript
// src/lib/analytics-anomalies.ts

export function detectAnalyticsAnomalies(
  currentMetrics: AnalyticsSummary,
  baseline: AnalyticsSummary // previous period average
): AnalyticsAnomaly[] {
  const anomalies: AnalyticsAnomaly[] = [];

  // Message volume spike/drop
  if (currentMetrics.totalMessages > baseline.totalMessages * 2) {
    anomalies.push({
      type: "volume_spike",
      severity: "medium",
      metric: "messages",
      current: currentMetrics.totalMessages,
      baseline: baseline.totalMessages,
      message: `Message volume is ${Math.round(currentMetrics.totalMessages / baseline.totalMessages)}x higher than usual`,
    });
  }

  // Response time degradation
  if (currentMetrics.avgResponseTime > baseline.avgResponseTime * 1.5) {
    anomalies.push({
      type: "performance_degradation",
      severity: "high",
      metric: "response_time",
      current: currentMetrics.avgResponseTime,
      baseline: baseline.avgResponseTime,
      message: `Response time is ${Math.round((currentMetrics.avgResponseTime / baseline.avgResponseTime - 1) * 100)}% slower than usual`,
    });
  }

  // Resolution rate drop
  if (currentMetrics.resolutionRate < baseline.resolutionRate - 10) {
    anomalies.push({
      type: "quality_drop",
      severity: "high",
      metric: "resolution_rate",
      current: currentMetrics.resolutionRate,
      baseline: baseline.resolutionRate,
      message: `Resolution rate dropped by ${Math.round(baseline.resolutionRate - currentMetrics.resolutionRate)}%`,
    });
  }

  // CSAT drop
  if (currentMetrics.csatScore && baseline.csatScore &&
      currentMetrics.csatScore < baseline.csatScore - 5) {
    anomalies.push({
      type: "satisfaction_drop",
      severity: "high",
      metric: "csat",
      current: currentMetrics.csatScore,
      baseline: baseline.csatScore,
      message: `CSAT score dropped from ${baseline.csatScore}% to ${currentMetrics.csatScore}%`,
    });
  }

  return anomalies;
}
```

**UI:** Anomaly alerts shown at the top of analytics page (same pattern as log anomalies 9.9):
```
⚠️ 2 anomalies detected
🔴 Response time is 85% slower than usual (3.2s vs 1.7s baseline)
🟡 Message volume is 2.3x higher than usual
```

### Files to create
- `src/lib/analytics-anomalies.ts`

### Files to modify
- `src/components/dashboard/usage-analytics.tsx` — show anomaly bar

---

## 10.10 TOP QUESTIONS / INTENTS

### What it is
What are users most commonly asking about? Ranked list of topics/intents.

### What to build

Uses the intent classifier from 10.2. Aggregate intents across all conversations:

**API:**
```
GET /api/analytics/top-intents?days=30
Response:
{
  "intents": [
    { "intent": "support", "count": 234, "percentage": 35.2, "resolution_rate": 82 },
    { "intent": "pricing", "count": 156, "percentage": 23.5, "resolution_rate": 71 },
    { "intent": "setup", "count": 98, "percentage": 14.7, "resolution_rate": 91 },
    { "intent": "refund", "count": 67, "percentage": 10.1, "resolution_rate": 65 },
    { "intent": "features", "count": 54, "percentage": 8.1, "resolution_rate": 58 }
  ],
  "trending_up": ["refund", "setup"],  // intents growing vs previous period
  "trending_down": ["pricing"]
}
```

**UI — table with trend indicators:**

```
#  Intent    Count   %     Resolution  Trend
1  Support    234   35.2%    82%        →
2  Pricing    156   23.5%    71%        ↓
3  Setup       98   14.7%    91%        ↑
4  Refund      67   10.1%    65%        ↑ NEW
5  Features    54    8.1%    58%        →
```

### Files to create
- `src/app/api/analytics/top-intents/route.ts`

### Files to modify
- `src/components/dashboard/usage-analytics.tsx` — add "Top Questions" section

---

## 10.11 FAILED CONVERSATIONS

### What it is
Conversations where the agent couldn't help — user abandoned, escalated, or expressed frustration. These are opportunities to improve the agent.

### What to build

**Failure detection:**

```typescript
function isFailedConversation(messages: ChatMessage[]): {
  failed: boolean;
  reason: "abandoned" | "escalated" | "frustrated" | "no_answer" | null;
} {
  const lastUserMessage = messages.filter(m => m.role === "user").pop();
  const lastAgentMessage = messages.filter(m => m.role === "assistant").pop();

  // Frustrated: user expressed frustration
  const frustrationPatterns = /\b(useless|not helpful|doesn't work|can't help|talk to human|real person|frustrated|annoyed|waste of time)\b/i;
  if (lastUserMessage && frustrationPatterns.test(lastUserMessage.content)) {
    return { failed: true, reason: "frustrated" };
  }

  // Abandoned: user asked question, agent responded, user never came back (30+ min)
  if (lastAgentMessage && !lastUserMessage) {
    return { failed: true, reason: "abandoned" };
  }

  // No answer: agent said "I don't know" or "I can't help with that"
  const noAnswerPatterns = /\b(i don't know|i'm not sure|i can't help|beyond my capabilities|no information)\b/i;
  if (lastAgentMessage && noAnswerPatterns.test(lastAgentMessage.content)) {
    return { failed: true, reason: "no_answer" };
  }

  return { failed: false, reason: null };
}
```

**API:**
```
GET /api/analytics/failed-conversations?days=30&reason=frustrated
Response:
{
  "failed": {
    "total": 60,
    "by_reason": {
      "abandoned": 25,
      "frustrated": 15,
      "no_answer": 12,
      "escalated": 8
    },
    "failure_rate": 13.3,
    "trend": { "current": 13.3, "previous": 15.1, "change": -1.8, "direction": "improving" },
    "conversations": [
      {
        "id": "conv-123",
        "agent": "support-bot",
        "channel": "whatsapp",
        "reason": "frustrated",
        "last_message": "This is useless, I need a real person",
        "message_count": 5,
        "timestamp": "2026-03-15T10:30:00Z"
      }
    ]
  }
}
```

**UI:**
- Summary card: "Failed Conversations: 13.3% ↓1.8% (improving)"
- Breakdown by reason (pie chart)
- Table of recent failed conversations (clickable → drills into conversation)
- Filter by reason, agent, channel

### Files to create
- `src/app/api/analytics/failed/route.ts`
- `src/lib/conversation-analysis.ts`

---

## 10.12 AGENT COMPARISON

### What it is
Side-by-side comparison of agent performance. Which agent resolves fastest? Which has highest CSAT? Which handles the most conversations?

### What to build

**API:**
```
GET /api/analytics/agent-comparison?days=30
Response:
{
  "agents": [
    {
      "name": "support-bot",
      "metrics": {
        "total_messages": 1200,
        "total_conversations": 200,
        "avg_response_time_ms": 1800,
        "resolution_rate": 85.2,
        "csat_score": 88.0,
        "failure_rate": 8.5,
        "busiest_hour": 14,
        "top_intent": "support"
      }
    },
    {
      "name": "sales-bot",
      "metrics": {
        "total_messages": 800,
        "total_conversations": 150,
        "avg_response_time_ms": 2200,
        "resolution_rate": 68.5,
        "csat_score": 74.0,
        "failure_rate": 18.2,
        "busiest_hour": 10,
        "top_intent": "pricing"
      }
    }
  ]
}
```

**UI — comparison table:**

```
Metric              Support Bot    Sales Bot     Winner
Messages             1,200          800          Support
Conversations         200           150          Support
Avg Response Time     1.8s          2.2s         Support ✓
Resolution Rate       85.2%         68.5%        Support ✓
CSAT Score            88.0%         74.0%        Support ✓
Failure Rate          8.5%          18.2%        Support ✓
```

Green highlight on the "winner" for each metric. Radar chart (spider chart) showing all metrics overlaid. Bar charts for each metric side-by-side.

### Files to create
- `src/app/api/analytics/agent-comparison/route.ts`
- Agent comparison component with radar chart

---

## 10.13 EXPORT / SCHEDULED REPORTS

### What it is
Export analytics data as CSV/PDF. Optionally schedule weekly email summaries.

### What to build

**Export:**

```typescript
// POST /api/analytics/export
// Body: { format: "csv" | "json" | "pdf", period: "7d" | "30d", sections: ["messages", "funnels", "csat"] }
// Returns: downloadable file

// For CSV: flat table of daily metrics
// For JSON: full analytics response
// For PDF: rendered dashboard as PDF (using a library like puppeteer or just HTML→PDF)
```

**Scheduled reports (weekly email):**

```sql
CREATE TABLE analytics_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  day_of_week INTEGER DEFAULT 1, -- 1=Monday for weekly
  time_utc TEXT DEFAULT '09:00', -- send time
  sections TEXT[] DEFAULT '{messages,resolution,csat}', -- which sections to include
  is_enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  email TEXT -- override email, default to user's email
);
```

**Cron:** `GET /api/cron/analytics-reports` — runs daily, checks for due reports, generates HTML email with key metrics + charts (inline images or simple text table), sends via email.

**UI:**
- "Export" button in analytics → dropdown: CSV, JSON, PDF
- "Schedule Report" → dialog: frequency, day, time, sections to include, enable/disable

### Files to create
- `src/app/api/analytics/export/route.ts`
- `src/app/api/cron/analytics-reports/route.ts`

---

## 10.14 CONVERSATION DRILL-DOWN

### What it is
Click on any data point in a chart → see the actual conversations behind that number.

### What to build

Every chart data point becomes clickable. Clicking opens a conversation list panel:

```typescript
// When user clicks a bar in the "Messages by Hour" chart at hour 14:
// → Show panel: "Conversations at 14:00 — 23 conversations"
// → List: conversation previews with agent, channel, first message, message count, duration
// → Click a conversation → opens full conversation transcript in a modal

// When user clicks a data point in resolution rate chart:
// → Show: "Resolved conversations on March 15 — 35 conversations"
// → Same list view

// When user clicks a slice in agent pie chart:
// → Show: "Support Bot conversations — 200 conversations"
```

**API:**
```
GET /api/analytics/conversations?date=2026-03-15&hour=14&agent=support-bot&status=resolved&limit=50
Response:
{
  "conversations": [
    {
      "id": "conv-123",
      "agent": "support-bot",
      "channel": "whatsapp",
      "first_message": "Hi, I need help with my order...",
      "message_count": 6,
      "duration_minutes": 4,
      "status": "resolved",
      "csat": 5,
      "started_at": "2026-03-15T14:02:00Z"
    }
  ],
  "total": 23
}
```

**Conversation transcript modal:**
When clicking a specific conversation, show full message history:
```
┌──────────────────────────────────────────┐
│ Conversation #conv-123                    │
│ Support Bot · WhatsApp · 6 messages · 4m  │
│ CSAT: ⭐⭐⭐⭐⭐ · Resolved               │
├──────────────────────────────────────────┤
│ 👤 Hi, I need help with my order #12345  │
│ 🤖 I'd be happy to help! Let me look    │
│    up order #12345...                     │
│ 👤 It hasn't arrived yet                  │
│ 🤖 I see that your order was shipped on  │
│    March 10 and is expected to arrive... │
│ 👤 Thanks, that helps                     │
│ 🤖 You're welcome! Is there anything...  │
└──────────────────────────────────────────┘
```

### Files to create
- `src/app/api/analytics/conversations/route.ts`
- Conversation drill-down panel + transcript modal

---

## 10.15 PERIOD COMPARISON

### What it is
Compare this week's metrics vs last week. This month vs last month. Side-by-side.

### What to build

**Already partially exists:** Summary cards show % change vs previous period. Expand to full comparison:

**API:**
```
GET /api/analytics/comparison?period=7d
Response:
{
  "current": { "start": "2026-03-09", "end": "2026-03-15", "messages": 1200, "conversations": 200, "resolution_rate": 77.8, "csat": 82.5, "avg_response_time": 1800 },
  "previous": { "start": "2026-03-02", "end": "2026-03-08", "messages": 980, "conversations": 175, "resolution_rate": 72.1, "csat": 79.1, "avg_response_time": 2100 },
  "changes": {
    "messages": { "value": 220, "percent": 22.4, "direction": "up" },
    "conversations": { "value": 25, "percent": 14.3, "direction": "up" },
    "resolution_rate": { "value": 5.7, "percent": 7.9, "direction": "up" },
    "csat": { "value": 3.4, "percent": 4.3, "direction": "up" },
    "avg_response_time": { "value": -300, "percent": -14.3, "direction": "down_good" }
  }
}
```

**UI — comparison cards:**

```
                This Week    Last Week    Change
Messages         1,200         980        +22.4% ↑ 🟢
Conversations      200         175        +14.3% ↑ 🟢
Resolution Rate   77.8%        72.1%      +5.7%  ↑ 🟢
CSAT Score        82.5%        79.1%      +3.4%  ↑ 🟢
Avg Response      1.8s         2.1s       -14.3% ↓ 🟢
```

Green = improvement, Red = degradation. Response time going DOWN is good (green).

### Files to create
- `src/app/api/analytics/comparison/route.ts`

### Files to modify
- `src/components/dashboard/usage-analytics.tsx` — add "Compare" tab or section

---

## 10.16 CHANNEL BREAKDOWN IN ANALYTICS

### What it is
All analytics metrics broken down by channel. Not just "450 messages" but "280 WhatsApp, 120 Telegram, 50 Discord."

### What to build

**Already partially planned in Feature 4 (Channel Analytics).** This extends it: every metric in the analytics dashboard gets a channel dimension.

**In each chart/card, add a "By Channel" toggle:**

```
Messages Over Time  [Total ▼] [By Channel]

// "Total" shows one line (current)
// "By Channel" shows one line per channel (stacked area or multi-line)
```

Same for: resolution rate by channel, CSAT by channel, response time by channel, top questions by channel.

**API:** All analytics endpoints accept `?channel=whatsapp` filter and return `by_channel` breakdowns.

**This is a cross-cutting enhancement** that touches every analytics endpoint and chart component. Implement as a reusable `channelFilter` parameter + `byChannel` response field.

### Files to modify
- All analytics API endpoints — add channel filter + breakdown
- All chart components — add "By Channel" toggle

---

## BUILD ORDER

```
PHASE 1 — Data Foundation (enables all other features):
  10.1 Conversation Funnels (needs stage tracking → add to chat route)
  10.2 User Paths (needs intent classification → add to chat route)
  10.3 Resolution Rate (needs resolution detection)
  10.4 CSAT (needs rating system)

PHASE 2 — Core Insights:
  10.5 Real-time Live Dashboard
  10.10 Top Questions/Intents (uses 10.2 data)
  10.11 Failed Conversations
  10.12 Agent Comparison
  10.15 Period Comparison

PHASE 3 — Advanced:
  10.6 Custom Dashboards (needs all widgets built first)
  10.7 Behavioral Cohorts
  10.8 Retention Analysis
  10.9 Anomaly Detection
  10.14 Conversation Drill-down (needs conversation data accessible)

PHASE 4 — Polish:
  10.13 Export / Scheduled Reports
  10.16 Channel Breakdown (cross-cutting enhancement)
```

Phase 1 + 2 = a complete analytics dashboard that rivals Mixpanel + chatbot-specific platforms. Phase 3 adds power-user features. Phase 4 is polish.
