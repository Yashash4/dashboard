# Cross-Tier Integration Test Report

**Scope:** Sidebar navigation, upgrade prompts, middleware route protection, tier gating (`hasAccess`), cross-page navigation, shared component consistency.

**Files reviewed:** `app-sidebar.tsx`, `middleware.ts`, `tier.ts`, `upgrade-prompt.tsx`, `user-context.tsx`, `mc-route-guard.ts`, `billing-overview.tsx`, dashboard layout, and all 28 dashboard pages, 10 admin pages, plus ~50 API route files.

---

## 1. Sidebar — Nav Items per Tier

### PASS: Tier-gated section visibility

- **Starter** users see only the "Dashboard" group (11 items: Overview, VPS, Models, Agents, Store, Chat, Channels, OpenClaw, Support, Billing, Account).
- **Pro** users additionally see the "Pro Tools" group (8 items: Model Playground, Agent Builder, Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log). Gated by `hasAccess(plan, "pro")` at line 213.
- **Ultra** users additionally see the "Command Center" group (5 items: Mission Control, Tasks, Agents, Events, Sessions). Gated by `hasAccess(plan, "ultra")` at line 240.
- **Admin** section only renders when `user.role === "admin"` (line 267). Not tied to plan.

### PASS: Active route highlighting

The `isActive()` function (lines 134-149) correctly:
- Uses exact match for `/` and `/admin` to prevent over-highlighting.
- Uses longest-prefix-match for all other routes, ensuring sub-pages like `/mission-control/tasks` highlight correctly over `/mission-control`.
- Supports optimistic highlighting via `pendingPath` state (set on click, cleared on `pathname` change).

### FINDING: VPS title confusion with Mission Control

The VPS page (`/vps`) dynamically renames itself to "Mission Control" for Pro users (lines 66, 91 of `vps/page.tsx`). But in the sidebar, `/vps` is labeled "Advanced VPS Controls" for Pro, while the actual "Mission Control" ultra-tier section lives at `/mission-control`. This naming overlap could confuse users.

**Severity:** Low (cosmetic/UX)
**Recommendation:** Rename the VPS page Pro title from "Mission Control" to "Advanced VPS Controls" to match the sidebar label.

### FINDING: Monitoring page exists but is not in sidebar

`/monitoring` has a middleware rewrite and a full page implementation, but no sidebar nav entry. It's accessible directly via URL but users cannot discover it through navigation.

**Severity:** Low
**Recommendation:** Either add it to the sidebar or remove it as a standalone page if its content is redundant with the VPS page's live monitoring gauges.

---

## 2. Upgrade Prompts

### PASS: Pro pages show UpgradePrompt for Starter users

All 8 Pro-tier pages consistently:
1. Fetch the user's subscription plan.
2. Call `hasAccess(plan, "pro")`.
3. If false, render page title + description + `<UpgradePrompt requiredPlan="pro" />`.
4. The UpgradePrompt links to `/billing` via "View Plans" button.

Pages confirmed: model-playground, agent-builder, logs, analytics, knowledge-base, webhooks, api-access, audit-log, openclaw.

### PASS: Ultra pages redirect non-Ultra users

All 5 Mission Control pages (`/mission-control`, `/mission-control/tasks`, `/mission-control/agents`, `/mission-control/events`, `/mission-control/sessions`) use `redirect("/billing?upgrade=ultra")` instead of showing UpgradePrompt.

### FINDING: Inconsistent gating UX between Pro and Ultra pages

- **Pro pages:** Show `UpgradePrompt` component inline (user stays on page, sees feature list).
- **Ultra pages:** Hard redirect to `/billing?upgrade=ultra` (user is bounced away).

This is an intentional design choice (Ultra is a harder upsell), but worth noting. The `UpgradePrompt` component supports `requiredPlan="ultra"` with its own feature list, so the inline approach could be used for Ultra too if desired.

**Severity:** Informational

### FINDING: Pro upgrade prompt mentions "Mission Control" confusingly

In `upgrade-prompt.tsx` line 10, the Pro feature list includes: "Mission Control -- advanced VPS management". However, the actual "Mission Control" feature (the command center with tasks, agents, events, sessions) is Ultra-only. The Pro tier simply provides advanced VPS controls. This wording could mislead Starter users into thinking Pro includes the full Mission Control suite.

**Severity:** Medium
**Recommendation:** Change the Pro feature text from "Mission Control -- advanced VPS management" to "Advanced VPS Controls -- process management, maintenance & reboot" or similar.

### PASS: Billing page shows plan comparison with correct upgrade buttons

`billing-overview.tsx` uses `hasAccess(subscription.plan, plan.name as Plan)` to determine which plans show an "Upgrade" button. Plans the user already has access to (or current plan) show "Current Plan" or nothing. Enterprise shows "Contact Us".

---

## 3. Middleware Route Protection

### PASS: All dashboard routes protected

- All paths in `DASHBOARD_PATHS` (18 routes) are rewritten to `/dashboard/*` internally.
- Unauthenticated access to any `/dashboard/*` path redirects to `/login` (line 97-101).
- The matcher config (lines 152-181) covers all 18 clean paths plus `/dashboard/:path*`, `/admin/:path*`, auth pages, and root.

### PASS: Admin routes enforce role check

- Admin routes check for `user` existence AND query `users.role === "admin"` from the database (lines 104-121).
- Non-admin users are redirected to `/`.
- MFA enforcement: admins with TOTP enrolled are redirected to `/admin/verify-2fa` if not at AAL2 (lines 124-137).

### PASS: Auth page redirects

- Logged-in users accessing `/login` or `/register` are redirected to `/` (lines 84-88).
- `/reset-password` is accessible to anyone (line 80-81).
- Root `/` with `?landing=true` bypasses the dashboard redirect for previewing.

### PASS: Clean URL rewrites work for all pages

Every sidebar link uses clean URLs (e.g., `/vps`, `/models`). Middleware rewrites these to `/dashboard/vps`, `/dashboard/models`, etc. All 18 entries in `DASHBOARD_PATHS` have corresponding pages under `src/app/dashboard/`.

### FINDING: Middleware does not perform tier-level route gating

Middleware only checks authentication (logged in / not logged in) and admin role. It does NOT check plan tier. A Starter user can technically navigate to `/model-playground` -- the middleware will allow the request through, and the page itself handles the tier gate. This is fine because each page does its own `hasAccess` check, but it means there are two round-trips (middleware session check + page-level subscription query) instead of a single middleware-level block.

**Severity:** Low (defense in depth is good, but redundant DB queries add latency)
**Recommendation:** Consider adding optional tier checking in middleware for known Pro/Ultra paths to avoid rendering pages just to show an upgrade prompt. This is an optimization, not a bug.

---

## 4. Tier Gating with `hasAccess()`

### PASS: Plan hierarchy is correct

`PLAN_ORDER = ["starter", "pro", "ultra", "enterprise"]` (tier.ts line 3). `hasAccess` uses index comparison, so:
- `hasAccess("ultra", "pro")` = true (ultra includes pro features)
- `hasAccess("pro", "ultra")` = false
- `hasAccess("starter", "pro")` = false
- Unknown plans return false (line 12).

### PASS: Default plan fallback is consistent

All pages use `(subscription?.plan as string) || "starter"` as the fallback when no subscription exists. This is consistent across all 28+ checked files.

### PASS: API routes enforce tier gating independently

Every Pro API route independently checks `hasAccess(plan, "pro")` and returns 403 on failure. This prevents a Starter user from calling Pro APIs directly even if they somehow navigate to the UI. Confirmed for:
- `/api/webhooks/*` (all CRUD + stats + test + deliveries)
- `/api/analytics/*` (usage, funnels, dashboards, CSAT, anomalies, live, intents, paths, resolution)
- `/api/knowledge-base/*` (all CRUD + upload + URL + search + chunks + connectors + feedback + reindex)
- `/api/logs/*` (patterns, alerts, saved-views)
- `/api/audit-log/*` (list, export, verify, streams)
- `/api/keys/*` (list, create, delete)
- `/api/playground/compare`
- `/api/vps/processes`, `/api/vps/reboot`, `/api/vps/logs`, `/api/vps/logs/stream`
- `/api/agents/generate`, `/api/agents/[id]/model`
- `/api/channels/analytics`
- `/api/auto-responses`, `/api/business-hours`

### PASS: Mission Control API routes use shared guard

All 28 Mission Control API routes use `guardMCRoute()` from `mc-route-guard.ts`, which enforces:
1. Auth check (401)
2. Ultra plan check via `hasAccess(plan, "ultra")` (403)
3. Rate limiting (429)
4. Optional body size check (413)

Plus `/api/mission-control/stream` has its own inline ultra check.

### PASS: `UserProvider` context propagates plan to client components

The dashboard layout fetches subscription plan server-side and passes it through `UserProvider`. Client components use `useUser()` hook to access plan. The sidebar receives plan as a prop directly from the layout.

---

## 5. Cross-Page Navigation

### PASS: All sidebar links resolve to existing pages

Every href in `customerNav`, `proNav`, `ultraNav`, and `adminNav` has a corresponding page file:

| Sidebar href | Page file exists |
|---|---|
| `/` | `dashboard/page.tsx` |
| `/vps` | `dashboard/vps/page.tsx` |
| `/models` | `dashboard/models/page.tsx` |
| `/agents` | `dashboard/agents/page.tsx` |
| `/store` | `dashboard/store/page.tsx` |
| `/chat` | `dashboard/chat/page.tsx` |
| `/channels` | `dashboard/channels/page.tsx` |
| `/openclaw` | `dashboard/openclaw/page.tsx` |
| `/support` | `dashboard/support/page.tsx` |
| `/billing` | `dashboard/billing/page.tsx` |
| `/account` | `dashboard/account/page.tsx` |
| `/model-playground` | `dashboard/model-playground/page.tsx` |
| `/agent-builder` | `dashboard/agent-builder/page.tsx` |
| `/logs` | `dashboard/logs/page.tsx` |
| `/analytics` | `dashboard/analytics/page.tsx` |
| `/knowledge-base` | `dashboard/knowledge-base/page.tsx` |
| `/webhooks` | `dashboard/webhooks/page.tsx` |
| `/api-access` | `dashboard/api-access/page.tsx` |
| `/audit-log` | `dashboard/audit-log/page.tsx` |
| `/mission-control` | `dashboard/mission-control/page.tsx` |
| `/mission-control/tasks` | `dashboard/mission-control/tasks/page.tsx` |
| `/mission-control/agents` | `dashboard/mission-control/agents/page.tsx` |
| `/mission-control/events` | `dashboard/mission-control/events/page.tsx` |
| `/mission-control/sessions` | `dashboard/mission-control/sessions/page.tsx` |
| `/admin` | `admin/page.tsx` |
| `/admin/customers` | `admin/customers/page.tsx` |
| `/admin/deploy` | `admin/deploy/page.tsx` |
| `/admin/tickets` | `admin/tickets/page.tsx` |
| `/admin/health` | `admin/health/page.tsx` |
| `/admin/audit-logs` | `admin/audit-logs/page.tsx` |
| `/admin/security` | `admin/security/page.tsx` |

### PASS: UpgradePrompt "View Plans" button links to `/billing`

Consistent across all Pro pages. Ultra pages redirect to `/billing?upgrade=ultra`. Both resolve correctly.

### PASS: Sub-pages have parent pages

- `/store/[id]` has parent `/store`
- `/support/[id]` and `/support/new` have parent `/support`
- `/admin/customers/[id]` has parent `/admin/customers`
- `/admin/tickets/[id]` has parent `/admin/tickets`

---

## 6. Shared Components & Design Consistency

### PASS: Consistent page layout pattern

All dashboard pages follow the same structure:
```
<div>
  <h1 className="text-2xl font-bold mb-1">Page Title</h1>
  <p className="text-muted-foreground mb-6">Description</p>
  {/* Content or UpgradePrompt */}
</div>
```

### PASS: Consistent auth check pattern

All server pages follow one of two patterns:
1. `if (!user) return null;` (most Pro pages)
2. `if (!user) redirect("/login");` (Mission Control + VPS pages)

Both are safe since the layout already redirects unauthenticated users. The `return null` pattern is slightly less defensive but functionally equivalent.

### PASS: Plan badge in sidebar header

The sidebar header displays the plan name with tier-specific styling from `PLAN_CONFIG`:
- Starter: muted/neutral
- Pro: primary color accent
- Ultra: violet accent
- Enterprise: yellow/gold accent

### PASS: Empty states follow consistent pattern

Pages with no data (e.g., VPS not provisioned, no channels connected) use the same Card + icon + heading + description pattern.

---

## Summary

| Area | Status | Issues |
|---|---|---|
| Sidebar nav items per tier | PASS | VPS title overlaps with Mission Control naming |
| Sidebar active highlighting | PASS | No issues |
| Upgrade prompts (Pro pages) | PASS | Pro feature list mentions "Mission Control" confusingly |
| Upgrade prompts (Ultra pages) | PASS | Uses redirect instead of inline prompt (intentional) |
| Middleware auth protection | PASS | No tier-level gating in middleware (by design) |
| Middleware URL rewrites | PASS | All 18 paths covered |
| Admin role check | PASS | Includes MFA enforcement |
| `hasAccess()` correctness | PASS | Hierarchy correct, consistent usage everywhere |
| API route tier gating | PASS | All Pro/Ultra APIs independently gated |
| Cross-page navigation | PASS | All sidebar links resolve, no broken routes |
| Shared component consistency | PASS | Uniform patterns across all tiers |

### Action Items

1. **Medium:** Fix Pro upgrade prompt feature text -- change "Mission Control -- advanced VPS management" to avoid confusion with the Ultra-only Mission Control suite.
2. **Low:** Rename VPS page Pro-mode title from "Mission Control" to "Advanced VPS Controls" to match the sidebar label.
3. **Low:** Decide whether the orphaned `/monitoring` page should be added to sidebar navigation or removed.
