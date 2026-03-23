---
name: AGENT_05_59_STARTER_UX_REVIEWER
description: UX Reviewer review of Starter Dashboard (Area 59) — navigation, forms, empty states, mobile, conversion, error messaging
type: review
agent_number: 5
area: 59_STARTER
poo: UX_REVIEWER
---

# UX Review: Starter Dashboard (Area 59)

Reviewed files:
- `src/app/dashboard/page.tsx` (overview)
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/vps/page.tsx`
- `src/app/dashboard/agents/page.tsx`
- `src/app/dashboard/channels/page.tsx`
- `src/app/dashboard/models/page.tsx`
- `src/app/dashboard/chat/page.tsx`
- `src/app/dashboard/support/page.tsx`
- `src/app/dashboard/store/page.tsx`
- `src/app/dashboard/account/page.tsx`
- `src/app/dashboard/billing/page.tsx`
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/page.tsx` (landing)
- `src/components/dashboard/app-sidebar.tsx`
- `src/components/dashboard/onboarding-checklist.tsx`
- `src/components/dashboard/getting-started-guide.tsx`
- `src/components/dashboard/quick-actions.tsx`
- `src/components/dashboard/upgrade-prompt.tsx`
- `src/components/dashboard/system-alerts.tsx`
- `src/components/dashboard/vps-health-card.tsx`
- `src/components/dashboard/overview-sparklines.tsx`
- `src/components/dashboard/resource-upgrade.tsx`
- `src/components/dashboard/navigation-progress.tsx`
- `src/components/dashboard/loading.tsx`
- `src/components/landing/Pricing.tsx`

---

## CRITICAL Issues

### None found.

---

## HIGH Issues

**59U_HIGH_01**
- File: `src/app/register/page.tsx:89`
- Description: Post-registration redirect goes directly to `/pricing`, but newly registered users have no active session cookie immediately after `supabase.auth.signUp()`. Supabase signup requires email verification before establishing a session in many configurations. Users may land on `/pricing` unauthenticated, see a brief loading state, then get silently redirected to `/billing` (which also checks auth) — a confusing, circular loop with no user-facing confirmation that signup succeeded.
- Evidence: `router.push(qs ? \`/pricing?${qs}\` : "/pricing")` — no intermediate "check your email" confirmation screen.

**59U_HIGH_02**
- File: `src/app/dashboard/chat/page.tsx:92`
- Description: The chat page container uses `position: absolute; inset: 0`, removing it from the document flow. This conflicts with the parent `main className="flex-1 p-6"` in `dashboard/layout.tsx`. The absolute positioning pulls the chat out of the sidebar-inset layout, potentially causing scroll, overflow, or z-index issues. No other dashboard page uses this pattern.
- Evidence: `return <div className="absolute inset-0 flex flex-col">` at line 92, contrasted with every other dashboard page which returns plain `<div>` wrappers inside the layout.

**59U_HIGH_03**
- File: `src/components/dashboard/onboarding-checklist.tsx:115-117`
- Description: Completed onboarding steps use `opacity-60` and `line-through` styling but remain clickable links. If a user accidentally clicks "Connect a channel" when they haven't actually done so, the checklist marks it complete and the user loses the nudge. There is no way to un-complete a step — the only recovery is dismissing the entire checklist.
- Evidence: `{done ? "opacity-60" : ""}` — no toggle-off capability.

**59U_HIGH_04**
- File: `src/components/dashboard/quick-actions.tsx:102-116`
- Description: In customize/edit mode, all 8 available actions render in a flex-wrap container with small pill buttons. On mobile (360px width), this can result in horizontal overflow or squashed buttons. The touch targets (buttons inside pills) are small and the layout provides no scroll hint.
- Evidence: `ALL_ACTIONS` array has 8 items; customize mode renders all of them at once with `flex flex-wrap gap-2`.

**59U_HIGH_05**
- File: `src/components/dashboard/app-sidebar.tsx:148-163`
- Description: Active nav highlighting uses `pathname.startsWith(href)` for non-root routes, but Mission Control sub-items (`/mission-control/tasks`, `/mission-control/agents`, etc.) all share the `/mission-control` prefix. The sidebar only has items at the group level — clicking "Tasks" highlights the "Mission Control" parent item instead of "Tasks" due to the longest-match logic. This is confusing on a small screen where only the parent appears highlighted.
- Evidence: `ultraNav` items like `{ href: "/mission-control/tasks" }` and `{ href: "/mission-control/agents" }` — when at `/mission-control/tasks`, only `/mission-control` matches, not the specific sub-route.

**59U_HIGH_06**
- File: `src/components/dashboard/getting-started-guide.tsx:26-50`
- Description: Step 1 of the Getting Started Guide ("Your VPS is ready") has no actionable CTA or link — it just states a fact. A new user who sees this guide has no VPS yet (the overview page's Stage 2 state confirms this). The guide gives no indication of when step 1 will be complete or what to do while waiting.
- Evidence: `GUIDE_STEPS[0]` has `href: undefined` — no link, no button, no "typically 15-30 minutes" callout despite the overview page mentioning this timeframe.

**59U_HIGH_07**
- File: `src/components/dashboard/vps-health-card.tsx:104-108`
- Description: When the health data fetch is loading (`healthLoading === true`), the card renders a `Loader2` spinner icon next to the status badge but does not label what is loading. Users may not understand the spinner — it could be confused with a processing action rather than a background data refresh.
- Evidence: `{isRunning && healthLoading && (<div className="flex items-center gap-2"><Badge .../> <Loader2 .../></div>)}` — no "Refreshing..." or "Loading health..." text label.

**59U_HIGH_08**
- File: `src/app/dashboard/page.tsx:118-142`
- Description: Stage 1 (no subscription) shows a "View Plans" CTA to `/billing`. Stage 2 (has subscription, no VPS) shows "Contact support" link. There is no Stage 2.5 for users who have a subscription and a VPS but the VPS is still provisioning. The overview page catches "no VPS" and shows a generic "Setting Up Your Instance" message, but the `vps_instances` table may have a row with status "provisioning" that this code treats as a real VPS and shows the full dashboard with partial data.
- Evidence: `if (!vps)` check at line 146 catches all non-existent VPS cases, but if `vps.status === "provisioning"` is returned, the code proceeds to render full dashboard stats with null/undefined values (cpu_cores, ram_gb, storage_gb all null).

**59U_HIGH_09**
- File: Multiple error states across dashboard pages
- Description: Every error state in the dashboard uses identical wording: "Something went wrong" / "We couldn't load your data. Please refresh the page." These are not actionable — users cannot distinguish between a network error, a permission error, or a server error, and no error code or troubleshooting hint is provided.
- Evidence: `dashboard/page.tsx:113`, `vps/page.tsx:62`, `agents/page.tsx:93`, `channels/page.tsx:59`, `models/page.tsx:62`, `chat/page.tsx:46`, `support/page.tsx:28`, `store/page.tsx:44`, `account/page.tsx:58` — all identical 3-line error templates.

---

## MEDIUM Issues

**59U_MED_01**
- File: `src/app/login/page.tsx:196-201`
- Description: "Forgot your password?" links to `/forgot-password`, but there is no route handler for this path in the codebase. Clicking it results in a 404. This erodes trust — users may assume the link works and feel frustrated when it breaks.
- Evidence: Link href `/forgot-password` with no corresponding `src/app/forgot-password/page.tsx`.

**59U_MED_02**
- File: `src/app/register/page.tsx`
- Description: Registration form only collects email and password. There is no name input field, yet the dashboard sidebar and overview show the user's name (`user.name`). The name is presumably pulled from OAuth metadata or left null. First-time email/password users may not know they need to set their name in Account settings.
- Evidence: `registerSchema` only has `email` and `password`; `AppSidebar` displays `{user.name || "User"}` as a fallback.

**59U_MED_03**
- File: `src/components/dashboard/resource-upgrade.tsx:26-46`
- Description: The "Current Resources" card shows CPU, RAM, Storage, and Bandwidth values but does not label what the Starter plan limits are. A user seeing "4 vCPU, 8GB RAM, 100GB SSD, 8TB BW" has no frame of reference for whether these are good or baseline. No comparison to Starter defaults is shown.
- Evidence: Card shows `{cpuCores ?? "—"}` without сопутствующий text like "Starter plan: 2 vCPU, 8GB RAM".

**59U_MED_04**
- File: `src/app/login/page.tsx:102`, `src/app/register/page.tsx:108`
- Description: Auth pages use hardcoded `bg-[#111111]` and `bg-[#191919]` colors rather than design system CSS variables (e.g., `background-color: var(--background)`). This diverges from the rest of the app and makes future theme changes more difficult.
- Evidence: `bg-[#111111]` and `bg-[#191919]` inline styles on auth page containers.

**59U_MED_05**
- File: `src/components/dashboard/onboarding-checklist.tsx:48-53`
- Description: The "Visit the Agent Store" step (store_visited) triggers when the API returns `true` from `/api/onboarding`. This API likely sets the flag on any visit to `/store`, not on any meaningful action. A user who opens the store and immediately leaves is considered "onboarded" for this step, inflating completion metrics.
- Evidence: `store_visited: true` — the onboarding API likely sets this as a passive signal rather than requiring a purchase or meaningful interaction.

**59U_MED_06**
- File: `src/app/dashboard/layout.tsx:67-69`
- Description: The dashboard header contains only the `SidebarTrigger` (hamburger menu) with no page title or breadcrumb. When navigating to deeply nested pages (e.g., `/admin/tickets`), users have no orientation cue within the page itself. The h1 on each page is the only title, but it sits inside the scrollable main area — not in the persistent header.
- Evidence: `<header className="flex h-14 items-center gap-2 border-b border-border px-6"><SidebarTrigger /></header>` — no `<h1>` or page context.

**59U_MED_07**
- File: `src/app/pricing/page.tsx:59-81`
- Description: When `handleSubscribe` is called, the selected plan button enters a loading state but Razorpay payment is async. If Razorpay fails or the user closes the popup, the UI remains in the loading state indefinitely with no error message or recovery path. The button shows a spinner forever.
- Evidence: `setProcessingPlan(planName)` at line 68 with no error handler to call `setProcessingPlan(null)` on Razorpay failure — only on success via `onSuccess` callback.

**59U_MED_08**
- File: `src/components/dashboard/app-sidebar.tsx:273-325`
- Description: Pro Tools and Command Center sections are entirely hidden from Starter users — not locked, not dimmed, just absent. There is no upsell messaging or "Available on Pro" indicator within the sidebar itself. A Starter user who upgrades mid-session must navigate away and back to see new menu items.
- Evidence: `{hasAccess(plan, "pro") && (<SidebarGroup>...</SidebarGroup>)}` — complete conditional render with no fallback.

---

## LOW Issues

**59U_LOW_01**
- File: `src/app/login/page.tsx:139-151`, `src/app/register/page.tsx:145-157`
- Description: Google OAuth buttons use a `<button>` element with custom styling (`bg-[#191919]`, hover states) rather than the design system's `Button` component. The visual treatment (dark bg, border, hover) differs from other primary CTAs in the app.
- Evidence: Custom `<button>` with className at line 139 vs `<Button>` component used for the email form submit.

**59U_LOW_02**
- File: `src/app/login/page.tsx:32-53`, `src/app/register/page.tsx:32-53`
- Description: Google SVG icon is inlined as a JSX function component rather than imported as an asset. While functional, this prevents Next.js from optimizing the SVG and creates code duplication across login and register pages.
- Evidence: `function GoogleIcon()` defined inline in both pages.

**59U_LOW_03**
- File: `src/app/register/page.tsx:89`
- Description: On successful registration, the app immediately redirects to `/pricing` without a confirmation screen. The toast "Welcome to ClawHQ!" fires after payment redirect, not after signup — so a user who signs up without selecting a plan sees no confirmation.
- Evidence: `router.push(qs ? \`/pricing?${qs}\` : "/pricing")` — no intermediate success state displayed.

**59U_LOW_04**
- File: `src/app/dashboard/vps/page.tsx:64`
- Description: Error state "Try Again" is an `<a>` tag styled as a button, linking to `/vps`. Since this is already the VPS page, clicking it simply reloads — but visually it looks like a navigation action, not a reload. A "Refresh" icon button or simple page reload would be clearer.
- Evidence: `<a href="/vps" className="inline-flex items-center justify-center text-sm font-medium border border-border px-4 py-2 hover:bg-muted transition-colors">Try Again</a>`.

**59U_LOW_05**
- File: `src/app/dashboard/chat/page.tsx:92`
- Description: The `AgentChat` component is rendered with `agents` prop derived from a Supabase join on `user_agents` and `agents`. If the join returns an empty array (no deployed agents), the page shows the empty state card. However, if `agents` is null due to a malformed response, `agents.filter()` would throw a runtime error before reaching the empty state.
- Evidence: `const agents = (userAgents || []).map(...).filter(...)` — if `userAgents` is null and the code attempts to access `ua.agents` on null, it could throw before reaching the empty state check.

---

## Summary

| Category | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 9     |
| MEDIUM   | 8     |
| LOW      | 5     |

The most impactful issues for a Starter user are:
1. The registration-to-pricing redirect loop without email confirmation (HIGH_01)
2. The absolute-positioned chat page breaking layout flow (HIGH_02)
3. Completed onboarding steps being irreversible (HIGH_03)
4. No upsell messaging for Starter users seeing locked Pro features (MEDIUM_08)
5. "Forgot password" linking to a 404 page (MEDIUM_01)

The onboarding flow (Getting Started Guide + Onboarding Checklist) is generally well-designed with clear CTAs and progress indicators — this is a strength of the dashboard. Error states, empty states, and the post-authentication flow are the primary UX weaknesses.
