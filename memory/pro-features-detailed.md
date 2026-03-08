# Pro Features — Detailed Build Reference

> This file is my personal reference for building each Pro feature.
> Read this before starting ANY feature. Updated after each feature is completed.

---

## Build Order (Agreed with User + Senior Review)
1. **Knowledge Base (RAG)** — THE Pro differentiator, justifies $70 price jump
2. **Analytics** — real data from existing `agent_analytics` table
3. **API Keys** — generate, hash, store, return once
4. **Audit Log** — wire up existing `audit_logs` table
5. **Webhooks** — DB + dispatch + integration
6. **Smart Routing** — DEFERRED (later)

## Status Tracker
| # | Feature | Status | Commit |
|---|---------|--------|--------|
| 1 | Knowledge Base | NOT STARTED | — |
| 2 | Analytics | NOT STARTED | — |
| 3 | API Keys | NOT STARTED | — |
| 4 | Audit Log | NOT STARTED | — |
| 5 | Webhooks | NOT STARTED | — |
| 6 | Smart Routing | DEFERRED | — |

---

## Global Patterns (apply to EVERY feature)

### API Route Template
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Plan gate — EVERY Pro route needs this
  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // Rate limit
  const rl = rateLimit(`${user.id}:feature_name`, 30, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Business logic with admin client (bypasses RLS)
  // Always filter by .eq("user_id", user.id)
}
```

### Page Template (all pages already follow this)
```typescript
// Server component: createClient() → getUser() → get subscription → hasAccess() → render component or UpgradePrompt
```

### Client Component Pattern
```typescript
// Replace useState(MOCK_DATA) with:
// - useQuery() for fetching (GET)
// - useMutation() for create/update/delete (POST/PATCH/DELETE)
// - Loading states, error states, empty states
// - toast.success() / toast.error() on mutation results
```

### Key Imports
- `createClient` from `@/lib/supabase-server` — server components + API routes (uses cookies)
- `createAdminClient` from `@/lib/supabase-admin` — API routes only (bypasses RLS)
- `hasAccess` from `@/lib/tier` — plan gating: `hasAccess(plan, "pro")`
- `rateLimit` from `@/lib/rate-limit` — in-memory sliding window
- `logAudit` from `@/lib/audit-log` — non-blocking insert to `audit_logs`
- `encryptCredentials` / `decryptCredentials` from `@/lib/crypto` — AES-256-GCM

---

## Feature 1: Knowledge Base (RAG)

### What It Does (User-Facing)
- Upload documents (PDF, TXT, MD, CSV) or add web URLs
- Documents get chunked into searchable pieces
- Agents automatically reference relevant chunks when chatting
- Search across all uploaded knowledge
- Re-index documents, delete documents
- Storage usage tracking (100 MB limit for Pro)

### Current Mock State
**File:** `src/components/dashboard/knowledge-base-manager.tsx`
**Page:** `src/app/dashboard/knowledge-base/page.tsx`
- `useState<KBDocument[]>(MOCK_DOCS)` — 4 fake documents
- Upload dialog exists but `handleUpload()` uses `setTimeout` to fake it
- Delete just removes from local state
- Re-index just sets status to "processing" locally
- Search filters local array
- Storage shows hardcoded "3 MB / 100 MB"

### Current UI Elements (keep all of these)
- **Stats cards:** Documents count, Indexed count, Total Chunks, Storage Used (with progress bar)
- **Search bar** with magnifying glass icon
- **Upload dialog:** Source type select (File Upload / Web URL), drag-drop zone for files, URL input
- **Document list:** File icon (by type), name, type badge, size, chunk count, upload date, status badge (Indexed/Processing/Failed), Re-index button, Delete with AlertDialog

### Current TypeScript Interface
```typescript
interface KBDocument {
  id: string;
  name: string;
  type: "pdf" | "txt" | "csv" | "url" | "md";
  size: string;
  chunks: number;
  status: "indexed" | "processing" | "error";
  uploadedAt: string;
  lastIndexed: string | null;
}
```

### DB Tables Needed

**`kb_documents`**
```sql
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'txt', 'md', 'csv', 'url')),
  source_url TEXT,              -- for URL type documents
  storage_path TEXT,            -- Supabase Storage path: {user_id}/{doc_id}/{filename}
  file_size BIGINT DEFAULT 0,  -- bytes
  chunk_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'indexed', 'error')),
  error_message TEXT,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_documents_user_id ON kb_documents(user_id);
```

**`kb_chunks`**
```sql
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL,
  metadata JSONB DEFAULT '{}',   -- page number, heading, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_chunks_document_id ON kb_chunks(document_id);
CREATE INDEX idx_kb_chunks_user_id ON kb_chunks(user_id);
CREATE INDEX idx_kb_chunks_content_trgm ON kb_chunks USING gin (content gin_trgm_ops);
```

**Supabase Storage:** Bucket `knowledge-base`, path `{user_id}/{doc_id}/{filename}`, 10 MB max per file

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/knowledge-base` | List user's docs with chunk counts |
| POST | `/api/knowledge-base/upload` | Upload file → storage → chunk → index |
| POST | `/api/knowledge-base/url` | Fetch URL content → chunk → index |
| DELETE | `/api/knowledge-base/[id]` | Delete doc + chunks + storage file |
| POST | `/api/knowledge-base/[id]/reindex` | Re-chunk and re-index existing doc |
| GET | `/api/knowledge-base/search?q=` | Full-text search across chunks |

### Chunking Logic (`src/lib/knowledge-base.ts`)
- **PDF:** Use `pdf-parse` npm package to extract text, split by pages then paragraphs
- **TXT/MD:** Split by double newlines (paragraphs), max ~2000 chars per chunk
- **CSV:** Each row becomes a chunk (with header as context)
- **URL:** Fetch page, strip HTML tags, split by paragraphs
- **Overlap:** 50 char overlap between consecutive chunks for context continuity

### Chat Integration — Exact Injection Point
**File:** `src/app/api/chat/send/route.ts`

After storing user message (line 136) and BEFORE the OpenClaw fetch (line 163):
```typescript
// Line 132-136: Store user message (EXISTING)
await admin.from("chat_messages").insert({
  conversation_id: conversation.id,
  role: "user",
  content: message.trim(),
});

// >>> INSERT KB SEARCH HERE <<<
// 1. Search kb_chunks WHERE user_id = user.id, content ILIKE '%{message}%'
// 2. Take top 3-5 matches
// 3. Build augmented messages array below

// Line 163-170: OpenClaw fetch (EXISTING — modify messages array)
const openclawResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: `openclaw:${agentSlug}`,
    messages: [
      // ADD system message with KB context IF chunks found:
      // { role: "system", content: "Relevant knowledge:\n\n" + chunks.join("\n---\n") },
      { role: "user", content: message.trim() },
    ],
  }),
  signal: controller.signal,
});
```

**Key detail:** The messages array currently sends ONLY the user message (OpenClaw manages session history via `x-openclaw-session-key` header). We prepend a system message with KB context — this doesn't break session continuity.

### Supabase Storage Context
- NO Supabase Storage is used anywhere in the codebase yet — KB will be first
- Need to create bucket `knowledge-base` in Supabase dashboard (Settings → Storage)
- Storage path pattern: `{user_id}/{doc_id}/{filename}`
- 10 MB max per file
- Access via `admin.storage.from("knowledge-base").upload(path, buffer)`
- Delete via `admin.storage.from("knowledge-base").remove([path])`

### NPM Package Needed
- `pdf-parse` — extracts text from PDF buffers — **NOT in package.json yet, needs `npm install pdf-parse`**

### Component Update Plan
- Remove `MOCK_DOCS` array
- Remove `useState<KBDocument[]>(MOCK_DOCS)`
- Add `useQuery` to fetch from `GET /api/knowledge-base`
- Add `useMutation` for upload, delete, reindex
- Real file upload via FormData to `POST /api/knowledge-base/upload`
- Real URL submission to `POST /api/knowledge-base/url`
- Compute storage from actual `file_size` sum
- Loading skeleton while fetching
- Error state if fetch fails

---

## Feature 2: Analytics (Real Data)

### What It Does (User-Facing)
- Visualize chatbot usage over time (7/14/30 day periods)
- Token usage chart (area chart)
- Conversations and messages per day (dual area chart)
- Requests by hour (bar chart — peak usage times)
- Messages by channel (pie chart)
- Summary cards: Total tokens, Conversations, Messages, Peak Hour
- Percentage change vs previous period

### Current Mock State
**File:** `src/components/dashboard/usage-analytics.tsx`
**Page:** `src/app/dashboard/analytics/page.tsx`
- `generateDailyData(days)` — Math.random() for tokens, conversations, messages
- `generateHourlyData()` — Math.random() for hourly requests
- `CHANNEL_DATA` — hardcoded channel breakdown
- Summary cards show random totals
- % change (12%, 8%, -3%) is hardcoded

### Current UI Elements (keep all)
- **Time range selector:** 7/14/30 days dropdown
- **4 Summary cards:** Total Tokens, Conversations, Messages, Peak Hour (with trend arrows)
- **Token Usage Over Time:** AreaChart with gradient fill
- **Requests by Hour:** BarChart (24 hours)
- **Messages by Channel:** PieChart + legend
- **Daily Conversations & Messages:** Dual AreaChart with legend

### Existing DB Tables (exact schemas from migration + code)

**`agent_analytics`** — already populated by `/api/chat/send` (line 245-253 for messages, 262-271 for errors):
```sql
-- From: supabase/migrations/20260307000000_add_analytics_health_credentials_audit.sql
CREATE TABLE agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,        -- "message" | "error"
  response_time_ms INTEGER,        -- latency in ms
  metadata JSONB,                  -- { error: "message" } for errors
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Index: idx_agent_analytics_lookup ON (user_id, agent_id, created_at DESC)
```
**What gets inserted (from chat/send):**
- Success: `{ user_id, agent_id, metric_type: "message", response_time_ms }`
- Error: `{ user_id, agent_id, metric_type: "error", response_time_ms, metadata: { error } }`
- NOTE: No `token_count` field exists — tokens must be estimated or this column added

**`chat_messages`** — columns inferred from insert/select in code:
```
id, conversation_id, role ("user"|"assistant"), content, created_at
```

**`chat_conversations`** — columns from upsert in chat/send:
```
id, user_id, agent_id, updated_at, created_at
UNIQUE(user_id, agent_id) — one conversation per user+agent pair
```

**`channels`** — columns from select in channels page:
```
id, user_id, channel_type (whatsapp/telegram/discord/slack/signal/teams/webchat/other),
status ("connected"|...), configured_at, health_status, last_health_check, error_message
```

### API Route

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/analytics/usage?range=30` | Aggregate analytics data |

**Response shape:**
```typescript
{
  daily: [{ date: string, tokens: number, conversations: number, messages: number }],
  hourly: [{ hour: string, requests: number }],
  channels: [{ name: string, value: number }],
  summary: {
    totalTokens: number,
    totalConversations: number,
    totalMessages: number,
    peakHour: string,
    peakHourRequests: number,
    tokenChange: number,      // % vs previous period
    conversationChange: number,
    messageChange: number,
  }
}
```

### Queries
- **Daily tokens:** SUM of token count from `agent_analytics` WHERE metric_type = 'message', GROUP BY date
- **Daily conversations:** COUNT DISTINCT conversation_id from `chat_messages` GROUP BY date
- **Daily messages:** COUNT from `agent_analytics` WHERE metric_type = 'message' GROUP BY date
- **Hourly:** COUNT from `agent_analytics` GROUP BY EXTRACT(HOUR FROM created_at)
- **Channel breakdown:** COUNT from `chat_messages` JOIN `channels` GROUP BY platform
- **% change:** Compare current period sum vs previous period sum

### Component Update Plan
- Remove `generateDailyData()`, `generateHourlyData()`, `CHANNEL_DATA`
- Accept data as props OR use `useQuery` to fetch from `/api/analytics/usage`
- Pass `timeRange` as query param
- Loading skeletons for charts
- Empty state if no data yet ("Start chatting to see analytics")

---

## Feature 3: API Keys (Real)

### What It Does (User-Facing)
- Generate API keys to access ClawHQ chatbot from external apps/websites
- Keys shown ONCE on creation (never again)
- Display key prefix (first 12 chars) for identification
- Track last used date
- Revoke keys instantly
- Code examples (cURL, PowerShell, Python, JavaScript) with user's actual hostname

### Current Mock State
**File:** `src/components/dashboard/api-access-manager.tsx`
**Page:** `src/app/dashboard/api-access/page.tsx`
- `MOCK_KEYS` — 2 fake keys (Production, Development)
- `handleCreate()` — generates random string client-side, never saved
- Delete just shows toast, doesn't remove from list (uses MOCK_KEYS directly)
- Code examples reference `your-instance.clawhq.tech` (replaced with real hostname via prop)
- Endpoint card shows real hostname from VPS data

### Current UI Elements (keep all)
- **API Endpoint card:** Shows `https://{hostname}/api/v1` with copy button
- **API Keys card:** List of keys with name, prefix, created date, last used, status badge (active/revoked), delete button
- **Create Key dialog:** Two states — name input → key display (show once)
- **Code examples:** Tabs for cURL, PowerShell, Python, JavaScript with copy buttons

### Current TypeScript Interface
```typescript
interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
}
```

### DB Table Needed

**`api_keys`**
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,          -- SHA-256 hash of the full key
  key_prefix TEXT NOT NULL,        -- first 12 chars for display (e.g., "sk-claw-prod")
  last_used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/keys` | List user's keys (prefix only, never full key) |
| POST | `/api/keys` | Generate key, return full key ONCE, store hash |
| DELETE | `/api/keys/[id]` | Revoke key (set status to 'revoked') |

### Key Generation Logic
```typescript
import crypto from "crypto";

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const key = `sk-claw-${raw}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 12);
  return { key, hash, prefix };
}
```

### Existing Crypto Context
`src/lib/crypto.ts` exists with AES-256-GCM for channel credentials. API keys use simpler SHA-256 one-way hash (not encryption — we never need to decrypt the key, just verify it).

### No API Key Validation Middleware Exists Yet
All routes currently use Supabase session auth (`createClient()` → `getUser()`). There is NO existing middleware for API key validation. If we later want external API access (users calling their chatbot via API key instead of session), we'd need to add key validation to the chat/send route — but that's a separate concern from the dashboard CRUD we're building now.

### Component Update Plan
- Remove `MOCK_KEYS` array
- Add `useQuery` to fetch from `GET /api/keys`
- Add `useMutation` for create and revoke
- On create: show full key in dialog (from API response), user copies it, key never shown again
- On revoke: call `DELETE /api/keys/[id]`, invalidate query
- Loading skeleton
- Empty state

---

## Feature 4: Audit Log (Wire Up Existing)

### What It Does (User-Facing)
- See a timeline of all actions across the account
- Filter by category (auth, vps, agent, model, api_key, billing, account)
- Filter by actor type (user, agent, system)
- Search by action/details/actor
- Export to CSV
- Entries show: timestamp, actor, category badge, action, details, IP address

### Current Mock State
**File:** `src/components/dashboard/audit-log-viewer.tsx`
**Page:** `src/app/dashboard/audit-log/page.tsx`
- `MOCK_ENTRIES` — 8 fake entries
- Filtering works on local array
- CSV export works but exports mock data

### Current UI Elements (keep all)
- **Toolbar:** Search input, Category dropdown, Actor type dropdown, Export CSV button
- **Stats line:** "{N} entries" with filter indicator
- **Table:** Time, Actor (with icon), Category (color-coded badge), Action, Details, IP

### Current TypeScript Interface
```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "user" | "agent" | "system";
  action: string;
  category: string;
  details: string;
  ip: string;
}
```

### Existing DB Infrastructure — Exact Details

**`audit_logs` table** (from migration):
```sql
-- From: supabase/migrations/20260307000000_add_analytics_health_credentials_audit.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- currently named admin_id
  action TEXT NOT NULL,          -- e.g., "vps_provisioned", "api_key_configured"
  entity_type TEXT NOT NULL,     -- e.g., "vps", "api_key", "ticket"
  entity_id TEXT,                -- resource ID
  details JSONB,                 -- arbitrary metadata
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS enabled, index on created_at DESC
```

**`logAudit()` function** (full code in `src/lib/audit-log.ts`):
```typescript
export async function logAudit(params: AuditParams) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      admin_id: params.adminId,  // <-- maps to admin_id column
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || null,
      ip_address: params.ip || null,
    });
  } catch (err) {
    console.error("[audit-log] Failed to log:", err);
  }
}
```

**Currently used in 14 places — ALL admin routes:**
- `api/admin/provision` → "vps_provisioned"
- `api/admin/vps-password` → "vps_password_changed"
- `api/admin/api-keys` → "api_key_configured", "api_key_deleted"
- `api/admin/customers/[id]/vps` → "vps_updated"
- `api/admin/customers/[id]/subscription` → "subscription_updated"
- `api/admin/customers/[id]` → "customer_deleted"
- `api/admin/customers/[id]/migrate-docker` → migration action
- `api/admin/customers/[id]/auto-restart` → "auto_restart_enabled"
- `api/admin/customers/bulk` → "bulk_action"
- `api/admin/tickets/[id]` → "ticket_replied", "ticket_updated"

**Zero user-initiated actions are logged yet.**

### What Needs to Change
1. **Extend `logAudit()`:** The column is `admin_id` but we reuse it for `user_id` too (same UUID type, same users table ref). Either rename column to `actor_id` or just use `admin_id` field with user's ID — functionally identical since both reference `users(id)`.
2. **API Route:** `GET /api/audit-log` — query `audit_logs` WHERE `admin_id = user.id` with filters
3. **Add `logAudit()` calls** to all Pro API routes as they're built:
   - KB: doc_uploaded, doc_deleted, doc_reindexed
   - API Keys: api_key_created, api_key_revoked
   - Webhooks: webhook_created, webhook_deleted, webhook_updated
4. **Component update:** Replace MOCK_ENTRIES → `useQuery` to `/api/audit-log`
5. **Map DB columns to UI fields:**
   - `admin_id` → look up user email for "actor" display
   - `entity_type` → "category" in UI
   - `action` → "action" in UI
   - `details` → stringify relevant fields for "details" in UI
   - `ip_address` → "ip" in UI
   - `created_at` → "timestamp" in UI
   - `actorType` → derive from context (if admin_id matches logged-in user = "user", if system action = "system")

### API Route

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/audit-log?category=&actor=&search=&page=` | Paginated audit log |

---

## Feature 5: Webhooks (Real CRUD)

### What It Does (User-Facing)
- Register webhook URLs to receive event notifications
- Choose which events to listen for (8 event types)
- Auto-generated signing secrets for payload verification
- Enable/disable webhooks
- Test webhook (send sample payload)
- See last trigger status (success/failed)

### Current Mock State
**File:** `src/components/dashboard/webhooks-manager.tsx`
**Page:** `src/app/dashboard/webhooks/page.tsx`
- `MOCK_WEBHOOKS` — 2 fake endpoints
- Create generates random secret client-side
- Delete removes from local state
- Test uses `setTimeout` to fake
- Toggle changes local state only

### Current UI Elements (keep all)
- **Summary cards:** Active count, Events Tracked, Last Triggered
- **Create dialog:** URL input, Event checkboxes (8 events with labels + descriptions)
- **Webhook cards:** URL (monospace), status dot (green/gray), last status badge (OK/Failed), Test button (with loading spinner), Delete with AlertDialog
- **Event badges:** Listed under each webhook
- **Secret display:** Masked by default, show/hide toggle, copy button

### Available Events (keep all 8)
```typescript
const AVAILABLE_EVENTS = [
  { id: "conversation.started", label: "Conversation Started" },
  { id: "conversation.ended", label: "Conversation Ended" },
  { id: "message.received", label: "Message Received" },
  { id: "agent.error", label: "Agent Error" },
  { id: "agent.deployed", label: "Agent Deployed" },
  { id: "vps.status_changed", label: "VPS Status Changed" },
  { id: "channel.connected", label: "Channel Connected" },
  { id: "channel.disconnected", label: "Channel Disconnected" },
];
```

### Current TypeScript Interface
```typescript
interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  lastTriggered: string | null;
  lastStatus: "success" | "failed" | null;
}
```

### DB Table Needed

**`webhooks`**
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('success', 'failed')),
  last_status_code INT,
  failure_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
```

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/webhooks` | List user's webhooks |
| POST | `/api/webhooks` | Create webhook |
| PATCH | `/api/webhooks/[id]` | Update (enable/disable, change events) |
| DELETE | `/api/webhooks/[id]` | Delete webhook |
| POST | `/api/webhooks/[id]/test` | Send test event to webhook URL |

### Dispatch Utility (`src/lib/webhook-dispatch.ts`)
- Fire-and-forget POST to webhook URL
- HMAC-SHA256 signing with webhook secret
- Headers: `X-ClawHQ-Signature`, `X-ClawHQ-Event`, `X-ClawHQ-Timestamp`
- Payload: `{ event: string, data: object, timestamp: string }`
- Update `last_triggered_at`, `last_status`, `last_status_code` after delivery
- Increment `failure_count` on failure

### Integration Points — Exact File Paths for Dispatch Calls

**15 routes total that should fire webhooks:**

| File Path | Event |
|-----------|-------|
| `src/app/api/chat/send/route.ts` | `message.received` |
| `src/app/api/agents/deploy/route.ts` | `agent.deployed` |
| `src/app/api/agents/undeploy/route.ts` | `agent.undeployed` (not in events list — consider adding) |
| `src/app/api/channels/connect/route.ts` | `channel.connected` |
| `src/app/api/channels/disconnect/route.ts` | `channel.disconnected` |
| `src/app/api/vps/start/route.ts` | `vps.status_changed` |
| `src/app/api/vps/stop/route.ts` | `vps.status_changed` |
| `src/app/api/vps/restart/route.ts` | `vps.status_changed` |
| `src/app/api/vps/reboot/route.ts` | `vps.status_changed` |
| `src/app/api/models/change/route.ts` | (no event defined yet — optional) |
| `src/app/api/tickets/create/route.ts` | (no event defined — optional) |

**Pattern for adding dispatch:** At the end of successful operation, non-blocking:
```typescript
import { dispatchWebhooks } from "@/lib/webhook-dispatch";

// After successful operation:
dispatchWebhooks(user.id, "agent.deployed", { agent_id, agent_name }).catch(() => {});
```

**Dispatch should be fire-and-forget** — never block the main response.

---

## Feature 6: Smart Routing — DEFERRED

### Current State
**File:** `src/components/dashboard/smart-routing-manager.tsx`
**Page:** `src/app/dashboard/smart-routing/page.tsx`
- Full mock UI with routing rules
- DEFERRED — not building until all above features are done
- Nobody with 1 agent needs this (senior review)

---

## Cross-Cutting Concerns

### Every API Route Must Have
1. `createClient()` → `getUser()` → 401 if missing
2. `hasAccess(plan, "pro")` → 403 if not Pro
3. `rateLimit()` → 429 if exceeded
4. `createAdminClient()` → business logic with `.eq("user_id", user.id)`
5. `logAudit()` call for write operations (create/update/delete)

### Workflow Per Feature
1. Provide SQL for DB tables → user creates in Supabase
2. Build API routes (with plan gate + rate limit + audit logging)
3. Build lib utility if needed (chunking, dispatch, etc.)
4. Update component (replace mock → real API calls via useQuery/useMutation)
5. `next build` → verify zero errors
6. Commit & push
7. Give test brief → wait for user confirmation
