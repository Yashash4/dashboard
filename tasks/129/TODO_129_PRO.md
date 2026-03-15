# TODO: Pro $129 — New Features Build Guide

**Owner:** Plan 129 Agent
**Previous work:** 61/61 items completed. See `COMPLETED_129_PRO.md`.
**Last updated:** 2026-03-15

---

## PART A: CONTEXT — READ THIS FIRST

### A1. What is ClawHQ?

ClawHQ is a managed OpenClaw hosting SaaS. Users sign up, pick a plan, and ClawHQ provisions a dedicated VPS with OpenClaw (an AI agent framework) installed, configured, and ready to use. Users get a dashboard to manage everything.

**Pricing tiers:**
- **Starter $59/mo** — Dedicated VPS, bundled AI models, 7 channels, agent store, managed infrastructure
- **Pro $129/mo** — Everything in Starter + Pro Tools (this is YOUR scope)
- **Ultra $350/mo** — Everything in Pro + Mission Control (Plan 350 agent owns this)
- **Enterprise $999+/mo** — Custom

**How AI models work:**
- ClawHQ uses an external cloud AI API (internally "clawhq-models") — users do NOT pay per token
- Flat-rate, unlimited-feel. Rate limiting happens silently in the backend
- **NEVER show cost, tokens, usage percentages, or budget data to users**

**What runs on each user's VPS:**
- OpenClaw framework + gateway (port 18789)
- ClawHQ Embeddings service (port 5555) — for KB vector search
- ClawHQ Data API (port 5556) — for storing user data locally (being built by 350 agent)
- Nginx reverse proxy + SSL
- AI models are NOT on the VPS — accessed via external API
- VPS runs 24/7 — guaranteed uptime

### A2. What's Already Built (Pro Features — 61 items completed)

Full record in `COMPLETED_129_PRO.md`. Summary:
- **Logs Explorer** — real-time log streaming, search, filter by level, download, auto-refresh
- **Usage Analytics** — 4 charts (messages over time, requests by hour, by agent, daily conversations), summary cards with % change, 7/14/30 day ranges
- **Knowledge Base** — upload files (PDF/TXT/MD/CSV), crawl URLs, vector search with VPS-side embeddings (`all-MiniLM-L6-v2`), relevance threshold (0.3 cosine), FTS fallback, "Test Your KB" UI, "Used in chat" tracking, embedding status badges
- **Webhooks** — 9 event types, delivery logs with history UI, auto-retry (3 attempts, exponential backoff), webhook templates (Slack/Discord/Zapier), per-webhook delivery stats (success rate, avg latency), edit existing webhooks, HMAC signatures, SSRF protection, circuit breaker
- **API Access** — SSE streaming (`stream: true`), health endpoint (`GET /v1/health`), conversation history API, per-key usage stats, per-key rate limit config (30/60/120/300 RPM), interactive API docs + playground, 4-language code examples, agent parameter documentation
- **Audit Log** — paginated, category filter, full-text search with debounce, CSV export, RLS + explicit user_id filter
- **Smart Routing** — REMOVED entirely (was 100% mock)

### A3. Design System — LOCKED (Do NOT change)

| Token | Value |
|-------|-------|
| **Body font** | Geist Mono (monospace everywhere) |
| **Code font** | JetBrains Mono |
| **Page background** | `#111111` |
| **Card background** | `#191919` |
| **Muted background** | `#222222` |
| **Hover background** | `#2a2a2a` |
| **Border** | `#201e18` |
| **Primary (sage green)** | `oklch(0.6762 0.0567 132.4479)` |
| **Accent (warm cream)** | `#ffe0c2` |
| **Tier: Starter** | Green |
| **Tier: Pro** | Cream |
| **Tier: Ultra** | Amber |
| **Border radius** | `0.625rem` |
| **Vibe** | "Terminal-luxury SaaS" |

Dark theme only. No light mode. No theme toggle. Use CSS variables from `globals.css`. Use shadcn/ui components.

### A4. Naming Rules — CRITICAL

**NEVER expose any infrastructure provider name:**

| Real (internal) | Use this instead |
|---|---|
| Ollama | `clawhq-models` or `ClawHQ AI` or just "AI model" |
| Hostinger | `clawhq-vps` or "your VPS" or "your instance" |
| Blackbox | Never mention |
| Supabase | Never in UI (fine in server imports) |
| Vercel | Never mention |
| Cloudflare | Never mention |
| Model providers | Just model names ("Kimi K2.5") — no provider prefix |

Only visible to users: "ClawHQ", "OpenClaw", model names.

### A5. Tech Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS 3.4 + tailwindcss-animate
- Framer Motion 12
- shadcn/ui (51 components)
- Lucide React (icons)
- Recharts (charts)
- React Query / TanStack Query
- Supabase (auth + database — server-side)
- SSH via node-ssh (VPS management — server-side)
- Can install ANY npm package: `cmdk`, `react-hotkeys-hook`, etc.

### A6. What You Own (and DON'T touch)

**YOUR pages (Pro-gated):**
- `/dashboard/logs` — Logs Explorer
- `/dashboard/analytics` — Usage Analytics
- `/dashboard/knowledge-base` — Knowledge Base
- `/dashboard/webhooks` — Webhooks
- `/dashboard/api-access` — API Access + Docs
- `/dashboard/audit-log` — Audit Log
- `/dashboard/model-playground` — **NEW: Build this**
- `/dashboard/agent-builder` — **NEW: Build this**

**YOUR API routes:**
- `/api/analytics/usage`
- `/api/knowledge-base/*`
- `/api/webhooks/*`
- `/api/keys/*`
- `/api/audit-log`
- `/api/v1/chat` (public API)
- `/api/v1/health`
- `/api/v1/conversations` + `/api/v1/conversations/[id]/messages`
- `/api/playground/*` — **NEW: Build this**
- `/api/agents/generate` — **NEW: Build this**
- `/api/agents/[id]/model` — **NEW: Build this**
- `/api/agents/[id]/config` — **NEW: Build this**
- `/api/channels/analytics` — **NEW: Build this**
- `/api/auto-responses/*` — **NEW: Build this**
- `/api/business-hours` — **NEW: Build this**

**YOUR components:**
- All in `src/components/dashboard/` prefixed with Pro feature names
- Plus NEW components you'll build

**YOUR lib files:**
- `src/lib/audit-log.ts`, `src/lib/knowledge-base.ts`, `src/lib/webhook-dispatch.ts`

**DO NOT TOUCH:**
- ALL Starter pages (dashboard overview, VPS, models, agents, store, chat, channels, support, billing, account) — Plan 59 agent
- ALL Ultra/Mission Control pages — Plan 350 agent
- Auth pages (login, register, forgot-password)
- Landing page
- Admin pages
- `src/lib/ssh.ts` — CALL its functions (especially `deployAgent`), don't modify
- `src/lib/tier.ts` — import `hasAccess`, don't modify

**Shared files you may touch:**
- `src/components/dashboard/app-sidebar.tsx` — add new Pro nav items
- `src/middleware.ts` — add new route paths if needed

### A7. Data Architecture — WHERE Data Lives

| Data | Where | Why |
|------|-------|-----|
| Auth / users / subscriptions | **Supabase** | Business data |
| API keys | **Supabase** | Fast validation on server |
| Webhook configs | **Supabase** | Dispatch runs on server |
| Auto-response configs | **Supabase** | Small, platform config |
| Business hours configs | **Supabase** | Small, platform config |
| Agent ownership (`user_agents`) | **Supabase** | Ownership record only |
| Agent config files | **VPS only** | SOUL.md, config.json, etc. |
| KB documents + chunks + embeddings | **VPS only** | Huge data |
| Chat history | **VPS only** | OpenClaw stores it |
| Analytics details | **VPS** | Heavy (daily summary in Supabase) |
| Audit logs | **VPS only** | Grows fast |
| Webhook delivery logs | **VPS only** | Grows fast |
| Model playground results | **VPS** | User data |

**VPS Services:**
| Service | Port | Purpose |
|---------|------|---------|
| OpenClaw Gateway | 18789 | Chat, agents, conversations |
| ClawHQ Embeddings | 5555 | KB vector embeddings |
| ClawHQ Data API | 5556 | Events, sessions, audit, analytics, KB, deliveries |

**Note:** The VPS Data API (port 5556) is being built by the 350 agent. For now, use Supabase for data that will eventually migrate to VPS. When the Data API is ready, migrate (see Part C).

### A8. What NOT to Show Users — EVER

- No cost ($), token counts, usage percentages, budget data, or quota bars
- No provider names (Ollama, Hostinger, Blackbox, Supabase, Vercel, Cloudflare)
- No mock/fake data presented as real
- No "Coming Soon" — everything is live
- No light mode or theme toggle
- No reference repo names in code comments

### A8.1 DATA STORAGE MAP — WHERE EVERY FEATURE'S DATA LIVES

**CRITICAL RULE:** User content lives on THEIR VPS, not in our Supabase. Supabase is only for small platform configs and business data. Follow this map exactly.

#### Supabase (small config/platform data — stays permanently)

| Data | Table | Feature |
|------|-------|---------|
| API keys (hash, name, rate limit) | `api_keys` | API Access (7) |
| Webhook configs (URL, secret, events, filters, retry policy, transformation, pause) | `webhooks` | Webhooks (6) |
| Auto-response configs (greeting, away, FAQ) | `auto_responses` | Auto-Responses (5) |
| Business hours (per-channel schedule) | `business_hours` | Auto-Responses (5) |
| Agent ownership (deployed status, model override) | `user_agents` + `primary_model` + `fallback_model` | Multi-Model (1), Agents |
| Saved log views (search + filter combos) | `saved_log_views` | Logs (9.1) |
| Log alert rules + history | `log_alert_rules` + `log_alert_history` | Logs (9.3) |
| Log forwarding config | `log_forwarding_config` | Logs (9.7) |
| Audit stream configs (SIEM destinations) | `audit_log_streams` | Audit (11.1) |
| Audit retention setting | `users.audit_retention_days` | Audit (11.6) |
| Custom dashboard layouts | `custom_dashboards` | Analytics (10.6) |
| Cohort definitions | `analytics_cohorts` | Analytics (10.7) |
| Conversation ratings (CSAT 1-5) | `conversation_ratings` | Analytics (10.4) |
| Report schedules (weekly email) | `analytics_report_schedules` | Analytics (10.13) |
| KB connector configs (OAuth tokens, encrypted) | `kb_connectors` | KB (8.7) |
| KB feedback (thumbs up/down) | `kb_feedback` | KB (8.10) |
| Idempotency cache (24hr TTL) | `idempotency_cache` | API (7.10) |
| API batch metadata | `api_batches` | API (7.11) |
| API prediction metadata | `api_predictions` | API (7.12) |
| API threads + messages | `api_threads` + `api_thread_messages` | API (7.17) |
| Subscriptions, payments, users | existing tables | Core |
| Support tickets (auto-delete 48hrs after resolved) | `support_tickets` | Core |
| Daily analytics summary (1 row/user/day) | `analytics_daily_summary` | Business metrics |

#### VPS Only (user content/heavy data — on user's VPS)

| Data | Where on VPS | Feature |
|------|-------------|---------|
| Agent config files (SOUL.md, identity.md, TOOLS.md, config.json, USER.md) | Filesystem `/data/agents/{name}/` via SSH `deployAgent()` | Multi-Model (1), Agent Builder (3) |
| KB documents + chunks + embeddings | Data API (5556) SQLite `kb_documents` + `kb_chunks` | KB (8 all) |
| KB search logs (queries, scores, results) | Data API SQLite `kb_search_logs` | KB (8.12) |
| Chat messages / conversation history | OpenClaw (18789) internal storage | API Threads (7.17) |
| Detailed analytics (per-message, per-agent) | Data API SQLite `analytics` | Analytics (10 all) |
| Conversation stages (funnel tracking) | Data API SQLite `conversation_stages` | Analytics (10.1) |
| Conversation intents (path tracking) | Data API SQLite `conversation_intents` | Analytics (10.2) |
| Audit log entries (with hash chain) | Data API SQLite `audit_logs` | Audit (11 all) |
| Webhook delivery logs | Data API SQLite `webhook_deliveries` | Webhooks (6.1, 6.2) |
| Historical logs (persisted for search/dashboards) | Data API SQLite `logs` | Logs (9.8, 9.12) |
| Model playground comparison results | Data API SQLite `comparisons` | Playground (2) |
| API batch results (large payloads) | Data API SQLite | API (7.11) |
| File uploads (chat attachments, KB files) | Filesystem via SSH or Data API | API (7.18), KB (8) |
| Embedding vectors | Embedding service (5555) → stored in SQLite | KB (8.1, 8.2) |
| Reranking model (cross-encoder) | Embedding service (5555) | KB (8.2) |
| OCR processing (Tesseract) | Embedding service (5555) or system install | KB (8.15) |

#### VPS Services (3 HTTP services on each user's VPS)

| Port | Service | Handles |
|------|---------|---------|
| 18789 | OpenClaw Gateway | Chat, agent management, conversations, sessions |
| 5555 | ClawHQ Embeddings | Text embeddings, reranking, OCR |
| 5556 | ClawHQ Data API | SQLite serving: analytics, audit, KB, deliveries, logs, stages, intents, comparisons |

#### Data Flow

```
User's Browser → ClawHQ Dashboard API (Next.js server)
    ├── Small configs → read/write Supabase
    ├── Real-time push → Supabase Realtime channels
    ├── User content → vpsDataFetch() → VPS port 5556 (Data API)
    ├── Chat/agents → proxy to VPS port 18789 (OpenClaw)
    ├── Embeddings → VPS port 5555
    └── Agent files → SSH via deployAgent()
```

#### Migration Note

The VPS Data API (port 5556) is being built by the 350 agent. Until it's ready:
- Build features using Supabase for data that will eventually move to VPS
- Use the same table schemas — they'll migrate as-is to SQLite
- When Data API is ready, swap `supabase.from("table")` → `vpsDataFetch("/api/endpoint")`
- DON'T wait for the Data API — build now against Supabase, migrate later

### A9. Dependency Chain — What Must Be Done Before What

```
Feature 1: Multi-Model Per Agent + Fallback
    ↓ (needed by Agent Builder's model selection)
Feature 3: Agent Builder
    ↓ (builder generates agent configs using the model selection from Feature 1)

Feature 2: Model Playground (independent — can be built in parallel)

Feature 4: Channel Analytics (independent — can be built in parallel)

Feature 5: Auto-Responses (independent — can be built in parallel)
```

Features 1 and 3 are linked. Features 2, 4, 5 are independent and can be built in any order or parallel.

**Checkpoint:** Run `npx next build` after each feature. Zero errors before moving on.

### A10. Reference Repos

Cloned at `C:\Users\yasha\OneDrive\Desktop\yash\`:

**For Agent Builder:**
- `sim-reference/` — Sim Studio. **Steal:** AI "wand" generation per field (`apps/sim/app/api/wand/route.ts`, `apps/sim/blocks/blocks/agent.ts:80-99`). Pattern: each form field has a "Generate with AI" button that calls API with field-specific system prompt.
- `agent-builder-reference/` — Firecrawl Open Agent Builder. **Steal:** slide-in panel form (`components/.../NodePanel.tsx:356-365`), tool toggle list (`ConnectorsPanel.tsx`), auto-save debounce 500ms (`NodePanel.tsx:302-354`), sectioned form layout.

**For Model Playground:**
- `openplayground-reference/` — OpenPlayground. **Steal:** streaming + elapsed timer (`pages/compare.tsx:61-144`), border animation states (pending/running/complete/error), SSE infrastructure, parallel model execution (`app.tsx:231-260`).
- `llm-playground-reference/` — LLM Comparison. **Steal:** 2-dropdown model selector (`model-selector.tsx`), shared textarea prompt (`comparison.tsx:414-611`), markdown response rendering (`model-responses.tsx`), advanced settings dialog (`advanced-options.tsx`), Zustand state management.
- `langfuse-reference/` — Langfuse Playground. **Steal:** CSS grid 2-panel layout with `minmax(400px, 1fr)` (`MultiWindowPlayground.tsx`), per-window state isolation.

**For Channel Analytics + Auto-Responses:**
- Chatwoot patterns (analyzed from docs): inbox reports (per-channel metrics: messages, FRT, resolution time), business hours config (per-day toggles + timezone), auto-reply automations (event → condition → action), canned responses (shortcode templates). See Chatwoot section in agent analysis output.

### A11. OpenClaw Agent Config Format

Agents are folders on the VPS with markdown + JSON files:

```
/data/agents/{agent-name}/
├── SOUL.md        ← personality, values, communication style (THE key file)
├── identity.md    ← name, theme, emoji
├── TOOLS.md       ← allowed tools list (markdown bullet list)
├── config.json    ← model, sandbox, subagents settings
├── USER.md        ← (optional) info about the user this agent serves
```

**Deployment flow:**
```typescript
deployAgent(creds, agentName, configFiles: Record<string, string>)
// configFiles = { "SOUL.md": "...", "identity.md": "...", "TOOLS.md": "...", "config.json": "..." }
// Creates folder on VPS, writes each file, restarts OpenClaw
```

**config.json structure:**
```json
{
  "model": {
    "primary": "clawhq/kimi-k2.5",
    "fallbacks": ["clawhq/minimax-m2.5"]
  },
  "identity": { "name": "Support Bot", "theme": "helpful assistant", "emoji": "🤖" },
  "sandbox": { "mode": "all", "workspaceAccess": "rw", "scope": "agent" },
  "tools": { "allow": ["read", "write", "browser"], "deny": ["exec"] },
  "subagents": { "allowAgents": [], "model": "clawhq/default" }
}
```

**Available tools:**
| Group | Tools |
|-------|-------|
| Coding | read, write, edit, apply_patch, exec, bash, process |
| Browser | browser, web |
| Memory | memory_search, memory_get |
| Session | agents_list, sessions_list, sessions_history, sessions_send |
| Subagent | subagents, llm-task |
| Thinking | thinking, reactions, skills |
| Read-only | read, memory_search, memory_get, agents_list |

**Current gap:** ClawHQ only stores `{"prompt": "..."}` — a single flat text field. The builder needs to generate the full config set above.

### A4. Reference Repos

Cloned at `C:\Users\yasha\OneDrive\Desktop\yash\`:

**Agent Builder:**
- `sim-reference` — Sim Studio. Steal: wand/AI-generate pattern per field (`apps/sim/app/api/wand/route.ts`, `apps/sim/blocks/blocks/agent.ts:80-99`)
- `agent-builder-reference` — Firecrawl Open Agent Builder. Steal: slide-in panel UI (`components/.../NodePanel.tsx:356-365`), tool toggle pattern (`ConnectorsPanel.tsx`), auto-save debounce, form layout

**Model Playground:**
- `openplayground-reference` — OpenPlayground. Steal: streaming + timer stats (`pages/compare.tsx:61-144`), border animation states, SSE infrastructure
- `llm-playground-reference` — LLM Comparison. Steal: 2-dropdown model selector (`model-selector.tsx`), shared textarea (`comparison.tsx:414-611`), markdown response rendering, advanced settings dialog
- `langfuse-reference` — Langfuse Playground. Steal: CSS grid 2-panel layout (`MultiWindowPlayground.tsx`), per-window state isolation

**Channel Analytics / Auto-Responses:**
- Chatwoot patterns (analyzed from docs, not cloned): channel analytics metrics, business hours config, auto-reply rules, canned responses

---

## PART B: FEATURES TO BUILD

---

## 1. MULTI-MODEL PER AGENT + FALLBACK CHAIN

**What:** Each deployed agent gets its own model assignment. Plus a fallback — if primary model hits rate limit or fails, auto-switch to fallback model.

**Example:**
```
Support Bot  → Primary: Kimi K2.5     → Fallback: MiniMax M2.5
Research Bot → Primary: MiniMax M2.5   → Fallback: Kimi K2.5
```

### Database Changes

- [x] **Add model columns to `user_agents` table**
  Migration: `ALTER TABLE user_agents ADD COLUMN primary_model TEXT, ADD COLUMN fallback_model TEXT;`
  Both nullable — if null, uses the VPS default model.

### API Changes

- [x] **Build `PATCH /api/agents/[id]/model`**
  Auth → Pro plan check → validate agent belongs to user → update `primary_model` and `fallback_model` in `user_agents`. Also update the agent's `config.json` on VPS via SSH: set `model.primary` and `model.fallbacks` array. Return updated agent.

- [x] **Update `POST /api/agents/deploy`**
  When deploying, if agent has per-agent model config, write it to `config.json` in the agent folder. If not, use VPS default.

- [x] **Update chat proxy with fallback logic**
  In `src/app/api/chat/send/route.ts` and `src/app/api/v1/chat/route.ts`:
  1. Check if the target agent has a `primary_model` override in `user_agents`
  2. If yes, route to that model via clawhq-models API
  3. If primary returns error (429 rate limit, 500, timeout), automatically retry with `fallback_model`
  4. Max 1 fallback attempt
  5. Track which model actually answered

### UI Changes

- [x] **Model selector in agent deploy/edit**
  In the agent manager component: add "Model" section. Dropdown: "Use VPS Default" (default) or pick a specific model from available models list. Optional second dropdown: "Fallback Model" (can be "None" or a model).

- [x] **Which model answered indicator**
  In chat, add small muted badge on assistant messages: "via Kimi K2.5" or "Fallback: MiniMax M2.5 (primary unavailable)". Use muted text, not prominent.

---

## 2. MODEL PLAYGROUND

**What:** Side-by-side model comparison. User picks 2 models, types a prompt, sees both responses simultaneously.

**Important:** Each comparison uses 2 real requests. Show notice to users.

### Build Specs

- [x] **Create page `/dashboard/model-playground/page.tsx`**
  Pro-gated with `UpgradePrompt` for non-Pro users. Add to sidebar under Pro tools with beaker icon.

- [x] **Build the playground component**
  Layout (steal from Langfuse): CSS grid `grid-template-columns: repeat(2, minmax(400px, 1fr))`. Stacks on mobile (`grid-cols-1`). Each panel has: model selector dropdown at top, response area in middle, metadata at bottom.

  **Model selectors** (steal from LLM-Comparison `model-selector.tsx`):
  Two `ComboBox` dropdowns (searchable) labeled "Model 1" / "Model 2". Populate from available models list. Lock during comparison.

  **Shared prompt input** (steal from LLM-Comparison `comparison.tsx:414-611`):
  `<Textarea>` at the bottom spanning full width. Auto-resize. Enter to submit (Shift+Enter for newline). "Compare" button. Below button: muted text "Each comparison sends 2 requests using your active plan."

  **Response display** (steal from OpenPlayground `compare.tsx:61-144`):
  Per panel: model name in header, response area with `ReactMarkdown + remarkGfm` rendering, response time badge (e.g., "3.2s"). Loading state: pulsing border animation + elapsed timer.

  **Advanced settings** (steal from LLM-Comparison `advanced-options.tsx`):
  "Settings" gear icon → dialog with: Temperature slider (0-2, default 1), Max response length slider. Keep minimal — only 2 settings.

- [x] **Build API endpoint `POST /api/playground/compare`**
  Auth → Pro plan check → rate limit (10/min). Accepts: `{ model1, model2, prompt, temperature?, maxTokens? }`. Sends BOTH requests to clawhq-models API in parallel (`Promise.all`). Returns: `{ response1: { content, responseTimeMs }, response2: { content, responseTimeMs } }`. If one model fails, still return the other's response with error for the failed one.

- [x] **Save comparison (optional)**
  "Save" button after comparison completes. Saves to VPS Data API: `POST /api/comparisons` with prompt, models, responses, response times. History page: list past comparisons, click to view.

- [x] **Add to sidebar navigation**
  Under Pro tools: "Model Playground" with `FlaskConical` icon from Lucide.

---

## 3. AGENT BUILDER

**What:** Two ways to create agents — AI-assisted (describe what you want) or manual form. Both output valid OpenClaw config files deployed to VPS.

**Data:** Agent configs live on VPS only. Supabase only has `user_agents` ownership record.

### Page & Navigation

- [x] **Create page `/dashboard/agent-builder/page.tsx`**
  Pro-gated. Two tabs: "AI Assistant" | "Manual Builder". Both lead to preview → deploy flow.

- [x] **Add to sidebar navigation**
  Under Pro tools: "Agent Builder" with `Wand2` or `Sparkles` icon.

### AI-Assisted Mode (Tab 1)

- [x] **Build describe UI**
  Large textarea: "Describe the agent you want to create..."
  Example prompts as clickable pills below: "Customer support agent that handles refunds", "Research assistant that searches the web", "Content writer for blog posts"
  "Generate Agent" button.

- [x] **Build generation API endpoint `POST /api/agents/generate`**
  Auth → Pro plan check → rate limit (5/min — generation is expensive).
  Takes: `{ description: string }`.
  Sends to clawhq-models API with a system prompt that includes:
  - Full OpenClaw agent config format (SOUL.md, identity.md, TOOLS.md, config.json structure)
  - Available tools list
  - Best practices for each file
  - Instruction: "Generate all config files based on the user's description. Return as JSON: { soul_md, identity_md, tools_md, config_json }"
  Returns: generated config files as JSON.

  **The system prompt for generation is critical.** It must contain enough OpenClaw context for the model to generate valid configs. Reference: Sim Studio's wand prompt pattern at `sim-reference/apps/sim/blocks/blocks/agent.ts:80-99`.

- [x] **Preview generated config**
  After generation, show the files in tabbed editors (SOUL.md | identity.md | TOOLS.md | config.json). Each tab is a textarea with the generated content. User can edit before deploying. Show markdown preview for SOUL.md.

### Manual Form Mode (Tab 2)

- [x] **Build form UI** (steal Firecrawl's `NodePanel.tsx` pattern — slide-in panel with sectioned form)
  Sections:
  1. **Agent Name** — text input (required). Sanitized for filesystem: lowercase, no spaces.
  2. **Personality (SOUL.md)** — large textarea (min 8 rows) with markdown preview toggle. "Generate with AI" button next to label — user types a one-line description, AI fills the textarea. Uses the wand pattern from Sim Studio.
  3. **Identity** — three fields: Display Name (text), Theme (text, e.g., "helpful assistant"), Emoji (emoji picker or text input).
  4. **Tools** — checkbox/toggle list of available tools grouped by category (Coding, Browser, Memory, Session, Subagent). Each tool has a one-line description. Reference: Firecrawl's `ConnectorsPanel.tsx` toggle pattern.
  5. **Model** — dropdown: "Use VPS Default" or pick specific model. Optional: Fallback model dropdown. (Reuses multi-model feature from section 1.)
  6. **User Context (optional)** — textarea: "Tell the agent about yourself or your company." Becomes USER.md.
  7. **Channel Routing (optional)** — multi-select: which channels this agent responds on. If empty, responds on all channels.

- [x] **Auto-save with debounce**
  Every field change triggers a 500ms debounced save to local state (not server). "Draft saved" indicator. Reference: Firecrawl's `NodePanel.tsx:302-354`.

- [x] **Generate config files from form**
  Transform form values into `Record<string, string>`:
  ```typescript
  const configFiles = {
    "SOUL.md": formValues.soulContent,
    "identity.md": `# ${formValues.displayName}\ntheme: ${formValues.theme}\nemoji: ${formValues.emoji}`,
    "TOOLS.md": formValues.selectedTools.map(t => `- ${t}`).join("\n"),
    "config.json": JSON.stringify({
      model: { primary: formValues.primaryModel || "clawhq/default", fallbacks: formValues.fallbackModel ? [formValues.fallbackModel] : [] },
      identity: { name: formValues.displayName, theme: formValues.theme, emoji: formValues.emoji },
      sandbox: { mode: "all", workspaceAccess: "rw", scope: "agent" },
      tools: { allow: formValues.selectedTools, deny: [] }
    }, null, 2),
  };
  if (formValues.userContext) configFiles["USER.md"] = formValues.userContext;
  ```

### Shared (Both Modes)

- [x] **Preview before deploy**
  Before deploying, show all generated config files in tabbed read-only editors. User reviews. "Deploy Agent" button at bottom. "Edit" button to go back to form/AI mode.

- [x] **Deploy flow**
  "Deploy Agent" button → calls `POST /api/agents/deploy` with the config files → SSH writes files to VPS → OpenClaw restarts → success toast with link to Agents page. Error toast if SSH fails.

- [x] **Edit existing agents**
  From Agents page, "Edit" button on deployed agents → opens builder pre-filled with current config. Reads config files from VPS via SSH: `GET /api/agents/[id]/config` → returns current config files. User modifies → preview → redeploy.

- [x] **Build `GET /api/agents/[id]/config`**
  Auth → plan check → verify agent belongs to user → SSH into VPS → read agent folder files → return as `Record<string, string>`.

### Pre-built Store Agents (I'll seed these — not the 129 agent's job)

7 free agents in the Agent Store with full OpenClaw configs:
- Support Agent, Research Agent, Writer Agent, Data Agent, Sales Agent, Reviewer Agent, Manager Agent
- "Free — Limited Time" badge
- These are store items, not builder templates

---

## 4. CHANNEL ANALYTICS

**What:** Per-channel message stats. How many messages on each channel, response times, peak hours.

**Data source:** Analytics details live on VPS (per data architecture). Need `channel_type` tracked per message.

### Data Changes

- [x] **Ensure `channel_type` is tracked per message**
  In `chat/send/route.ts`: when saving analytics record, include the `channel_type` from the request context. If not available, default to "webchat". Check how the chat route knows which channel the message came from — it might need to be passed from the channel integration layer.

### API

- [x] **Build `GET /api/channels/analytics`**
  Auth → Pro plan check → rate limit (20/min).
  Query params: `?days=7|14|30`
  Reads from VPS Data API: `GET /api/analytics?group_by=channel`
  Returns: per-channel breakdown:
  ```json
  {
    "channels": [
      { "channel_type": "whatsapp", "total_messages": 450, "avg_response_time_ms": 2300, "peak_hour": 14 },
      { "channel_type": "telegram", "total_messages": 230, "avg_response_time_ms": 1800, "peak_hour": 10 }
    ],
    "hourly_heatmap": { "whatsapp": [0,0,0,...24 values], "telegram": [...] }
  }
  ```

### UI

- [x] **Add "Analytics" tab to Channels page**
  Tab bar at top of Channels page: "Channels" | "Analytics". Analytics tab shows:

  1. **Summary cards** — 4 cards: Total Messages (all channels), Avg Response Time, Most Active Channel, Peak Hour. Date range selector (7d/14d/30d).

  2. **Per-channel bar chart** — horizontal bars showing message count per channel. Channel icon + name on left, bar on right. Color-coded per channel type.

  3. **Response time per channel** — bar chart comparing avg response times across channels. Helps identify slow channels.

  4. **Active hours heatmap** — 24-column × N-channel grid. Cell color intensity = message volume for that hour+channel combo. Shows when each channel is busiest. Reference: inspired by GitHub contribution graph.

  5. **Top agents per channel** — table: Agent Name | Channel | Messages Handled | Avg Response Time. Shows which agents are handling which channels.

---

## 5. AUTO-RESPONSES

**What:** User-configurable automatic replies. Greeting messages, away messages, FAQ auto-replies. Per-channel or global. Business hours config.

**Data:** Auto-response configs are small — can stay in Supabase (like webhook configs). They're platform-level settings, not user content.

### Database

- [x] **Create `auto_responses` table**
  ```sql
  CREATE TABLE auto_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_type TEXT, -- null = all channels
    type TEXT NOT NULL, -- 'greeting', 'away', 'faq'
    trigger_keyword TEXT, -- for FAQ type: keyword/phrase that triggers it
    response_text TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [x] **Create `business_hours` table**
  ```sql
  CREATE TABLE business_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_type TEXT, -- null = all channels
    timezone TEXT NOT NULL DEFAULT 'UTC',
    monday_start TIME, monday_end TIME, monday_enabled BOOLEAN DEFAULT true,
    tuesday_start TIME, tuesday_end TIME, tuesday_enabled BOOLEAN DEFAULT true,
    wednesday_start TIME, wednesday_end TIME, wednesday_enabled BOOLEAN DEFAULT true,
    thursday_start TIME, thursday_end TIME, thursday_enabled BOOLEAN DEFAULT true,
    friday_start TIME, friday_end TIME, friday_enabled BOOLEAN DEFAULT true,
    saturday_start TIME, saturday_end TIME, saturday_enabled BOOLEAN DEFAULT false,
    sunday_start TIME, sunday_end TIME, sunday_enabled BOOLEAN DEFAULT false,
    UNIQUE(user_id, channel_type)
  );
  ```

### API

- [x] **Build CRUD for `/api/auto-responses`**
  GET: list user's auto-responses. POST: create (max 20 per user). PATCH: update. DELETE: remove. All Pro-gated + rate limited.

- [x] **Build CRUD for `/api/business-hours`**
  GET: get user's business hours config. POST/PUT: set business hours (upsert). Pro-gated.

- [x] **Wire into message pipeline**
  In chat processing (`chat/send/route.ts`), BEFORE sending to the AI model:
  1. Check if it's a new conversation → send greeting (if enabled for this channel)
  2. Check if outside business hours → send away message (if enabled) and skip AI call
  3. Check if message matches any FAQ keyword → send FAQ response and skip AI call
  4. If none match → proceed to AI model as normal

  Order matters: away message takes priority over FAQ, FAQ over AI.

### UI

- [x] **Add auto-response management to Channels page**
  New section or tab: "Auto-Responses". Three sub-sections:

  **Greeting Messages:**
  - Toggle: "Enable greeting message" (per-channel or global)
  - Textarea: the greeting text
  - Channel selector: "All channels" or pick specific ones
  - Preview panel showing how it looks

  **Away Messages:**
  - Toggle: "Enable away message"
  - Textarea: the away message text
  - Linked to business hours (below) — auto-activates outside hours
  - Channel selector

  **FAQ Auto-Replies:**
  - Table: Keyword/Phrase | Response | Channels | Enabled
  - "Add FAQ" button → inline form or dialog
  - Each row has edit/delete/toggle

- [x] **Business Hours config**
  Per-channel or global. UI:
  - Timezone dropdown (searchable)
  - 7-day grid: each day has a toggle (on/off) + start time + end time
  - "Copy to all channels" button
  - Visual preview: "Currently [OPEN/CLOSED] — next change in 3 hours"

---

## PART B2: ENHANCE EXISTING FEATURES

### 6. WEBHOOKS ENHANCEMENT (8 features from Svix + Hookdeck patterns)

**What we already have:** 9 event types, HMAC signatures, SSRF protection, delivery logs, auto-retry (3 attempts, exponential backoff), templates (Slack/Discord/Zapier), per-webhook stats, edit UI, circuit breaker, secret masking, 10 webhook limit.

**What premium webhook platforms (Svix, Hookdeck) have that we don't — adding all 8:**

- [x] **6.1 Event Replay**
  "Replay" button on each delivery in the delivery history. Clicking it re-sends the exact same payload to the webhook endpoint. Creates a new delivery record with `is_replay: true` flag.
  API: `POST /api/webhooks/[id]/deliveries/[deliveryId]/replay` — fetches the original delivery's payload, re-dispatches to the webhook URL with fresh HMAC signature, inserts new delivery record.
  UI: "Replay" icon button on each delivery row in the history panel. Shows toast: "Event replayed" on success.
  **Why:** Users' endpoints go down, they miss events. Replay lets them recover without asking support.
  Reference: Svix — "test, inspect and replay webhooks"

- [x] **6.2 Bulk Retry All Failed**
  "Retry All Failed" button at the top of delivery history. Retries all deliveries where `success = false` and `retry_count < max_retries`.
  API: `POST /api/webhooks/[id]/deliveries/bulk-retry` — queries all failed deliveries for this webhook, re-dispatches each, updates delivery records. Max 50 per batch.
  UI: Button in delivery history header: "Retry All Failed (X)" with count badge. Disabled if no failed deliveries. Shows progress: "Retrying 12/23..."
  **Why:** Saves clicking "retry" one by one when endpoint was down for hours.
  Reference: Hookdeck — "replay events in bulk"

- [x] **6.3 Event Filtering per Webhook**
  Each webhook can define filter conditions — only deliver events matching the filter.
  DB: Add `filter_conditions JSONB` column to `webhooks` table. Format: `{ "field": "payload.agent_name", "operator": "equals", "value": "Support Bot" }` or `{ "field": "event_type", "operator": "in", "value": ["message.received", "agent.deployed"] }`.
  Logic: In `webhook-dispatch.ts`, before sending, evaluate filter conditions against the event payload. Skip delivery if filter doesn't match (log as "filtered" in delivery history).
  UI: In webhook edit dialog, add "Filter" section. Simple rule builder: Field dropdown (event_type, agent_name, channel_type, etc.) + Operator (equals, not_equals, contains, in) + Value input. Multiple conditions = AND logic.
  **Why:** "I only want Slack to get agent events, not every message" — reduces noise.
  Reference: Hookdeck — "filter events based on payload structure and content"

- [x] **6.4 Configurable Retry Policy per Webhook**
  Each webhook can set its own retry policy instead of the global 3-attempt exponential backoff.
  DB: Add `retry_max_attempts INTEGER DEFAULT 3`, `retry_interval_seconds INTEGER DEFAULT 30` columns to `webhooks` table.
  Logic: In retry processing, use per-webhook retry config instead of hardcoded values. Backoff: `interval * 2^attempt` with the configured base interval.
  UI: In webhook create/edit dialog, add "Retry Policy" section: "Max attempts" number input (1-10, default 3), "Base interval" dropdown (10s, 30s, 1min, 5min, 15min, default 30s). Show calculated schedule: "Retry 1: 30s, Retry 2: 1min, Retry 3: 2min".
  **Why:** Some endpoints need fast retries (10s), others can wait (15min). One size doesn't fit all.
  Reference: Hookdeck — "customizable retry policies and exponential backoff"

- [x] **6.5 Payload Transformations**
  Users can write a JavaScript function that modifies the webhook payload before delivery.
  DB: Add `transformation TEXT` column to `webhooks` table. Stores the JS function as a string.
  Logic: In `webhook-dispatch.ts`, if webhook has a transformation, run it in a sandboxed `new Function()` or `vm2` sandbox: `const transform = new Function('event', webhook.transformation); const modifiedPayload = transform(event);`. Set timeout (100ms max), catch errors. If transform fails, send original payload + log error.
  UI: In webhook edit dialog, add "Transform" tab. Code editor (monaco-editor or basic textarea with monospace font) with template:
  ```javascript
  // Modify the event before delivery
  // Return the modified event object
  return {
    text: `New event: ${event.event_type} from ${event.payload.agent_name}`,
    channel: "#notifications"
  };
  ```
  "Test Transform" button: takes the most recent event payload, runs the transform, shows the output. Preview before saving.
  **Why:** Users can format payloads to match their endpoint's expected format. Essential for Slack (needs `{ text: "..." }` format) or custom integrations.
  Reference: Svix — "JavaScript code on endpoints that can change HTTP method, URL, and body payload"

- [x] **6.6 Pause/Resume Delivery**
  Users can pause a webhook endpoint temporarily — events are queued but not delivered until resumed.
  DB: Add `paused_at TIMESTAMPTZ` column to `webhooks` table. When paused, delivery logs are created with `status: "paused"` instead of being dispatched.
  Logic: In `webhook-dispatch.ts`, check if webhook is paused. If yes, insert delivery with `status_code: null, success: false, response_body: "Delivery paused"`. When webhook is resumed, optionally deliver all paused events.
  UI: Toggle button on webhook card: "Pause" / "Resume". When paused, show yellow "Paused" badge. "Resume" dialog asks: "Deliver queued events? (X events paused)" with Yes/No.
  **Why:** Endpoint maintenance, debugging, or temporary disable without losing events.
  Reference: Hookdeck — "pause, cancel or replay events in bulk"

- [x] **6.7 Event Versioning**
  Event types include a version prefix: `v1.message.received`, `v1.agent.deployed`. When payload format changes, create new version. Users can subscribe to specific versions.
  DB: Update `AVAILABLE_EVENTS` to include version prefix. Add `event_version TEXT DEFAULT 'v1'` to webhooks table.
  Logic: When dispatching, match event version against webhook's subscribed version. `v1.message.received` webhook doesn't receive `v2.message.received` events.
  UI: Events in the create/edit dialog show with version badge: "v1 message.received". When new versions exist, show: "v2 available — upgrade?" link.
  **Why:** Future-proofs the webhook system. Users can upgrade event formats at their own pace without breaking integrations.
  Reference: Svix — "prefix version in front of event type like v2.invoice.paid"

- [x] **6.8 Multi-Destination Routing**
  A single event can be sent to multiple webhook endpoints. Users create "routes" — one event type → multiple destinations.
  DB: Create `webhook_routes` table: `id, user_id, event_type, webhook_ids (UUID[]), is_enabled, created_at`. Or simpler: just allow multiple webhooks to subscribe to the same event (already supported — just need UI to make it obvious).
  Logic: Already works — `webhook-dispatch.ts` queries all webhooks for the user with matching event type. Multiple webhooks subscribing to the same event = multi-destination.
  UI: Make this explicit in the UI. When creating a webhook, show: "This event is also being sent to: [Webhook X], [Webhook Y]". Add a "Routes" view that shows event types as rows and webhook endpoints as columns, with checkmarks showing which webhooks receive which events. Visual routing map.
  **Why:** "I want Slack for alerts AND my CRM for tracking" — same event, two destinations.
  Reference: Hookdeck — "route events to one or many destinations"

### 7. API ACCESS ENHANCEMENT (22 features from OpenAI, Anthropic, Replicate, Stripe patterns)

**What we already have:** API key management (5 keys, masking, HMAC hashing), SSE streaming (`stream: true`), health endpoint, conversation history API, per-key usage stats, per-key rate limit config, interactive docs + playground, 4-language code examples, webhook on API events.

**What every premium AI API platform has that we don't — adding all 22.**

**IMPORTANT CONTEXT:** Our V1 Chat API currently works like this:
1. Client sends `POST /api/v1/chat` with `Authorization: Bearer clw_xxx` + message + optional agent name
2. Our server validates key → finds user → finds VPS → proxies to OpenClaw on VPS port 18789
3. OpenClaw processes via clawhq-models API → returns response
4. Our server returns response to client

All 22 features modify this pipeline. The agent needs to understand the full flow in `src/app/api/v1/chat/route.ts`.

---

#### 7.1 Rate Limit Headers

**What it is:** Every V1 API response includes headers telling the client how many requests they have left before hitting the rate limit.

**Current state:** We rate limit per key (configurable 30/60/120/300 RPM) but return nothing in headers. Client gets 429 with no context.

**What to build:**

The existing `rateLimit()` function in `src/lib/rate-limit.ts` needs to return the rate limit state, not just pass/fail.

Modify `rateLimit()` to return:
```typescript
interface RateLimitResult {
  allowed: boolean;
  limit: number;        // max requests in window (e.g., 60)
  remaining: number;    // requests left (e.g., 45)
  reset: number;        // Unix timestamp when window resets
  retryAfter?: number;  // seconds to wait (only when blocked)
}
```

In `v1/chat/route.ts`, after rate limit check, add headers to the response:
```typescript
const rl = await rateLimit(keyId, { max: apiKey.rate_limit_per_min, window: 60 });
const headers = {
  "X-RateLimit-Limit": String(rl.limit),
  "X-RateLimit-Remaining": String(rl.remaining),
  "X-RateLimit-Reset": String(rl.reset),
};
if (!rl.allowed) {
  headers["Retry-After"] = String(rl.retryAfter);
  return NextResponse.json({ error: { code: "rate_limited", ... } }, { status: 429, headers });
}
// ... process request, add headers to success response too
return NextResponse.json(response, { headers });
```

Add these headers to ALL V1 API responses — chat, health, conversations, models, files, agents, threads, batches, predictions.

**Files to modify:** `src/lib/rate-limit.ts` (return state), `src/app/api/v1/chat/route.ts` (add headers), all new V1 endpoints.

**Reference:** OpenAI returns `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`, `x-ratelimit-reset-requests` (for RPM) and same for TPM.

---

#### 7.2 Request IDs

**What it is:** Every API request gets a unique server-generated ID. Optionally, clients can send their own ID too. Both are returned in response headers and stored for debugging.

**Current state:** No request IDs anywhere. When a user reports "my API call failed," we have no way to find it in logs.

**What to build:**

At the TOP of every V1 API route handler, before any processing:
```typescript
const requestId = `req_${crypto.randomUUID().replace(/-/g, "")}`;
const clientRequestId = request.headers.get("x-client-request-id") || null;
```

Store both IDs:
- In the analytics record for this request
- In error logs if the request fails
- In the response headers:
  ```
  X-Request-Id: req_abc123def456
  X-Client-Request-Id: my-custom-id-789  (only if client sent one)
  ```

When users report issues, they provide the `X-Request-Id` value. You can then find the exact request in your analytics/logs.

**Database change:** Add `request_id TEXT` and `client_request_id TEXT` columns to the analytics table (on VPS SQLite when Data API is ready, or `agent_analytics` in Supabase for now).

**Files to modify:** All V1 API routes. Best approach: create a helper `createRequestContext(request)` that generates IDs, extracts client ID, and returns both. Use at the start of every route.

---

#### 7.3 Structured Error Codes

**What it is:** All API errors return a consistent JSON structure with a machine-readable error code, human-readable message, error type, and request ID.

**Current state:** Errors are inconsistent — some return `{ error: "string" }`, some return `{ message: "string" }`. No error codes. Clients have to parse error message strings to know what went wrong.

**What to build:**

Create `src/lib/api-errors.ts`:
```typescript
// Error code enum
export type APIErrorCode =
  | "rate_limited"
  | "invalid_api_key"
  | "revoked_api_key"
  | "expired_api_key"
  | "plan_required"
  | "invalid_request"
  | "missing_parameter"
  | "invalid_parameter"
  | "agent_not_found"
  | "agent_offline"
  | "model_error"
  | "model_timeout"
  | "content_blocked"
  | "file_too_large"
  | "unsupported_file_type"
  | "batch_too_large"
  | "thread_not_found"
  | "internal_error";

// Error type categories
export type APIErrorType = "authentication_error" | "authorization_error" | "validation_error" | "agent_error" | "model_error" | "api_error";

// Standard error response shape
export interface APIError {
  error: {
    code: APIErrorCode;
    message: string;
    type: APIErrorType;
    request_id: string;
    param?: string;  // which parameter caused the error (for validation)
  };
}

// Helper to create error response
export function apiError(
  code: APIErrorCode,
  message: string,
  requestId: string,
  options?: { status?: number; param?: string }
): NextResponse {
  const type = getErrorType(code);
  const status = options?.status || getDefaultStatus(code);
  return NextResponse.json({
    error: { code, message, type, request_id: requestId, ...(options?.param && { param: options.param }) }
  }, { status });
}

function getErrorType(code: APIErrorCode): APIErrorType {
  if (["invalid_api_key", "revoked_api_key", "expired_api_key"].includes(code)) return "authentication_error";
  if (["plan_required"].includes(code)) return "authorization_error";
  if (["invalid_request", "missing_parameter", "invalid_parameter", "file_too_large", "unsupported_file_type", "batch_too_large"].includes(code)) return "validation_error";
  if (["agent_not_found", "agent_offline"].includes(code)) return "agent_error";
  if (["model_error", "model_timeout", "content_blocked"].includes(code)) return "model_error";
  return "api_error";
}

function getDefaultStatus(code: APIErrorCode): number {
  const map: Record<string, number> = {
    rate_limited: 429, invalid_api_key: 401, revoked_api_key: 401, expired_api_key: 401,
    plan_required: 403, invalid_request: 400, missing_parameter: 400, invalid_parameter: 400,
    agent_not_found: 404, agent_offline: 503, model_error: 502, model_timeout: 504,
    content_blocked: 451, file_too_large: 413, unsupported_file_type: 415,
    batch_too_large: 400, thread_not_found: 404, internal_error: 500,
  };
  return map[code] || 500;
}
```

Replace EVERY error response in V1 routes with `apiError()` calls. Example:
```typescript
// BEFORE:
return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
// AFTER:
return apiError("invalid_api_key", "The API key provided is invalid.", requestId);
```

**Files to modify:** Create `src/lib/api-errors.ts`. Update all V1 API routes to use it.

---

#### 7.4 Model Listing Endpoint

**What it is:** API endpoint to list available AI models the user can use.

**Current state:** No way to discover available models via API. Users have to check the dashboard.

**What to build:**

Create `src/app/api/v1/models/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // 1. Validate API key (same as chat endpoint)
  // 2. Get user's subscription plan
  // 3. Query available models from DB (available_models table)
  // 4. Filter by plan access if needed
  // 5. Return model list

  return NextResponse.json({
    models: [
      {
        id: "kimi-k2.5",
        name: "Kimi K2.5",
        context_window: 128000,
        capabilities: ["chat", "analysis"],
        // NO cost/pricing info — remember: no cost shown to users
      },
      // ...more models
    ]
  }, { headers: rateLimitHeaders });
}
```

Auth: API key validation (same as chat). Rate limit: 20/min. No model request used.

Each model object includes: `id` (for use in API calls), `name` (display), `context_window`, `capabilities` (what it can do). **No pricing, no token limits, no cost info.**

**Files to create:** `src/app/api/v1/models/route.ts`

---

#### 7.5 Structured Output / JSON Mode

**What it is:** User can request the model to return valid JSON only, not free-form text.

**Current state:** Model returns whatever format it wants. Devs building automations have to parse and hope.

**What to build:**

Add `response_format` parameter to `POST /v1/chat`:
```json
{ "message": "List 5 fruits", "response_format": "json" }
```

In `v1/chat/route.ts`, when `response_format === "json"`:
1. Prepend to system prompt: `"IMPORTANT: You MUST respond with valid JSON only. No markdown fences, no explanation text, no preamble. Output ONLY a valid JSON object or array."`
2. After receiving the model's response, try `JSON.parse(response)`:
   - If valid JSON → return as-is
   - If invalid → strip markdown fences (` ```json...``` `), try parsing again
   - If still invalid → retry the request once with an even stronger instruction: `"Your previous response was not valid JSON. Respond with ONLY valid JSON. Nothing else."`
   - If still invalid after retry → return the raw response with a warning header: `X-ClawHQ-Warning: response_not_valid_json`

Response includes `format` field:
```json
{ "response": { ... }, "format": "json", "request_id": "req_..." }
```

Optionally accept a JSON schema:
```json
{ "message": "...", "response_format": "json", "json_schema": { "type": "object", "properties": { "fruits": { "type": "array" } } } }
```
When schema is provided, add it to the system prompt: `"Respond with JSON matching this schema: ..."`. Validate response against schema using `ajv` or `zod`.

**Files to modify:** `src/app/api/v1/chat/route.ts`. Consider installing `ajv` for schema validation.

---

#### 7.6 Usage Analytics via API

**What it is:** API endpoint to check your own API usage programmatically.

**Current state:** Per-key stats exist in the dashboard UI but not via API.

**What to build:**

Create `src/app/api/v1/usage/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // 1. Validate API key
  // 2. Get usage stats for this key
  const days = parseInt(request.nextUrl.searchParams.get("days") || "7");

  // Query from analytics (VPS Data API when ready, or Supabase for now)
  // Group by date for the requesting key

  return NextResponse.json({
    key_name: apiKey.name,
    period: `${days}d`,
    usage: [
      { date: "2026-03-15", requests: 142, errors: 3, avg_response_time_ms: 2100 },
      { date: "2026-03-14", requests: 89, errors: 0, avg_response_time_ms: 1800 },
    ],
    totals: {
      total_requests: 231,
      total_errors: 3,
      avg_response_time_ms: 1950,
    }
  });
}
```

**No cost/token data.** Just request counts, error counts, response times.

Auth: API key. Rate limit: 10/min. Params: `days` (1-90, default 7).

**Files to create:** `src/app/api/v1/usage/route.ts`

---

#### 7.7 Client Request IDs

**What it is:** Clients can send their own tracking ID alongside each request.

**Current state:** Not supported.

**What to build:**

Already covered in 7.2 — the `X-Client-Request-Id` header. Just making it explicit:
- Accept the header
- Echo it back in the response
- Store it in analytics alongside server request ID
- If combined with idempotency (7.10): same client request ID + `Idempotency-Key` can deduplicate

**No separate work needed** — this is part of 7.2 implementation.

---

#### 7.8 Tool Use / Function Calling

**What it is:** The model can decide to "call a function" instead of responding with text. The client executes the function and sends the result back. The model then uses the result to generate the final answer.

**Current state:** Not supported. All responses are plain text/markdown.

**This is a complex feature. Full flow:**

**Step 1 — Client sends request with tool definitions:**
```json
POST /v1/chat
{
  "message": "What's the weather in New York?",
  "agent": "assistant",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string", "description": "City name" },
            "units": { "type": "string", "enum": ["celsius", "fahrenheit"], "default": "celsius" }
          },
          "required": ["city"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "search_products",
        "description": "Search for products in the catalog",
        "parameters": {
          "type": "object",
          "properties": {
            "query": { "type": "string" },
            "category": { "type": "string" }
          },
          "required": ["query"]
        }
      }
    }
  ]
}
```

**Step 2 — Server sends to clawhq-models API with tools:**
The V1 chat route passes the tools array to the model API. Most modern model APIs (OpenAI format) support a `tools` parameter natively. Since ClawHQ proxies to OpenClaw which uses OpenAI-compatible API format, this should be a pass-through.

**Step 3 — Model responds with a tool call (instead of text):**
```json
{
  "type": "tool_call",
  "tool_calls": [
    {
      "id": "call_abc123",
      "function": {
        "name": "get_weather",
        "arguments": "{\"city\": \"New York\", \"units\": \"fahrenheit\"}"
      }
    }
  ],
  "request_id": "req_xyz"
}
```
Note: `arguments` is a JSON STRING (OpenAI convention). The client must parse it.

**Step 4 — Client executes the function and sends result back:**
```json
POST /v1/chat
{
  "message": "",
  "thread_id": "thread_abc",
  "tool_results": [
    {
      "tool_call_id": "call_abc123",
      "result": "{\"temperature\": 72, \"condition\": \"sunny\", \"humidity\": 45}"
    }
  ]
}
```

**Step 5 — Model generates final response using the tool result:**
```json
{
  "type": "message",
  "response": "The weather in New York is currently 72°F and sunny with 45% humidity.",
  "request_id": "req_xyz2"
}
```

**Implementation in `v1/chat/route.ts`:**
1. Accept `tools` array in request body (validate each tool has name, description, parameters)
2. Pass tools to the OpenClaw proxy request (OpenClaw → clawhq-models API)
3. Parse the model response:
   - If response contains tool calls → return `type: "tool_call"` to client
   - If response is text → return `type: "message"` as normal
4. Accept `tool_results` in request body (for the follow-up call)
5. Pass tool results back to model → get final text response

**The key insight:** This is mostly a pass-through. The model API already supports tools. We're just passing the `tools` and `tool_results` fields through our proxy. The complexity is in the request/response shape transformation if OpenClaw's format differs from our V1 API format.

**Streaming with tools:** When `stream: true` and tools are used:
- Stream can emit tool call chunks: `data: {"type":"tool_call","function":{"name":"get_weather","arguments":"{\"ci"}}\n\n`
- Client collects chunks until complete, then executes tool

**Files to modify:** `src/app/api/v1/chat/route.ts` (main change), types file for tool definitions.

---

#### 7.9 SDKs (Python + JavaScript)

**What it is:** Published packages that devs install and use instead of raw HTTP calls.

**Current state:** We show code examples in the dashboard (cURL, Python, JS, PowerShell) but no installable packages.

**What to build:**

**Two separate repos/packages:**

**Python SDK (`clawhq` on PyPI):**
```
clawhq-python/
├── clawhq/
│   ├── __init__.py      ← exports ClawHQ class
│   ├── client.py        ← main client class
│   ├── types.py         ← response/request types (dataclasses)
│   ├── errors.py        ← ClawHQError, RateLimitError, etc.
│   ├── resources/
│   │   ├── chat.py      ← chat methods (sync, stream, batch, async)
│   │   ├── agents.py    ← agent CRUD
│   │   ├── threads.py   ← thread management
│   │   ├── files.py     ← file upload
│   │   └── models.py    ← model listing
│   └── _streaming.py    ← SSE stream parser
├── pyproject.toml
├── README.md
└── tests/
```

Usage:
```python
from clawhq import ClawHQ

client = ClawHQ(api_key="clw_...")

# Simple chat
response = client.chat.create(message="Hello!", agent="support-bot")
print(response.content)

# Streaming
for chunk in client.chat.create(message="Tell me a story", stream=True):
    print(chunk.content, end="")

# With tools
response = client.chat.create(
    message="What's the weather?",
    tools=[{"type": "function", "function": {"name": "get_weather", ...}}]
)
if response.type == "tool_call":
    # handle tool call

# Agents
agents = client.agents.list()
new_agent = client.agents.create(name="My Bot", description="A helpful bot")

# Threads
thread = client.threads.create()
client.threads.messages.create(thread.id, message="Hello")
messages = client.threads.messages.list(thread.id)
```

Features: auto-retry with backoff on 429/500, rate limit header parsing, request ID tracking, streaming support, typed responses, async support (`AsyncClawHQ`).

**JavaScript/TypeScript SDK (`@clawhq/sdk` on npm):**
```
clawhq-js/
├── src/
│   ├── index.ts         ← exports ClawHQ class
│   ├── client.ts        ← main client
│   ├── types.ts         ← TypeScript types
│   ├── errors.ts        ← typed errors
│   ├── resources/
│   │   ├── chat.ts
│   │   ├── agents.ts
│   │   ├── threads.ts
│   │   ├── files.ts
│   │   └── models.ts
│   └── streaming.ts     ← SSE parser
├── package.json
├── tsconfig.json
└── tests/
```

Usage:
```typescript
import { ClawHQ } from '@clawhq/sdk';

const client = new ClawHQ({ apiKey: 'clw_...' });

// Simple chat
const response = await client.chat.create({ message: 'Hello!', agent: 'support-bot' });
console.log(response.content);

// Streaming
const stream = await client.chat.create({ message: 'Tell me a story', stream: true });
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

// Agents
const agents = await client.agents.list();
```

**This is a separate project** from the dashboard. The 129 agent should create the SDK repos (or at minimum the source code in a `packages/` directory). Publishing to PyPI/npm can be done manually or via CI/CD.

**Update the interactive docs page** to show SDK installation and usage alongside raw HTTP examples.

---

#### 7.10 Idempotency Keys

**What it is:** Client sends a unique key with the request. If the same key is sent again, the server returns the cached response instead of processing again.

**Current state:** Not supported. If a client retries a failed request, it gets processed twice — potentially sending duplicate messages to the agent.

**What to build:**

Accept `Idempotency-Key` header on all POST endpoints.

**Flow:**
1. Client sends `POST /v1/chat` with `Idempotency-Key: idem_abc123`
2. Server checks: does `idem_abc123` exist in cache?
   - **Yes:** Return the cached response (same status code + body). Add header `X-Idempotent-Replayed: true`.
   - **No:** Process the request normally. After getting the response, store: `{ key: "idem_abc123", status: 200, body: {...}, created_at: now }` with 24-hour TTL.
3. If the first request is still processing when a duplicate arrives, return `409 Conflict` with `{ error: { code: "request_in_progress", message: "A request with this idempotency key is already being processed" } }`.

**Storage:** For simplicity, use a Supabase table:
```sql
CREATE TABLE idempotency_cache (
  key TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  status_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);
```
Add a cron to clean up expired entries. Or use Redis if available.

**Important:** The key is scoped to the API key (user). Two different users can use the same idempotency key string without conflict.

**Files to modify:** `v1/chat/route.ts` (and all future POST endpoints). Create `src/lib/idempotency.ts` helper.

---

#### 7.11 Message Batches (Async Bulk)

**What it is:** Send multiple chat requests at once, process them in the background, poll for results or get a webhook when done.

**Current state:** One message at a time only. Users doing bulk processing (100 emails to summarize, 50 documents to analyze) must send requests sequentially.

**What to build:**

**Create endpoint:** `POST /api/v1/chat/batch`
```json
{
  "requests": [
    { "custom_id": "req-1", "message": "Summarize this: ...", "agent": "writer" },
    { "custom_id": "req-2", "message": "Translate this: ...", "agent": "writer" },
    // ... up to 50
  ],
  "webhook_url": "https://example.com/batch-done"  // optional
}
```

**Response (immediate):**
```json
{
  "batch_id": "batch_abc123",
  "status": "processing",
  "total": 50,
  "completed": 0,
  "failed": 0,
  "created_at": "2026-03-15T10:00:00Z"
}
```

**Background processing:** The server processes each request sequentially (or with limited concurrency, e.g., 3 at a time to avoid overwhelming the VPS). For each completed request, update the batch record.

**Poll endpoint:** `GET /api/v1/chat/batch/:id`
```json
{
  "batch_id": "batch_abc123",
  "status": "completed",  // "processing" | "completed" | "failed" | "partial"
  "total": 50,
  "completed": 48,
  "failed": 2,
  "results": [
    { "custom_id": "req-1", "status": "completed", "response": "Summary: ..." },
    { "custom_id": "req-2", "status": "failed", "error": { "code": "model_timeout", "message": "..." } },
    // ...
  ],
  "created_at": "...",
  "completed_at": "..."
}
```

**Webhook callback:** When batch completes, POST the results to `webhook_url` (if provided). Use same HMAC signing as regular webhooks.

**Database:** Store batch jobs in Supabase (small metadata) or VPS (results):
```sql
CREATE TABLE api_batches (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'processing',
  total INTEGER,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```
Results stored on VPS (could be large).

**Rate limiting:** Batch counts as `total` requests against the user's rate limit. If they'd exceed the limit, reject the batch upfront.

**Files to create:** `src/app/api/v1/chat/batch/route.ts` (POST + GET by ID)

---

#### 7.12 Prediction Webhooks (Status Callbacks)

**What it is:** Instead of waiting for the response synchronously, fire a webhook when it's ready.

**Current state:** Client must hold the HTTP connection open until the response is ready (up to 60 seconds).

**What to build:**

Add `webhook_url` parameter to `POST /v1/chat`:
```json
{
  "message": "Analyze this 50-page document...",
  "agent": "researcher",
  "webhook_url": "https://example.com/callback"
}
```

**Response (immediate):**
```json
{
  "prediction_id": "pred_abc123",
  "status": "processing",
  "request_id": "req_xyz"
}
```

**When processing completes,** POST to the webhook URL:
```json
{
  "prediction_id": "pred_abc123",
  "status": "completed",
  "response": "The analysis shows...",
  "request_id": "req_xyz",
  "processing_time_ms": 15000
}
```

Signed with HMAC using the user's webhook secret (or a per-prediction secret returned in the initial response).

**Poll fallback:** `GET /api/v1/predictions/:id` — check status without webhook.

**Storage:** Prediction records in Supabase or VPS:
```sql
CREATE TABLE api_predictions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'processing',
  request_body JSONB,
  response_body JSONB,
  webhook_url TEXT,
  webhook_delivered BOOLEAN DEFAULT FALSE,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**Connection to batch (7.11):** Batches are essentially multiple predictions. The infrastructure can be shared.

**Files to create:** `src/app/api/v1/predictions/[id]/route.ts`, modify `v1/chat/route.ts` to support async mode.

---

#### 7.13 Multimodal Input (Images + Files in Chat)

**What it is:** Send images and files alongside text messages. The AI model can "see" images and read file contents.

**Current state:** Text only. If a user sends an image on WhatsApp to their agent, the agent can't see it.

**What to build:**

Extend `POST /v1/chat` to accept attachments:
```json
{
  "message": "What's in this image?",
  "agent": "assistant",
  "attachments": [
    {
      "type": "image_url",
      "url": "https://example.com/photo.jpg"
    },
    {
      "type": "image_base64",
      "data": "data:image/png;base64,iVBOR...",
      "media_type": "image/png"
    },
    {
      "type": "file",
      "file_id": "file_abc123"  // from /v1/files upload
    }
  ]
}
```

**How it works internally:**

1. **Image URLs:** Fetch the image, convert to base64, pass to model API in the OpenAI multimodal format:
   ```json
   { "role": "user", "content": [
     { "type": "text", "text": "What's in this image?" },
     { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
   ]}
   ```

2. **Image base64:** Pass directly to model API in same format.

3. **Files:** Read file content from VPS (if uploaded via /v1/files). For PDFs: extract text (use `pdf-parse` npm package). For TXT/MD/CSV: read as-is. Inject file content as context in the message.

**Supported types:**
- Images: PNG, JPG, JPEG, GIF, WebP (max 10MB)
- Files: PDF, TXT, MD, CSV, JSON (max 10MB) — text extracted and injected
- Max 5 attachments per request

**Validation:** Check file size, MIME type, total attachment count. Return structured errors (7.3) for invalid inputs.

**Files to modify:** `src/app/api/v1/chat/route.ts`. Consider installing `pdf-parse` for PDF text extraction.

---

#### 7.14 Context Caching

**What it is:** When multiple requests use the same system prompt / KB context, cache the processed context to avoid recomputing it every time.

**Current state:** Every request re-fetches and re-processes KB context from scratch. For agents with large KB, this adds latency.

**What to build:**

Add `cache_key` parameter to `POST /v1/chat`:
```json
{
  "message": "What's our refund policy?",
  "agent": "support-bot",
  "cache_key": "support-bot-kb-v1"
}
```

**How it works:**

1. On first request with `cache_key`: process KB search, build system prompt with context, cache the complete system prompt string. Store in memory cache (Node.js `Map`) with 1-hour TTL and 100-entry max:
   ```typescript
   const contextCache = new Map<string, { systemPrompt: string, expiresAt: number }>();
   ```

2. On subsequent requests with same `cache_key`: skip KB search, use cached system prompt directly. Save 200-500ms per request.

3. Cache is per-user (key includes user ID): `${userId}:${cache_key}`

4. Invalidation: cache entry expires after 1 hour. Also invalidate when KB documents are updated (add a cache-bust mechanism).

**Response metadata:**
```json
{
  "response": "...",
  "cache_status": "hit",  // "hit" | "miss" | "not_cached"
  "request_id": "..."
}
```

**Files to modify:** `src/app/api/v1/chat/route.ts`, `src/lib/knowledge-base.ts`. Create `src/lib/context-cache.ts`.

---

#### 7.15 Content Moderation / Guardrails

**What it is:** Check messages for harmful content before sending to the model, and check model responses before returning to the client.

**Current state:** No moderation. Whatever the user sends goes to the model, whatever the model returns goes to the user.

**What to build:**

Add `moderation` parameter to `POST /v1/chat`:
```json
{
  "message": "...",
  "moderation": {
    "enabled": true,
    "block_categories": ["violence", "sexual", "hate", "self_harm"],
    "custom_blocked_words": ["competitor_name", "internal_secret"]
  }
}
```

**Implementation (v1 — keyword/pattern based):**

Create `src/lib/moderation.ts`:
```typescript
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  violence: [/kill/i, /murder/i, /weapon/i, ...],
  sexual: [/explicit pattern/i, ...],
  hate: [/slur patterns/i, ...],
  self_harm: [/patterns/i, ...],
};

export function moderateContent(
  text: string,
  config: { block_categories: string[], custom_blocked_words?: string[] }
): { blocked: boolean; category?: string; matched_word?: string } {
  // Check each category
  for (const category of config.block_categories) {
    const patterns = CATEGORY_PATTERNS[category] || [];
    for (const pattern of patterns) {
      if (pattern.test(text)) return { blocked: true, category, matched_word: text.match(pattern)?.[0] };
    }
  }
  // Check custom words
  for (const word of config.custom_blocked_words || []) {
    if (text.toLowerCase().includes(word.toLowerCase())) return { blocked: true, category: "custom", matched_word: word };
  }
  return { blocked: false };
}
```

**Flow in chat route:**
1. Before sending to model: `moderateContent(userMessage, config)` — if blocked, return `apiError("content_blocked", ...)` without calling the model
2. After receiving model response: `moderateContent(modelResponse, config)` — if blocked, return a safe fallback: "I can't provide that information."

**v2 (future):** Replace keyword patterns with a real moderation model (OpenAI moderation API or a local classifier).

**Files to create:** `src/lib/moderation.ts`. Modify `v1/chat/route.ts`.

---

#### 7.16 Async Predictions with Callback

**Already covered in 7.12 (Prediction Webhooks).** Same feature — `async: true` parameter returns immediately with a `prediction_id`, client polls or receives webhook when done.

Add `async: true` as an alias for `webhook_url` without a URL — just "process in background, I'll poll for it":
```json
{ "message": "...", "async": true }
// Returns: { "prediction_id": "pred_abc", "status": "processing" }
// Poll: GET /v1/predictions/pred_abc
```

**No separate implementation needed** — reuses 7.12 infrastructure.

---

#### 7.17 Session/Thread Management via API

**What it is:** Persistent conversation threads that maintain context across multiple messages.

**Current state:** The V1 chat API has a `session_id` parameter but it's just a correlation ID — it doesn't actually maintain conversation history. Each message is processed independently (relies on OpenClaw's internal session management).

**What to build:**

**New endpoints:**

`POST /api/v1/threads` — create a new conversation thread:
```json
// Request:
{ "agent": "support-bot", "metadata": { "customer_id": "cust_123" } }
// Response:
{ "thread_id": "thread_abc123", "agent": "support-bot", "created_at": "...", "metadata": {...} }
```

`POST /api/v1/threads/:id/messages` — send a message in a thread:
```json
// Request:
{ "message": "Hello, I need help with my order" }
// Response:
{ "response": "Hi! I'd be happy to help. What's your order number?", "message_id": "msg_xyz", "request_id": "req_..." }
```
This endpoint automatically includes conversation history from the thread. The model sees all previous messages as context.

`GET /api/v1/threads/:id/messages` — get thread message history:
```json
// Response:
{
  "messages": [
    { "id": "msg_1", "role": "user", "content": "Hello...", "created_at": "..." },
    { "id": "msg_2", "role": "assistant", "content": "Hi! I'd be happy...", "created_at": "..." },
  ],
  "has_more": false,
  "thread_id": "thread_abc123"
}
```

`DELETE /api/v1/threads/:id` — delete thread and all messages.

`GET /api/v1/threads` — list user's threads (paginated).

**How threads differ from current `session_id`:**
- `session_id` is a pass-through to OpenClaw — no history management on our side
- Threads are managed by US — we store messages, we build the context window, we control history length
- Threads work even if OpenClaw's session management changes

**Message storage:** Thread messages stored on VPS (via Data API when ready, or in-memory/Supabase for now). Each message includes: role, content, attachments, tool calls, created_at.

**Context window management:** When sending to the model, include the last N messages from the thread (configurable, default 20). If the thread is very long, summarize older messages.

**Database:**
```sql
CREATE TABLE api_threads (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  agent TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_thread_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES api_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system' | 'tool'
  content TEXT,
  attachments JSONB,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Files to create:** `src/app/api/v1/threads/route.ts`, `src/app/api/v1/threads/[id]/route.ts`, `src/app/api/v1/threads/[id]/messages/route.ts`

---

#### 7.18 File Upload Endpoint

**What it is:** Upload files via API for use in chat (as attachments) or knowledge base.

**Current state:** Files can only be uploaded via the dashboard KB UI. API users can't programmatically add files.

**What to build:**

`POST /api/v1/files` — multipart form upload:
```
Content-Type: multipart/form-data
Authorization: Bearer clw_...

Fields:
- file: (binary file data)
- purpose: "chat_attachment" | "knowledge_base"
- filename: "report.pdf" (optional, extracted from file if not provided)
```

**Response:**
```json
{
  "file_id": "file_abc123",
  "filename": "report.pdf",
  "size": 1234567,
  "mime_type": "application/pdf",
  "purpose": "knowledge_base",
  "status": "processed",  // "processing" | "processed" | "error"
  "created_at": "..."
}
```

**How it works:**
1. Receive file via multipart form
2. Validate: size (max 10MB), type (PDF, TXT, MD, CSV, JSON, PNG, JPG, GIF, WebP)
3. If `purpose: "knowledge_base"`: process through KB pipeline (chunk, embed, store on VPS). Same as dashboard upload but via API.
4. If `purpose: "chat_attachment"`: store on VPS for later reference in chat messages. Return `file_id` that can be used in `attachments` array of chat requests.

**Additional endpoints:**
- `GET /api/v1/files` — list uploaded files (paginated)
- `GET /api/v1/files/:id` — get file details
- `DELETE /api/v1/files/:id` — delete file

**Storage:** Files stored on VPS (via Data API or SSH). File metadata in Supabase or VPS.

**Files to create:** `src/app/api/v1/files/route.ts`, `src/app/api/v1/files/[id]/route.ts`

---

#### 7.19 Agent Management via API

**What it is:** Create, configure, and manage AI agents programmatically via the API — not just chat with them.

**Current state:** Agents can only be managed via the dashboard UI. API users can only chat with pre-deployed agents.

**THIS IS THE MOST IMPORTANT API FEATURE.** It makes ClawHQ a platform, not just a service.

**What to build:**

`GET /api/v1/agents` — list deployed agents:
```json
{
  "agents": [
    {
      "id": "agent_abc123",
      "name": "Support Bot",
      "slug": "support-bot",
      "status": "deployed",
      "model": { "primary": "kimi-k2.5", "fallback": "minimax-m2.5" },
      "created_at": "..."
    }
  ]
}
```

`POST /api/v1/agents` — create and deploy a new agent:

**Option A — provide config files directly:**
```json
{
  "name": "Support Bot",
  "config_files": {
    "SOUL.md": "You are a friendly support agent...",
    "identity.md": "# Support Bot\ntheme: helpful assistant\nemoji: 🤖",
    "TOOLS.md": "- read\n- web\n- memory_search",
    "config.json": "{\"model\":{\"primary\":\"kimi-k2.5\"},\"sandbox\":{\"mode\":\"all\"}}"
  }
}
```

**Option B — provide a description (AI generates config):**
```json
{
  "name": "Support Bot",
  "description": "A friendly customer support agent that handles refund requests and FAQs",
  "generate": true
}
```
Server calls clawhq-models API to generate config files from the description (same as Agent Builder AI-assisted mode), then deploys.

**Response:**
```json
{
  "agent": {
    "id": "agent_abc123",
    "name": "Support Bot",
    "slug": "support-bot",
    "status": "deploying",
    "config_files": { ... },  // generated files (if generate: true)
    "created_at": "..."
  }
}
```

`GET /api/v1/agents/:id` — get agent details including config files.

`PATCH /api/v1/agents/:id` — update agent config:
```json
{
  "config_files": { "SOUL.md": "Updated personality..." },
  "model": { "primary": "minimax-m2.5" }
}
```
Redeploys the agent with updated config.

`DELETE /api/v1/agents/:id` — undeploy and remove agent.

**Implementation:** These endpoints call the same `deployAgent()`, `undeployAgent()` SSH functions used by the dashboard. The API is a programmatic interface to the same functionality.

**Files to create:** `src/app/api/v1/agents/route.ts`, `src/app/api/v1/agents/[id]/route.ts`

---

#### 7.20 Test/Sandbox Mode

**What it is:** Test API integration without affecting production data.

**Current state:** No test mode. Every API call is "real."

**What to build:**

Two approaches (implement both):

**Approach A — Test header:**
Add `X-Test-Mode: true` header to any request:
- Request processes normally (hits the real model for real responses)
- Response includes `test: true` in metadata
- Request does NOT count against rate limits
- No analytics recorded
- No webhooks fired
- Add a daily test mode limit (e.g., 100 test requests/day) to prevent abuse

**Approach B — Test API keys:**
Users can create test keys (prefixed `clw_test_`) alongside production keys (`clw_`):
- Test keys work exactly like production keys
- Test key requests are tagged `test: true` in analytics
- Separate from production in stats
- Same rate limits apply (to match production behavior)

**Implementation:**
In `v1/chat/route.ts`:
```typescript
const isTestMode = request.headers.get("x-test-mode") === "true" || apiKey.key_prefix === "clw_test_";
// ... process normally ...
if (!isTestMode) {
  // Record analytics
  // Fire webhooks
}
return NextResponse.json({ ...response, test: isTestMode });
```

**Files to modify:** `v1/chat/route.ts`, `keys/route.ts` (support creating test keys).

---

#### 7.21 API Versioning

**What it is:** Version the API so breaking changes don't break existing integrations.

**Current state:** Everything is "v1" by URL path. No version header support.

**What to build (infrastructure only — no v2 changes yet):**

Accept `ClawHQ-Version` header:
```
ClawHQ-Version: 2026-03-15
```

In every V1 route:
```typescript
const apiVersion = request.headers.get("clawhq-version") || "2026-03-15";
// Store in request log / analytics
// Echo back in response header
response.headers.set("ClawHQ-Version", apiVersion);
```

**For now:** All versions return the same response. When we make breaking changes in the future, we add version-specific logic:
```typescript
if (apiVersion < "2026-06-01") {
  // Old format
} else {
  // New format
}
```

**SDK integration:** SDKs automatically send the version header matching their release date.

**Files to modify:** All V1 routes (add header reading/echoing). Create `src/lib/api-version.ts` helper.

---

#### 7.22 Auto-Generated Changelog

**What it is:** A changelog page showing every API change with dates and descriptions.

**Current state:** No changelog. Users don't know when things change.

**What to build:**

Create a changelog data file `src/data/api-changelog.ts`:
```typescript
export const API_CHANGELOG = [
  {
    date: "2026-03-15",
    version: "2026-03-15",
    changes: [
      { type: "added", description: "Rate limit headers on all responses" },
      { type: "added", description: "Structured error codes" },
      { type: "added", description: "Model listing endpoint GET /v1/models" },
    ]
  },
  // ... more entries
];
```

Add "Changelog" tab in the API docs page. Render as a timeline: date → list of changes with badges (Added / Changed / Fixed / Deprecated / Removed).

Also return changelog URL in API responses: `X-ClawHQ-Changelog: https://app.clawhq.tech/api-access/docs#changelog`

**Files to create:** `src/data/api-changelog.ts`. Modify API docs component to add Changelog tab.

### 8. KNOWLEDGE BASE / RAG ENHANCEMENT (16 features from CustomGPT, Glean, Notion AI, production RAG best practices)

**FULL IMPLEMENTATION GUIDE:** See `tasks/129/KB_ENHANCEMENT_129.md` for complete code, schemas, algorithms, file paths, and testing steps. That file has the A-Z detail. Below is the summary index.

**What we already have:** Upload files (PDF/TXT/MD/CSV), crawl URLs, paragraph chunking (2000 chars, 200 overlap), VPS-side vector embeddings (all-MiniLM-L6-v2, 384 dims), cosine similarity search with 0.3 threshold, FTS fallback, KB context injected as system message with source attribution, "Test Your KB" UI, "Used in chat" retrieval tracking, embedding status badges.

**Build order:** 8.3 → 8.1 → 8.2 first (these three alone = ~50-70% RAG quality improvement). Then the rest in any order.

**What production RAG systems and paid KB products have that we don't — adding all 16:**

---

#### 8.1 Hybrid Search (Vector + Keyword Combined)

**What it is:** Instead of either vector search OR keyword search, combine BOTH and merge results. Vector search finds semantically similar chunks ("refund" matches "return policy"). Keyword search finds exact matches ("error code 4032" matches literally). Together they cover both meaning and precision.

**Current state:** We do vector search first, fall back to FTS if VPS is down. We never combine them.

**What to build:**

In `searchKBChunks()` (`src/lib/knowledge-base.ts`):
1. Run BOTH searches in parallel: `Promise.all([vectorSearch(query), ftsSearch(query)])`
2. Merge results using **Reciprocal Rank Fusion (RRF):**
   ```typescript
   function reciprocalRankFusion(
     vectorResults: ChunkResult[],
     ftsResults: ChunkResult[],
     k: number = 60 // constant, standard is 60
   ): ChunkResult[] {
     const scores = new Map<string, number>();

     vectorResults.forEach((chunk, rank) => {
       const score = 1 / (k + rank + 1);
       scores.set(chunk.id, (scores.get(chunk.id) || 0) + score);
     });

     ftsResults.forEach((chunk, rank) => {
       const score = 1 / (k + rank + 1);
       scores.set(chunk.id, (scores.get(chunk.id) || 0) + score);
     });

     // Sort by combined score, return top N
     return [...scores.entries()]
       .sort(([, a], [, b]) => b - a)
       .slice(0, limit)
       .map(([id]) => allChunks.get(id)!);
   }
   ```
3. Return the merged, re-ranked results

**Why this matters:** Benchmarks show hybrid search improves retrieval accuracy by 15-30% over vector-only. This is the #1 RAG improvement by impact.

**VPS Data API impact:** When KB moves to VPS, the Data API needs both a vector search endpoint AND a FTS endpoint (SQLite supports FTS5). The hybrid merge can happen either on VPS or on the dashboard server.

**Reference:** [Optimizing RAG with Hybrid Search & Reranking](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)

---

#### 8.2 Reranking After Retrieval

**What it is:** After the first-pass retrieval (hybrid search), run a second pass that scores each result by how well it actually answers the specific query — not just how similar it is.

**Current state:** We return whatever the vector/FTS search returns, ranked by similarity score only. A chunk that's "similar" but doesn't actually answer the question gets injected into the prompt, confusing the model.

**What to build:**

After hybrid search returns top 10 results, rerank to find the best 3-5:

**Option A — Cross-encoder reranking (better quality, needs model):**
Use a cross-encoder model on the VPS (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2` via `@xenova/transformers` — same library as embeddings). Cross-encoders score `(query, chunk)` pairs for relevance. Much more accurate than bi-encoder (embedding) similarity.

Add to VPS embedding service (port 5555):
```
POST /rerank
{ "query": "refund policy", "documents": ["chunk1 text", "chunk2 text", ...] }
Returns: { "scores": [0.92, 0.15, 0.78, ...] }
```

Re-sort by reranker scores, take top 3-5.

**Option B — LLM-based reranking (simpler, uses model request):**
Send the top 10 chunks + query to the AI model with: "Rate each chunk 1-10 for how well it answers this question." Use JSON mode. Costs 1 extra model request but very accurate.

**Recommendation:** Option A (cross-encoder on VPS) for production — it's fast (~50ms), free, and doesn't use a model request.

**Files to modify:** `src/lib/knowledge-base.ts` (add reranking step in `searchKBChunks`). VPS embedding service gets a new `/rerank` endpoint.

**Reference:** [Building Contextual RAG with Hybrid Search and Reranking](https://www.analyticsvidhya.com/blog/2024/12/contextual-rag-systems-with-hybrid-search-and-reranking/)

---

#### 8.3 Better Chunking (Semantic/Recursive)

**What it is:** Instead of splitting on paragraph breaks at fixed 2000 chars, use document structure (headings, sections) and semantic boundaries (topic changes) to create meaningful chunks.

**Current state:** `chunkText()` in `knowledge-base.ts` splits on `\n\n` (double newlines) with a 2000-char max. This means:
- A heading gets separated from its content
- Tables break mid-row
- Code blocks get split in the middle
- Two unrelated paragraphs can end up in the same chunk just because they're short

**What to build:**

Replace `chunkText()` with a multi-strategy chunker:

```typescript
function smartChunk(content: string, fileType: string): Chunk[] {
  // Strategy 1: Markdown-aware (for .md files)
  if (fileType === 'md') return chunkMarkdown(content);

  // Strategy 2: HTML-structure-aware (for crawled URLs)
  if (fileType === 'html') return chunkHTML(content);

  // Strategy 3: Recursive character splitting (for plain text, PDF)
  return chunkRecursive(content);
}
```

**Recursive chunking (the default):**
Try to split on the largest structural boundary first, then smaller:
1. Try splitting on `\n\n\n` (triple newline — major sections)
2. If chunk too big → split on `\n\n` (paragraph)
3. If still too big → split on `\n` (line)
4. If still too big → split on `. ` (sentence)
5. If still too big → split on ` ` (word)

Each chunk includes overlap from the previous chunk (10-20% of chunk size, not a fixed 200 chars — proportional overlap).

**Markdown-aware chunking:**
Parse markdown headers (`# H1`, `## H2`, `### H3`). Each section (from one header to the next) becomes a chunk. Subsections stay with their parent if small enough. Tables stay intact. Code blocks stay intact.

**Optimal chunk size:** 256-512 tokens (not characters). Use a simple token estimator: `Math.ceil(text.length / 4)` for English text approximation.

**Each chunk includes metadata:**
```typescript
interface Chunk {
  content: string;
  metadata: {
    heading?: string;       // nearest parent heading
    section_path?: string;  // "# Guide > ## Installation > ### Requirements"
    page_number?: number;   // for PDFs
    chunk_type: "text" | "table" | "code" | "list";
  };
}
```

Store metadata in the `metadata` column of `kb_chunks`. Use metadata for filtering (8.4) and display in search results.

**Files to modify:** `src/lib/knowledge-base.ts` — replace `chunkText()` and `splitLongText()`.

**Reference:** [Document Chunking for RAG - 70% Accuracy Boost](https://langcopilot.com/posts/2025-10-11-document-chunking-for-rag-practical-guide)

---

#### 8.4 Metadata Filtering

**What it is:** When searching KB, filter by metadata tags before running similarity search. "Only search in support documents" or "only search docs from last 30 days."

**Current state:** Every search looks through ALL documents for the user. No way to narrow scope.

**What to build:**

Add metadata fields to KB documents:
```sql
ALTER TABLE kb_documents ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE kb_documents ADD COLUMN category TEXT;
```

UI changes:
- Document upload/edit: add tags input (chip input) and category dropdown
- Search: add optional filter controls — tag filter, category filter, date range
- "Test Your KB" UI: add the same filters

API changes:
- `searchKBChunks()` accepts optional filters: `{ tags?: string[], category?: string, dateFrom?: string, dateTo?: string }`
- Vector search RPC gets additional WHERE clauses: `AND d.category = $category AND d.created_at >= $dateFrom`
- FTS search RPC gets same filters

Chat integration:
- When injecting KB context in chat, use the agent's configured filters if set. E.g., "Support Bot" only searches documents tagged "support".
- In agent builder (Feature 3), add "KB Filter" section: which tags/categories this agent's KB search should use.

**Files to modify:** `knowledge-base.ts`, KB API routes, KB manager UI, search RPC.

---

#### 8.5 Parent Document Retrieval

**What it is:** Retrieve the small chunk for accuracy (it matched the query well), but inject the larger parent section for context (the model needs surrounding context to answer properly).

**Current state:** We retrieve the matched chunk (up to 2000 chars) and inject it as-is. The model may not have enough context if the answer spans more than one chunk.

**What to build:**

When storing chunks, also store a reference to the parent section:
```sql
ALTER TABLE kb_chunks ADD COLUMN parent_chunk_id TEXT;
ALTER TABLE kb_chunks ADD COLUMN section_title TEXT;
```

During chunking: if a section is split into multiple chunks, link them via `parent_chunk_id` (the first chunk in the section). Or simpler: store a `section_id` that groups chunks from the same section.

During retrieval:
1. Vector/hybrid search returns top 3 matching chunks
2. For each matching chunk, fetch the surrounding chunks (same `section_id` or adjacent `chunk_index` values): previous chunk + matched chunk + next chunk
3. Inject the expanded context (3 chunks instead of 1) into the prompt
4. Keeps retrieval precise (small chunk matched) but provides broad context

**The formula:** "Retrieve narrow, provide wide."

**Files to modify:** `knowledge-base.ts` (chunking + search), KB chunk schema.

---

#### 8.6 Chunk Viewer / Editor

**What it is:** Let users see how their documents were split into chunks. View, edit, merge, split individual chunks. Re-embed after editing.

**Current state:** Users upload a document and trust the system. They can't see what happened to their content. If chunks are bad (heading separated from content, table broken), they have no way to fix it.

**What to build:**

New UI section in KB manager: click a document → see its chunks.

**Chunk list view:**
- Numbered list of all chunks for the document
- Each chunk shows: index, preview (first 200 chars), type badge (text/table/code), heading, chunk size
- Click to expand full content

**Chunk editor:**
- Click "Edit" on a chunk → textarea with full content → save
- "Merge with next" → combine two adjacent chunks
- "Split here" → split at cursor position into two chunks
- "Delete chunk" → remove (with confirmation)
- After any edit: "Re-embed" button that regenerates the embedding for modified chunks

**API:**
- `GET /api/knowledge-base/[docId]/chunks` — list chunks for a document
- `PATCH /api/knowledge-base/chunks/[chunkId]` — edit chunk content
- `POST /api/knowledge-base/chunks/[chunkId]/split` — split at position
- `POST /api/knowledge-base/chunks/merge` — merge two adjacent chunks
- `DELETE /api/knowledge-base/chunks/[chunkId]` — delete
- `POST /api/knowledge-base/chunks/[chunkId]/re-embed` — regenerate embedding

**Files to create:** Chunk viewer/editor component. Chunk API routes.

---

#### 8.7 Document Connectors (Google Drive, Notion, URL Auto-Sync)

**What it is:** Auto-import documents from external sources. Google Drive folder → auto-sync new files. URL → auto re-crawl on schedule.

**Current state:** Manual upload only. URLs are one-time crawl.

**What to build (3 connector types):**

**A. URL Auto-Sync:**
Add to existing URL crawl feature:
- `sync_schedule` field on KB documents (none, daily, weekly)
- `last_synced_at` timestamp
- Cron endpoint `GET /api/cron/kb-sync` → re-crawls all URLs where `sync_schedule != 'none'` and `last_synced_at` is due
- If content changed: re-chunk, re-embed, update document
- If content unchanged: just update `last_synced_at`
- UI: "Auto-sync" toggle + schedule dropdown on URL documents

**B. Google Drive Connector:**
- OAuth2 flow: user connects Google Drive account
- User selects a folder → ClawHQ watches for new/updated files
- New files auto-imported to KB
- Uses Google Drive API (`drive.files.list`, `drive.files.get`, `drive.files.export`)
- Store connection in `kb_connectors` table: `{ type: "google_drive", credentials (encrypted), folder_id, sync_schedule, last_synced_at }`

**C. Notion Connector:**
- OAuth2 flow with Notion integration
- User selects pages/databases to import
- Uses Notion API to fetch page content as markdown
- Auto-sync on schedule

**Database:**
```sql
CREATE TABLE kb_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'url_sync', 'google_drive', 'notion'
  config JSONB NOT NULL, -- connection-specific config
  credentials JSONB, -- encrypted OAuth tokens
  sync_schedule TEXT DEFAULT 'daily', -- 'none', 'hourly', 'daily', 'weekly'
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Priority:** URL auto-sync first (easiest, no OAuth). Google Drive second. Notion third.

---

#### 8.8 RAG Evaluation / Answer Quality Scoring

**What it is:** Automatically measure how well the AI is using KB context. Is the answer actually grounded in the retrieved chunks? Is it hallucinating?

**Current state:** No quality measurement. Users have to manually judge if answers are good.

**What to build:**

**Groundedness scoring (after every KB-augmented response):**
After the model generates a response using KB context, run a quick evaluation:
1. Extract claims from the response (simple: split into sentences)
2. For each claim, check if it's supported by the retrieved chunks (simple: check if key terms from the claim appear in the chunks)
3. Calculate `groundedness_score = supported_claims / total_claims`

**Store the score:**
In analytics (VPS Data API): `{ response_id, groundedness_score, chunks_used: [...], chunks_relevant: [...] }`

**UI:**
- In the "Test Your KB" section: after test query, show groundedness score next to the response
- In KB analytics (8.12): average groundedness over time, trend chart
- Flag responses with low groundedness (<0.5) for review

**This is lightweight evaluation** — not a full LLM-as-judge setup. Just checking if the response uses the provided context. Good enough for v1.

**Files to modify:** `chat/send/route.ts`, `v1/chat/route.ts` (add scoring after KB-augmented responses). New analytics tracking.

---

#### 8.9 Multi-Format Processing (PDF Tables, DOCX, PPTX, XLSX)

**What it is:** Better document parsing for complex formats.

**Current state:** PDF → basic text extraction (tables break, images ignored). Only supports PDF, TXT, MD, CSV.

**What to build:**

**Better PDF parsing:**
Install `pdf-parse` or `pdfjs-dist` for text. For tables, use `tabula-js` or `pdf-table-extractor` to detect and extract table structures. Convert tables to markdown table format before chunking.

**DOCX support:**
Install `mammoth` npm package. Converts .docx to HTML/markdown while preserving headings, tables, lists, bold/italic.
```typescript
const mammoth = require("mammoth");
const result = await mammoth.convertToMarkdown({ buffer: fileBuffer });
const markdown = result.value; // clean markdown
```

**PPTX support:**
Install `pptx-parser` or parse the PPTX XML directly (it's a ZIP file with XML inside). Extract text from each slide, preserving slide order as sections.

**XLSX support:**
Install `xlsx` npm package. Parse spreadsheets. Each sheet becomes a section. Rows become records. Use the CSV chunking strategy (header + rows per chunk).

**Update file type validation:**
Accept: PDF, TXT, MD, CSV, JSON, DOCX, PPTX, XLSX. Max 10MB each.

**Files to modify:** `knowledge-base.ts` (add format-specific parsers). KB upload route (accept new MIME types). KB manager UI (show new supported formats).

---

#### 8.10 Feedback Loop (Thumbs Up/Down on Answers)

**What it is:** User marks AI answers as good/bad. Good answers boost the chunks that were used. Bad answers flag chunks for review.

**Current state:** No feedback mechanism. Users can't tell us if the KB is working.

**What to build:**

**In chat UI:**
After every assistant message that used KB context, show small thumbs up / thumbs down icons.

**On click:**
- Thumbs up → store: `{ message_id, feedback: "positive", chunks_used: [...] }`
- Thumbs down → store: `{ message_id, feedback: "negative", chunks_used: [...] }` + optional text: "What was wrong?" input

**In KB:**
- Chunks with many positive feedback → boost relevance weight (add a `quality_score` column, increment on positive)
- Chunks with negative feedback → flag for review (show in KB manager: "3 chunks flagged for review")
- In search: `final_score = similarity_score * (1 + quality_score * 0.1)` — chunks with good feedback rank slightly higher

**Database:**
```sql
CREATE TABLE kb_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id TEXT,
  feedback TEXT NOT NULL, -- 'positive' | 'negative'
  comment TEXT,
  chunk_ids TEXT[], -- which chunks were used
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Files to modify:** Chat component (add feedback buttons), chat API (store feedback), knowledge-base.ts (factor quality_score into search).

---

#### 8.11 Query Transformation

**What it is:** Before searching the KB, rephrase the user's query to improve retrieval quality.

**Current state:** The raw user message is used as the search query. "Can I get my money back?" matches poorly with chunks about "refund policy and return process."

**What to build:**

In `searchKBChunks()`, before running the search:

**Step 1 — Query expansion:**
Use the AI model to rephrase the query for better retrieval:
```typescript
const expandedQuery = await generateQueryExpansion(originalQuery);
// "Can I get my money back?" → "refund policy return process money back guarantee"
```

This is a lightweight model call (short prompt, short response). Add to the system prompt: "Rephrase this question into search keywords that would match relevant documents. Return only the keywords, no explanation."

**Step 2 — Multi-query search:**
Search with BOTH the original query AND the expanded query. Merge results using RRF (same as hybrid search).

**Step 3 — Caching:**
Cache query expansions for common queries (same cache as 7.14 context caching). If the same user asks similar questions, reuse the expansion.

**Configuration:**
- Enable/disable per user or per agent (some agents don't need it)
- Off by default for short queries (<5 words) — the expansion might not help
- On by default for longer queries

**Cost:** Uses 1 additional model request for expansion. Since ClawHQ is flat-rate, this is a cost to YOU (provider), not the user. Consider caching aggressively to reduce model calls.

**Files to modify:** `knowledge-base.ts` (add expansion before search), create `src/lib/query-expansion.ts`.

---

#### 8.12 KB Analytics

**What it is:** What questions are being asked? Which documents answer them? Which questions have no good match? Which documents are never used?

**Current state:** We track `retrieval_count` per document. That's it.

**What to build:**

New section/tab in KB manager: "Analytics"

**Metrics:**
1. **Top searched queries** — what are users asking? Table: query, frequency, avg relevance score, had good match (yes/no)
2. **Most referenced documents** — which docs are used most? Bar chart by retrieval count.
3. **Unused documents** — docs with `retrieval_count = 0`. These might be unnecessary or poorly chunked.
4. **Failed queries** — searches that returned 0 results or all results below threshold. These are KB gaps — user asked something the KB can't answer.
5. **Relevance trend** — average relevance score over time. Is the KB getting better or worse?
6. **Groundedness trend** — average groundedness score (from 8.8) over time.

**Data collection:**
Every KB search logs: `{ query, results_count, top_score, chunks_returned, timestamp }`. Store on VPS.

**API:**
`GET /api/knowledge-base/analytics?period=7d|30d` → returns all metrics above.

**Files to create:** KB analytics component, API endpoint. Modify `searchKBChunks` to log search metadata.

---

#### 8.13 Agentic RAG (AI Decides When to Search)

**What it is:** Instead of ALWAYS searching the KB on every message, let the AI model decide if it NEEDS KB context.

**Current state:** Every message ≥2 chars triggers a KB search. "Hello!" searches the KB unnecessarily. Wastes compute and can inject irrelevant context.

**What to build:**

**Pre-search classification:**
Before KB search, quickly classify the query: "Does this question need knowledge base context?"

**Option A — Rule-based (simple):**
```typescript
function needsKBSearch(message: string): boolean {
  // Skip greetings
  if (/^(hi|hello|hey|thanks|bye|ok|sure)/i.test(message.trim())) return false;

  // Skip short confirmations
  if (message.trim().length < 10) return false;

  // Skip if it's a follow-up ("yes", "no", "tell me more")
  if (/^(yes|no|yeah|nah|tell me more|go on|continue)/i.test(message.trim())) return false;

  // Search for questions or substantive messages
  return true;
}
```

**Option B — Model-based (better, costs 1 extra call):**
Send the message to the model with: "Does this message require searching a knowledge base to answer? Reply YES or NO only."
Cache the decision for similar queries.

**Option C — Hybrid (recommended):**
Use rule-based first (free, instant). If the rules say "search," then search. If the rules are unsure (medium-length message, not a greeting, not a question), fall back to model-based classification.

**Result:** Reduce unnecessary KB searches by ~40-60%. Better response quality because irrelevant context isn't injected.

**Files to modify:** `chat/send/route.ts`, `v1/chat/route.ts` (add classification before KB search).

---

#### 8.14 Table Extraction from PDFs/XLSX

**What it is:** Detect tables in documents and extract them as structured data instead of garbled text.

**Current state:** PDF tables become jumbled text when extracted. "Row 1 Col 1 Row 1 Col 2 Row 2 Col 1..." instead of a proper table.

**What to build:**

**For PDFs:**
Install `tabula-js` (Node.js wrapper for Tabula, a table extraction library):
```typescript
const tabula = require('tabula-js');
const tables = await tabula.extractTables(pdfPath, { format: 'json' });
```
Convert each extracted table to markdown table format:
```markdown
| Column A | Column B | Column C |
|----------|----------|----------|
| Row 1    | Data     | Value    |
| Row 2    | Data     | Value    |
```
Store tables as separate chunks with `chunk_type: "table"` metadata.

**For XLSX:**
Already handled in 8.9 (XLSX support) — parse sheets, each becomes structured data.

**For CSV:**
Current `chunkCSV()` already handles this okay. Improve: detect headers, preserve structure.

**Chunking rule:** Tables stay intact. If a table exceeds max chunk size, split by rows (not columns), keeping the header in every chunk.

**Files to modify:** `knowledge-base.ts` (add table detection in PDF processing, table-aware chunking).

---

#### 8.15 OCR for Scanned PDFs

**What it is:** Many PDFs are scanned images, not text. Standard PDF parsing returns nothing. OCR (Optical Character Recognition) extracts text from images.

**Current state:** If a user uploads a scanned PDF, `pdf-parse` returns empty text. The document gets "indexed" with 0 useful chunks.

**What to build:**

**Detection:**
After normal PDF text extraction, check if the result is mostly empty or very short relative to page count. If `extractedText.length < pageCount * 100` → likely scanned, needs OCR.

**OCR on VPS:**
Install Tesseract OCR on the VPS during provisioning:
```bash
apt-get install tesseract-ocr tesseract-ocr-eng
```

Add OCR endpoint to VPS Data API (or embedding service):
```
POST /ocr
Content-Type: multipart/form-data
file: (PDF binary)
Returns: { "text": "extracted text from all pages", "pages": [...] }
```

Uses `node-tesseract-ocr` or calls `tesseract` CLI via child_process.

**Flow:**
1. Upload PDF → extract text normally
2. If text is too short → call VPS OCR endpoint
3. OCR extracts text from each page's images
4. Chunk the OCR text normally
5. Mark document as `ocr_processed: true` in metadata

**Add to provisioning:** Install `tesseract-ocr` package on VPS.

**Files to modify:** KB upload flow, VPS provisioning, VPS Data API (add `/ocr` endpoint).

---

#### 8.16 DOCX/PPTX/XLSX File Support

**Already covered in detail in 8.9.** This is the same feature — adding DOCX (`mammoth`), PPTX (`pptx-parser`), XLSX (`xlsx` package) support to the upload pipeline.

**No separate implementation needed** — handled by 8.9.

---

### 9. LOGS EXPLORER ENHANCEMENT (12 features from Datadog, Better Stack, Axiom patterns)

**FULL IMPLEMENTATION GUIDE:** See `tasks/129/LOGS_ENHANCEMENT_129.md` for complete code, schemas, algorithms, file paths, and testing steps.

**What we already have:** Real-time streaming with 5s auto-refresh, keyword search with highlighting, level filtering (error/warn/info/debug) with color coding, pause/play, download as .txt, line count selector (100-500), auto-scroll.

**Build order:** 9.4 → 9.11 → 9.5 first (parser foundation + live streaming). Then 9.1, 9.6, 9.12. Then 9.2, 9.3, 9.9, 9.10. Then 9.7, 9.8.

**What premium log platforms have that we don't — adding all 12:**

- [x] **9.1 Saved Searches/Views** — save search+filter combos, restore with one click, set default view. DB: `saved_log_views` table. Max 20 per user. Reference: Datadog saved views.

- [x] **9.2 Log Patterns/Clustering** — auto-group similar log lines, show count, normalize messages (replace IPs/UUIDs/timestamps with placeholders). Client-side `detectPatterns()`. Toggle between Lines/Patterns view. Reference: Datadog log patterns.

- [x] **9.3 Log Alerting** — rules like "error > 10 times in 5 min → notify." DB: `log_alert_rules` + `log_alert_history`. Cron evaluates every 60s. Notification: dashboard bell, email, webhook. Condition types: keyword_count, level_count, pattern_match, absence. Reference: Better Stack alerts.

- [x] **9.4 Structured/Parsed Logs** — parse raw text into: timestamp, level, source, message, fields (key=value), JSON payloads. Display as structured cards with clickable field values. `parseStructuredLogs()` function. Reference: Better Stack structured logging.

- [x] **9.5 Live Tail (True Streaming)** — replace 5s polling with SSE streaming. VPS endpoint: `docker logs --follow` piped through SSE. Dashboard proxies the stream. Live/Off toggle with green pulsing dot. Reference: Datadog live tail.

- [x] **9.6 Faceted Search** — click any value (source, level, field) to filter by it. Active filter bar: `[source:gateway ×] [level:error ×] [Clear all]`. Client-side filter on fetched logs. Reference: Datadog faceted search.

- [x] **9.7 Log Forwarding** — forward logs to external service (Datadog, Logtail, custom URL) in real-time. Config: destination URL, format (JSON/syslog), auth headers, level filter. DB: `log_forwarding_config`. Reference: Better Stack log pipelines.

- [x] **9.8 Dashboards from Logs** — auto-generated charts from log data: error count over time, level distribution pie, top error sources bar chart, volume trend. Requires log persistence on VPS (SQLite `logs` table in Data API). Reference: Axiom dashboards.

- [x] **9.9 Anomaly Detection** — auto-detect: error spikes (3x baseline), new error patterns never seen before, unusual log volume. Show anomaly alerts at top of log viewer. Reference: Datadog log anomaly detection.

- [x] **9.10 Log Context (Before/After)** — click a log line → expand to show 10 lines before and after. Highlights the clicked line. Pure UI feature, no API change. Reference: Datadog log context.

- [x] **9.11 Multi-line Log Support** — stack traces and multi-line errors treated as single entry. `mergeMultiLineEntries()` detects continuation lines. Collapsible stack traces. Reference: Better Stack multi-line support.

- [x] **9.12 Date/Time Range Picker** — replace "last N lines" with time-based: "Last 1h / 6h / 24h / 7d / Custom range." Requires log persistence on VPS. Quick presets + custom from/to date+time picker. Reference: all platforms have this.

---

### 10. USAGE ANALYTICS ENHANCEMENT (16 features from PostHog, Mixpanel, Amplitude, chatbot analytics platforms)

**FULL IMPLEMENTATION GUIDE:** See `tasks/129/ANALYTICS_ENHANCEMENT_129.md` for complete code, schemas, algorithms, file paths, and testing steps.

**What we already have:** Time range selector (7/14/30 days), 4 summary cards (messages, conversations, avg response time, peak hour with % change), 4 charts (messages over time, requests by hour, messages by agent, daily conversations).

**Build order:** 10.1 → 10.2 → 10.3 → 10.4 first (data foundation). Then 10.5, 10.10-10.12, 10.15 (core insights). Then rest.

**What premium analytics + chatbot platforms have that we don't — adding all 16:**

- [x] **10.1 Conversation Funnels** — visualize user progression: Started → Engaged → Substantive → Resolved → Satisfied. Show drop-off % between stages. Horizontal funnel chart. Track stages via `conversation_stages` table. Reference: PostHog funnels.

- [x] **10.2 User/Conversation Paths** — actual routes users take through conversations by topic/intent. Intent classifier (keyword-based). Sankey diagram or ranked path table. Reference: PostHog user paths, Mixpanel flows.

- [x] **10.3 Resolution Rate** — % of conversations resolved without escalation. THE most important AI agent metric. Detect resolved (user says thanks), escalated (support ticket), abandoned (no follow-up). Track by agent + channel. Reference: chatbot analytics platforms.

- [x] **10.4 CSAT / Satisfaction Scoring** — in-chat rating prompt after resolution. 1-5 stars. CSAT = (4+5 ratings / total) × 100. Distribution chart, trend line, per-agent comparison. Reference: Chatwoot CSAT, chatbot analytics.

- [x] **10.5 Real-Time Live Dashboard** — current snapshot: active conversations, messages/min, agents online, current response time. Updates every 5 seconds. Green pulsing "Live" indicator. Reference: Mixpanel live view.

- [x] **10.6 Custom Dashboards** — users build their own analytics with drag-drop widgets. 14+ widget types. Use `react-grid-layout`. Persisted layout per user. Reference: PostHog custom dashboards.

- [x] **10.7 Behavioral Cohorts** — group conversations by behavior ("refund seekers", "power users", "unhappy users"). Cohort builder with condition rows. Analyze each group's metrics. Reference: Amplitude behavioral cohorts.

- [x] **10.8 Retention Analysis** — do users come back? Weekly/monthly retention curves. Cohort heatmap: Week 0 = 100%, Week 1 = 65%, etc. Reference: PostHog retention, Amplitude retention.

- [x] **10.9 Anomaly Detection / Alerts** — auto-detect: message volume spikes, response time degradation, resolution rate drops, CSAT drops. Alert bar at top of analytics. Reference: Mixpanel alerts, PostHog anomaly detection.

- [x] **10.10 Top Questions / Intents** — ranked list of most common conversation topics. Show count, percentage, resolution rate per intent. Trending indicators. Reference: chatbot analytics platforms.

- [x] **10.11 Failed Conversations** — conversations where agent couldn't help. Detect: abandoned, frustrated, escalated, no_answer. Failure rate metric + breakdown by reason + conversation list. Reference: chatbot analytics.

- [x] **10.12 Agent Comparison** — side-by-side metrics for all agents: messages, response time, resolution rate, CSAT, failure rate. Comparison table + radar chart. Reference: chatbot analytics.

- [x] **10.13 Export / Scheduled Reports** — export as CSV/JSON/PDF. Schedule weekly email summaries with key metrics. Cron for automated reports. Reference: all platforms.

- [x] **10.14 Conversation Drill-Down** — click any chart data point → see the actual conversations behind that number. Conversation list panel + transcript modal. Reference: PostHog click-through.

- [x] **10.15 Period Comparison** — this week vs last week side-by-side. All metrics with change % and direction arrows. Green = improvement, red = degradation. Reference: all platforms.

- [x] **10.16 Channel Breakdown** — every metric broken down by channel. "By Channel" toggle on each chart showing multi-line/stacked views. Cross-cutting: touches all endpoints and charts. Reference: Chatwoot inbox reports.

---

### 11. AUDIT LOG ENHANCEMENT (12 features from WorkOS, Drata, enterprise SaaS best practices)

**FULL IMPLEMENTATION GUIDE:** See `tasks/129/AUDIT_ENHANCEMENT_129.md` for complete code, schemas, algorithms, file paths, and testing steps.

**What we already have:** Paginated table (50/page), category filtering (8 categories), full-text search with debounce, CSV export (current page only), color-coded badges, IP tracking, `logAudit()` non-blocking function, RLS + explicit user_id filter.

**Build order:** 11.2 → 11.9 → 11.10 → 11.11 → 11.3 first (core improvements + hash chain). Then 11.1, 11.4, 11.7, 11.5 (enterprise). Then 11.6, 11.12 (compliance).

**What enterprise audit log platforms have that we don't — adding all 12:**

- [x] **11.1 SIEM Log Streaming** — push audit events in real-time to Datadog, Splunk, AWS S3, or any HTTP endpoint. `audit_log_streams` config table. Auto-disable after 50 consecutive failures. Supports JSON + CEF format. Test connection before saving. Max 3 streams per user. Reference: WorkOS log streams.

- [x] **11.2 Immutable/Tamper-Proof Logs** — SHA-256 hash chain linking each entry to the previous. `entry_hash` + `previous_hash` columns. Verification endpoint: traverses chain, recomputes hashes, reports if any entry was modified. Green lock badge "Integrity: Verified" in UI. Reference: WorkOS immutable logs, enterprise best practices.

- [x] **11.3 Full Export (All Pages)** — export ALL entries (up to 10,000) as CSV or JSON, not just current page of 50. Apply current filters to export. Include integrity hashes in JSON export. CSV injection protection. Reference: WorkOS exporting events.

- [x] **11.4 Audit Log API** — `GET /api/v1/audit-log` with cursor-based pagination. Filter by category, action, entity, date range. Authenticated via API key. Rate limit 30/min. Add to interactive API docs + SDKs. Reference: WorkOS audit logs API.

- [x] **11.5 Real-Time Audit Stream** — live tail for audit events using Supabase Realtime (subscribe to `postgres_changes` INSERT on `audit_logs`). "Live" toggle with green pulsing dot. New entries slide in from top. Reference: WorkOS real-time.

- [x] **11.6 Retention Policies** — configurable: 30, 90, 180, 365 days, or unlimited. `audit_retention_days` column on users table. Daily cron deletes old entries. Hash chain anchor preserved when pruning. Reference: WorkOS retention pricing.

- [x] **11.7 Webhook on Audit Events** — fire webhooks for audit categories: `audit.security` (login, password, key create/revoke), `audit.data` (KB, agent), `audit.admin` (VPS, model, channel). Uses existing webhook dispatch infrastructure. Add 3 new event types to AVAILABLE_EVENTS. Reference: WorkOS webhooks.

- [x] **11.8 Admin Portal** — SKIP for now. V2/Enterprise. Self-service log access for customer's IT admin. Needs Team Access first. Added to V2_FEATURES.md.

- [x] **11.9 Date Range Filter** — add `from` and `to` query params to API. Date picker in UI with quick presets (24h, 7d, 30d, All). Shows "Showing logs from X to Y" indicator.

- [x] **11.10 Actor Details (Enhanced)** — capture user agent, device info, user name/email in audit entries. Pass `request` object to `logAudit()`. Parse user agent for OS detection. Join users table for name/email in API response. Enhanced display: "john@example.com · macOS · 1.2.3.4".

- [x] **11.11 Event Detail Expansion** — click any audit entry to expand full details. Inline expansion with structured key-value display. Parse known detail shapes (webhook: URL+events, agent: name+model, KB: filename+size). Unknown shapes: formatted JSON. Show integrity hash info.

- [x] **11.12 Compliance Report Generation** — one-click SOC 2 / GDPR / general activity reports. Period selector. Summary stats + categorized event breakdown + full event log. Download as markdown/JSON. Reference: Drata automated evidence collection.

---

## PART C: VPS DATA ARCHITECTURE IMPACT ON PRO

The VPS Data Architecture (decided 2026-03-15) affects how Pro features read/write data. When the VPS Data API (port 5556) is built by the 350 agent, these Pro features need migration:

**KB data migration:**
- [ ] KB documents, chunks, embeddings → read/write via VPS Data API instead of Supabase
- [ ] `searchKBChunks()` → query VPS Data API search endpoint
- [ ] Upload flow → send to VPS Data API for storage + chunking + embedding

**Analytics migration:**
- [ ] Detailed analytics → read from VPS Data API
- [ ] Analytics recording (chat/send) → write to VPS Data API
- [ ] Keep daily summary in Supabase (1 row/user/day)

**Audit log migration:**
- [ ] `logAudit()` → write to VPS Data API instead of Supabase
- [ ] Audit log viewer → read from VPS Data API

**Webhook delivery logs migration:**
- [ ] `webhook-dispatch.ts` → insert delivery records to VPS Data API
- [ ] Delivery history UI → read from VPS Data API

**Note:** These migrations happen AFTER the 350 agent builds the VPS Data API service. The 129 agent should build features using Supabase for now, and migrate when the Data API is ready.

---

## PART D: PLANNING & RESEARCH (Future Work)

### D1. Existing Feature Enhancement (Competitive Research)

Research to do AFTER the 5 new features are built. For each existing Pro feature, study paid products and open source to find what to improve.

- [x] **Webhooks** — study Svix, Hookdeck, Hook0. What premium features are we missing? (Event replay? Versioning? Transformation middleware?)
- [x] **API Access** — study Stripe API, Resend API, Postman. What makes world-class DX? (SDKs? Idempotency? Rate limit headers?)
- [x] **Knowledge Base** — study Notion AI, Guru, Glean, CustomGPT. What do paid KBs offer? (Auto-sync? Training feedback? Chunk editing?)
- [x] **Logs Explorer** — study Datadog, Logtail, Axiom. What log features are missing? (Saved searches? Log alerting? Log forwarding?)
- [x] **Usage Analytics** — study Mixpanel, PostHog, Amplitude. What to add? (Funnels? Custom events? Dashboards?)
- [x] **Audit Log** — study WorkOS, Drata. What makes enterprise-grade? (SIEM? Compliance exports? Retention?)

### D2. Open Source Repos to Clone & Analyze

Same process as 350. Find best repos, clone, analyze.

- [ ] Webhook platforms (Svix open source parts, Hook0)
- [ ] API doc generators (Scalar, Stoplight alternatives)
- [ ] Log viewers (Logtail UI alternatives)
- [ ] Analytics dashboards (PostHog, Plausible)

### D3. Decisions Still Needed

- [x] How does clawhq-models API handle model selection? Parameter in request body? Different endpoint? Need to verify before multi-model feature works.
- [x] Agent builder AI generation prompt — needs testing and iteration. The system prompt quality determines the output quality.
- [x] Channel analytics data availability — verify `channel_type` is tracked in the message pipeline.
- [x] Auto-response pipeline integration — where exactly to intercept messages. Before OpenClaw? In the chat send route?
