# Landing Page Content Plan — ClawHQ

**Purpose:** 16 agents analyzed the codebase from different angles. Each section below contains their production-ready content suggestions for the landing page.

**Rule:** This is CONTENT — what to show, what to write, what to animate. NOT code. NOT UI. Design patterns are in `LANDING_PAGE_DESIGN_SPEC.md`.

---

## PART 1: PER-PLAN FEATURES

### 1.1 Starter $59 — Features Deep Dive
SEE: `tasks/STARTER_59_FEATURES_DEEP_DIVE.md` for full content (written separately due to concurrent file edits).

**Summary of Starter $59 features identified from codebase (12 features total):**
1. Dedicated VPS Instance (2 vCPU, 8 GB RAM, 100 GB NVMe, 8 TB bandwidth — upgradable)
2. Full VPS Controls Dashboard (Start/Stop/Restart, real-time CPU/RAM/Disk/Network charts, gateway health, logs, uptime)
3. Bundled AI Models — No API Keys (Kimi K2.5, MiniMax M2.5 + 1 rotating, 128K context, 1 change/cycle)
4. 7 Messaging Channel Integrations (WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — self-service for 5, admin-setup for 2, health checks)
5. Agent Store & Deployment (browse/buy free+premium agents, one-click deploy/undeploy, config editor, usage analytics)
6. Agent Chat (chat with deployed agents directly from dashboard)
7. Full OpenClaw Dashboard Access (all skills, plugins, ClawHub — custom domain with SSL, changeable password)
8. Support Ticket System (create tickets with priority, threaded conversations, status tracking)
9. Billing & Subscription Management (plan/cycle/status, payment history, monthly $59 or annual $599)
10. Account Management (profile, password, instance details)
11. Managed Infrastructure / Zero DevOps (auto-restart, managed updates/backups, 12-step automated provisioning)
12. Custom Domain / Subdomain (own domain or free subdomain, SSL included and monitored)

**Top 3 selling points:** Bundled AI models (no API bills), Dedicated VPS (not shared), 7 channels included.
**Full details with headlines, descriptions, visuals, stats, copy, and FAQ in:** `tasks/STARTER_59_FEATURES_DEEP_DIVE.md`

---

### 1.2 Pro $129 — Features Deep Dive
**Analysis source:** Sidebar navigation (`app-sidebar.tsx`), tier gating (`tier.ts`), all Pro-gated page components, upgrade prompt feature list, VPS page Pro conditionals, OpenClaw embed page, business plan.

---

#### COMPLETE LIST OF PRO-EXCLUSIVE FEATURES (from codebase)

The sidebar groups these under **"Pro Tools"** when `hasAccess(plan, "pro")` is true. Additionally, several base pages upgrade their behavior for Pro users. Here is every feature Pro adds over Starter, verified from code:

**A. Six dedicated Pro Tools pages (sidebar section "Pro Tools"):**

1. **Logs Explorer** (`/logs`) -- Real-time VPS log viewer with search, level filtering (error/warn/info/debug), auto-refresh every 5s, configurable line count (100-1000), downloadable logs, color-coded severity, and highlighted search matches.

2. **Usage Analytics** (`/analytics`) -- Full analytics dashboard with Recharts: messages over time (area chart), daily conversations & messages, requests by hour (bar chart), messages by agent (pie chart with donut), summary cards (total messages, conversations, avg response time, peak hour), period-over-period % change indicators, 7/14/30 day time range selector.

3. **Knowledge Base** (`/knowledge-base`) -- Upload documents (PDF, TXT, CSV, etc.) for agents to reference. File management with upload progress, search, and status tracking.

4. **Webhooks** (`/webhooks`) -- Create webhook endpoints that fire on instance events. Manage URLs, secrets, event subscriptions, delivery status, and retry failed deliveries.

5. **API Access** (`/api-access`) -- Direct API access to the OpenClaw instance. Create/revoke API keys (up to 5 active), view usage counts, last-used timestamps. Includes code examples in cURL, Python, JavaScript, and PowerShell with copy-to-clipboard.

6. **Audit Log** (`/audit-log`) -- Full activity log across the account. Searchable, filterable by category (user, server, settings, security, API, knowledge base, webhooks), paginated table with actor, action, entity, IP address, and timestamp.

**B. Pro upgrades to base pages:**

7. **Mission Control (upgraded VPS page)** -- For Pro users, the VPS page title changes from "VPS" to "Mission Control" and description changes from "Manage your VPS instance" to "Full control over your infrastructure." Pro adds two exclusive components:
   - **VPS Process List** -- View running processes on the server
   - **VPS Maintenance** -- Maintenance tools for the VPS

8. **OpenClaw Dashboard Embed** (`/openclaw`) -- Pro-gated. Embeds the full OpenClaw dashboard directly inside ClawHQ with credentials banner and iframe embed. Starter users see an upgrade prompt.

9. **Real-time monitoring with alerts** -- The monitoring page shows a Pro upsell card for Starter users: "Want live CPU, memory, and network charts? Upgrade to Pro for real-time monitoring, process management, and advanced analytics."

**C. Infrastructure upgrades (from business plan):**

10. **4x VPS resources** -- 8 vCPU / 32 GB RAM / 400 GB NVMe / 32 TB bandwidth (vs Starter's 2 vCPU / 8 GB / 100 GB / 8 TB)

11. **Full context window** -- No 128K cap. Models use their maximum context window.

12. **Instant model switching** -- Change models instantly from dashboard (Starter waits until next billing cycle).

13. **Higher rate limits** -- Approximately 5x the rate limits of Starter.

14. **Priority support** -- Elevated support priority.

**D. Upgrade prompt feature list (shown to Starter users on every Pro-gated page):**

The `UpgradePrompt` component lists these bullets:
- Mission Control -- advanced VPS management
- Multi-model support & model playground
- No-code agent builder & workflows
- Real-time monitoring with alerts
- Logs explorer, usage analytics & audit log
- Team access with role-based permissions
- Direct API access to your OpenClaw instance
- 2x credits & priority support

---

#### FEATURE CARDS -- HEADLINES, DESCRIPTIONS & VISUALS

**Feature 1: Logs Explorer**
- **Headline:** "See everything. Miss nothing."
- **Description:** Real-time log streaming from your instance. Search across thousands of entries, filter by severity, auto-refresh every 5 seconds, and download logs for offline analysis. Color-coded error, warn, info, and debug levels so you spot problems before your users do.
- **Visual:** Dark terminal-style UI showing color-coded log lines streaming in, with a search bar filtering results and severity badges lighting up. Animate: new log lines appearing at the bottom in real time.

**Feature 2: Usage Analytics**
- **Headline:** "Know exactly how your agents perform."
- **Description:** Track every message, conversation, and response time across all your agents. See which agents handle the most traffic, identify peak usage hours, and monitor error rates -- all with interactive charts and period-over-period comparisons.
- **Visual:** Dashboard mockup showing the area chart (messages over time), donut chart (messages by agent), and the four summary cards. Animate: chart lines drawing in, numbers counting up.

**Feature 3: Knowledge Base**
- **Headline:** "Give your agents your expertise."
- **Description:** Upload PDFs, documents, and data files that your agents can reference in conversations. Your agents become domain experts -- answering with your company's specific knowledge, not just general AI responses.
- **Visual:** Upload interface showing files being dragged in, with a status indicator showing "indexed" and an agent conversation where it references an uploaded document.

**Feature 4: Webhooks**
- **Headline:** "Connect to everything you use."
- **Description:** Get instant HTTP notifications when events happen in your instance -- new conversations, agent errors, deployment changes. Pipe events into Slack, Zapier, your CRM, or any tool with a URL. Manage secrets, filter events, and retry failed deliveries.
- **Visual:** Flow diagram: OpenClaw event --> webhook arrow --> icons for Slack, Zapier, custom app. Show a webhook creation dialog with event checkboxes.

**Feature 5: API Access**
- **Headline:** "Build on top of your agents."
- **Description:** Get direct API access to your OpenClaw instance with managed API keys. Integrate your agents into your own apps, websites, or internal tools. Ready-to-use code examples in Python, JavaScript, cURL, and PowerShell. Up to 5 active keys with usage tracking.
- **Visual:** Split view: left side shows the API key management UI, right side shows a code editor with the Python example and a green "200 OK" response. Animate: typing effect on the code.

**Feature 6: Audit Log**
- **Headline:** "Full accountability. Every action tracked."
- **Description:** Every login, config change, deployment, API call, and admin action is logged with timestamps, IP addresses, and actor details. Searchable, filterable, and exportable. Know exactly who did what, and when.
- **Visual:** Clean table showing audit entries with colored category badges (security, API, settings), timestamps, and actor names. Animate: table rows appearing as if being written in real time.

**Feature 7: Mission Control**
- **Headline:** "Your VPS, fully visible."
- **Description:** Mission Control upgrades your VPS management from basic start/stop to full infrastructure visibility. See running processes, perform maintenance operations, and monitor everything from one screen. Your VPS, your command center.
- **Visual:** The Mission Control page with process list table, maintenance panel, and the VPS controls -- all in the dark brutalist UI. Animate: status indicators pulsing green.

**Feature 8: OpenClaw Dashboard Embed**
- **Headline:** "OpenClaw inside ClawHQ. No tab switching."
- **Description:** Access your full OpenClaw dashboard without leaving ClawHQ. Embedded directly in your browser with auto-login credentials. Manage agents, skills, plugins, and configurations -- all from one place.
- **Visual:** ClawHQ sidebar on the left, OpenClaw dashboard filling the main content area as an embedded frame. Show the credentials banner at the top.

**Feature 9: Full Context Window**
- **Headline:** "No limits on how much your agents remember."
- **Description:** Starter caps context at 128K tokens. Pro removes the cap entirely -- your models use their full context window. Longer conversations, more document context, better results.
- **Visual:** Side-by-side comparison: Starter shows a conversation truncated with "context limit reached", Pro shows the same conversation continuing naturally with full context.

**Feature 10: Instant Model Switching**
- **Headline:** "Switch models in seconds, not days."
- **Description:** On Starter, model changes take effect next billing cycle. On Pro, switch between models instantly from your dashboard -- no waiting, no downtime. Test different models, find what works best.
- **Visual:** Model selector dropdown with a "Switch Now" button and a green success toast. Contrast with Starter's "Queued for next cycle" badge.

**Feature 11: 4x Infrastructure**
- **Headline:** "4x the power. Same simplicity."
- **Description:** 8 vCPU cores, 32 GB RAM, 400 GB NVMe storage, 32 TB bandwidth. Run more agents, handle more conversations, process larger documents -- all on dedicated infrastructure that scales with your needs.
- **Visual:** Resource comparison bars: Starter (2/8/100/8) vs Pro (8/32/400/32) with animated fill bars. Each bar labeled with the resource type.

---

#### WHAT MAKES PRO WORTH $70 MORE THAN STARTER

**The core value proposition:** Starter gives you a working OpenClaw. Pro gives you **visibility, control, and integration** on top of it.

1. **Visibility** -- Without Pro, you are flying blind. No logs, no analytics, no audit trail. Pro gives you Logs Explorer, Usage Analytics, and Audit Log so you know exactly what is happening inside your instance.

2. **Control** -- Starter gives you start/stop/restart. Pro gives you Mission Control with process management, maintenance tools, instant model switching, and embedded OpenClaw dashboard access.

3. **Integration** -- Starter is a standalone box. Pro connects to your ecosystem via API Access (build on top of your agents), Webhooks (pipe events to your tools), and Knowledge Base (feed your data to your agents).

4. **Infrastructure** -- 4x the compute, 4x the storage, 4x the bandwidth. No context window cap. 5x rate limits. This is not marginal -- it is a fundamentally different tier of hardware.

**Suggested value headline:** "Starter runs your agents. Pro runs your business."

**Suggested sub-headline:** "Logs, analytics, API access, webhooks, knowledge base, audit trail, and 4x the infrastructure -- everything you need to build on top of your AI agents."

---

#### COMPARISON: STARTER vs PRO (what you are missing on Starter)

| Capability | Starter $59 | Pro $129 |
|---|---|---|
| OpenClaw + all channels | Yes | Yes |
| VPS management | Basic (start/stop/restart) | Mission Control (processes, maintenance) |
| OpenClaw dashboard | External link only | Embedded inside ClawHQ |
| Logs | None | Real-time explorer with search & filtering |
| Analytics | None | Full dashboard (messages, conversations, response times, peak hours, agent breakdown) |
| Audit log | None | Complete activity tracking |
| API access | None | API keys, code examples, usage tracking |
| Webhooks | None | Event-driven HTTP notifications |
| Knowledge base | None | Document upload for agent reference |
| Context window | Capped at 128K | Full (model maximum) |
| Model switching | Next billing cycle | Instant |
| VPS specs | 2 vCPU / 8 GB / 100 GB / 8 TB | 8 vCPU / 32 GB / 400 GB / 32 TB |
| Rate limits | Standard | ~5x higher |
| Support | Dashboard + email | Priority support |

---

#### SUGGESTED COPY FOR UPGRADE PROMPTS, FEATURE CARDS & CTAs

**Upgrade banner (shown on Starter dashboard):**
> "You are on Starter. Upgrade to Pro for logs, analytics, API access, and 4x the infrastructure."
> [Upgrade to Pro -->]

**Upgrade prompt on locked Pro pages (already in codebase, suggestions for landing page version):**
> "This is a Pro feature. See what you are missing."
> [View Pro Features]

**Pricing card CTA:**
> Primary button: "Upgrade to Pro -- $129/mo"
> Sub-text: "Everything in Starter, plus 6 Pro Tools and 4x infrastructure."

**Feature section header:**
> "Pro Tools: Built for builders."
> "Six powerful tools that turn your OpenClaw from an AI assistant into a platform you can build on."

**Comparison section CTA:**
> "Still on Starter? See the difference."
> [Compare Plans]

**Testimonial-style social proof placeholder:**
> "I was on Starter for a month. The day I upgraded to Pro, I finally understood what my agents were actually doing." -- [Customer name]

**Urgency/value anchoring:**
> "$70 more gets you: real-time logs, full analytics, API access, webhooks, knowledge base, audit trail, embedded dashboard, 4x hardware, instant model switching, and priority support. That is 10 features for $7 each."

**FAQ entry for landing page:**
> **Q: What does Pro add over Starter?**
> A: Six dedicated Pro Tools (Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log), Mission Control for advanced VPS management, embedded OpenClaw dashboard, full context windows, instant model switching, 4x infrastructure specs, higher rate limits, and priority support.

**Short tagline options for the Pro pricing card:**
- "For teams and builders who need visibility and control."
- "See everything. Control everything. Build on everything."
- "Your agents, fully instrumented."

---

### 1.3 Ultra $350 — Features Deep Dive

Ultra is the power-user tier. It includes everything from Starter ($59) and Pro ($129) plus an exclusive **Command Center** section in the sidebar and significantly upgraded infrastructure. The Ultra tier is priced at **$350/mo** and targets teams, agencies, and operators who run AI agents as a core part of their business workflow — not just a chatbot, but a managed AI workforce.

---

#### ULTRA-EXCLUSIVE FEATURE 1: Mission Control (Command Center Overview)

**Suggested Headline:** "Your AI Workforce. One Dashboard."

**Description Text:**
Mission Control is the nerve center of your AI operation. A single real-time overview shows system health, active agents, tasks in progress, daily cost, and success rate — all updating live via server-sent events. No page refreshes. No guessing.

At a glance you see: agent roster with live status indicators, recent events with severity levels, in-progress tasks with assigned agents, and active sessions with token and cost breakdowns.

**What makes it special:**
- 5 real-time metric cards: System Health %, Active Agents (e.g. 3/5), Tasks In Progress, Cost Today ($), Success Rate %
- Agent roster mini-view with live status dots (online / working / idle / blocked / sleeping / offline)
- Recent events feed with severity color-coding (success, info, warning, error)
- In-progress tasks with priority indicators and agent assignments
- Active sessions showing token counts and per-session cost
- All data auto-refreshes every 2-10 seconds via SSE streaming

**Suggested Visual:**
A stylized screenshot or animated mockup of the Mission Control overview — the 5 metric cards across the top, the two-column layout below (Agent Roster + Recent Events), and the second row (Tasks In Progress + Active Sessions). Emphasize the real-time status dots and the monospace numbers updating.

---

#### ULTRA-EXCLUSIVE FEATURE 2: Task Board (Kanban for AI Agents)

**Suggested Headline:** "Assign Work. Track Progress. Review Output."

**Description Text:**
A full drag-and-drop Kanban board purpose-built for managing AI agent work. Seven columns track every task through its lifecycle: Planning, Inbox, Assigned, In Progress, Testing, Review, Done.

Create tasks with priorities (low / medium / high / critical), assign them to specific agents, set due dates, estimate hours, and break work into subtasks with progress tracking. Every task supports comments, code reviews (approve / reject / request changes), and a full activity log.

**What makes it special:**
- 7-column Kanban with drag-and-drop reordering (powered by dnd-kit)
- Priority levels with color-coded left borders (green / yellow / orange / red)
- Agent assignment — assign any registered agent to a task
- Subtask checklists with visual progress bars
- Due date tracking with overdue detection (turns red when past due)
- Estimated hours per task
- Task detail modal with tabs for comments, reviews, and activity history
- One-click "Send to Inbox" from Planning and "Send to Review" from Testing
- Auto-move to Done when a review is approved

**Suggested Visual:**
A Kanban board mockup showing 4-5 tasks across columns, with colored priority borders, agent avatars, subtask progress bars, and a "critical" badge glowing on one card. Show the drag ghost overlay mid-drag to communicate interactivity.

---

#### ULTRA-EXCLUSIVE FEATURE 3: Agent Roster (Real-Time Agent Management)

**Suggested Headline:** "See Every Agent. In Real Time."

**Description Text:**
The Agent Roster gives you a live operational view of every AI agent in your fleet. Each agent shows its current status, capacity utilization, performance score, current task, deployed tools, and last activity timestamp.

Click any agent to open a detail panel with version info, full capacity metrics, and the exact task it is working on.

**What makes it special:**
- 6 agent statuses tracked: Online, Working, Idle, Blocked, Sleeping, Offline
- Summary cards showing counts per status at the top
- Per-agent capacity bar (0-100%) with real-time updates
- Performance score percentage for each agent
- Current task display — see exactly what each agent is doing right now
- Deployed tools list (e.g. web scraper, code runner, file reader)
- 2-second refresh interval — near real-time visibility
- Detail slide-out panel for deep inspection

**Suggested Visual:**
A list of 3-4 agents with status dots (one green "working," one blue "idle," one red "blocked"), capacity progress bars at different fill levels, and a slide-out panel showing detailed agent stats. Emphasize the color-coded status indicators.

---

#### ULTRA-EXCLUSIVE FEATURE 4: Live Events Feed

**Suggested Headline:** "Every Action. Every Error. Instantly."

**Description Text:**
A real-time activity stream that captures everything happening across your AI agents — webhook fires, tool invocations, errors, task completions, agent state changes, and session starts/ends. Filter by event type or severity. Expand any event to see its full JSON payload.

**What makes it special:**
- 7 event types tracked: Webhook, Tool Invocation, Error, Task Complete, Agent State Change, Session Start, Session End
- 4 severity levels with color-coded icons: Success (green), Info (blue), Warning (yellow), Error (red)
- Filterable by type and severity with instant clear
- Expandable rows showing full event payload as formatted JSON
- Timestamp display (HH:MM:SS) with relative time ("2m ago")
- Agent attribution on every event
- 2-second polling — events appear almost instantly

**Suggested Visual:**
A scrolling event feed mockup with 5-6 events, showing colored severity icons, type badges ("Tool," "Agent," "Webhook"), agent names, and one expanded event revealing its JSON payload. Simulate a live-updating feel.

---

#### ULTRA-EXCLUSIVE FEATURE 5: Session Tracker (Token and Cost Analytics)

**Suggested Headline:** "Track Every Token. Every Dollar."

**Description Text:**
Sessions track every interaction between an agent and an AI model. See active sessions, total sessions, aggregate token counts, and cumulative cost — all in real-time summary cards. Click any session to see tokens in/out, cost, duration, success/failure status, and a full execution trace with step-by-step action replay.

**What makes it special:**
- 4 summary cards: Active Sessions, Total Sessions, Total Tokens, Total Cost
- Per-session breakdown: tokens in / tokens out, cost in USD, duration
- Success/failure status with color-coded badges
- Execution Trace view — a timeline showing each step the agent took, with action name, result, duration (ms/s), and per-step cost
- Active session indicator (pulsing blue badge)
- Error messages displayed for failed sessions
- Task attribution — see which task each session belongs to
- 3-second refresh interval

**Suggested Visual:**
A session list with 3-4 sessions, one marked "Active" with a blue badge, others with green checkmarks. Show the detail slide-out panel open for one session with the Execution Trace timeline — dots connected by a vertical line, each dot color-coded by result (green for success, red for timeout/failure).

---

#### PRO TOOLS INCLUDED IN ULTRA (inherited from Pro tier, not Ultra-exclusive but part of the $350 value):

These features are gated at the Pro level meaning Ultra users get them all:

**5a. Knowledge Base / RAG**
- Upload documents for agents to reference
- Total storage tracking (bytes used)
- Documents managed via API with full CRUD

**5b. Webhooks**
- Up to 10 webhook endpoints per account
- 5 event types: message.received, agent.deployed, vps.status_changed, channel.connected, channel.disconnected
- HTTPS-only with SSRF protection (blocks private/internal URLs)
- Auto-generated signing secrets (whsec_...) for payload verification
- Last triggered timestamp, status code, and failure count tracking
- Full audit log integration — every webhook creation is logged

**5c. Audit Log**
- Complete activity log for your account
- Filterable by category and searchable by action/entity type
- Paginated (up to 100 entries per page)
- Tracks IP address, actor type, entity type, and full details JSON
- Categories cover auth, agents, webhooks, channels, VPS actions, and more

**5d. Logs and Analytics**
- Instance logs viewer
- Usage analytics and trends

**5e. API Access**
- Direct API key management
- Programmatic access to your instance

---

#### WHAT MAKES ULTRA THE "POWER USER" TIER

Ultra is not about getting more resources — it is about getting **operational visibility and control** over an AI agent workforce:

1. **Orchestration, not just hosting.** Starter and Pro give you an AI assistant. Ultra gives you a command center for managing multiple agents as a coordinated team.

2. **Real-time everything.** SSE streaming means Mission Control updates in 2-10 second intervals. No manual refresh. No stale data. You see what your agents are doing right now.

3. **Task lifecycle management.** The 7-column Kanban with drag-and-drop, priorities, subtasks, comments, reviews, and auto-completion is a project management tool built specifically for AI agent workflows.

4. **Cost transparency.** Session tracking with per-token and per-dollar breakdowns gives you the financial visibility to optimize your AI spend.

5. **Accountability.** Execution traces, audit logs, and event feeds create a complete paper trail. When an agent fails a task, you can replay exactly what happened, step by step.

6. **Pro Tools bundled.** Knowledge Base (RAG), Webhooks, Audit Log, API Access, and Analytics all come included — the complete professional toolkit.

---

#### TARGET CUSTOMER FOR ULTRA

- **AI-first teams** running 3+ agents for business-critical workflows (customer support, content generation, data processing, research)
- **Agencies** managing AI agents on behalf of clients who need transparency and reporting
- **Technical founders** building products on top of AI agents who need operational visibility
- **Operations managers** who treat AI agents like employees — assigning tasks, tracking performance, reviewing output
- **Anyone who has outgrown "just chatting with AI"** and needs structured, trackable, auditable AI workflows

The common thread: these are people who have moved past the "AI toy" phase and are running AI as a production operation. They need the same visibility into their AI agents that a DevOps team has into their servers.

---

#### SUGGESTED COPY FOR PREMIUM POSITIONING

**Tagline options:**
- "Command your AI workforce."
- "From chatbot to command center."
- "The dashboard your AI agents deserve."

**Pricing card headline:** "Ultra"
**Pricing card subtext:** "For teams running AI at scale"

**Feature callout (for pricing card):**
- Mission Control command center
- Real-time agent monitoring
- Drag-and-drop task board
- Live event feed
- Session and cost tracking
- Execution trace replay
- Everything in Pro included

**CTA button text:** "Go Ultra" or "Upgrade to Ultra"

**Social proof angle (for when testimonials exist):**
"We went from managing agents in spreadsheets to managing them in Mission Control. Night and day." — [future customer]

**Comparison positioning (vs Pro):**
Pro is for individuals who want professional tools. Ultra is for teams who need a command center. The difference is not resources — it is operational control.

**Urgency / scarcity angle (optional):**
Ultra users get priority support with fastest response times and direct escalation.

---

#### VISUAL STRATEGY SUMMARY

| Feature | Best Visual Format | Key Element to Highlight |
|---|---|---|
| Mission Control Overview | Animated dashboard screenshot | 5 metric cards updating in real time |
| Task Board | Kanban mockup with drag animation | Color-coded priorities + agent assignments |
| Agent Roster | Agent list with status dots | Live status changes (working to idle) |
| Live Events | Scrolling feed | Severity colors + expandable JSON |
| Session Tracker | Session list + trace timeline | Execution trace with step-by-step replay |
| Webhooks | Config panel | Signing secret + event selection |
| Knowledge Base | Document upload UI | File list with storage indicator |
| Audit Log | Log table | Filterable, searchable, timestamped |

For the landing page hero or feature section, the single most impactful visual is the **Mission Control Overview** — it communicates "command center" immediately and shows 4 different data panels in one view (metrics, agents, events, sessions).

---

## PART 2: PER-PLAN POSITIONING

### 2.1 Starter $59 — Positioning & Value

#### 1. VALUE PROPOSITION — Why $59 Is Worth It

**Core argument: $59 all-inclusive beats $19 + hidden costs.**

Most competitors advertise $19-29/mo hosting — but that's BYOK (Bring Your Own Keys). The customer still pays $20-60/mo separately for AI API access (OpenAI, Anthropic, etc.). That means:

| What they advertise | What you actually pay |
|---|---|
| xCloud: $24/mo hosting | + $20-60/mo AI API = **$44-84/mo total** |
| DockClaw: $19.99/mo hosting | + $20-60/mo AI API = **$40-80/mo total** |
| MyClaw Lite: $19/mo hosting | + $20-60/mo AI API = **$39-79/mo total** |
| **ClawHQ Starter: $59/mo** | **$59/mo total. That's it.** |

ClawHQ's $59 includes the AI models, the hosting, the dashboard, all channels, managed updates, and backups. One bill. No API keys to manage. No surprise overages.

**The landing page should make this comparison explicit.** Don't let visitors assume $59 is expensive — show them the math. A side-by-side "What you'd pay elsewhere" vs "What you pay with ClawHQ" breakdown is the single most persuasive element for this tier.

**Secondary value argument: VPS specs.**
At $59, ClawHQ gives 2-4 vCPU, 8-16GB RAM, 100-200GB NVMe. Most competitors at similar all-inclusive pricing (RunMyClaw $49, MyClaw Pro $39) give 2 vCPU / 4GB RAM. ClawHQ gives 2-4x the resources. This matters for users running multiple agents or handling high message volumes.

---

#### 2. TARGET CUSTOMER PERSONA

**Primary: The "I just want it to work" buyer.**

- Solo founders, small team leads, freelancers, solopreneurs
- They know OpenClaw exists and want to use it, but don't want to deal with VPS setup, Docker, API key management, model configuration, or maintenance
- They've looked at self-hosting guides and thought "this is too much work" or tried and got stuck
- They value their time more than saving $10-20/mo on a cheaper BYOK host
- They want to connect WhatsApp/Telegram/Discord and start using AI agents today, not in 3 days after debugging Docker configs
- Budget: $50-100/mo is a reasonable business expense for them — not a personal hobby budget

**Secondary: The "I tried BYOK and I'm done" buyer.**

- Already using a cheap OpenClaw host ($19-29/mo) and paying $30-50/mo separately for API access
- Frustrated by API key rotation, billing surprises, rate limits from third-party providers
- Wants to consolidate into one provider, one bill, one dashboard

**Anti-persona (NOT the target):**

- Developers who enjoy self-hosting and tinkering — they'll never pay for managed hosting
- Price-sensitive hobbyists who want the absolute cheapest option — they should go to $3.90/mo providers
- Enterprise teams with compliance requirements — they need Tier 3

---

#### 3. KEY OBJECTIONS & HOW TO ADDRESS THEM

**Objection 1: "Why not a cheaper competitor at $19-29/mo?"**
- Address on page: "Those prices don't include AI. Add API costs and you're paying $50-80/mo anyway — with two bills, two dashboards, and API keys to manage. ClawHQ: one price, everything included."
- Show the total-cost comparison table prominently in or near the pricing section.

**Objection 2: "Is $59/mo worth it for something I could self-host?"**
- Address on page: "You could self-host. You could also cut your own hair. We handle server setup, Docker deployment, AI model configuration, updates, backups, crash recovery, and channel integration — so you can focus on actually using your agents."
- Emphasize the "fully managed" angle: setup in 24 hours, zero maintenance, auto-restart on crash.

**Objection 3: "Only 2-3 bundled AI models? Competitors offer 500+."**
- Address on page: Don't compete on model count. Reframe: "We include production-ready models that work — Kimi K2.5, MiniMax M2.5, and more. No credit system. No per-token billing. Use them as much as you need."
- The value is unlimited-feel usage at a flat rate, not a long model catalog behind a credit paywall.

**Objection 4: "No free trial?"**
- Address on page: "We show you exactly what you get — VPS specs, models, channels, dashboard screenshots, feature breakdown. Full transparency, no surprises. What you see is what you get."
- Compensate with extreme transparency: show everything on the landing page. Screenshots, feature lists, specs. Leave nothing to imagination.

**Objection 5: "What if I outgrow Starter?"**
- Address on page: "Upgrade to Pro anytime — more resources, full context windows, agent control dashboard. Your setup migrates seamlessly."
- Position Starter as the entry point, not a dead end.

---

#### 4. SUGGESTED HEADLINE / TAGLINE FOR STARTER PRICING CARD

**Primary headline options (pick one):**

1. **"Everything you need. Nothing you don't."** — clean, confident, emphasizes all-inclusive simplicity
2. **"All-inclusive. One price. Zero hassle."** — directly addresses the BYOK cost problem
3. **"Your AI agents, live in 24 hours."** — emphasizes speed-to-value and managed setup

**Recommended: "All-inclusive. One price. Zero hassle."**
This directly differentiates from every BYOK competitor and addresses the #1 objection before it forms.

**Subtitle under the headline:**
"Dedicated VPS + AI models + all channels + dashboard. No API keys. No hidden costs."

**Badge/label on the card:**
"Most Popular" or "Best Value" — use one of these to anchor attention on Starter as the default choice.

---

#### 5. BULLET POINTS THAT SELL STARTER (Not Just List Features)

These are benefit-first, not feature-first. Each bullet should make the buyer think "that's exactly what I need."

1. **"AI models included — no API keys, no separate bills"**
   Why it sells: This is the #1 differentiator. Every other bullet is secondary to this.

2. **"Dedicated VPS with 2-4 vCPU, up to 16GB RAM — yours alone, not shared"**
   Why it sells: "Dedicated" and "yours alone" feel premium. Shared hosting feels cheap. This signals quality.

3. **"WhatsApp, Telegram, Discord, Slack, Signal, Teams — all channels, day one"**
   Why it sells: Multi-channel is the entire point of OpenClaw. Listing all six channels shows breadth without requiring explanation.

4. **"Fully managed — we handle setup, updates, backups, and crash recovery"**
   Why it sells: Speaks directly to the "I just want it to work" persona. They don't want to SSH into anything.

5. **"Live in 24 hours — choose your plan, we build it, you use it"**
   Why it sells: Speed-to-value. No week-long setup process. Compresses the time between "I want this" and "I'm using this."

---

#### 6. EMOTIONAL HOOK

**Primary hook: "No hassle" (save time + remove frustration).**

The Starter buyer isn't optimizing for the cheapest option — they're optimizing for the least friction. They want to skip the entire setup/maintenance/debugging phase and jump straight to using AI agents in their daily workflow.

The emotional arc:
- **Pain:** "I want to use OpenClaw but setting it up is a headache. I don't want to manage servers. I don't want to deal with API keys and billing from three different providers."
- **Relief:** "ClawHQ handles everything. One signup, one bill, live in 24 hours."
- **Confidence:** "Dedicated resources, managed updates, auto-restart. It just works."

**Do NOT use "save money" as the primary hook.** At $59, ClawHQ isn't the cheapest — it's competitive on total cost, but the emotional sell is convenience and reliability, not frugality. Use the cost comparison as rational justification ("see, it's actually not more expensive"), but lead with the emotional simplicity angle.

**Tone:** Confident, direct, no-BS. Not salesy. Not "revolutionizing AI." Just: here's what you get, here's what it costs, here's why it's worth it. The brutalist design reinforces this — the product speaks for itself.

---

#### 7. CTA TEXT SUGGESTIONS

**Primary CTA (pricing card button):**
- **"Get Started"** — simple, action-oriented, low commitment feeling
- **"Start Building"** — implies they'll be productive immediately

**Recommended: "Get Started"** — it's universal, tested, and doesn't overthink it.

**Secondary CTA options (if using dual CTAs):**
- "See what's included" — scrolls to detailed feature breakdown
- "Compare plans" — anchors to the full pricing comparison

**Avoid:**
- "Buy Now" — too transactional for $59/mo recurring
- "Subscribe" — feels bureaucratic
- "Try It" — there's no trial, so this would be misleading
- "Sign Up" — too generic, doesn't convey value

**CTA near the cost comparison section:**
- "Stop paying twice. Get everything in one plan." + [Get Started] button
- This reinforces the all-inclusive value prop right at the decision point

---

### 2.2 Pro $129 — Positioning & Value

#### 1. VALUE PROPOSITION — What $70 More Gets You

The jump from $59 to $129 is not an incremental upgrade. It is a category shift. Starter gives you a managed OpenClaw instance. Pro gives you a managed AI operations platform.

The $70 delta buys three things that fundamentally change what you can do:

**A) Raw power (4x compute jump):**
- 8 vCPU (4x Starter), 32GB RAM (4x), 400GB NVMe (4x), 32TB bandwidth (4x)
- This is not "a little more headroom." This is the difference between running 1-2 agents comfortably and running a fleet of agents under load without breaking a sweat.
- No competitor in the market offers 8 vCPU / 32GB RAM managed OpenClaw infrastructure at $129. The closest is KiloClaw at $199 — and they do not manage your VPS.

**B) Full AI model access (no guardrails):**
- Full context windows — no 128K cap. Models run at their native maximum.
- Instant model switching from the dashboard — no waiting for next billing cycle.
- Models can expand anytime as new ones become available.
- For anyone doing serious agent work, the 128K context cap on Starter is a real ceiling. Pro removes it entirely.

**C) Operational visibility + control:**
- Monitoring dashboard, logs viewer, analytics — see what your agents are doing in real time.
- Smart routing — traffic is routed intelligently across your infrastructure.
- API access — build on top of your OpenClaw programmatically.
- Full OpenClaw dashboard access with agent management (add, remove, chat with agents directly).
- 5x rate limits — five times the throughput of Starter.

**The $70 reframe:** Starter customers who hit the context cap, need faster model switching, or want to see what their agents are actually doing will feel the friction. Pro removes all of it. The question is not "is $70 worth it?" — the question is "how much is the friction costing you right now?"

---

#### 2. TARGET CUSTOMER PERSONA

**Primary: The Serious Builder.**

- Running 3+ agents across multiple channels (WhatsApp, Telegram, Discord, Slack)
- Using agents for business operations, not just personal assistance
- Needs full context windows for complex, multi-step agent workflows
- Wants to monitor agent behavior, debug issues, and iterate fast
- Likely a technical founder, solo developer, or small team lead
- Monthly AI spend budget: $100-300. Pro at $129 all-inclusive is a consolidation play — replaces separate hosting + API + monitoring costs.

**Secondary: The Growing Starter Customer.**

- Started on the $59 plan, hit one or more ceilings:
  - 128K context cap limiting agent quality
  - Waiting for next billing cycle to switch models
  - No visibility into agent performance
  - Rate limits slowing down production workloads
- Already trusts ClawHQ, just needs more room to operate.

**Anti-persona (NOT the target):**

- Hobbyists running a single personal Telegram bot — Starter is fine for them
- Enterprise teams needing custom agent building and white-glove service — Enterprise is the right fit

---

#### 3. KEY UPGRADE TRIGGERS — When Does Someone NEED Pro?

These are the friction moments that make a Starter customer reach for the upgrade button:

1. **"My agent keeps losing context mid-conversation."** The 128K cap truncates long threads. Pro gives full native context per model — conversations stay coherent across dozens of exchanges.

2. **"I need to switch models and I have to wait 30 days."** Starter locks model changes to the next billing cycle. Pro lets you switch instantly from the dashboard. Testing a new model takes seconds, not a month.

3. **"I have no idea why my agent gave that response."** No logs, no analytics, no monitoring on Starter. Pro gives you the full picture — what happened, when, and why.

4. **"I'm hitting rate limits during business hours."** Starter rate limits are designed to prevent abuse. Pro gives 5x the throughput — built for production workloads, not hobby usage.

5. **"I need API access to build custom integrations."** Starter is dashboard-only. Pro opens up the API — build workflows, connect external tools, automate deployments.

6. **"I'm running out of disk space / my agents are slow."** 100GB NVMe and 2 vCPU are fine for light use. 400GB and 8 vCPU handle serious agent fleets without performance degradation.

---

#### 4. SUGGESTED HEADLINE / TAGLINE FOR PRO PRICING CARD

**Primary headline options (pick one):**

1. **"For builders who ship"** — short, decisive, implies action
2. **"Built for production"** — clear tier signal, implies Starter is for getting started
3. **"Your AI operations hub"** — positions Pro as a platform, not just a plan
4. **"Run agents at scale"** — directly speaks to the upgrade trigger

**Recommended: "For builders who ship."**
It draws a line: Starter is for exploring, Pro is for doing real work. It flatters the buyer — you are a builder, you ship things, this is your tier. It is short enough for a pricing card badge.

**Subtitle under the price:**
"Full power. Full context. Full control."

**Badge text:**
"MOST POPULAR" — use this badge on the Pro card. Positioning Pro as most popular creates social proof pressure and anchors Enterprise as premium rather than making Pro feel expensive.

---

#### 5. BULLET POINTS THAT SELL PRO (Benefit-First)

Five bullets, ordered by impact:

1. **"8 vCPU, 32GB RAM, 400GB NVMe — 4x the power of Starter"**
   Why it sells: Raw numbers are immediately comparable. "4x" is a concrete multiplier that makes the upgrade tangible. No competitor matches these specs at $129.

2. **"Full context windows — no 128K cap"**
   Why it sells: Directly addresses the #1 technical frustration on Starter. "Full" vs "capped" is a clear upgrade story. Anyone doing serious agent work has hit this wall.

3. **"Monitoring, logs & analytics — see what your agents are doing"**
   Why it sells: Operational visibility is what separates hobbyists from professionals. This is the feature that makes Pro feel like a platform, not just a hosting plan.

4. **"Instant model switching + API access"**
   Why it sells: Two high-value features in one bullet. "Instant" contrasts with Starter's billing-cycle wait. API access opens up an entirely new category of usage.

5. **"5x rate limits + priority support"**
   Why it sells: "5x" is concrete. Priority support signals that Pro customers are not in the same queue as everyone else.

**Alternative compact format (if card space is limited):**
- 8 vCPU / 32GB RAM / 400GB NVMe / 32TB bandwidth
- Full context windows (no 128K cap)
- Monitoring dashboard + logs + analytics
- Instant model switching + API access
- 5x rate limits + priority support

---

#### 6. HOW TO POSITION PRO AS "MOST POPULAR" / "BEST VALUE"

**Strategy: The Goldilocks Frame.**

Pro should feel like the obvious choice — not the cheapest, not the most expensive, but the one that makes sense for anyone doing real work.

**Tactical execution:**

- **Visual emphasis:** Pro card should be physically larger, or have a highlighted border/accent color, or be lifted/elevated compared to Starter and Enterprise. It should be the card your eye lands on first.

- **"MOST POPULAR" badge:** Place this on the Pro card. Even before you have real usage data, this label creates a bandwagon effect. Visitors assume others chose it for good reason.

- **Price anchoring with Enterprise:** Showing Enterprise at $999+/mo makes $129 feel extremely reasonable. The visitor thinks "I get 80% of the power for 13% of the price."

- **Total cost comparison:** Below the pricing cards or in a tooltip, show the real cost of assembling Pro-equivalent infrastructure yourself: VPS ($50-80/mo) + AI API ($30-100/mo) + monitoring tools ($20-50/mo) + time to manage it all = $100-230/mo minimum. Pro at $129 all-inclusive is a consolidation win.

- **Starter as "gateway":** Position Starter copy to subtly hint at its limitations: "Perfect for getting started" or "Great for personal use." This makes Pro the natural graduation, not a splurge. (Note: Agent 4's Starter positioning already supports this — Starter's tagline is about simplicity, Pro's is about power.)

- **Upgrade path language:** On the Starter card, add a small line: "Need more? Upgrade to Pro anytime." This plants the seed that Starter is temporary.

**Value framing to use in copy near the pricing section:**
"Most teams start with Starter and upgrade to Pro within 30 days. The extra $70/mo pays for itself the first time you debug an agent issue in real time instead of guessing."

---

#### 7. CTA TEXT SUGGESTIONS

**Primary CTA (Pro pricing card button):**
- **"Get Pro"** — direct, no friction, confident
- **"Start with Pro"** — implies this is where serious users begin
- **"Go Pro"** — short, energetic, familiar pattern

**Recommended: "Get Pro"** — two words, zero ambiguity, action-oriented. Pairs well with Starter's "Get Started" — the verb stays consistent, the noun escalates.

**Secondary CTA / link (below the button):**
- "Compare all plans" — for the detail-oriented buyer who wants the full feature matrix
- "See what's included" — softer, curiosity-driven

**Upgrade CTA (shown to existing Starter customers in the dashboard):**
- "Upgrade to Pro" — standard, clear
- "Remove the limits" — speaks to the friction they are already feeling
- "Unlock full power" — aspirational but honest

**Annual plan nudge (if showing monthly/annual toggle):**
- Monthly: "$129/mo"
- Annual: "$1,299/yr" with a note: "Save $249/yr" or "2 months free"

**Avoid:**
- "Buy Now" — too transactional
- "Subscribe" — feels bureaucratic
- "Try Pro" — there is no trial
- "Learn More" — passive, delays the decision

---

#### SUMMARY

Pro at $129/mo is the "serious user" tier — the plan for builders who have outgrown Starter's guardrails and need full compute power, full context windows, real-time monitoring, and API access to run agents in production. No competitor offers this combination of managed VPS (8 vCPU/32GB/400GB), bundled AI models at full context, and an agent control dashboard at this price point. Position it as "Most Popular," frame it as the natural upgrade from Starter, and anchor it against Enterprise's $999+ to make $129 feel like the smart middle ground.

---

### 2.3 Ultra $350 — Positioning & Value

#### 1. TARGET PERSONA — Who Buys $350/mo Hosting?

**Primary: "The AI Operations Lead"**
- Agencies running AI agents on behalf of clients (need transparency, reporting, audit trails)
- Technical founders building products on top of AI agents who need operational visibility
- Operations managers running 5+ agents for business-critical workflows (support, content, data processing)
- Teams of 3-10 who need role-based access and structured task management

**Secondary: Graduating Pro Customers**
- Pro users who hit the ceiling: no task tracking, no cost analytics, no execution traces, no real-time fleet overview
- Pro users whose agent count or complexity outgrew "tools" and need a "command center"

**Anti-Persona (NOT Ultra):**
- Solo hobbyists (Starter is enough)
- Individual developers who just want a chatbot (Pro covers that)
- Enterprise customers who need custom agents and white-glove service ($999+)

---

#### 2. VALUE JUSTIFICATION — Why $350 Is Worth It

**Core Argument: $350 replaces $500-900/mo in fragmented tooling.**

Without Ultra, running a multi-agent operation requires:

| Tool | Monthly Cost |
|---|---|
| VPS hosting (8+ vCPU, 32GB RAM) | $50-100 |
| AI API access (multiple models) | $30-80 |
| Monitoring/observability (Datadog, etc.) | $50-150 |
| Project management (Linear, Asana) | $20-50 |
| Cost tracking / analytics | $30-50 |
| Webhook/integration infra | $20-50 |
| RAG/knowledge base hosting | $30-50 |
| **Total DIY stack** | **$230-530/mo** |
| **+ Your time to build/maintain** | **40-80 hours setup** |

**ClawHQ Ultra: $350/mo. All of the above. Zero setup. Zero maintenance.**

**Pro ($129) vs Ultra ($350) — Infrastructure Comparison:**

| Resource | Pro | Ultra |
|---|---|---|
| vCPU | 8 | 16 (2x) |
| RAM | 32 GB | 64 GB (2x) |
| Storage | 400 GB NVMe | 800 GB NVMe (2x) |
| Bandwidth | 32 TB | 64 TB (2x) |
| AI Credits | Standard | 5x Pro |

---

#### 3. KEY DIFFERENTIATORS FROM PRO — What Makes Ultra Worth 2.7x More

**One-liner: "Pro gives you tools. Ultra gives you a command center."**

**Category shift:** Pro is a professional toolkit. Ultra is an operational control plane.

| Category | Pro ($129) | Ultra ($350) |
|---|---|---|
| Agent management | Add/remove/chat | Full fleet roster with live status |
| Task management | None | 7-column Kanban with drag-and-drop |
| Monitoring | Basic logs | Mission Control with real-time SSE |
| Cost tracking | None | Per-session token and dollar breakdown |
| Event visibility | None | Live event feed with severity filtering |
| Execution traces | None | Step-by-step action replay |
| Infrastructure | 8 vCPU / 32 GB | 16 vCPU / 64 GB |
| AI credits | Standard | 5x |

**The 5 Ultra-Exclusive Features (not available on any lower tier):**
1. **Mission Control** — Real-time command center overview
2. **Task Board** — Kanban for assigning work to AI agents
3. **Agent Roster** — Live fleet status with capacity and performance metrics
4. **Live Events** — Real-time activity stream with severity filtering
5. **Session Tracker** — Token/cost analytics with execution trace replay

---

#### 4. HEADLINE / TAGLINE SUGGESTIONS

**Recommended headline:** "Command your AI workforce."
**Subtitle:** "Mission Control. Task Board. Agent Roster. Full operational visibility."

**Badge:** "MOST POWERFUL"

**Alternative headlines:**
- "From chatbot to command center."
- "The dashboard your AI agents deserve."
- "Run AI like a production operation."
- "Your agents. Your command center. Full control."

**Short-form taglines (for pricing card, badges, CTAs):**
- "For teams running AI at scale"
- "Full operational control"
- "See everything. Control everything."

**Pricing card headline:** "Ultra"
**Pricing card subtext:** "For teams running AI at scale"

---

#### 5. OBJECTION HANDLING

**Objection 1: "$350 is too expensive"**
→ Reframe: "It's not hosting. It's a platform."
→ $350 replaces $500-900/mo in fragmented tools + 40-80 hours of setup time
→ Compare: $350/mo = $11.67/day for a full AI operations platform with dedicated 16-core infrastructure

**Objection 2: "Pro seems like enough"**
→ "Pro gives you tools. Ultra gives you a command center."
→ If you're managing 1-2 agents for personal use, Pro is great. The moment you're running a fleet — assigning tasks, tracking costs, monitoring performance — you need Ultra.
→ Analogy: Pro is a spreadsheet. Ultra is a project management suite.

**Objection 3: "I can build this myself"**
→ Mission Control + Task Board + Agent Roster + Events + Sessions = 40-80 hours to build from scratch
→ Then you maintain it. Forever. While also running your business.
→ $350/mo vs hiring a developer at $5,000+/mo to build and maintain your own

**Objection 4: "Why not just go Enterprise?"**
→ Enterprise ($999+) is for custom agent building, bespoke integrations, and white-glove service
→ Ultra gives you the full platform out of the box — no calls needed, no custom work, just start using it
→ If the standard platform covers your needs, Ultra is the better deal

**Objection 5: "No free trial?"**
→ Full transparency on the landing page — every feature, every spec, every screenshot
→ Start with Starter ($59) or Pro ($129) first, upgrade when you're ready
→ The upgrade path is instant — no migration, no data loss

---

#### 6. CTA SUGGESTIONS

**Primary CTA:** "Go Ultra"
**Secondary CTA:** "See the Command Center" (scrolls to Mission Control feature showcase)

**Dashboard upgrade CTA:** "Upgrade to Ultra" (for existing Pro users)

**Annual nudge:** "$3,499/yr — Save $701" (vs $4,200/yr monthly)

**Avoid:**
- "Start free trial" (no free trial)
- "Book a demo" (that's Enterprise)
- "Contact sales" (that's Enterprise)

---

## PART 3: FULL CODEBASE ANALYSIS

### 3.1 AI Models & API System

#### 1. AI MODELS PER PLAN

| Feature | Starter ($59) | Pro ($129) | Ultra ($350) | Enterprise ($999+) |
|---|---|---|---|---|
| Bundled models | 3 (Kimi K2.5, MiniMax M2.5 + 1 rotating) | All available models | All available models | Custom model selection |
| Context window | Capped at 128K | Full (max per model) | Full (max per model) | Full + custom |
| Model switching | 1 change per billing cycle (queued) | Unlimited, instant | Unlimited, instant | Unlimited, instant |
| BYOK support | Yes (bring your own API keys too) | Yes | Yes | Yes |
| Session tracking | No | No | Yes (token + cost per session) | Yes |
| AI credits | Standard | Standard | 5x Starter | Custom |

**Key selling point:** Every plan includes AI models out of the box. No API keys needed. No per-token billing. No credit packs. Just use your agents.

---

#### 2. HOW MODEL SELECTION WORKS

**Starter Flow (Queued):**
1. User opens Models page in dashboard
2. Sees current active model, available models list with descriptions
3. Selects a new model → change is **scheduled for next billing cycle**
4. Dashboard shows "Pending change: [Model Name] — effective [date]"
5. User can cancel the pending change before it takes effect
6. 1 change allowed per billing cycle — counter resets each month

**Pro / Ultra Flow (Instant):**
1. User opens Models page in dashboard
2. Selects a new model → change applies **immediately**
3. Config is pushed to VPS via SSH in real-time
4. Agent starts using the new model within seconds
5. Unlimited changes — no waiting, no queuing

**What the dashboard shows:**
- Current active model name and context limit
- List of all available models with display names and descriptions
- Change counter ("X changes used this cycle")
- For Starter: "Upgrade to Pro for instant, unlimited model changes" prompt

---

#### 3. KEY SELLING POINTS (for landing page copy)

**Point 1: No API Keys Needed**
- Headline: "AI models included. Not bolted on."
- Copy: "Other providers hand you an API key form and say 'figure it out.' ClawHQ includes production-ready AI models on every plan. No signup to OpenAI. No credit card for Anthropic. No billing surprises."

**Point 2: Flat-Rate Pricing**
- Headline: "One price. Unlimited usage."
- Copy: "No per-token billing. No credit packs. No usage anxiety. Your AI models are included in your plan — use them as much as you need."

**Point 3: No Credit System**
- Headline: "No credits. No limits. No math."
- Copy: "Competitors sell you 3,000 credits or $15 AI credit packs. When they run out, your agents stop working. ClawHQ doesn't do credits. Your agents just work."

**Point 4: Production-Ready Models**
- Headline: "Models that work. Out of the box."
- Copy: "Kimi K2.5, MiniMax M2.5, and more — pre-configured, tested, and ready. No fine-tuning required. No model management headaches."

**Point 5: Zero Configuration**
- Headline: "Pick a model. Done."
- Copy: "One click in your dashboard. That's it. On Pro and Ultra, the change is instant — your agent switches models in seconds. No restart. No downtime."

---

#### 4. HEADLINE SUGGESTIONS FOR LANDING PAGE

**Recommended:** "AI Models Built In. Not Bolted On."

**Alternatives:**
- "Your AI. Already included."
- "Models included. API keys not required."
- "No BYOK. No credits. No nonsense."
- "AI that works the moment you sign up."

---

#### 5. VISUAL / ANIMATION SUGGESTIONS

**Visual 1: Model Card Display**
Show 3-4 model cards (Kimi K2.5, MiniMax M2.5, etc.) in a grid with the active one highlighted. Animate the selection — click a card, it glows, "Active" badge appears. Clean, dark UI matching the dashboard style.

**Visual 2: Three-Step Flow**
Animated sequence: (1) "Choose your plan" → (2) "Pick your model" → (3) "Start using your agent" — emphasizing that models are part of the setup, not an afterthought.

**Visual 3: Instant Switcher Demo**
Side-by-side: Starter shows "Change scheduled for April 15" vs Pro/Ultra shows instant switch with a satisfying animation. Demonstrates the upgrade value.

**Visual 4: "What You Don't Have to Do" Comparison**
Left column (crossed out, grayed): "Sign up for OpenAI → Get API key → Set usage limits → Monitor token spend → Top up credits"
Right column (ClawHQ): "Pick a model. Done." — single green checkmark.

**Visual 5: Competitor Credit Table**
Show competitors with their credit systems: "RunMyClaw: 3000 credits/mo", "SimpleClaw: $15 credit pack", "KiloClaw: $278 credits" — then ClawHQ: "Unlimited. Flat rate."

**Visual 6: Context Window Comparison Bars**
Horizontal bars comparing context windows. Competitors: "32K" (short bar), "64K" (medium). ClawHQ Starter: "128K" (long). ClawHQ Pro/Ultra: "Full model max" (longest bar). Shows technical superiority visually.

---

#### 6. COMPETITOR COMPARISON — Bundled vs BYOK

| Competitor Approach | How It Works | Problem |
|---|---|---|
| **BYOK (Bring Your Own Key)** — xCloud, DockClaw | Customer provides their own OpenAI/Anthropic API key | Customer pays $20-60/mo extra for AI access, manages their own billing |
| **Credit-Based** — RunMyClaw, SimpleClaw, KiloClaw | Provider gives X credits per month, charges for more | Credits run out mid-month, agents stop working, unpredictable costs |
| **Free Models Only** — ClawHosters | Only offers open-source models with no API cost | Limited model quality, no premium options |
| **ClawHQ Bundled** | Models included on every plan, flat-rate, no limits | None. That's the point. |

**Landing page copy for comparison section:**
"Most providers charge you for hosting — then make you figure out AI access on your own. You sign up for API keys, set usage limits, monitor token spend, and pray you don't get a surprise bill. ClawHQ includes production-ready AI models on every plan. One price. Everything works."

---

#### 7. FAQ ENTRIES

**Q: What models are included?**
A: Every plan includes production-ready AI models like Kimi K2.5 and MiniMax M2.5. Pro and Ultra plans get access to our full model library with instant switching.

**Q: Can I bring my own API keys?**
A: Yes — BYOK is supported on all plans if you want to use your own keys alongside our bundled models.

**Q: How often can I change models?**
A: Starter: 1 change per billing cycle (takes effect next cycle). Pro & Ultra: unlimited instant changes.

**Q: Is there per-token billing or credit limits?**
A: No. AI usage is flat-rate on every plan. No credits, no per-token charges, no overage fees.

**Q: What context window do I get?**
A: Starter: up to 128K tokens. Pro & Ultra: full context window as supported by each model.

**Q: What if I need a specific model not in the library?**
A: Enterprise tier ($999+) includes custom model selection tailored to your use case.

---

### 3.2 Channels & Integrations
**AGENT PROMPT:**

You are a content researcher for ClawHQ (managed OpenClaw hosting SaaS). Your job is to write production-ready content suggestions for the landing page — NOT code, NOT UI. Just content: what to write, what to show, what headlines/descriptions to use.

Your section: **3.2 Channels & Integrations**

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (pricing, plans, channel list)
- `d:\openclaw\CLAWHQ_TECHNICAL.md` (technical details)
- `d:\openclaw\dashboard\src\app\dashboard\channels\page.tsx` (channels page)
- `d:\openclaw\dashboard\src\app\api\channels\connect\route.ts` (channel connect API)
- `d:\openclaw\dashboard\src\app\api\channels\disconnect\route.ts` (channel disconnect API)
- `d:\openclaw\dashboard\src\lib\ssh.ts` (configureChannel, removeChannel functions)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read completed sections 1.1-3.1 for style reference)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details (Ollama, Hostinger, Blackbox, or any provider names).
- Every plan includes all channels — this is a key differentiator.

Write your content BELOW this prompt section. Include:
1. Complete list of supported channels with how each one works (self-service vs admin-setup)
2. Per-channel setup flow — what the user does in the dashboard
3. Health check / status monitoring features
4. Key selling points for landing page (all channels included, no extra fees, day-one availability)
5. Headline suggestions for a "Channels" or "Connect Everywhere" section
6. Visual/animation suggestions (channel icons, connection flow, status indicators)
7. Competitor comparison — most competitors support 2-3 channels, ClawHQ supports all 8
8. FAQ entries about channels

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

### 3.3 Agent Store & Deployment
**AGENT PROMPT:**

You are a content researcher for ClawHQ (managed OpenClaw hosting SaaS). Your job is to write production-ready content suggestions for the landing page — NOT code, NOT UI. Just content: what to write, what to show, what headlines/descriptions to use.

Your section: **3.3 Agent Store & Deployment**

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (premium agents, agent marketplace)
- `d:\openclaw\CLAWHQ_TECHNICAL.md` (technical details)
- `d:\openclaw\dashboard\src\app\dashboard\agents\page.tsx` (agents page)
- `d:\openclaw\dashboard\src\app\api\agents\deploy\route.ts` (agent deploy API)
- `d:\openclaw\dashboard\src\app\api\agents\undeploy\route.ts` (agent undeploy API)
- `d:\openclaw\dashboard\src\lib\ssh.ts` (deployAgent, undeployAgent functions)
- `d:\openclaw\dashboard\src\app\dashboard\chat\page.tsx` (agent chat page)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read completed sections for style reference)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details (Ollama, Hostinger, Blackbox, or any provider names).
- Agents are a key differentiator — browse, buy, deploy, chat from dashboard.

Write your content BELOW this prompt section. Include:
1. How the agent store works (browse free + premium agents, one-click deploy/undeploy)
2. Agent deployment flow — what happens when a user deploys an agent
3. Agent chat feature — chatting with deployed agents from the dashboard
4. Premium vs free agents — what's the difference, how purchases work
5. Key selling points for landing page (marketplace, one-click deploy, no coding needed)
6. Headline suggestions for an "Agent Store" or "AI Agents" section
7. Visual/animation suggestions (agent cards, deploy animation, chat interface preview)
8. Enterprise angle — custom agent building service ($999+)
9. FAQ entries about agents

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

### 3.4 VPS & Infrastructure
**AGENT PROMPT:**

You are a content researcher for ClawHQ (managed OpenClaw hosting SaaS). Your job is to write production-ready content suggestions for the landing page — NOT code, NOT UI. Just content: what to write, what to show, what headlines/descriptions to use.

Your section: **3.4 VPS & Infrastructure**

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (VPS specs per tier, cost structure)
- `d:\openclaw\CLAWHQ_TECHNICAL.md` (provisioning pipeline, SSH management)
- `d:\openclaw\dashboard\src\app\dashboard\vps\page.tsx` (VPS dashboard page)
- `d:\openclaw\dashboard\src\app\api\vps\status\route.ts` (VPS status API)
- `d:\openclaw\dashboard\src\app\api\vps\start\route.ts` (VPS start)
- `d:\openclaw\dashboard\src\app\api\vps\stop\route.ts` (VPS stop)
- `d:\openclaw\dashboard\src\app\api\vps\restart\route.ts` (VPS restart)
- `d:\openclaw\dashboard\src\app\api\vps\monitoring\route.ts` (VPS monitoring)
- `d:\openclaw\dashboard\src\lib\ssh.ts` (getProcessStatus, getVPSStats functions)
- `d:\openclaw\dashboard\src\lib\provision-v3.ts` (12-step provisioning)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read completed sections for style reference)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details (Hostinger, specific VPS provider, server locations).
- NEVER mention SSH, Docker internals, or provisioning scripts in user-facing copy.
- Focus on what the user SEES: dashboard controls, monitoring charts, uptime.

Write your content BELOW this prompt section. Include:
1. VPS specs per tier (Starter: 2vCPU/8GB, Pro: 8vCPU/32GB, Ultra: 16vCPU/64GB, Enterprise: custom)
2. What the VPS dashboard shows (start/stop/restart, CPU/RAM/disk/network charts, gateway health, logs, uptime)
3. Managed infrastructure selling points (24h setup, zero maintenance, auto-restart, daily backups)
4. The 12-step automated provisioning — describe the OUTCOME not the process (user-facing: "ready in 24 hours")
5. Headline suggestions for an "Infrastructure" or "Your Server" section
6. Visual/animation suggestions (server status dashboard, resource bars, uptime indicator)
7. Competitor comparison — dedicated VPS vs shared hosting, resource specs vs competitors
8. FAQ entries about infrastructure

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

## PART 4: CONTENT STRATEGY

### 4.1 Product Features Analyst
**AGENT PROMPT:**

You are a product features analyst for ClawHQ (managed OpenClaw hosting SaaS). Your job is to create a master feature inventory and recommend which features to highlight on the landing page and HOW to present them.

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (all plans, features)
- `d:\openclaw\CLAWHQ_TECHNICAL.md` (full technical architecture)
- `d:\openclaw\dashboard\src\components\dashboard\app-sidebar.tsx` (sidebar navigation — shows all features)
- `d:\openclaw\dashboard\src\lib\tier.ts` (plan hierarchy and gating)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read ALL completed sections 1.1-3.4 for what's already documented)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details (Ollama, Hostinger, Blackbox, or any provider names).
- Your job is CROSS-CUTTING — synthesize all features across all plans into a landing page strategy.

Write your content BELOW this prompt section. Include:
1. Master feature inventory — every feature across all tiers, categorized (core, pro tools, ultra command center, enterprise)
2. Landing page feature hierarchy — which features deserve their own section vs bullet point vs mention
3. "Hero features" — the 3-5 features that should be front-and-center in the hero/above-fold area
4. Feature grouping strategy — how to organize features into landing page sections (by category? by tier? by use case?)
5. Features that sell vs features that reassure — which drive signups vs which prevent objections
6. Cross-tier feature comparison matrix — one master table showing all features across all plans
7. Recommended feature showcase order for the landing page (what comes first, second, third...)

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

### 4.2 Pricing & Plans Strategist
**AGENT PROMPT:**

You are a pricing strategist for ClawHQ (managed OpenClaw hosting SaaS). Your job is to create the pricing section content and strategy for the landing page.

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (all pricing, tiers, competitive landscape)
- `d:\openclaw\MARKET_ANALYSIS.md` (29+ competitor analysis)
- `d:\openclaw\dashboard\src\lib\tier.ts` (plan hierarchy)
- `d:\openclaw\dashboard\src\app\dashboard\billing\page.tsx` (billing page)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read sections 2.1-2.3 for per-plan positioning already written)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere. All 4 tiers: Starter $59, Pro $129, Ultra $350, Enterprise $999+.
- NEVER expose backend details or internal cost structure.
- Annual pricing: Starter $599/yr, Pro $1,299/yr, Ultra $3,499/yr, Enterprise custom.

Write your content BELOW this prompt section. Include:
1. Pricing card layout — what each card should show (name, price, tagline, feature bullets, CTA, badge)
2. Monthly/annual toggle strategy — how to present the savings
3. Price anchoring strategy — how to make Pro feel like the best deal (Goldilocks effect)
4. Feature comparison table — full matrix below pricing cards showing all features across all 4 tiers
5. "All-inclusive" callout — emphasize no hidden costs, no API fees, no channel fees
6. Enterprise card strategy — "Talk to Us" with scheduling link, what to show
7. Upgrade path messaging — how to communicate the progression Starter → Pro → Ultra → Enterprise
8. FAQ entries specific to pricing (refunds, upgrades, downgrades, billing cycles)
9. Competitive pricing comparison — total cost of ClawHQ vs competitors (without naming them)

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

### 4.3 Competitive Positioning Writer

#### 1. "WHY CLAWHQ" SECTION — 6 Differentiators

Each differentiator has a headline, a subheadline, and a 1-2 sentence description. Display as a grid or stacked section.

**Differentiator 1: All-Inclusive Pricing**
- **Headline:** "One price. Everything included."
- **Subheadline:** "No API keys. No separate AI bills. No surprise overages."
- **Description:** "Most providers charge $19-29 for hosting — then you pay $20-60/mo more for AI access on your own. ClawHQ bundles hosting, AI models, all channels, and a full dashboard into one flat price. One bill. Done."

**Differentiator 2: Dedicated Infrastructure**
- **Headline:** "Your own server. Not shared. Not throttled."
- **Subheadline:** "Dedicated VPS with resources that actually match what you need."
- **Description:** "Every ClawHQ instance runs on its own dedicated server — 2-8 vCPU, 8-32GB RAM, 100-400GB NVMe storage. No noisy neighbors. No performance lottery. Your agents get the full resources you're paying for."

**Differentiator 3: AI Models Built In**
- **Headline:** "AI models included. Use them. Don't manage them."
- **Subheadline:** "Production-ready models, flat-rate usage, no credit systems."
- **Description:** "Other providers hand you an API key form and say 'figure it out.' ClawHQ includes high-performance AI models out of the box — no per-token billing, no credit packs, no usage anxiety. Just use your agents."

**Differentiator 4: 8 Channels, Day One**
- **Headline:** "WhatsApp. Telegram. Discord. Slack. Signal. Teams. Email. Web."
- **Subheadline:** "Every channel your business uses, connected from day one."
- **Description:** "Most alternatives support 2-3 channels and charge extra for the rest. ClawHQ connects all 8 messaging channels on every plan. Your agents meet your customers where they already are."

**Differentiator 5: Agent Control (Pro)**
- **Headline:** "Build, deploy, and manage agents from one dashboard."
- **Subheadline:** "Agent control that goes beyond basic hosting."
- **Description:** "On Pro, you get a full agent management dashboard — add agents, remove agents, chat with them, and monitor performance. This isn't just hosting. It's a command center for your AI workforce."

**Differentiator 6: Fully Managed, Zero Maintenance**
- **Headline:** "We handle the servers. You handle your business."
- **Subheadline:** "Setup, updates, backups, crash recovery — all handled."
- **Description:** "No SSH. No Docker debugging. No 3 AM crash alerts. ClawHQ sets up your instance within 24 hours, keeps it updated, backs it up daily, and auto-restarts on failure. You never touch a terminal."

---

#### 2. COMPARISON TABLE — "ClawHQ vs Others"

Place near the pricing section. Compares ClawHQ against the *typical* competitor, not named ones. Use checkmarks/X marks visually.

**Table title:** "What you get vs. what most alternatives offer"

| Feature | Most Alternatives | ClawHQ |
|---|---|---|
| Hosting | Yes | Yes |
| AI models included (no BYOK) | Rarely — most require your own API keys | Yes, on every plan |
| Dedicated VPS (not shared) | Sometimes — often shared or underpowered | Yes, dedicated resources on every plan |
| All messaging channels included | 2-3 channels, extras cost more | 8 channels on every plan |
| Full management dashboard | Basic or none | Full dashboard with VPS controls, billing, support |
| Agent management dashboard | Almost never | Yes (Pro tier) |
| Premium pre-built agents | No | Yes, agent marketplace |
| Custom agent building | No | Yes (Enterprise) |
| Managed updates & backups | Sometimes | Always, on every plan |
| Auto-restart on crash | Inconsistent | Yes, Docker-based with auto-recovery |
| Setup time | "DIY" or 24-72 hours | Under 24 hours, fully managed |
| Hidden costs | Common — API fees, channel fees, overage charges | None. One price. That's it. |

**Below the table:**
"Still comparing? Add up what you'd pay elsewhere: hosting + AI API + channel integrations + maintenance time. Then compare that to one ClawHQ plan."

---

#### 3. OBJECTION HANDLING CONTENT

Can live in the FAQ section, or be placed inline near the pricing cards as short callouts.

**Objection: "Why is ClawHQ more expensive than $19/mo alternatives?"**

> **Short answer (inline callout):**
> "Those $19 plans don't include AI. Add API costs ($20-60/mo), and you're paying $40-80/mo total — with two providers, two bills, and API keys to juggle. ClawHQ starts at $59/mo all-in. One provider. One bill. Everything included."
>
> **Extended answer (FAQ):**
> "Most alternatives advertise low hosting prices but require you to bring your own AI API keys (BYOK). That means you pay their hosting fee *plus* $20-60/mo separately for AI model access through providers like OpenAI or Anthropic. You manage two accounts, two billing cycles, and deal with API key rotation and rate limits from a third party. ClawHQ includes AI models on every plan — no external API keys, no separate bills, no usage surprises. When you compare total cost, ClawHQ is competitive with or cheaper than most alternatives."

**Objection: "Why no free trial?"**

> **Short answer (inline callout):**
> "We don't hide anything behind a signup wall. Every spec, every feature, every limitation is on this page. You know exactly what you're getting before you pay."
>
> **Extended answer (FAQ):**
> "Instead of giving you 5 days to rush-test a half-configured setup, we give you full transparency upfront. This page shows you the exact VPS specs, the exact AI models, every supported channel, dashboard screenshots, and honest feature breakdowns for every tier. We provision a dedicated VPS for each customer — that costs us real money from minute one. A free trial on dedicated infrastructure means we'd eat significant costs on every tire-kicker. Instead, we invest that cost into giving paying customers better specs and faster setup. What you see on this page is exactly what you get within 24 hours of subscribing."

**Objection: "Why should I trust a new brand?"**

> **Short answer (inline callout):**
> "We publish our exact specs, we show you what's running, and we don't hide behind vague promises. The tech speaks for itself."
>
> **Extended answer (FAQ):**
> "Every hosting provider started somewhere. What matters is what we deliver, and we make that verifiable. Your VPS specs are real and measurable — run your own benchmarks. Your AI models are real and testable — we tell you exactly which models you get. Your dashboard is real — we show screenshots and feature lists before you pay. We don't ask for trust based on logos or testimonials. We ask for trust based on transparency. And once you're a customer, you can see everything running on your dedicated instance through the full OpenClaw dashboard."

---

#### 4. "ALL-INCLUSIVE" MESSAGING — No Hidden Costs

This messaging should permeate the landing page, not live in a single section. Copy blocks for various locations:

**Hero area (near main headline or subtitle):**
"Hosting + AI models + 8 channels + dashboard + managed updates. One price. No API keys. No hidden fees."

**Near pricing cards (as a banner or label):**
"All-inclusive pricing — what you see is what you pay. No separate AI costs. No channel fees. No overage charges."

**Pricing card footnote:**
"This price includes everything: dedicated VPS, bundled AI models, all messaging channels, full dashboard, managed setup, updates, backups, and crash recovery. There are no additional fees."

**Cost breakdown callout (place near or within the pricing section):**

> **What "all-inclusive" actually means:**
> - Dedicated VPS hosting — included
> - AI model access — included
> - WhatsApp, Telegram, Discord, Slack, Signal, Teams, Email, Web — included
> - Full management dashboard — included
> - Managed setup (under 24 hours) — included
> - Automatic updates — included
> - Daily backups — included
> - Crash recovery with auto-restart — included
> - Separate API bill — **there isn't one**

**Comparison callout (sticky or repeated):**

> **The hidden math of "cheap" hosting:**
> Typical alternative: $24/mo hosting + $30-50/mo AI API + your time managing two providers = $54-74/mo + hassle.
> ClawHQ: $59/mo. Everything. Done.

---

#### 5. SUGGESTED HEADLINES FOR POSITIONING SECTIONS

**"Why ClawHQ" section header options:**
1. "Why ClawHQ?" — simple, direct, works as a section anchor
2. "Built different. Priced honestly." — positions against the BYOK bait-and-switch
3. "Everything you need. One price." — all-inclusive positioning

**Recommended: "Why ClawHQ?"** — clean, lets the differentiators do the talking.

**Comparison table section header options:**
1. "ClawHQ vs. the alternatives" — neutral, factual
2. "What you get vs. what you'd get elsewhere" — frames ClawHQ as the better deal
3. "Stop paying for hosting and AI separately" — action-oriented, addresses the core pain

**Recommended: "ClawHQ vs. the alternatives"** — professional, non-aggressive.

**All-inclusive messaging section header options (if standalone section):**
1. "One price. No surprises." — trust-building
2. "All-inclusive means all-inclusive" — reinforcement
3. "What's included in every plan" — functional, clear

**Recommended: "One price. No surprises."** — short, memorable, trust-oriented.

**FAQ section header options:**
1. "Questions? Straight answers." — matches the brutalist, no-BS tone
2. "FAQ" — functional, expected, scannable
3. "Before you ask" — slightly more personality

**Recommended: "Questions? Straight answers."** — aligns with the brand tone.

---

#### 6. WHAT NOT TO SAY — Claims to Avoid

**Do not claim:**
- "Cheapest OpenClaw hosting" — we are not the cheapest. $59 is mid-to-premium tier. Do not invite a price war.
- "Unlimited AI usage" or "unlimited models" — we have soft rate limits. Saying "unlimited" creates chargeback/refund disputes.
- "99.9% uptime" or any specific uptime SLA — we do not have the monitoring infrastructure to guarantee this yet.
- "Enterprise-grade security" — unless we've done a security audit, this is an empty claim. Say "managed and monitored" instead.
- "500+ models" or any large model count — we bundle a curated set of models, not a catalog. Do not compete on model quantity.
- "The best OpenClaw hosting" or "#1 OpenClaw provider" — unsubstantiated superlatives damage trust for a new brand.
- "Revolutionary" / "game-changing" / "next-gen" — empty hype words. The brutalist design language rejects this. Be factual.
- "Replace [competitor name]" or "better than [competitor]" — never name competitors. Use "other providers" or "typical alternatives."
- "Free" anything — unless we actually offer it. Say "included" not "free" for bundled items.
- "No limits" or "no restrictions" — we have context caps (128K on Starter) and soft rate limits. Be honest.

**Do not expose:**
- Backend provider names (any cloud/VPS provider, any AI model serving infrastructure, any API provider)
- How models are served or routed internally
- Specific server locations unless certain and committed
- Internal cost structure or margins
- That Tier 2 is "coming soon" in a way that undermines confidence — frame as "launching [month]" or "pre-book now"

**Do not use these tones:**
- Desperation: "We're new but please give us a chance" — position from strength
- Aggression toward competitors: "Others are ripping you off" — let the comparison table speak
- Over-promising: "Your AI agents will transform your business" — we provide infrastructure, not business results

---

#### 7. TRUST SIGNALS — Building Credibility Without Social Proof

Since ClawHQ is a new brand with no testimonials yet, trust must come from transparency and verifiable claims.

**Technical transparency (this IS our social proof for now):**
- Publish exact VPS specs for each tier (vCPU, RAM, storage, bandwidth) — verifiable after purchase
- Publish exact AI model names (Kimi K2.5, MiniMax M2.5, etc.) — customers can verify these are real, capable models
- Show dashboard screenshots (real ones, not mockups) — proves the product exists and works
- Show channel integration screenshots — proves multi-channel actually works
- Show the OpenClaw dashboard itself — customers know what OpenClaw looks like, builds recognition and trust

**Operational transparency:**
- "Setup within 24 hours" — specific, measurable commitment
- "Docker-based deployment with auto-restart" — signals engineering competence without revealing infrastructure details
- "Managed updates and daily backups" — standard but important to state explicitly
- "Dedicated VPS — your resources are not shared with other customers" — verifiable, differentiating

**Pricing transparency:**
- Show the total-cost comparison (ClawHQ vs hosting + separate API costs) — strongest trust signal because it shows we acknowledge the competitive landscape
- "No hidden fees" with an explicit list of what is included — specificity builds trust
- Show both monthly and annual pricing with the savings — straightforward, no dark patterns

**Brand signals (even without testimonials):**
- Professional domain (clawhq.tech) and dashboard subdomain (app.clawhq.tech) — signals permanence
- Real support channels (dashboard tickets + email) — not just a Discord link
- A scheduling link for Enterprise consultations — signals real people, not a faceless SaaS
- Consistent, well-designed landing page and dashboard — design quality signals product quality

**Future trust signals (add as soon as available):**
- Customer count ("Trusted by X teams" — add when you hit 10+ customers)
- Uptime statistics (add when you have 30+ days of monitoring data)
- Customer testimonials (add when you get first 3-5 happy customers)
- "As seen on" press mentions (add if/when covered by tech blogs)
- Status page link (add when uptime monitoring is in place)

**Trust-building copy to use now:**
- "Full transparency. No lock-in. No hidden costs. See exactly what you get before you pay."
- "We publish our specs because we stand behind them."
- "Real infrastructure. Real models. Real dashboard. See for yourself."
- Do NOT say "trust us" — say "verify it yourself." That is the brutalist trust approach.

---

### 4.4 User Journey / How-It-Works Planner
**AGENT PROMPT:**

You are a user journey planner for ClawHQ (managed OpenClaw hosting SaaS). Your job is to design the "How It Works" section and map the complete user journey for the landing page.

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (setup process, launch plan)
- `d:\openclaw\CLAWHQ_TECHNICAL.md` (provisioning pipeline, onboarding flow)
- `d:\openclaw\dashboard\src\app\(auth)\register\page.tsx` (registration page)
- `d:\openclaw\dashboard\src\app\(auth)\login\page.tsx` (login page)
- `d:\openclaw\dashboard\src\app\dashboard\page.tsx` (dashboard home/overview)
- `d:\openclaw\dashboard\src\components\dashboard\app-sidebar.tsx` (sidebar — full navigation)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read completed sections for style reference)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details (Hostinger, provisioning scripts, SSH).
- Focus on the USER's experience, not the internal process.

Write your content BELOW this prompt section. Include:
1. "How It Works" section — 3-5 step flow (e.g., Choose Plan → We Set Up → Connect Channels → Start Using)
2. Per-step copy — headline, description, visual suggestion for each step
3. Time-to-value messaging — "Live in 24 hours" emphasis
4. Post-signup journey — what the user sees after paying (dashboard overview, VPS status, channel setup)
5. Upgrade journey — how upgrading works (instant, no migration, no data loss)
6. Visual/animation suggestions for the How It Works section (step indicators, progress animation, before/after)
7. Landing page scroll journey — recommended order of sections as the user scrolls down the page
8. CTA placement strategy — where to place CTAs throughout the page for maximum conversion

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

### 4.5 Trust & Social Proof Strategist
**AGENT PROMPT:**

You are a trust and social proof strategist for ClawHQ (managed OpenClaw hosting SaaS). ClawHQ is a NEW brand with NO existing customers, NO testimonials, and NO press coverage yet. Your job is to design trust-building content for the landing page that compensates for this.

Read these files for context:
- `d:\openclaw\CLAWHQ_BUSINESS.md` (business plan, competitive positioning)
- `d:\openclaw\CLAWHQ_TECHNICAL.md` (technical architecture, what's actually built)
- `d:\openclaw\MARKET_ANALYSIS.md` (competitor analysis)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read section 4.3 — competitive positioning already has trust signals outlined)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details.
- DO NOT fabricate testimonials, customer counts, or logos. Everything must be REAL or clearly marked as placeholder.
- Trust approach: "verify it yourself" not "trust us." Brutalist transparency.

Write your content BELOW this prompt section. Include:
1. Trust strategy for a new brand — how to build credibility without testimonials
2. Transparency-as-trust content — exact specs published, real screenshots, verifiable claims
3. "What you see is what you get" section copy — full transparency on every tier
4. Technical credibility signals — what to show that proves engineering competence
5. Future-proofing placeholders — where to add testimonials, customer count, uptime stats later
6. FAQ entries that build trust (refund policy, data ownership, what happens if ClawHQ shuts down, etc.)
7. Security and data messaging — what to say about data handling without over-promising
8. Support messaging — how to position dashboard tickets + email as reliable support
9. Headline suggestions for a trust/transparency section

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

### 4.6 Animation & Demo Content Planner
**AGENT PROMPT:**

You are an animation and demo content planner for ClawHQ (managed OpenClaw hosting SaaS). Your job is to plan what animations, demos, interactive elements, and visual content should appear on the landing page. You do NOT write code — you describe what should be built and where.

Read these files for context:
- `d:\openclaw\tasks\LANDING_PAGE_DESIGN_SPEC.md` (all 9 reference website design patterns — animations, interactions, layouts)
- `d:\openclaw\tasks\LANDING_PAGE_CONTENT_PLAN.md` (read ALL completed sections — many already have visual suggestions per feature)
- `d:\openclaw\CLAWHQ_BUSINESS.md` (product overview)

RULES:
- All tiers are LIVE. No "Coming Soon" anywhere.
- NEVER expose backend details in any demo content.
- Design spec uses: Linear Dark color system, Geist font + JetBrains Mono, brutalist sharp corners, near-black background.
- Reference designs include: Replicate scroll animations, Groq speed demo, Linear dark layering, Resend code/email previews, Neon sticky nav, Stripe gradient cards, Render zoom icons, Supabase hover interactions + tabbed dashboard, Claude tab toggle.

Write your content BELOW this prompt section. Include:
1. Hero section animation plan — what animates on load, what the user sees first
2. Per-section animation map — for each landing page section, what animation/interaction pattern to use (reference the design spec patterns by number)
3. Dashboard demo strategy — should we show a live demo, video, animated mockup, or static screenshots?
4. Code snippet demos — where to show code (API examples, webhook setup, etc.) and how to animate them
5. Scroll-triggered animations — what happens as the user scrolls (fade-in, parallax, sticky elements, etc.)
6. Interactive elements — tabs, toggles, hover effects, click-to-expand (reference Supabase pattern 8, Claude pattern 9)
7. Performance considerations — which animations are lightweight vs heavy, mobile fallbacks
8. Animation priority list — rank animations by impact vs effort, recommend which to build first vs last
9. Sticky navigation plan — section index that appears/disappears as you scroll (reference Neon pattern 5, Stripe pattern 6)

**CONTENT GOES BELOW THIS LINE:**

(pending)

---

