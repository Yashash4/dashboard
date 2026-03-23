# Agent 28 — Docs — Frontend Developer Review

**Total Issues Found: 16**
- CRITICAL: 2 / HIGH: 5 / MEDIUM: 6 / LOW: 3

---

### [FE-01] — Hardcoded `bg-zinc-900` on all API doc code blocks
**File:** `src/app/docs/api/agents/page.tsx:14`, `src/app/docs/api/models/page.tsx:14`, and throughout both files
**Severity:** CRITICAL
**Description:** All `<pre>` elements in the API doc pages use `bg-zinc-900` as a hardcoded background color. The design system mandates that ALL colors come from CSS variables in `globals.css`. The correct approach would be something like `bg-[var(--bg-elevated)]` or `bg-[var(--bg-raised)]`.
**Impact:** If the color theme is changed in `globals.css`, these code blocks will remain zinc-900 and break visual consistency across the site.
**Suggestion:** Replace all `bg-zinc-900` with `bg-[var(--bg-elevated)]` or a similar design system variable. This appears on lines 14, 21, 32, 158, 162, 179 in agents page; lines 14, 21, 33, 135, 139, 155 in models page.

### [FE-02] — Hardcoded `text-white` and `border-white/*` across API doc tables
**File:** `src/app/docs/api/agents/page.tsx:66,72`, `src/app/docs/api/models/page.tsx:78,85`, and throughout
**Severity:** CRITICAL
**Description:** Table headers use `text-white` and borders use `border-white/10` and `border-white/5` as hardcoded colors. Per the design system, these should use CSS variables like `var(--text-primary)` for white text and `var(--border-primary)` or `var(--border-subtle)` for borders.
**Impact:** These hardcoded whites will not adapt if the theme system is updated, breaking the 60-30-10 color rule. Appears in every `not-prose` table across agents, models, and pro/api pages.
**Suggestion:** Replace `text-white` with `text-[var(--text-primary)]`, `border-white/10` with `border-[var(--border-primary)]`, and `border-white/5` with `border-[var(--border-subtle)]`.

### [FE-03] — Hardcoded `#ffe0c2` in PRO badge spans
**File:** `src/app/docs/pro/page.tsx:8`, `src/app/docs/pro/api/page.tsx:8`
**Severity:** HIGH
**Description:** The PRO badge uses hardcoded hex color `bg-[#ffe0c2]/10 text-[#ffe0c2]`. The design system has a `--cta` variable set to `#ffe0c2` and a `--tier-pro` variable for pro badges. These should be used instead.
**Impact:** If the CTA or tier-pro color is changed in `globals.css`, these badges will remain hardcoded and visually inconsistent.
**Suggestion:** Use `bg-[var(--cta)]/10 text-[var(--cta)]` or, more appropriately, `bg-[var(--tier-pro)]/10 text-[var(--tier-pro)]` since these are Pro tier badges.

### [FE-04] — Hardcoded `text-amber-400` and `bg-amber-500/*` in warning callouts
**File:** `src/app/docs/account/page.tsx:134-135`, `src/app/docs/billing/page.tsx:102-103`, `src/app/docs/channels/page.tsx:213-214`, `src/app/docs/support/page.tsx:74-75,198-199`
**Severity:** HIGH
**Description:** Warning callout boxes use hardcoded Tailwind amber colors (`text-amber-400`, `bg-amber-500/5`, `border-amber-500/20`) instead of the design system `--warning` variable.
**Impact:** Warning colors are not controlled by the theme system, making global color changes incomplete.
**Suggestion:** Replace with `text-[var(--warning)]`, `bg-[var(--warning)]/5`, and `border-[var(--warning)]/20`.

### [FE-05] — Hardcoded `text-white` and `border-white/*` in docs-header and docs-sidebar
**File:** `src/components/docs/docs-header.tsx:17,30,35,36,48,64`, `src/components/docs/docs-sidebar.tsx:67,73,78,81,84,94,97,104`
**Severity:** HIGH
**Description:** Both doc layout components extensively use hardcoded `text-white`, `text-white/40`, `text-white/50`, `text-white/70`, `border-white/10`, `border-white/[0.06]`, and `bg-white/10`. These should use design system variables like `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`, and `var(--border-primary)`.
**Impact:** The entire docs navigation will not respond to theme changes.
**Suggestion:** Map each opacity level to the appropriate CSS variable: `text-white` -> `text-[var(--text-primary)]`, `text-white/50` -> `text-[var(--text-tertiary)]`, `text-white/40` -> `text-[var(--text-tertiary)]`, `border-white/10` -> `border-[var(--border-primary)]`.

### [FE-06] — Tip callout `strong` elements use hardcoded `text-white`
**File:** `src/app/docs/api/agents/page.tsx:118`, `src/app/docs/api/models/page.tsx:126,185`
**Severity:** MEDIUM
**Description:** Inside tip callout boxes, `<strong className="text-white">` is used instead of design system variables.
**Impact:** Minor theme inconsistency; these labels won't adapt to non-dark themes.
**Suggestion:** Replace `text-white` with `text-[var(--text-primary)]`.

### [FE-07] — Tables in account, billing, channels, support pages lack responsive overflow handling
**File:** `src/app/docs/account/page.tsx:58-88`, `src/app/docs/billing/page.tsx:32-58`, `src/app/docs/channels/page.tsx:21-38`, `src/app/docs/support/page.tsx:59-72,154-167`
**Severity:** HIGH
**Description:** These pages use bare `<table>` elements inside `prose prose-invert` containers without any `overflow-x-auto` wrapper. On small screens, wide tables (especially the billing plan comparison at 5 columns) will overflow the viewport and cause horizontal page scrolling. The API doc pages correctly wrap tables in `<div className="not-prose overflow-x-auto my-6">` but these pages do not.
**Impact:** On mobile devices, the billing plan comparison table and notification preferences table will overflow, causing a broken layout with horizontal scrolling on the entire page.
**Suggestion:** Wrap all `<table>` elements in `<div className="not-prose overflow-x-auto my-6">` as done in the API doc pages.

### [FE-08] — Code blocks in pro/api page lack styling
**File:** `src/app/docs/pro/api/page.tsx:31,88,120-128,134-137,143-156,160-175,179-182,186-199,226-229`
**Severity:** HIGH
**Description:** All `<pre><code>` blocks in the Pro API Access page use unstyled `<pre>` tags without the `bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto` classes that are applied in other API doc pages. While those classes themselves should use CSS variables (see FE-01), at minimum the code blocks need background color, padding, border-radius, and overflow handling.
**Impact:** Code blocks render with default prose styling, which may have poor contrast, no padding, and no horizontal scroll on narrow screens.
**Suggestion:** Add consistent code block styling, ideally using CSS variables: `className="bg-[var(--bg-elevated)] rounded-lg p-4 text-sm overflow-x-auto"`.

### [FE-09] — No keyboard navigation support in docs-sidebar section buttons
**File:** `src/components/docs/docs-sidebar.tsx:91-101`
**Severity:** MEDIUM
**Description:** The sidebar section navigation uses `<button>` elements, which are natively keyboard-focusable (good). However, there is no visible focus indicator styled beyond the browser default, and no `aria-current` attribute is set on the active section. The active state only uses color changes which may not be sufficient for keyboard-only users.
**Impact:** Keyboard-only users can tab to buttons but may struggle to identify the currently active section without color perception.
**Suggestion:** Add `aria-current={activeSection === s.id ? "true" : undefined}` to the active button and ensure a visible focus ring, e.g., `focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.

### [FE-10] — Mobile menu button lacks aria-label
**File:** `src/components/docs/docs-sidebar.tsx:121`
**Severity:** MEDIUM
**Description:** The mobile hamburger menu button (`<button className="lg:hidden ...">`) has no `aria-label` attribute, so screen readers will announce it as an empty button.
**Impact:** Screen reader users cannot identify the purpose of the menu toggle button.
**Suggestion:** Add `aria-label="Open navigation menu"` to the button.

### [FE-11] — Sidebar nav element lacks aria-label
**File:** `src/components/docs/docs-sidebar.tsx:64`
**Severity:** MEDIUM
**Description:** The `<nav>` element in the sidebar has no `aria-label` to distinguish it from other nav landmarks on the page (the header also contains navigation).
**Impact:** Screen reader users navigating by landmarks will see multiple unlabeled nav elements.
**Suggestion:** Add `aria-label="Documentation navigation"` to the sidebar `<nav>` element.

### [FE-12] — DOC_PAGES duplicated between docs-header and docs-sidebar
**File:** `src/components/docs/docs-header.tsx:7-11`, `src/components/docs/docs-sidebar.tsx:20-24`
**Severity:** MEDIUM
**Description:** The `DOC_PAGES` array is defined independently in both components with the same data (albeit slightly different shape — sidebar adds an `icon` field). This duplication means any navigation structure change must be made in two places.
**Impact:** Maintenance risk; the two lists can easily drift out of sync.
**Suggestion:** Extract `DOC_PAGES` into a shared constant file (e.g., `src/lib/docs-nav.ts`) and import it in both components.

### [FE-13] — IntersectionObserver does not include `sections` in dependency array
**File:** `src/components/docs/docs-sidebar.tsx:37-52`
**Severity:** MEDIUM
**Description:** The `useEffect` hook that sets up the `IntersectionObserver` has an empty dependency array `[]`. If the `sections` prop changes (e.g., navigating between doc pages in a single-page-app context), the observer will not reinitialize to track the new sections.
**Impact:** If sections change without a full remount, the sidebar active state tracking will be stale. In practice this may not manifest if Next.js does full page navigations, but it is a latent bug.
**Suggestion:** Add `[sections]` to the dependency array of the useEffect.

### [FE-14] — Inconsistent Link styling across doc pages
**File:** Multiple files
**Severity:** LOW
**Description:** Links in "Next Steps" sections use inconsistent class combinations. Some use `text-primary hover:underline` (account, billing, channels, support pages), some use just `text-primary` without hover underline (agents page lines 225-227, models page lines 219-221), and the pro/api page has completely unstyled `<Link>` elements (lines 93, 216, 234-237).
**Impact:** Inconsistent link appearance across documentation pages. Unstyled links may not be visually distinguishable from regular text.
**Suggestion:** Standardize all doc links to use `className="text-primary hover:underline"` consistently.

### [FE-15] — Doc pages do not use the DocsSidebar layout component
**File:** All doc pages in scope
**Severity:** LOW
**Description:** All documentation pages render a standalone `<article>` element without wrapping in the `DocsSidebar` layout component. This means these pages have no sidebar navigation, no table of contents, and no mobile menu. The `DocsSidebar` component exists but appears to only be used by the main API docs page (`/docs`). Every other doc page renders as a bare article, likely without the docs header either, relying on the parent layout.
**Impact:** Users navigating to `/docs/billing`, `/docs/channels`, etc. may not see the same navigation structure as the main docs page, creating an inconsistent documentation experience.
**Suggestion:** Either wrap all doc pages in the `DocsSidebar` component with appropriate section definitions, or create a shared docs layout in `src/app/docs/layout.tsx` that provides consistent navigation.

### [FE-16] — DOC_PAGES nav only lists 3 pages out of 12+ doc pages
**File:** `src/components/docs/docs-header.tsx:7-11`, `src/components/docs/docs-sidebar.tsx:20-24`
**Severity:** LOW
**Description:** The navigation arrays only contain 3 entries (Chat API, Webhooks, Knowledge Base) despite there being 12+ documentation pages (account, billing, channels, support, pro, pro/api, analytics, knowledge-base, monitoring, api/agents, api/models). Most doc pages are unreachable from the docs navigation.
**Impact:** Users cannot discover or navigate to most documentation pages from the docs header or sidebar navigation.
**Suggestion:** Add all doc pages to the navigation array, potentially organized into groups (Getting Started, API Reference, Pro Features, etc.).
