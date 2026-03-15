# Audit Log Enhancement — Full Implementation Guide

**Owner:** Plan 129 Agent
**Referenced from:** `TODO_129_PRO.md` Section 11
**Total features:** 12
**Last updated:** 2026-03-15

---

## CONTEXT: Current Audit Log Architecture

**How audit logging currently works:**

```
Any action in the dashboard (KB upload, webhook create, API key create, etc.)
  → API route calls logAudit() from src/lib/audit-log.ts
  → logAudit() inserts into Supabase audit_logs table (non-blocking, fire-and-forget)
  → Record: user_id, action, category, entity_type, entity_id, details (JSON), ip_address, actor_type

User opens /dashboard/audit-log → audit-log-viewer.tsx
  → calls GET /api/audit-log?page=1&limit=50&category=&search=
  → API: auth → Pro plan check → rate limit → query Supabase with filters
  → Returns paginated results
  → Frontend: table with category badges, search, filter, CSV export (current page only)
```

**Key files:**
- `src/lib/audit-log.ts` — `logAudit()` function + `getClientIp()` helper
- `src/app/api/audit-log/route.ts` — GET endpoint with pagination/filtering
- `src/components/dashboard/audit-log-viewer.tsx` — UI component

**Current `logAudit()` function:**
```typescript
export async function logAudit(params: {
  userId: string;
  action: string;
  category: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  actorType?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: params.userId,
      action: params.action,
      category: params.category,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details || {},
      ip_address: params.ipAddress,
      actor_type: params.actorType || "user",
    });
  } catch {
    console.warn("[audit] Failed to log audit event");
  }
}
```

**Current audit_logs table schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  category TEXT,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  actor_type TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Current categories:** auth, vps, agent, model, api_key, account, knowledge_base, webhook

**Data architecture:** Audit logs will move to VPS (per data architecture decision). For now, Supabase. Build features against current schema — they'll work the same after migration.

---

## 11.1 SIEM LOG STREAMING

### What it is
Push audit log events in real-time to external Security Information and Event Management systems — Datadog, Splunk, AWS S3, or any HTTP endpoint. Enterprise customers need this for centralized security monitoring.

### Current state
Audit logs only exist in our database. No way to stream them externally. Enterprise customers can't integrate with their security stack.

### What to build

**Database (Supabase — small config):**
```sql
CREATE TABLE audit_log_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination_type TEXT NOT NULL, -- 'http', 'datadog', 'splunk', 'aws_s3'
  config JSONB NOT NULL,
  -- http: { url: "https://...", headers: { "Authorization": "Bearer ..." }, method: "POST" }
  -- datadog: { api_key: "...", site: "datadoghq.com" }
  -- splunk: { hec_url: "https://...", hec_token: "..." }
  -- aws_s3: { bucket: "...", region: "...", access_key: "...", secret_key: "...", prefix: "audit/" }
  format TEXT DEFAULT 'json', -- 'json', 'cef' (Common Event Format), 'leef' (Log Event Extended Format)
  filter_categories TEXT[], -- null = all categories, or specific ones
  is_enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Streaming logic — update `logAudit()` to also stream:**

```typescript
// src/lib/audit-log.ts — updated

export async function logAudit(params: AuditLogParams): Promise<void> {
  const admin = createAdminClient();

  // 1. Insert to database (existing behavior)
  const { data: record } = await admin.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    category: params.category,
    entity_type: params.entityType,
    entity_id: params.entityId,
    details: params.details || {},
    ip_address: params.ipAddress,
    actor_type: params.actorType || "user",
  }).select().single().catch(() => ({ data: null }));

  if (!record) return;

  // 2. Stream to configured destinations (fire-and-forget)
  streamAuditEvent(params.userId, record).catch(() => {});
}

async function streamAuditEvent(userId: string, event: AuditLogRecord): Promise<void> {
  const admin = createAdminClient();

  // Get user's active log streams
  const { data: streams } = await admin
    .from("audit_log_streams")
    .select("*")
    .eq("user_id", userId)
    .eq("is_enabled", true);

  if (!streams?.length) return;

  for (const stream of streams) {
    // Check category filter
    if (stream.filter_categories?.length > 0 &&
        !stream.filter_categories.includes(event.category)) {
      continue; // skip — this category is filtered out
    }

    try {
      await deliverToStream(stream, event);

      // Update last_sent_at, reset error count
      await admin.from("audit_log_streams").update({
        last_sent_at: new Date().toISOString(),
        error_count: 0,
        last_error: null,
      }).eq("id", stream.id);
    } catch (err) {
      // Increment error count
      const newCount = (stream.error_count || 0) + 1;
      await admin.from("audit_log_streams").update({
        error_count: newCount,
        last_error: err instanceof Error ? err.message : "Unknown error",
      }).eq("id", stream.id);

      // Auto-disable after 50 consecutive errors
      if (newCount >= 50) {
        await admin.from("audit_log_streams").update({
          is_enabled: false,
          last_error: "Auto-disabled after 50 consecutive failures",
        }).eq("id", stream.id);
      }
    }
  }
}

async function deliverToStream(stream: AuditLogStream, event: AuditLogRecord): Promise<void> {
  const payload = formatEvent(event, stream.format);

  switch (stream.destination_type) {
    case "http": {
      const config = stream.config as { url: string; headers?: Record<string, string>; method?: string };
      const response = await fetch(config.url, {
        method: config.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.headers || {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      break;
    }

    case "datadog": {
      const config = stream.config as { api_key: string; site?: string };
      const site = config.site || "datadoghq.com";
      await fetch(`https://http-intake.logs.${site}/api/v2/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": config.api_key,
        },
        body: JSON.stringify([{
          ddsource: "clawhq",
          ddtags: `category:${event.category},action:${event.action}`,
          hostname: "clawhq",
          message: JSON.stringify(payload),
          service: "audit-log",
        }]),
        signal: AbortSignal.timeout(10000),
      });
      break;
    }

    case "splunk": {
      const config = stream.config as { hec_url: string; hec_token: string };
      await fetch(config.hec_url, {
        method: "POST",
        headers: {
          "Authorization": `Splunk ${config.hec_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: payload,
          sourcetype: "clawhq:audit",
          source: "clawhq-audit-log",
        }),
        signal: AbortSignal.timeout(10000),
      });
      break;
    }

    case "aws_s3": {
      // For S3: batch events and write periodically, not per-event
      // Store in a buffer, flush every 5 minutes via cron
      // Each file: {prefix}/{date}/{hour}/{uuid}.json
      // Implementation: queue the event, cron flushes to S3
      // This is more complex — consider using the generic HTTP destination
      // to an AWS Lambda that writes to S3 instead
      break;
    }
  }
}

function formatEvent(event: AuditLogRecord, format: string): Record<string, any> {
  switch (format) {
    case "cef":
      // Common Event Format (for SIEM systems)
      return {
        cef_version: "0",
        device_vendor: "ClawHQ",
        device_product: "AuditLog",
        device_version: "1.0",
        signature_id: event.action,
        name: `${event.category}:${event.action}`,
        severity: getSeverity(event.action),
        extension: {
          src: event.ip_address,
          suser: event.actor_type,
          duser: event.user_id,
          msg: JSON.stringify(event.details),
          rt: event.created_at,
        },
      };

    case "json":
    default:
      return {
        id: event.id,
        timestamp: event.created_at,
        action: event.action,
        category: event.category,
        actor: {
          type: event.actor_type,
          user_id: event.user_id,
          ip_address: event.ip_address,
        },
        target: {
          type: event.entity_type,
          id: event.entity_id,
        },
        details: event.details,
        source: "clawhq",
      };
  }
}

function getSeverity(action: string): number {
  // CEF severity 0-10
  if (action.includes("delete") || action.includes("revoke")) return 7;
  if (action.includes("create") || action.includes("deploy")) return 3;
  if (action.includes("login") || action.includes("auth")) return 5;
  return 3; // default
}
```

**API endpoints for managing streams:**

```typescript
// GET /api/audit-log/streams — list user's log streams
// Auth → Pro plan check
// Response: { streams: [{ id, name, destination_type, config (masked), is_enabled, last_sent_at, error_count, last_error }] }

// POST /api/audit-log/streams — create stream (max 3 per user)
// Body: { name, destination_type, config, format, filter_categories }
// Validate destination_type is one of: http, datadog, splunk, aws_s3
// Validate config has required fields per destination type
// Return: { stream: { id, ... } }

// PATCH /api/audit-log/streams/[id] — update stream
// Body: { name?, config?, format?, filter_categories?, is_enabled? }

// DELETE /api/audit-log/streams/[id] — delete stream

// POST /api/audit-log/streams/[id]/test — send a test event
// Sends a synthetic audit event to the configured destination
// Returns: { success: true, response_time_ms: 230 } or { success: false, error: "..." }
```

**UI in Audit Log page — "Streams" tab:**

```
┌──────────────────────────────────────────────────────────┐
│ Log Streams                              [+ Add Stream]   │
├──────────────────────────────────────────────────────────┤
│ 🟢 Datadog Production        datadog    [Test] [Edit] [⋮] │
│    Last sent: 2 min ago · 0 errors                        │
├──────────────────────────────────────────────────────────┤
│ 🔴 Splunk Backup            splunk     [Test] [Edit] [⋮] │
│    Last error: Connection refused · 12 errors             │
│    Auto-disabled — click to re-enable                     │
└──────────────────────────────────────────────────────────┘

// "Add Stream" dialog:
// 1. Name input
// 2. Destination type selector: HTTP Endpoint / Datadog / Splunk / AWS S3
// 3. Config fields change per type:
//    - HTTP: URL, Headers (key-value pairs), Method (POST/PUT)
//    - Datadog: API Key, Site (datadoghq.com / datadoghq.eu)
//    - Splunk: HEC URL, HEC Token
//    - AWS S3: Bucket, Region, Access Key, Secret Key, Prefix
// 4. Format selector: JSON / CEF
// 5. Category filter: checkboxes for each category (or "All")
// 6. Enable/disable toggle
// 7. "Test Connection" button before saving
```

**Credential security:** Config fields containing secrets (api_key, hec_token, secret_key) should be encrypted before storage using `src/lib/crypto.ts`. Mask in GET responses (show last 4 chars only).

### Files to create
- `src/app/api/audit-log/streams/route.ts` (GET, POST)
- `src/app/api/audit-log/streams/[id]/route.ts` (PATCH, DELETE)
- `src/app/api/audit-log/streams/[id]/test/route.ts` (POST)

### Files to modify
- `src/lib/audit-log.ts` — add `streamAuditEvent()` after insert
- `src/components/dashboard/audit-log-viewer.tsx` — add "Streams" tab

---

## 11.2 IMMUTABLE / TAMPER-PROOF LOGS

### What it is
Once an audit log is written, it cannot be modified or deleted — even by admins. Each entry has a cryptographic hash linking to the previous entry, creating a verifiable chain. If any entry is modified, the chain breaks.

### Current state
Logs are regular database rows. Anyone with admin access could modify or delete them. No integrity verification.

### What to build

**Hash chain:**

Each audit log entry includes a hash of: `previous_entry_hash + current_entry_data`. This creates an immutable chain — if any entry is modified, all subsequent hashes become invalid.

```sql
-- Add hash columns to audit_logs
ALTER TABLE audit_logs ADD COLUMN entry_hash TEXT;
ALTER TABLE audit_logs ADD COLUMN previous_hash TEXT;
```

**Update `logAudit()` to compute hash:**

```typescript
import crypto from "crypto";

export async function logAudit(params: AuditLogParams): Promise<void> {
  const admin = createAdminClient();

  // Get the hash of the most recent entry for this user
  const { data: lastEntry } = await admin
    .from("audit_logs")
    .select("entry_hash")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const previousHash = lastEntry?.entry_hash || "GENESIS"; // first entry has no predecessor

  // Create the entry data
  const entryData = {
    user_id: params.userId,
    action: params.action,
    category: params.category,
    entity_type: params.entityType || null,
    entity_id: params.entityId || null,
    details: params.details || {},
    ip_address: params.ipAddress || null,
    actor_type: params.actorType || "user",
    created_at: new Date().toISOString(),
  };

  // Compute hash: SHA-256(previousHash + JSON(entryData))
  const entryHash = crypto
    .createHash("sha256")
    .update(previousHash + JSON.stringify(entryData))
    .digest("hex");

  // Insert with hash chain
  const { data: record } = await admin.from("audit_logs").insert({
    ...entryData,
    entry_hash: entryHash,
    previous_hash: previousHash,
  }).select().single().catch(() => ({ data: null }));

  if (!record) return;

  // Stream to external destinations
  streamAuditEvent(params.userId, record).catch(() => {});
}
```

**Verification endpoint:**

```typescript
// GET /api/audit-log/verify
// Verifies the integrity of the hash chain
// Reads all entries in order, recomputes each hash, checks chain consistency
// Response:
// { verified: true, entries_checked: 1234, chain_intact: true }
// OR
// { verified: false, entries_checked: 1234, chain_broken_at: { id: "...", expected_hash: "...", actual_hash: "..." } }

export async function GET(request: NextRequest) {
  // Auth + Pro plan check
  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("audit_logs")
    .select("id, entry_hash, previous_hash, user_id, action, category, entity_type, entity_id, details, ip_address, actor_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!entries?.length) {
    return NextResponse.json({ verified: true, entries_checked: 0, chain_intact: true });
  }

  let previousHash = "GENESIS";
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Verify previous_hash links correctly
    if (entry.previous_hash !== previousHash) {
      return NextResponse.json({
        verified: false,
        entries_checked: i + 1,
        chain_broken_at: {
          id: entry.id,
          index: i,
          expected_previous_hash: previousHash,
          actual_previous_hash: entry.previous_hash,
        },
      });
    }

    // Recompute hash from entry data
    const entryData = {
      user_id: entry.user_id,
      action: entry.action,
      category: entry.category,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      details: entry.details,
      ip_address: entry.ip_address,
      actor_type: entry.actor_type,
      created_at: entry.created_at,
    };

    const expectedHash = crypto
      .createHash("sha256")
      .update(previousHash + JSON.stringify(entryData))
      .digest("hex");

    if (entry.entry_hash !== expectedHash) {
      return NextResponse.json({
        verified: false,
        entries_checked: i + 1,
        chain_broken_at: {
          id: entry.id,
          index: i,
          expected_hash: expectedHash,
          actual_hash: entry.entry_hash,
          message: "Entry data has been modified after creation",
        },
      });
    }

    previousHash = entry.entry_hash;
  }

  return NextResponse.json({
    verified: true,
    entries_checked: entries.length,
    chain_intact: true,
    last_hash: previousHash,
  });
}
```

**UI — verification badge:**

In the audit log viewer header:
```
Audit Log        🔒 Integrity: Verified (1,234 entries) [Re-verify]
```

Green lock + "Verified" when chain is intact. Red warning if broken. "Re-verify" button runs the check.

**Note:** With hash chain, entries CANNOT be deleted (it would break the chain). The only way to "clean up" is to verify the chain, then archive old entries (keeping the chain metadata).

### Files to create
- `src/app/api/audit-log/verify/route.ts`

### Files to modify
- `src/lib/audit-log.ts` — add hash chain computation
- `src/components/dashboard/audit-log-viewer.tsx` — add verification badge
- Migration for `entry_hash` + `previous_hash` columns

---

## 11.3 FULL EXPORT (All Pages)

### What it is
Export ALL audit log entries, not just the current page. CSV and JSON formats.

### Current state
"Export Page" button only exports the current 50 entries. Users with 1000+ entries need to click through 20 pages.

### What to build

**API endpoint:**

```typescript
// POST /api/audit-log/export
// Body: {
//   format: "csv" | "json",
//   filters: { category?, search?, dateFrom?, dateTo? }, // same filters as the viewer
//   includeDetails: boolean // include full details JSON column (can be large)
// }
// Response: streaming download

export async function POST(request: NextRequest) {
  // Auth + Pro plan check + rate limit (2/min — exports are heavy)

  const { format, filters, includeDetails } = await request.json();

  // Query ALL matching entries (no pagination)
  const query = admin
    .from("audit_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.category) query.eq("category", filters.category);
  if (filters?.dateFrom) query.gte("created_at", filters.dateFrom);
  if (filters?.dateTo) query.lte("created_at", filters.dateTo);
  if (filters?.search) query.ilike("action", `%${filters.search}%`);

  // Limit to 10,000 entries max per export
  query.limit(10000);

  const { data: entries } = await query;
  if (!entries?.length) {
    return NextResponse.json({ error: "No entries to export" }, { status: 404 });
  }

  if (format === "csv") {
    const csvHeader = "Timestamp,Action,Category,Entity Type,Entity ID,Actor,IP Address" +
      (includeDetails ? ",Details" : "");

    const csvRows = entries.map(e => {
      const row = [
        e.created_at,
        csvSafe(e.action),
        csvSafe(e.category),
        csvSafe(e.entity_type || ""),
        csvSafe(e.entity_id || ""),
        csvSafe(e.actor_type || "user"),
        csvSafe(e.ip_address || ""),
      ];
      if (includeDetails) row.push(csvSafe(JSON.stringify(e.details)));
      return row.join(",");
    });

    const csv = csvHeader + "\n" + csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (format === "json") {
    const jsonData = entries.map(e => ({
      id: e.id,
      timestamp: e.created_at,
      action: e.action,
      category: e.category,
      entity: { type: e.entity_type, id: e.entity_id },
      actor: { type: e.actor_type, ip: e.ip_address },
      ...(includeDetails ? { details: e.details } : {}),
      integrity: { hash: e.entry_hash, previous_hash: e.previous_hash },
    }));

    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  }
}

// CSV injection protection
function csvSafe(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

**UI change:**

Replace the current "Export Page" button with a dropdown:
```
[Export ▼]
  ├── Export Current Page (CSV)
  ├── Export All (CSV)           ← new
  ├── Export All (JSON)          ← new
  └── Export with Details (JSON) ← new (includes full details column)
```

Show a loading spinner: "Exporting 2,345 entries..." during download.

### Files to create
- `src/app/api/audit-log/export/route.ts`

### Files to modify
- `src/components/dashboard/audit-log-viewer.tsx` — replace export button with dropdown

---

## 11.4 AUDIT LOG API (Programmatic Access)

### What it is
V1 API endpoint for reading audit logs programmatically. Enterprise customers need to pull audit data into their own systems.

### What to build

```typescript
// GET /api/v1/audit-log
// Auth: API key (same as other V1 endpoints)
// Query params: category, action, entity_type, entity_id, from, to, limit (max 100), cursor
// Response:
{
  "entries": [
    {
      "id": "uuid",
      "timestamp": "2026-03-15T10:30:00Z",
      "action": "webhook.created",
      "category": "webhook",
      "actor": { "type": "user", "ip": "1.2.3.4" },
      "target": { "type": "webhook", "id": "uuid" },
      "details": { "url": "https://...", "events": ["message.received"] },
      "integrity": { "hash": "abc123...", "verified": true }
    }
  ],
  "pagination": {
    "cursor": "next-cursor-value",
    "has_more": true
  }
}
```

**Cursor-based pagination** (not offset-based — more efficient for large datasets):

```typescript
export async function GET(request: NextRequest) {
  // Validate API key (same as v1/chat)
  // ... key validation ...

  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const action = params.get("action");
  const entityType = params.get("entity_type");
  const entityId = params.get("entity_id");
  const from = params.get("from");
  const to = params.get("to");
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const cursor = params.get("cursor"); // cursor is the created_at of the last entry

  let query = admin
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch 1 extra to check has_more

  if (category) query = query.eq("category", category);
  if (action) query = query.ilike("action", `%${action}%`);
  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (cursor) query = query.lt("created_at", cursor); // entries before cursor

  const { data: entries } = await query;

  const hasMore = entries && entries.length > limit;
  const results = (entries || []).slice(0, limit);
  const nextCursor = hasMore ? results[results.length - 1].created_at : null;

  return NextResponse.json({
    entries: results.map(formatAuditEntry),
    pagination: {
      cursor: nextCursor,
      has_more: hasMore,
    },
  }, {
    headers: {
      ...rateLimitHeaders,
      "X-Request-Id": requestId,
    },
  });
}
```

**Rate limit:** 30/min (audit log API is read-heavy).

**Add to API docs page** (interactive docs from Feature 7): show the audit log endpoint with filters, pagination, example response.

**Add to SDKs** (Feature 7.9): `client.auditLog.list({ category: "webhook", limit: 50 })`

### Files to create
- `src/app/api/v1/audit-log/route.ts`

### Files to modify
- API docs component — add audit log endpoint documentation

---

## 11.5 REAL-TIME AUDIT LOG STREAM

### What it is
Live tail for audit events — see new entries appear as they happen, without refreshing.

### Current state
Manual refresh only. User clicks "Refresh" or waits for page reload.

### What to build

**Same SSE pattern as live log tail (9.5):**

When audit events happen (via `logAudit()`), broadcast to the user's audit stream.

**Option A — Supabase Realtime (simplest):**

Since audit logs are in Supabase, use Supabase Realtime to subscribe to new inserts:

```typescript
// In audit-log-viewer.tsx:
const [isLive, setIsLive] = useState(false);

useEffect(() => {
  if (!isLive) return;

  const supabase = createClient();
  const channel = supabase
    .channel("audit-live")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // New audit entry — prepend to list
        setEntries(prev => [payload.new as AuditLogEntry, ...prev].slice(0, 200));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [isLive, userId]);
```

**Option B — VPS SSE (when audit moves to VPS):**
After migration, the VPS Data API streams new audit entries via SSE, same pattern as log live tail.

**UI:** Add "Live" toggle next to the refresh button. Green pulsing dot when active. New entries slide in from the top with a brief highlight animation.

### Files to modify
- `src/components/dashboard/audit-log-viewer.tsx` — add live toggle + Supabase Realtime subscription

---

## 11.6 RETENTION POLICIES

### What it is
Configurable retention: automatically delete audit logs older than X days. Options: 30, 90, 180, 365 days, or unlimited.

### Current state
All logs kept forever. No cleanup. Database grows indefinitely.

### What to build

**User config (Supabase):**
```sql
ALTER TABLE users ADD COLUMN audit_retention_days INTEGER DEFAULT 365;
-- null = unlimited
-- 30, 90, 180, 365 are standard options
```

**Cron endpoint:**
```typescript
// GET /api/cron/audit-cleanup
// Runs daily
// For each user with a retention policy:
// Delete entries older than retention_days
// BUT: don't delete if hash chain verification is pending (keep last verified hash)

export async function GET() {
  const admin = createAdminClient();

  const { data: users } = await admin
    .from("users")
    .select("id, audit_retention_days")
    .not("audit_retention_days", "is", null);

  let totalDeleted = 0;

  for (const user of users || []) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - user.audit_retention_days);

    // Delete old entries
    // Note: this breaks the hash chain for deleted entries
    // Keep the LAST entry before cutoff as a "chain anchor"
    const { count } = await admin
      .from("audit_logs")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .lt("created_at", cutoff.toISOString());

    totalDeleted += count || 0;
  }

  return NextResponse.json({ deleted: totalDeleted });
}
```

**Hash chain consideration:** Deleting old entries breaks the hash chain. Solutions:
1. Keep a "chain anchor" — the last entry before the retention cutoff, with its hash
2. Store a "chain summary" when pruning: `{ last_pruned_hash, pruned_at, entries_removed }`
3. Verification starts from the anchor, not from GENESIS

**UI — Settings:**
In account settings or audit log settings:
```
Audit Log Retention: [365 days ▼]
Options: 30 days, 90 days, 180 days, 365 days, Unlimited
"Logs older than this will be automatically deleted."
```

### Files to create
- `src/app/api/cron/audit-cleanup/route.ts`

### Files to modify
- Account settings UI — add retention dropdown
- Migration for `audit_retention_days` column

---

## 11.7 WEBHOOK ON AUDIT EVENTS

### What it is
Push audit events to a webhook endpoint as they happen — same as the SIEM streaming (11.1) but using the existing webhook infrastructure.

### Current state
Audit events only go to the database. Users can't get notified when specific actions happen.

### What to build

**Add new audit event types to the webhook system:**

In `src/lib/webhook-dispatch.ts`, the existing `dispatchWebhooks()` function can handle this. Just add new event types:

```typescript
// New event types:
// "audit.security" — login, password change, key creation/revocation
// "audit.data" — KB upload/delete, agent deploy/undeploy
// "audit.admin" — VPS actions, model changes, channel changes

// In logAudit(), after inserting the record:
const auditWebhookEvent = mapCategoryToWebhookEvent(params.category);
if (auditWebhookEvent) {
  dispatchWebhooks(params.userId, auditWebhookEvent, {
    action: params.action,
    category: params.category,
    entity_type: params.entityType,
    entity_id: params.entityId,
    details: params.details,
    ip_address: params.ipAddress,
    timestamp: new Date().toISOString(),
  }).catch(() => {});
}

function mapCategoryToWebhookEvent(category: string): string | null {
  switch (category) {
    case "auth":
    case "account":
    case "api_key":
      return "audit.security";
    case "knowledge_base":
    case "agent":
      return "audit.data";
    case "vps":
    case "model":
    case "webhook":
      return "audit.admin";
    default:
      return null;
  }
}
```

**Update webhook AVAILABLE_EVENTS:**
Add `audit.security`, `audit.data`, `audit.admin` to the events list in the webhook UI and API validation.

### Files to modify
- `src/lib/audit-log.ts` — dispatch webhook after logging
- `src/lib/webhook-dispatch.ts` — no change needed (already handles any event type)
- `src/components/dashboard/webhooks-manager.tsx` — add audit events to AVAILABLE_EVENTS
- Webhook API validation — add new event types to `validEvents`

---

## 11.8 ADMIN PORTAL (Self-Service Log Access for Customer's IT Team)

### What it is
Enterprise customers' IT admins can access and configure audit logs without going through ClawHQ support. Self-service portal.

### What to build

**This is a V2/Enterprise feature.** For now, note the design:

- Separate login for customer IT admins (ties into Team Access from V2_FEATURES.md)
- Read-only access to audit logs with export
- Configure SIEM streams
- Set retention policies
- View integrity verification status
- Cannot modify logs or account settings

**Skip for now.** Add to V2_FEATURES.md.

### Files to modify
- `tasks/V2_FEATURES.md` — add admin portal spec

---

## 11.9 DATE RANGE FILTER

### What it is
Filter audit logs by date/time range. Currently only search text and category filters exist.

### Current state
No date filtering. Users see most recent first with pagination, but can't jump to "what happened last Tuesday."

### What to build

**API change:**

Add `from` and `to` query params to `GET /api/audit-log`:

```typescript
// In audit-log/route.ts:
const from = params.get("from"); // ISO date string
const to = params.get("to");     // ISO date string

if (from) query = query.gte("created_at", from);
if (to) query = query.lte("created_at", to);
```

**UI — date range picker:**

Add above the audit log table, next to the category filter and search:

```
[Category ▼] [Search...] [From: 📅] [To: 📅] [Quick: Last 24h | 7d | 30d | All]
```

Use shadcn's `<DatePicker>` or `<Calendar>` component. Quick presets as clickable chips.

When a date range is selected:
- Fetch filtered results from API
- Show "Showing logs from Mar 10 to Mar 15" indicator
- Pagination within the filtered range

### Files to modify
- `src/app/api/audit-log/route.ts` — add from/to params
- `src/components/dashboard/audit-log-viewer.tsx` — add date picker + quick presets

---

## 11.10 ACTOR DETAILS (Enhanced)

### What it is
Richer information about WHO performed the action — not just "user" and an IP, but user name, email, device type, approximate location.

### Current state
Only `actor_type` ("user" or "system") and `ip_address`. No name, no device, no location.

### What to build

**Enhance `logAudit()` to capture more context:**

```typescript
export async function logAudit(params: AuditLogParams & {
  request?: NextRequest;  // pass the request object for headers
}): Promise<void> {
  let deviceInfo: string | null = null;
  let userAgent: string | null = null;

  if (params.request) {
    userAgent = params.request.headers.get("user-agent");
    deviceInfo = parseUserAgent(userAgent);
  }

  // Existing insert + add new fields
  await admin.from("audit_logs").insert({
    ...existingFields,
    user_agent: userAgent,
    device_info: deviceInfo,
    // Location from IP (if we add a geo-IP lookup):
    // location: await geoLookup(ipAddress), // optional — adds latency
  });
}

function parseUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  // Simple parsing — extract OS and browser
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Android")) return "Android";
  return "Unknown";
}
```

**DB changes:**
```sql
ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN device_info TEXT;
```

**UI — enhanced actor display:**

In the audit log table, the "Actor" column shows:
```
Before: "user · 1.2.3.4"
After:  "john@example.com · macOS · 1.2.3.4"
```

Click to expand full details: user agent string, device, IP.

**Note:** Getting the user's name/email requires a join with the `users` table. Add to the API query:
```typescript
// In audit-log/route.ts:
const query = admin
  .from("audit_logs")
  .select("*, users!inner(name, email)")  // join users table
  .eq("user_id", user.id);
```

### Files to modify
- `src/lib/audit-log.ts` — accept request object, parse user agent
- `src/app/api/audit-log/route.ts` — join users table for name/email
- `src/components/dashboard/audit-log-viewer.tsx` — enhanced actor column
- Migration for new columns
- All routes that call `logAudit()` — pass `request` object

---

## 11.11 EVENT DETAIL EXPANSION

### What it is
Click on any audit log entry to expand and see the full details JSON in a structured, readable format.

### Current state
The `details` column is truncated in the table. No way to see the full data.

### What to build

**Expandable row or slide-out panel:**

```
┌──────────────────────────────────────────────────────────────┐
│ 10:30:00  webhook.created  [webhook]  john@ex...  1.2.3.4   │
├──────────────────────────────────────────────────────────────┤
│ ▼ Details                                                     │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Action:      webhook.created                              │  │
│ │ Category:    webhook                                      │  │
│ │ Entity:      webhook · whk_abc123                         │  │
│ │ Actor:       john@example.com (user) · macOS · 1.2.3.4   │  │
│ │ Timestamp:   2026-03-15 10:30:00 UTC                     │  │
│ │                                                           │  │
│ │ Changes:                                                  │  │
│ │   url: "https://hooks.slack.com/services/..."             │  │
│ │   events: ["message.received", "agent.deployed"]          │  │
│ │   description: "Slack notifications"                      │  │
│ │                                                           │  │
│ │ Integrity:                                                │  │
│ │   Hash: abc123def456...                                   │  │
│ │   Previous: xyz789abc012...                               │  │
│ │   ✅ Chain verified                                       │  │
│ └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Two display options:**

1. **Inline expansion:** Click row → expands below the row with details panel. Compact. Good for quick glances.

2. **Slide-out sheet:** Click row → shadcn Sheet slides from right with full details. Better for complex entries with lots of detail data.

**Recommendation:** Inline expansion for simple entries (few detail fields), sheet for complex entries. Or always use inline — simpler to build.

**Implementation:**

```typescript
// In audit-log-viewer.tsx:
const [expandedId, setExpandedId] = useState<string | null>(null);

// In the table row:
<tr onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
  {/* ... regular columns ... */}
</tr>
{expandedId === entry.id && (
  <tr>
    <td colSpan={7}>
      <div className="p-4 bg-muted/30 rounded-lg mx-2 my-1">
        <h4 className="text-sm font-medium mb-2">Event Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Action:</span> {entry.action}</div>
          <div><span className="text-muted-foreground">Category:</span> {entry.category}</div>
          {/* ... more fields ... */}
        </div>
        {entry.details && Object.keys(entry.details).length > 0 && (
          <>
            <h4 className="text-sm font-medium mt-3 mb-2">Changes</h4>
            <pre className="text-xs bg-card p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </>
        )}
        {entry.entry_hash && (
          <>
            <h4 className="text-sm font-medium mt-3 mb-2">Integrity</h4>
            <div className="text-xs text-muted-foreground font-mono">
              Hash: {entry.entry_hash.substring(0, 16)}...
              {/* Could add inline verification for this single entry */}
            </div>
          </>
        )}
      </div>
    </td>
  </tr>
)}
```

**Structured details display:**

Instead of raw JSON, parse known detail shapes into readable key-value pairs:
- Webhook created: show URL, events, description
- API key created: show key name (masked)
- Agent deployed: show agent name, model
- KB uploaded: show filename, size, chunk count

Unknown shapes: fall back to formatted JSON with syntax highlighting.

### Files to modify
- `src/components/dashboard/audit-log-viewer.tsx` — add expandable rows + detail rendering

---

## 11.12 COMPLIANCE REPORT GENERATION

### What it is
Generate formatted compliance reports (SOC 2, GDPR) from audit log data. One-click export for audit reviews.

### What to build

**This is primarily a formatted export** — same data as 11.3 (Full Export) but structured for compliance:

**SOC 2 Report format:**
```
ClawHQ Audit Report
Generated: 2026-03-15
Period: 2026-02-15 to 2026-03-15

Account: john@example.com
Plan: Pro ($129/mo)

SUMMARY:
- Total audit events: 1,234
- Security events (auth/api_key): 89
- Data events (KB/agent): 456
- Admin events (VPS/model): 234
- Integrity: Chain verified ✅

ACCESS CONTROL:
- Login events: 45 (all successful)
- Password changes: 2
- API key creations: 3
- API key revocations: 1

DATA HANDLING:
- Documents uploaded: 12
- Documents deleted: 2
- Agents deployed: 5
- Agents undeployed: 1

INFRASTRUCTURE:
- VPS restarts: 3
- Model changes: 1
- Channel connects: 4
- Channel disconnects: 0

FULL EVENT LOG:
[... all entries in chronological order ...]
```

**API endpoint:**

```typescript
// POST /api/audit-log/compliance-report
// Body: {
//   format: "soc2" | "gdpr" | "general",
//   period: { from: "2026-02-15", to: "2026-03-15" },
//   outputFormat: "json" | "pdf" | "markdown"
// }
// Returns: formatted report as downloadable file

// For PDF: generate markdown first, then convert with a library
// For simplicity v1: return markdown that can be copied or downloaded
```

**GDPR Report additions:**
- Data access events
- Data deletion events
- Data export events
- Consent changes (if applicable)
- Cross-border data transfers (not applicable for ClawHQ — user data on their VPS)

**UI:**

"Generate Report" button in audit log viewer:
```
[Generate Report ▼]
  ├── SOC 2 Audit Report
  ├── GDPR Data Processing Report
  └── General Activity Report
```

Opens dialog: select period (from/to dates), preview summary stats, download.

### Files to create
- `src/app/api/audit-log/compliance-report/route.ts`
- Report generation utility

### Files to modify
- `src/components/dashboard/audit-log-viewer.tsx` — add report generation button

---

## BUILD ORDER

```
PHASE 1 — Core Improvements (do first):
  11.2  Immutable/Tamper-Proof Logs (add hash chain — affects all future entries)
  11.9  Date Range Filter (quick win, high usability)
  11.10 Actor Details (enhanced logAudit — affects all future entries)
  11.11 Event Detail Expansion (UI-only, quick)
  11.3  Full Export (replace current limited export)

PHASE 2 — Enterprise Features:
  11.1  SIEM Log Streaming (biggest enterprise requirement)
  11.4  Audit Log API (programmatic access for V1 API)
  11.7  Webhook on Audit Events (uses existing webhook infrastructure)
  11.5  Real-Time Stream (Supabase Realtime subscription)

PHASE 3 — Compliance:
  11.6  Retention Policies (cron + config)
  11.12 Compliance Report Generation (formatted exports)

SKIP for now:
  11.8  Admin Portal (V2/Enterprise — needs Team Access first)
```

Phase 1 changes how data is stored (hash chain, actor details) — do first so all future entries have the enhanced format.
