# Landing Page Build Context

**Purpose:** Single reference file for this agent while building the landing page. Points to source files — doesn't duplicate content.

---

## Current State

**Landing page exists at:** `src/app/page.tsx` (root route `/`)
**12 section components already created** in `src/components/`:
- Navbar, HeroSection, SocialProofSection, FeaturesSection, HowItWorksSection
- ArchitectureSection, ComparisonSection, SpecsSection, PricingSection
- TestimonialsSection, FAQSection, CTASection, Footer

**Status:** All components exist with PLACEHOLDER content. Need to rebuild with real design system + real content.

**Auth:** Anonymous users see landing page. Logged-in users redirect to `/dashboard` (unless `?landing=true`).

---

## Design System (LOCKED)

**Full CSS spec:** `tasks/LANDING_PAGE_DESIGN_SPEC.md` → section "DESIGN SYSTEM — LOCKED IN"

| Token | Value |
|-------|-------|
| Body font | Geist Mono (monospace everywhere — terminal aesthetic) |
| Code font | JetBrains Mono |
| Page bg | `#111111` |
| Card bg | `#191919` |
| Muted bg | `#222222` |
| Hover bg | `#2a2a2a` |
| Border | `#201e18` |
| Primary (sage green) | `oklch(0.6762 0.0567 132.4479)` |
| Accent (warm cream) | `#ffe0c2` (CTAs, pricing highlights) |
| Tier: Starter | Green |
| Tier: Pro | Cream |
| Tier: Ultra | Amber |
| Tier: Enterprise | Teal |
| Radius | `0.625rem` |
| Vibe | "Terminal-luxury SaaS" |

**Current globals.css** uses OLD design (orange-red primary, 0rem radius, Space Grotesk). Must be REPLACED with the locked design system above.

---

## Resolved Conflicts

1. **Channels = 7** (NOT 8). No Email. List: WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat
2. **Pricing = 4 cards**: Starter $59 / Pro $129 / Ultra $350 / Enterprise $999+
3. **Rate limits**: Starter 1x, Pro 5x, Ultra 10x, Enterprise 25x
4. **"Mission Control" = Ultra only**. Pro's VPS upgrade = "Advanced VPS Controls"
5. **Starter models = 3** (Kimi K2.5, MiniMax M2.5 + 1 rotating)

---

## Content Sources (DO NOT duplicate — read when needed)

| What | File | Lines |
|------|------|-------|
| Starter features | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 1-30 (summary), external `tasks/STARTER_59_FEATURES_DEEP_DIVE.md` |
| Pro features | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 33-227 |
| Ultra features | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 229-459 |
| Starter positioning/copy | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 462-616 |
| Pro positioning/copy | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 618-798 |
| Ultra positioning/copy | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 802-947 |
| AI Models content | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 949-1086 |
| Channels content | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 1088-1293 |
| Agent Store content | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 1295-1549 |
| VPS/Infrastructure content | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 1551-1839 |
| Feature hierarchy + showcase order | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 1841-2210 |
| Pricing strategy + cards | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 2212-2660 |
| Competitive positioning | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 2663-2893 |
| User journey / How It Works | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 2894-3157 |
| Trust strategy | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 3159-3535 |
| Animation plan + priority list | `tasks/LANDING_PAGE_CONTENT_PLAN.md` | 3537-3964 |
| Design patterns (9 reference sites) | `tasks/LANDING_PAGE_DESIGN_SPEC.md` | top sections |
| Component sources (21st.dev, etc.) | `tasks/LANDING_PAGE_DESIGN_SPEC.md` | design system section |

---

## Landing Page Section Order (Final)

Based on 4.1 + 4.4 merged:

1. **Hero** — headline, subtitle, CTA, dashboard preview
2. **Channel/Logo Bar** — 7 channel icons scrolling
3. **How It Works** — 4 steps (Choose Plan → We Build → Connect Channels → Go Live)
4. **Features Overview** — bento grid (AI Models, Channels, Agent Store, VPS, Agent Chat, Monitoring)
5. **Dashboard Demo** — animated mockup with tab switching (3 scenarios)
6. **Pro Tools** — 6 tools (Logs, Analytics, KB, Webhooks, API, Audit)
7. **Command Center (Ultra)** — Mission Control, Task Board, Agent Roster, Events, Sessions
8. **Pricing** — 4 cards + monthly/annual toggle + comparison table
9. **Why ClawHQ** — 6 differentiators grid
10. **Trust/Transparency** — "No testimonials yet. Just the truth."
11. **FAQ** — consolidated from all sections
12. **Final CTA** — repeat hero CTA with closing line
13. **Footer**

---

## Tech Stack Available

- Next.js 15 App Router + TypeScript
- Tailwind CSS 3.4 + tailwindcss-animate
- Framer Motion 12 (animations)
- shadcn/ui (51 components installed)
- Lucide React (icons)
- Recharts (charts)
- Embla Carousel
- Can install ANY component from: 21st.dev, Magic UI, Aceternity, or any library

---

## Build Rules

- This is a CLEAN SLATE rebuild — old design/colors/components don't carry over
- Replace globals.css with new design system first
- Replace fonts (Geist Mono replaces Space Grotesk/Inter)
- Use pre-built components from libraries to reduce work
- `next build` must pass before marking anything done
- NEVER expose backend details (Ollama, Hostinger, Blackbox)
- All tiers are LIVE — no "Coming Soon"
- Component install: `npx shadcn@latest add "https://21st.dev/r/{author}/{component}"`

## Decision Authority

**This agent makes ALL decisions autonomously** — section content, copy, layout, animations, component choices, design details. The agent knows the full project context (business docs, codebase, content plan, design spec) and builds based on that knowledge.

**Process:** Build first, iterate after. User reviews the result and gives feedback. No need to ask permission for every decision — just build it right the first time based on everything in the content plan + design spec.

**If something needs changing:** User will say so AFTER seeing it. Don't block on decisions — pick the best option and move.
