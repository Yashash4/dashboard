# Landing Page + Docs + Terms + Privacy QA Report

**Scope:** Full QA of the landing page (page.tsx + 16 landing components + 8 mockups), docs site (35 pages + layout + sidebar nav), terms page, and privacy page.

**Date:** 2026-03-16

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Landing sections render | PASS | All 14 sections compose without missing imports or type errors |
| Docs pages render | PASS | All 35 doc pages exist with substantive content |
| Docs sidebar navigation | PASS | All 35 sidebar hrefs map to existing page.tsx files |
| Terms page | PASS (with issues) | Full 14-section legal document, but feature descriptions conflict with landing |
| Privacy page | PASS | Full 13-section privacy policy with substantive content |
| Mockup animations | PASS | All 8 standalone mockups + 6 inline mockups use safe animation patterns |
| Pricing consistency | PASS (with issues) | Numbers correct on landing; Terms has stale feature descriptions |
| Links audit | FAIL (1 issue) | 1 dead href="#" found |
| Mobile layout | PASS (with concern) | Tables use overflow-x-auto; HowItWorks nesting is tight on small screens |

---

## Critical Issues

### BUG-001: Dead href="#" on Navbar Logo
- **File:** `src/components/landing/Navbar.tsx` line 87
- **Current:** `<a href="#" className="text-lg font-semibold...">`
- **Problem:** Clicking the logo navigates to `#` which scrolls to page top but adds `#` to the URL bar. This is a dead link.
- **Fix:** Change to `href="/"` to navigate to the home page root.

### BUG-002: Terms of Service Feature Descriptions Conflict with Landing Page
- **File:** `src/app/terms/page.tsx` lines 66-87
- **Discrepancies found:**

| Detail | Terms Says | Landing Says |
|--------|-----------|-------------|
| Starter agents | "Single agent" | 7 free pre-built agents in Agent Store |
| Starter KB | "1 GB knowledge base" | Knowledge Base is Pro-only |
| Pro agents | "Up to 5 agents" | No agent limit mentioned |
| Pro features | Includes "mission control" | Mission Control is Ultra-only |
| Ultra features | "custom domains" | Custom domain is on every plan |

- **Impact:** Legal document contradicts the marketed product. Could cause customer disputes or compliance issues.
- **Fix:** Update Terms Section 2 tier descriptions to match the actual feature set as presented on the landing page and in the docs.

---

## Section-by-Section Results

### Landing Page (src/app/page.tsx)

14 sections rendered in order. All imports resolve.

| # | Component | Renders | Notes |
|---|-----------|---------|-------|
| 1 | Navbar | PASS | Desktop dropdown, mobile hamburger, smooth scroll links all properly wired |
| 2 | Hero | PASS | Headline, badge, CTAs (/register, #product-tour), stats bar |
| 3 | ChannelBar | PASS | 7 channels, marquee animation defined in globals.css |
| 4 | Stats | PASS | Auto-cycling (4s) with AnimatePresence, manual click resets timer |
| 5 | ProductTour | PASS | 6 tabs with inline mockups, AnimatePresence transitions |
| 6 | Features | PASS | 3 tiers (Starter/Pro/Ultra) with interactive visual cards |
| 7 | BeforeAfter | PASS | 8-row comparison with X/Check icons |
| 8 | HowItWorks | PASS | 4 nested boxes with progressive indent |
| 9 | Pricing | PASS | 4 plans, monthly/annual toggle, comparison table (25 rows) |
| 10 | WhyClawHQ | PASS | 6 differentiator cards with stat badges |
| 11 | Comparison | PASS | 12-row table (Self-Hosted vs Budget vs ClawHQ) |
| 12 | FAQ | PASS | 14 accordion items with toggle |
| 13 | CTA | PASS | Giant "CLAWHQ" text with mouse-follow glow effect |
| 14 | Footer | PASS | 5-column grid, all links point to valid routes |

### Unused Landing Components (Not Bugs)

Two landing components exist but are NOT rendered in page.tsx:
- `DashboardShowcase.tsx` -- standalone tab-based showcase (3 tabs)
- `Architecture.tsx` -- node-graph diagram of infrastructure

These appear to be legacy/alternative components. They compile correctly but are unreferenced.

### Mockup Components (src/components/landing/mockups/)

All 8 exported from `index.ts`. All use safe patterns:
- `useInView` with `once: true` prevents re-triggering
- `useRef` + `useEffect` with proper cleanup for intervals/timeouts
- No memory leaks from infinite loops (all have cleanup returns)

| Mockup | Animations | Notes |
|--------|-----------|-------|
| DashboardMockup | CountUp, staggered fade | Safe interval cleanup |
| ChatMockup | Typing dots, streaming text, auto-loop | 4-phase state machine with reset |
| AgentStoreMockup | Staggered card entrance, hover lift | No intervals |
| ChannelMockup | SVG radial graph, sequential connection | Interval cleanup on unmount |
| KanbanMockup | Card moves between columns, auto-loop | 3s interval with reset to initial state |
| AnalyticsMockup | CountUp, animated SVG path/polygon | Safe interval cleanup |
| CodeBlockMockup | Typed code + response, 200 OK badge, auto-loop | 5-phase state machine with reset |
| VPSHealthMockup | Circular gauges with animated fill | Timeout cleanup (note: inner interval cleanup pattern at line 48 is unconventional but functional) |

**VPSHealthMockup cleanup concern (minor):** Line 48 stores cleanup on the timer object via type cast. This technically works but the inner interval might not be cleaned up on fast unmount during the setTimeout delay. Low risk since `once: true` prevents re-triggers.

---

### Pricing Verification

| Plan | Monthly | Annual | Per-Month (Annual) | Savings | Landing | Terms | Docs |
|------|---------|--------|--------------------|---------|---------|-------|------|
| Starter | $59 | $599 | $50 | $109 (15.4%) | Correct | Correct | Correct |
| Pro | $129 | $1,299 | $108 | $249 (16.1%) | Correct | Correct | Correct |
| Ultra | $350 | $3,499 | $292 | $701 (16.7%) | Correct | Correct | Correct |
| Enterprise | Custom | Custom | -- | -- | Correct | Correct | Correct |

- "Save up to 17%" toggle label: accurate (Ultra saves 16.7%, rounds to 17%)
- Annual per-month calculation in Pricing.tsx uses `Math.round(plan.annual / 12)`: Starter=$50, Pro=$108, Ultra=$292. Correct.

---

### Link Audit

#### Anchor Links (Smooth Scroll)

| Href | Target Section ID | Exists | Used By |
|------|------------------|--------|---------|
| #features | `<section id="features">` | YES | Navbar dropdown (6 items), Footer, HowItWorks |
| #pricing | `<section id="pricing">` | YES | Navbar, Footer, HowItWorks, WhyClawHQ, CTA |
| #faq | `<section id="faq">` | YES | Navbar dropdown, Footer, WhyClawHQ |
| #product-tour | `<section id="product-tour">` | YES | Hero, Footer |
| #how-it-works | `<section id="how-it-works">` | YES | (no link targets it -- but not a bug) |
| # | (none) | DEAD | Navbar logo -- **BUG-001** |

Note: Smooth scroll behavior depends on `scroll-behavior: smooth` being set in CSS or via JS. No explicit smooth scroll implementation found in Navbar -- relies on native browser anchor behavior. This works but the jump is instant without CSS smooth scroll on some browsers.

#### Internal Page Links

| Href | Route Exists | Used By |
|------|-------------|---------|
| /login | YES (src/app/login/) | Navbar, Footer |
| /register | YES (src/app/register/) | Navbar, Hero, ProductTour, Pricing (3 plans), Footer |
| /docs | YES (src/app/docs/) | Navbar dropdown, Footer |
| /terms | YES (src/app/terms/) | Navbar dropdown, Footer |
| /privacy | YES (src/app/privacy/) | Footer |
| mailto:hello@clawhq.tech | N/A (mailto) | Pricing (Enterprise CTA), Footer |

#### External Links

| Href | Used By | Notes |
|------|---------|-------|
| https://github.com/openclaw | Footer | Cannot verify if repo exists, but link is valid format |
| https://openclaw.dev | Docs intro | External, cannot verify availability |
| https://razorpay.com/privacy/ | Privacy page | External, valid format |

---

### Docs Site QA

#### Layout (src/app/docs/layout.tsx)
- Left sidebar: 256px fixed, hidden on mobile, has DocsNav with search filter
- Right sidebar: 192px fixed, hidden below lg, placeholder "On this page" (no auto-generated TOC)
- Main content: responsive margins, max-w-3xl centered
- Mobile nav: hamburger button (fixed top-left), backdrop overlay, slide-in sidebar

#### Sidebar Navigation (src/components/docs/docs-nav.tsx)
- 6 collapsible groups, 35 total links
- Active page highlighting via `usePathname()`
- Search filter works by title substring match
- All groups default to open state

#### Page Count: 35 pages verified

| Group | Pages | All Render |
|-------|-------|------------|
| Getting Started | 3 (Intro, Quick Start, Plans) | YES |
| Dashboard | 10 (Overview, VPS, Models, Agents, Store, Chat, Channels, Support, Billing, Account) | YES |
| Pro Features | 9 (Overview + 8 feature pages) | YES |
| Ultra Features | 5 (Mission Control + 4 sub-pages) | YES |
| API Reference | 6 (Auth, Chat, Agents, Webhooks, Models, Rate Limits) | YES |
| Help | 2 (FAQ, Contact Support) | YES |

All pages use `<article className="prose prose-invert max-w-none">` wrapper with proper heading hierarchy.

#### Cross-links within Docs
- Docs index page links to 12 other doc pages -- all valid
- Pro overview links to 8 sub-pages -- all valid
- Ultra overview links to 4 sub-pages -- all valid
- FAQ links to /docs/support-contact -- valid

---

### Terms of Service (src/app/terms/page.tsx)
- 14 sections of substantive legal content
- Proper heading hierarchy (h1 > h2)
- Navigation: "Back to home" link + "Privacy Policy" cross-link
- Contact email: support@clawhq.tech (consistent)
- Payment processor: Razorpay (consistent with Privacy page)
- Pricing table matches landing page numbers
- **Feature descriptions are stale -- see BUG-002**

### Privacy Policy (src/app/privacy/page.tsx)
- 13 sections of substantive content
- Strong "data stays on your server" messaging (Section 3)
- GDPR/CCPA rights covered (Section 8)
- Cookie policy: essential only, no tracking
- Navigation: "Back to home" + "Terms of Service" cross-link
- No inconsistencies found with landing page claims

---

### Mobile Layout Analysis

| Component | Mobile Behavior | Risk |
|-----------|----------------|------|
| Navbar | Hamburger menu replaces desktop dropdowns | SAFE |
| Hero | Stacks vertically, responsive text sizes | SAFE |
| ChannelBar | Stat stacks above marquee on md breakpoint | SAFE |
| Stats | 2-col grid below md | SAFE |
| ProductTour | Tab bar wraps, grid stacks to 1-col | SAFE |
| Features | 1-col grid on mobile | SAFE |
| BeforeAfter | 1-col stack on mobile | SAFE |
| HowItWorks | Nested boxes indent deeply (4 levels x 24px = 96px) | LOW RISK -- tight on 320px screens |
| Pricing | Cards stack 1-col, table scrolls horizontally | SAFE |
| WhyClawHQ | 1-col grid on mobile | SAFE |
| Comparison | Table scrolls horizontally via overflow-x-auto | SAFE |
| FAQ | Full width accordion | SAFE |
| CTA | Giant text uses responsive sizing (10rem / 16rem / 22rem) | SAFE |
| Footer | 1-col grid on mobile | SAFE |
| Docs mobile | Hamburger nav with backdrop overlay | SAFE |

---

## Minor Observations (Non-Blocking)

1. **Right docs sidebar is a placeholder.** The "On this page" table of contents section is empty. Not a bug but a missing feature.

2. **Navbar logo casing inconsistency.** Landing Navbar renders "clawhq" (all lowercase). Terms/Privacy header renders "ClawHQ" (CamelCase). Footer renders "clawhq". Docs sidebar renders "ClawHQ Docs". This is cosmetic but worth aligning.

3. **VPSHealthMockup inner interval cleanup:** The cleanup pattern on line 48 (`(timer as unknown as { cleanup: () => void }).cleanup = cleanup`) stores cleanup on the timer reference, but the outer `clearTimeout` in the return statement does not call this stored cleanup. If the component unmounts during the setTimeout delay, the interval will never start, so this is safe. But if unmount happens after the setTimeout fires but before the interval completes, the inner interval orphans. Very low risk due to `once: true`.

4. **Two unused landing components exist:** `DashboardShowcase.tsx` and `Architecture.tsx` are complete, working components that are not imported in `page.tsx`. Consider removing them if they are no longer needed, to reduce bundle size.

5. **No `scroll-behavior: smooth` detected** in globals.css for the anchor links. Anchor links (#features, #pricing, etc.) will jump instantly rather than smooth-scroll in browsers that don't apply smooth scrolling by default.

6. **Hardcoded date "March 10 ... March 17" in ChatMockup** (mockups/ChatMockup.tsx line 8 and ProductTour.tsx line 133). These dates will become stale. Consider using relative dates or removing specific dates.

---

## Verdict

**Overall: PASS with 2 issues to fix.**

- BUG-001 (dead href="#" on logo) is a quick one-line fix.
- BUG-002 (Terms feature descriptions) is a content accuracy issue that should be resolved before launch to avoid legal/marketing misalignment.

All 14 landing sections render correctly. All 35 doc pages exist and contain substantive content. Pricing numbers are consistent and mathematically correct across landing, docs, and terms. Mockup animations use safe patterns with proper cleanup. Mobile layout is handled throughout with responsive grids and overflow scrolling.
