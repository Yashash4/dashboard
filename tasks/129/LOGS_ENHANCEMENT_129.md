# Logs Explorer Enhancement — Full Implementation Guide

**Owner:** Plan 129 Agent
**Referenced from:** `TODO_129_PRO.md` Section 9
**Total features:** 12
**Last updated:** 2026-03-15

---

## CONTEXT: Current Logs Architecture

**How Logs Explorer currently works:**

```
User opens /dashboard/logs → logs-explorer.tsx component
  → useQuery calls GET /api/vps/logs?lines=500
  → API route: auth → Pro plan check → rate limit (30/min)
  → SSH into user's VPS → docker logs openclaw --tail 500 (or journalctl)
  → Parse raw log lines
  → Return to frontend
  → Frontend: search filter, level filter (error/warn/info/debug), auto-refresh (5s)
  → Display: color-coded log lines, keyword highlighting
  → Actions: pause/play, download as .txt, line count selector
```

**Key files:**
- `src/components/dashboard/logs-explorer.tsx` — UI component (~380 lines)
- `src/app/api/vps/logs/route.ts` — API route (SSH → docker logs)

**Current limitations:**
- Fetches via SSH on every request (slow, ~1-3s)
- No log persistence — only shows last N lines from Docker/systemd
- No structured parsing — raw text lines
- Search is client-side string match only
- No saved searches, no alerting, no patterns
- Poll-based (5s interval), not true streaming
- Max 500 lines per request
- No date/time filtering (only "last N lines")

---

## 9.1 SAVED SEARCHES / VIEWS

### What it is
Users save frequently used search + filter combinations and restore them with one click. "Show me all errors from the last hour" becomes a saved view they can reuse.

### Current state
Every time the user opens Logs Explorer, they start fresh. Filters reset. Search clears.

### What to build

**Database (Supabase — this is small config data, not user content):**
```sql
CREATE TABLE saved_log_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  -- config shape: {
  --   search: "keyword",
  --   levels: ["error", "warn"],
  --   lineCount: 500,
  --   autoRefresh: true,
  --   refreshInterval: 5000,
  --   dateRange: { from: "2026-03-15T00:00", to: "2026-03-15T23:59" }
  -- }
  is_default BOOLEAN DEFAULT false, -- auto-load this view on page open
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saved_views_user ON saved_log_views(user_id);
```

**API endpoints:**

```typescript
// GET /api/logs/saved-views
// Auth → Pro plan check
// Returns: { views: [{ id, name, config, is_default, created_at }] }

// POST /api/logs/saved-views
// Body: { name: "Error Monitor", config: {...}, is_default?: boolean }
// Max 20 saved views per user
// Returns: { view: { id, name, config, ... } }

// PATCH /api/logs/saved-views/[id]
// Body: { name?: string, config?: object, is_default?: boolean }
// If setting is_default: true, unset any existing default

// DELETE /api/logs/saved-views/[id]
// Auth + ownership check
```

**UI changes in `logs-explorer.tsx`:**

Add a dropdown/popover at the top of the log viewer:

```typescript
// "Saved Views" dropdown next to the search bar
// ┌──────────────────────────────────┐
// │ 📁 Saved Views          [+ Save Current] │
// ├──────────────────────────────────┤
// │ ⭐ Error Monitor (default)       [⋮]    │
// │    Support Bot Errors            [⋮]    │
// │    High Traffic Warnings         [⋮]    │
// └──────────────────────────────────┘
// [⋮] menu: Set as Default, Edit Name, Delete

// "Save Current" button:
// 1. Opens dialog: "Save current view as..."
// 2. Name input (required)
// 3. "Set as default" checkbox
// 4. Captures current: search query, level filters, line count, auto-refresh, date range
// 5. Saves via POST /api/logs/saved-views

// Clicking a saved view:
// 1. Restores all filters/search from the saved config
// 2. Refetches logs with the restored config
// 3. Highlights the active view name in the dropdown
```

**On page load:**
```typescript
// Fetch saved views
const { data: savedViews } = useQuery({
  queryKey: ["log-saved-views"],
  queryFn: () => fetch("/api/logs/saved-views").then(r => r.json()),
});

// If there's a default view, apply its config on mount
useEffect(() => {
  const defaultView = savedViews?.views?.find(v => v.is_default);
  if (defaultView) {
    setSearch(defaultView.config.search || "");
    setLevels(defaultView.config.levels || ["error", "warn", "info", "debug"]);
    setLineCount(defaultView.config.lineCount || 500);
    // ... apply all config
  }
}, [savedViews]);
```

### Files to create
- `src/app/api/logs/saved-views/route.ts` (GET, POST)
- `src/app/api/logs/saved-views/[id]/route.ts` (PATCH, DELETE)

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — add saved views dropdown + save button

### Testing
1. Set search to "error" + level filter to "error" only → click "Save Current" → name it "Error Monitor"
2. Clear all filters → click the saved view → verify filters restore
3. Set as default → reload page → verify it auto-applies
4. Create 20 views → verify 21st is rejected
5. Delete a view → verify it's gone

---

## 9.2 LOG PATTERNS / CLUSTERING

### What it is
Automatically group similar log lines together and show the count. Instead of seeing 500 individual "Connection refused" lines, see "Connection refused — 500 occurrences" with one click to expand.

### Current state
Every log line displays individually. 500 lines of the same error = 500 lines to scroll through.

### What to build

**Client-side pattern detection** (no API change needed — works on the already-fetched logs):

```typescript
// src/lib/log-patterns.ts

export interface LogPattern {
  template: string;       // "Connection refused to {host}:{port}"
  count: number;          // how many lines match
  level: string;          // most common level
  firstSeen: string;      // timestamp of first occurrence
  lastSeen: string;       // timestamp of last occurrence
  lines: string[];        // actual matching lines (store first 10 for preview)
  trend: "increasing" | "stable" | "decreasing"; // frequency trend
}

export function detectPatterns(logs: ParsedLog[], minOccurrences: number = 3): LogPattern[] {
  const patternMap = new Map<string, {
    count: number;
    level: string;
    levelCounts: Record<string, number>;
    firstSeen: string;
    lastSeen: string;
    lines: string[];
  }>();

  for (const log of logs) {
    // Normalize the log message to find patterns:
    // 1. Replace numbers with {N}
    // 2. Replace IPs with {IP}
    // 3. Replace UUIDs with {UUID}
    // 4. Replace timestamps with {TIME}
    // 5. Replace quoted strings with {STR}
    // 6. Replace file paths with {PATH}
    const template = normalizeLogMessage(log.message);

    const existing = patternMap.get(template);
    if (existing) {
      existing.count++;
      existing.levelCounts[log.level] = (existing.levelCounts[log.level] || 0) + 1;
      existing.lastSeen = log.timestamp || existing.lastSeen;
      if (existing.lines.length < 10) existing.lines.push(log.raw);
    } else {
      patternMap.set(template, {
        count: 1,
        level: log.level,
        levelCounts: { [log.level]: 1 },
        firstSeen: log.timestamp || "",
        lastSeen: log.timestamp || "",
        lines: [log.raw],
      });
    }
  }

  // Convert to array, filter by min occurrences, sort by count
  return [...patternMap.entries()]
    .filter(([, data]) => data.count >= minOccurrences)
    .map(([template, data]) => ({
      template,
      count: data.count,
      level: Object.entries(data.levelCounts).sort(([,a], [,b]) => b - a)[0][0],
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
      lines: data.lines,
      trend: "stable" as const, // calculate from timestamp distribution later
    }))
    .sort((a, b) => b.count - a.count);
}

function normalizeLogMessage(message: string): string {
  return message
    // UUIDs: a1b2c3d4-e5f6-7890-abcd-ef1234567890
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{UUID}")
    // IP addresses: 192.168.1.1
    .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, "{IP}")
    // Ports: :8080, :443
    .replace(/:\d{2,5}/g, ":{PORT}")
    // Timestamps: 2026-03-15T10:30:00, 10:30:00.123
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*/g, "{TIME}")
    .replace(/\d{2}:\d{2}:\d{2}[.\d]*/g, "{TIME}")
    // Large numbers: 123456, 1.5GB
    .replace(/\b\d{4,}\b/g, "{N}")
    // File paths: /usr/lib/something.js
    .replace(/\/[\w./\-]+/g, "{PATH}")
    // Quoted strings: "something here"
    .replace(/"[^"]{10,}"/g, '"{STR}"')
    // Hex values: 0x1a2b3c
    .replace(/0x[0-9a-f]+/gi, "{HEX}")
    // Trim whitespace variations
    .replace(/\s+/g, " ")
    .trim();
}
```

**UI — Pattern View toggle:**

Add a view toggle in the logs explorer toolbar: "Lines" | "Patterns"

```typescript
// Lines view (current): shows individual log lines
// Patterns view (new): shows grouped patterns

// Pattern card:
// ┌────────────────────────────────────────────────────┐
// │ 🔴 ERROR  ×147   Connection refused to {IP}:{PORT}  │
// │ First: 10:15:32  Last: 10:47:18  Trend: ↑ increasing │
// │ [Show Lines ▼]                                      │
// ├────────────────────────────────────────────────────┤
// │ 🟡 WARN   ×89    Request timeout after {N}ms        │
// │ First: 10:20:01  Last: 10:45:55  Trend: → stable    │
// │ [Show Lines ▼]                                      │
// └────────────────────────────────────────────────────┘

// Clicking "Show Lines" expands to show the first 10 matching lines
// Each pattern card has:
// - Level badge with color
// - Count badge "×147"
// - Normalized template (with {N}, {IP} placeholders highlighted differently)
// - First seen / Last seen timestamps
// - Trend indicator (arrow + word)
// - Expand to see actual matching lines
```

**Integration:**
```typescript
// In logs-explorer.tsx:
const [viewMode, setViewMode] = useState<"lines" | "patterns">("lines");
const patterns = useMemo(() => {
  if (viewMode !== "patterns") return [];
  return detectPatterns(parsedLogs);
}, [parsedLogs, viewMode]);
```

### Files to create
- `src/lib/log-patterns.ts`

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — add view toggle + pattern view

### Testing
1. Generate logs with repeated messages (restart VPS to create connection retry logs)
2. Switch to "Patterns" view → verify similar lines grouped
3. Check pattern template: numbers, IPs, timestamps replaced with placeholders
4. Expand a pattern → verify actual lines shown
5. Verify count is accurate
6. Test with 0 patterns (all unique logs) → show "No repeated patterns found"

---

## 9.3 LOG ALERTING

### What it is
Set rules like "alert me if 'error' appears more than 10 times in 5 minutes." Get notified via email, webhook, or in-dashboard notification.

### Current state
No alerting. Users have to manually watch logs.

### Database

```sql
CREATE TABLE log_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL, -- 'keyword_count', 'level_count', 'pattern_match', 'absence'
  condition_config JSONB NOT NULL,
  -- keyword_count: { keyword: "error", threshold: 10, window_minutes: 5 }
  -- level_count: { level: "error", threshold: 20, window_minutes: 10 }
  -- pattern_match: { pattern: "Connection refused", threshold: 5, window_minutes: 5 }
  -- absence: { keyword: "heartbeat", absence_minutes: 10 } -- alert if keyword NOT seen
  notification_channels JSONB NOT NULL DEFAULT '["dashboard"]',
  -- ["dashboard", "email", "webhook"]
  -- webhook: { url: "https://...", secret: "..." }
  cooldown_minutes INTEGER DEFAULT 30, -- don't re-alert within this window
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE log_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES log_alert_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  condition_snapshot JSONB, -- what matched: { keyword: "error", count: 15, window: "5m" }
  notification_sent_to TEXT[], -- ["dashboard", "email"]
  acknowledged_at TIMESTAMPTZ
);
```

### Evaluation engine

```typescript
// src/lib/log-alerting.ts

import { createAdminClient } from "@/lib/supabase-admin";

interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  condition_type: string;
  condition_config: Record<string, any>;
  notification_channels: string[];
  cooldown_minutes: number;
  last_triggered_at: string | null;
}

// Called periodically (every 60 seconds via cron) or on every log fetch
export async function evaluateLogAlerts(
  userId: string,
  recentLogs: ParsedLog[]
): Promise<void> {
  const admin = createAdminClient();

  // Get user's enabled alert rules
  const { data: rules } = await admin
    .from("log_alert_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("is_enabled", true);

  if (!rules?.length) return;

  for (const rule of rules) {
    // Check cooldown
    if (rule.last_triggered_at) {
      const lastTriggered = new Date(rule.last_triggered_at).getTime();
      const cooldownMs = rule.cooldown_minutes * 60 * 1000;
      if (Date.now() - lastTriggered < cooldownMs) continue; // still in cooldown
    }

    // Evaluate condition
    const triggered = evaluateCondition(rule, recentLogs);

    if (triggered) {
      // Record the alert
      await admin.from("log_alert_history").insert({
        rule_id: rule.id,
        user_id: userId,
        condition_snapshot: triggered.snapshot,
        notification_sent_to: rule.notification_channels,
      });

      // Update last_triggered_at
      await admin.from("log_alert_rules").update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: (rule.trigger_count || 0) + 1,
      }).eq("id", rule.id);

      // Send notifications
      await sendAlertNotifications(rule, triggered.snapshot);
    }
  }
}

function evaluateCondition(
  rule: AlertRule,
  logs: ParsedLog[]
): { triggered: boolean; snapshot: Record<string, any> } | null {
  const config = rule.condition_config;

  switch (rule.condition_type) {
    case "keyword_count": {
      const windowMs = (config.window_minutes || 5) * 60 * 1000;
      const cutoff = Date.now() - windowMs;
      const matching = logs.filter(log =>
        log.message.toLowerCase().includes(config.keyword.toLowerCase()) &&
        new Date(log.timestamp).getTime() > cutoff
      );
      if (matching.length >= config.threshold) {
        return {
          triggered: true,
          snapshot: {
            keyword: config.keyword,
            count: matching.length,
            threshold: config.threshold,
            window: `${config.window_minutes}m`,
          }
        };
      }
      break;
    }

    case "level_count": {
      const windowMs = (config.window_minutes || 5) * 60 * 1000;
      const cutoff = Date.now() - windowMs;
      const matching = logs.filter(log =>
        log.level === config.level &&
        new Date(log.timestamp).getTime() > cutoff
      );
      if (matching.length >= config.threshold) {
        return {
          triggered: true,
          snapshot: {
            level: config.level,
            count: matching.length,
            threshold: config.threshold,
            window: `${config.window_minutes}m`,
          }
        };
      }
      break;
    }

    case "pattern_match": {
      const windowMs = (config.window_minutes || 5) * 60 * 1000;
      const cutoff = Date.now() - windowMs;
      const regex = new RegExp(config.pattern, "i");
      const matching = logs.filter(log =>
        regex.test(log.message) &&
        new Date(log.timestamp).getTime() > cutoff
      );
      if (matching.length >= config.threshold) {
        return {
          triggered: true,
          snapshot: {
            pattern: config.pattern,
            count: matching.length,
            threshold: config.threshold,
            window: `${config.window_minutes}m`,
          }
        };
      }
      break;
    }

    case "absence": {
      const windowMs = (config.absence_minutes || 10) * 60 * 1000;
      const cutoff = Date.now() - windowMs;
      const found = logs.some(log =>
        log.message.toLowerCase().includes(config.keyword.toLowerCase()) &&
        new Date(log.timestamp).getTime() > cutoff
      );
      if (!found) {
        return {
          triggered: true,
          snapshot: {
            keyword: config.keyword,
            absent_for: `${config.absence_minutes}m`,
            message: `"${config.keyword}" not seen in the last ${config.absence_minutes} minutes`,
          }
        };
      }
      break;
    }
  }

  return null;
}

async function sendAlertNotifications(
  rule: AlertRule,
  snapshot: Record<string, any>
): Promise<void> {
  const channels = rule.notification_channels || ["dashboard"];

  for (const channel of channels) {
    switch (channel) {
      case "dashboard":
        // Insert into a notifications table (or use existing support ticket system)
        // The dashboard can show a bell icon with unread alerts
        break;

      case "email":
        // Send email via existing email infrastructure
        // Subject: `[ClawHQ Alert] ${rule.name}`
        // Body: rule name + snapshot details
        break;

      case "webhook":
        // Fire webhook to user's configured URL
        // Use existing webhook dispatch infrastructure
        const webhookConfig = rule.notification_channels.find(c =>
          typeof c === "object" && c.url
        );
        if (webhookConfig) {
          await fetch(webhookConfig.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alert: rule.name,
              condition: rule.condition_type,
              snapshot,
              triggered_at: new Date().toISOString(),
            }),
          }).catch(() => {});
        }
        break;
    }
  }
}
```

### Cron endpoint

```typescript
// GET /api/cron/log-alerts
// Runs every 60 seconds
// For each user with enabled alert rules:
// 1. Fetch recent logs from VPS (last 10 minutes)
// 2. Run evaluateLogAlerts()
// 3. Fire notifications for triggered alerts

export async function GET(request: NextRequest) {
  const admin = createAdminClient();

  // Get all users with enabled log alert rules
  const { data: rules } = await admin
    .from("log_alert_rules")
    .select("user_id")
    .eq("is_enabled", true);

  const userIds = [...new Set(rules?.map(r => r.user_id) || [])];

  for (const userId of userIds) {
    try {
      // Get VPS credentials
      const { data: vps } = await admin
        .from("vps_instances")
        .select("ip_address, ssh_user, ssh_password, ssh_port, status")
        .eq("user_id", userId)
        .single();

      if (!vps || vps.status !== "running") continue;

      // Fetch recent logs via SSH
      const logs = await fetchRecentLogs(vps, 1000); // last 1000 lines

      // Parse logs
      const parsed = parseLogs(logs);

      // Evaluate alerts
      await evaluateLogAlerts(userId, parsed);
    } catch {
      // Log error, continue with next user
    }
  }

  return NextResponse.json({ evaluated: userIds.length });
}
```

### API for managing alert rules

```typescript
// GET /api/logs/alerts — list user's alert rules
// POST /api/logs/alerts — create rule (max 10 per user)
// Body: {
//   name: "Error Spike",
//   condition_type: "keyword_count",
//   condition_config: { keyword: "error", threshold: 10, window_minutes: 5 },
//   notification_channels: ["dashboard", "email"],
//   cooldown_minutes: 30
// }
// PATCH /api/logs/alerts/[id] — update rule
// DELETE /api/logs/alerts/[id] — delete rule

// GET /api/logs/alerts/history — alert history (paginated)
// Response: { alerts: [{ id, rule_name, triggered_at, snapshot, acknowledged }], total }

// POST /api/logs/alerts/history/[id]/acknowledge — mark alert as seen
```

### UI in logs explorer

Add "Alerts" tab or section:

```
┌──────────────────────────────────────────────┐
│ Log Alerts                    [+ Create Rule] │
├──────────────────────────────────────────────┤
│ 🟢 Error Spike                 [Edit] [⋮]    │
│    "error" > 10 times in 5 min               │
│    Last triggered: 2 hours ago · Fired 3x    │
├──────────────────────────────────────────────┤
│ 🟢 Heartbeat Missing           [Edit] [⋮]    │
│    "heartbeat" absent for 10 min             │
│    Never triggered                            │
├──────────────────────────────────────────────┤
│ Recent Alerts                                 │
│ 🔴 Error Spike — 15 errors in 5 min — 2h ago │
│ 🔴 Error Spike — 12 errors in 5 min — 5h ago │
└──────────────────────────────────────────────┘

// Create Rule dialog:
// - Name (text)
// - Condition type (dropdown: "Keyword count", "Error level count", "Pattern match", "Keyword absence")
// - Config fields change based on type:
//   - Keyword count: keyword input + threshold number + window minutes
//   - Level count: level dropdown + threshold + window
//   - Pattern: regex input + threshold + window
//   - Absence: keyword + absence minutes
// - Notification: checkboxes for Dashboard, Email, Webhook (with URL input)
// - Cooldown: minutes input (default 30)
// - Enable/disable toggle
```

### Bell icon in dashboard header

When alerts fire, show a notification bell in the main dashboard header with unread count badge. Clicking opens a dropdown with recent alerts.

### Files to create
- `src/lib/log-alerting.ts`
- `src/app/api/logs/alerts/route.ts` (GET, POST)
- `src/app/api/logs/alerts/[id]/route.ts` (PATCH, DELETE)
- `src/app/api/logs/alerts/history/route.ts` (GET)
- `src/app/api/logs/alerts/history/[id]/acknowledge/route.ts` (POST)
- `src/app/api/cron/log-alerts/route.ts`
- Alert notification bell component

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — add Alerts tab
- `src/components/dashboard/app-sidebar.tsx` — add notification bell (or layout header)

---

## 9.4 STRUCTURED / PARSED LOGS

### What it is
Instead of treating logs as raw text, parse them into structured fields: timestamp, level, source, message, and any JSON payloads. Enable filtering and searching by specific fields.

### Current state
`parseLogs()` in `logs-explorer.tsx` does basic regex parsing to extract level and message. No timestamp extraction, no JSON payload parsing, no field-based filtering.

### What to build

**Improved log parser:**

```typescript
// src/lib/log-parser.ts

export interface StructuredLog {
  raw: string;                    // original line
  timestamp: string | null;       // parsed timestamp
  level: "error" | "warn" | "info" | "debug" | "unknown";
  source: string | null;          // component name (e.g., "gateway", "agent:support-bot")
  message: string;                // main message text
  fields: Record<string, any>;   // parsed key-value fields
  json: Record<string, any> | null; // parsed JSON payload if present
  lineNumber: number;
}

export function parseStructuredLogs(rawLogs: string): StructuredLog[] {
  const lines = rawLogs.split("\n").filter(l => l.trim());
  return lines.map((line, index) => parseLogLine(line, index + 1));
}

function parseLogLine(line: string, lineNumber: number): StructuredLog {
  const result: StructuredLog = {
    raw: line,
    timestamp: null,
    level: "unknown",
    source: null,
    message: line,
    fields: {},
    json: null,
    lineNumber,
  };

  // Try common log formats:

  // Format 1: ISO timestamp + level + source + message
  // 2026-03-15T10:30:00.123Z [ERROR] [gateway] Connection refused
  const match1 = line.match(
    /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?)\s+\[?(ERROR|WARN|WARNING|INFO|DEBUG)\]?\s+\[?([^\]]+)\]?\s+(.*)/i
  );
  if (match1) {
    result.timestamp = match1[1];
    result.level = normalizeLevel(match1[2]);
    result.source = match1[3].trim();
    result.message = match1[4].trim();
  }

  // Format 2: Docker/systemd style
  // ERROR: something happened
  if (!match1) {
    const match2 = line.match(/^(ERROR|WARN|WARNING|INFO|DEBUG):?\s+(.*)/i);
    if (match2) {
      result.level = normalizeLevel(match2[1]);
      result.message = match2[2].trim();
    }
  }

  // Format 3: Timestamp without brackets
  // 10:30:00 error Something happened
  if (!match1) {
    const match3 = line.match(/^(\d{2}:\d{2}:\d{2}[.\d]*)\s+(error|warn|info|debug)\s+(.*)/i);
    if (match3) {
      result.timestamp = match3[1];
      result.level = normalizeLevel(match3[2]);
      result.message = match3[3].trim();
    }
  }

  // Extract inline JSON (if message contains {...} or ends with JSON)
  const jsonMatch = result.message.match(/(\{[^{}]*\})\s*$/);
  if (jsonMatch) {
    try {
      result.json = JSON.parse(jsonMatch[1]);
      result.message = result.message.replace(jsonMatch[1], "").trim();
    } catch {
      // not valid JSON — leave message as-is
    }
  }

  // Extract key=value pairs
  // agent=support-bot status=200 duration=1.5s
  const kvMatches = result.message.matchAll(/(\w+)=("[^"]*"|\S+)/g);
  for (const kv of kvMatches) {
    const key = kv[1];
    let value: any = kv[2].replace(/^"|"$/g, "");
    // Try to parse numbers
    if (/^\d+\.?\d*$/.test(value)) value = parseFloat(value);
    result.fields[key] = value;
  }

  return result;
}

function normalizeLevel(level: string): StructuredLog["level"] {
  switch (level.toLowerCase()) {
    case "error": case "err": case "fatal": case "critical": return "error";
    case "warn": case "warning": return "warn";
    case "info": case "notice": return "info";
    case "debug": case "trace": case "verbose": return "debug";
    default: return "unknown";
  }
}
```

**UI — structured log display:**

Replace the current raw text display with structured cards:

```
┌──────────────────────────────────────────────────────────┐
│ 10:30:00.123  🔴 ERROR  [gateway]                        │
│ Connection refused to upstream service                    │
│ ┌─ Fields ──────────────────────────────────────────────┐ │
│ │ host: 127.0.0.1  port: 18789  retries: 3  duration: 1.2s │
│ └───────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ 10:30:01.456  🟡 WARN   [agent:support-bot]              │
│ Response time exceeded threshold                          │
│ ┌─ JSON ────────────────────────────────────────────────┐ │
│ │ { "response_time": 3200, "threshold": 3000, "agent": "support-bot" } │
│ └───────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- Timestamp on left, level badge, source component
- Message as main text
- Extracted fields shown as key-value pills (collapsible)
- JSON payloads shown formatted and syntax-highlighted (collapsible)
- Click any field value to filter by it (faceted search — ties into 9.6)

### Files to create
- `src/lib/log-parser.ts`

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — use `parseStructuredLogs()`, render structured cards

---

## 9.5 LIVE TAIL (True Streaming)

### What it is
Instead of polling every 5 seconds, stream logs in real-time as they happen. New lines appear instantly.

### Current state
`useQuery` with `refetchInterval: 5000` — fetches the full log buffer every 5 seconds. Not true streaming. 5-second delay between when a log is written and when the user sees it.

### What to build

**VPS-side: log streaming endpoint**

Add to the VPS Data API (port 5556) or embedding service (port 5555):

```javascript
// SSE endpoint for log streaming
app.get('/api/logs/stream', (req, res) => {
  // Verify auth token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Spawn tail -f on the log file or docker logs --follow
  const { spawn } = require('child_process');
  let logProcess;

  // Detect runtime
  try {
    const dockerCheck = require('child_process').execSync('docker ps -q -f name=openclaw', { encoding: 'utf-8' });
    if (dockerCheck.trim()) {
      // Docker: follow container logs
      logProcess = spawn('docker', ['logs', 'openclaw', '--follow', '--tail', '0', '--timestamps']);
    } else {
      // Native: follow journalctl
      logProcess = spawn('journalctl', ['-u', 'openclaw*', '-f', '--no-pager', '-o', 'short-iso']);
    }
  } catch {
    // Fallback: tail the log file
    logProcess = spawn('tail', ['-f', '/var/log/openclaw/openclaw.log']);
  }

  // Stream each log line as an SSE event
  logProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      res.write(`data: ${JSON.stringify({ line, timestamp: new Date().toISOString() })}\n\n`);
    }
  });

  logProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      res.write(`data: ${JSON.stringify({ line, timestamp: new Date().toISOString(), stderr: true })}\n\n`);
    }
  });

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    logProcess.kill();
  });
});
```

**Dashboard-side: SSE client**

```typescript
// In logs-explorer.tsx, when "Live" mode is active:

const [isLive, setIsLive] = useState(false);

useEffect(() => {
  if (!isLive) return;

  // Connect to VPS log stream via dashboard API proxy
  const eventSource = new EventSource("/api/vps/logs/stream");

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const parsed = parseLogLine(data.line, logs.length + 1);

    // Append to log list (keep max 2000 lines in memory)
    setLogs(prev => {
      const updated = [...prev, parsed];
      return updated.length > 2000 ? updated.slice(-2000) : updated;
    });
  };

  eventSource.onerror = () => {
    // Reconnect with backoff
    setIsLive(false);
    toast.error("Log stream disconnected. Click Live to reconnect.");
  };

  return () => eventSource.close();
}, [isLive]);
```

**Dashboard API proxy:**

```typescript
// GET /api/vps/logs/stream
// Proxies SSE from VPS Data API to the client
// Auth → Pro plan check → get VPS hostname + data_api_token
// Connect to https://${hostname}:5556/api/logs/stream with auth
// Pipe the SSE stream through to the client

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });

  // Get VPS details
  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("hostname, data_api_token, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json({ error: "VPS not available" }, { status: 503 });
  }

  // Proxy SSE from VPS
  const upstream = await fetch(`https://${vps.hostname}:5556/api/logs/stream`, {
    headers: { Authorization: `Bearer ${vps.data_api_token}` },
  });

  // Pipe the response through
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**UI toggle:**
Replace the current "Auto-refresh" toggle with "Live" toggle:
- When Live is ON: SSE streaming, new lines appear instantly, auto-scroll enabled
- When Live is OFF: manual refresh, or poll every 5s (current behavior)
- Live indicator: green pulsing dot + "Live" text when connected

### Files to create
- `src/app/api/vps/logs/stream/route.ts` (SSE proxy)
- VPS Data API: add `/api/logs/stream` endpoint

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — add Live toggle + SSE client

---

## 9.6 FACETED SEARCH (Click to Filter)

### What it is
Click on any value in a log line to instantly filter by it. Click "gateway" in the source column → filter to only gateway logs. Click "error" → filter to errors.

### What to build

In structured log display (from 9.4), make field values clickable:

```typescript
// Each rendered field value becomes a clickable chip:
<span
  className="cursor-pointer hover:bg-primary/10 px-1 rounded text-primary"
  onClick={() => {
    // Add to active filters
    setActiveFilters(prev => [...prev, { field: "source", value: "gateway" }]);
  }}
>
  gateway
</span>

// Active filters bar above log list:
// [source:gateway ×] [level:error ×] [fields.agent:support-bot ×] [Clear all]

// Each filter narrows the displayed logs (client-side for current logs, send to API for historical)
```

**Filter types:**
- Level: `level:error`, `level:warn`
- Source: `source:gateway`, `source:agent:support-bot`
- Field: `fields.agent:support-bot`, `fields.duration:>3000`
- Message: `message:~"connection refused"` (substring)
- Negate: `NOT level:debug` (exclude)

This is a client-side filter on the already-fetched logs. Fast, no API call needed.

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — make values clickable, add filter bar

---

## 9.7 LOG FORWARDING

### What it is
Forward logs to an external service (Datadog, Logtail, custom endpoint) in real-time.

### What to build

**Config (Supabase — small):**
```sql
CREATE TABLE log_forwarding_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_url TEXT NOT NULL, -- HTTPS endpoint
  format TEXT DEFAULT 'json', -- 'json', 'syslog', 'raw'
  headers JSONB DEFAULT '{}', -- custom headers (auth tokens etc)
  filter_levels TEXT[] DEFAULT '{error,warn,info,debug}', -- which levels to forward
  is_enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id) -- one forwarding destination per user
);
```

**On VPS:** The log streaming process (from 9.5) also forwards to the configured endpoint:

```javascript
// In VPS Data API — when a log line is captured:
if (forwardingConfig && forwardingConfig.is_enabled) {
  const shouldForward = forwardingConfig.filter_levels.includes(parsedLog.level);
  if (shouldForward) {
    fetch(forwardingConfig.destination_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardingConfig.headers,
      },
      body: JSON.stringify({
        timestamp: parsedLog.timestamp,
        level: parsedLog.level,
        message: parsedLog.message,
        source: parsedLog.source,
        fields: parsedLog.fields,
      }),
    }).catch(() => {}); // fire-and-forget
  }
}
```

**API:**
```
GET /api/logs/forwarding — get current config
PUT /api/logs/forwarding — set/update config
DELETE /api/logs/forwarding — disable
POST /api/logs/forwarding/test — send a test log to verify endpoint works
```

**UI:** Settings section in Logs Explorer or a dedicated config page:
- Destination URL input
- Format selector (JSON / Syslog / Raw)
- Custom headers (key-value pairs for auth)
- Level filter checkboxes (which levels to forward)
- Enable/disable toggle
- "Test" button

### Files to create
- `src/app/api/logs/forwarding/route.ts`
- VPS Data API: forwarding logic in log stream

---

## 9.8 DASHBOARDS FROM LOGS

### What it is
Generate charts and visualizations from log data. Error count over time, requests per second, top error sources.

### What to build

Add a "Dashboard" tab in Logs Explorer with auto-generated charts:

**Charts (using Recharts):**
1. **Error count over time** — line chart, grouped by hour/day
2. **Log level distribution** — pie chart (error/warn/info/debug split)
3. **Top error sources** — bar chart (which component has the most errors)
4. **Log volume trend** — area chart (total logs per hour/day)
5. **Top patterns** — table of most frequent log patterns (from 9.2) with counts

**Data:** Computed from the fetched logs (client-side), or from VPS Data API for historical data.

**API for historical log analytics:**
```
GET /api/logs/analytics?period=24h|7d|30d
Response: {
  level_distribution: { error: 45, warn: 120, info: 890, debug: 2000 },
  hourly_volume: [{ hour: "10:00", count: 150 }, ...],
  top_sources: [{ source: "gateway", count: 89 }, ...],
  top_errors: [{ message: "Connection refused", count: 23 }, ...],
  error_trend: [{ date: "2026-03-15", errors: 45 }, ...]
}
```

**This requires log persistence on VPS** — currently logs are only Docker/systemd output (no persistence). The VPS Data API (port 5556) should capture and store logs in SQLite. Add a `logs` table:

```sql
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  level TEXT,
  source TEXT,
  message TEXT,
  fields TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
```

The live tail process (9.5) writes each line to this table. Then analytics queries against it.

### Files to create
- Log dashboard component
- `src/app/api/logs/analytics/route.ts`
- VPS Data API: log persistence + analytics queries

---

## 9.9 ANOMALY DETECTION

### What it is
Automatically detect unusual patterns: sudden spike in errors, new error message never seen before, unusual log volume.

### What to build

**Client-side anomaly detection (on fetched logs):**

```typescript
// src/lib/log-anomalies.ts

export interface LogAnomaly {
  type: "spike" | "new_pattern" | "volume_change" | "new_source";
  severity: "high" | "medium" | "low";
  description: string;
  details: Record<string, any>;
  detectedAt: string;
}

export function detectAnomalies(
  currentLogs: StructuredLog[],
  historicalBaseline?: { avgErrorsPerHour: number; knownPatterns: string[]; avgVolumePerHour: number }
): LogAnomaly[] {
  const anomalies: LogAnomaly[] = [];

  // 1. Error spike: significantly more errors than baseline
  if (historicalBaseline) {
    const recentErrors = currentLogs.filter(l => l.level === "error").length;
    const expected = historicalBaseline.avgErrorsPerHour;
    if (recentErrors > expected * 3 && recentErrors > 5) {
      anomalies.push({
        type: "spike",
        severity: "high",
        description: `Error spike detected: ${recentErrors} errors (expected ~${Math.round(expected)})`,
        details: { actual: recentErrors, expected: Math.round(expected), ratio: (recentErrors / expected).toFixed(1) },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // 2. New patterns: error messages never seen before
  if (historicalBaseline?.knownPatterns) {
    const currentPatterns = detectPatterns(currentLogs, 1);
    for (const pattern of currentPatterns) {
      if (pattern.level === "error" && !historicalBaseline.knownPatterns.includes(pattern.template)) {
        anomalies.push({
          type: "new_pattern",
          severity: "medium",
          description: `New error pattern detected: "${pattern.template}"`,
          details: { pattern: pattern.template, count: pattern.count },
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 3. Volume change: significantly more or fewer logs than normal
  if (historicalBaseline) {
    const currentVolume = currentLogs.length;
    const expected = historicalBaseline.avgVolumePerHour;
    if (currentVolume > expected * 5 && currentVolume > 100) {
      anomalies.push({
        type: "volume_change",
        severity: "medium",
        description: `Unusual log volume: ${currentVolume} logs (expected ~${Math.round(expected)})`,
        details: { actual: currentVolume, expected: Math.round(expected) },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}
```

**UI:** Show anomaly alerts at the top of the log viewer:
```
⚠️ 2 anomalies detected
┌────────────────────────────────────────────┐
│ 🔴 Error spike: 45 errors (expected ~8)    │
│    Detected 2 minutes ago                   │
├────────────────────────────────────────────┤
│ 🟡 New error: "Database pool exhausted"    │
│    This pattern hasn't been seen before     │
└────────────────────────────────────────────┘
```

**Historical baseline:** Build from log analytics (9.8). Query average errors/hour and known patterns from the VPS Data API.

### Files to create
- `src/lib/log-anomalies.ts`

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — show anomaly bar

---

## 9.10 LOG CONTEXT (Show Before/After)

### What it is
When clicking on a specific log line (especially an error), show the 10 lines before and after for context. "What happened right before this error?"

### What to build

In the structured log view, when user clicks a log line → expand to show context:

```typescript
// Each log line has an "expand context" button
// Clicking it shows the surrounding lines (10 before, 10 after)
// highlighted differently (dimmer, with a border around the clicked line)

// ┌──────────────────────────────────────────┐
// │ ... (10 lines before)                     │
// │   10:29:58 INFO  Connected to database    │
// │   10:29:59 INFO  Processing request       │
// │   10:30:00 DEBUG Query executed            │
// │ ╔════════════════════════════════════════╗ │  ← clicked line
// │ ║ 10:30:00 ERROR Connection refused      ║ │
// │ ╚════════════════════════════════════════╝ │
// │   10:30:01 WARN  Retrying connection      │
// │   10:30:02 ERROR Retry failed             │
// │   10:30:03 INFO  Failover to backup       │
// │ ... (10 lines after)                      │
// └──────────────────────────────────────────┘
```

Since we already have all the logs in memory (fetched via API), this is purely a UI feature — no API change needed. Just show `logs.slice(index - 10, index + 11)` with the target line highlighted.

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — add context expansion

---

## 9.11 MULTI-LINE LOG SUPPORT

### What it is
Stack traces, JSON payloads, and multi-line error messages should be treated as a single log entry, not multiple lines.

### What to build

In the log parser (9.4), detect multi-line entries:

```typescript
// A new log entry starts with a timestamp or level prefix
// Lines without a prefix are continuation of the previous entry

function mergeMultiLineEntries(lines: string[]): string[] {
  const merged: string[] = [];
  let current = "";

  for (const line of lines) {
    // Check if this line starts a new log entry
    const isNewEntry = /^(\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}|ERROR|WARN|INFO|DEBUG)/i.test(line.trim());

    if (isNewEntry && current) {
      merged.push(current);
      current = line;
    } else if (isNewEntry) {
      current = line;
    } else {
      // Continuation line — append to current
      current += "\n" + line;
    }
  }

  if (current) merged.push(current);
  return merged;
}
```

Stack traces become a single collapsible entry:
```
🔴 ERROR  java.lang.NullPointerException: Cannot invoke method on null
  [▼ Stack trace — 12 lines]
```

Clicking expands the full stack trace within the single log entry.

### Files to modify
- `src/lib/log-parser.ts` — add `mergeMultiLineEntries()` before parsing

---

## 9.12 DATE/TIME RANGE PICKER

### What it is
Instead of "show last 500 lines," let users pick a specific time range: "show logs from 2pm to 3pm yesterday."

### Current state
Only "line count" selector (100/200/500). No time-based filtering.

### What to build

**Requires log persistence on VPS** (from 9.8) — the `logs` table in VPS Data API SQLite stores historical logs with timestamps.

**VPS Data API endpoint:**
```
GET /api/logs?from=2026-03-15T14:00:00Z&to=2026-03-15T15:00:00Z&level=error&limit=500
Response: { logs: [...], total: 1234 }
```

**Dashboard API proxy:**
```typescript
// GET /api/vps/logs/historical?from=...&to=...&level=...&limit=500
// Proxies to VPS Data API /api/logs endpoint
```

**UI — date/time range picker:**

Add a date range selector in the toolbar:

```
┌─────────────────────────────────────────────────────┐
│ [Last 1h] [Last 6h] [Last 24h] [Last 7d] [Custom ▼] │
│                                                       │
│ Custom range picker (opens on "Custom"):              │
│ From: [2026-03-15] [14:00]                           │
│ To:   [2026-03-15] [15:00]                           │
│ [Apply]                                               │
└─────────────────────────────────────────────────────┘
```

Quick presets: Last 1h, 6h, 24h, 7d. Custom with date + time pickers.

When a time range is selected:
- If "Last 1h" and Live is off → fetch from VPS Data API with time range
- If Live is on → time range is ignored (showing real-time)
- Line count selector changes to "Max lines" (cap on results within the time range)

### Files to create
- `src/app/api/vps/logs/historical/route.ts` (proxy to VPS Data API)
- VPS Data API: `/api/logs` with time range query params

### Files to modify
- `src/components/dashboard/logs-explorer.tsx` — add date range picker, use historical endpoint when range is set

---

## BUILD ORDER

```
PHASE 1 — Foundation (enables other features):
  9.4  Structured/Parsed Logs (new parser — all features use it)
  9.11 Multi-line Log Support (part of parser)
  9.5  Live Tail (true streaming — needed for real-time features)

PHASE 2 — Core Features:
  9.1  Saved Searches/Views (quick win, high usability)
  9.6  Faceted Search (click-to-filter, uses structured logs)
  9.12 Date/Time Range Picker (needs log persistence on VPS)

PHASE 3 — Intelligence:
  9.2  Log Patterns/Clustering (client-side, uses structured logs)
  9.3  Log Alerting (needs pattern detection + cron)
  9.9  Anomaly Detection (needs patterns + baseline)
  9.10 Log Context (UI-only, quick)

PHASE 4 — Advanced:
  9.7  Log Forwarding (needs VPS config)
  9.8  Dashboards from Logs (needs log persistence + analytics)
```

Phase 1 is required first — the structured parser is the foundation for patterns, faceting, anomaly detection, and alerting.
