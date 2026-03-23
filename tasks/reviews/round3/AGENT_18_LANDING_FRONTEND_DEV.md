# Agent 18 — Landing Page — Frontend Developer Review

**Total Issues Found: 19**
- CRITICAL: 2 / HIGH: 6 / MEDIUM: 7 / LOW: 4

---

### [FE-01] — Hardcoded color `#161616` in Navbar card background
**File:** `src/components/landing/Navbar.tsx:174`
**Severity:** HIGH
**Description:** The dropdown card uses `bg-[#161616]` instead of a CSS variable. This violates the 60-30-10 design system rule that ALL colors must come from CSS variables in `globals.css`.
**Impact:** If the theme is changed via globals.css alternate themes, these cards will remain hardcoded dark, breaking visual consistency.
**Suggestion:** Replace `bg-[#161616]` with `bg-[var(--bg-raised)]` or `bg-[var(--bg-elevated)]`.

---

### [FE-02] — Hardcoded colors `#ff5f57`, `#ffbd2e`, `#28c840` in Hero browser chrome
**File:** `src/components/landing/Hero.tsx:117-119`
**Severity:** MEDIUM
**Description:** The browser mockup traffic light dots use hardcoded hex colors: `bg-[#ff5f57]`, `bg-[#ffbd2e]`, `bg-[#28c840]`. These are standard macOS window button colors and are arguably decorative, but they still violate the design system rule.
**Impact:** Minor visual inconsistency if themes change. These are decorative elements mimicking OS chrome, so the impact is limited.
**Suggestion:** Either accept these as intentional decorative elements (add a comment explaining the exception) or map them to CSS variables like `--chrome-close`, `--chrome-minimize`, `--chrome-maximize`.

---

### [FE-03] — BeforeAfter component uses shadcn semantic classes instead of CSS variables
**File:** `src/components/landing/BeforeAfter.tsx:28,34,46-48,61-62,74,76,89`
**Severity:** CRITICAL
**Description:** The entire BeforeAfter component uses shadcn/Tailwind semantic classes (`text-primary`, `text-muted-foreground`, `text-destructive`, `bg-card`, `border-destructive/20`, `border-primary/20`, `text-foreground`) instead of the explicit CSS variable pattern (`text-[var(--text-primary)]`, `bg-[var(--bg-raised)]`, etc.) used by every other landing component. While these do map through to the CSS variables, this is an architectural inconsistency.
**Impact:** This component looks like it was built separately or at a different time. While it functionally works because the shadcn mappings exist in globals.css, it breaks the convention used by every other landing component, making the codebase inconsistent and harder to maintain.
**Suggestion:** Refactor to use the explicit `var(--*)` pattern matching all other landing components. For example: `text-primary` -> `text-[var(--text-primary)]`, `bg-card` -> `bg-[var(--bg-raised)]`, `text-destructive` -> `text-[var(--error)]`, `text-muted-foreground` -> `text-[var(--text-secondary)]`.

---

### [FE-04] — `ssr: false` on all dynamically imported sections harms SEO
**File:** `src/app/page.tsx:10-15`
**Severity:** CRITICAL
**Description:** Six landing page sections (Features, Pricing, HowItWorks, Comparison, FAQ, CTA) use `dynamic(() => import(...), { ssr: false })`. This means all content below the fold is completely invisible to search engine crawlers and produces no server-rendered HTML. For a landing page where SEO is critical, this eliminates indexable content for pricing, features, FAQ, and comparison sections.
**Impact:** Search engines will not index the majority of the landing page content. The FAQ section alone contains 12 rich question-answer pairs that would be valuable for SEO. Pricing, feature descriptions, and comparison content are all invisible to crawlers.
**Suggestion:** Remove `{ ssr: false }` from these dynamic imports to enable server-side rendering. If the goal is code splitting, `dynamic()` without `{ ssr: false }` still achieves lazy loading while preserving SSR. Alternatively, import them statically since they are essential landing page content.

---

### [FE-05] — Supabase client created on every render in Hero and Navbar
**File:** `src/components/landing/Hero.tsx:20-23`, `src/components/landing/Navbar.tsx:92-96`
**Severity:** HIGH
**Description:** Both Hero and Navbar create a new Supabase browser client inside `useEffect` on every mount. While `createBrowserClient` may deduplicate internally, creating client instances inside effects is not the intended pattern. The project already has a dedicated `src/lib/supabase.ts` for browser client creation.
**Impact:** Potential unnecessary network requests and client instantiation. Diverges from the project's established pattern of using `src/lib/supabase.ts`.
**Suggestion:** Import the shared browser client from `src/lib/supabase.ts` instead of calling `createBrowserClient` directly in each component.

---

### [FE-06] — Navbar timeout ref not cleared on unmount
**File:** `src/components/landing/Navbar.tsx:83,105`
**Severity:** MEDIUM
**Description:** `timeoutRef` is set with `setTimeout` in `handleLeave` (line 105) but there is no cleanup on component unmount. If the component unmounts while a timeout is pending, `setActiveDropdown(null)` will be called on an unmounted component.
**Impact:** React will log a warning about state updates on unmounted components. In practice, since the Navbar persists for the page lifetime, this is unlikely to trigger, but it is still a memory leak pattern.
**Suggestion:** Add a cleanup effect: `useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);`

---

### [FE-07] — Inline `<style>` block in Features component re-injected on every render
**File:** `src/components/landing/Features.tsx:275-326`
**Severity:** HIGH
**Description:** A large inline `<style>` block (50+ lines of CSS with 6 keyframe animations) is embedded directly in JSX. This CSS string is re-injected into the DOM on every render cycle. It defines global keyframes and class-based selectors that could conflict with other components.
**Impact:** Performance cost from re-parsing CSS on each render. The selectors like `.anim-float` and `.anim-wave` are global and could inadvertently affect other components that use the same class names. Also prevents CSS optimization by the build tool.
**Suggestion:** Move these animations to `globals.css` or a CSS module. The keyframes and class rules are static and belong in a stylesheet, not inline JSX.

---

### [FE-08] — FAQ accordion uses `max-h-96` which can clip long answers
**File:** `src/components/landing/FAQ.tsx:65`
**Severity:** MEDIUM
**Description:** The FAQ expand/collapse animation uses `max-h-96` (384px) as the "open" state. If any FAQ answer exceeds 384px in height (which could happen on narrow mobile screens with long text), the content will be clipped.
**Impact:** On mobile devices with narrow viewports, longer FAQ answers could be cut off without any visual indication that content is hidden.
**Suggestion:** Use a larger max-height value (e.g., `max-h-[1000px]`) or implement a proper height animation using a ref to measure actual content height. The transition duration is already set, so the animation speed won't be affected by a larger max-height value.

---

### [FE-09] — Missing `aria-expanded` on FAQ toggle buttons
**File:** `src/components/landing/FAQ.tsx:61`
**Severity:** MEDIUM
**Description:** The FAQ toggle button lacks `aria-expanded` attribute. Screen readers cannot determine whether a FAQ item is expanded or collapsed.
**Impact:** Accessibility issue for users relying on screen readers or assistive technology.
**Suggestion:** Add `aria-expanded={isOpen}` to the `<button>` element and `aria-controls` pointing to the collapsible content's id.

---

### [FE-10] — ProductTour tab panels missing `role="tabpanel"` and `aria-labelledby`
**File:** `src/components/landing/ProductTour.tsx:201-218`
**Severity:** MEDIUM
**Description:** The tab buttons correctly have `role="tab"` and `aria-selected`, but the corresponding content panels lack `role="tabpanel"`, `aria-labelledby`, and `id` attributes. This makes the tab interface incomplete for accessibility.
**Impact:** Screen reader users can activate tabs but the relationship between tabs and panels is not communicated.
**Suggestion:** Add `role="tabpanel"`, `id={activeTab + "-panel"}`, and `aria-labelledby={activeTab + "-tab"}` to the panel containers. Add matching `id` to the tab buttons.

---

### [FE-11] — Mobile menu does not trap focus or handle Escape key
**File:** `src/components/landing/Navbar.tsx:230-271`
**Severity:** HIGH
**Description:** When the mobile navigation menu opens, focus is not trapped inside it, and pressing Escape does not close it. Users can tab through to elements behind the overlay.
**Impact:** Keyboard-only users cannot close the mobile menu without clicking, and they may tab to hidden elements behind the overlay.
**Suggestion:** Add an `onKeyDown` handler that closes the menu on Escape. Implement focus trapping so Tab cycles within the menu while it's open.

---

### [FE-12] — Scroll event listener in Navbar lacks throttling
**File:** `src/components/landing/Navbar.tsx:86-88`
**Severity:** MEDIUM
**Description:** The scroll event handler `() => setScrolled(window.scrollY > 20)` fires on every scroll event without throttling or using `passive: true`. While the handler is lightweight, it triggers a React state update and potential re-render on every scroll frame.
**Impact:** On lower-end devices, rapid scroll events causing frequent re-renders could degrade scroll performance.
**Suggestion:** Add `{ passive: true }` to the event listener options. Consider throttling with `requestAnimationFrame` or a simple threshold check to avoid state updates when the value hasn't changed.

---

### [FE-13] — Marquee animation may not seamlessly loop with 4x duplication
**File:** `src/components/landing/ChannelBar.tsx:19`
**Severity:** LOW
**Description:** The channel items are quadrupled (`[...channels, ...channels, ...channels, ...channels]`) for the marquee effect, and the animation translates by `-50%`. With 4x items and a -50% translation, the loop should be seamless (translating past 2 copies then resetting). However, this creates 28 DOM nodes for what only needs 14 (2x duplication for -50% translation).
**Impact:** Unnecessary DOM nodes (28 instead of 14). Minor memory/layout cost.
**Suggestion:** Use only 2x duplication (`[...channels, ...channels]`) since the animation uses `translateX(-50%)` which means it needs exactly two copies to loop seamlessly.

---

### [FE-14] — `useEffect` with IntersectionObserver toggling `inView` causes animation restart
**File:** `src/components/landing/Features.tsx:262-271`
**Severity:** HIGH
**Description:** The IntersectionObserver sets `inView` to `true` when visible and `false` when not. The CSS class `section-visible` controls all feature animations. When a user scrolls past the section and back, all animations restart from scratch because `inView` toggles. This creates jarring animation restarts.
**Impact:** Animations flicker/restart every time the user scrolls the Features section in and out of viewport.
**Suggestion:** Use a one-way flag: once `inView` is set to `true`, never set it back to `false`. This is the typical pattern for scroll-triggered animations. Change the callback to: `if (entry.isIntersecting) { setInView(true); observer.disconnect(); }`.

---

### [FE-15] — Pricing iframe reloads on plan switch
**File:** `src/components/landing/Pricing.tsx:282-288`
**Severity:** HIGH
**Description:** The dashboard preview uses `<iframe key={previewPlan} src={...}>`. Because `key` changes when the plan switches, React unmounts and remounts the entire iframe, causing a full page load for each plan switch. This creates a visible flash/loading state.
**Impact:** Poor UX with visible loading flashes when switching between Starter/Pro/Ultra previews. Each switch triggers a full iframe navigation.
**Suggestion:** Instead of using `key` to force remount, use a single iframe and communicate plan changes via `postMessage`, or preload all three iframes and toggle visibility with CSS. Alternatively, use the mock components from ProductTour instead of iframes.

---

### [FE-16] — Missing `loading` and `loading` fallback for dynamically imported components
**File:** `src/app/page.tsx:10-15`
**Severity:** MEDIUM
**Description:** All six dynamically imported components use `dynamic()` with `{ ssr: false }` but no `loading` fallback. While the components load, users see empty space where content should be, causing layout shift.
**Impact:** Cumulative Layout Shift (CLS) as components pop in after JavaScript loads. Poor Core Web Vitals score.
**Suggestion:** Add a `loading` property to each `dynamic()` call that renders a skeleton placeholder matching the section's approximate height: `dynamic(() => import(...), { loading: () => <div className="h-[600px]" /> })`.

---

### [FE-17] — Unused `previewPlan` state type is too narrow
**File:** `src/components/landing/Pricing.tsx:102,133`
**Severity:** LOW
**Description:** The type `PlanId` is defined as `"starter" | "pro" | "ultra"` but the `plans` array also includes `"enterprise"`. While `enterprise` is intentionally excluded from the preview switcher, the type is defined at module scope where it could be confused with the full plan set.
**Impact:** Minor readability/maintenance concern. A developer might expect `PlanId` to cover all plans.
**Suggestion:** Rename to `PreviewPlanId` to make it clear this type is for the preview switcher only.

---

### [FE-18] — Activity feed items use array index as key
**File:** `src/components/landing/Hero.tsx:252`
**Severity:** LOW
**Description:** The activity feed uses `key={i}` (array index) as the React key. While this is a static list that never changes, it's a common anti-pattern.
**Impact:** No functional impact since the list is static and never reordered/filtered.
**Suggestion:** Use a more meaningful key like `key={item.action + item.time}` or add an `id` field to each item.

---

### [FE-19] — Chart bar items in Hero use array index as key
**File:** `src/components/landing/Hero.tsx:224`
**Severity:** LOW
**Description:** The stacked bar chart renders 30 bars using `key={i}`. Like FE-18, this is a static decorative element.
**Impact:** No functional impact since the data is static.
**Suggestion:** Acceptable for static decorative data, but adding a comment clarifying the list is static would improve maintainability.
