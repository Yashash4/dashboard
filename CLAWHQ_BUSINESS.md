# ClawHQ — Business Plan

**Brand:** ClawHQ
**Domain:** clawhq.tech
**Dashboard:** app.clawhq.tech
**Product:** Managed OpenClaw hosting + bundled AI model API + premium agents
**Payment:** XPay Checkout (xpaycheckout.com — YC W24, subscriptions, 100+ currencies)
**Target:** Everyone who needs a managed OpenClaw setup without the hassle

---

## Pricing

### Tier 1 — Starter ($59/mo or $599/yr)

**VPS Specs:**
- 2 vCPU cores (upgrade to 4 vCPU if needed)
- 8 GB RAM (upgrade to 16 GB if needed)
- 100 GB NVMe (upgrade to 200 GB if needed)
- 8 TB bandwidth (upgrade to 16 TB if needed)
- VPS Provider: Hostinger (can change)

**AI Models (bundled, no BYOK needed):**
- Kimi K2.5
- MiniMax M2.5
- 1 more model (rotates/changes based on availability)
- Context window: capped at 128K (enforced via Docker/OpenClaw config)
- Model change: request via dashboard, applies next billing cycle (30 days)

**Features:**
- Full OpenClaw access (all skills, plugins, ClawHub)
- Full OpenClaw dashboard (built-in, no restrictions)
- All messaging channels (WhatsApp, Telegram, Discord, Slack, Signal, Teams — as per user request)
- Telegram bot setup
- OpenClaw hosted on DuckDNS link or customer's own domain
- Managed updates & backups
- ClawHQ customer dashboard (VPS controls, billing, support, agents)
- Support via dashboard tickets + email
- Premium agents: buy from landing page, auto-deployed to their instance
- No SSH access for customer (you manage everything)
- Docker-based deployment (auto-restart on crash)

**Rate Limiting:**
- Soft weekly limits (Ollama-style)
- "Limits designed to prevent abuse, not slow down work"
- No published hard numbers
- Throttle on abuse

---

### Tier 2 — Pro ($129/mo or $1299/yr) — COMING SOON

**VPS Specs:**
- 8 vCPU cores
- 32 GB RAM
- 400 GB NVMe disk space
- 32 TB bandwidth

**AI Models (bundled):**
- All models from Tier 1
- Full context window (max as per model — no 128K cap)
- Models can change instantly from dashboard
- Models can change/expand anytime

**Features:**
- Everything from Tier 1
- Agent control dashboard (add, remove, manage agents from ClawHQ dashboard)
- Chat with agents from dashboard
- Priority support
- Higher rate limits (~5x of Tier 1)

**Launch Status:**
- Listed on landing page with full feature details
- "Coming Soon" badge
- Pre-book with $20 discount ($109/mo instead of $129/mo)

---

### Tier 3 — Enterprise ($999+/mo) — Talk to Us

**What's included:**
- Everything from Tier 2
- 1-on-1 call to understand requirements
- Custom agents built for their use case
- Custom planner agents
- Custom integrations & workflows
- 5x rate limits of Tier 2
- Dedicated infrastructure
- White-glove setup & ongoing support
- Price scales with complexity

**Minimum:** $999/mo. No negotiation below.
**Booking:** Cal.com or similar scheduling link on landing page.

---

## Premium Agents

- Pre-built agents by ClawHQ team (your IP, your expertise)
- Sold as add-ons — customers buy from landing page
- Agent config files stored in Supabase DB
- On purchase: deployment script triggered → SSHs into customer VPS → deploys agent files → restarts OpenClaw
- Customer can SEE the agent config files (full OpenClaw dashboard access) but value is in the expertise, not secrecy
- Customer can also create their own agents freely through OpenClaw

---

## Cost & Margin Analysis

### Tier 1 ($59/mo)
| Expense | Cost |
|---|---|
| VPS (Hostinger 2vCPU/8GB) | ~$10-15/mo |
| API infra (own infra, near-zero marginal) | ~$0-2/mo |
| Domain/SSL | Negligible |
| **Total cost per customer** | **~$12-17/mo** |
| **Revenue** | **$59/mo** |
| **Margin** | **$42-47/mo (~75%)** |

### Tier 2 ($129/mo)
| Expense | Cost |
|---|---|
| VPS (Hostinger 8vCPU/32GB) | ~$30-50/mo |
| API infra | ~$0-5/mo |
| **Total cost per customer** | **~$35-55/mo** |
| **Revenue** | **$129/mo** |
| **Margin** | **$74-94/mo (~65%)** |

### Tier 3 ($999+/mo)
| Expense | Cost |
|---|---|
| Custom VPS | ~$50-100/mo |
| API infra | ~$5-10/mo |
| Your time (1-on-1, custom building) | Significant |
| **Margin** | **$800+/mo (depends on complexity)** |

### Break-even
- Fixed costs (API infra, domain, tools): ~$50-100/mo
- Break-even: 2 Tier 1 customers = $118/mo
- Profitable from customer #3

### Revenue Projections (Conservative — 6 months)
| Customers | Tier | Monthly | Annual |
|---|---|---|---|
| 10 Tier 1 | $59 each | $590/mo | $7,080/yr |
| 5 Tier 2 | $129 each | $645/mo | $7,740/yr |
| 2 Tier 3 | $999 each | $1,998/mo | $23,976/yr |
| **Total** | | **$3,233/mo** | **$38,796/yr** |

---

## Competitive Landscape

### Direct Competitors (Managed OpenClaw Hosting)
| Competitor | Price | All-Inclusive API? | Dashboard? | Agent Control? |
|---|---|---|---|---|
| MyClaw.ai | $19-79/mo | Optional | Yes | No |
| DockClaw | $19.99-49.99/mo | Pro tier only | No | No |
| RunMyClaw | $49/mo | 3000 credits | No | No |
| ClawTrust | $79/mo | Yes | Web dashboard | No |
| xCloud | $24/mo + AI costs | No (BYOK) | No | No |
| ClawHosters | €19-59/mo | Free models only | Skill dashboard | No |
| KiloClaw | $199/mo | $278 credits | No | No |
| SimpleClaw | $20-49/mo | $15 credits | No | No |
| **ClawHQ** | **$59-129/mo** | **Yes, own infra** | **Yes, full** | **Yes (Tier 2)** |

### ClawHQ Differentiators (What 90% Don't Have)
1. Own API infra — no BYOK, no separate API bills
2. Agent control dashboard (Tier 2)
3. Premium pre-built agents marketplace
4. Custom agent building service (Tier 3)
5. Generous VPS specs — more resources than anyone at this price
6. Full transparency — no hidden costs

### ClawHQ Weaknesses (Honest)
1. New brand, no social proof → fix with first 5 customer testimonials
2. No free trial → fix with fully transparent landing page
3. Manual deployment at launch → automate over time
4. Tier 2 not ready → pre-book + coming soon

---

## Competitive Positioning

**Don't say:** "Managed OpenClaw hosting"
**Do say:** "Your AI agents, built and managed for you"

No trial. No refund. Full transparency on landing page — show everything, hide nothing.

---

## Landing Page Structure

### Hero
- Headline: "Your OpenClaw. Fully managed. Just use it."
- Sub: All-inclusive — hosting, AI models, channels, dashboard. No API keys needed.
- CTA: "Get Started"

### Transparency Section
- Full feature breakdown, nothing hidden
- VPS specs, model list, channels — all visible
- Show what each tier includes

### Pricing
- 3 cards: Starter ($59) | Pro ($129 — Coming Soon, pre-book $109) | Enterprise (Talk to Us)
- Monthly / Annual toggle ($599/yr | $1299/yr)

### Premium Agents Section
- Browse available agents
- Buy agents (one-time purchase per agent)
- Auto-deployed to your OpenClaw

### How It Works
1. Choose your plan
2. We set up your OpenClaw on a dedicated VPS within 24 hours
3. Connect your channels (WhatsApp, Telegram, etc.)
4. Start using your AI assistant

### FAQ
- What models are included?
- Can I use my own API keys? (Yes, BYOK also supported)
- What channels are supported?
- How long does setup take?
- What happens if I hit rate limits?
- Can I upgrade/downgrade?
- Do you offer refunds? (No — full transparency, see exactly what you get)

### Footer
- Contact: email + scheduling link for Tier 3
- Legal: ToS, Privacy Policy
- Social: Twitter/X

---

## Launch Plan

### Day 1
- Landing page live on clawhq.tech (co-founder building)
- Pricing with all 3 tiers
- XPay integration for Tier 1 ($59/mo and $599/yr)
- Tier 2 pre-book form ($109/mo pre-book)
- Tier 3 "Talk to Us" with scheduling link
- Contact email

### Day 1 — Manual Process
- Customer pays → notification received
- SSH into Hostinger → spin up VPS
- Deploy OpenClaw via Docker
- Configure API endpoint, models, context cap
- Configure channels per customer request
- Share DuckDNS link / credentials with customer
- Done within 24 hours of payment

### Week 1
- Get first 3-5 Tier 1 customers
- Manual deploy for each
- Collect feedback
- Start building dashboard (app.clawhq.tech)

### Week 2
- Automate deployment scripts
- Dashboard v1 (auth + overview + VPS controls)
- Start Tier 2 dashboard design

### Week 3
- Dashboard live for Tier 1 customers
- Marketing: Twitter/X, Reddit, Product Hunt
- Refine based on feedback

### Week 4
- Tier 2 beta with pre-booked customers
- Agent control dashboard v1
- First Tier 3 sales call

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Brand | ClawHQ | Command center vibe |
| Domain | clawhq.tech | .tech fits, clean |
| Dashboard | app.clawhq.tech | Subdomain, professional |
| Tier 1 | $59/mo / $599/yr | Justified by bundled API + VPS |
| Tier 2 | $129/mo / $1299/yr | Agent control is unique |
| Tier 3 | $999+/mo | Filters tire-kickers |
| Payment | XPay Checkout | Indian business, intl billing, subs |
| Free trial | No | Transparent landing page instead |
| Rate limiting | Soft limits, Ollama-style | No published numbers |
| Context | 128K Tier 1, full Tier 2 | Enforced via config |
| Deployment | Docker on Hostinger VPS | Auto-restart, easy automation |
| Customer SSH | No access | Protects config, prevents abuse |
| Dashboard tech | Next.js + Supabase + Vercel | Fast, scalable, all-in-one |
| Agent files | Visible to customer | Value is expertise, not secrecy |

---

## API Providers Reference

### Primary: Own API Infra (Ollama-like)
- Weekly rate limits, no per-token billing
- Models: Kimi K2.5, MiniMax M2.5, others
- No usage tracking API — must track ourselves

### Backup: Blackbox AI
- API Key format: `sk-xxx` or `bb_xxx`
- Base URL: `https://api.blackbox.ai`
- OpenAI-compatible SDK
- 500+ models, 47+ free models
- Per-token pricing on paid models
- Returns `usage` object with token counts + cost per request
- No credit balance API — must track ourselves
- Full docs: see BLACKBOX_API_DOCS.md
