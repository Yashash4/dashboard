# DOCS_FRONTEND Review

**Reviewer role:** Frontend Developer
**Scope:** Docs site layout, navigation, search, rendering, responsiveness
**Date:** 2026-03-16

---

## 1. Architecture Overview

The docs site lives under `dashboard/src/app/docs/` and uses a Next.js App Router layout. There are two distinct doc systems:

1. **Main docs** (`/docs`, `/docs/getting-started`, `/docs/pro/*`, `/docs/ultra/*`, etc.) -- uses `docs-nav.tsx` sidebar via `layout.tsx`.
2. **Legacy API reference docs** (`api-docs.tsx`, `webhooks-docs.tsx`, `knowledge-base-docs.tsx`) -- uses a separate `docs-sidebar.tsx` + `docs-header.tsx` layout with its own `DocsSidebar` wrapper component and `IntersectionObserver`-based scroll-spy.

These two systems are architecturally separate and visually inconsistent.

---

## 2. Sidebar Navigation

### Main Docs Nav (`docs-nav.tsx`)

- **Status: Functional with minor issues**
- 6 groups defined in `DOCS_NAV`: Getting Started (3), Dashboard (10), Pro Features (9), Ultra Features (5), API Reference (6), Help (2) -- 35 links total.
- All groups are collapsible via `ChevronDown` toggle; all default to `open=true`.
- Active page highlighting uses exact `pathname === item.href` match with `bg-primary/10 text-primary` styling. This works correctly for leaf pages.
- **BUG: No partial-match / starts-with logic.** If a user is on `/docs/pro/logs`, the "Pro Features" group title does not visually indicate it contains the active page when collapsed. Users lose context when they collapse a group.
- All 35 sidebar links have corresponding page files verified in the filesystem.

### Legacy API Sidebar (`docs-sidebar.tsx`)

- Uses `IntersectionObserver` with `rootMargin: "-80px 0px -60% 0px"` to track in-view sections.
- Active section gets a left border highlight (`border-l-2 border-primary`).
- Contains a hardcoded `DOC_PAGES` array with only 3 entries: Chat API, Webhooks, Knowledge Base. These link to `/docs`, `/docs/webhooks`, `/docs/knowledge-base`.
- **BUG: Dead links.** `/docs/webhooks` and `/docs/knowledge-base` do not have corresponding `page.tsx` files under `src/app/docs/`. The `webhooks-docs.tsx` and `knowledge-base-docs.tsx` are standalone components, not routed pages. Navigating to these URLs will 404.

### `docs-header.tsx`

- Also contains its own `DOC_PAGES` array (same 3 links). Duplicate data source -- changes to one will not reflect in the other.
- Labels the section "API Docs" in the header, which is inconsistent with the main docs branding ("ClawHQ Docs").

---

## 3. Table of Contents (Right Sidebar)

- **Status: NOT IMPLEMENTED**
- `layout.tsx` line 33-40 renders a right sidebar (`w-48`, `hidden lg:block`) with the heading "On this page" but the content area is an empty `<p>` tag with only a comment: `{/* Table of contents will be generated per page */}`.
- No auto-extraction of headings from page content.
- No `IntersectionObserver` or scroll-spy for the right TOC.
- The right sidebar takes up 192px (`w-48`) on large screens and shows nothing useful -- wasted space.
- The legacy `DocsSidebar` component has its own scroll-spy TOC on the left, but only for the 3 API reference pages.

---

## 4. Search

- **Status: Client-side filter only, not full-text search**
- `DocsNav` includes a search input that filters `DOCS_NAV` items by `item.title.toLowerCase().includes(search.toLowerCase())`.
- This only filters page titles -- it does not search page content, headings, or body text.
- No keyboard shortcut (Cmd+K / Ctrl+K) to focus search.
- No search results UI beyond the filtered sidebar links.
- No debounce on the input (not a problem at 35 items, but worth noting).
- No "no results" message when the filter returns zero matches -- the sidebar just goes blank.

---

## 5. Mobile / Responsive Layout

### Main Docs Mobile Nav (`MobileDocsNav`)

- Renders a fixed hamburger button (`top-4 left-4 z-50`) on `md:hidden`.
- Opens a full sidebar overlay with backdrop blur.
- Clicking backdrop closes the nav. Toggle button switches between `Menu` and `X` icons.
- **BUG: Z-index collision.** The hamburger button is `z-50` and the sidebar overlay is also `z-50`. The backdrop is `z-40`. The button should be higher than the sidebar to remain clickable, but since they share `z-50`, the close behavior relies on the `X` button being positioned outside the sidebar div. This works but is fragile.
- **BUG: No route-change auto-close.** Clicking a link in the mobile sidebar navigates to a new page but does not close the sidebar (no `useEffect` on `pathname` to reset `open` state). The user must manually close it.

### Legacy Mobile Nav

- Uses shadcn `Sheet` component (`SheetContent side="left"`), which handles accessibility (focus trap, ESC key) better than the custom implementation above.
- Breakpoint is `lg:hidden` vs. the main nav's `md:hidden` -- inconsistent breakpoints.

### Content Area

- Main content: `md:ml-64 lg:mr-48` with `max-w-3xl mx-auto px-6 py-12`. Content is well-constrained.
- On mobile (< md), full width with `px-6` padding. Readable.
- Right sidebar hidden below `lg` breakpoint -- no TOC on tablet. Acceptable since it is empty anyway.

---

## 6. Prose Styling

- All doc pages use `<article className="prose prose-invert max-w-none">`.
- `@tailwindcss/typography` is installed (`package.json` line 78).
- **BUG: Typography plugin not registered.** `tailwind.config.ts` has `plugins: [require("tailwindcss-animate")]` -- the typography plugin is NOT included. This means `prose` and `prose-invert` classes are NOT being applied. All prose typography (heading sizes, paragraph spacing, list styling, link colors, blockquote formatting) falls back to Tailwind defaults, which means unstyled raw HTML elements.
- This is a **critical rendering bug**. Without the typography plugin, `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<code>`, `<pre>`, `<table>`, and `<blockquote>` elements inside `.prose` containers receive no special styling. The pages may appear functional due to Tailwind's `preflight` reset + custom classes on some elements, but spacing, font sizes, and list markers are all wrong.

**Fix required in `tailwind.config.ts`:**
```ts
plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
```

---

## 7. Code Block Rendering

### `CodeBlock` component (`code-block.tsx`)

- Renders `<pre>` with monospace text at 13px.
- Includes a copy button (via `CopyButton`) that appears on hover (`opacity-0 group-hover:opacity-100`).
- Shows optional filename header and language label.
- **No syntax highlighting.** Code is rendered as plain text with `text-white/80`. No Prism, Shiki, or highlight.js integration.
- Horizontal overflow handled with `overflow-x-auto` -- correct.

### Inline Code in Doc Pages

- API auth page and others use raw `<pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>` instead of the `CodeBlock` component. Inconsistent styling, no copy button.
- Multiple styling approaches: some use `CodeBlock`, some use raw `<pre>`, some rely on prose styling for `<code>` elements.

---

## 8. Callout Boxes

- `Callout` component supports 3 types: `warning` (amber), `info` (blue), `tip` (emerald).
- Uses left border + background tint + icon pattern.
- **Only used in legacy API docs.** Main doc pages (getting-started, pro, ultra, etc.) use ad-hoc `<div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">` callout blocks with inline styling. These are visually different from the `Callout` component.
- No consistent callout system across all doc pages.

---

## 9. Cross-Links

- Internal links use Next.js `<Link>` component correctly (client-side navigation).
- Cross-links between doc pages are extensive and all verified to point to existing routes.
- **BUG: Stale cross-links in `api-docs.tsx`.** The "Related Documentation" section at the bottom links to `/docs/webhooks` and `/docs/knowledge-base` which are not routed pages (as noted in Section 2).
- Links within `api-docs.tsx` to `/api-access` are dashboard-relative paths, not docs paths. These exit the docs layout.
- Some links in `pro/page.tsx` lack explicit styling classes (e.g., lines 216-218 have `<Link href="/docs/pro/knowledge-base">Knowledge Base</Link>` without `className`), relying on prose link styling which is broken (see Section 6).

---

## 10. Page Transitions

- No page transition animations implemented.
- Next.js App Router provides instant client-side navigation between pages, which is acceptable.
- No loading skeletons or suspense boundaries for doc pages.

---

## 11. Scroll to Anchor

- `api-docs.tsx` sections use `scroll-mt-24` class for scroll margin top -- works with the fixed header.
- `SectionHeading` generates `id="heading-{id}"` but `DocsSidebar` scrolls to plain `id` (not `heading-`). This means `scrollTo` in the sidebar scrolls to the `<section id="...">` element, not the heading -- this works because sections have the correct `id`.
- Main doc pages (prose pages) have no anchor links on headings. Users cannot link to specific sections.
- The `pro/analytics#channel-analytics` link on the pro overview page expects an anchor `#channel-analytics` to exist on the analytics page, but there is no mechanism to auto-generate anchor IDs on prose headings.

---

## 12. Component Inventory

| Component | File | Used By |
|-----------|------|---------|
| `DocsNav` | `docs-nav.tsx` | Main docs layout |
| `MobileDocsNav` | `docs-nav.tsx` | Main docs layout |
| `DocsSidebar` | `docs-sidebar.tsx` | Legacy API docs only |
| `DocsHeader` | `docs-header.tsx` | Legacy API docs only |
| `CodeBlock` | `code-block.tsx` | Legacy API docs |
| `Callout` | `callout.tsx` | Legacy API docs |
| `HttpBadge` | `http-badge.tsx` | Legacy API docs |
| `ParamTable` | `param-table.tsx` | Legacy API docs |
| `SectionHeading` | `section-heading.tsx` | Legacy API docs |
| `StatusBadge` | `status-badge.tsx` | Legacy API docs |

---

## Summary of Issues

### Critical

| # | Issue | Location |
|---|-------|----------|
| C1 | `@tailwindcss/typography` not in Tailwind plugins -- `prose` / `prose-invert` classes do nothing | `tailwind.config.ts` line 91 |
| C2 | `/docs/webhooks` and `/docs/knowledge-base` are 404s -- no route pages exist | `docs-sidebar.tsx`, `docs-header.tsx`, `api-docs.tsx` |

### High

| # | Issue | Location |
|---|-------|----------|
| H1 | Right-side "On this page" TOC is empty placeholder -- no auto-generation from headings | `layout.tsx` lines 33-40 |
| H2 | Search is title-filter only -- no content search, no keyboard shortcut, no empty state | `docs-nav.tsx` lines 114-143 |
| H3 | Mobile sidebar does not auto-close on navigation | `docs-nav.tsx` `MobileDocsNav` |
| H4 | No syntax highlighting in code blocks | `code-block.tsx` |

### Medium

| # | Issue | Location |
|---|-------|----------|
| M1 | Two separate sidebar/layout systems (main docs vs legacy API docs) with different styling and behavior | `docs-nav.tsx` vs `docs-sidebar.tsx` |
| M2 | Callout component exists but main docs use ad-hoc inline callouts instead | All prose doc pages |
| M3 | Inconsistent code rendering -- some pages use `CodeBlock`, others use raw `<pre>` | `api/auth/page.tsx` vs `api-docs.tsx` |
| M4 | No anchor links on headings in prose doc pages -- cannot deep-link to sections | All prose pages |
| M5 | Sidebar active state uses exact match only -- no parent group indication when collapsed | `docs-nav.tsx` line 92 |
| M6 | Duplicate `DOC_PAGES` arrays in `docs-sidebar.tsx` and `docs-header.tsx` | Both files |
| M7 | Anchor links like `pro/analytics#channel-analytics` have no target on destination pages | `pro/page.tsx` line 120 |

### Low

| # | Issue | Location |
|---|-------|----------|
| L1 | No "no results" message when sidebar search returns empty | `docs-nav.tsx` |
| L2 | No page transition animations or loading states | `layout.tsx` |
| L3 | Mobile nav z-index is fragile (button and sidebar both z-50) | `docs-nav.tsx` lines 161-172 |
| L4 | `DocsNav` logo links to `/` (home) instead of `/docs` | `docs-nav.tsx` line 127 |

---

## Recommended Priority Fixes

1. **Add typography plugin to Tailwind config** -- single-line fix, unblocks all prose styling.
2. **Create route pages for `/docs/webhooks` and `/docs/knowledge-base`** -- either create wrapper pages that render the existing components, or update links to point to `/docs/pro/webhooks` and `/docs/pro/knowledge-base`.
3. **Implement TOC auto-generation** -- parse heading elements from rendered content using `IntersectionObserver` (similar pattern already exists in `docs-sidebar.tsx`).
4. **Auto-close mobile sidebar on route change** -- add `useEffect` watching `pathname` to set `open(false)`.
5. **Unify the two doc layout systems** -- migrate legacy API docs into the main docs layout, or at minimum ensure visual consistency.
