# OpenClaw Wrapper SaaS — Master Plan

## Company Overview
- **Type**: SaaS company offering managed OpenClaw hosting + open-source model API
- **Product**: Turnkey OpenClaw platform — hosting, dashboard, model API, all managed
- **Differentiator**: Not just a wrapper — includes bundled open-source LLM API (Ollama-like infra) so customers don't need their own API keys
- **Company Name**: TBD
- **Payment Gateway**: XPay (need to confirm recurring billing support)
- **Tech Stack**: Next.js, Hono, Docker, PostgreSQL, Drizzle ORM, TanStack, shadcn/ui, Tailwind CSS
- **Boilerplate**: TurboStarter OpenClaw Kit ($149 lifetime) — handles Docker deploy, SSH provisioning, multi-tenant, auth, admin dashboard, HTTPS

---

## Pricing Tiers

### Tier 1 — $50-60/month
- OpenClaw hosted on smaller VPS
- 1 fixed open-source model (rate-limited per week)
- Simple dashboard: usage stats, VPS state
- All messaging channels (WhatsApp, Telegram, Slack, Discord, Signal, Teams, etc.)
- Full OpenClaw access (all skills/plugins)
- Domain: subdomain from us OR customer's own domain
- Managed updates & backups

### Tier 2 — $99-119/month
- OpenClaw hosted on bigger VPS
- More open-source models (Kimi K2.5, etc.), rate-limited per week
- Everything from Tier 1
- Machine Control panel (like Mission Control HQ — restart, logs, agent management, task board)
- More resources & higher rate limits

### Tier 3 — $1,000+ (Custom)
- 1-on-1 call to understand client needs
- Fully customized OpenClaw setup
- Custom planner agents built for their use case
- Custom integrations & workflows
- Dedicated infrastructure
- Price scales with complexity
- Full white-glove service

---

## What TurboStarter OpenClaw Kit Provides (Already Done)

| Feature | Status |
|---|---|
| Remote Docker deployment + SSH provisioning | Done |
| Resource limits per instance | Done |
| Multi-tenant isolated deploys | Done |
| OAuth auth (Google + GitHub) | Done |
| Admin dashboard (users + instances) | Done |
| Type-safe DB schema + migrations (PostgreSQL/Drizzle) | Done |
| Multiple AI provider/model integration | Done |
| White-label theming | Done |
| Auto HTTPS + reverse proxy | Done |
| SEO-ready landing/marketing pages | Done |
| i18n support | Done |
| Responsive UI (shadcn/ui + Tailwind) | Done |

---

## What We Build Custom

| Feature | Priority | Effort |
|---|---|---|
| Model API proxy + per-plan rate limiting | P0 | Medium |
| XPay payment integration | P0 | Medium |
| VPS monitoring dashboard (CPU, RAM, disk, uptime) | P0 | Medium |
| Tier-based plan logic ($50 / $99 / $1K) | P0 | Light |
| Machine Control panel (Tier 2+) | P1 | Medium-Heavy |
| Usage tracking (tokens/requests per week) | P1 | Medium |
| Custom domain management for customers | P1 | Light-Medium |
| Tier 3 custom agent builder workflow | P2 | Heavy (ongoing) |

---

## 7-Day MVP Launch Plan

| Day | Task |
|---|---|
| Day 1 | Set up TurboStarter OpenClaw Kit, customize branding, deploy locally |
| Day 2 | Integrate XPay payments, set up 3 pricing tiers |
| Day 3 | Build model API proxy (Ollama-like infra) + rate limiting |
| Day 4 | VPS monitoring dashboard (stats, usage) |
| Day 5 | Machine control basics (restart, logs, status) |
| Day 6 | Landing page polish, onboarding flow, domain setup |
| Day 7 | Testing, bug fixes, soft launch |

---

## Open-Source Model API (Our Infra)

- **Setup**: Ollama-like self-hosted infra
- **Models available**: 1B params up to large models like Kimi K2.5
- **Rate limiting**: Per week, based on plan tier
- **Tier 1**: 1 fixed model only
- **Tier 2+**: Multiple models available
- **Key point**: Customers don't need their own API keys — we provide everything

---

## Machine Control (Tier 2+ Feature)

Inspired by [Mission Control HQ](https://missioncontrolhq.ai/) and [ClawControl](https://clawcontrol.dev):
- Real-time agent status monitoring
- Task board (Kanban-style)
- Restart/stop/configure OpenClaw instance
- Log viewer
- Agent provisioning from templates
- Human approval gates for agent actions
- Activity feed

---

## Infrastructure

- **Customer VPS**: Isolated per customer (Docker containers)
- **Model API**: Self-hosted Ollama-like setup
- **Database**: PostgreSQL
- **Deployment**: Docker + SSH provisioning (handled by TurboStarter kit)
- **HTTPS**: Auto-configured with reverse proxy

---

## Key Decisions Still Needed

1. **Company/Brand name** — TBD
2. **XPay recurring billing** — Does it support monthly subscriptions? If not, need Stripe as fallback
3. **Exact rate limits per tier** — X requests/tokens per week
4. **VPS provider for customer instances** — Hetzner? DigitalOcean? OVH?
5. **Exact model lineup per tier** — Which models for Tier 1 vs Tier 2
6. **Tier 3 pricing structure** — Starting at $1K, but what's the cap/range?

---

## Research Sources

- [TurboStarter OpenClaw Kit](https://www.turbostarter.dev/openclaw) — $149 lifetime, production-ready OpenClaw wrapper boilerplate
- [OpenClaw GitHub](https://github.com/openclaw/openclaw) — MIT licensed, 215K+ stars
- [Mission Control HQ](https://missioncontrolhq.ai/) — Reference for machine control UI
- [ClawControl](https://clawcontrol.dev) — Reference for agent management dashboard
- [XPay](https://xpay.app/) — Payment gateway choice
