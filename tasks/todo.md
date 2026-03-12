# Starter Tier — Deployment Audit & Fix

## Phase 1: CRITICAL BUGS
- [x] 1.1 Create /reset-password page (forgot-password flow broken)
- [x] 1.2 OpenClaw page add Pro tier gate
- [x] 1.3 Chat messages route — return newest 50, not oldest
- [x] 1.4 SSL checker color logic — check expired before warning
- [x] 1.5 Billing page — prevent downgrade via upgrade button
- [x] 1.6 Ticket thread — use ticketStatus not ticket.status

## Phase 2: SECURITY
- [x] 2.1 Sanitize error messages in 14 API routes
- [x] 2.2 Dashboard password — add confirm field + ! warning
- [x] 2.3 VPS password route — try/catch around SSH
- [x] 2.4 Add rate limiting to 15 API routes
- [x] 2.5 Wrap request.json() in try/catch (10 routes)

## Phase 3: CONSOLE REMOVAL
- [x] 3.1 Remove 14 console statements from lib + API files

## Phase 4: HIGH UX
- [x] 4.1 Empty states with actionable CTAs (overview agents/channels)
- [x] 4.2 VPS logs viewer — don't render errors as log content
- [x] 4.3 VPS specs — null guards for cpu/ram/disk
- [x] 4.4 Chat — change misleading green dots to neutral gray
- [x] 4.5 Loading skeleton grid breakpoint fix
- [x] 4.6 Footer — fix broken placeholder links, remove social stubs
- [x] 4.7 Model config — billing cycle desync fix
- [x] 4.8 Sidebar logout error handling

## Phase 5: MEDIUM
- [x] 5.1 VPS-stopped warning banners on agents/chat/channels
- [x] 5.2 DB query error handling on 7 dashboard pages
- [x] 5.3 VPS status route — proper state mapping (error/restoring)
- [x] 5.4 SSL checker — guard null hostname
- [x] 5.5 Remove rounded-md from brutalist logs container
- [x] 5.6 Cron route — CRON_SECRET undefined check
- [x] 5.7 Landing page copy contradictions fixed
- [x] 5.8 Navbar — use Next.js Link for /register

## Phase 6: POLISH
- [x] 6.1 formatContext(0) fix
- [x] 6.2 "Renews"→"Expires" label for cancelled subs
- [x] 6.3 Uptime/password components — show "Unavailable" instead of vanishing
- [x] 6.4 Account settings — wrap in form tags for Enter key
- [x] 6.5 Ticket thread — auto-scroll on new reply
- [x] 6.6 Ticket list — count badges per tab
- [x] 6.7 Remove unused Route import from sidebar
- [x] 6.8 Remove dead error state from openclaw-embed

## Build Status
- [x] `next build` passes with 0 errors ✅ (clean build, 83/83 static pages)

## Files Changed
- **Created**: src/app/reset-password/page.tsx
- **Modified**: ~55 files across pages, components, API routes, lib, middleware
