### 1.1 Starter $59 — Features Deep Dive

**Analysis source:** Full codebase review of dashboard pages, API routes, sidebar navigation, VPS controls, model config, agent store/manager, channel manager, support tickets, billing, and account settings.

---

#### COMPLETE STARTER FEATURE LIST (verified from code)

**Feature 1: Dedicated VPS Instance**
- What it is: Every Starter customer gets their own isolated server with 2 vCPU, 8 GB RAM, 100 GB NVMe storage, and 8 TB bandwidth. Not shared hosting — a real dedicated machine.
- Upgradable: 2->4 vCPU, 8->16 GB RAM, 100->200 GB NVMe, 8->16 TB bandwidth.
- Suggested Headline: "Your Own Dedicated Server"
- Description: "Not shared hosting. Your OpenClaw runs on a dedicated VPS with 2 vCPU, 8 GB RAM, and 100 GB NVMe storage — all yours."
- Visual: Animated server rack icon that "powers on" with specs appearing one by one (CPU, RAM, Storage, Bandwidth). Pulsing green status dot.
- Stat to show: "2 vCPU / 8 GB RAM / 100 GB NVMe / 8 TB Bandwidth"

---

**Feature 2: Full VPS Controls Dashboard**
- What it is: Start, stop, restart your OpenClaw instance from the browser. Real-time monitoring with live CPU/RAM/Disk/Network charts (updated every 10 seconds). Gateway health status. Uptime display. Viewable gateway logs (200 lines). Instance details panel.
- Suggested Headline: "Full Control From Your Browser"
- Description: "Start, stop, restart your instance with one click. Watch real-time CPU, RAM, disk, and network charts update live. View gateway logs and uptime — all from your dashboard."
- Visual: Animated dashboard mockup showing the VPS controls card with a pulsing green "Running" badge, live-updating CPU/RAM area charts, and network I/O rates. Show the Start/Stop/Restart buttons.
- Stats to show: "Real-time monitoring / 10s refresh / Live charts"

---

**Feature 3: Bundled AI Models (No API Keys Needed)**
- What it is: Starter includes bundled AI models — Kimi K2.5, MiniMax M2.5, plus a rotating third model. 128K context window. No need to bring your own API key, no separate API bills. 1 model change per billing cycle (queued for next cycle).
- Suggested Headline: "AI Models Included — Zero API Bills"
- Description: "Kimi K2.5, MiniMax M2.5, and more — all bundled in. 128K context window. No API keys to manage, no surprise bills. Just pick your model and go."
- Visual: Model selector card showing 2-3 model cards with names, context limits, and an "Active" badge on the current one. Animate the selection/switch flow.
- Stats to show: "3 models included / 128K context / $0 extra API costs"

---

**Feature 4: 7 Messaging Channel Integrations**
- What it is: Connect your OpenClaw to WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat. Self-service setup for Telegram, Discord, Slack, Teams, and Webchat (enter your bot token, click Connect). WhatsApp and Signal require admin setup via support ticket. Health check system to verify channel status.
- Suggested Headline: "Connect Every Channel"
- Description: "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — connect your AI assistant to all the platforms your customers use. Self-service setup for most channels."
- Visual: Horizontal row of 7 channel icons (each platform logo) that animate to "connected" state with green checkmarks one by one. Or a channel grid with status badges.
- Stats to show: "7 channels supported / Self-service setup / Health monitoring"

---

**Feature 5: Agent Store & Deployment**
- What it is: Browse and purchase AI agents (free and premium) from the built-in store. Deploy/undeploy agents to your instance with one click. Agents are categorized and filterable. Agent config is editable. Usage analytics per agent (total messages, errors, avg response time, error rate, daily charts).
- Suggested Headline: "AI Agents, Ready to Deploy"
- Description: "Browse the Agent Store for pre-built AI agents — from customer support to lead generation. Purchase, deploy, and manage them with one click. Track performance with built-in analytics."
- Visual: Agent store grid showing 3-4 agent cards with names, categories, prices, and "Add to Library" / "Deploy" buttons. Animate the purchase-to-deploy flow.
- Stats to show: "One-click deploy / Usage analytics / Free & premium agents"

---

**Feature 6: Agent Chat**
- What it is: Chat directly with your deployed agents from the ClawHQ dashboard. Select which agent to talk to. Full chat interface built in.
- Suggested Headline: "Chat With Your Agents"
- Description: "Test and interact with your deployed agents directly from the dashboard. No need to switch apps — just pick an agent and start chatting."
- Visual: Chat interface mockup with message bubbles, agent name in header, and a text input. Show a conversation flow.

---

**Feature 7: Full OpenClaw Dashboard Access**
- What it is: Direct link to the native OpenClaw dashboard running on your VPS. All OpenClaw features, skills, plugins, and ClawHub access. Custom domain or DuckDNS link. Password-protected with changeable credentials. SSL certificate with built-in checker.
- Suggested Headline: "Full OpenClaw Access"
- Description: "Your complete OpenClaw dashboard — all skills, plugins, and ClawHub access included. Access via your custom domain with SSL. No restrictions."
- Visual: Browser window mockup showing an OpenClaw dashboard with the custom domain in the address bar and a green SSL lock icon.

---

**Feature 8: Support Ticket System**
- What it is: Create support tickets with subject, description, and priority (low/medium/high). Track ticket status (open/in_progress/resolved/closed). Threaded conversation with admin replies. Full ticket history.
- Suggested Headline: "Support When You Need It"
- Description: "Raise a ticket from your dashboard and track it to resolution. Threaded conversations with our team — no email chains, no waiting."
- Visual: Ticket card showing subject, status badge (green "Resolved"), and a mini conversation thread preview.

---

**Feature 9: Billing & Subscription Management**
- What it is: View current plan, billing cycle, next payment date, subscription status. Payment history. Monthly ($59/mo) or annual ($599/yr — save $109/yr) billing.
- Suggested Headline: "Transparent Billing"
- Description: "See exactly what you're paying, when your next payment is, and your full payment history. Monthly or annual — no hidden fees."
- Visual: Billing card showing plan name, price, next renewal date, and a "Save $109/yr" badge for annual toggle.
- Stats to show: "$59/mo or $599/yr (save $109)"

---

**Feature 10: Account Management**
- What it is: Update name, email, password. View OpenClaw dashboard URL and hostname. Plan summary.
- Suggested Headline: "Your Account, Your Control"
- Description: "Manage your profile, change your password, and view your instance details — all in one place."

---

**Feature 11: Managed Infrastructure (Zero DevOps)**
- What it is: Fully managed updates, backups, auto-restart on crash (Docker --restart=always). No SSH access needed — ClawHQ handles all server management. Automated provisioning pipeline (DNS, firewall, SSL, OpenClaw install — 12 automated steps).
- Suggested Headline: "Zero DevOps Required"
- Description: "We handle everything — server setup, updates, backups, and crash recovery. Your OpenClaw auto-restarts if it ever goes down. No terminal, no SSH, no headaches."
- Visual: Split comparison: left side shows a terminal with complex Docker/SSH commands (crossed out), right side shows the clean ClawHQ dashboard with a "Running" badge.
- Stats to show: "Auto-restart / Managed updates / Automated provisioning"

---

**Feature 12: Custom Domain / Subdomain**
- What it is: Your OpenClaw is accessible on a DuckDNS link or your own custom domain. SSL certificate included and monitored.
- Suggested Headline: "Your Domain, Your Brand"
- Description: "Access your OpenClaw on your own domain or a free subdomain. SSL certificate included and monitored."

---

#### STRONGEST SELLING POINTS FOR STARTER (ranked)

1. **Bundled AI Models — No API Bills** — THE killer differentiator. Every competitor either charges per-token, requires BYOK, or gives limited credits. ClawHQ bundles models with no extra cost. Lead with this.
2. **Dedicated VPS (Not Shared)** — At $59/mo, getting your own 2vCPU/8GB server is genuinely competitive. Most competitors offer shared hosting at similar prices.
3. **7 Messaging Channels Included** — WhatsApp + Telegram + Discord + Slack + Teams + Signal + Webchat, all included. Most competitors support 1-2.
4. **Zero DevOps / Fully Managed** — The target user does not want to SSH into servers. "We handle everything" removes the biggest barrier to adoption.
5. **Agent Store & One-Click Deploy** — Pre-built agents that deploy instantly. No one else in the competitive landscape offers this.
6. **Real-Time VPS Monitoring** — Live charts, gateway health, logs — shows professionalism and gives users confidence their money is well spent.

---

#### DATA / STATS / NUMBERS TO SHOW ON LANDING PAGE

| Stat | Where to Show | Purpose |
|------|---------------|---------|
| $59/mo or $599/yr | Pricing card | Anchor price |
| Save $109/yr with annual | Pricing card toggle | Push annual conversion |
| 2 vCPU / 8 GB RAM / 100 GB NVMe | Specs section or pricing card | Justify the price |
| 8 TB bandwidth | Specs section | Show generosity |
| 3 AI models included | Feature bullet | Differentiate from BYOK competitors |
| 128K context window | Feature bullet | Show capability |
| 7 channels supported | Feature bullet | Show breadth |
| $0 API costs | Feature bullet | The "no hidden fees" angle |
| 24hr setup time | How It Works section | Set expectations |
| Auto-restart on crash | Trust/reliability section | Show reliability |
| 10s monitoring refresh | Feature detail | Show real-time capability |

---

#### SUGGESTED COPY FOR FEATURE CARDS / BULLETS

**For the pricing card bullet list (short, scannable):**
- Dedicated VPS — 2 vCPU, 8 GB RAM, 100 GB NVMe
- 3 AI models included (Kimi K2.5, MiniMax M2.5 + more)
- 128K context window
- 7 messaging channels (WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat)
- Full OpenClaw dashboard access — all skills & plugins
- Agent Store — browse, buy, and deploy AI agents
- Chat with your agents from the dashboard
- Real-time server monitoring with live charts
- Start / Stop / Restart from your browser
- Custom domain or free subdomain with SSL
- Managed updates, backups & auto-restart
- Support via dashboard tickets
- No API keys needed — no extra bills

**For a hero sub-headline or value prop:**
"All-inclusive AI hosting. Dedicated server, bundled models, 7 channels, agent store — $59/mo. No API keys. No DevOps. No surprises."

**For a comparison-style callout:**
"Other platforms charge $59/mo and then hit you with API costs, token limits, and BYOK requirements. ClawHQ includes everything."

**For a "What's included" expandable section:**
"Your Starter plan includes a dedicated 2 vCPU / 8 GB RAM server, 3 bundled AI models with 128K context, connections to 7 messaging platforms, a full-featured dashboard with real-time monitoring, access to the Agent Store, chat with your agents, managed backups and updates, custom domain with SSL, and dashboard-based support. No API keys, no DevOps knowledge, no hidden costs."

**For an objection-handling FAQ:**

Q: "Do I need my own API keys?"
A: "No. AI models are bundled with your plan at no extra cost. You can also bring your own keys if you prefer."

Q: "Is this shared hosting?"
A: "No. Every customer gets a dedicated VPS. Your server resources are yours alone."

Q: "What channels can I connect?"
A: "WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat. Connect as many as you want."

Q: "Can I change my AI model?"
A: "Yes. Starter plan allows 1 model change per billing cycle, applied at your next renewal."

Q: "What if my server crashes?"
A: "It auto-restarts. We also handle all updates and backups for you."
