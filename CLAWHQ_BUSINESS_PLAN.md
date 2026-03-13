# ClawHQ — Full Business Plan

**Domain:** clawhq.tech
**Product:** Managed OpenClaw hosting + bundled AI model API
**Payment:** XPay Checkout (subscriptions, 100+ currencies, YC W24)
**Tech Stack:** Next.js (landing + dashboard), Docker, SSH deployment
**Launch:** Landing page + pricing live Day 1. Manual deploy via SSH on payment. Automate as customers come.

---

## Pricing

### Tier 1 — Starter ($59/mo or $599/yr)

**VPS Specs:**
- 2 vCPU cores (upgrade to 4 vCPU if needed)
- 8 GB RAM (upgrade to 16 GB if needed)
- 100 GB NVMe (upgrade to 200 GB if needed)
- 8 TB bandwidth (upgrade to 16 TB if needed)
- VPS Provider: Hostinger (for now, can change)

**AI Models (bundled, no BYOK needed):**
- Kimi K2.5
- MiniMax M2.5
- 1 more model (rotates/changes based on availability)
- Context window: capped at 128K (set via SSH config)

**Features:**
- Full OpenClaw access (all skills, plugins, ClawHub)
- All messaging channels (WhatsApp, Telegram, Discord, Slack, Signal, Teams, etc. — as per user request)
- Telegram bot setup
- OpenClaw dashboard hosted on their link or ClawHQ subdomain
- Managed updates & backups
- Simple dashboard (usage stats, VPS status — built later)
- Support via dashboard ticket + email

**Rate Limiting:**
- Soft weekly limits (Ollama-style — "designed to prevent abuse, not slow down work")
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
- Models can change/expand anytime

**Features:**
- Everything from Tier 1
- Agent control dashboard (add, remove, manage agents)
- Chat with agents from dashboard
- Priority support
- Higher rate limits (~5x of Tier 1)

**Launch Status:**
- Listed on landing page with full details
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

## Cost & Margin Analysis

### Tier 1 ($59/mo)
| Expense | Cost |
|---|---|
| VPS (Hostinger 2vCPU/8GB) | ~$10-15/mo |
| API infra (your own, near-zero marginal cost) | ~$0-2/mo |
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

### Annual Revenue Projections (Conservative)
| Customers | Tier | Monthly | Annual |
|---|---|---|---|
| 10 Tier 1 | $59 each | $590/mo | $7,080/yr |
| 5 Tier 2 | $129 each | $645/mo | $7,740/yr |
| 2 Tier 3 | $999 each | $1,998/mo | $23,976/yr |
| **Total** | | **$3,233/mo** | **$38,796/yr** |

### Break-even
- Fixed costs (your API infra, domain, tools): ~$50-100/mo
- Break-even: 2 Tier 1 customers = $118/mo (covers basics)
- Profitable from customer #3

---

## Rate Limiting Strategy

**Approach:** Ollama-style soft limits. No published numbers.

**Implementation:**
- Build a proxy layer between customer's OpenClaw and your API
- Count requests per customer per week
- Internal soft caps (not shared publicly):
  - Tier 1: ~X requests/week (decide based on infra capacity)
  - Tier 2: ~5X requests/week
  - Tier 3: ~25X requests/week
- When limit hit: throttle speed, don't hard block
- Monitor and adjust based on real usage patterns

**What customers see:**
- "Fair usage policy"
- "Limits designed to prevent abuse, not slow down work"
- No hard numbers on website

---

## Context Window Enforcement

- **Tier 1:** `num_ctx` set to 128000 in OpenClaw config via SSH
- **Tier 2:** `num_ctx` set to model maximum (no cap)
- Enforced at the VPS level, customer cannot change it

---

## Landing Page Structure

### Hero Section
- Headline: Something like "Your OpenClaw. Fully managed. Just use it."
- Sub: All-inclusive — hosting, AI models, channels, dashboard. No API keys needed.
- CTA: "Get Started" → pricing section

### What You Get (Transparency Section)
- Full feature breakdown, nothing hidden
- Show VPS specs openly
- Show model list openly
- Show what's included at each tier

### Pricing Section
- 3 cards: Starter ($59) | Pro ($129 — Coming Soon, pre-book $109) | Enterprise (Talk to Us)
- Monthly / Annual toggle
- Annual prices: $599/yr | $1299/yr

### How It Works
1. Choose your plan
2. We set up your OpenClaw on a dedicated VPS within 24 hours
3. Connect your channels (WhatsApp, Telegram, etc.)
4. Start using your AI assistant

### FAQ Section
- What models are included?
- Can I use my own API keys? (Yes, OpenClaw supports BYOK too)
- What channels are supported?
- How long does setup take?
- What happens if I hit rate limits?
- Can I upgrade/downgrade?
- Do you offer refunds? (No, but full transparency — see exactly what you get before paying)

### Footer
- Contact: email + scheduling link for Tier 3
- Legal: Terms of Service, Privacy Policy
- Social: Twitter/X, Discord (if applicable)

---

## Tech Architecture

```
Customer → OpenClaw (on their VPS)
              ↓
         ClawHQ Proxy (your middleware)
              ↓
         Your API Infra (Ollama-like, models served)
```

**ClawHQ Proxy responsibilities:**
- Route requests to your API
- Count requests per customer per week
- Enforce rate limits
- Log usage for dashboard
- Handle errors / fallbacks

**Per-customer VPS:**
- Docker container running OpenClaw
- Pre-configured with ClawHQ API endpoint
- `num_ctx` set based on tier
- All channels configured per customer request
- SSH access for you (not customer on Tier 1)

---

## What's Live on Day 1

- [ ] Landing page (Next.js) on clawhq.tech
- [ ] Pricing with all 3 tiers
- [ ] XPay Checkout integration for Tier 1 ($59/mo and $599/yr)
- [ ] Tier 2 pre-book form (collect email + $109 pre-book payment or just email)
- [ ] Tier 3 "Talk to Us" with scheduling link
- [ ] Contact email

## What's Manual on Day 1
- Customer pays → you get notified
- You SSH into Hostinger, spin up VPS
- Deploy OpenClaw via Docker
- Configure API endpoint, models, context cap
- Configure channels per customer request
- Share credentials/link with customer
- Done within 24 hours of payment

## What Gets Built Over Time
- Automated VPS provisioning
- Customer dashboard (usage stats, VPS status)
- Agent control panel (Tier 2)
- Monitoring & alerts
- Auto-scaling

---

## Competitive Positioning

**Don't say:** "Managed OpenClaw hosting"
**Do say:** "Your AI agents, built and managed for you"

**Your moat (what 90% of competitors DON'T have):**
1. Your own API infra — no BYOK hassle, no separate API bills
2. Agent control dashboard (Tier 2) — coming soon, nobody else has this at $129
3. Custom agent building (Tier 3) — high-touch, high-value
4. Generous VPS specs — more resources than anyone at this price
5. Full transparency — no hidden costs, no surprise bills

**Your weakness (be honest about it):**
1. New brand, no social proof yet → fix with first 5 customers testimonials
2. No free trial → fix with fully transparent landing page
3. Manual deployment → fix with automation over time
4. Tier 2 not ready yet → fix with pre-book + coming soon

---

## First 30 Days Roadmap

**Week 1:**
- Landing page live
- First 3-5 Tier 1 customers
- Manual deploy for each
- Collect feedback

**Week 2:**
- Start automating deployment scripts
- Build basic customer dashboard
- Start Tier 2 dashboard design

**Week 3:**
- Dashboard v1 live for Tier 1 customers
- Start marketing (Twitter/X, Reddit, Product Hunt)
- Refine based on customer feedback

**Week 4:**
- Tier 2 beta with pre-booked customers
- Agent control dashboard v1
- First Tier 3 sales call

---

## Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Brand | ClawHQ | Command center vibe, professional |
| Domain | clawhq.tech | .tech fits, clean, no hyphen |
| Tier 1 price | $59/mo | Justified by bundled API + bigger VPS than competitors |
| Tier 2 price | $129/mo | Agent control is unique, nobody else at this price |
| Tier 3 minimum | $999/mo | Filters tire-kickers, justified by custom work |
| Annual pricing | $599 / $1299 | ~15-16% discount, fair |
| Payment | XPay Checkout | Indian business, international billing, subscriptions, YC backed |
| Free trial | No | Transparent landing page instead, no VPS waste |
| Rate limiting | Ollama-style soft limits | No published numbers, throttle on abuse |
| Context cap | 128K Tier 1, full Tier 2 | Enforced via SSH config |
| Launch scope | Landing page + manual deploy | Automate as customers come |
| VPS provider | Hostinger (for now) | Can change later |
