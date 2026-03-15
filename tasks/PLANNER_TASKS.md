# Planner Tasks — Things WE Do (Not Agents)

**Owner:** Planner (me + you)
**Last updated:** 2026-03-15

These are tasks that require product thinking, creative writing, or strategic decisions — not coding. Coding agents can't do these well.

---

## TODO

### 1. Create 7 Pre-Built Store Agents

**Status:** Not started
**Blocked by:** Nothing — can do anytime
**Needed by:** 59 agent (Store page needs agents to exist)
**Output file:** `tasks/STORE_AGENTS_SEED.md`

Write full OpenClaw config files for 7 agents. Each needs:
- **SOUL.md** (30-50 lines) — personality, responsibilities, communication style, boundaries, escalation rules
- **identity.md** — name, theme, emoji
- **TOOLS.md** — allowed tools list (role-appropriate)
- **config.json** — model, sandbox, tool allow/deny
- **Store listing** — name, description (1-2 sentences), category
- **SQL INSERT** — ready to run against Supabase

| Agent | Category | Personality | Key Tools |
|-------|----------|-------------|-----------|
| Support Agent | Support | Friendly, patient, empathetic. Handles refunds, FAQs, order issues. Escalates when stuck. | read, web, memory_search |
| Research Agent | Research | Thorough, analytical, cites sources. Searches web, analyzes findings, writes summaries. | browser, web, read, write, memory_search |
| Writer Agent | Content | Creative, brand-aware, adaptable tone. Blog posts, emails, social media, marketing copy. | write, edit, read |
| Data Agent | Data | Precise, methodical, detail-oriented. Data cleaning, reports, analysis, structured output. | read, exec, write, memory_search |
| Sales Agent | Sales | Persuasive but not pushy, warm, goal-oriented. Lead qualification, outreach, follow-ups. | write, browser, memory_search |
| Reviewer Agent | Review | Critical but constructive, thorough. Reviews content/code, provides structured feedback. | read, memory_search, memory_get |
| Manager Agent | Management | Strategic, organized, clear communicator. Routes tasks, coordinates, delegates. | subagents, agents_list, sessions_list, write |

**Quality bar:** These agents are the FIRST thing users deploy. If they're bad, users think ClawHQ is bad. Each SOUL.md must be genuinely useful — not generic placeholder text.

**ALSO needed per agent (for Store Enhancement 5.5):**
- `sample_conversation` — 4-6 message scripted conversation showing the agent in action. Stored as JSONB array: `[{ role: "user", content: "..." }, { role: "assistant", content: "..." }]`. These are displayed in the Store detail page "Preview" tab so users can see how the agent behaves before deploying.

---

### 2. Review Landing Page Content

**Status:** Not started
**Blocked by:** Nothing
**Needed by:** Launch

Review all landing page content (written by content agents earlier) for:
- Accuracy (does it match what we actually built?)
- Pricing (still $59/$129/$350?)
- Feature claims (anything we removed like Smart Routing?)
- No provider names exposed
- Terms of Service / Privacy Policy content (placeholder pages exist, need real content)

---

### 3. Define Rate Limits Per Tier

**Status:** Not started
**Blocked by:** Understanding Ollama Cloud plan limits
**Needed by:** All agents (rate limiting is implemented but values may need tuning)

Decide actual rate limit numbers:

| Action | Starter (1x) | Pro (5x) | Ultra (10x) |
|--------|-------------|---------|-----------|
| Chat messages/min | ? | ? | ? |
| API requests/min | N/A | ? | ? |
| Agent deploys/day | ? | ? | ? |
| KB uploads/day | N/A | ? | ? |

Based on Ollama Cloud plan limits:
- Starter uses $20/mo Ollama plan
- Pro uses $40/mo (2x)
- Ultra uses $100/mo Ollama plan

---

### 4. Write Terms of Service & Privacy Policy

**Status:** Not started
**Blocked by:** Nothing
**Needed by:** Launch — 59 agent builds the page layouts, we provide the text
**Output file:** `tasks/LEGAL_CONTENT.md`

Write actual legal content for:
- Terms of Service (what users agree to, refund policy, acceptable use, SLA guarantees)
- Privacy Policy (what data we collect, where it's stored, cookies, GDPR rights)
- Data Processing Agreement (for GDPR if needed)

**Key points to include:**

**Terms of Service:**
- Service description: managed OpenClaw hosting with dedicated VPS
- Payment terms: monthly/annual, no refunds after 7 days, cancellation via support
- Acceptable use: no illegal activity, no abuse of AI models, no reselling
- SLA: 99.9% uptime target (VPS runs 24/7)
- Limitation of liability: standard SaaS limits
- Data ownership: user owns their data, we host it on their VPS
- Account termination: we can terminate for violations, user can delete via Account settings

**Privacy Policy:**
- Data we collect: email, name, payment info (via payment provider), IP addresses
- Data we DON'T access: user conversations, KB documents, agent configs — all on user's VPS
- Data storage: account data in our database (Supabase), user content on their dedicated VPS
- Cookies: essential auth cookies only, no tracking cookies, no third-party analytics
- GDPR rights: export data (Account → Data Export), delete account (Account → Delete), data on user's VPS is their responsibility
- Third parties: payment provider (Razorpay/Stripe), DNS (no user data shared)
- Data retention: support tickets auto-delete 48hrs after resolved, account data deleted on account deletion
- Contact: support@clawhq.tech

**Privacy selling point:** "Your data stays on YOUR server. We don't access your conversations, documents, or agent configs."

---

### 5. Seed Database with Available Models

**Status:** Not started
**Blocked by:** Knowing which models are available via Ollama Cloud
**Needed by:** 59 agent (Models page reads from `available_models` table)

Insert available models into `available_models` table with:
- name, description, capabilities, strengths, context_window, speed_rating, best_for
- These are the models users see when switching (Models page enhancement 3.1)

Current models: Kimi K2.5, MiniMax M2.5, + 1 rotating
Need to verify exact model list from Ollama Cloud API.

---

### 6. Competitive Pricing Review

**Status:** Not started
**Blocked by:** Nothing
**Needed by:** Before launch

Compare our pricing vs competitors:
- Are we underpricing Pro at $129 with 91 features?
- Is $350 Ultra competitive vs crew.ai, AgentOps?
- Should Starter be $49 or $59?
- Annual pricing still correct? ($599/$1299/$3499)

---

### 7. Plan 59 Remaining Pages

**Status:** COMPLETED ✅
All pages planned with detailed enhancement files.

---

### 8. Landing Page & Website Full Overhaul

**Status:** Not started
**Blocked by:** Nothing — can start anytime
**Needed by:** Launch
**Output:** Full implementation by a dedicated landing page agent (not the 59 agent)
**Full spec:** `tasks/59/LANDING_ENHANCEMENT_59.md`

This is a separate task from the 59 agent's dashboard enhancements. The landing page needs:

**Content:** Update ALL feature sections with 85+ Starter / 91 Pro / 98+ Ultra features. Update pricing cards. Update FAQ. Update differentiators with concrete numbers.

**Product Visuals:** Build animated React mockup components showing the dashboard in action. DashboardMockup, ChatMockup (streaming animation), AgentStoreMockup, ChannelMockup, KanbanMockup (Ultra), AnalyticsMockup (Pro), CodeBlockMockup (API), VPSHealthMockup.

**Libraries & tools to use — unlimited budget:**
- Component libraries: 21st.dev, tweakcn, Magic UI, Aceternity UI, React Elements
- Animation: GSAP (ScrollTrigger, TextPlugin, SplitText), Framer Motion, Lottie
- 3D: Three.js + @react-three/fiber + @react-three/drei (particle field, 3D device mockup)
- Quality bar: must look like Linear.app / Vercel.com / Supabase.com — not a template

**Navigation:** Fix dead links, smooth scroll to sections, sticky nav with blur, remove "Blog" link, add "Docs" link.

**New Sections:** Product Tour (tabbed mockup showcase), Before/After comparison, Enhanced Channel showcase.

**New Pages:**
- `/docs` — documentation site (sidebar + ~15 content pages)
- `/terms` — Terms of Service (content from task #4)
- `/privacy` — Privacy Policy (content from task #4)

**Performance:** Lazy load 3D/GSAP, disable heavy animations on mobile, prefers-reduced-motion support.

**This should be given to a DEDICATED landing page agent** — not the 59 agent (who handles dashboard pages). The landing page agent reads `tasks/59/LANDING_ENHANCEMENT_59.md` for the full spec.

---

### 9. Admin Panel Full Overhaul

**Status:** Not started — needs full planning session (same depth as 59/129/350)
**Blocked by:** Nothing
**Needed by:** Launch
**Scope:** Separate agent (not 59, 129, or 350)

**Current state:** Basic admin with: stats overview, customer list, deploy page, tickets, audit logs, 2FA. Has security issues (Hostinger VM ID exposed, Ollama in dropdown, SSH passwords in plaintext React state, hardcoded IPs).

**What's needed (discussed with user):**
- Full customer detail view — see EVERYTHING about a customer: VPS status, agents deployed, channels connected, model config, KB docs, chat activity, subscription, payments, support tickets, usage stats
- Debug access — see customer passwords (VPS dashboard password, OpenClaw credentials) for debugging purposes
- Remove exposed provider names (Hostinger, Ollama) from admin UI too
- Remove hardcoded IPs (use RFC 5737 examples)
- Clean up unwanted/outdated data fields
- Add missing management features: bulk actions, customer search/filter, VPS health dashboard, model management, revenue analytics
- Automated provisioning improvements
- Customer impersonation ("view as customer") for debugging
- VPS SSH terminal in browser (optional)

**Plan:** Research admin panel best practices (Laravel Nova, Retool, Adminjs patterns), then write detailed enhancement file same as other tiers.

**This will be planned in a SEPARATE session** — admin panel is a full project on its own.

---

## COMPLETED

_(Move tasks here when done)_
