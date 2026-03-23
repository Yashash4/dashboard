# Agent 20 — Landing Page — UX Reviewer Review

**Total Issues Found: 28**
- CRITICAL: 3 / HIGH: 9 / MEDIUM: 11 / LOW: 5

---

### [UX-01] — SSR disabled for below-fold sections kills SEO and harms perceived performance
**File:** `src/app/page.tsx:10-15`
**Severity:** CRITICAL
**Description:** All major content sections (Features, Pricing, HowItWorks, Comparison, FAQ, CTA) use `dynamic(() => import(...), { ssr: false })`. This means search engines receive an empty page below the hero. These sections contain pricing, feature lists, and FAQ content that are critical for SEO ranking and conversion.
**User Impact:** Google and other crawlers see no pricing, no features, no FAQ. This severely impacts organic search traffic and discoverability. Users on slow connections see blank space while JS loads.
**Recommendation:** Remove `{ ssr: false }` from all sections. Use `{ loading: () => <SectionSkeleton /> }` if lazy loading is desired, but keep SSR enabled. At minimum, Pricing and FAQ must be server-rendered for SEO.

---

### [UX-02] — Hero "See it in action" links to #product-tour but ProductTour component is not rendered on page
**File:** `src/components/landing/Hero.tsx:87` and `src/app/page.tsx:17-37`
**Severity:** CRITICAL
**Description:** The secondary CTA in the hero section links to `#product-tour`. However, looking at `page.tsx`, the `ProductTour`, `Stats`, `WhyClawHQ`, and `BeforeAfter` components are not imported or rendered anywhere on the page. The section order is: Hero, ChannelBar, Features, Pricing, HowItWorks, Comparison, FAQ, CTA, Footer. Clicking "See it in action" scrolls nowhere.
**User Impact:** Users clicking the secondary CTA experience a broken interaction. This is a dead link on the most prominent section of the page, damaging trust and wasting a high-intent interaction.
**Recommendation:** Either add `<ProductTour />` to the page layout, or change the hero secondary CTA to link to an existing section like `#features` or `#how-it-works`.

---

### [UX-03] — Pricing section embeds iframe to `/dashboard-demo` which may not exist or loads slowly
**File:** `src/components/landing/Pricing.tsx:281-288`
**Severity:** CRITICAL
**Description:** The pricing section includes an iframe loading `/dashboard-demo?plan=${previewPlan}` with a height of 500-600px. If this route does not exist or loads slowly, users see a large blank area in the middle of the pricing section. There is no loading state, error state, or fallback content for the iframe.
**User Impact:** A 500-600px blank iframe in the pricing section (the most conversion-critical section) will confuse users and damage credibility. If the page 404s inside the iframe, it looks broken.
**Recommendation:** Add a loading skeleton inside a wrapper div. Consider replacing the iframe with a static mockup similar to the ProductTour mockups, or at minimum add `onError` handling and a fallback.

---

### [UX-04] — BeforeAfter component uses shadcn theme tokens instead of design system CSS variables
**File:** `src/components/landing/BeforeAfter.tsx:28-34, 46-48, 62, 74, 89`
**Severity:** HIGH
**Description:** The BeforeAfter component uses `text-primary`, `text-muted-foreground`, `text-foreground`, `text-destructive`, `bg-card`, `border-destructive/20`, `border-primary/20` (shadcn tokens) instead of the 60-30-10 CSS variable system (`var(--text-primary)`, `var(--accent)`, etc.) used consistently across all other landing page components. This creates visual inconsistency.
**User Impact:** The BeforeAfter section will look subtly different from the rest of the landing page. Colors may not match the carefully tuned design system, making the page feel disjointed.
**Recommendation:** Refactor BeforeAfter to use the same `var(--*)` CSS variable pattern used in all other landing components. Replace `text-destructive` with `text-[var(--error)]`, `text-primary` with `text-[var(--accent)]`, `bg-card` with `bg-[var(--bg-raised)]`, etc.

---

### [UX-05] — No visible focus indicators on FAQ accordion buttons
**File:** `src/components/landing/FAQ.tsx:61`
**Severity:** HIGH
**Description:** The FAQ toggle buttons have no custom focus styling. While globals.css defines `:focus-visible` with an accent outline, the FAQ button's full-width layout means the focus ring spans the entire width, which can look awkward. More importantly, there is no visual indication of which FAQ item is currently focused for keyboard users navigating the accordion.
**User Impact:** Keyboard users cannot efficiently navigate the FAQ section. This fails WCAG 2.1 AA Success Criterion 2.4.7 (Focus Visible).
**Recommendation:** Add explicit focus-visible styles to the FAQ button, e.g., `focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]`.

---

### [UX-06] — Comparison and Pricing tables require horizontal scroll on mobile with minimal affordance
**File:** `src/components/landing/Comparison.tsx:99-101` and `src/components/landing/Pricing.tsx:299-301`
**Severity:** HIGH
**Description:** Both comparison tables show a small "Scroll ->" hint on mobile, but the text is 10px and easy to miss. The tables have `min-w-[600px]` forcing horizontal scroll. There are no scroll shadows or sticky first columns to help users maintain context while scrolling.
**User Impact:** Mobile users (likely 50%+ of traffic) will struggle with these tables. The feature column scrolls offscreen, making it impossible to know what row they are looking at. This is a significant conversion barrier since pricing comparison is a key decision-making tool.
**Recommendation:** Make the first column (feature names) sticky with `sticky left-0`. Add scroll shadow indicators on left/right edges. Consider a card-based mobile layout for the comparison table instead of forcing horizontal scroll.

---

### [UX-07] — Navbar dropdown buttons lack aria-expanded and aria-haspopup attributes
**File:** `src/components/landing/Navbar.tsx:127-139`
**Severity:** HIGH
**Description:** The dropdown trigger buttons in the desktop nav have no `aria-expanded`, `aria-haspopup`, or `aria-controls` attributes. Screen readers cannot communicate that these buttons open dropdown menus or whether the dropdown is currently open.
**User Impact:** Screen reader users cannot navigate the main navigation effectively. This fails WCAG 2.1 AA Success Criterion 4.1.2 (Name, Role, Value).
**Recommendation:** Add `aria-haspopup="true"` and `aria-expanded={activeDropdown === key}` to each dropdown button. Add `role="menu"` to the dropdown panel and `role="menuitem"` to dropdown links.

---

### [UX-08] — Navbar dropdowns only open on hover, not keyboard accessible
**File:** `src/components/landing/Navbar.tsx:126`
**Severity:** HIGH
**Description:** Desktop dropdown menus use `onMouseEnter`/`onMouseLeave` only. There is no `onClick`, `onFocus`, or keyboard handler. Tab-focusing the button does not open the dropdown. Pressing Enter or Space does nothing since there is no click handler.
**User Impact:** Keyboard-only users cannot access any dropdown navigation items (Features links, Pro & Ultra links, Resources links). This fails WCAG 2.1 AA Success Criterion 2.1.1 (Keyboard).
**Recommendation:** Add `onClick={() => setActiveDropdown(activeDropdown === key ? null : key)}` to toggle on click/Enter. Add `onKeyDown` handler for Escape to close. Add `onFocus` to open and manage focus trapping within the dropdown.

---

### [UX-09] — Mobile menu does not trap focus or handle Escape key
**File:** `src/components/landing/Navbar.tsx:230-270`
**Severity:** HIGH
**Description:** When the mobile menu is open, focus is not trapped within it. Users can tab past the menu to content behind it. Pressing Escape does not close the menu. The menu toggle button does not have `aria-expanded`.
**User Impact:** Keyboard and screen reader users experience a confusing interaction where focus escapes the visible menu area. This fails WCAG 2.1 AA Success Criterion 2.1.2 (No Keyboard Trap -- inverse: focus should be contained in open dialogs).
**Recommendation:** Add focus trapping when mobile menu is open. Add `aria-expanded={mobileOpen}` to the toggle button. Add Escape key handler: `onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}`.

---

### [UX-10] — ProductTour tabs missing aria-labelledby and tabpanel roles
**File:** `src/components/landing/ProductTour.tsx:185-199`
**Severity:** HIGH
**Description:** The tab buttons have `role="tab"` and `aria-selected` correctly, but there is no `role="tabpanel"` on the content area, no `aria-labelledby` linking panels to tabs, and no `id` attributes connecting them. The tablist also lacks `aria-label`.
**User Impact:** Screen reader users get incomplete tab pattern information. They hear tab roles but cannot navigate to associated panels. Partially implemented ARIA is worse than no ARIA.
**Recommendation:** Add `aria-label="Product tour sections"` to the tablist. Add `id` to each tab button. Add `role="tabpanel"` and `aria-labelledby` to the content area referencing the active tab's id.

---

### [UX-11] — Heading hierarchy skips from h2 to no h3 in multiple sections
**File:** `src/components/landing/WhyClawHQ.tsx:65`, `src/components/landing/Stats.tsx:26-28`
**Severity:** HIGH
**Description:** The Stats component uses `<p>` tags for what are visually presented as headings (stat numbers and labels). The WhyClawHQ section uses h3 for card titles which is correct, but Stats has no heading at all -- it is a standalone section with no h2. Screen readers presenting the document outline will have a gap in the heading hierarchy.
**User Impact:** Screen reader users navigating by headings will skip the Stats section entirely and may find the document structure confusing.
**Recommendation:** Add a visually hidden h2 to the Stats section: `<h2 className="sr-only">Platform statistics</h2>`. Ensure all sections have at least one heading in the hierarchy.

---

### [UX-12] — Inconsistent money-back guarantee messaging: 14-day vs 7-day
**File:** `src/components/landing/CTA.tsx:43` and `src/app/pricing/page.tsx:285`
**Severity:** HIGH
**Description:** The CTA section states "14-day money-back guarantee" while the pricing page states "7-day money-back guarantee". This is a direct contradiction in a trust signal that affects purchase decisions.
**User Impact:** Users who see both pages will notice the discrepancy, which erodes trust. If a user requests a refund on day 10, the support team has contradictory promises.
**Recommendation:** Align both to the same guarantee period. Update whichever is incorrect.

---

### [UX-13] — Hero badge text is too long and wraps awkwardly on mobile
**File:** `src/components/landing/Hero.tsx:41-44`
**Severity:** MEDIUM
**Description:** The hero badge contains: "No API keys. No per-token billing. No DevOps. From Agent Builder to Mission Control -- 274+ features, one platform." This is ~95 characters in a pill badge. On mobile, this wraps to 3-4 lines inside a rounded pill, which looks like a paragraph, not a badge.
**User Impact:** The badge loses its visual impact on mobile. It becomes the first block of text users read instead of a punchy signal. The "274+ features" claim is also very specific and may feel like marketing inflation.
**Recommendation:** Shorten to something like "No API keys. No DevOps. One subscription." or split into a badge + subtitle. Keep badges under 40 characters.

---

### [UX-14] — Primary CTA "Get Started" links to /pricing, not /register
**File:** `src/components/landing/Hero.tsx:77`
**Severity:** MEDIUM
**Description:** For non-authenticated users, the hero CTA "Get Started" links to `/pricing` instead of `/register`. This adds a step to the conversion funnel. Users must: Hero -> Pricing -> Choose Plan -> Register. The CTA text "Get Started" implies they will start the onboarding process, not view pricing.
**User Impact:** Users expecting to sign up are taken to a pricing page instead, adding friction. Some users may bounce thinking they need to evaluate pricing when they were ready to act.
**Recommendation:** Consider linking "Get Started" directly to `/register` or rename it to "See Plans" / "View Pricing" to match the destination. Alternatively, keep the flow but ensure the pricing page has a prominent, fast path to registration.

---

### [UX-15] — Section order puts Pricing before HowItWorks, disrupting the persuasion funnel
**File:** `src/app/page.tsx:28-32`
**Severity:** MEDIUM
**Description:** The page section order is: Hero -> ChannelBar -> Features -> Pricing -> HowItWorks -> Comparison -> FAQ -> CTA. Pricing appears before the user understands how the product works or why it is better than alternatives. Best practice for SaaS landing pages is: Problem -> Solution -> How it works -> Social proof -> Pricing -> FAQ -> CTA.
**User Impact:** Users see price tags before they understand the value proposition fully, leading to premature price anchoring and potential sticker shock without context.
**Recommendation:** Reorder to: Hero -> ChannelBar -> Features -> HowItWorks -> Comparison -> Pricing -> FAQ -> CTA. Let users understand the product and see the competitive comparison before encountering prices.

---

### [UX-16] — Hardcoded color #161616 in Navbar dropdown card
**File:** `src/components/landing/Navbar.tsx:174`
**Severity:** MEDIUM
**Description:** The dropdown card uses `bg-[#161616]` instead of a CSS variable from the design system. The CLAUDE.md rules explicitly state "NEVER hardcode colors in components."
**User Impact:** If the design system colors are changed, this card will not update, creating a visual inconsistency.
**Recommendation:** Replace `bg-[#161616]` with `bg-[var(--bg-elevated)]` or `bg-[var(--bg-raised)]`.

---

### [UX-17] — Hardcoded colors in register page
**File:** `src/app/register/page.tsx:108, 149, 166`
**Severity:** MEDIUM
**Description:** The register page uses hardcoded colors `bg-[#111111]`, `bg-[#191919]`, `bg-[#222222]` instead of the design system CSS variables. This page is part of the conversion funnel and should be visually consistent with the landing page.
**User Impact:** The register page will not update if the design system is themed, creating a disconnected experience between the landing page and signup flow.
**Recommendation:** Replace `bg-[#111111]` with `bg-[var(--bg-raised)]`, `bg-[#191919]` with `bg-[var(--bg-elevated)]`, etc.

---

### [UX-18] — Browser mockup dots use hardcoded colors
**File:** `src/components/landing/Hero.tsx:117-119`
**Severity:** LOW
**Description:** The browser chrome traffic light dots use hardcoded colors `#ff5f57`, `#ffbd2e`, `#28c840`. While these are standard macOS window control colors, they break the design system rule.
**User Impact:** Minor -- these are decorative and universally recognized. However, they technically violate the project's color rules.
**Recommendation:** These are acceptable as-is since they represent a real-world UI element (macOS window controls). No change needed unless strict adherence is required.

---

### [UX-19] — No loading state for Supabase auth check causes flash of wrong CTA
**File:** `src/components/landing/Hero.tsx:17-25` and `src/components/landing/Navbar.tsx:91-97`
**Severity:** MEDIUM
**Description:** Both Hero and Navbar check auth state with `supabase.auth.getUser()` in a `useEffect`. The initial state is `null`, so logged-in users first see "Get Started" / "Log in" buttons, then they flash to "Go to Dashboard" / "Dashboard" after the auth check resolves. Two separate Supabase client instances are also created unnecessarily.
**User Impact:** Logged-in users experience a visible flash of unauthenticated CTAs, which feels janky and unpolished. On slow connections, this can last several seconds.
**Recommendation:** Lift auth state to a shared context or use a loading state. Show a neutral loading state (e.g., a shimmer placeholder) for CTA buttons until auth resolves.

---

### [UX-20] — FAQ accordion only allows one item open at a time with no keyboard navigation between items
**File:** `src/components/landing/FAQ.tsx:73, 96`
**Severity:** MEDIUM
**Description:** The FAQ uses a single `openIndex` state, so only one item can be open at a time. There is no arrow key navigation between FAQ items. Users cannot open multiple items to compare answers.
**User Impact:** Users wanting to compare answers (e.g., "What's in Pro?" vs "What's in Ultra?") must toggle back and forth, losing context each time. Power users expect arrow key navigation in accordion patterns.
**Recommendation:** Consider allowing multiple items open simultaneously. Add arrow key navigation between FAQ items following the WAI-ARIA Accordion pattern.

---

### [UX-21] — Comparison section lacks ID anchor, cannot be linked to from nav
**File:** `src/components/landing/Comparison.tsx:74`
**Severity:** MEDIUM
**Description:** The Comparison section has no `id` attribute on its `<section>` element, so it cannot be linked to via anchor navigation. Other sections like Features (`#features`), Pricing (`#pricing`), FAQ (`#faq`), and HowItWorks (`#how-it-works`) all have IDs.
**User Impact:** The comparison section cannot be deep-linked or scrolled to from navigation, despite being a valuable sales tool.
**Recommendation:** Add `id="comparison"` to the section element.

---

### [UX-22] — Missing social proof / testimonials section
**File:** `src/app/page.tsx`
**Severity:** MEDIUM
**Description:** The landing page has no testimonials, case studies, customer logos, or social proof of any kind. The Stats section shows platform capabilities but no evidence of customer success or adoption. For a $59-$350/mo SaaS product, social proof is critical for conversion.
**User Impact:** Visitors have no third-party validation that the product works as claimed. This is one of the most common reasons for low conversion rates on SaaS landing pages.
**Recommendation:** Add a testimonials section or customer logo bar. Even 2-3 early customer quotes would significantly improve conversion. If no customers yet, consider showing the OpenClaw GitHub stars or community size as social proof.

---

### [UX-23] — Features section removed Pro and Ultra feature grids (code present but not rendered)
**File:** `src/components/landing/Features.tsx:234-252, 273-396`
**Severity:** MEDIUM
**Description:** The Features component defines `proFeatures` (8 items) and `ultraFeatures` (6 items) arrays with full data, but the component's JSX only renders `starterFeatures`. The Pro and Ultra feature cards are defined but never displayed. This leaves 14 features worth of content invisible.
**User Impact:** Users only see the base platform features on the landing page. The value proposition for Pro ($129/mo) and Ultra ($350/mo) tiers is significantly weaker without showing their exclusive features in the Features section.
**Recommendation:** Add the Pro and Ultra feature grids back to the Features section JSX, with clear tier labels. This content was defined for a reason and helps justify the higher-tier pricing.

---

### [UX-24] — Touch target size on mobile nav links may be too small
**File:** `src/components/landing/Navbar.tsx:243-252`
**Severity:** LOW
**Description:** Mobile menu links use `py-2` (8px top/bottom) + text, making the total touch target approximately 36-38px tall. WCAG 2.5.8 (Target Size Minimum) recommends 24px minimum and 2.5.5 recommends 44px for optimal touch targets.
**User Impact:** Mobile users may have difficulty tapping specific navigation links, especially those with shorter labels.
**Recommendation:** Increase padding to `py-3` (12px) to ensure touch targets are at least 44px tall.

---

### [UX-25] — Footer mixes auth links in "Legal" column
**File:** `src/components/landing/Footer.tsx:58-68`
**Severity:** LOW
**Description:** The "Legal" footer column contains "Terms of Service", "Privacy Policy", "Log in", and "Sign up". Authentication links are not legal links and do not belong in this category.
**User Impact:** Users looking for login/signup in the footer may not think to look under "Legal". Users looking for legal documents may be confused by auth links mixed in.
**Recommendation:** Move "Log in" and "Sign up" to a separate "Account" column, or add them as standalone links in the footer bottom bar.

---

### [UX-26] — ChannelBar marquee may not loop seamlessly
**File:** `src/components/landing/ChannelBar.tsx:19, 67-74`
**Severity:** LOW
**Description:** The marquee duplicates the channels array 4 times (`[...channels, ...channels, ...channels, ...channels]`) and uses CSS `translateX(-50%)`. With 4 duplications and a -50% translation, the loop should work, but the exact seamlessness depends on the total content width. If the content does not exactly fill 2x the viewport, there will be a visible jump.
**User Impact:** Minor visual glitch if the marquee jumps at the loop point.
**Recommendation:** Verify the marquee loops smoothly across common viewport widths. Consider using 2 duplications with `-50%` which is the standard pattern.

---

### [UX-27] — No error boundary around dynamic imports
**File:** `src/app/page.tsx:10-15`
**Severity:** LOW
**Description:** The dynamically imported sections have no error boundaries. If any section fails to load (network error, JS error), the entire page below that point may fail silently or show a React error.
**User Impact:** On flaky connections, users could see a partially rendered page with no indication that content failed to load.
**Recommendation:** Wrap dynamic sections in React Error Boundaries or use the `loading` option of `next/dynamic` to provide fallback UI.

---

### [UX-28] — CTA section "Book a Demo" uses mailto link instead of a proper booking flow
**File:** `src/components/landing/CTA.tsx:36`
**Severity:** MEDIUM
**Description:** The "Book a Demo" button uses `mailto:hello@clawhq.tech?subject=Book a Demo`. This requires users to have a configured email client, which many web-only users do not. On mobile, this may open an unexpected app. There is no confirmation that the email was sent, and no scheduling capability.
**User Impact:** Users who click "Book a Demo" and do not have a mail client configured will see an error or nothing at all. The lack of a proper scheduling tool (e.g., Calendly) means lost demo opportunities.
**Recommendation:** Replace with a Calendly/Cal.com embed or link, or at minimum add a contact form as an alternative path.
