# ClawHQ Landing Page — Frontend Review

**Reviewer role:** Frontend Developer
**Date:** 2026-03-16
**Scope:** Landing page (`page.tsx`), all 16 landing components, 8 mockup components, docs layout/page, terms, privacy

---

## 1. Animations

### What is used
- **Framer Motion** throughout — `motion`, `AnimatePresence`, `useInView`, `whileInView`, layout animations.
- **CSS keyframes** for the channel marquee (`animate-marquee`, 25s linear infinite).
- **CSS transitions** for hover states on feature cards, channel overlaps, VPS bars, chart bars.
- No GSAP. No Three.js. Lightweight approach — good call.

### Issues

| Severity | Issue |
|----------|-------|
| HIGH | **`prefers-reduced-motion` is not handled anywhere.** Zero references across the entire `src/` directory. Users with vestibular disorders will see all scroll-triggered animations, the infinite marquee, the pulsing dots, the typing loops, and the kanban card auto-moves. Framer Motion does not automatically respect this media query — it must be configured explicitly via `MotionConfig` or checked per animation. |
| MEDIUM | **ChatMockup (mockups/)** runs an infinite typing loop with `setInterval` at 20ms (50fps). Combined with state updates every tick, this is expensive on low-end mobile. The loop never stops — it resets after "done" phase and starts over. |
| MEDIUM | **KanbanMockup** auto-moves cards every 3 seconds with a `setInterval`. When all "In Progress" cards are exhausted, it resets to `initialColumns` — causing a visual "jump" where all cards snap back simultaneously. |
| LOW | **VPSHealthMockup** has a potential interval leak: the inner `setInterval` cleanup is attached as a property on the `setTimeout` return value (`(timer as unknown as { cleanup: () => void }).cleanup = cleanup`), but this cleanup function is never actually called. The `clearTimeout(timer)` in the effect cleanup only clears the outer timeout, not the inner interval. |

### Positives
- `whileInView` with `{ once: true }` means scroll animations fire once, not repeatedly.
- Animation durations are tasteful (0.2s-0.7s), easing curves are smooth.
- No heavy libraries loaded (no Three.js, no Lottie, no GSAP).

---

## 2. Mockup Components

### All 8 mockups reviewed:

| Component | Animation Type | Loop | Cleanup | Notes |
|-----------|---------------|------|---------|-------|
| `DashboardMockup` | Staggered fade-in with `useInView` | No (once: true) | Clean | CountUp intervals cleaned properly |
| `ChatMockup` | Phase-based typing/streaming loop | Yes (infinite) | Clean (timeouts/intervals cleared) | Resets after 3s "done" pause |
| `AgentStoreMockup` | Staggered card entrance + whileHover | No (once: true) | Clean | whileHover adds nice lift effect |
| `ChannelMockup` | SVG node reveal + infinite floating | Yes (floating nodes) | Clean | Connection lines animate in sequence with activeIndex; floating `y` animation runs forever (low cost) |
| `VPSHealthMockup` | Gauge count-up + SVG circle dash | No (once) | **Interval leak risk** | See issue above |
| `KanbanMockup` | Card layout animations + auto-move | Yes (3s interval) | Clean | Reset "jump" is abrupt |
| `AnalyticsMockup` | CountUp + SVG path draw | No (once) | Clean | pathLength animation is smooth |
| `CodeBlockMockup` | Multi-phase typing loop | Yes (infinite) | Clean | Code types, pauses, response types, badge shows, reset |

### Summary
- Most mockups are well-structured with proper cleanup in `useEffect` return values.
- The infinite-loop mockups (ChatMockup, KanbanMockup, CodeBlockMockup) keep running even off-screen. They should pause when not in viewport — currently they consume CPU regardless.
- None of the 8 mockups in `mockups/` are imported on the landing page. They appear to be standalone components, possibly for a different section or unused. The ProductTour and DashboardShowcase components have their own inline mockups instead.

---

## 3. Responsive Design

### What works well
- Grid layouts use responsive breakpoints: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (Pricing), `grid-cols-1 lg:grid-cols-3` (Features).
- Mobile menu implemented in Navbar with `md:hidden` toggle.
- Hero text scales: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`.
- Architecture component has a completely separate mobile layout (`md:hidden` stacked vs `hidden md:block` side-by-side).
- CTA buttons stack vertically on mobile: `flex-col sm:flex-row`.

### Issues

| Severity | Issue |
|----------|-------|
| HIGH | **Comparison table** (`Comparison.tsx`) uses `min-w-[200px]` on three columns + `min-w-[120px]` on the feature column = minimum 720px. On mobile, this overflows horizontally. The `overflow-x-auto` wrapper is present on the table container but the section itself has no `overflow-hidden`, so horizontal scroll on the page body is possible. |
| HIGH | **Pricing comparison table** (`Pricing.tsx`) has the same issue — 5 columns (Feature + 4 plans) with `overflow-x-auto` but no truncation or mobile adaptation. On small screens, the table requires scrolling but there is no visual indicator that it scrolls. |
| MEDIUM | **Navbar dropdown panel** uses `grid-cols-[1fr_300px]` — this is only rendered on desktop (dropdown is hover-based, hidden on mobile), so acceptable. But the dropdown panel itself has `absolute left-0 right-0` — on very wide screens it will stretch full-width. |
| MEDIUM | **HowItWorks nested boxes** — each nested box adds `pl-6 pt-6` plus `p-6` internally. On mobile, the fourth level of nesting results in significant left indentation (~96px of padding). Content area becomes narrow on small screens. |
| LOW | **CTA giant text** `text-[10rem] md:text-[16rem] lg:text-[22rem]` — on very small screens (320px), 10rem (160px) text may cause minor overflow despite `whitespace-nowrap`. The containing div has no `overflow-hidden`. |

---

## 4. Navigation

### Smooth scroll
- Anchor links (`#features`, `#pricing`, `#faq`, `#product-tour`, `#how-it-works`) are standard `<a href="#section">` tags. Smooth scrolling depends on `scroll-behavior: smooth` in CSS — **this is NOT set** in the globals.css (checked). Without it, anchor clicks will snap-jump.

### Sticky nav with blur
- Navbar is `fixed top-0` with conditional `backdrop-blur-md` and `bg-background/80` on scroll. This works correctly.

### Active section highlighting
- **Not implemented.** There is no Intersection Observer or scroll spy to highlight the current section in the navbar. The dropdown buttons have no "active" state based on scroll position.

### Mobile navigation
- Hamburger menu works with AnimatePresence for smooth open/close.
- Mobile menu closes on link click (`onClick={() => setMobileOpen(false)}`).

---

## 5. Performance

### Issues

| Severity | Issue |
|----------|-------|
| HIGH | **No lazy loading.** All 14 sections are rendered immediately in `page.tsx` — no `next/dynamic`, no `React.lazy`, no `Suspense` boundaries. This means Framer Motion code for every section, all mockup components, all data arrays, and all animations are bundled and shipped in the initial load. Sections below the fold (Comparison, WhyClawHQ, FAQ, CTA, Footer) should be dynamically imported. |
| MEDIUM | **No code splitting.** `page.tsx` statically imports all 14 components. On initial page load, the entire landing page JS is downloaded and parsed. |
| MEDIUM | **Framer Motion bundle size.** Every landing component imports from `framer-motion`. While tree-shaking helps, the repeated use of `motion`, `AnimatePresence`, `useInView` across 16+ components will contribute significant JS weight. |
| LOW | **DashboardShowcase and Architecture components** are defined but NOT imported in `page.tsx`. They are dead code in the bundle if tree-shaking does not remove them (they are default exports, so they should be removed, but worth verifying). |
| LOW | The 8 mockup components in `mockups/` are also not imported anywhere on the landing page. If they are unused across the entire app, they should be removed or moved to a draft folder. |

---

## 6. Images

- **No images used on the landing page.** The entire landing page is built with CSS, SVG, Lucide icons, and HTML/text elements.
- `next/image` is not imported anywhere in the landing components.
- No `<img>` tags either.
- This is actually good for performance — no image loading, no CLS from images.
- However, the OG meta tags in `layout.tsx` do not specify an `og:image`. This means social media shares will have no preview image.

---

## 7. Pricing

### Amounts

| Plan | Monthly | Annual | Savings | Status |
|------|---------|--------|---------|--------|
| Starter | $59 | $599/yr ($50/mo) | $109 | CORRECT |
| Pro | $129 | $1,299/yr ($108/mo) | $249 | CORRECT |
| Ultra | $350 | $3,499/yr ($292/mo) | $701 | CORRECT |
| Enterprise | Custom | Custom | N/A | Shows "Starting at $999/mo" — CORRECT |

### Annual price display
- When "Annual" is toggled, monthly display shows `Math.round(plan.annual / 12)`:
  - Starter: $599/12 = $50/mo (correct)
  - Pro: $1299/12 = $108/mo (correct)
  - Ultra: $3499/12 = $292/mo (correct)
- Annual savings badge shows correctly.

### Feature comparison table
- Present with 25 rows comparing all 4 tiers.
- Uses Check/Minus icons for boolean values, text for specific values.
- Pro column header is highlighted with `text-[var(--cream)]`.

### Consistency check
- Hero CTA: "$59/mo" — matches
- Features section: "Starter -- $59/mo", "Pro -- $129/mo", "Ultra -- $350/mo" — matches
- CTA section: "$59/mo" — matches
- WhyClawHQ: "$59" and "$129/mo" mentioned in descriptions — matches
- Terms page pricing table: $59, $129, $350, Enterprise custom — matches

---

## 8. Links

### Dead links

| Link | Location | Issue |
|------|----------|-------|
| `href="#"` | Navbar logo | **Dead link.** Should be `href="/"`. |

### Anchor links (all resolve to valid section IDs)
- `#features` -> `<section id="features">` in Features.tsx
- `#pricing` -> `<section id="pricing">` in Pricing.tsx
- `#faq` -> `<section id="faq">` in FAQ.tsx
- `#product-tour` -> `<section id="product-tour">` in ProductTour.tsx
- `#how-it-works` -> `<section id="how-it-works">` in HowItWorks.tsx

### Page links
- `/docs` -> `src/app/docs/page.tsx` exists
- `/terms` -> `src/app/terms/page.tsx` exists
- `/privacy` -> `src/app/privacy/page.tsx` exists
- `/login` -> assumed to exist (auth pages mentioned in CLAUDE.md)
- `/register` -> assumed to exist (auth pages)

### External links
- `mailto:hello@clawhq.tech` (Footer, Enterprise CTA) — valid format
- `https://github.com/openclaw` (Footer) — external, cannot verify if live

### Footer link coverage
- Product: Features, Pricing, Product Tour, FAQ — all valid anchors
- Resources: Documentation, OpenClaw GitHub, Email — all valid
- Legal: Terms, Privacy — both have pages
- Account: Log in, Get Started — both link to auth pages

---

## 9. SEO

### Root layout metadata
```
title: "ClawHQ -- Managed AI Agent Hosting"
description: "All-inclusive managed AI agent hosting..."
authors: [{ name: "ClawHQ" }]
openGraph: { title, description, type: "website" }
twitter: { card: "summary_large_image", site: "@ClawHQ" }
icons: { icon: "/favicon.svg" }
```

### Issues

| Severity | Issue |
|----------|-------|
| MEDIUM | **No `og:image`** defined. Social shares will show no preview image. Twitter card is `summary_large_image` but no image is provided, which will fall back to no image. |
| MEDIUM | **No `og:url`** defined. Should include the canonical URL. |
| LOW | **No `robots` meta.** Defaults are fine for indexing, but being explicit is better practice. |
| LOW | **No structured data** (JSON-LD). Adding Organization and Product schema would improve search appearance. |
| INFO | Landing page is a server component (no `"use client"` on page.tsx). Content is rendered server-side — good for SEO. But all child components are client components, so actual content is still in the HTML via SSR. |

### Docs/Terms/Privacy metadata
- Docs layout: `title: "Documentation | ClawHQ"`, `description` present. Good.
- Terms: `title: "Terms of Service | ClawHQ"`, `description` present. Good.
- Privacy: `title: "Privacy Policy | ClawHQ"`, `description` present. Good.

---

## 10. Accessibility

### Issues

| Severity | Issue |
|----------|-------|
| HIGH | **Mobile menu toggle has no `aria-label`.** The `<button>` in Navbar only contains an icon (`<Menu>` or `<X>`) with no accessible name. Screen readers will announce it as an unlabeled button. |
| HIGH | **No `prefers-reduced-motion` support.** As noted in Section 1. Infinite marquee, pulsing dots, and auto-cycling stats will be disorienting for users with motion sensitivity. |
| HIGH | **FAQ accordion is not ARIA-compliant.** The FAQ toggle buttons have no `aria-expanded`, `aria-controls`, or `role` attributes. The collapsible content has no `role="region"` or `aria-labelledby`. |
| MEDIUM | **Stats component buttons** lack `aria-label` or `aria-current`. The active stat is only visually indicated (bold text + underline), not communicated to assistive tech. |
| MEDIUM | **Product Tour tabs** are implemented as plain buttons without `role="tablist"`, `role="tab"`, `role="tabpanel"`, or `aria-selected`. Keyboard navigation between tabs (arrow keys) is not implemented. |
| MEDIUM | **No skip-to-content link.** Users navigating by keyboard must tab through the entire navbar (including all dropdown links) before reaching main content. |
| MEDIUM | **Focus indicators** rely on browser defaults. No custom `:focus-visible` styles are defined for the landing page. On dark backgrounds, default focus outlines may be nearly invisible. |
| LOW | **Color contrast** — the muted foreground text (`text-muted-foreground`) against dark backgrounds may not meet WCAG AA 4.5:1 ratio. Specific values depend on the CSS variable definitions, but `#b4b4b4` on a near-black background should pass. The inline `color: "#b4b4b4"` used in Hero is approximately 7.5:1 on `#0a0a0a` — passes AA. |
| LOW | **Giant "CLAWHQ" text** in CTA has `aria-hidden="true"` on the base text but NOT on the glow layer clone. Both decorative spans should be hidden from assistive tech. |

---

## 11. Dark Theme

- `<html lang="en" className="dark">` is hardcoded in layout.tsx. No theme toggle exists. Dark mode is locked.
- All components use Tailwind's semantic color classes (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `text-primary`) which resolve to dark theme values.
- **No light mode leaks found.** All components consistently use the design system colors.
- Some components use hardcoded dark colors (`#191919`, `#222222`, `#1e1e1e`, `#333`) which technically bypass the design system but are consistent with the dark aesthetic.
- The `oklch(0.6762 0.0567 132.4479)` color (sage green primary) is used consistently for accent elements.
- `var(--cream)` / `var(--cream-foreground)` custom properties are used for CTA buttons and Pro tier highlighting.

---

## 12. Component Quality

### Library usage
- **Framer Motion** — the only animation library used. Well-applied throughout.
- **Lucide React** — icon library, used extensively. Consistent icon sizing.
- **No Magic UI, Aceternity, or 21st.dev components.** Everything is custom-built.
- **shadcn/ui** — the component library is installed (mentioned in CLAUDE.md) but none of its components are used on the landing page. All landing components are handcrafted.

### Code quality
- Components are well-organized with clear section separation (data declarations at top, visuals as sub-components, main export at bottom).
- TypeScript types are used for props, data structures, and state.
- No `any` types found.
- No `console.log` statements in any landing component.
- Consistent formatting and naming conventions.

### Component architecture
- The Features component packs a lot: 6 visual sub-components, 3 data arrays (starter/pro/ultra), and the main grid layout. Could benefit from splitting the visual sub-components into separate files.
- ProductTour component has 6 inline mockup sub-components — same observation, could be extracted.

---

## 13. Docs Layout

### Sidebar
- Left sidebar (`w-64`) is fixed-position with collapsible nav groups.
- 6 nav groups with 36 total links covering all documented features.
- Active page highlighting via `usePathname()` comparison — works correctly.
- Collapsible sections with `ChevronDown` rotation animation.

### Search
- Client-side search filtering implemented in `DocsNav`.
- Filters nav items by title match (case-insensitive).
- Works immediately (no debounce needed for this size).
- **Not a full-text search** — only searches nav item titles, not page content.

### Table of contents
- Right sidebar (`w-48`) placeholder exists with "On this page" header but **no actual table of contents is generated**. The comment says "Table of contents will be generated per page" but it's empty.

### Mobile hamburger
- `MobileDocsNav` component provides a fixed hamburger button (`md:hidden`), backdrop overlay, and slide-out sidebar.
- Has proper `aria-label="Toggle docs navigation"`.
- Closes on backdrop click.

### Issues

| Severity | Issue |
|----------|-------|
| MEDIUM | **Table of contents is a placeholder** — the right sidebar shows "On this page" but has no content. Should either be implemented or removed. |
| LOW | **No breadcrumbs** on docs pages. |
| LOW | **No prev/next navigation** at the bottom of docs pages. |

---

## 14. Terms / Privacy

### Terms of Service (`/terms`)
- 14 sections covering: Acceptance, Description, Registration, Payment, Refunds, SLA, Acceptable Use, Data Ownership, IP, Termination, Liability, Modifications, Governing Law, Contact.
- Pricing table included with all 4 tiers.
- 7-day money-back guarantee, annual pro-rata refund policy.
- Governing law: India.
- Contact: `support@clawhq.tech`.
- Navigation: Back to home + Privacy Policy links at bottom.

### Privacy Policy (`/privacy`)
- 13 sections covering: Introduction, Data Collected, Data NOT Collected, Usage, Sharing, Cookies, Retention, Rights (GDPR/CCPA), Security, Children, International Transfers, Changes, Contact.
- Strong emphasis on data staying on user's VPS.
- Essential cookies only, no tracking.
- Razorpay as payment processor (named).
- Navigation: Back to home + Terms links at bottom.

### Both pages
- Consistent dark theme styling.
- Simple header with logo + "Back to home" link.
- Proper `metadata` exports for SEO.
- Well-written, comprehensive, and legally reasonable.
- Last updated date: March 16, 2026 (current date).

---

## 15. Build Quality

### TypeScript
- No obvious type errors in the reviewed code.
- One minor concern: `JSX.Element` is used as return type in mockup record types — this is deprecated in newer React/TS versions in favor of `React.JSX.Element`, but should still compile fine.

### Unused code
- `DashboardShowcase.tsx` and `Architecture.tsx` exist in the landing folder but are NOT imported in `page.tsx`. They are dead components.
- All 8 mockup components in `mockups/` are not imported on the landing page. Need to verify if they are used elsewhere.
- `CTA.tsx` defines `mousePos`, `textRef`, `handleMouseMove`, `handleMouseLeave` for the interactive glow effect — all used.
- `Stats.tsx` defines `resetKey` for timer reset — used correctly.

### No console.logs
- Confirmed: zero `console.log` statements in any landing component.

### Potential issues
- `Features.tsx` injects a `<style>` tag inside the component body for `.vps-bar` and `.chart-bar` CSS. This is a minor anti-pattern — these styles should be in globals.css or use Tailwind's arbitrary values instead.

---

## Summary of Critical Fixes Needed

### Priority 1 (Ship blockers)
1. **Add `prefers-reduced-motion` support** — wrap the app in `<MotionConfig reducedMotion="user">` and pause/hide the marquee + infinite loops.
2. **Fix Navbar logo `href="#"`** — change to `href="/"`.
3. **Add `aria-label` to mobile menu toggle** in Navbar.
4. **Add smooth scroll CSS** — `html { scroll-behavior: smooth; }` in globals.css.
5. **Add `og:image`** to root layout metadata for social sharing.

### Priority 2 (Should fix)
6. Add ARIA attributes to FAQ accordion (`aria-expanded`, `aria-controls`).
7. Add tab role attributes to ProductTour tabs.
8. Lazy-load below-fold sections with `next/dynamic`.
9. Fix VPSHealthMockup interval cleanup leak.
10. Add scroll indicator for horizontally-scrollable comparison tables on mobile.
11. Implement right sidebar table of contents for docs, or remove the placeholder.
12. Add skip-to-content link.

### Priority 3 (Nice to have)
13. Add active section highlighting to navbar via Intersection Observer.
14. Pause infinite mockup loops (Chat, Kanban, CodeBlock) when off-screen.
15. Remove or archive unused DashboardShowcase, Architecture, and mockup components.
16. Move inline `<style>` tag from Features.tsx to globals.css.
17. Add JSON-LD structured data for SEO.
18. Add prev/next navigation to docs pages.
