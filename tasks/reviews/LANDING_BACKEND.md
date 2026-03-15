# Landing Page Backend Review

**Reviewer role:** Backend Developer (SSR, metadata, routing, middleware, caching)
**Date:** 2026-03-16
**Files reviewed:**
- `dashboard/src/app/page.tsx`
- `dashboard/src/app/layout.tsx`
- `dashboard/src/app/providers.tsx`
- `dashboard/src/app/docs/layout.tsx`
- `dashboard/src/app/terms/page.tsx`
- `dashboard/src/app/privacy/page.tsx`
- `dashboard/src/middleware.ts`
- `dashboard/next.config.ts`

---

## 1. Metadata & SEO

### Root Layout (`layout.tsx`) — PASS with issues

The root layout exports a proper `Metadata` object with:
- `title`, `description`, `authors`
- `openGraph.title`, `openGraph.description`, `openGraph.type`
- `twitter.card`, `twitter.site`
- `icons.icon` (favicon)

**Issues found:**

| # | Severity | Issue |
|---|----------|-------|
| M-1 | Medium | **Missing `openGraph.url`** — Without `og:url`, social crawlers may resolve the wrong canonical URL. Add `url: "https://clawhq.tech"` (or use `metadataBase`). |
| M-2 | Medium | **Missing `openGraph.image` / `twitter.image`** — No OG image defined anywhere. Social shares will render without a preview card image. Either add an `opengraph-image.png` file in `src/app/` or set `openGraph.images` in the metadata export. |
| M-3 | Medium | **Missing `metadataBase`** — Without `metadataBase`, Next.js cannot resolve relative OG image URLs to absolute URLs. Set `metadataBase: new URL("https://clawhq.tech")` in the root layout. |
| M-4 | Low | **Missing `openGraph.siteName`** — Should be `"ClawHQ"` for consistent branding in social shares. |
| M-5 | Low | **No `robots.ts` or `sitemap.ts`** — There is no `src/app/robots.ts` or `src/app/sitemap.ts`. These are important for search engine discovery. The sitemap should list `/`, `/docs/*`, `/terms`, `/privacy`, and `/pricing` (if separate). `robots.ts` should disallow `/dashboard`, `/admin`, `/api`, `/login`, `/register`. |
| M-6 | Low | **No canonical URL** — Neither the root layout nor `page.tsx` sets `alternates.canonical`. This can cause duplicate content issues if the site is accessible via multiple URLs (e.g., www vs non-www). |

### Terms & Privacy Pages — PASS

Both export proper `metadata` objects with `title` and `description`. Metadata is typed implicitly (not `satisfies Metadata`) but works correctly.

### Docs Layout — PASS

Exports typed `Metadata` with `title` and `description`. Nested docs pages will inherit this as a fallback.

### Landing Page (`page.tsx`) — Issue

| # | Severity | Issue |
|---|----------|-------|
| M-7 | Low | **No page-level metadata override** — `page.tsx` does not export its own `metadata`. It inherits from the root layout, which is fine for the homepage, but adding a page-level `metadata` or using `generateMetadata` would allow for more specific OG tags (e.g., a dedicated landing page image). |

---

## 2. Middleware Routing — PASS with one concern

### Auth redirect logic — Correct

The middleware handles the landing page correctly:
- **Unauthenticated users** hitting `/` — middleware does NOT rewrite to `/dashboard`, so they see the landing page. Correct.
- **Authenticated users** hitting `/` — middleware rewrites `effectivePath` to `/dashboard`, then the rewrite fires at line 141-147. Correct.
- **`?landing=true` bypass** — Authenticated users with `?landing=true` skip the dashboard rewrite. Correct.
- **Missing Supabase env vars** — Early return with `NextResponse.next()`, so the landing page works even without auth configured. Correct.

### Performance consideration — getSession()

The middleware uses `supabase.auth.getSession()` (line 75), which reads the JWT from the cookie without a network call. This is the correct choice for middleware — no round-trip to Supabase. Good.

### Docs, Terms, Privacy routes — Concern

| # | Severity | Issue |
|---|----------|-------|
| MW-1 | Medium | **`/docs`, `/terms`, `/privacy` are NOT in the middleware matcher** — These routes are public and do not appear in the `config.matcher` array. This means the middleware never runs for them, so there is no Supabase session refresh on these pages. This is technically fine for public pages (no auth needed), but it means authenticated users visiting `/docs` will not get their auth cookies refreshed. If a user spends a long time reading docs before returning to the dashboard, their session could expire silently. Consider adding `/docs/:path*`, `/terms`, `/privacy` to the matcher and letting them pass through (no redirect) so the Supabase cookie refresh logic still fires. |

---

## 3. Server-Side Data Fetching — PASS

### Landing page (`page.tsx`)

The landing page is a pure **React Server Component** with **zero data fetching**. It imports only presentational components. There are:
- No `fetch()` calls
- No Supabase queries
- No `async` component
- No `use()` or `cache()` calls

This means the landing page is **statically renderable** at build time. Next.js will automatically cache it as a static page. This is optimal for performance.

### Terms & Privacy pages

Same pattern — pure JSX, no data fetching. Fully static.

### Docs layout

Pure JSX with component imports. No data fetching. Fully static.

---

## 4. Next.js Caching & Revalidation — PASS with notes

### Static Generation

Since `page.tsx`, `terms/page.tsx`, and `privacy/page.tsx` have no dynamic data dependencies, Next.js will statically generate them at build time by default (App Router static rendering). No explicit `revalidate` or `dynamic` exports are needed — the default behavior is correct.

### No problematic config

`next.config.ts` does not set any aggressive caching headers or custom `headers()` that could interfere. The `serverExternalPackages` list is relevant only to API routes (SSH, PDF parsing).

### Providers wrapping

The root layout wraps children in `<Providers>`, which is a `"use client"` component containing `QueryClientProvider`, `TooltipProvider`, `Toaster`, and `Sonner`. Since Providers is a Client Component, the landing page's Server Component tree will still render on the server — the client boundary only affects the providers themselves. This is correct Next.js architecture.

| # | Severity | Note |
|---|----------|------|
| C-1 | Low | **QueryClient instantiated at module scope** — In `providers.tsx`, `const queryClient = new QueryClient()` is at module level. This is acceptable for client-only usage but could cause issues if the providers file were ever imported in a server context (shared state across requests). Since it is marked `"use client"`, this is safe today. |

---

## 5. SSR Performance — PASS

The landing page will be served as a **static HTML page** from the Next.js cache. Expected TTFB is effectively zero (disk read). The 13 imported landing components are all presentational. No component uses `async`, `fetch`, or server-side data calls.

The middleware adds minimal overhead for the `/` route:
1. Reads Supabase env vars (in-memory check)
2. Creates a Supabase client (cookie read, no network)
3. Calls `getSession()` (JWT parse, no network)
4. Determines redirect/rewrite

Total middleware overhead: sub-millisecond. No concern.

---

## Summary

| Category | Status |
|----------|--------|
| Metadata / SEO | Needs work — missing OG image, metadataBase, robots.ts, sitemap.ts |
| Middleware routing | Good — one concern about cookie refresh on public pages |
| Server-side data fetching | Excellent — zero fetching on landing/static pages |
| Caching / revalidation | Excellent — pages are fully static by default |
| SSR performance | Excellent — no bottlenecks |

### Action Items (priority order)

1. **Add `metadataBase`** to root layout: `metadataBase: new URL("https://clawhq.tech")`
2. **Add OG image** — either `src/app/opengraph-image.png` (convention-based) or `openGraph.images` in metadata
3. **Create `src/app/robots.ts`** — allow `/`, `/docs`, `/terms`, `/privacy`; disallow `/dashboard`, `/admin`, `/api`, `/login`, `/register`
4. **Create `src/app/sitemap.ts`** — list all public routes
5. **Add `openGraph.url` and `openGraph.siteName`** to root layout metadata
6. **Consider adding public routes to middleware matcher** for session refresh continuity
