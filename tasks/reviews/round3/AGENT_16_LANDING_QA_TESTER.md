# Agent 16 — Landing Page — QA Tester Review

**Total Issues Found: 16**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 5 / LOW: 3

---

### [QA-01] — ProductTour, Stats, WhyClawHQ, and BeforeAfter components never rendered
**File:** `src/app/page.tsx:1-37`
**Severity:** CRITICAL
**Description:** Four landing page components (`ProductTour`, `Stats`, `WhyClawHQ`, `BeforeAfter`) exist as fully built files but are never imported or rendered in `page.tsx`. The page only renders: Navbar, Hero, ChannelBar, Features, Pricing, HowItWorks, Comparison, FAQ, CTA, Footer. This means roughly 40% of the landing page content is invisible to visitors.
**Steps to Reproduce:** Visit the landing page. Scroll through the entire page.
**Expected vs Actual:** Expected to see Product Tour, Stats, Why ClawHQ, and Before/After sections. Actual: these sections do not appear anywhere on the page.

---

### [QA-02] — "See it in action" CTA links to #product-tour which is not rendered
**File:** `src/components/landing/Hero.tsx:87`
**Severity:** CRITICAL
**Description:** The Hero section's secondary CTA button "See it in action" links to `#product-tour`. The `ProductTour` component defines `id="product-tour"`, but since `ProductTour` is not rendered in `page.tsx` (see QA-01), this anchor link goes nowhere. The page scrolls but the user sees no Product Tour section.
**Steps to Reproduce:** Click "See it in action" button in the Hero section.
**Expected vs Actual:** Expected to scroll to a Product Tour section. Actual: nothing happens or the page scrolls to no matching element.

---

### [QA-03] — Footer "Product Tour" link also dead
**File:** `src/components/landing/Footer.tsx:24`
**Severity:** HIGH
**Description:** The Footer's Product column links to `#product-tour`, which does not exist on the rendered page (same root cause as QA-02). This is a dead link in the footer navigation.
**Steps to Reproduce:** Scroll to footer. Click "Product Tour" link.
**Expected vs Actual:** Expected to scroll to Product Tour. Actual: no target element exists.

---

### [QA-04] — Pro and Ultra feature grids defined but never rendered
**File:** `src/components/landing/Features.tsx:234-252`
**Severity:** HIGH
**Description:** The Features component defines `proFeatures` (8 items) and `ultraFeatures` (6 items) arrays with full content, but the render function only outputs `starterFeatures`. The Pro and Ultra feature grids are completely absent from the page. Visitors see no information about Pro tools (Agent Builder, Webhooks, API, Analytics, etc.) or Ultra features (Mission Control, Kanban, etc.) in the Features section.
**Steps to Reproduce:** Scroll to the Features section of the landing page.
**Expected vs Actual:** Expected to see three tiers of features (Starter, Pro, Ultra). Actual: only Starter platform features are displayed.

---

### [QA-05] — SSR disabled for SEO-critical sections
**File:** `src/app/page.tsx:10-15`
**Severity:** HIGH
**Description:** The Pricing, Features, HowItWorks, Comparison, FAQ, and CTA sections are all loaded with `dynamic(() => import(...), { ssr: false })`. This means search engines that don't execute JavaScript will not see any of this content. The pricing information, feature lists, FAQ content (which is excellent for SEO with structured Q&A), and comparison data will all be invisible to many crawlers.
**Steps to Reproduce:** View page source or disable JavaScript and load the page.
**Expected vs Actual:** Expected server-rendered HTML for all content sections. Actual: only Navbar, Hero, ChannelBar, and Footer are server-rendered; everything else requires client-side JavaScript.

---

### [QA-06] — BeforeAfter uses old shadcn classes instead of 60-30-10 design system
**File:** `src/components/landing/BeforeAfter.tsx:28-90`
**Severity:** HIGH
**Description:** The BeforeAfter component uses shadcn/ui utility classes (`text-muted-foreground`, `bg-card`, `text-destructive`, `border-destructive/20`, `text-foreground`, `text-primary`) instead of the project's 60-30-10 CSS variable system (`text-[var(--text-secondary)]`, `bg-[var(--bg-raised)]`, etc.). This breaks the design system contract: if someone changes the theme by editing `globals.css` accent variables, this component will look inconsistent with the rest of the landing page. The section label at line 28 uses `text-primary` (Tailwind class mapped to `--primary` which is `--accent`) for a non-accent context, violating the 10% accent rule.
**Steps to Reproduce:** Compare BeforeAfter visual styling with other sections. Or switch to an alternate theme in globals.css.
**Expected vs Actual:** Expected consistent use of `var(--*)` variables. Actual: uses shadcn class names that may not map correctly to the 60-30-10 system.

---

### [QA-07] — Hardcoded background color in Navbar dropdown cards
**File:** `src/components/landing/Navbar.tsx:174`
**Severity:** MEDIUM
**Description:** The Navbar dropdown cards use a hardcoded `bg-[#161616]` instead of a design system variable like `bg-[var(--bg-raised)]` or `bg-[var(--bg-elevated)]`. If the theme is changed, this card background will remain static while surrounding elements update.
**Steps to Reproduce:** Inspect the dropdown card elements in the Navbar.
**Expected vs Actual:** Expected `bg-[var(--bg-raised)]` or similar variable. Actual: hardcoded `#161616`.

---

### [QA-08] — Register page uses hardcoded background colors
**File:** `src/app/register/page.tsx:108,149,166,185,206`
**Severity:** MEDIUM
**Description:** The register page hardcodes `bg-[#111111]` (line 108, 166), `bg-[#191919]` (line 149, 185, 206), and `bg-[#222222]` (line 149) instead of using CSS variables. These happen to match the current theme values but would break under a theme switch. The divider background (`bg-[#111111]` on the "or" separator) must exactly match the page background to look correct, making it especially fragile.
**Steps to Reproduce:** Switch to an alternate theme (e.g., uncomment Theme B in globals.css) and view the register page.
**Expected vs Actual:** Expected theme-aware variables. Actual: hardcoded hex values.

---

### [QA-09] — Annual pricing toggle "Save 17%" label color remains accent when toggle is active
**File:** `src/components/landing/Pricing.tsx:169`
**Severity:** LOW
**Description:** When the "Annual" toggle is active, the button gets `bg-[var(--cta)] text-[var(--cta-foreground)]` styling (warm cream background, dark text). However, the nested `<span className="text-[var(--accent)]">Save 17%</span>` retains its accent green color, which may have low contrast against the cream CTA background and looks inconsistent with the dark foreground text of the active state.
**Steps to Reproduce:** Click the "Annual" toggle in the Pricing section.
**Expected vs Actual:** Expected "Save 17%" text to match the active button foreground color. Actual: it stays accent green, creating a mixed-color label.

---

### [QA-10] — Dashboard iframe in Pricing may fail to load on first visit
**File:** `src/components/landing/Pricing.tsx:282-288`
**Severity:** MEDIUM
**Description:** The Pricing section embeds a dashboard preview via `<iframe src="/dashboard-demo?plan=${previewPlan}">`. While the `/dashboard-demo` route exists, loading an iframe adds significant weight to the page. The iframe has no `loading="lazy"` attribute, so it loads immediately when the Pricing section renders (though it is dynamically imported with `ssr: false`). There is also no fallback UI or loading state shown while the iframe content loads, resulting in a blank white/dark rectangle until the embedded page renders.
**Steps to Reproduce:** Load the landing page. Scroll to the Pricing section and observe the "See what you get" dashboard preview area.
**Expected vs Actual:** Expected a loading indicator or skeleton while iframe loads. Actual: blank area until iframe content renders.

---

### [QA-11] — Marquee animation width calculation may cause gap
**File:** `src/components/landing/ChannelBar.tsx:19,67`
**Severity:** LOW
**Description:** The marquee creates 4x duplicates of the 7-item channel array (28 items) and uses `translateX(-50%)` to loop. For a seamless infinite scroll, the translateX percentage must align with exactly half the total content width. With 4 copies, `translateX(-50%)` corresponds to 2 copies, which should work. However, the items use `mx-6 sm:mx-8` margins, and the total width varies with viewport. If the total rendered width of 2 copies does not exactly equal 50% of the container, there will be a visible jump/gap when the animation loops.
**Steps to Reproduce:** Watch the channel marquee carefully for a few cycles on different viewport widths.
**Expected vs Actual:** Expected seamless infinite scroll. Actual: potential visible jump at the loop point.

---

### [QA-12] — Mobile menu does not close on anchor link navigation
**File:** `src/components/landing/Navbar.tsx:240-253`
**Severity:** MEDIUM
**Description:** In the mobile menu, the dropdown section links (e.g., "AI Models" linking to `#features`) have an `onClick={() => setMobileOpen(false)}` handler. However, these links use plain `<a href>` tags with hash anchors. The mobile menu correctly closes via the onClick handler, but when the link points to an internal page route like `/docs` (line 63 of the dropdowns definition), the navigation uses a plain `<a href>` instead of Next.js `<Link>`, causing a full page reload instead of client-side navigation.
**Steps to Reproduce:** On mobile, open the hamburger menu. Click "Documentation" or "API Reference" link.
**Expected vs Actual:** Expected client-side navigation. Actual: full page reload.

---

### [QA-13] — Heading hierarchy skip: no h1 on page for SEO
**File:** `src/app/page.tsx:17-37`
**Severity:** MEDIUM
**Description:** The main `page.tsx` renders a `<main>` element but delegates heading rendering to child components. The h1 is inside the Hero component (`Hero.tsx:48`), which is good. However, because `page.tsx` is a client component (`"use client"` at line 1), the entire page including its metadata handling runs on the client. For the landing page specifically, the root page component being a client component is unnecessary since only some children need interactivity. This prevents Next.js from optimizing the page shell as a server component.
**Steps to Reproduce:** View page source. Note the entire page is client-rendered.
**Expected vs Actual:** Expected the page shell to be a server component with interactive children wrapped in client boundaries. Actual: entire page is a client component.

---

### [QA-14] — FAQ max-height transition may clip long answers
**File:** `src/components/landing/FAQ.tsx:65`
**Severity:** LOW
**Description:** The FAQ expand/collapse uses `max-h-96` (384px) as the open state. If any FAQ answer exceeds 384px in height (possible on narrow mobile screens with long text), the content will be clipped. The longest answer ("Mission Control is the Ultra-exclusive command center...") could approach this limit on small screens.
**Steps to Reproduce:** View FAQ on a narrow mobile viewport (320px wide). Open the Mission Control FAQ item.
**Expected vs Actual:** Expected full answer visible. Actual: content may be clipped at 384px.

---

### [QA-15] — Browser chrome dots use hardcoded macOS traffic light colors
**File:** `src/components/landing/Hero.tsx:117-119`
**Severity:** LOW (Intentional design choice)
**Description:** The browser mockup in the Hero uses hardcoded `#ff5f57`, `#ffbd2e`, `#28c840` for the macOS traffic light dots. These are standard macOS colors and are intentionally hardcoded (not theme-variable colors). Noting for completeness but this is acceptable as a decorative/skeuomorphic element.
**Steps to Reproduce:** N/A
**Expected vs Actual:** N/A - acceptable.

---

### [QA-16] — OpenClaw GitHub link in Footer may be a dead link
**File:** `src/components/landing/Footer.tsx:39`
**Severity:** HIGH
**Description:** The Footer links to `https://github.com/openclaw` as "OpenClaw GitHub". If this GitHub organization or repository does not exist, users clicking this link will see a 404 page, damaging credibility. The project references "OpenClaw" as the underlying technology but there is no verification that this exact GitHub URL is valid.
**Steps to Reproduce:** Click "OpenClaw GitHub" in the footer.
**Expected vs Actual:** Expected a valid GitHub repository page. Actual: may be a 404 if the URL is incorrect.

---

## Summary of Critical Path Issues

1. **4 entire sections missing from the page** (QA-01) -- ProductTour, Stats, WhyClawHQ, BeforeAfter are built but never rendered
2. **Dead anchor links** (QA-02, QA-03) -- Hero CTA and Footer link point to `#product-tour` which doesn't exist
3. **Pro/Ultra features invisible** (QA-04) -- Feature data defined but not rendered, hiding key selling points
4. **SSR disabled for all below-fold content** (QA-05) -- Major SEO impact
5. **Design system inconsistency** (QA-06, QA-07, QA-08) -- BeforeAfter and Register page use old color patterns
