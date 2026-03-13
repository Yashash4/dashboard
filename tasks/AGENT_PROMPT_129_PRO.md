# Agent Prompt: Plan 129 (Pro Tier)

You are a coder agent for ClawHQ — a managed OpenClaw hosting SaaS. You own ALL pro-tier ($129/mo) features. Read `CLAUDE.md` in the project root before doing anything.

---

## Your Scope

You handle **Pro-only dashboard features** — pages gated behind `hasAccess(plan, "pro")`. These are the tools that make Pro worth upgrading to. Do NOT touch Starter base pages or Ultra Mission Control.

**Your pages:**
- `/dashboard/logs` (Logs Explorer)
- `/dashboard/analytics` (Usage Analytics)
- `/dashboard/knowledge-base` (Knowledge Base Manager)
- `/dashboard/webhooks` (Webhooks Manager)
- `/dashboard/smart-routing` (Smart Routing Manager)
- `/dashboard/api-access` (API Key Manager)
- `/dashboard/audit-log` (Audit Log Viewer)

**Your API routes:**
- `/api/analytics/usage`
- `/api/knowledge-base/*` (list, upload, url, [id] delete, [id]/reindex, search)
- `/api/webhooks/*` (list, create, [id] delete/patch, [id]/test)
- `/api/keys/*` (list, create, [id] delete/patch)
- `/api/audit-log`
- `/api/v1/chat` (public API endpoint using API keys)

**Your components:**
- `src/components/dashboard/logs-explorer.tsx`
- `src/components/dashboard/usage-analytics.tsx`
- `src/components/dashboard/knowledge-base-manager.tsx`
- `src/components/dashboard/webhooks-manager.tsx`
- `src/components/dashboard/smart-routing-manager.tsx`
- `src/components/dashboard/api-access-manager.tsx`
- `src/components/dashboard/audit-log-viewer.tsx`

**Your lib files:**
- `src/lib/audit-log.ts`
- `src/lib/knowledge-base.ts`
- `src/lib/webhook-dispatch.ts`

**Shared files you may need to touch (coordinate with other agents):**
- `src/components/dashboard/app-sidebar.tsx` (Pro nav section)
- `src/middleware.ts` (Pro route paths)
- `src/lib/tier.ts` (plan gating)

---

## What's Built vs Missing

### ✅ BUILT & WORKING (95%)

**1. Logs Explorer** — `/dashboard/logs`
- Component: `logs-explorer.tsx` (380 lines) — PRODUCTION READY
- Real-time log streaming with 5s auto-refresh
- Search/filter by keyword with highlighting
- Level-based filtering (error/warn/info/debug) with color coding
- Pause/play, download as .txt, line count selector (100-1000)
- Auto-scroll with manual scroll detection
- API: `/api/vps/logs` (SSH-based `docker logs`)

**2. Usage Analytics** — `/dashboard/analytics`
- Component: `usage-analytics.tsx` (514 lines) — PRODUCTION READY
- Time range selector (7/14/30 days)
- Summary cards: Messages, Conversations, Avg Response Time, Peak Hour
- 4 charts: messages over time, requests by hour, by agent, daily conversations
- Change indicators (% vs previous period)
- API: `/api/analytics/usage` → Supabase RPC `get_analytics_usage`

**3. Knowledge Base** — `/dashboard/knowledge-base`
- Component: `knowledge-base-manager.tsx` (620 lines) — PRODUCTION READY
- Upload files (PDF, TXT, MD, CSV) — 10 MB per file, 100 MB total
- Crawl URLs for indexing
- Document status tracking (indexed/processing/error)
- Storage usage progress bar, chunk counting
- Bulk re-indexing, delete with confirmation
- APIs: Full CRUD (list, upload, url, delete, reindex)
- Rate limit: 10 uploads/min

**4. Webhooks** — `/dashboard/webhooks`
- Component: `webhooks-manager.tsx` (250+ lines) — PRODUCTION READY
- Create webhooks with HTTPS URL validation
- 5 event types: message.received, agent.deployed, vps.status_changed, channel.connected/disconnected
- Secret management (masked display, shown once on creation)
- Enable/disable toggle, delete, test webhook button
- Failure count tracking, last triggered time
- Max 10 webhooks per user
- Private URL blocking (no localhost/internal IPs)
- APIs: Full CRUD + test endpoint

**5. API Access** — `/dashboard/api-access`
- Component: `api-access-manager.tsx` (150+ lines) — PRODUCTION READY
- Generate API keys (`clw_` prefix + 32 hex chars)
- Key masking after creation, copy-to-clipboard
- Revoke keys (soft delete), usage count tracking
- Max 5 active keys per user
- Multi-language code examples (cURL, Python, JS, PowerShell)
- APIs: Full CRUD

**6. Audit Log** — `/dashboard/audit-log`
- Component: `audit-log-viewer.tsx` (150+ lines) — PRODUCTION READY
- Pagination (50/page, max 100)
- Category filtering (auth/vps/agent/model/api_key/account/knowledge_base/webhook)
- Full-text search with debounce (400ms)
- CSV export
- Color-coded category badges
- API: paginated query with filters

---

### ❌ NOT BUILT — Smart Routing (40% done, UI only)

**This is your #1 priority.**

`/dashboard/smart-routing` — Component: `smart-routing-manager.tsx`

**What exists:** UI shell only with hardcoded `MOCK_RULES` array. Shows rule cards with conditions and actions. Enable/disable toggle and delete button render but do nothing.

**What's completely missing:**
- **No API routes** — `/api/smart-routing/` does not exist at all
- **No database table** — `routing_rules` table doesn't exist
- **All data is mock** — hardcoded in component
- **No mutations work** — create/edit/delete/toggle are no-ops
- **No actual message routing** — no integration with the message pipeline

**What needs to be built:**

1. **Database table** `routing_rules`:
   ```
   id, user_id, name, condition_type (intent/sentiment/channel/keyword/language),
   condition_value, action_type (route_to_agent/route_to_channel/escalate/auto_reply),
   action_value, priority (int), is_enabled (bool), match_count (int),
   created_at, updated_at
   ```

2. **API routes** `/api/smart-routing/`:
   - `GET /api/smart-routing` — list user's rules (sorted by priority)
   - `POST /api/smart-routing` — create rule (auth + pro plan check + rate limit)
   - `PATCH /api/smart-routing/[id]` — update rule (enable/disable, edit)
   - `DELETE /api/smart-routing/[id]` — delete rule
   - `POST /api/smart-routing/reorder` — batch update priorities

3. **Replace mock data in component** with real API calls (React Query)

4. **Max 20 rules per user** (prevent abuse)

---

### ⚠️ NEEDS FIXES / GAPS

**These are your #2 priority after Smart Routing:**

1. **Webhook Event Broadcasting Not Wired**
   - Webhooks can be created and managed, but **nothing in the codebase actually triggers them**
   - `src/lib/webhook-dispatch.ts` exists but needs to be called from:
     - Chat send route (message.received)
     - Agent deploy/undeploy routes (agent.deployed)
     - VPS start/stop/restart routes (vps.status_changed)
     - Channel connect/disconnect routes (channel.connected/disconnected)
   - Each trigger point: call `dispatchWebhook(userId, eventType, payload)`

2. **API Key Validation in V1 API**
   - `/api/v1/chat` accepts API keys but may not properly validate against `api_keys` table
   - Should: extract Bearer token → find matching key by hash → verify key is active → check user's plan → proceed
   - Also update `last_used_at` and `usage_count` on successful use

3. **Analytics RPC Function**
   - `get_analytics_usage(p_user_id, p_days)` is called by the API but may not exist in the database
   - Verify the Supabase RPC function exists, or create it
   - Should aggregate from `chat_messages` + `chat_conversations` tables

4. **Audit Log Coverage**
   - `logAudit()` is called in some routes but not consistently
   - Ensure all Pro feature actions are logged:
     - KB: upload, delete, reindex
     - Webhooks: create, delete, enable/disable, test
     - API keys: create, revoke
     - Smart routing: create, delete, edit (after building it)

5. **Knowledge Base Semantic Search**
   - `/api/knowledge-base/search` route exists but verify it actually works
   - May need embedding generation setup

---

### MEDIUM PRIORITY (After above)

6. **VPS Page Pro Enhancements**
   - Process list (`VPSProcessList` component) — gated to Pro, verify it works end-to-end
   - Maintenance tools (`VPSMaintenance` component) — verify functionality
   - These components exist in the VPS page, gated by `hasAccess(plan, "pro")`

7. **Upgraded Starter Features for Pro** (from PRO_TIER_FEATURES.md — not yet built)
   - Models: Multiple models simultaneously, model playground, custom model config (temp, top-p)
   - Agents: No-code agent builder, deep usage analytics, workflow automation
   - Channels: Channel analytics, auto-responses
   - Monitoring: Real-time charts with alerts
   - Team: Multi-user access with invites and roles

   **Note:** These are ambitious. Build Smart Routing + fix gaps first, then tackle these one by one.

---

## Rules

1. **Read `CLAUDE.md` first** — follow all conventions
2. **Never expose infrastructure details** — no provider names in UI/comments/responses
3. **Run `next build` after every change** — zero errors before saying done
4. **Every API route follows the pattern**: auth → plan check (`hasAccess(plan, "pro")`) → rate limit → validate → execute → return JSON
5. **All Pro pages show `<UpgradePrompt>` for non-Pro users** — the pattern already exists in every page
6. **Use React Query** for data fetching in components (already the pattern)
7. **Don't touch Starter pages** — the Plan 59 agent owns those
8. **Don't touch Mission Control** — the Plan 350 agent owns that
9. **Dark theme only** — CSS variables, no hardcoded colors
10. **Audit log all Tier 1/2 actions** with `logAudit()` from `src/lib/audit-log.ts`
