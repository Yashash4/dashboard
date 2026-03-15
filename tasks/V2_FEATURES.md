# V2 Features — Build When Users Demand It

**Purpose:** Features we've discussed and decided to skip for launch. Documented in detail so we can build them later without re-discussing. Pick up any feature from here when users request it or when it makes strategic sense.

**Last updated:** 2026-03-15

---

## 1. Advanced Agent Config Files (Ultra or all tiers)

**Context:** OpenClaw agents support many config files beyond the basics. For launch, the Agent Builder only generates: SOUL.md, identity.md, TOOLS.md, config.json, USER.md. The advanced files below are skipped.

**When to build:** When power users ask "how do I make my agent remember things between sessions?" or "how do I set up startup routines?"

### 1.1 MEMORY.md — Long-term Agent Memory
- **What it does:** Curated facts and preferences the agent remembers across sessions. Auto-managed by OpenClaw, but users can seed it with initial knowledge.
- **In the builder:** Add a "Long-term Memory" section. Textarea where users write facts the agent should always know: "Our company is called Acme Corp", "We operate in EST timezone", "Our return policy is 30 days."
- **File format:** Markdown with key-value style facts. OpenClaw reads this before every conversation.
- **Generates:** `MEMORY.md` file in the agent's directory on VPS.

### 1.2 BOOT.md — Startup Routines
- **What it does:** Instructions executed when the agent starts a new session. Like a checklist the agent runs through before it starts working.
- **In the builder:** Add a "Startup Checklist" section. User writes what the agent should do first: "Check for new support tickets", "Read the latest KB updates", "Review pending tasks."
- **File format:** Markdown with ordered instructions.
- **Generates:** `BOOT.md` file in the agent's directory on VPS.

### 1.3 HEARTBEAT.md — Periodic Check Instructions
- **What it does:** Instructions the agent executes periodically (like a cron job for the agent's brain). Used for monitoring, health checks, recurring analysis.
- **In the builder:** Add a "Periodic Tasks" section. User defines what the agent should check regularly: "Every hour, check if any support tickets are unresolved for more than 24 hours."
- **File format:** Markdown with periodic task descriptions.
- **Generates:** `HEARTBEAT.md` file in the agent's directory on VPS.

### 1.4 AGENTS.md — Meta-Instructions
- **What it does:** How the agent should think and act at a meta level. Safety defaults, session start checklist, memory system rules. Overlaps with SOUL.md but focuses on operational behavior rather than personality.
- **In the builder:** Add an "Advanced Behavior" section. For users who want fine-grained control over how the agent processes tasks, manages memory, and handles errors.
- **File format:** Markdown with structured sections.
- **Generates:** `AGENTS.md` file in the agent's directory on VPS.

### 1.5 Per-Agent Workspace Files
- **What:** Each agent can have its own workspace directory with project files, context documents, reference materials.
- **In the builder:** File upload section — "Upload files for this agent's workspace." Agent can read these files during conversations.
- **OpenClaw config:** Set `workspace` path in config.json pointing to the agent's workspace directory.

---

## 2. Agent Builder Templates in Store

**Context:** For launch, we're seeding 7 pre-built agents in the Agent Store (Support, Research, Writer, Data, Sales, Reviewer, Manager) as "Free — Limited Time." The builder itself has no template picker.

**When to build:** After launch, when we want to monetize templates.

### 2.1 Template Marketplace
- Users can create agents via the builder and publish them to the store as templates
- Set a price or make them free
- Other users can buy/install the template
- Revenue share: creator gets X%, ClawHQ gets Y%
- Template includes: all config files + description + category + preview

### 2.2 Template Categories
- By industry: E-commerce, SaaS, Healthcare, Legal, Education
- By function: Support, Sales, Marketing, Engineering, Operations
- By complexity: Beginner (1 agent), Intermediate (2-3 agents), Advanced (agent teams)

---

## 3. Workflow Automation for Pro (simplified)

**Context:** Ultra has full automation rules + recurring tasks + dependencies. Pro currently has none. This is a simplified version for Pro.

**When to build:** When Pro users ask "can my agents work together?" or "can I chain tasks?"

### 3.1 Simple Agent Chains
- User defines: "When Agent A finishes, pass output to Agent B"
- Linear chains only (A → B → C), no branching
- UI: simple list — "Step 1: Support Agent processes ticket → Step 2: Writer Agent drafts response → Step 3: Reviewer Agent checks quality"
- No visual canvas (that's Ultra territory)

### 3.2 Basic Triggers
- "When a new message arrives on WhatsApp → route to Support Agent"
- "When KB document is updated → notify Research Agent"
- Simple trigger → action pairs, no complex conditions

---

## 4. Real-Time Monitoring Alerts for Pro (basic)

**Context:** Ultra has full monitoring dashboard with workload management. Pro currently has none. This is a basic alert system for Pro.

**When to build:** When Pro users ask "how do I know if my VPS goes down?" or "can I get notified when agents error?"

### 4.1 Basic Alert Rules
- VPS goes offline → email notification
- Agent returns error 5+ times in 1 hour → email notification
- Response time exceeds 30 seconds → email notification
- Configurable via simple toggle UI (not a rule builder)

### 4.2 Notification Channels
- Email (using existing support email infrastructure)
- Webhook (user's own URL — leverages existing webhook system)
- In-dashboard notification bell

---

## 5. Team Access with Roles

**Context:** Big feature. Multi-user access to a single ClawHQ account. Decided to skip entirely for launch.

**When to build:** When users say "my team needs access" or "I need to give my developer read-only access."

### 5.1 Role System
| Role | Can do |
|------|--------|
| **Owner** | Everything. Billing, delete account, manage team. |
| **Admin** | Everything except billing and account deletion. |
| **Member** | Use dashboard, deploy agents, chat, manage channels. Can't change billing or team. |
| **Viewer** | Read-only access. Can view dashboard, analytics, logs. Can't modify anything. |

### 5.2 Invitation Flow
- Owner goes to Settings → Team → "Invite Member"
- Enters email + role
- Invitee gets email with invite link
- Clicks link → creates account (or logs in) → joins the team
- Owner can revoke access anytime

### 5.3 Database Schema
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES users(id), -- the owner's user_id
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member', -- owner/admin/member/viewer
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' -- pending/active/revoked
);

CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE, -- invite token in the URL
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Per-Resource Permissions (Advanced — v3)
- Per-agent access: "Developer can only see the Support Agent"
- Per-channel access: "Sales team can only see WhatsApp"
- Per-page access: "Viewer can see Analytics but not Audit Log"
- This is enterprise-grade RBAC — probably Enterprise tier ($999+)

---

## 6. Multiple Models Simultaneously — Advanced Options

**Context:** For launch, we're building per-agent model assignment + fallback chain. These are advanced options for later.

### 6.1 Model A/B Testing
- Split traffic: 50% of messages to Model A, 50% to Model B
- Compare response quality, speed, user satisfaction
- Auto-select winner after N messages

### 6.2 Model Routing by Context
- Short messages (< 50 tokens) → fast/cheap model
- Long messages (> 500 tokens) → powerful model
- Code questions → code-specialized model
- Automatic classification, no user config needed

### 6.3 Model Fine-tuning Integration
- If clawhq-models API supports fine-tuned models in the future
- Users upload training data → fine-tune → deploy as custom model
- Per-agent custom model assignment

---

## 7. Advanced KB Features

**Context:** KB has basic RAG with vector search. These are enhancements for later.

### 7.1 KB Auto-Sync
- URLs added to KB auto-re-crawl on schedule (daily/weekly)
- Keeps content fresh without manual re-indexing
- Config: per-document sync schedule + last synced timestamp

### 7.2 KB Training Feedback
- User marks AI answers as good/bad (thumbs up/down in chat)
- Good answers → boost the chunks that were used (increase relevance weight)
- Bad answers → flag for review, optionally exclude from retrieval
- Feedback loop improves RAG over time

### 7.3 KB Chunk Editor
- View how documents were split into chunks
- Edit individual chunks (fix bad splits, add context)
- Merge or split chunks manually
- Re-embed edited chunks

### 7.4 KB Multi-Language
- Detect document language on upload
- Cross-language search (query in English, find chunks in Spanish)
- Requires multilingual embedding model (e.g., `paraphrase-multilingual-MiniLM-L12-v2`)

---

## 8. API Access — Advanced Features

### 8.1 SDK Generation
- Auto-generate client SDKs from the V1 API spec
- `pip install clawhq` (Python), `npm install @clawhq/sdk` (JavaScript)
- Typed, documented, with examples
- Generated from OpenAPI spec

### 8.2 API Versioning
- v1, v2, v3 — breaking changes get new version
- Old versions deprecated with timeline
- Version in URL: `/api/v2/chat`

### 8.3 Idempotency Keys
- `Idempotency-Key` header on POST requests
- Prevents duplicate actions on network retry
- Store key → response mapping for 24 hours

### 8.4 Rate Limit Headers
- Return in every API response:
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 45`
  - `X-RateLimit-Reset: 1679012345`
- Users can see their rate limit status programmatically

---

## 9. Webhook Advanced Features

### 9.1 Event Replay
- Re-send any past event to a webhook endpoint
- Button on delivery history: "Replay this event"
- Useful for debugging: "my endpoint was down, replay the missed events"

### 9.2 Webhook Versioning
- Events have a version: `v1`, `v2`
- When event payload format changes, new version
- Users subscribe to specific versions

### 9.3 Transformation Middleware
- Transform event payload before delivery
- User writes a simple JS function: `(event) => ({ custom_field: event.data.agent_name })`
- Runs server-side before dispatch

---

## 10. Log Explorer Advanced Features

### 10.1 Saved Searches
- Save frequently used search + filter combos
- "Show me all errors from Support Bot in the last hour"
- Quick access from a dropdown

### 10.2 Log Alerting
- "Alert me if 'error' appears more than 10 times in 5 minutes"
- Configurable rules on log patterns
- Notification via email/webhook

### 10.3 Log Forwarding
- Forward logs to external services (Datadog, Logtail, etc.)
- User provides an endpoint URL
- Logs streamed in real-time via webhook

---

## 11. Analytics Advanced Features

### 11.1 Custom Dashboards
- Users build their own charts from available data
- Drag-drop chart builder
- Save and share dashboards

### 11.2 Funnel Analysis
- Track user journeys through conversation flows
- Where do users drop off? Where do they escalate?

### 11.3 Export & Reporting
- Scheduled email reports (weekly summary)
- PDF export of analytics dashboards
- CSV export of raw data

---

## 12. Audit Log Enterprise Features

### 12.1 SIEM Integration
- Forward audit logs to SIEM systems (Splunk, Elastic)
- Standard format (CEF, LEEF)

### 12.2 Compliance Exports
- SOC 2, GDPR, HIPAA export templates
- Timestamped, tamper-evident log files

### 12.3 Retention Policies
- Configurable: keep logs for 30/90/365 days
- Auto-purge older entries
- Enterprise: unlimited retention
