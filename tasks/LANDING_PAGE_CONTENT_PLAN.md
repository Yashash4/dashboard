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

#### 1. COMPLETE LIST OF SUPPORTED CHANNELS

ClawHQ supports **7 messaging channels** on every plan — no add-on fees, no per-channel pricing. All channels are available from day one.

| # | Channel | Setup Type | What the User Does | Credentials Required |
|---|---------|-----------|--------------------|--------------------|
| 1 | **Telegram** | Self-service | Paste bot token from @BotFather | Bot Token |
| 2 | **Discord** | Self-service | Paste bot token from Discord Developer Portal | Bot Token |
| 3 | **Slack** | Self-service | Paste App Token (xapp-...) and Bot Token (xoxb-...) | App Token + Bot Token |
| 4 | **Microsoft Teams** | Self-service | Enter Azure Bot App ID, App Password, and Tenant ID | App ID + App Password + Tenant ID |
| 5 | **Webchat** | Self-service | One-click enable — no credentials needed | None |
| 6 | **WhatsApp** | Admin-assisted | User requests setup via support ticket; QR code pairing handled server-side | QR code pairing (handled by ClawHQ team) |
| 7 | **Signal** | Admin-assisted | User requests setup via support ticket; phone number registration handled server-side | Phone registration (handled by ClawHQ team) |

**Key fact:** 5 of 7 channels are fully self-service from the dashboard. The remaining 2 (WhatsApp, Signal) require a one-time setup by the ClawHQ team due to platform-specific pairing requirements.

---

#### 2. PER-CHANNEL SETUP FLOW — WHAT THE USER DOES

**Self-Service Channels (Telegram, Discord, Slack, Teams, Webchat):**

1. User navigates to the **Channels** page in the dashboard
2. Under "Connect Channel," clicks the platform icon (Telegram, Discord, Slack, Teams, or Webchat)
3. A setup wizard opens with labeled credential fields and placeholder hints (e.g., "Token from @BotFather (e.g. 123456:ABC-DEF...)")
4. User pastes their credentials and clicks **Connect**
5. ClawHQ writes the channel configuration to their dedicated instance in real time
6. Channel status flips to **Connected** with a green badge and timestamp
7. The AI assistant immediately starts receiving messages on that platform

**Webchat (zero-config):**
- Click "Webchat" → click Connect → done. No tokens, no credentials. Webchat is enabled on the instance instantly.

**Admin-Assisted Channels (WhatsApp, Signal):**

1. User sees these channels under a "Requires Setup" section with a clear explanation
2. Clicks **"Request Setup"** — this creates a support ticket automatically
3. The ClawHQ team handles the platform-specific pairing (QR code for WhatsApp, phone registration for Signal)
4. Once connected, the channel appears in the user's dashboard with "Connected" status
5. User can disconnect and reconnect via the dashboard after initial setup

**Disconnecting Any Channel:**
- Click **Disconnect** on any connected channel card
- Confirmation dialog appears: "This will disable the channel on your instance. You can reconnect it anytime."
- Channel is disabled on the instance and removed from the dashboard
- Credentials are securely deleted

---

#### 3. HEALTH CHECK & STATUS MONITORING

Every connected channel has built-in health monitoring:

- **Health Status Indicators:** Each channel card shows a colored dot — green (healthy), yellow (degraded), or red (unhealthy) — with an optional error message
- **On-Demand Health Check:** A "Check Health" button in the Channels header runs a health check across all connected channels simultaneously and updates statuses in real time
- **Last Checked Timestamp:** Each channel shows when its health was last verified
- **Connection Status Badges:** Three states displayed with distinct colors and icons:
  - **Connected** (green) — channel is active and receiving messages
  - **Pending** (yellow) — setup in progress
  - **Disconnected** (gray) — channel is disabled

**What this means for the landing page:** Users never have to guess if their channels are working. One click tells them the status of every connected platform.

---

#### 4. KEY SELLING POINTS FOR LANDING PAGE

**Point 1: All 7 Channels Included on Every Plan**
- Headline: "Every channel. Every plan. No upgrades required."
- Copy: "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — all included from Starter to Enterprise. No channel add-on fees. No per-platform pricing. Connect them all on day one."

**Point 2: Self-Service in Under 60 Seconds**
- Headline: "Paste a token. Click connect. Done."
- Copy: "Five channels are fully self-service. Open the dashboard, paste your bot token, and your AI assistant starts responding on that platform immediately. No config files. No command line. No waiting."

**Point 3: No Extra Fees — Ever**
- Headline: "7 channels. $0 extra."
- Copy: "Competitors charge per channel or gate popular platforms behind higher tiers. ClawHQ includes every supported channel on every plan. WhatsApp on Starter? Yes. Teams on Starter? Yes. All of them."

**Point 4: Built-In Health Monitoring**
- Headline: "Know your channels are working. Always."
- Copy: "Every connected channel shows live health status — healthy, degraded, or down. One-click health checks across all channels. No guessing, no silent failures."

**Point 5: Connect and Disconnect Freely**
- Headline: "Connect today. Disconnect tomorrow. Reconnect anytime."
- Copy: "Channels aren't locked in. Connect what you need, disconnect what you don't, reconnect when you change your mind. Full control from your dashboard."

---

#### 5. HEADLINE SUGGESTIONS FOR LANDING PAGE SECTION

**Recommended:** "Connect Everywhere. Manage from One Dashboard."

**Alternatives:**
- "7 Channels. Zero Add-Ons."
- "Your AI Assistant, on Every Platform."
- "One Dashboard. Every Messaging Platform."
- "WhatsApp. Telegram. Discord. Slack. Teams. Signal. Webchat. All Included."
- "Meet Your Customers Where They Already Are."

**Sub-headline (pair with any above):**
"Connect WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat — all included on every plan. Self-service setup in under a minute."

---

#### 6. VISUAL / ANIMATION SUGGESTIONS

**Visual 1: Channel Icon Grid**
A 7-icon grid showing all supported platforms with their logos/icons. On hover or stagger animation, each icon lights up with a green "connected" pulse. Clean dark background, minimal style. Communicates breadth at a glance.

**Visual 2: Connection Flow Animation**
Three-step animated sequence: (1) Select a channel icon (e.g., Telegram) → (2) Paste token into a clean input field → (3) Green checkmark appears with "Connected" badge. Total time shown: "< 60 seconds." Loop across different channels.

**Visual 3: Dashboard Channel Cards Preview**
Show a realistic screenshot/mockup of the Channels page with 3-4 channels connected (green badges, health dots, timestamps) and 2-3 available to connect below. Demonstrates that this is a real, working dashboard — not a mockup.

**Visual 4: Status Monitoring Display**
Animated health check: Show the "Check Health" button being clicked, a brief spinner, then all channels flipping to green "Healthy" dots one by one. Communicates reliability and monitoring.

**Visual 5: "All Plans" Comparison Bar**
A horizontal bar or badge strip showing: "Starter: 7 channels | Pro: 7 channels | Ultra: 7 channels | Enterprise: 7 channels" — reinforcing that channels are not tier-gated. Every plan gets everything.

**Visual 6: Platform Logo Ribbon**
A scrolling or static ribbon of platform logos (WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat) beneath the section headline. Simple, recognizable, trust-building.

---

#### 7. COMPETITOR COMPARISON

| Competitor | Channels Included | Extra Cost? | Self-Service Setup? |
|---|---|---|---|
| MyClaw.ai | 2-3 (varies by tier) | Higher tiers for more | Unknown |
| DockClaw | 1-2 (Telegram, Webchat) | Pro tier for others | No |
| RunMyClaw | 1 (Webchat only) | Contact sales | No |
| ClawTrust | 2-3 | Per-channel pricing | Partial |
| xCloud | 0 (BYOK/self-config) | Customer handles setup | N/A |
| ClawHosters | 2 | Higher tiers | No |
| KiloClaw | 1-2 | Add-on pricing | No |
| SimpleClaw | 1-2 | Higher tiers | No |
| **ClawHQ** | **7 (all plans)** | **$0 extra** | **Yes (5 of 7)** |

**Landing page copy for comparison:**
"Most managed hosting providers support 1 to 3 messaging channels — and lock the rest behind higher tiers or add-on fees. ClawHQ includes all 7 channels on every plan, starting at $59/month. Five are fully self-service from your dashboard. No upgrades needed. No per-channel billing. Connect everywhere from day one."

---

#### 8. FAQ ENTRIES

**Q: What messaging channels are supported?**
A: ClawHQ supports 7 channels: WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat. All are included on every plan at no extra cost.

**Q: Do I need to upgrade my plan to access more channels?**
A: No. Every channel is available on every plan — Starter, Pro, Ultra, and Enterprise. There are no channel add-ons or per-platform fees.

**Q: How do I connect a channel?**
A: For Telegram, Discord, Slack, Teams, and Webchat — go to Channels in your dashboard, click the platform, paste your credentials, and click Connect. It takes under a minute. For WhatsApp and Signal, click "Request Setup" and our team handles the one-time pairing for you.

**Q: Why do WhatsApp and Signal require setup assistance?**
A: WhatsApp requires QR code pairing and Signal requires phone number registration — both need to run directly on your server. Our team handles this one-time setup at no extra charge. After that, you manage the channel from your dashboard like any other.

**Q: Can I connect and disconnect channels freely?**
A: Yes. Connect any channel when you need it, disconnect it when you don't, and reconnect it anytime. There are no limits on how often you can change your channel configuration.

**Q: How do I know if my channels are working?**
A: Each connected channel shows a live health indicator (healthy, degraded, or unhealthy). You can also run an on-demand health check across all channels with one click from the Channels page.

**Q: Can I use multiple channels at the same time?**
A: Yes. Connect as many channels as you want simultaneously. Your AI assistant will respond on all of them — WhatsApp, Telegram, Discord, Slack, Teams, Signal, and Webchat can all be active at once.

**Q: What credentials do I need for each channel?**
A: Telegram needs a Bot Token (from @BotFather). Discord needs a Bot Token (from Developer Portal). Slack needs an App Token and Bot Token. Teams needs an Azure Bot App ID, App Password, and Tenant ID. Webchat needs nothing — it's one-click. WhatsApp and Signal are set up by our team.

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

#### 1. HOW THE AGENT STORE WORKS

The Agent Store is a built-in marketplace inside the ClawHQ dashboard where users browse, acquire, and deploy AI agents to their dedicated instance. There are two types of agents:

**Free Agents:**
- Available to all plans at no extra cost
- One-click "Add to Library" -- instantly added to the user's agent library
- Can be deployed to the instance immediately after adding

**Premium Agents:**
- Built by the ClawHQ team -- expert-crafted configurations for specific use cases
- One-time purchase (not recurring) -- buy once, use forever
- Payment handled inline via the dashboard (no redirect, no separate checkout)
- After purchase, the agent appears in the user's library ready for deployment

**Store Features (from codebase):**
- Category filtering -- agents are organized by category (e.g. customer support, sales, scheduling, research). Users can filter by category or browse "All"
- Each agent card shows: name, description, category tag, price (or "Free"), and a "Premium" badge for paid agents
- Owned agents show a green "Owned" badge -- no duplicate purchases
- The store is accessible from the Agents page via a "Browse Store" button, and from the sidebar

---

#### 2. AGENT DEPLOYMENT FLOW

What happens when a user deploys an agent from their library:

**Step 1: User clicks "Deploy" on an agent card**
- The agent card shows a rocket icon with the "Deploy" button
- A confirmation dialog appears: "This will install the agent on your instance and restart the service. The agent will be live and ready to handle messages."

**Step 2: Agent is installed on the user's dedicated server**
- The agent's configuration files are written to the instance automatically
- The service restarts to pick up the new agent
- The entire process takes seconds -- no manual steps required

**Step 3: Agent goes live**
- The agent card updates with a green "Deployed" badge and the deployment date
- The agent is immediately available for conversations via Agent Chat and connected messaging channels
- Usage analytics begin tracking the agent's messages, response times, and errors

**Undeploying:**
- One-click "Undeploy" button on any deployed agent
- Confirmation dialog: "This will remove the agent from your instance. You can re-deploy it anytime."
- Agent files are removed, service restarts, agent is deactivated
- The agent stays in the user's library -- re-deploy anytime without re-purchasing

**Key detail: Config Editor**
- Every agent has an inline configuration editor (gear icon on each agent card)
- Users can customize agent prompts, add knowledge base files, and modify config fields
- Changes apply immediately to deployed agents -- saved and pushed to the running instance
- "Reset to Default" option restores the original expert-crafted configuration
- This means even premium agents are fully customizable after purchase

---

#### 3. AGENT CHAT FEATURE

The Agent Chat page is a full messaging interface built into the dashboard for chatting with deployed agents directly:

**Interface:**
- Left panel: list of all deployed agents with selection
- Right panel: full chat interface with the selected agent
- Markdown-rendered responses (code blocks, bold, lists, links)
- Message history persisted -- pick up conversations where you left off
- Timestamps on every message

**Built-in Slash Commands:**
- `/new` -- start a fresh conversation session
- `/clear` -- clear all chat history
- `/compact` -- summarize the conversation and continue in a compressed session (saves context)
- `/help` -- show all available commands
- `/status` -- check agent and connection health in real time
- `/retry` -- retry the last message if it failed

**Why this matters for the landing page:**
- Users can test and interact with agents before connecting them to external channels
- No need for WhatsApp/Telegram/etc. to start using agents -- the dashboard chat works immediately
- The chat interface works like a modern messaging app: Enter to send, Shift+Enter for new line, auto-scroll, loading indicators

---

#### 4. PREMIUM VS FREE AGENTS

| Aspect | Free Agents | Premium Agents |
|---|---|---|
| Price | $0 | One-time purchase (varies per agent) |
| Built by | ClawHQ team + community | ClawHQ team (expert-crafted) |
| Quality | Functional, general-purpose | Domain-specific, production-tested |
| Customizable | Yes (full config editor) | Yes (full config editor) |
| Deploy/Undeploy | One-click | One-click |
| Re-deployable | Unlimited | Unlimited (buy once, deploy forever) |

**What makes premium agents worth paying for:**
- Expert prompt engineering tuned for specific business use cases
- Pre-configured with optimal settings, knowledge structures, and conversation flows
- Tested and validated by the ClawHQ team before listing
- The config files are fully visible (not obfuscated) -- the value is in the expertise, not secrecy
- Users can also build their own agents freely through the OpenClaw dashboard

---

#### 5. KEY SELLING POINTS FOR LANDING PAGE

**Point 1: One-Click Agent Deployment**
- Headline: "Deploy AI agents in one click."
- Copy: "Browse the Agent Store, pick an agent, click Deploy. It's live on your instance in seconds. No configuration files to edit. No command line. No restarts to manage. Just click and it works."

**Point 2: Built-In Agent Marketplace**
- Headline: "An app store for AI agents."
- Copy: "Free and premium agents built by experts, ready to deploy. Customer support bots, sales assistants, scheduling agents, research tools -- browse by category, add to your library, deploy when ready."

**Point 3: Fully Customizable**
- Headline: "Every agent is yours to customize."
- Copy: "Edit prompts, add knowledge files, tweak configurations -- all from an inline editor in your dashboard. Even premium agents are fully customizable after purchase. Reset to defaults anytime."

**Point 4: Chat With Your Agents From the Dashboard**
- Headline: "Talk to your agents before anyone else does."
- Copy: "Built-in chat interface lets you test, debug, and interact with every deployed agent. Slash commands, conversation history, markdown responses. No external tools needed."

**Point 5: No Coding Required**
- Headline: "Your agent team. Zero code."
- Copy: "Browse. Buy. Deploy. Chat. Customize. Undeploy. Re-deploy. The entire agent lifecycle managed from a visual dashboard. If you can click a button, you can run AI agents."

**Point 6: Buy Once, Deploy Forever**
- Headline: "Premium agents are one-time purchases."
- Copy: "No recurring agent fees. No per-message charges. Buy a premium agent once and deploy it as many times as you want. Undeploy and re-deploy freely -- it's yours."

---

#### 6. HEADLINE SUGGESTIONS FOR LANDING PAGE

**Recommended:** "Your AI Agent Marketplace. Browse. Deploy. Done."

**Alternatives:**
- "AI Agents. One Click Away."
- "An App Store for AI Agents."
- "Deploy Expert-Built AI Agents in Seconds."
- "Browse. Deploy. Chat. No Code Required."
- "Your Agent Team Starts Here."

**Sub-headline options:**
- "Free and premium agents built by experts. Deploy to your dedicated instance in one click. Customize everything."
- "Browse agents by category, deploy with one click, chat from your dashboard. No coding. No configuration."

---

#### 7. VISUAL / ANIMATION SUGGESTIONS

**Visual 1: Agent Store Grid**
Show a 3-column grid of agent cards in the dark brutalist UI. Each card shows: agent name, bot icon, category tag, description snippet, price (or "Free" in green), and a "Premium" sparkle badge on paid agents. One card has a green border and "Owned" badge. Animate: cards fading in one by one on scroll.

**Visual 2: One-Click Deploy Sequence**
Three-frame animation: (1) User clicks "Deploy" button on an agent card with rocket icon -> (2) Confirmation dialog appears with the message "This will install the agent on your instance" -> (3) Card updates with green "Deployed" badge and date. Total elapsed time shown: "3 seconds." Keep it snappy and satisfying.

**Visual 3: Agent Chat Interface Preview**
Show the split-panel chat UI: left side with a list of 3-4 deployed agents (names highlighted), right side showing a conversation with markdown-rendered responses, timestamps, and the input bar at the bottom. Show one agent selected, a few message bubbles exchanged, and the "Thinking..." loader for the current response. This demonstrates the product feels like a real messaging app.

**Visual 4: Config Editor Modal**
Show the agent configuration editor dialog: agent name at the top, "System Prompt" textarea with sample prompt text, additional config fields below, "Add Config File" input at the bottom, and "Save Configuration" / "Reset to Default" buttons. Demonstrates that agents are not black boxes -- users have full control.

**Visual 5: Agent Lifecycle Flow**
Horizontal flow diagram: "Browse Store" -> "Add to Library" -> "Deploy" -> "Chat & Test" -> "Connect to Channels" -> "Customize" (loops back). Each step is an icon with a label. Arrows connect them. The "Customize" step has a circular arrow indicating the iterative nature. Clean, minimal, monochrome with accent color highlights on the active step.

**Visual 6: Free vs Premium Comparison**
Side-by-side comparison: left card labeled "Free Agent" (green "Free" price, "Add to Library" button), right card labeled "Premium Agent" (dollar price, "Premium" sparkle badge, "Buy for $X" button with cart icon). Both show the same structure -- name, category, description -- but the premium card has a subtle glow or accent border. Below both: "Both fully customizable. Both one-click deploy."

**Visual 7: Analytics Dashboard Preview**
Show the Usage Analytics component: four stat cards at the top (Messages, Avg Response, Errors, Error Rate), a line chart showing messages per day, and a per-agent breakdown table. Animate: numbers counting up, chart line drawing in. Caption: "Track every agent's performance in real time."

---

#### 8. ENTERPRISE ANGLE -- CUSTOM AGENT BUILDING SERVICE ($999+)

**Headline:** "Need agents built for your exact use case?"

**Copy:**
"Enterprise plans include custom agent development by the ClawHQ team. Tell us what you need -- customer support for your product, sales qualification for your pipeline, internal knowledge assistants for your team. We build it, deploy it, and maintain it. Starting at $999/month."

**What to show:**
- "Talk to Us" CTA button linking to a scheduling page
- Brief list of what custom agents can do: industry-specific workflows, custom integrations, specialized knowledge bases, multi-agent orchestration
- "1-on-1 call to understand your requirements" -- emphasize the white-glove nature
- No technical jargon -- focus on outcomes: "Tell us the problem. We build the agent."

**Pricing note for landing page:**
"Custom agents start at $999/month. Price scales with complexity. Includes dedicated infrastructure, priority support, and ongoing maintenance."

---

#### 9. FAQ ENTRIES ABOUT AGENTS

**Q: What agents are available?**
A: The Agent Store includes free and premium agents across categories like customer support, sales, scheduling, and research. New agents are added regularly. You can also build your own agents through the OpenClaw dashboard.

**Q: How do I deploy an agent?**
A: One click. Browse the Agent Store, add an agent to your library, then click "Deploy" on the Agents page. The agent is installed on your dedicated instance and ready to use in seconds.

**Q: Can I customize agents after purchase?**
A: Yes. Every agent -- free or premium -- has a full configuration editor. Edit prompts, add knowledge files, modify settings. You can always reset to the default configuration.

**Q: How do premium agents differ from free ones?**
A: Premium agents are expert-crafted by the ClawHQ team for specific business use cases. They come with optimized prompts, pre-configured settings, and tested conversation flows. Free agents are general-purpose and functional but less specialized.

**Q: Are premium agents a recurring cost?**
A: No. Premium agents are one-time purchases. Buy once, deploy as many times as you want. No recurring agent fees.

**Q: Can I undeploy an agent and re-deploy it later?**
A: Yes. Undeploying removes the agent from your instance but keeps it in your library. Re-deploy anytime with one click -- no re-purchase needed.

**Q: Can I chat with agents from the dashboard?**
A: Yes. The built-in Agent Chat lets you talk to any deployed agent directly from ClawHQ. Full chat interface with message history, slash commands, and markdown support.

**Q: Can I build my own agents?**
A: Yes. Every plan includes full OpenClaw dashboard access where you can create custom agents with your own prompts, skills, and configurations. The Agent Store is an addition, not a replacement.

**Q: How many agents can I deploy at once?**
A: There is no hard limit on the number of deployed agents. Your dedicated VPS resources determine practical capacity -- higher-tier plans with more CPU and RAM can handle more concurrent agents.

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

#### 1. VPS SPECS PER TIER

| Resource | Starter ($59) | Pro ($129) | Ultra ($350) | Enterprise ($999+) |
|---|---|---|---|---|
| vCPU Cores | 2 (upgradable to 4) | 8 | 16 | Custom |
| RAM | 8 GB (upgradable to 16 GB) | 32 GB | 64 GB | Custom |
| NVMe Storage | 100 GB (upgradable to 200 GB) | 400 GB | 800 GB | Custom |
| Bandwidth | 8 TB (upgradable to 16 TB) | 32 TB | 64 TB | Custom |
| Instance Type | Dedicated | Dedicated | Dedicated | Dedicated |
| Auto-Restart | Yes | Yes | Yes | Yes |
| SSL Certificate | Included | Included | Included | Included |
| Custom Domain | Yes | Yes | Yes | Yes |

**Key distinction from competitors:** Every tier gets a fully dedicated VPS -- not a shared container, not a multi-tenant pod. Your instance runs on hardware that belongs to you alone.

**Upgrade path (Starter only):** Starter users can request resource upgrades (2x CPU, 2x RAM, 2x storage, 2x bandwidth) without changing tiers. This handles the "I need more power but don't need Pro tools" case.

---

#### 2. WHAT THE VPS DASHBOARD SHOWS

The VPS page is the operational heart of ClawHQ. Every user sees it. Here is what it displays:

**A. Server Controls (all tiers)**
- **Start** -- Boot your instance
- **Stop** -- Shut down your instance gracefully
- **Restart** -- Restart without losing configuration
- Status badge showing current state: Running (green), Stopped (gray), Restarting (yellow), Error (red)
- One-click actions with confirmation dialogs -- no accidental shutdowns

**B. Real-Time Resource Monitoring (all tiers)**
- **CPU Usage** -- Live percentage with chart history
- **RAM Usage** -- Used vs total (e.g., 3.2 GB / 8 GB) with percentage bar
- **Disk Usage** -- Used vs total (e.g., 24 GB / 100 GB) with percentage bar
- **Network Traffic** -- Bytes received and transmitted since boot
- All stats refresh automatically -- no manual page reloads

**C. Uptime Display (all tiers)**
- Shows how long the instance has been running without interruption
- Displayed as human-readable time (e.g., "14 days, 7 hours, 22 minutes")
- Resets on restart -- so users can verify their instance hasn't crashed

**D. Dashboard Password Manager (all tiers)**
- Change the password for the OpenClaw dashboard at any time
- No support ticket needed -- self-service from the ClawHQ dashboard

**E. SSL Certificate Status (all tiers)**
- Shows whether SSL is active and valid on the custom domain
- Green checkmark for healthy, warning icon if something needs attention

**F. Pro-Exclusive: Mission Control Upgrades**
- **Process List** -- View all running processes on the server with CPU and memory usage per process
- **Maintenance Tools** -- Advanced server maintenance operations
- Page title upgrades from "VPS" to "Mission Control" with description "Full control over your infrastructure"

---

#### 3. MANAGED INFRASTRUCTURE SELLING POINTS

These are the "zero DevOps" value propositions -- the things users do NOT have to do because ClawHQ handles them.

**Selling Point 1: Ready Within 24 Hours**
- Headline: "Sign up today. Running tomorrow."
- Copy: "Your dedicated instance is provisioned, configured, secured, and tested -- all within 24 hours of signup. DNS, SSL, reverse proxy, AI models, auto-restart policies -- everything is set up before you log in for the first time."

**Selling Point 2: Zero Maintenance**
- Headline: "You use it. We maintain it."
- Copy: "No server updates to install. No certificates to renew. No Docker containers to debug. No logs to parse at 3am. ClawHQ manages your infrastructure so you can focus on what your AI agents actually do."

**Selling Point 3: Auto-Restart on Crash**
- Headline: "Crashes happen. Downtime doesn't."
- Copy: "If your instance goes down for any reason -- process crash, memory spike, unexpected error -- it automatically restarts. No human intervention needed. No pager alerts. Your agents come back online on their own."

**Selling Point 4: Gateway Health Monitoring**
- Headline: "Always watching. Always running."
- Copy: "ClawHQ continuously monitors your gateway health with automated checks every 2 minutes. If the gateway becomes unresponsive, it triggers an automatic restart. You stay online. Your users never notice."

**Selling Point 5: Dedicated Resources, Not Shared**
- Headline: "Your server. Not a slice of someone else's."
- Copy: "Every ClawHQ plan runs on a dedicated VPS with guaranteed CPU, RAM, and storage. No noisy neighbors. No throttling because another customer is running a heavy workload. Your resources are yours."

**Selling Point 6: Daily Backups**
- Headline: "Your data, protected."
- Copy: "Managed backups ensure your agent configurations, knowledge base files, and conversation history are protected. If anything ever goes wrong, we restore -- you don't have to lift a finger."

---

#### 4. THE 12-STEP AUTOMATED PROVISIONING -- USER-FACING OUTCOME

**What the user sees:** "Your instance will be ready within 24 hours."

**What actually happens (described in user-friendly terms for the landing page):**

The "How It Works" section should present this as a seamless 4-step journey:

**Step 1: You Choose a Plan**
"Pick Starter, Pro, Ultra, or Enterprise. Monthly or annual. That's the only decision you make."

**Step 2: We Build Your Server**
"Within 24 hours, we provision a dedicated server, configure your AI models, set up SSL encryption, and run a full verification suite to make sure everything works."

**Step 3: You Get Your Dashboard**
"Log in to your ClawHQ dashboard at app.clawhq.tech. Your server controls, AI models, agent store, and channel integrations are all waiting for you."

**Step 4: Connect and Go**
"Connect your messaging channels -- WhatsApp, Telegram, Discord, Slack, and more. Your AI agents are live."

**Behind-the-scenes detail (for trust, not exposure):**
"Every instance goes through a 12-step automated setup and verification process before you ever see it. DNS configuration, security hardening, SSL certification, AI model configuration, reverse proxy setup, and end-to-end connectivity verification -- all automated, all tested."

**Landing page one-liner for this section:**
"12 automated steps. Zero manual work. Ready in 24 hours."

---

#### 5. HEADLINE SUGGESTIONS FOR THE INFRASTRUCTURE SECTION

**Recommended primary headline:**
"Your Dedicated Server. Fully Managed."

**Alternative headlines:**
- "Infrastructure That Just Works."
- "Dedicated Hardware. Zero DevOps."
- "Your Server. Our Problem."
- "Enterprise Infrastructure at Startup Prices."
- "No SSH. No Docker. No Headaches."
- "Built for You. Managed by Us."

**Recommended subheadline (pairs with primary):**
"Every plan runs on a dedicated VPS with guaranteed resources, automatic failover, SSL encryption, and 24/7 health monitoring. You never touch a terminal."

**Section tagline for the resource comparison:**
"More resources than any competitor at this price. And they're all yours."

---

#### 6. VISUAL / ANIMATION SUGGESTIONS

**Visual 1: Server Status Dashboard Mockup**
A dark-themed card showing: status badge ("Running" with green pulse), CPU bar at 23%, RAM bar at 41%, Disk bar at 18%, Network bytes counter. The status dot pulses gently to convey "alive." Animate: bars filling to their values on scroll-into-view, numbers counting up from zero.

**Visual 2: Resource Comparison Bars (Tier Comparison)**
Four horizontal bar groups (CPU, RAM, Storage, Bandwidth), each showing all four tiers side by side. Starter is the shortest bar, Enterprise extends to the edge with a "Custom" label. Animate: bars growing from left to right, staggered by tier, with the number appearing at the end of each bar.

- Starter: 2 vCPU / 8 GB / 100 GB / 8 TB -- short bars
- Pro: 8 vCPU / 32 GB / 400 GB / 32 TB -- medium bars
- Ultra: 16 vCPU / 64 GB / 800 GB / 64 TB -- long bars
- Enterprise: Custom -- full-width bars with gradient

**Visual 3: Uptime Indicator**
A simple counter in large monospace font showing "XX days, XX hours, XX minutes" counting up in real time. Place it next to a small green dot and the text "Instance Online." Animate: the minutes counter incrementing every 60 seconds on the actual page. Conveys reliability without saying a word.

**Visual 4: "What You Don't Have To Do" Checklist**
Two columns. Left column (crossed out, grayed, red X marks):
- Provision a server
- Install Docker
- Configure DNS records
- Generate SSL certificates
- Set up reverse proxy
- Configure auto-restart policies
- Monitor gateway health
- Manage server updates
- Debug container crashes
- Parse error logs

Right column (ClawHQ, green checkmarks):
- Sign up
- Done

**Visual 5: The 4-Step Setup Flow**
A horizontal timeline with 4 nodes: "Choose Plan" --> "We Build" --> "You Log In" --> "Go Live." Each node has a small icon (credit card, server, dashboard, rocket). The "We Build" node has a subtle loading/building animation. The timeline fills in from left to right on scroll.

**Visual 6: Dedicated vs Shared Comparison**
Split visual. Left side: a single server icon labeled "Your ClawHQ Instance" with a lock icon -- clean, isolated, full resources. Right side: a cramped server icon with 8 tiny user icons sharing it, labeled "Shared Hosting" -- cluttered, fighting for resources. No specific competitor names. The visual speaks for itself.

**Visual 7: Server Specs Card (Per-Tier)**
For each pricing card, include a small "hardware specs" section showing:
```
2 vCPU  |  8 GB RAM  |  100 GB NVMe  |  8 TB Transfer
```
Use a monospace font. Small, clean, technical. Shows transparency and confidence.

---

#### 7. COMPETITOR COMPARISON -- DEDICATED VPS vs SHARED HOSTING

**The core argument:** Most competitors run OpenClaw on shared infrastructure -- containers, pods, or multi-tenant servers where your performance depends on what other customers are doing. ClawHQ gives every customer a dedicated VPS.

| Feature | ClawHQ | Most Competitors |
|---|---|---|
| Instance type | Dedicated VPS | Shared container / multi-tenant |
| Guaranteed resources | Yes -- CPU, RAM, storage are yours | No -- "up to" limits, throttled under load |
| Noisy neighbor problem | None -- isolated server | Yes -- other tenants degrade performance |
| Custom domain + SSL | Included on all plans | Often paid add-on or not available |
| Auto-restart | Built in, automatic | Manual restart or support ticket |
| Server controls | Full start/stop/restart from dashboard | Limited or no control |
| Resource monitoring | Real-time CPU, RAM, disk, network | Basic or none |
| Gateway health checks | Automated every 2 minutes | Manual or none |
| Setup time | Under 24 hours | Minutes (shared) to days (dedicated) |
| Root access / SSH | No (managed for you) | Sometimes (unmanaged risk) |

**Resource specs vs competitors at similar price points:**

| Provider | Price | vCPU | RAM | Storage | Bandwidth | Type |
|---|---|---|---|---|---|---|
| xCloud | $24/mo + AI | 1-2 | 1-4 GB | 20-40 GB | Limited | Shared |
| ClawHosters | $19-59/mo | 1-2 | 2-8 GB | 25-100 GB | Limited | Shared |
| DockClaw | $19.99-49.99/mo | 1-2 | 2-4 GB | 20-50 GB | Limited | Shared |
| SimpleClaw | $20-49/mo | 1-2 | 2-4 GB | 20-50 GB | Limited | Shared |
| **ClawHQ Starter** | **$59/mo** | **2** | **8 GB** | **100 GB NVMe** | **8 TB** | **Dedicated** |
| **ClawHQ Pro** | **$129/mo** | **8** | **32 GB** | **400 GB NVMe** | **32 TB** | **Dedicated** |
| **ClawHQ Ultra** | **$350/mo** | **16** | **64 GB** | **800 GB NVMe** | **64 TB** | **Dedicated** |

**Landing page copy for this comparison:**
"Most OpenClaw hosts put you on shared infrastructure. You get 2 GB of RAM and a prayer that no one else on your server runs a heavy workload. ClawHQ gives you a dedicated server with 8 GB of RAM on the Starter plan alone -- more than most competitors offer on their highest tier. And it's all yours."

---

#### 8. FAQ ENTRIES ABOUT INFRASTRUCTURE

**Q: What kind of server do I get?**
A: Every plan runs on a fully dedicated VPS with NVMe storage. Starter gets 2 vCPU, 8 GB RAM, 100 GB NVMe, and 8 TB bandwidth. Pro gets 8 vCPU, 32 GB RAM, 400 GB NVMe, and 32 TB bandwidth. Ultra gets 16 vCPU, 64 GB RAM, 800 GB NVMe, and 64 TB bandwidth. Enterprise is fully custom.

**Q: Is this shared hosting?**
A: No. Every ClawHQ instance runs on a dedicated server. Your CPU, RAM, and storage are guaranteed and not shared with any other customer.

**Q: How long does setup take?**
A: Your instance is provisioned, configured, and verified within 24 hours of signup. Every setup goes through a 12-step automated process including DNS, SSL, AI model configuration, and end-to-end testing.

**Q: What happens if my server crashes?**
A: Your instance automatically restarts on crash. Additionally, automated health checks run every 2 minutes -- if the gateway becomes unresponsive, it triggers an automatic recovery. In most cases, downtime is measured in seconds, not minutes.

**Q: Do I need to manage the server myself?**
A: No. ClawHQ is fully managed. We handle provisioning, updates, security patches, SSL renewal, backups, and monitoring. You never need to open a terminal or write a single command.

**Q: Can I upgrade my server resources?**
A: Yes. Starter users can request resource upgrades (more CPU, RAM, storage, bandwidth) without changing plans. Or upgrade to Pro, Ultra, or Enterprise for significantly more resources plus additional features.

**Q: Do I get SSH access to my server?**
A: No, and that's intentional. SSH access is a security risk on managed infrastructure. Instead, you get full server controls (start, stop, restart), real-time monitoring, and log access through your ClawHQ dashboard. Everything you need, nothing you don't.

**Q: What uptime can I expect?**
A: ClawHQ instances are built for continuous operation with auto-restart policies, automated health checks, and gateway monitoring. While we don't publish an SLA percentage on standard plans, our infrastructure is designed for near-continuous uptime. Enterprise plans include custom SLA terms.

**Q: Can I use my own domain?**
A: Yes. Every plan supports custom domains with SSL included and automatically configured. You can also use a free ClawHQ subdomain (yourname.clawhq.tech).

**Q: Where are the servers located?**
A: Server locations are selected to optimize performance for your region. Contact us if you have specific geographic requirements -- Enterprise plans support custom server placement.

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

---

#### 1. MASTER FEATURE INVENTORY — Every Feature Across All Tiers

**Category A: Core Platform (All Plans -- Starter, Pro, Ultra, Enterprise)**

| # | Feature | Description |
|---|---------|-------------|
| A1 | Dedicated VPS Instance | Own server, not shared. Specs scale by tier. |
| A2 | Full VPS Controls Dashboard | Start, stop, restart from dashboard. Real-time CPU/RAM/disk/network charts, gateway health, logs, uptime display. |
| A3 | Bundled AI Models -- No API Keys | Kimi K2.5, MiniMax M2.5 + rotating model. Flat-rate usage, no per-token billing, no credit packs. |
| A4 | 7 Messaging Channels | WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat -- all included on every plan. 5 self-service, 2 admin-setup. Health checks per channel. |
| A5 | Agent Store & Deployment | Browse free + premium agents, one-click deploy/undeploy, config editor, usage analytics per agent. |
| A6 | Agent Chat | Chat with any deployed agent directly from the ClawHQ dashboard. |
| A7 | Full OpenClaw Dashboard Access | All skills, plugins, ClawHub. Custom domain with SSL. Changeable dashboard password. |
| A8 | Support Ticket System | Create tickets with priority levels, threaded conversations, status tracking (open/in-progress/resolved/closed). |
| A9 | Billing & Subscription Management | Plan details, billing cycle, payment history, upgrade/downgrade. Monthly or annual pricing. |
| A10 | Account Management | Profile, password changes, instance details display. |
| A11 | Managed Infrastructure / Zero DevOps | Automated provisioning, auto-restart on crash, managed updates, daily backups. Ready within 24 hours. |
| A12 | Custom Domain / Subdomain | Own domain or free subdomain. SSL included and auto-renewed. |

**Category B: Pro Tools (Pro, Ultra, Enterprise)**

| # | Feature | Description |
|---|---------|-------------|
| B1 | Logs Explorer | Real-time log viewer with search, severity filtering (error/warn/info/debug), auto-refresh every 5s, configurable line count (100-1000), downloadable logs, color-coded output. |
| B2 | Usage Analytics | Full analytics dashboard: messages over time, daily conversations, requests by hour, messages by agent, summary cards with period-over-period comparisons, 7/14/30-day range selector. |
| B3 | Knowledge Base (RAG) | Upload PDFs, TXT, CSV for agents to reference. File management with upload progress, search, status tracking, storage monitoring. |
| B4 | Webhooks | Create webhook endpoints for instance events (message.received, agent.deployed, vps.status_changed, channel events). Up to 10 endpoints. HTTPS-only with signing secrets. Retry failed deliveries. Delivery status tracking. |
| B5 | API Access | Direct API access to OpenClaw instance. Create/revoke up to 5 API keys. Usage counts, last-used timestamps. Code examples in cURL, Python, JavaScript, PowerShell. |
| B6 | Audit Log | Full activity log: searchable, filterable by category (user, server, settings, security, API, knowledge base, webhooks). Paginated table with actor, action, entity, IP address, timestamp. |
| B7 | Mission Control (Upgraded VPS) | VPS page upgrades from basic controls to full infrastructure view: running processes list, maintenance tools, enhanced monitoring with alerts. |
| B8 | OpenClaw Dashboard Embed | Full OpenClaw dashboard embedded inside ClawHQ with auto-login credentials banner. No tab switching. |
| B9 | Full Context Window | No 128K cap. Models use their native maximum context window. |
| B10 | Instant Model Switching | Change models instantly from dashboard. No waiting for next billing cycle. |
| B11 | 4x VPS Resources | 8 vCPU / 32 GB RAM / 400 GB NVMe / 32 TB bandwidth. |
| B12 | 5x Rate Limits | Five times the throughput of Starter. Built for production workloads. |
| B13 | Priority Support | Elevated support priority and faster response times. |

**Category C: Command Center (Ultra, Enterprise)**

| # | Feature | Description |
|---|---------|-------------|
| C1 | Mission Control Overview | Real-time command center: 5 metric cards (system health, active agents, tasks in progress, cost today, success rate). Agent roster with live status dots. Recent events feed. In-progress tasks. Active sessions with token/cost breakdowns. SSE streaming, 2-10s refresh. |
| C2 | Task Board (Kanban) | 7-column drag-and-drop Kanban: Planning, Inbox, Assigned, In Progress, Testing, Review, Done. Priority levels (low/medium/high/critical), agent assignment, subtask checklists with progress bars, due dates, estimated hours, comments, code reviews, activity history. |
| C3 | Agent Roster | Live operational view of every agent: 6 statuses (online/working/idle/blocked/sleeping/offline), capacity utilization bars, performance scores, current task display, deployed tools list, detail slide-out panel. 2-second refresh. |
| C4 | Live Events Feed | Real-time activity stream: 7 event types (webhook, tool invocation, error, task complete, agent state change, session start/end). 4 severity levels with color coding. Filterable, expandable with full JSON payload. 2-second polling. |
| C5 | Session Tracker | Token and cost analytics: active/total sessions, aggregate token counts, cumulative cost. Per-session breakdown (tokens in/out, cost, duration, success/failure). Execution Trace view with step-by-step action replay, per-step cost. 3-second refresh. |
| C6 | 8x VPS Resources | 16 vCPU / 64 GB RAM / 800 GB NVMe / 64 TB bandwidth. |

**Category D: Enterprise-Only ($999+)**

| # | Feature | Description |
|---|---------|-------------|
| D1 | Custom Agent Building | 1-on-1 call to understand requirements. Agents built to spec for your use case. |
| D2 | Custom Planner Agents | AI agents that plan and orchestrate other agents for complex workflows. |
| D3 | Custom Integrations & Workflows | Bespoke integrations with your existing tools and systems. |
| D4 | White-Glove Setup & Ongoing Support | Direct access, fastest response times, dedicated support. |
| D5 | Custom Infrastructure | VPS specs tailored to workload. No standard constraints. |

**Total unique features: 35** (12 core + 13 pro + 6 command center + 4 enterprise-only)

---

#### 2. LANDING PAGE FEATURE HIERARCHY -- What Deserves Its Own Section vs Bullet vs Mention

**Tier 1: Own dedicated landing page section (full visual + headline + description + animation)**

These are the features that sell ClawHQ. Each deserves a full visual block on the landing page:

1. **Bundled AI Models** (A3) -- THE primary differentiator. Deserves the biggest, most prominent feature section. Show the "no API keys, no credits, no separate bills" value prop with competitor cost comparison.
2. **All 7 Channels Included** (A4) -- Second biggest differentiator. Show the channel icon grid with "all included on every plan" messaging. Most competitors support 2-3 channels.
3. **Full Dashboard** (A2 + A5 + A6 + A7) -- Combine VPS controls, agent store, agent chat, and OpenClaw access into one "Your Dashboard" showcase section with a screenshot or animated walkthrough.
4. **Managed Infrastructure / Zero DevOps** (A11) -- Dedicated section showing the "you vs us" split: what you do (use your agents) vs what we handle (servers, updates, backups, crash recovery).
5. **Command Center** (C1-C5) -- Ultra's flagship. Deserves a premium showcase section showing the Mission Control overview, Kanban board, and real-time monitoring. This is the visual "wow" moment on the page.
6. **Pro Tools Suite** (B1-B6) -- Group all six Pro tools into one section with mini-cards or an interactive tabbed display showing Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log.

**Tier 2: Feature bullet points (inside pricing cards or comparison table)**

These are important but don't need their own landing page section. Show as bullet points on pricing cards:

- Dedicated VPS specs per tier (A1) -- specs in pricing cards
- Full context window (B9) -- bullet in Pro card
- Instant model switching (B10) -- bullet in Pro card
- 4x/8x VPS resources (B11, C6) -- bullet in Pro/Ultra cards
- 5x rate limits (B12) -- bullet in Pro card
- Priority support (B13) -- bullet in Pro card
- OpenClaw Dashboard Embed (B8) -- bullet in Pro card
- Custom domain/subdomain (A12) -- bullet in Starter card

**Tier 3: Mention only (comparison table rows or FAQ)**

These exist and matter, but don't sell the product by themselves:

- Support ticket system (A8) -- comparison table row
- Billing management (A9) -- assumed, not a selling point
- Account management (A10) -- assumed, not a selling point
- Enterprise custom features (D1-D5) -- live on the Enterprise card as "Talk to Us" bullets

---

#### 3. HERO FEATURES -- The 3-5 Features Front and Center Above the Fold

These are the features that should appear in or immediately below the hero section. They answer the visitor's first question: "What is this and why should I care?"

**Hero Feature 1: All-Inclusive AI -- No API Keys, No Extra Bills**
- This is the single most differentiating fact about ClawHQ. It should appear in the hero subtitle or as the first feature callout below the hero.
- Suggested hero subtitle: "AI models, hosting, all channels, and a full dashboard -- one price, everything included."
- Visual: model cards (Kimi K2.5, MiniMax M2.5) with a "Built In" badge, next to a crossed-out "API Key Required" label.

**Hero Feature 2: Dedicated Server -- Not Shared, Not Throttled**
- Immediately signals premium quality. Differentiates from shared hosting competitors.
- Suggested callout: "Your own dedicated server with guaranteed resources. Not shared. Not throttled."
- Visual: single server icon with a shield, contrasted against a grid of shared servers.

**Hero Feature 3: 7 Channels, Day One**
- Shows breadth of what the product does. Visitors instantly understand: "this connects my AI to WhatsApp, Telegram, Discord, etc."
- Suggested callout: "Connect to WhatsApp, Telegram, Discord, Slack, Teams, Signal, and Webchat -- all included."
- Visual: row of 7 channel icons with connecting lines to a central ClawHQ logo.

**Hero Feature 4: Live in 24 Hours**
- Speed-to-value. Compresses the gap between interest and usage.
- Suggested callout: "Choose your plan. We build it. You're live in 24 hours."
- Visual: timeline graphic -- Step 1: Subscribe, Step 2: We provision, Step 3: You're live.

**Hero Feature 5: Full Management Dashboard**
- Shows the product is not just hosting -- it's a platform.
- Suggested callout: "Control your VPS, manage agents, monitor performance -- all from one dashboard."
- Visual: dashboard screenshot showing the sidebar navigation with all features visible.

**Recommended above-the-fold layout:**
- Hero headline + subtitle + primary CTA
- Immediately below: 4 icon-stat blocks (AI Models Included / Dedicated VPS / 7 Channels / Live in 24h)
- Then: one large dashboard screenshot or animated preview

---

#### 4. FEATURE GROUPING STRATEGY -- How to Organize Features on the Landing Page

**Recommended approach: Group by VALUE THEME, not by tier.**

Grouping by tier creates a problem: visitors on a specific plan only read "their" section and skip the rest. Grouping by value theme ensures every visitor sees the full product story and understands what they're getting.

**Group 1: "Everything Included" (The All-Inclusive Value Prop)**
Features: A3 (bundled AI), A4 (all channels), A11 (managed infrastructure), A12 (custom domain)
Purpose: Establishes the core promise -- one price, everything works, no hidden costs.
Position: First feature section after the hero. This is the primary selling argument.

**Group 2: "Your Dashboard" (The Product Experience)**
Features: A2 (VPS controls), A5 (agent store), A6 (agent chat), A7 (OpenClaw dashboard), A8 (support), A9 (billing), A10 (account)
Purpose: Shows what the user actually interacts with daily. Proves the product is polished and functional.
Position: Second section. Show a dashboard walkthrough or interactive preview.

**Group 3: "Pro Tools" (Visibility & Integration)**
Features: B1-B6 (logs, analytics, knowledge base, webhooks, API access, audit log), B7 (mission control), B8 (embedded dashboard)
Purpose: Shows the upgrade path. Positions Pro as the "serious builder" tier.
Position: Third section. Interactive tabs or mini-cards for each tool.

**Group 4: "Command Center" (Orchestration at Scale)**
Features: C1-C5 (mission control overview, task board, agent roster, events, sessions)
Purpose: The visual wow-factor section. Shows Ultra as the "AI operations hub."
Position: Fourth section. Large animated preview of Mission Control.

**Group 5: "Enterprise" (Custom Everything)**
Features: D1-D5 (custom agents, planner agents, integrations, white-glove, custom infra)
Purpose: Signals "we scale with you" and captures high-value leads.
Position: Fifth section or integrated into pricing. "Talk to Us" CTA.

**Group 6: "Infrastructure" (Specs & Reliability)**
Features: A1 (dedicated VPS), B9 (full context), B10 (instant switching), B11/C6 (resource scaling), B12 (rate limits)
Purpose: Rational justification. The specs that back up the claims. Comparison bars and tables.
Position: Near or within the pricing section as a comparison matrix.

---

#### 5. FEATURES THAT SELL vs FEATURES THAT REASSURE

**Features That Sell (Drive Signups)**

These features create desire. They answer "why should I buy this?" and should be prominent, above-the-fold or in the first scroll.

| Feature | Why It Sells |
|---------|-------------|
| Bundled AI models (A3) | Eliminates the #1 cost and complexity issue -- no API keys, no separate bills, no credit systems |
| All 7 channels (A4) | Instant "I can use this everywhere" realization. Most competitors max out at 2-3 |
| Managed setup -- live in 24h (A11) | Speed-to-value. Visitor thinks "I could be using this tomorrow" |
| Full dashboard (A2) | Shows this is a real product, not a bare-bones hosting panel |
| Agent store (A5) | "I can browse and deploy agents without building them" -- lowers the barrier to value |
| Command Center (C1-C5) | Visual wow factor. This is the screenshot that makes someone say "I want that" |
| 4x/8x infrastructure (B11, C6) | Raw specs that justify the price upgrade. Numbers sell. |

**Features That Reassure (Prevent Objections)**

These features don't create desire on their own, but they prevent "but what about..." doubts. They belong in comparison tables, FAQ, and pricing card footnotes.

| Feature | What Objection It Addresses |
|---------|----------------------------|
| Auto-restart on crash (A11) | "What if it goes down?" -- it recovers automatically |
| Daily backups (A11) | "What if I lose data?" -- backed up daily |
| Custom domain + SSL (A12) | "Does it look professional?" -- yes, your own domain with SSL |
| Support ticket system (A8) | "What if I need help?" -- built-in support with priority tracking |
| Audit log (B6) | "Is there accountability?" -- every action tracked |
| OpenClaw dashboard access (A7) | "Can I see what's running?" -- full transparency, nothing hidden |
| BYOK supported | "What if I want my own models too?" -- yes, BYOK alongside bundled models |
| No hidden costs (all-inclusive) | "Are there surprise fees?" -- one price, that's it |
| Upgrade path (Starter to Enterprise) | "What if I outgrow this plan?" -- seamless upgrade, no migration headaches |

**Strategic implication:** Lead every section with a "sell" feature, then follow with "reassure" features. Never lead with reassurance -- it signals doubt.

---

#### 6. CROSS-TIER FEATURE COMPARISON MATRIX

This is the master table for the pricing section. Every row is a feature, every column is a tier. Use checkmarks, X marks, and specific values.

**Table title:** "Everything you get, at every tier"

| Feature | Starter $59 | Pro $129 | Ultra $350 | Enterprise $999+ |
|---------|:-----------:|:--------:|:----------:|:-----------------:|
| **Infrastructure** | | | | |
| Dedicated VPS | 2 vCPU / 8 GB / 100 GB / 8 TB | 8 vCPU / 32 GB / 400 GB / 32 TB | 16 vCPU / 64 GB / 800 GB / 64 TB | Custom |
| VPS Controls (start/stop/restart) | Yes | Yes | Yes | Yes |
| Real-time monitoring (CPU/RAM/disk) | Yes | Yes | Yes | Yes |
| Process list & maintenance tools | -- | Yes | Yes | Yes |
| Auto-restart on crash | Yes | Yes | Yes | Yes |
| Managed updates & backups | Yes | Yes | Yes | Yes |
| Custom domain + SSL | Yes | Yes | Yes | Yes |
| **AI Models** | | | | |
| Bundled AI models (no API keys) | Yes | Yes | Yes | Yes |
| Context window | 128K | Full (model max) | Full (model max) | Full (model max) |
| Model switching | 1 change/cycle | Instant | Instant | Instant |
| Rate limits | Standard | 5x | 10x | Custom |
| BYOK supported | Yes | Yes | Yes | Yes |
| **Channels** | | | | |
| WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat | All 7 | All 7 | All 7 | All 7 + custom |
| Channel health checks | Yes | Yes | Yes | Yes |
| **Agents** | | | | |
| Agent Store (free + premium) | Yes | Yes | Yes | Yes |
| One-click deploy/undeploy | Yes | Yes | Yes | Yes |
| Agent Chat | Yes | Yes | Yes | Yes |
| Custom agent building | -- | -- | -- | Yes |
| Custom planner agents | -- | -- | -- | Yes |
| **Dashboard** | | | | |
| ClawHQ Dashboard | Yes | Yes | Yes | Yes |
| OpenClaw Dashboard (external) | Yes | Yes | Yes | Yes |
| OpenClaw Dashboard (embedded) | -- | Yes | Yes | Yes |
| **Pro Tools** | | | | |
| Logs Explorer | -- | Yes | Yes | Yes |
| Usage Analytics | -- | Yes | Yes | Yes |
| Knowledge Base (RAG) | -- | Yes | Yes | Yes |
| Webhooks (up to 10 endpoints) | -- | Yes | Yes | Yes |
| API Access (up to 5 keys) | -- | Yes | Yes | Yes |
| Audit Log | -- | Yes | Yes | Yes |
| **Command Center** | | | | |
| Mission Control Overview | -- | -- | Yes | Yes |
| Task Board (7-column Kanban) | -- | -- | Yes | Yes |
| Agent Roster (real-time) | -- | -- | Yes | Yes |
| Live Events Feed | -- | -- | Yes | Yes |
| Session Tracker (token/cost) | -- | -- | Yes | Yes |
| Execution Trace Replay | -- | -- | Yes | Yes |
| **Support** | | | | |
| Dashboard tickets + email | Yes | Yes | Yes | Yes |
| Priority support | -- | Yes | Yes | Yes |
| White-glove support | -- | -- | -- | Yes |
| **Billing** | | | | |
| Monthly price | $59/mo | $129/mo | $350/mo | $999+/mo |
| Annual price | $599/yr | $1,299/yr | $3,499/yr | Custom |
| Annual savings | $109 saved | $249 saved | $701 saved | Custom |

---

#### 7. RECOMMENDED FEATURE SHOWCASE ORDER FOR THE LANDING PAGE

This is the optimal sequence for presenting features on the landing page, based on what sells first and what builds conviction progressively.

**Section 1: Hero + Core Value (above the fold)**
- Headline, subtitle, primary CTA
- 4 stat blocks: AI Models Included / Dedicated VPS / 7 Channels / Live in 24h
- One large dashboard screenshot or looping animation
- Why first: First impression. Must communicate "what this is" and "why it matters" in 3 seconds.

**Section 2: "Everything Included" -- The All-Inclusive Breakdown**
- AI models bundled (no API keys, no credits, no separate bills)
- All 7 channels on every plan
- Managed infrastructure -- we handle everything
- Cost comparison: "What you'd pay elsewhere" vs "What you pay with ClawHQ"
- Why second: This is the primary selling argument and the #1 differentiator. Address it immediately before skepticism sets in.

**Section 3: "Your Dashboard" -- Product Experience Showcase**
- Dashboard walkthrough (sidebar navigation visible showing all features)
- VPS controls preview (start/stop/restart + monitoring charts)
- Agent store + one-click deploy preview
- Agent chat preview
- Why third: Proves the product is real and polished. Moves from "what we say" to "what it looks like."

**Section 4: Pricing Cards**
- 4 cards: Starter / Pro / Ultra / Enterprise
- Monthly/annual toggle
- Feature bullets per card (selling points, not exhaustive lists)
- "Most Popular" badge on recommended plan
- Why fourth: Now that the visitor understands the product and value, show the price. Pricing before product explanation creates sticker shock.

**Section 5: Feature Comparison Matrix**
- Full cross-tier comparison table (from section 6 above)
- Place directly below pricing cards
- Serves visitors who want to compare before deciding
- Why fifth: Decision-support tool. Visitors who scroll past pricing want detail.

**Section 6: "Pro Tools" -- Visibility, Control, Integration**
- 6 mini-cards or tabbed display: Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log
- "Starter runs your agents. Pro runs your business." headline
- Why sixth: Upsell section. Shows what Pro adds for visitors considering the upgrade.

**Section 7: "Command Center" -- Ultra Showcase**
- Large animated preview of Mission Control
- Mini-features: Task Board, Agent Roster, Events, Sessions
- "From chatbot to command center." headline
- Why seventh: Premium showcase. Visually impressive but appeals to a smaller audience.

**Section 8: "Why ClawHQ" -- 6 Differentiators Grid**
- All-inclusive pricing / Dedicated infrastructure / AI models built in / 7 channels / Agent control / Fully managed
- Why eighth: Reinforcement section. By now the visitor has seen the product -- this section reminds them WHY ClawHQ over alternatives.

**Section 9: "How It Works" -- 3-Step Process**
- Step 1: Choose your plan
- Step 2: We set up your dedicated instance within 24 hours
- Step 3: Connect your channels and start using your agents
- Why ninth: Reduces friction. Shows the path from "interested" to "using it."

**Section 10: FAQ**
- 10-15 questions covering pricing, models, channels, setup, upgrades, refund policy, support
- Why tenth: Objection handling. Catches the remaining doubts before the final CTA.

**Section 11: Final CTA**
- Repeat the primary CTA with a strong closing line
- "Ready to stop juggling API keys and hosting bills?"
- [Get Started] button
- Why last: Conversion capture. Every section above has been building toward this moment.

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

#### 1. PRICING CARD LAYOUT — What Each Card Should Show

**General layout per card:** Plan name, badge (if any), monthly price, annual price toggle, tagline, 5-7 feature bullets, CTA button. All four cards displayed in a horizontal row on desktop, stacked on mobile.

---

**Card 1: Starter — $59/mo**

- **Badge:** None (or "Great for Starting" in subtle muted text — no colored badge, keep it neutral to push eyes toward Pro)
- **Price display:** "$59" large, "/mo" small. Below: "or $599/yr — save $109"
- **Tagline:** "All-inclusive. One price. Zero hassle."
- **Feature bullets:**
  1. 2 vCPU / 8 GB RAM / 100 GB NVMe
  2. AI models included — no API keys needed
  3. All messaging channels (WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat)
  4. Full OpenClaw dashboard access
  5. Agent Store — browse, deploy, chat
  6. Managed infrastructure — setup, updates, backups, crash recovery
  7. Support via dashboard tickets
- **CTA button:** "Get Started" (solid, standard style — not highlighted)
- **Below CTA (small text):** "Live in 24 hours"

---

**Card 2: Pro — $129/mo**

- **Badge:** "MOST POPULAR" (accent-colored badge, visible immediately)
- **Card treatment:** Visually elevated — slightly larger card, highlighted border or background accent, lifted shadow. This is the card the visitor's eye should land on first.
- **Price display:** "$129" large, "/mo" small. Below: "or $1,299/yr — save $249"
- **Tagline:** "For builders who ship."
- **Feature bullets:**
  1. 8 vCPU / 32 GB RAM / 400 GB NVMe — 4x Starter
  2. Full context windows — no 128K cap
  3. Instant model switching — change models in seconds
  4. Monitoring dashboard + logs + analytics
  5. API access — build custom integrations
  6. 5x rate limits + priority support
  7. Everything in Starter included
- **CTA button:** "Get Pro" (primary accent color, prominent)
- **Below CTA (small text):** "2 months free on annual"

---

**Card 3: Ultra — $350/mo**

- **Badge:** "MOST POWERFUL" (violet/purple accent badge)
- **Price display:** "$350" large, "/mo" small. Below: "or $3,499/yr — save $701"
- **Tagline:** "Command your AI workforce."
- **Feature bullets:**
  1. 16 vCPU / 64 GB RAM / 800 GB NVMe — 2x Pro
  2. Mission Control — real-time command center
  3. Drag-and-drop Task Board for AI agents
  4. Agent Roster with live status monitoring
  5. Session tracking — per-token and per-dollar cost analytics
  6. Live event feed + execution trace replay
  7. Everything in Pro included
- **CTA button:** "Go Ultra" (violet/purple accent)
- **Below CTA (small text):** "Full operational visibility"

---

**Card 4: Enterprise — $999+/mo**

- **Badge:** "WHITE GLOVE" (gold/amber accent badge)
- **Card treatment:** Distinct from the other three — dark card with gold border or inverted color scheme. Signals "this is different."
- **Price display:** "Custom" large. Below: "Starting at $999/mo"
- **Tagline:** "Built around your business."
- **Feature bullets:**
  1. Custom VPS specs — tailored to your workload
  2. Custom AI agents built for your use case
  3. Bespoke integrations and workflows
  4. Dedicated account manager
  5. 25x rate limits
  6. White-glove setup and ongoing support
  7. Everything in Ultra included
- **CTA button:** "Talk to Us" (gold/amber accent)
- **Below CTA:** "Book a call" — links to scheduling page

---

#### 2. MONTHLY / ANNUAL TOGGLE STRATEGY

**Toggle placement:** Centered above the four pricing cards. Simple pill toggle: "Monthly" | "Annual" with the active option highlighted.

**How to present savings:**

- When user selects "Annual," each card should show two things:
  - The annual total price (e.g., "$599/yr" for Starter)
  - A savings callout in green: "Save $109/yr" or "2 months free"

**Savings breakdown by tier:**

| Tier | Monthly | Annual | Savings | Messaging |
|---|---|---|---|---|
| Starter | $59/mo ($708/yr) | $599/yr | $109/yr | "Save $109" or "15% off" |
| Pro | $129/mo ($1,548/yr) | $1,299/yr | $249/yr | "Save $249" or "2 months free" |
| Ultra | $350/mo ($4,200/yr) | $3,499/yr | $701/yr | "Save $701" or "2 months free" |
| Enterprise | Custom | Custom | Custom | "Annual billing available" |

**Default selection:** Default the toggle to "Monthly." Annual savings feel more impressive when discovered, not when pre-selected. The visitor sees monthly pricing first (easier to process), then discovers annual savings as a bonus.

**Visual treatment on toggle:**
- When "Annual" is selected, animate a small "Save XX%" tag appearing next to each price.
- Use green text or a green pill for the savings amount — green signals "deal" universally.

**Copy near the toggle:**
"Pay annually. Save up to 17%. All plans billed as a single annual charge."

---

#### 3. PRICE ANCHORING STRATEGY — Making Pro Feel Like the Best Deal

**The Goldilocks Effect in action:**

The four-tier structure naturally creates a Goldilocks frame. Starter is the entry point, Enterprise is the ceiling, and the visitor's eye should settle on Pro or Ultra as the "smart" choice. Here is how to engineer that:

**Tactic 1: Visual weight on Pro.**
Pro card should be 10-15% wider or taller than Starter and Enterprise cards. Add a colored top border or glow effect. The "MOST POPULAR" badge draws the eye before the price registers. The visitor reads the price in the context of "most people choose this" rather than "this costs $129."

**Tactic 2: Anchor with Enterprise.**
Enterprise at $999+/mo makes Pro at $129 feel like a fraction of the cost. The visitor unconsciously thinks: "I get serious infrastructure for 13% of the Enterprise price." Without Enterprise in the lineup, $129 would feel expensive. With it, $129 feels like a steal.

**Tactic 3: Show the Starter ceiling.**
On the Starter card, use subtle limiting language: "128K context cap," "1 model change per cycle," "Standard rate limits." These are not negative — they are accurate descriptions. But next to Pro's "Full context," "Instant switching," and "5x rate limits," they create a natural pull toward the upgrade.

**Tactic 4: Ultra validates Pro.**
Ultra at $350 makes Pro's features feel like exceptional value. The visitor who does not need Mission Control or the Task Board will think: "Pro gives me everything I need at less than half the Ultra price." Ultra exists partly to make Pro shine.

**Tactic 5: "Per day" reframe.**
Below the Pro price, optionally show: "$4.30/day for a complete AI operations platform." Daily pricing makes monthly recurring costs feel smaller. Use this sparingly — once, near the Pro card, not on every tier.

**Tactic 6: Total cost comparison callout.**
Place a callout box near the pricing section (not on the cards themselves):
"Building this yourself? VPS hosting ($50-80/mo) + AI API access ($30-100/mo) + monitoring ($20-50/mo) = $100-230/mo minimum. Pro: $129/mo. Everything included."

---

#### 4. FEATURE COMPARISON TABLE — Full Matrix Below Pricing Cards

Place this directly below the four pricing cards. Title: "Compare all plans." Collapsible on mobile (show top 10 rows, "Show all" button for the rest).

| Feature | Starter ($59) | Pro ($129) | Ultra ($350) | Enterprise ($999+) |
|---|---|---|---|---|
| **Infrastructure** | | | | |
| vCPU | 2 | 8 | 16 | Custom |
| RAM | 8 GB | 32 GB | 64 GB | Custom |
| NVMe Storage | 100 GB | 400 GB | 800 GB | Custom |
| Bandwidth | 8 TB | 32 TB | 64 TB | Custom |
| Dedicated VPS (not shared) | Yes | Yes | Yes | Yes |
| **AI Models** | | | | |
| Bundled AI models (no API keys) | Yes | Yes | Yes | Yes |
| Number of bundled models | 3 | All available | All available | Custom selection |
| Context window | 128K | Full (model max) | Full (model max) | Full + custom |
| Model switching | 1/cycle (next billing) | Unlimited, instant | Unlimited, instant | Unlimited, instant |
| BYOK (bring your own keys) | Yes | Yes | Yes | Yes |
| **Messaging Channels** | | | | |
| WhatsApp | Yes | Yes | Yes | Yes |
| Telegram | Yes | Yes | Yes | Yes |
| Discord | Yes | Yes | Yes | Yes |
| Slack | Yes | Yes | Yes | Yes |
| Microsoft Teams | Yes | Yes | Yes | Yes |
| Signal | Yes | Yes | Yes | Yes |
| Webchat | Yes | Yes | Yes | Yes |
| **Dashboard & Management** | | | | |
| ClawHQ Dashboard | Yes | Yes | Yes | Yes |
| Full OpenClaw Dashboard | Yes | Yes | Yes | Yes |
| VPS Controls (start/stop/restart) | Yes | Yes | Yes | Yes |
| Real-time resource monitoring | Yes | Yes | Yes | Yes |
| Agent Store (browse/deploy) | Yes | Yes | Yes | Yes |
| Agent Chat | Yes | Yes | Yes | Yes |
| Custom domain with SSL | Yes | Yes | Yes | Yes |
| **Pro Tools** | | | | |
| Logs Explorer | -- | Yes | Yes | Yes |
| Usage Analytics | -- | Yes | Yes | Yes |
| Knowledge Base (RAG) | -- | Yes | Yes | Yes |
| Webhooks | -- | Yes | Yes | Yes |
| API Access | -- | Yes | Yes | Yes |
| Audit Log | -- | Yes | Yes | Yes |
| Mission Control (advanced VPS) | -- | Yes | Yes | Yes |
| OpenClaw Dashboard Embed | -- | Yes | Yes | Yes |
| **Ultra Command Center** | | | | |
| Mission Control Overview | -- | -- | Yes | Yes |
| Task Board (7-column Kanban) | -- | -- | Yes | Yes |
| Agent Roster (live fleet status) | -- | -- | Yes | Yes |
| Live Events Feed | -- | -- | Yes | Yes |
| Session Tracker (token/cost) | -- | -- | Yes | Yes |
| Execution Trace Replay | -- | -- | Yes | Yes |
| **Enterprise Exclusives** | | | | |
| Custom agent building | -- | -- | -- | Yes |
| Bespoke integrations | -- | -- | -- | Yes |
| Dedicated account manager | -- | -- | -- | Yes |
| White-glove setup | -- | -- | -- | Yes |
| **Rate Limits & Support** | | | | |
| Rate limits | Standard | 5x | 10x | 25x |
| Support | Dashboard tickets | Priority | Priority (fastest) | Dedicated manager |
| AI credits | Standard | Standard | 5x | Custom |
| Setup time | Within 24 hours | Within 24 hours | Within 24 hours | Custom timeline |
| **Pricing** | | | | |
| Monthly | $59/mo | $129/mo | $350/mo | Custom |
| Annual | $599/yr | $1,299/yr | $3,499/yr | Custom |
| Annual savings | $109 | $249 | $701 | -- |

**Visual treatment:** Use checkmarks for "Yes," dashes for "not included." Highlight the Pro column with a subtle background tint. Group rows by category with bold section headers. On mobile, allow horizontal scroll or collapse into per-plan accordion views.

---

#### 5. "ALL-INCLUSIVE" CALLOUT — No Hidden Costs

Place this as a prominent banner or callout section either directly above or directly below the pricing cards. This is the single most important trust signal for the pricing section.

**Headline:** "One price. Everything included. No surprises."

**Subheadline:** "Every plan includes AI models, all messaging channels, managed infrastructure, dashboard access, and support. No API keys to buy. No per-token charges. No channel fees. No overage bills."

**Supporting copy (3 bullet points with icons):**

1. **No API fees** — "AI models are bundled on every plan. No separate API subscription. No credit packs. No per-token billing. Your agents just work."

2. **No channel fees** — "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — all included on every plan. No add-on pricing for extra channels."

3. **No infrastructure surprises** — "Dedicated VPS, managed updates, daily backups, crash recovery, SSL certificates — all included. No bandwidth overage charges. No storage upsells."

**Visual treatment:** Display as a horizontal strip with three icon-and-text blocks. Use a contrasting background (slightly lighter or darker than the surrounding section) to make it stand out. Consider a subtle "shield" or "checkmark" icon theme.

**Alternative compact version (if space is tight):**
A single line above the pricing cards:
"All plans include: AI models + all channels + dedicated VPS + managed infrastructure + dashboard + support. One bill. No extras."

---

#### 6. ENTERPRISE CARD STRATEGY — "Talk to Us"

**Purpose of the Enterprise card:** It serves three roles simultaneously:

1. **Price anchor** — Makes every other tier look affordable by comparison.
2. **Legitimacy signal** — Having an enterprise tier signals that ClawHQ serves serious businesses, not just hobbyists.
3. **Revenue driver** — At $999+/mo, even 2-3 enterprise customers generate significant revenue.

**What the card should show:**

- **Headline:** "Enterprise"
- **Badge:** "WHITE GLOVE" in gold/amber
- **Price:** "Custom" in large text. Below: "Starting at $999/mo"
- **Tagline:** "Built around your business."
- **Bullets (focus on outcomes, not features):**
  1. Custom AI agents designed for your specific workflows
  2. Bespoke integrations with your existing tools and systems
  3. Dedicated infrastructure sized to your requirements
  4. Personal account manager and ongoing support
  5. 25x rate limits — built for high-volume production
  6. Everything in Ultra, plus custom everything
- **CTA:** "Talk to Us" button linking to a scheduling page
- **Below CTA:** "Book a 30-minute call. We will scope your needs and build a plan."

**What NOT to show on the Enterprise card:**
- Specific VPS specs (it is custom — showing numbers would limit perception)
- A monthly price selector or annual toggle (custom pricing means custom billing)
- "Contact Sales" (too corporate for the ClawHQ brand — "Talk to Us" is warmer)

**Scheduling link behavior:**
Link to a booking page. The booking form should ask:
- Company name
- Number of AI agents needed
- Primary use case (dropdown: customer support, content, data processing, research, other)
- Current AI tools in use (optional)
- Preferred call time

**Enterprise page (optional, linked from the card):**
If you create a dedicated /enterprise page, include:
- 3-4 use case stories (even hypothetical at launch): "Enterprise for customer support teams," "Enterprise for agencies," "Enterprise for product companies"
- A longer feature breakdown of what custom means
- Security and compliance section (SOC2 roadmap, data handling, uptime SLA)
- The scheduling form embedded directly on the page

---

#### 7. UPGRADE PATH MESSAGING — Starter to Pro to Ultra to Enterprise

**Core narrative:** Each tier is a natural graduation, not a separate product. You do not "switch plans" — you unlock the next level of what you are already using. Everything migrates seamlessly. No data loss. No downtime. No re-setup.

**How to communicate the progression on the landing page:**

**Option A: Horizontal progression bar (below pricing cards)**
A visual "journey" strip showing:

Starter --> Pro --> Ultra --> Enterprise

With brief trigger descriptions at each arrow:
- Starter to Pro: "When you need full context, instant switching, and monitoring"
- Pro to Ultra: "When you need a command center for your agent fleet"
- Ultra to Enterprise: "When you need custom agents built for your business"

**Option B: "Which plan is right for you?" decision guide**

Place below the feature comparison table:

| You should choose... | If you... |
|---|---|
| **Starter** | Want a fully managed OpenClaw with AI models, all channels, and zero hassle. Running 1-2 agents for personal or small business use. |
| **Pro** | Need full context windows, instant model switching, monitoring, and API access. Running 3+ agents for production workloads. |
| **Ultra** | Manage a fleet of agents and need Mission Control, task tracking, cost analytics, and execution traces. Running AI as a core business operation. |
| **Enterprise** | Need custom agents, bespoke integrations, and dedicated support. Running AI at scale with unique requirements. |

**Upgrade messaging in the dashboard (for existing customers):**

These messages should appear contextually when a user hits a tier ceiling:

- **128K context cap hit:** "Your conversation exceeded the 128K context limit. Upgrade to Pro for full context windows."
- **Model change blocked:** "You have used your model change for this cycle. Pro unlocks unlimited instant switching."
- **Rate limit hit:** "You have reached your rate limit. Pro offers 5x the throughput."
- **Pro user viewing Ultra features:** "Want Mission Control, Task Board, and cost tracking? Go Ultra."

**Key principle:** Never frame upgrades as "you are missing out." Frame them as "here is what opens up when you are ready." The tone should be informative, not pushy. The product sells itself when the friction is real.

**Downgrade messaging:**
- "You can downgrade anytime from your billing page. Your setup adjusts at the end of your current billing cycle. No penalties."
- Keep it simple, no guilt trips. A customer who downgrades and stays is better than one who cancels entirely.

---

#### 8. FAQ ENTRIES — Pricing-Specific

**Q: What payment methods do you accept?**
A: We accept all major credit and debit cards, processed securely through our payment partner. We support 100+ currencies. Annual plans are billed as a single charge.

**Q: Can I upgrade or downgrade my plan?**
A: Yes. Upgrade anytime from your dashboard — the change takes effect immediately, and you are billed the prorated difference. Downgrade anytime — it takes effect at the end of your current billing cycle.

**Q: Is there a free trial?**
A: No. Instead, we show you exactly what every plan includes — full feature breakdown, VPS specs, model details, dashboard screenshots. What you see on this page is exactly what you get. Full transparency, no surprises.

**Q: Do you offer refunds?**
A: No. Because we provision dedicated infrastructure for each customer (your own server, configured specifically for you), we cannot offer refunds. That said, everything is fully documented on this page — you know exactly what you are paying for before you sign up.

**Q: Are there any hidden fees or extra charges?**
A: No. Your plan price includes everything: dedicated VPS, AI models, all messaging channels, dashboard access, managed infrastructure, updates, backups, and support. No API fees. No channel add-ons. No bandwidth overage charges. One bill.

**Q: What happens if I exceed my rate limits?**
A: Rate limits are designed to prevent abuse, not to slow down normal use. If you consistently need higher throughput, upgrading to the next tier increases your limits significantly. You will never be charged overage fees — your requests are simply queued or throttled briefly.

**Q: How does annual billing work?**
A: Annual plans are billed as a single upfront payment for 12 months. You save up to 17% compared to monthly billing. Starter: $599/yr (save $109). Pro: $1,299/yr (save $249). Ultra: $3,499/yr (save $701).

**Q: Can I switch between monthly and annual billing?**
A: Yes. Switch to annual billing anytime from your dashboard to lock in the savings. If you are on annual and want to switch to monthly, the change takes effect at your next renewal date.

**Q: What happens to my setup if I upgrade?**
A: Your instance, data, agents, channels, and configurations all carry over. Upgrades are seamless — your server resources are scaled up and new features unlock instantly. No re-setup. No data migration. No downtime.

**Q: Is there a contract or minimum commitment?**
A: No. Monthly plans are billed month-to-month with no contract. Cancel anytime. Annual plans commit you for 12 months at the discounted rate.

---

#### 9. COMPETITIVE PRICING COMPARISON — ClawHQ vs. the Market

**Purpose:** Show that ClawHQ pricing is not just competitive — it is the best total value when you factor in everything that is included. Do NOT name specific competitors. Use category descriptions.

**Section headline:** "What you would actually pay elsewhere."

**Subheadline:** "Most providers advertise low hosting prices. Then you pay extra for AI, extra for channels, extra for monitoring. Here is what a comparable setup actually costs."

---

**Comparison Table 1: Total Cost of Ownership**

| What You Need | Typical BYOK Provider | Typical All-Inclusive Provider | ClawHQ Starter |
|---|---|---|---|
| Managed hosting | $19-29/mo | $39-79/mo | Included |
| AI model access | $20-60/mo (your own API keys) | Limited credits ($15-$278) | Included (flat rate) |
| All messaging channels | Often extra or limited | 2-4 channels typical | All 7 included |
| Dashboard and monitoring | Basic or none | Basic | Full dashboard |
| Managed updates and backups | Sometimes | Usually | Always |
| **Total monthly cost** | **$39-89/mo** | **$39-79/mo + overage risk** | **$59/mo. That is it.** |

---

**Comparison Table 2: What $59/mo Gets You (ClawHQ vs. Market)**

| Feature | Budget Providers ($19-29) | Mid-Tier Providers ($39-79) | ClawHQ Starter ($59) |
|---|---|---|---|
| AI models included | No (BYOK) | Credits or limited | Yes, flat-rate |
| Dedicated VPS | Shared or minimal | 2 vCPU / 4 GB typical | 2 vCPU / 8 GB |
| All messaging channels | 1-3 channels | 2-5 channels | 7 channels |
| Full dashboard | No | Basic | Full |
| Agent Store | No | No | Yes |
| Managed infrastructure | Partial | Usually | Fully managed |
| Per-token or credit billing | N/A (BYOK) | Yes (credits run out) | No. Flat rate. |

---

**Comparison Table 3: Pro-Level Comparison**

| Feature | Market Alternatives | ClawHQ Pro ($129) |
|---|---|---|
| Managed VPS specs | 2-4 vCPU / 4-8 GB typical | 8 vCPU / 32 GB RAM / 400 GB NVMe |
| AI model access | BYOK or credit-based | All models, flat-rate, instant switching |
| Context window | 32K-128K typical | Full (model maximum) |
| Monitoring and logs | Rarely included | Full monitoring, logs, analytics |
| API access | Rarely included | Yes, with key management |
| Agent control | Not offered | Full agent management dashboard |
| Approximate total cost for equivalent | $150-300/mo (hosting + API + tools) | $129/mo. Everything included. |

---

**Landing page copy for this section:**

"Budget hosts charge $19-29 for a server — then you are on your own for AI. You sign up for API access ($20-60/mo), manage keys, watch token bills, and hope credits do not run out mid-conversation. All-inclusive providers give you credits that cap your usage or free models that cap your quality. ClawHQ gives you production-ready AI models, all messaging channels, a full management dashboard, and dedicated infrastructure — one price, no extras, no surprises. Compare the total cost, not the sticker price."

---

**Visual suggestion for the comparison section:**

A two-column visual:
- **Left column (faded/grayed, crossed-out items):** "Hosting: $24/mo" + "AI API: $40/mo" + "Monitoring: $30/mo" + "Channel plugins: $15/mo" = **"$109/mo + setup time"**
- **Right column (vibrant, highlighted):** "ClawHQ Starter" = **"$59/mo. Everything included."** with a single green checkmark.

This visual should feel like crossing items off a shopping list vs. getting one box that has everything. Simple, visceral, immediately persuasive.

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

#### 1. "HOW IT WORKS" SECTION — 4-Step Flow

Display as a horizontal step sequence on desktop (numbered 1-2-3-4 with connecting lines) and a vertical timeline on mobile. Each step gets a number badge, headline, description, and visual suggestion.

---

**Step 1: Choose Your Plan**
- **Headline:** "Pick a plan"
- **Description:** "Starter, Pro, or Enterprise. Every plan includes hosting, AI models, all channels, and a full dashboard. No API keys. No hidden fees. Pick the one that fits."
- **Visual suggestion:** Simplified version of the three pricing cards, slightly angled/stacked, with the "Get Started" button glowing on hover. Show the monthly/annual toggle in miniature.
- **Micro-copy below:** "Takes 2 minutes."

**Step 2: We Build Your Instance**
- **Headline:** "We set up everything"
- **Description:** "Your dedicated server, AI models, dashboard, and custom domain — all configured and deployed by our team. No terminal. No Docker. No config files. You do nothing."
- **Visual suggestion:** Abstract animation of a server being assembled — blocks stacking, lights turning on, a progress indicator moving from 0% to 100%. Do NOT show any actual infrastructure UI or SSH terminals. Keep it abstract and clean.
- **Micro-copy below:** "Live within 24 hours."

**Step 3: Connect Your Channels**
- **Headline:** "Connect where your users are"
- **Description:** "WhatsApp, Telegram, Discord, Slack, Signal, Teams, Email, Webchat — connect any or all of them from your dashboard. Your AI agents respond on every platform."
- **Visual suggestion:** Row of 8 channel icons (WhatsApp, Telegram, Discord, Slack, Signal, Teams, Email, Web) with toggle switches next to each. Animate the toggles flipping on one by one, left to right.
- **Micro-copy below:** "All 8 channels included."

**Step 4: Start Using Your AI Agents**
- **Headline:** "You're live"
- **Description:** "Your agents are running. Talk to them from any connected channel or directly from your dashboard. Deploy more agents, monitor performance, manage everything from one place."
- **Visual suggestion:** Dashboard overview mockup showing green status indicators — VPS running, 3 channels connected, 2 agents deployed. Show a chat bubble appearing with an agent response. The dashboard should match the real ClawHQ UI style (dark, brutalist, clean).
- **Micro-copy below:** "Full control from day one."

---

#### 2. TIME-TO-VALUE MESSAGING

The core promise is speed: you go from zero to a fully operational AI agent deployment in under 24 hours, with zero technical work on your end.

**Primary time-to-value headline:**
"From signup to live agents in under 24 hours."

**Supporting time-to-value statements (use throughout the page):**
- "Your instance is provisioned, configured, and running before your next morning coffee."
- "No setup guides. No tutorials. No 'getting started' docs. We handle it. You use it."
- "24 hours. That's the longest you'll wait. Most instances go live faster."

**Time-to-value comparison callout (place near How It Works or pricing):**

> **The DIY alternative:**
> Self-hosting OpenClaw: rent a VPS, install dependencies, configure Docker, set up models, configure a reverse proxy, provision SSL, connect channels, debug errors. Estimated time: 4-12 hours if you know what you're doing. Days if you don't.
>
> **The ClawHQ alternative:**
> Choose a plan. Wait. Use it. Total time spent by you: under 5 minutes.

---

#### 3. POST-SIGNUP JOURNEY — What the User Sees After Paying

Map the exact experience from the moment a user completes payment to first value.

**Stage 1: Registration & Payment**
- User lands on landing page, reads features, clicks "Get Started."
- Taken to registration: Name, Email, Password (clean, minimal form — ClawHQ branding, no distractions).
- After registration, redirected to the dashboard.
- Dashboard shows: "Get Started with ClawHQ — Choose a plan to get your managed OpenClaw instance up and running." with a "View Plans" button.
- User selects plan, completes payment.

**Stage 2: Provisioning (0-24 hours)**
- Dashboard immediately updates to show: "Setting Up Your Instance — Your [Plan] plan is active. We're provisioning your VPS — this usually takes 15-30 minutes."
- Pulsing server icon (animated) indicates work in progress.
- User can contact support if they have questions during this stage.
- No action required from the user.

**Stage 3: Instance Ready**
- Dashboard overview populates with live data:
  - VPS Status: Running (green badge)
  - Current Plan: Starter / Pro / Enterprise
  - AI Model: [model name]
  - Context Limit: 128K / Unlimited
  - Channels Connected: 0 (with "Connect a channel" link)
  - Agents Deployed: 0 (with "Deploy your first agent" link)
  - Open Tickets: 0
- Quick Actions appear: "Open OpenClaw" (external link), "Manage VPS," "Raise Ticket"
- User has full sidebar navigation: Overview, VPS, Models, Agents, Store, Chat, Channels, OpenClaw, Support, Billing, Account

**Stage 4: First Actions (user-driven)**
- Connect a messaging channel (WhatsApp, Telegram, etc.)
- Browse the Agent Store, deploy a free or premium agent
- Chat with deployed agents directly from the dashboard
- Open the full OpenClaw dashboard (external link or embedded on Pro)
- Explore VPS controls, model settings, billing

**Landing page content suggestion for this journey:**
Show a 3-panel "What you see after signing up" visual:
1. Panel 1: The provisioning screen (server icon, "Setting up your instance..." message)
2. Panel 2: The live dashboard overview (all cards populated, green status)
3. Panel 3: A chat window with an agent responding

**Copy above the panels:**
"Here's what happens after you sign up."

**Copy below the panels:**
"No guesswork. No blank screens. Your dashboard shows you exactly where things stand — from provisioning to fully live."

---

#### 4. UPGRADE JOURNEY — How Upgrading Works

**Headline:** "Upgrade anytime. Keep everything."
**Description:** "Upgrading from Starter to Pro doesn't reset your instance, your data, your channels, or your agents. Your existing setup stays exactly as it is — you just get more power, more tools, and more control on top."

**What happens when a user upgrades (Starter to Pro):**
1. User clicks "Upgrade to Pro" from the Billing page or any upgrade prompt.
2. Payment processes immediately.
3. VPS resources scale up (2 vCPU to 8, 8 GB to 32 GB, etc.).
4. Six new sidebar sections unlock: Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log.
5. VPS page upgrades to "Mission Control" with process management and maintenance tools.
6. OpenClaw dashboard embeds directly inside ClawHQ.
7. Context window cap is removed. Model switching becomes instant.
8. Rate limits increase to approximately 5x.

**Key messaging points:**
- "No migration. No downtime. No data loss."
- "Your channels stay connected. Your agents stay deployed. You just unlock more."
- "Upgrade takes effect immediately — not next billing cycle."

**Visual suggestion:**
Side-by-side dashboard comparison. Left: Starter sidebar (11 items). Right: Pro sidebar (17 items, with "Pro Tools" section highlighted in accent color). Animate the Pro sidebar expanding to reveal the 6 new items.

---

#### 5. DOWNGRADE MESSAGING

**Headline:** "Downgrade anytime. No lock-in."
**Description:** "If Pro is more than you need, downgrade to Starter. You keep your instance, channels, and agents. Pro-exclusive features (Logs, Analytics, API Access, etc.) become inaccessible until you upgrade again."

**Copy:** "We'd rather you use the right plan than pay for features you don't need."

---

#### 6. VISUAL & ANIMATION SUGGESTIONS FOR HOW IT WORKS

**Step indicator design:**
- Numbered circles (1, 2, 3, 4) connected by a thin horizontal line on desktop, vertical on mobile.
- Use the primary accent color for completed/active steps, muted for upcoming.
- On scroll, each step activates sequentially — the number fills in, the connecting line draws, and the content fades in.

**Animation sequence (scroll-triggered):**
1. User scrolls to the How It Works section.
2. Step 1 fades in from the left. Number badge fills with accent color. Pricing card miniature appears.
3. Connecting line draws to Step 2. Step 2 fades in. Server assembly animation plays (blocks stacking, lights turning on).
4. Line draws to Step 3. Channel icons appear one by one with toggle switches flipping on.
5. Line draws to Step 4. Dashboard mockup slides in. Status badges light up green. Chat bubble pops in.

**Timing:** Each step should take roughly 0.4-0.6 seconds to animate in, with 0.2 seconds between steps. Total animation: approximately 3 seconds.

**Mobile adaptation:**
- Vertical timeline (line runs down the left side, steps stack vertically).
- Same scroll-trigger behavior, but steps reveal one at a time as the user scrolls past each.
- Simplify the server assembly animation to a progress bar.
- Channel icons display as a 4x2 grid instead of a single row.

**Before/after visual (optional, place above or below the steps):**
- "Before ClawHQ": terminal window with complex Docker/SSH commands, red error messages, config file chaos.
- "After ClawHQ": clean dashboard with green status indicators, organized sidebar, a chat window with an agent responding.
- Transition: a horizontal wipe or fade from left (before) to right (after).

---

#### 7. LANDING PAGE SCROLL JOURNEY — Recommended Section Order

The user scrolls top to bottom. Every section has one job: move the user closer to clicking "Get Started." The order follows a narrative arc: attention, understanding, proof, comparison, action.

**Recommended section order:**

1. **Hero** — First impression. Headline, sub-headline, primary CTA ("Get Started"), and a visual hook (dashboard preview or animated element). Job: capture attention, communicate the core value in under 5 seconds.

2. **Logos / Channel Icons Bar** — Immediately below hero. A single row showing all 8 supported channel icons (WhatsApp, Telegram, Discord, Slack, Signal, Teams, Email, Web). Job: instant credibility and scope communication. No text needed — the icons speak.

3. **How It Works** — The 4-step flow (Section 1 above). Job: demystify the process, reduce perceived effort, emphasize speed ("Live in 24 hours").

4. **Feature Highlights** — 3-4 top features with headlines, short descriptions, and visuals (Bundled AI Models, Dedicated VPS, All Channels Included, Full Dashboard). Job: show what they get. Use visual cards or alternating left/right layout.

5. **Dashboard Preview** — Animated mockup or real screenshots of the ClawHQ dashboard. Show the overview page, VPS controls, agent chat, and channel status. Job: prove the product exists and looks professional. Build "I want to use this" desire.

6. **Pricing** — Three cards (Starter $59, Pro $129, Enterprise $999+). Monthly/annual toggle. Feature comparison table below. Job: make the decision. Every plan shows full feature list, not a truncated version.

7. **Why ClawHQ / Differentiators** — The 6 differentiators from section 4.3. Job: answer "why this instead of alternatives?" Handle the comparison objection.

8. **Comparison Table** — ClawHQ vs. typical alternatives (from section 4.3). Job: make the value gap visually obvious with checkmarks vs. X marks.

9. **Per-Plan Deep Dive** — Expandable or tabbed section showing full feature breakdowns for each tier (Starter, Pro, Enterprise). Job: satisfy the detail-oriented buyer who wants to know everything before paying.

10. **Trust & Transparency Section** — Exact specs published, real screenshots, verifiable claims, "What you see is what you get" messaging. Job: build confidence for a new brand. Replace social proof with radical transparency.

11. **FAQ** — Objection-handling questions: pricing justification, no free trial, new brand trust, setup time, refund policy, data ownership. Job: remove final doubts.

12. **Final CTA** — Repeat the hero CTA with a slightly different headline. Example: "Ready to stop managing infrastructure?" with "Get Started" button. Job: catch the user who scrolled all the way and is now convinced.

13. **Footer** — Contact email, Enterprise scheduling link, legal links (ToS, Privacy), social links. Job: housekeeping and accessibility.

---

#### 8. CTA PLACEMENT STRATEGY

CTAs should appear at natural decision points throughout the page. Never more than 2 scroll-lengths apart. The user should always have a "Get Started" button within easy reach.

**CTA placement map:**

| Location | CTA Type | Text | Notes |
|---|---|---|---|
| Hero section | Primary button (large) | "Get Started" | Most prominent CTA on the page. Above the fold. |
| After How It Works | Secondary button | "Choose Your Plan" | Scrolls to pricing section. User now understands the process. |
| After Feature Highlights | Text link or ghost button | "See full pricing" | Subtle, not aggressive. User is still learning. |
| Pricing section | Primary button per card | "Get Started" / "Get Started" / "Talk to Us" | One CTA per pricing card. Starter and Pro go to registration. Enterprise goes to scheduling link. |
| After Comparison Table | Primary button | "Get Started — $59/mo" | Re-anchor to the Starter price. Include price in button text for clarity. |
| After FAQ | Primary button (large) | "Start Your Instance" | Second-largest CTA on the page. Catches convinced scrollers. |
| Sticky header (appears on scroll) | Small button in nav | "Get Started" | Appears after the user scrolls past the hero. Always visible. Compact. |

**CTA design rules:**
- Primary CTAs: solid accent color background, white text, sharp corners (brutalist style — no rounded buttons).
- Secondary CTAs: border only (ghost button), accent color text.
- Text links: accent color, underline on hover.
- Never use "Sign Up" — use "Get Started" (lower commitment language).
- Never use "Buy Now" — use "Get Started" or "Choose Your Plan" (no transactional pressure).
- Enterprise CTA is always "Talk to Us" — never "Buy" or "Get Started" since it requires a consultation.

**Sticky navigation CTA behavior:**
- Hidden when the hero is visible (redundant).
- Fades in when the user scrolls past the hero section.
- Stays fixed in the top-right of the nav bar.
- Small footprint: compact button, does not dominate the nav.
- On mobile: the sticky CTA collapses to a floating button in the bottom-right corner.

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

#### 1. TRUST STRATEGY FOR A NEW BRAND — Credibility Without Testimonials

ClawHQ has zero customers, zero testimonials, zero press. The conventional SaaS trust playbook (logos, quotes, case studies) is not available. The strategy is **radical transparency** — make every claim verifiable, make the product visible before purchase, and position the absence of fluff as a feature, not a weakness.

**Core trust philosophy: "Don't trust us. Verify us."**

This inverts the typical SaaS approach. Instead of asking visitors to believe marketing claims, ClawHQ publishes every measurable detail and invites visitors to check for themselves. This works because:
- The product is real and built (dashboard exists, infrastructure runs)
- The specs are concrete and measurable (vCPU, RAM, storage, bandwidth)
- The AI models are named and publicly known (visitors can research them independently)
- The dashboard can be shown in screenshots (not mockups)

**Three trust pillars for launch:**

1. **Specification Transparency** — Publish every number. VPS specs, model names, context limits, channel count, setup time. No vague "powerful servers" or "advanced AI." Exact numbers.

2. **Visual Proof** — Real dashboard screenshots, real channel integration screenshots, real OpenClaw dashboard. Not renders. Not mockups. Actual product screenshots with redacted user data.

3. **Honest Limitations** — Acknowledge what ClawHQ does not do (no free trial, no SSH access, soft rate limits exist). Honesty about limitations builds more trust than perfection claims.

---

#### 2. TRANSPARENCY-AS-TRUST CONTENT — Verifiable Claims Only

Every claim on the landing page must be either verifiable before purchase or verifiable immediately after purchase. No claim should require "just trust us."

**Pre-purchase verifiable claims (visitor can confirm without signing up):**

| Claim | How Visitor Verifies |
|---|---|
| "Kimi K2.5 and MiniMax M2.5 included" | Google the model names — they are real, publicly documented models |
| "WhatsApp, Telegram, Discord, Slack, Signal, Teams, Webchat" | 7 named channels — visitor knows these platforms exist |
| "Full OpenClaw dashboard access" | OpenClaw is open-source — visitor can look it up and see what the dashboard includes |
| "2 vCPU, 8 GB RAM, 100 GB NVMe, 8 TB bandwidth" | Industry-standard specs — visitor can compare to any VPS provider |
| "Setup within 24 hours" | Specific, measurable timeline — not "fast" or "quick" |
| "$59/mo or $599/yr" | Price is on the page — no hidden calculator or "contact sales" |

**Post-purchase verifiable claims (customer can confirm immediately):**

| Claim | How Customer Verifies |
|---|---|
| "Dedicated VPS — not shared" | VPS controls dashboard shows real-time resource usage; all resources belong to them |
| "Full dashboard with VPS controls" | They log into app.clawhq.tech and see it |
| "Auto-restart on crash" | Container-based deployment recovers automatically — visible in uptime logs |
| "All channels connected" | Channel status page shows connected/disconnected state for each |
| "Agent store with one-click deploy" | Agent marketplace is live in the dashboard |

**Content block for the landing page — "What We Publish. What You Verify."**

> **Headline:** "We publish the specs. You verify them."
>
> **Body:** "Every number on this page is real. Your VPS specs are measurable — check them in your dashboard. Your AI models are named — look them up. Your channels are listed — count them. We don't ask you to trust a logo wall or a star rating. We ask you to read the specs, see the screenshots, and decide for yourself."

---

#### 3. "WHAT YOU SEE IS WHAT YOU GET" SECTION — Full Tier Transparency

This section lives near or within the pricing area. Its purpose is to eliminate buyer uncertainty by showing the complete, unedited list of what each tier includes — and what it does not.

**Section headline options:**
1. "What you see is what you get." — direct, brutalist, confident
2. "No fine print. No asterisks." — attacks the industry norm
3. "The full picture. Every tier." — factual

**Recommended: "What you see is what you get."**

**Starter $59/mo — Full Disclosure Card**

> **What's included:**
> - Dedicated VPS: 2 vCPU, 8 GB RAM, 100 GB NVMe, 8 TB bandwidth
> - AI models: Kimi K2.5, MiniMax M2.5 + 1 rotating model
> - Context window: 128K tokens
> - Channels: WhatsApp, Telegram, Discord, Slack, Signal, Teams, Webchat
> - Full ClawHQ dashboard: VPS controls, monitoring, billing, support tickets
> - Full OpenClaw dashboard: all skills, plugins, ClawHub
> - Agent store: browse, deploy, and manage agents
> - Agent chat: talk to your deployed agents from the dashboard
> - Custom domain with SSL included
> - Managed setup, updates, backups, auto-restart
> - Support via dashboard tickets and email
>
> **What's not included (honest):**
> - No SSH access to your VPS (we manage the server for you)
> - Model changes apply next billing cycle (not instant)
> - Soft rate limits exist (designed to prevent abuse, not restrict normal use)
> - No free trial (full transparency on this page instead)
> - Pro-exclusive tools: Logs Explorer, Usage Analytics, Knowledge Base, Webhooks, API Access, Audit Log

**Pro $129/mo — Full Disclosure Card**

> **Everything in Starter, plus:**
> - VPS upgrade: 8 vCPU, 32 GB RAM, 400 GB NVMe, 32 TB bandwidth
> - Full context window (no 128K cap — model maximum)
> - Instant model switching from dashboard
> - 5x rate limits vs Starter
> - Pro Tools: Logs Explorer, Usage Analytics, Knowledge Base, Webhooks, API Access, Audit Log
> - Mission Control: process list, maintenance tools
> - Embedded OpenClaw dashboard inside ClawHQ
> - Real-time monitoring with alerts
> - Priority support
>
> **What's not included (honest):**
> - No SSH access (same as Starter — fully managed)
> - No custom agent building (that's Enterprise)
> - No dedicated account manager (Enterprise)
> - Rate limits still exist (higher, but not unlimited)

**Enterprise $999+/mo — Full Disclosure Card**

> **Everything in Pro, plus:**
> - 1-on-1 consultation to map your requirements
> - Custom agents built for your specific use case
> - Custom planner agents and integrations
> - 5x rate limits vs Pro
> - Dedicated infrastructure
> - White-glove setup and ongoing support
> - Price scales with complexity — minimum $999/mo
>
> **How it works:** Book a call. We scope the work. You get a quote. No surprises.

---

#### 4. TECHNICAL CREDIBILITY SIGNALS — Proving Engineering Competence

Without testimonials, the product itself must signal quality. These elements prove ClawHQ is built by people who know what they are doing.

**Signal 1: Real Dashboard Screenshots**
- Show 4-6 actual dashboard screenshots (not mockups, not wireframes)
- Suggested screenshots: VPS controls page (start/stop/restart + resource charts), Agent store, Channel status page, Monitoring dashboard, Support ticket thread, Billing page
- Redact any personal data but keep the UI fully visible
- Label each screenshot: "Your ClawHQ dashboard — [page name]"

**Signal 2: Infrastructure Specifics**
- "Container-based deployment with automatic crash recovery" — signals modern DevOps without exposing provider names
- "Automated 12-step provisioning pipeline" — signals engineering sophistication
- "SSL certificates provisioned and monitored automatically" — signals security awareness
- "Custom domain with DNS configuration handled for you" — signals full-stack capability
- Do NOT say: Docker, Hostinger, Cloudflare, nginx, systemd, or any internal tool names

**Signal 3: Named AI Models**
- Publishing real model names (Kimi K2.5, MiniMax M2.5) is a trust signal in itself
- Most competitors say "AI included" without naming models — ClawHQ names them
- Visitors can independently research these models and confirm they are capable
- Content block: "We don't hide behind 'AI included.' We tell you exactly which models power your agents: Kimi K2.5 and MiniMax M2.5, with 128K context on Starter and full context on Pro."

**Signal 4: Dashboard Feature Depth**
- The breadth of the dashboard (VPS controls, monitoring, agents, channels, chat, support, billing, account) signals a mature product
- Show the sidebar navigation in a screenshot — the sheer number of sections communicates completeness
- Content block: "Your dashboard isn't a status page with a restart button. It's a full command center: real-time resource monitoring, agent management, channel configuration, support tickets, billing history, and direct access to your OpenClaw instance."

**Signal 5: OpenClaw Ecosystem**
- OpenClaw is open-source and well-known — association builds instant credibility
- "Full OpenClaw access — all skills, all plugins, all of ClawHub" — visitors who know OpenClaw understand the value
- "Your agents, your data, your OpenClaw dashboard — we just keep it running" — positions ClawHQ as infrastructure, not a walled garden

---

#### 5. FUTURE-PROOFING PLACEHOLDERS — Where to Add Social Proof Later

These are specific locations on the landing page where social proof elements should be inserted as they become available. Build the page with invisible or minimal placeholders now.

**Placeholder 1: Customer Count Badge (add at 10+ customers)**
- Location: Below the hero headline or above the pricing section
- Format: "Trusted by [X] teams" or "[X] instances running"
- Trigger: Add when customer count reaches double digits
- Do NOT show "0 customers" or "Join our first customers" — absence is better than highlighting emptiness

**Placeholder 2: Testimonial Cards (add at 3-5 happy customers)**
- Location: Between the features section and the FAQ
- Format: 2-3 short quotes with name, role, and company (with permission)
- Trigger: Actively request testimonials from first satisfied customers after 30 days of service
- Template to send customers: "Would you be willing to share a 1-2 sentence quote about your experience with ClawHQ? We'd feature it on our site with your name and company."

**Placeholder 3: Uptime Statistics (add at 30+ days of monitoring)**
- Location: Near the VPS specs or in a "reliability" subsection
- Format: "99.X% uptime over the last [X] days" with a link to a public status page
- Trigger: Only add when you have real monitoring data. Never fabricate uptime numbers.
- Tool: Set up a public status page (e.g., via an uptime monitoring service) before displaying any uptime claims

**Placeholder 4: Press/Coverage Logos (add if/when covered)**
- Location: Thin horizontal strip below the hero or above the footer
- Format: Grayscale logos: "Featured in [publication]"
- Trigger: Any legitimate tech blog, newsletter, or Product Hunt feature
- Do NOT add logos for self-published content or paid placements without disclosure

**Placeholder 5: Case Studies (add at 3+ months of operation)**
- Location: Separate page linked from the landing page, or expandable cards within a "Stories" section
- Format: Problem > Solution > Result, with real metrics if available
- Trigger: When a customer agrees to share their use case in detail

**Placeholder 6: Live Instance Counter (add when technically feasible)**
- Location: Hero section or footer
- Format: "[X] active instances" — pulls from real database count
- Trigger: Only when the number is meaningful (10+) and the API is reliable

---

#### 6. FAQ ENTRIES THAT BUILD TRUST

These FAQ entries specifically address trust concerns. They should be direct, honest, and never evasive. Tone: factual, no-nonsense, respectful.

**Q: Do you offer a free trial?**
> No. Every ClawHQ instance runs on dedicated infrastructure that costs real money from the moment it's provisioned. Instead of a trial, we give you full transparency: every spec, every feature, every limitation is published on this page. You know exactly what you're getting before you pay a cent. We'd rather show you the truth upfront than give you a rushed 5-day trial on a half-configured setup.

**Q: Do you offer refunds?**
> We do not offer refunds after provisioning, because we allocate dedicated resources for your instance immediately. However, you can cancel your subscription at any time — your service continues until the end of your current billing period, and you won't be charged again. We publish everything about every plan on this page precisely so there are no surprises after you subscribe.

**Q: What happens to my data if I cancel?**
> Your data remains on your dedicated instance until the end of your billing period. After that, you have 7 days to request a data export. After the retention window, the instance and all data are permanently deleted. We do not sell, share, or analyze your data at any point. Your agents, conversations, and configurations belong to you.

**Q: What happens if ClawHQ shuts down?**
> Your OpenClaw instance is standard OpenClaw — the same open-source platform anyone can run. If ClawHQ ever ceases operations, we will provide advance notice, full data exports, and documentation to help you migrate your setup to your own server. You are never locked into proprietary technology. OpenClaw is open-source, and your agent configurations are portable.

**Q: Who owns my data?**
> You do. Your agent configurations, conversations, uploaded documents, and all data on your instance belong to you. ClawHQ provides the infrastructure. We do not access your instance data except when required for support (with your explicit request) or for system maintenance (updates, backups). We never use your data for training, analytics, or any purpose beyond running your service.

**Q: How do I know my instance is actually dedicated and not shared?**
> Your ClawHQ dashboard shows real-time CPU, RAM, disk, and network usage for your instance. You can see the full allocated resources and current consumption at any time. If the resources were shared, you would see utilization patterns that don't match your usage. The specs listed on this page are the specs your instance gets — verifiable from your own dashboard the moment you log in.

**Q: Why should I trust a brand I've never heard of?**
> You shouldn't — not based on our word alone. That's why we publish everything: exact VPS specifications, named AI models you can research independently, real dashboard screenshots, all supported channels, and honest limitations. We don't ask you to trust a testimonial or a logo. We ask you to read the specs, compare them to alternatives, and decide based on facts. Every claim on this page is verifiable after purchase.

**Q: What if something breaks?**
> Your instance runs with automatic crash recovery — if the process fails, it restarts automatically without any action from you. For issues beyond auto-recovery, submit a support ticket from your dashboard or email us directly. You can also monitor your instance health in real-time from the dashboard: gateway status, resource usage, and uptime are all visible. We manage the infrastructure so you don't have to diagnose server issues yourself.

**Q: Can I migrate away from ClawHQ?**
> Yes. ClawHQ runs standard OpenClaw. Your agent configurations, skills, and plugins are not proprietary to us. If you decide to self-host or move to another provider, your setup is portable. We do not use vendor lock-in tactics, proprietary agent formats, or walled-garden integrations.

**Q: Do you have an uptime SLA?**
> Not yet. We do not publish uptime guarantees we cannot back with historical data. As we accumulate monitoring data, we will publish real uptime statistics and formalize an SLA. In the meantime, every instance runs with automated crash recovery and managed infrastructure, and our support team monitors for issues.

---

#### 7. SECURITY AND DATA MESSAGING

ClawHQ should communicate security posture honestly — strong where it is strong, silent where it cannot make verified claims.

**What to say:**

> **Headline:** "Your data. Your instance. Your control."
>
> **Body:**
> - "Every ClawHQ instance runs on a dedicated server. Your data is not shared with other customers."
> - "Your OpenClaw dashboard is password-protected and accessible only to you."
> - "SSL encryption is provisioned and monitored automatically for every instance."
> - "Backups run daily. Updates are managed. Crash recovery is automatic."
> - "We do not access your instance data except for system maintenance or when you explicitly request support."
> - "Your agent configurations and conversation data belong to you and are portable."

**What NOT to say (avoid these unless independently audited):**
- "Enterprise-grade security" — undefined and unverifiable
- "SOC 2 compliant" — only if actually certified
- "GDPR compliant" — only if a real data processing agreement exists
- "End-to-end encrypted" — unless this is technically true for all data paths
- "Military-grade encryption" — meaningless marketing phrase, never use
- "We will never be hacked" — no one can promise this

**Security content block for the landing page:**

> **Section title:** "Security without the buzzwords"
>
> **What we do:**
> - Dedicated instances — your data is physically isolated from other customers
> - SSL certificates provisioned and auto-renewed for every instance
> - Password-protected dashboards (ClawHQ and OpenClaw)
> - Daily automated backups
> - Automatic crash recovery with container-based restart
> - No customer SSH access — attack surface is minimized by design
>
> **What we don't claim (yet):**
> - We do not publish an uptime SLA until we have the data to back it
> - We have not completed a third-party security audit (planned as we grow)
> - We do not claim compliance certifications we haven't earned
>
> "We'd rather tell you what we actually do than list certifications we don't have."

---

#### 8. SUPPORT MESSAGING — Positioning Dashboard Tickets + Email as Reliable

Without a live chat widget or 24/7 phone line, ClawHQ needs to position its support channels (dashboard tickets and email) as responsive and effective.

**Support section headline options:**
1. "Real support. Real people." — humanizes the team
2. "Help when you need it." — functional, clear
3. "Support that responds." — direct, commitment-oriented

**Recommended: "Real support. Real people."**

**Support content block:**

> **How support works:**
> - **Dashboard tickets:** Open a ticket directly from your ClawHQ dashboard. Set priority, describe the issue, track status. Every ticket gets a threaded conversation — you'll see our response right where you filed it.
> - **Email:** Reach us at [support email]. Same team, same response.
> - **Enterprise:** Priority support with faster response times.
>
> **What to expect:**
> - We respond to tickets, not a bot. Every reply comes from someone who understands the infrastructure running your instance.
> - Ticket status is visible in your dashboard: open, in progress, resolved.
> - We don't have a call center because we'd rather have engineers solving your problem than reading from a script.

**Support trust signals to display:**
- "Ticket response tracked in your dashboard" — proves the system exists
- "Threaded conversations — full history, no lost context" — signals engineering care
- "Priority routing for Pro and Enterprise" — incentivizes upgrades
- Show a screenshot of the support ticket interface — visual proof the system is real and functional

**What NOT to say about support:**
- "24/7 support" — unless the team actually operates 24/7
- "Average response time: X minutes" — do not publish response time metrics until you have real data
- "Dedicated account manager" — only for Enterprise, and only if actually assigned

---

#### 9. HEADLINE SUGGESTIONS FOR A TRUST/TRANSPARENCY SECTION

These headlines can be used for a dedicated trust section on the landing page, or as subheadings within other sections.

**Primary headline options (for a standalone trust section):**

1. **"No testimonials yet. Just the truth."**
   - Why it works: Acknowledges the elephant in the room. Disarms skepticism by being the first to say it. Brutally honest, which paradoxically builds trust.

2. **"We publish the specs. You verify them."**
   - Why it works: Puts the visitor in control. Positions ClawHQ as confident enough to invite scrutiny.

3. **"Everything you need to decide — right here on this page."**
   - Why it works: Frames the landing page itself as the trust mechanism. No signup required to evaluate.

4. **"Built to be verified, not believed."**
   - Why it works: Philosophical. Differentiates from every SaaS that says "trust us." Aligns with the brutalist design ethos.

5. **"Full transparency. Because that's all we've got."**
   - Why it works: Honest about being new. Turns a weakness into a positioning statement. Self-aware without being self-deprecating.

**Recommended primary: "No testimonials yet. Just the truth."** — This is the most honest, the most memorable, and the most aligned with the brutalist transparency approach. It immediately tells the visitor "this brand is different."

**Supporting subheadline (pairs with any primary):**
"Every spec published. Every feature shown. Every limitation disclosed. Read it all, then decide."

**Section-level subheadings (for use within the trust section):**
- "What you get" — above the tier transparency cards
- "What we don't claim" — above the honest limitations list
- "What happens next" — above the post-purchase journey description
- "Your questions, straight answers" — above the trust FAQs

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

#### 1. HERO SECTION ANIMATION PLAN — What Animates on Load

The hero is the first 2 seconds of the visitor's experience. Every animation here must be lightweight, instant, and purposeful. No loading spinners. No delays.

**On-load sequence (staggered, total duration ~1.8s):**

1. **Background gradient fade-in (0ms):** The Linear Dark dual-tone background (darker edges, lighter center vignette) fades from pure black to full render over 400ms. This creates a "lights coming on" effect — the page surface appears before anything else.

2. **Navigation bar slide-down (100ms delay):** The sticky nav slides down from above with a subtle ease-out, fully opaque by 300ms. Logo on the left, links center, Login/Get Started right. No animation on the nav items themselves — they appear fully formed.

3. **Headline text reveal (300ms delay):** The main headline fades up from 20px below with a slight blur-to-sharp transition. Duration: 500ms. The headline should land as one clean punch — no word-by-word reveals.

4. **Subtitle fade-in (600ms delay):** The subtitle/description text fades in at 60% opacity first, then settles to full opacity over 300ms. Slightly slower than the headline to create hierarchy in the animation itself.

5. **CTA buttons scale-in (800ms delay):** The "Get Started" and "View Plans" buttons scale from 95% to 100% with a subtle spring ease. They should feel like they "pop" into place — not slide, not fade. Duration: 200ms.

6. **Hero visual/product screenshot (1000ms delay):** The dashboard mockup or product visual fades up from 40px below with a parallax-lite feel. This is the heaviest visual element — it should arrive last and feel like it is settling into position. Duration: 600ms. If using the Linear animated demo pattern (3b), the demo starts auto-playing 500ms after the visual is fully visible.

**What the user sees first:** Dark surface, then headline, then the product. This order ensures the value proposition registers before any visual complexity.

**Mobile adjustment:** Remove the stagger — show headline and CTA simultaneously on load. Mobile users scroll fast; do not make them wait 1.8s to see the CTA.

---

#### 2. PER-SECTION ANIMATION MAP — Pattern Assignments

Each landing page section maps to a design spec pattern. The number in parentheses references the design spec pattern.

| Section | Design Pattern | Animation Type | Notes |
|---|---|---|---|
| **Hero** | Linear Hero Bg (3) + Animated Demo (3b) | Fade-up stagger + auto-playing demo | See section 1 above for full sequence |
| **Logo/Trust Bar** | Groq Logo Bar (2) | Horizontal auto-scroll, infinite loop | Logos of supported channels (WhatsApp, Telegram, Discord, Slack, Signal, Teams, Webchat). Scroll speed: ~30px/sec. Pause on hover. |
| **How It Works** | Replicate Stacked Cards (1) | Scroll-triggered card reveals | Each step card fades up as it enters viewport. Left text appears first, right visual 200ms later. |
| **Features Overview (Starter)** | Supabase Bento Grid (8) | Hover-activated card animations | Each card visual animates on hover — see section 6 for per-card details. Static on mobile (no hover). |
| **Dashboard Demo** | Linear Animated Demo (3b) + Tab Toggle (9) | Pre-scripted auto-play + interactive tab switching | Central showcase. See section 3 for full strategy. |
| **Feature Deep-Dives** | Linear Numbered Links (3c) | Click-to-expand slide-up sheets | Numbered feature links below the demo. Clicking opens a detail sheet with smooth slide-up (300ms ease-out). |
| **Pro Upgrade Section** | Resend Feature Grid (4b) | Continuously running live visuals | Two-column cards with animated data: log lines streaming, chart lines drawing. Always running, not hover-gated. |
| **Pricing** | Resend Tabbed Dashboard (4e) | Tab pill switching + dashboard mockup swap | Monthly/Annual toggle animates price numbers (count up/down). Tier cards have subtle hover lift (translateY -4px). |
| **Code/API Examples** | Resend IDE Split Panel (4d) | Clickable file tabs + syntax highlight typing | See section 4 for full plan. |
| **Stats/Impact** | Stripe Cycling Stats (6) | Auto-cycling stats + animated visualizations | 4 stats auto-cycle every 4 seconds. Each triggers a different visual below. |
| **Trust/Transparency** | Resend Centered Highlight (4c) | Simple fade-in, breathing whitespace | Minimal animation — let the honest copy do the work. Icon pulses subtly on scroll-in. |
| **FAQ** | None (custom) | Accordion expand/collapse | Click-to-expand with smooth height transition (200ms). Chevron rotates 180 degrees. One open at a time. |
| **CTA + Footer** | Resend CTA + Giant Text (4f) + Render Floating Icons (7) | Cursor-following spotlight + parallax icons | "CLAWHQ" giant text with cursor light reveal. Channel/model icons float with scroll parallax behind the CTA card. |
| **Sticky Section Nav** | Neon Sticky Nav (5) | Fade-in/out on scroll range | See section 9 for full plan. |

---

#### 3. DASHBOARD DEMO STRATEGY

**Recommended approach: Animated mockup with pre-scripted sequences (NOT live demo, NOT video, NOT static screenshots).**

**Why not each alternative:**
- **Live demo:** Requires a running instance, introduces latency, breaks if the service has issues, and exposes real infrastructure details. Too risky for a landing page.
- **Video:** Cannot be interactive (no tab switching), loads slower, harder to update when the UI changes, and feels passive.
- **Static screenshots:** Dead on arrival. Screenshots signal "we built something" but not "it is alive and working." Every competitor uses screenshots.

**What to build: Linear-style animated mockup (pattern 3b)**

A self-contained component that looks exactly like the ClawHQ dashboard but runs pre-scripted animations. It is NOT connected to any real backend. Everything is hardcoded content playing on a timeline.

**Demo layout:**
- macOS window chrome (three dots top-left, "ClawHQ Dashboard" title bar)
- Left: simplified sidebar nav (VPS, Agents, Channels, Chat, Monitoring — just labels, not functional)
- Right: main content area that changes based on the active scenario

**Three demo scenarios (auto-cycle every 8 seconds, or user clicks to switch):**

**Scenario A — "Agent Chat"**
- Shows the chat interface with a pre-scripted conversation
- User message appears (typing animation, 60ms per character): "Summarize today's support tickets"
- Agent responds with a formatted reply (streams in word-by-word, 30ms per word): "You had 12 support tickets today. 8 resolved, 3 in progress, 1 escalated. The most common issue was password resets (4 tickets)."
- A second exchange auto-plays after 2s pause
- Sidebar "Chat" item has an active indicator (green dot)

**Scenario B — "Channel Setup"**
- Shows the channel configuration page
- WhatsApp card status changes from "Disconnected" (red badge) to "Connecting..." (yellow, with spinner) to "Connected" (green badge with checkmark) over 3 seconds
- Telegram and Discord cards already show "Connected" (green)
- A notification toast slides in: "WhatsApp connected successfully"
- The channel count updates from "5/7 Connected" to "6/7 Connected"

**Scenario C — "Monitoring"**
- Shows the VPS monitoring dashboard
- CPU usage chart draws a line in real-time (smooth, not jumpy), hovering around 12-18%
- RAM bar fills to 34% with a smooth animation
- Uptime counter ticks: "14d 7h 23m" incrementing the minutes
- Gateway health badge pulses green
- A "Restart" button is visible but never clicked (shows capability without action)

**Transition between scenarios:** Cross-fade (300ms). The sidebar active indicator moves to match the current scenario.

**Below the demo — Numbered feature deep-dive links (pattern 3c):**
- "1. Agent Chat" | "2. Channel Setup" | "3. VPS Controls" | "4. Monitoring" | "5. Agent Store" | "6. Billing"
- Clicking any number opens a slide-up detail sheet with full feature description, a larger screenshot/mockup, and bullet points

---

#### 4. CODE SNIPPET DEMOS — Where and How

Code snippets appear in two locations on the landing page, each with a different purpose.

**Location A: API Access showcase (for Pro features section)**

Uses the Resend IDE Split Panel pattern (4d).

- Window chrome with three dots, title: "api-example.py"
- File tabs on the left sidebar: `send-message.py`, `list-agents.js`, `webhook-setup.sh`, `deploy-agent.curl`
- Default tab: `send-message.py`
- Code panel (left): syntax-highlighted Python with line numbers
- Preview panel (right): the API response JSON, formatted and highlighted

**Code content for `send-message.py`:**

```python
import requests

response = requests.post(
    "https://yourname.clawhq.tech/api/chat",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "agent": "support-bot",
        "message": "What is the refund policy?"
    }
)

print(response.json())
```

**Preview panel shows:**

```json
{
  "status": "success",
  "agent": "support-bot",
  "response": "Our refund policy allows...",
  "tokens_used": 847,
  "response_time_ms": 312
}
```

**Animation:** When the tab is active (or on scroll-in), the code types in line by line (50ms per character, skip whitespace). After the code finishes, the preview panel fades in with the JSON response. Total sequence: ~4 seconds. After completing, it holds for 3 seconds, then the user can click another file tab to see a different example.

**Other file tab contents:**
- `list-agents.js` — JavaScript fetch call listing deployed agents, preview shows an array of agent objects
- `webhook-setup.sh` — cURL command creating a webhook endpoint, preview shows the created webhook config
- `deploy-agent.curl` — cURL command deploying an agent, preview shows deployment confirmation

**Location B: Quick integration preview (in the How It Works section)**

A smaller, simpler code block — not a full IDE panel. Just a dark rounded card with a single code snippet showing how fast it is to connect a channel or deploy an agent.

**Content:**

```
# Connect WhatsApp in your dashboard
# No code needed — but here is what happens behind the scenes

POST /api/channels/connect
{
  "channel": "whatsapp",
  "phone": "+1234567890"
}

// Response: { "status": "connected", "channel_id": "wha_9x8..." }
```

**Animation:** Fade-in on scroll. No typing effect — this one should be readable immediately. The point is "look how simple the integration is," not "watch us type."

---

#### 5. SCROLL-TRIGGERED ANIMATIONS — Section-by-Section Behavior

All scroll animations use Intersection Observer with a threshold of 0.15 (element is 15% visible before triggering). No animation replays — once triggered, it stays in final state.

**Global scroll behavior:**

| Scroll Event | Animation | Duration | Easing |
|---|---|---|---|
| Section enters viewport | Content fades up from 30px below, opacity 0 to 1 | 500ms | ease-out |
| Section heading enters | Heading fades in first, body text 150ms later | 400ms | ease-out |
| Cards enter viewport | Staggered reveal — each card delays 100ms after the previous | 400ms per card | ease-out |
| Stats/numbers enter | Count-up animation from 0 to final number | 1200ms | ease-in-out |
| Images/mockups enter | Scale from 0.95 to 1.0 + fade in | 600ms | spring (slight overshoot) |

**Section-specific scroll animations:**

**Hero to Logo Bar transition:** As the user scrolls past the hero, the logo bar fades in from below. The logos should already be mid-scroll (not starting from the left edge) to feel like they have always been moving.

**How It Works cards:** Each step card (pattern 1) triggers independently. The card slides up, then the internal content (left text, right visual) fades in with a 200ms stagger. The step number on each card scales from 0.8 to 1.0 with a spring bounce.

**Bento Grid (features):** The grid cards use a staggered reveal — top-left card first, then top-center, top-right, bottom-left, etc. Each card delays 80ms. On mobile (single column), cards reveal one at a time as they scroll into view.

**Pricing section:** The pricing toggle (Monthly/Annual) does not animate on scroll — it waits for user interaction. The pricing cards themselves fade up with a stagger. When the user toggles Annual, the price numbers animate (count down from monthly to annual equivalent) over 400ms.

**Stats section (pattern 6):** The stat numbers count up from 0 when the section enters viewport. The first stat visualization begins playing immediately. Auto-cycling starts only after the count-up completes.

**CTA + Giant Text (pattern 4f):** The CTA card fades in normally. The giant "CLAWHQ" text is always rendered but invisible (same color as background). The cursor spotlight effect activates as soon as the section is in viewport — no scroll trigger needed, it responds to mouse position. On mobile (no cursor), the text does a slow left-to-right light sweep animation on a 6-second loop instead.

**Parallax elements:** The floating channel/model icons behind the CTA section (pattern 7) move at 0.3x scroll speed (slower than content), creating depth. Icons closer to the edges move slower (0.2x), icons near center move faster (0.4x). This is the only true parallax on the page — use it sparingly.

---

#### 6. INTERACTIVE ELEMENTS — Tabs, Toggles, Hovers, Expansions

**Element 1: Dashboard Demo Tab Toggle (pattern 9 — Claude)**

- Location: Inside the dashboard mockup component
- Three pill-shaped tabs: "Agent Chat" | "Channels" | "Monitoring"
- Active tab: white text, subtle background fill (#1a1a1f), bottom border accent
- Inactive tabs: gray text (#666), no background
- On click: content cross-fades (300ms), the active indicator slides horizontally to the new tab position (200ms spring ease)
- The tab bar lives INSIDE the mockup window chrome, not outside it — this is key to the Claude pattern (9)

**Element 2: Pricing Toggle (Monthly/Annual)**

- Location: Above the pricing cards
- Two-option pill toggle: "Monthly" | "Annual"
- Active state: filled background, white text
- On toggle: price numbers in all tier cards animate simultaneously. Monthly-to-Annual counts down (e.g., $59 counts down to $50/mo equivalent). Annual-to-Monthly counts up. Duration: 400ms.
- The "Save X%" badge on the Annual option pulses once on page load to draw attention

**Element 3: Feature Bento Grid Hover Effects (pattern 8 — Supabase)**

Each card in the bento grid has a unique hover animation. These are the recommended per-card hover behaviors:

| Card | Feature | Hover Animation |
|---|---|---|
| Large card (2-col span) | AI Models | Model name badges (Kimi K2.5, MiniMax M2.5) glow with a soft colored border. A "128K context" label pulses. Lines connecting model badges to an "Agent" node animate in, showing the flow. |
| Medium card 1 | Agent Store | Agent cards in the visual shuffle/reorder as if being browsed. A "Deploy" button on one card gets a green pulse ring. |
| Medium card 2 | Channels | Channel icons (WhatsApp, Telegram, Discord, etc.) light up one by one in sequence, each getting a green checkmark. Takes 2 seconds for all 7 to activate. |
| Bottom card 1 | VPS Controls | The start/stop/restart buttons get a subtle glow. The CPU chart line starts moving. The uptime counter ticks forward. |
| Bottom card 2 | Agent Chat | Chat bubbles slide in from left and right, simulating a conversation. 2 exchanges over 3 seconds. |
| Bottom card 3 | Monitoring | Chart lines draw themselves. Bar charts fill up. Status badge pulses green. |
| Bottom card 4 | Support | A ticket card slides in from the right with a "New" badge. Status changes from "Open" to "In Progress" with a color shift. |

**Mobile fallback:** On touch devices, these hover animations play once on scroll-in instead of on hover. Each card animates as it enters the viewport, then holds its final state.

**Element 4: FAQ Accordion**

- Location: Near the bottom of the page, before the final CTA
- Each question is a clickable row with the question text and a chevron icon on the right
- On click: the answer area expands with a smooth height transition (250ms ease-out). The chevron rotates 180 degrees. Any previously open answer collapses simultaneously.
- Only one answer open at a time — this keeps the section compact and focused
- First question is open by default on page load (reduces bounce — the visitor sees an answer immediately)

**Element 5: Feature Deep-Dive Sheets (pattern 3c — Linear)**

- Triggered by clicking numbered feature links below the dashboard demo
- Sheet slides up from the bottom of the viewport (400ms ease-out)
- Dark overlay behind the sheet (opacity 0.6, click to close)
- Sheet has a drag handle at the top and an X close button
- Content inside the sheet scrolls independently
- Close animation: slide down (300ms) + overlay fade out
- On mobile: sheet takes full viewport height (bottom sheet pattern). On desktop: sheet is 70% viewport height, centered horizontally with max-width 800px.

**Element 6: Sticky Nav Section Indicators (pattern 5 — Neon)**

- When a section becomes active (enters the center third of the viewport), the corresponding label in the sticky nav gets: white text, a small dot/bullet to the left, and a subtle left border accent
- The transition between active states is a 200ms crossfade — the dot slides vertically from the previous label to the new one
- Clicking a label smooth-scrolls to the target section (600ms duration, ease-in-out)

---

#### 7. PERFORMANCE CONSIDERATIONS — Weight, Cost, and Mobile Fallbacks

**Lightweight animations (build these without concern):**

| Animation | Technique | Performance Cost |
|---|---|---|
| Fade-in on scroll | CSS opacity + transform, triggered by Intersection Observer | Negligible. GPU-composited. |
| Slide-up reveals | CSS translateY + opacity | Negligible. GPU-composited. |
| Hover color/glow changes | CSS transition on border-color, box-shadow | Negligible. |
| FAQ accordion | CSS max-height transition | Negligible. |
| Pricing toggle count | JavaScript requestAnimationFrame number interpolation | Very low. Pure math. |
| Sticky nav active state | CSS class swap on scroll | Very low. |
| Tab switching | CSS opacity crossfade + class toggle | Very low. |

**Medium-weight animations (build carefully, test on low-end devices):**

| Animation | Technique | Performance Cost | Mitigation |
|---|---|---|---|
| Dashboard demo auto-play | JavaScript timeline with DOM updates (typing, status changes) | Medium. Frequent DOM writes. | Use requestAnimationFrame. Pause when not in viewport (Intersection Observer). |
| Bento grid hover animations | CSS animations + minor JS for sequencing | Medium. Multiple simultaneous animations possible. | Use will-change on hover-target elements. Remove will-change on mouse-leave. |
| Logo bar infinite scroll | CSS translateX animation, duplicated logo set | Low-medium. Continuous animation. | Use CSS animation (not JS). Pause when tab is not visible (Page Visibility API). |
| Code typing effect | JavaScript interval updating text content | Low-medium. String manipulation on interval. | Only run when in viewport. Clear interval on scroll-out. |
| Stats count-up | JavaScript requestAnimationFrame | Low. One-time. | No mitigation needed. |

**Heavy animations (build last, consider skipping on mobile):**

| Animation | Technique | Performance Cost | Mobile Fallback |
|---|---|---|---|
| Cursor-following spotlight on giant text | JavaScript mousemove listener + CSS radial-gradient update | High on mouse-heavy usage. Continuous recalculation. | Replace with slow left-to-right sweep animation on CSS loop (no JS). |
| Parallax floating icons | JavaScript scroll listener + translateY on multiple elements | High. Runs on every scroll frame. | Disable entirely on mobile. Show icons in a static grid layout instead. |
| Stripe cycling stats visualizations | Canvas/SVG animations per stat, 4 different animations | High. Complex rendering. | Show one static visualization per stat. No auto-cycling — user taps to switch. |
| Linear multi-scenario showcase (if used) | Complex orchestrated JS timeline with DOM manipulation | Very high. | Show a single scenario as a static mockup with a "Watch demo" button linking to a video. |
| Live-updating feature grid cards (pattern 4b) | Continuous JS intervals updating DOM | Medium-high when multiple cards animate simultaneously. | Run animations sequentially (one card at a time) instead of simultaneously. |

**Global performance rules:**
1. All scroll-triggered animations must use Intersection Observer, never scroll event listeners with calculations.
2. All continuous animations must pause when the browser tab is not visible (Page Visibility API).
3. All continuous animations must pause when the element is not in viewport (Intersection Observer).
4. Use CSS transforms and opacity for all motion — never animate width, height, top, left, or margin.
5. Prefers-reduced-motion media query: disable ALL motion except essential state changes (tab switching, accordion open/close). Replace fade-ins with instant appearance. Replace typing effects with instant text.
6. Mobile breakpoint (below 768px): disable parallax, disable cursor effects, convert hover animations to scroll-triggered one-shot animations.
7. Target: 60fps on a 2020 mid-range Android phone. If an animation drops below this on testing, simplify or remove it.

---

#### 8. ANIMATION PRIORITY LIST — Impact vs Effort, Build Order

Ranked by (impact on conversion and perceived quality) divided by (engineering effort). Build in this order.

**TIER 1 — Build first. High impact, low-medium effort.**

| Priority | Animation | Impact | Effort | Why First |
|---|---|---|---|---|
| 1 | Hero staggered fade-in | High | Low | First impression. 30 minutes of CSS. Sets the tone for the entire page. |
| 2 | Scroll-triggered section reveals (all sections) | High | Low | Without this, the page feels dead on scroll. One reusable component, applied everywhere. |
| 3 | FAQ accordion | Medium-high | Low | Directly answers objections. 15 minutes of JS/CSS. Reduces bounce. |
| 4 | Pricing toggle with number animation | High | Low-medium | Directly tied to conversion. Users click this — the animation reinforces the value of annual pricing. |
| 5 | Tab switching (dashboard demo tabs + pricing tabs) | High | Medium | Core interactive element. Without tabs, the demo and pricing sections are static walls of content. |

**TIER 2 — Build second. High impact, medium effort.**

| Priority | Animation | Impact | Effort | Why Second |
|---|---|---|---|---|
| 6 | Dashboard demo auto-play (3 scenarios) | Very high | Medium-high | The centerpiece of the page. This is what sells the product. But it requires scripted content, timing, and multiple mockup states. |
| 7 | Bento grid hover animations | High | Medium | Makes the features section feel alive. Each card needs a unique animation, but they can be simple CSS transitions. |
| 8 | Code snippet typing effect (IDE panel) | Medium-high | Medium | Developers love watching code type in. Signals "this is a real API." But it only matters if the API section is above the fold for the target audience. |
| 9 | Logo/channel bar infinite scroll | Medium | Low | Easy to build (pure CSS), adds subtle life to the page. Lower priority because it does not directly drive conversion. |
| 10 | Stats count-up numbers | Medium | Low | Satisfying visual, but depends on having meaningful stats to count. Quick to implement. |

**TIER 3 — Build third. Medium impact, medium-high effort.**

| Priority | Animation | Impact | Effort | Why Third |
|---|---|---|---|---|
| 11 | Sticky section nav (Neon pattern) | Medium | Medium | Improves navigation on long pages. But the page must be long enough to justify it. Build after all sections exist. |
| 12 | Feature deep-dive slide-up sheets | Medium | Medium | Adds depth. But only matters if the numbered feature links exist and the content is written. |
| 13 | Live-updating feature grid cards (Pro section) | Medium-high | Medium-high | Impressive but complex. Continuous DOM updates need careful optimization. |

**TIER 4 — Build last (or never). Lower impact, high effort.**

| Priority | Animation | Impact | Effort | Why Last |
|---|---|---|---|---|
| 14 | Cursor-following spotlight on giant text | Low-medium | Medium | Memorable but does not drive conversion. Pure delight. Build only if time allows. |
| 15 | Parallax floating icons (CTA section) | Low | Medium | Visual flair only. Disabled on mobile (half the audience never sees it). |
| 16 | Stripe cycling stats with unique visualizations | Medium | High | Four different animated visualizations is effectively four separate animation projects. Consider building one and showing the others as static. |
| 17 | Multi-scenario showcase (Linear 3e) | High | Very high | The most complex animation on the page. Multiple scripted scenarios with orchestrated DOM manipulation. Save for v2 of the landing page. |

**Summary: The first 5 items cover 80% of the perceived quality. Items 6-10 bring it to 95%. Items 11-17 are polish.**

---

#### 9. STICKY NAVIGATION PLAN — Section Index (Pattern 5, Neon)

**What it is:** A vertical list of section labels pinned to the left side of the viewport. It appears when the user scrolls into the main content sections and disappears when they scroll past them (into the footer/CTA area).

**Visible during these sections:**
- Features Overview (Bento Grid)
- Dashboard Demo
- Pro Upgrade Section
- Pricing
- API/Code Examples
- Trust/Transparency

**Hidden during:**
- Hero (too early — the nav would be distracting)
- Logo Bar (too early)
- How It Works (transitional section — nav not needed yet)
- FAQ (too late — user is wrapping up)
- Final CTA + Footer (closing section — nav would compete with the CTA)

**Section labels (in order):**
1. Features
2. Dashboard
3. Pro Tools
4. Pricing
5. API
6. Trust

**Visual design:**
- Position: fixed, left side, vertically centered
- Width: 120px max
- Each label: 14px Geist, gray (#555) by default
- Active label: white (#fff), small dot (4px circle) to the left, subtle left border (2px, accent color)
- Transition between active states: dot slides vertically (200ms), text color fades (150ms)
- Container: no background, no border — the labels float directly on the page

**Appear/disappear behavior:**
- Appears: when the top of "Features Overview" section crosses 80% from the top of the viewport. Fades in over 300ms.
- Disappears: when the bottom of "Trust/Transparency" section crosses 20% from the top of the viewport. Fades out over 300ms.
- On mobile (below 1024px): the sticky nav is hidden entirely. The page is single-column and the nav would overlap content. Instead, show a small floating "scroll to top" button in the bottom-right corner after the user scrolls past the hero.

**Click behavior:** Clicking any label smooth-scrolls to the corresponding section. Scroll duration: 600ms with ease-in-out. The active label updates immediately on click (does not wait for scroll to complete).

**Scroll tracking:** Use Intersection Observer on each section heading. When a heading crosses into the middle third of the viewport (33%-66%), its corresponding nav label becomes active. This prevents the active state from flickering when sections are partially visible.

---

