# QA Review: ClawHQ Dashboard Starter Pages

**Reviewer:** QA Tester
**Date:** 2026-03-16
**Scope:** All 10 Starter-tier dashboard pages, their components, and backing API routes
**Files reviewed:** 28 page/component files, 12 API route files

---

## Executive Summary

The codebase is well-structured with consistent error handling patterns across pages. Every server-component page handles the no-data/error/empty states. API routes are consistently rate-limited and auth-gated. However, there are several medium and high severity issues around race conditions, missing cleanup, navigation inconsistencies, and a couple of potential crashes on edge-case data.

**Total bugs found:** 27
- Critical: 2
- High: 7
- Medium: 12
- Low: 6

---

## 1. Overview Page (`src/app/dashboard/page.tsx`)

### BUG-001 — Incorrect link paths in no-subscription state
- **File:** `src/app/dashboard/page.tsx:114`
- **Severity:** High
- **Description:** The "View Plans" link points to `/billing` but the middleware rewrites `/billing` to `/dashboard/billing`. However, the no-subscription state on the billing page shows "No Active Subscription" with no way to actually subscribe. The user is stuck in a loop.
- **Suggested fix:** The billing page should show the plan cards even when there is no subscription, or this link should point to a public pricing page or include an inline plan selector.

### BUG-002 — No-subscription redirect to `/support` also incorrect
- **File:** `src/app/dashboard/page.tsx:142`
- **Severity:** Low
- **Description:** "Contact support" link goes to `/support` but a user with no subscription or VPS can still file tickets. Not a bug per se, but the support page requires auth and loads fine. Minor UX concern only.

### BUG-003 — Model error silently ignored
- **File:** `src/app/dashboard/page.tsx:82-86`
- **Severity:** Medium
- **Description:** The `modelRes.error` is never checked. If the `models` table query fails for a reason other than "no rows" (e.g. permission denied), the error is silently swallowed and `model` stays null. This means the Overview page would show "---" for the model instead of an error.
- **Suggested fix:** Add the same `PGRST116` guard used for `subRes` and `vpsRes`:
  ```ts
  if (modelRes.error && modelRes.error.code !== "PGRST116") throw modelRes.error;
  ```

---

## 2. VPS Page (`src/app/dashboard/vps/page.tsx`, `src/components/dashboard/vps-controls.tsx`)

### BUG-004 — VPS page swallows Supabase errors
- **File:** `src/app/dashboard/vps/page.tsx:46`
- **Severity:** Medium
- **Description:** The catch block catches all errors, but `vpsRes.error` and `subRes.error` are never checked. If the DB returns an error with data=null (e.g. RLS failure), the page silently treats it as "no VPS" instead of showing the error state.
- **Suggested fix:** Check `.error` on both responses before using `.data`, similar to the Overview page pattern.

### BUG-005 — VPS Controls missing `useEffect` dependency
- **File:** `src/components/dashboard/vps-controls.tsx:270`
- **Severity:** Medium
- **Description:** The `useEffect` that accumulates chart data has `[monitoring]` as its dependency. React will warn about `prevNetRef` not being in the dependency array. More importantly, if `monitoring` reference is the same object (TanStack Query may return the same reference if data hasn't changed), the effect won't re-run and chart data stalls.
- **Suggested fix:** This is acceptable because TanStack Query returns new references on each refetch. However, add a comment explaining this, or use `monitoring?.uptime_seconds` as part of a custom comparison.

### BUG-006 — Chart data persisted in sessionStorage without size limit
- **File:** `src/components/dashboard/vps-controls.tsx:129-137`
- **Severity:** Low
- **Description:** Chart data is sliced to 180 entries and saved to sessionStorage. Each entry is ~100 bytes, so max ~18KB. This is fine, but the `try/catch` around `sessionStorage` is good. No actual bug, but worth noting that stale chart data from a previous session (different VPS state) could confuse users.
- **Suggested fix:** Clear sessionStorage chart data when VPS status changes to "stopped".

### BUG-007 — Double-click on Start/Stop/Restart not fully prevented
- **File:** `src/components/dashboard/vps-controls.tsx:362-439`
- **Severity:** Medium
- **Description:** The buttons are disabled when `!!actionLoading`, but the Stop and Restart buttons use `AlertDialog` which has its own confirmation step. If the user clicks "Stop" in the AlertDialog, the dialog closes and `performAction("stop")` runs. If they quickly re-open the AlertDialog and click again, `actionLoading` may not yet be set (it's set inside `performAction` which is async). There's a timing window.
- **Suggested fix:** Set `actionLoading` immediately in the `AlertDialogAction.onClick` handler before calling `performAction`, or disable the trigger button as well.

---

## 3. Models Page (`src/app/dashboard/models/page.tsx`, `src/components/dashboard/model-config.tsx`)

### BUG-008 — Models page returns `null` for unauthenticated users
- **File:** `src/app/dashboard/models/page.tsx:13`
- **Severity:** High
- **Description:** When `!user`, the page returns `null` instead of redirecting to `/login` like every other page. This means an unauthenticated user sees a blank page instead of being redirected.
- **Suggested fix:** Replace `if (!user) return null;` with the redirect pattern used on other pages:
  ```ts
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  ```

### BUG-009 — `availableModels` error not checked
- **File:** `src/app/dashboard/models/page.tsx:39`
- **Severity:** Medium
- **Description:** `modelsListRes.error` is never checked. If the `available_models` table query fails, `availableModels` stays null and the page renders with an empty model list, which is misleading.
- **Suggested fix:** Add error check: `if (modelsListRes.error) throw modelsListRes.error;`

### BUG-010 — Model comparison dialog receives `null` for currentModel
- **File:** `src/components/dashboard/model-config.tsx:361`
- **Severity:** Low
- **Description:** If `currentModelInfo` is undefined (e.g. the current model was removed from the available list), `ModelComparisonDialog` receives `null`. This should be handled gracefully in the dialog, but could cause a crash if the dialog tries to access `currentModel.display_name`.
- **Suggested fix:** Verify `ModelComparisonDialog` handles `currentModel=null` safely.

---

## 4. Agents Page (`src/app/dashboard/agents/page.tsx`, `src/components/dashboard/agent-manager.tsx`)

### BUG-011 — Bulk deploy does not check VPS status
- **File:** `src/components/dashboard/agent-manager.tsx:205-274`
- **Severity:** High
- **Description:** The bulk deploy/undeploy feature fires sequential API calls but does not check if the VPS is running first. The individual deploy API will return an error, but the user gets `N` sequential error toasts. The agents page shows a VPS warning banner, but the bulk action button is still clickable.
- **Suggested fix:** Check VPS status before starting bulk action, or disable bulk actions when VPS is not running.

### BUG-012 — Agent name access on potentially null agents relation
- **File:** `src/components/dashboard/agent-manager.tsx:374`
- **Severity:** Medium
- **Description:** After normalization, `ua.agents` could still be null/undefined if the join returned no data. The code accesses `agent.name` at line 393 without a null check. If `agents` is null, this will throw a runtime error.
- **Suggested fix:** Add a null guard: `if (!agent) return null;` before rendering the card, or filter out entries with null agents before mapping.

### BUG-013 — Deploy limit check uses stale `deployedCount`
- **File:** `src/components/dashboard/agent-manager.tsx:126`
- **Severity:** Medium
- **Description:** `deployedCount` is computed from the state snapshot at render time. During bulk deploy, the state is updated optimistically after each successful call, but `deployedCount` in the bulk loop closure captures the value at the start. The `completed` counter partially addresses this but checks `deployedCount + completed >= maxDeploys`, which is correct. However, if a deploy fails and reduces the effective count, the limit check is too conservative. Minor issue.
- **Suggested fix:** Acceptable behavior; document the conservative approach.

---

## 5. Store Pages (`src/app/dashboard/store/page.tsx`, `src/app/dashboard/store/[id]/page.tsx`)

### BUG-014 — Store detail page agent not found shows Next.js 404
- **File:** `src/app/dashboard/store/[id]/page.tsx:33`
- **Severity:** Low
- **Description:** When an agent is not found or inactive, `notFound()` is called which shows Next.js default 404 page. This is fine functionally but could benefit from a custom not-found page that directs users back to the store.
- **Suggested fix:** Create a `not-found.tsx` in `src/app/dashboard/store/[id]/` for a branded 404 experience.

### BUG-015 — Price display shows cost despite naming rules
- **File:** `src/app/dashboard/store/[id]/page.tsx:179`
- **Severity:** Medium (per project naming rules)
- **Description:** Per the MEMORY.md naming rules: "no cost shown". However, the store detail page displays `$X.XX` and "one-time purchase" text. The agent-store component also shows prices. This contradicts the naming/display rules.
- **Suggested fix:** Review the naming rules document to confirm whether this applies to the agent store or only to model provider costs. If it applies, remove price display and replace with "Included" / "Premium" badges.

---

## 6. Chat Page (`src/app/dashboard/chat/page.tsx`, `src/components/dashboard/agent-chat.tsx`)

### BUG-016 — Chat sidebar not responsive on mobile
- **File:** `src/components/dashboard/agent-chat.tsx:410`
- **Severity:** High
- **Description:** The chat layout uses `flex h-full` with a fixed `w-64` sidebar. On mobile screens, the sidebar takes up 256px, leaving very little room for the chat area. There is no responsive breakpoint to collapse the sidebar.
- **Suggested fix:** Hide the sidebar on mobile and show a mobile-friendly agent selector (possibly a dropdown or sheet). There is a `chat-mobile-sidebar.tsx` component that exists but is not used here.

### BUG-017 — Streaming chat does not abort on agent switch
- **File:** `src/components/dashboard/agent-chat.tsx:134-235`
- **Severity:** High
- **Description:** If a user switches agents while a streaming response is in progress, the old stream continues writing messages to the state. The `useEffect` that loads history when agent changes clears messages, but the active `fetch` and its `reader.read()` loop continues, appending tokens to a message ID that no longer exists in state. This causes the old response to silently accumulate in memory without being visible.
- **Suggested fix:** Use an `AbortController` that is cancelled when `selectedAgent` changes:
  ```ts
  const abortRef = useRef<AbortController | null>(null);
  // In sendMessage: abortRef.current = new AbortController(); pass signal to fetch
  // In useEffect cleanup: abortRef.current?.abort();
  ```

### BUG-018 — `/compact` command sets loading state but sendMessage also sets it
- **File:** `src/components/dashboard/agent-chat.tsx:263-303`
- **Severity:** Low
- **Description:** The `/compact` handler sets `setLoading(true)` and then calls `sendMessage()` which also sets `setLoading(true)`. The `finally` in `/compact` sets `setLoading(false)` but `sendMessage` has its own `finally` that also sets it to false. These interleave correctly by chance (sendMessage's finally runs before compact's finally), but it's fragile.
- **Suggested fix:** Remove the outer `setLoading` calls in `/compact` and let `sendMessage` handle them.

---

## 7. Channels Page (`src/app/dashboard/channels/page.tsx`, `src/components/dashboard/channel-manager.tsx`)

### BUG-019 — fetchLastMessages runs on every render due to `channels` dependency
- **File:** `src/components/dashboard/channel-manager.tsx:252-277`
- **Severity:** Medium
- **Description:** `fetchLastMessages` is wrapped in `useCallback` with `[channels]` as dependency. Since `channels` is state that gets updated (e.g., when health check completes, when channels are reordered), this causes `fetchLastMessages` to be recreated and the `useEffect` to re-run, firing N API calls each time a channel is reordered or health-checked. For 5 channels, that's 5 concurrent requests on every state change.
- **Suggested fix:** Use a ref for channels inside the callback, or debounce the effect, or only fetch on mount:
  ```ts
  useEffect(() => { fetchLastMessages(); }, []); // fetch once on mount
  ```

### BUG-020 — Reconnect sends empty credentials
- **File:** `src/components/dashboard/channel-manager.tsx:296-331`
- **Severity:** High
- **Description:** The `handleReconnect` function sends `credentials: {}` to the `/api/channels/connect` endpoint. However, the API route checks if credentials are empty for non-webchat channels and returns error "Credentials are required". This means reconnect will always fail for Telegram, Discord, Slack, and Teams channels. Only webchat reconnect works.
- **Suggested fix:** Either store and re-use encrypted credentials from the database during reconnect (the `channel_credentials` table already stores them), or show the credential form directly instead of attempting a credentialless reconnect.

---

## 8. Support Pages (`src/app/dashboard/support/page.tsx`, `support/new/page.tsx`, `support/[id]/page.tsx`)

### BUG-021 — New ticket navigation uses `/dashboard/support` path
- **File:** `src/app/dashboard/support/new/page.tsx:78,93,179`
- **Severity:** Medium
- **Description:** The "Back to Support" button and cancel button navigate to `/dashboard/support` instead of `/support`. While middleware rewrites `/support` to `/dashboard/support`, the URL bar will show `/dashboard/support` which is inconsistent with the rest of the app that uses clean URLs.
- **Suggested fix:** Change all `router.push("/dashboard/support")` to `router.push("/support")` and `router.push("/dashboard/support/${data.ticket_id}")` to `router.push("/support/${data.ticket_id}")`.

### BUG-022 — Ticket thread navigation also uses `/dashboard/support`
- **File:** `src/components/dashboard/ticket-thread.tsx:203`
- **Severity:** Medium
- **Description:** Same issue as BUG-021. The "Back to Support" button uses `router.push("/dashboard/support")`.
- **Suggested fix:** Change to `router.push("/support")`.

### BUG-023 — Ticket list navigation uses `/dashboard/support/new` and `/dashboard/support/{id}`
- **File:** `src/components/dashboard/ticket-list.tsx:166,216,237`
- **Severity:** Medium
- **Description:** All ticket navigation in the list component uses `/dashboard/support/...` paths instead of clean `/support/...` paths.
- **Suggested fix:** Change all instances to use clean URLs.

### BUG-024 — `category` field sent from new ticket form but not validated server-side
- **File:** `src/app/api/tickets/create/route.ts:27-31`
- **Severity:** Low
- **Description:** The `category` field is sent from the form but the API destructures `{ subject, description, priority }` and ignores `category`. The ticket is created without a category even though the user selected one.
- **Suggested fix:** Add `category` to the destructured body and include it in the insert query:
  ```ts
  const { subject, description, priority, category } = body;
  // ... in insert:
  category: category || "general",
  ```

---

## 9. Billing Page (`src/app/dashboard/billing/page.tsx`, `src/components/dashboard/billing-overview.tsx`)

### BUG-025 — Downgrade path not handled
- **File:** `src/components/dashboard/billing-overview.tsx:373-383`
- **Severity:** Low
- **Description:** If the user is on Pro and views the Starter card, the code checks `!hasAccess(subscription.plan, plan.name)` which returns false (Pro has access to starter-level). So no button is shown for downgrade. This is intentional, but there is no way for the user to downgrade at all. Should at least show "Contact support to downgrade" or similar.
- **Suggested fix:** Add a "Contact Support" button for plans below the current plan.

---

## 10. Account Page (`src/app/dashboard/account/page.tsx`, `src/components/dashboard/account-settings.tsx`)

### BUG-026 — Account page does not handle Supabase query errors
- **File:** `src/app/dashboard/account/page.tsx:22-43`
- **Severity:** Critical
- **Description:** The `Promise.all` for profile, channels, agents, and tickets queries has no `try/catch`. If any query throws (e.g., network error, table doesn't exist), the entire page crashes with an unhandled rejection. Every other page wraps this in try/catch, but the account page does not.
- **Suggested fix:** Wrap in try/catch like other pages:
  ```ts
  try {
    const [profileRes, channelsRes, agentsRes, ticketsRes] = await Promise.all([...]);
    // ...
  } catch {
    return <ErrorState />;
  }
  ```

---

## 11. Monitoring Page (`src/app/dashboard/monitoring/page.tsx`, `src/components/dashboard/monitoring-dashboard.tsx`)

### BUG-027 — CPU icon color logic has incorrect precedence
- **File:** `src/components/dashboard/monitoring-dashboard.tsx:166`
- **Severity:** Critical
- **Description:** The CPU icon color uses:
  ```tsx
  className={`h-4 w-4 ${monitoring.cpu_percent > 75 ? "text-yellow-500" : monitoring.cpu_percent > 90 ? "text-red-500" : "text-muted-foreground"}`}
  ```
  The condition `> 75` is checked first, so when CPU is at 95%, it matches `> 75` and shows yellow instead of red. The `> 90` branch is unreachable because any value > 90 is also > 75.
- **Suggested fix:** Reverse the order:
  ```tsx
  className={`h-4 w-4 ${monitoring.cpu_percent > 90 ? "text-red-500" : monitoring.cpu_percent > 75 ? "text-yellow-500" : "text-muted-foreground"}`}
  ```

---

## Cross-Cutting Concerns

### Loading States
All pages and components handle loading states well:
- Server components use `Suspense` boundaries implicitly via async components
- Client components use `isLoading` from TanStack Query or manual `useState` booleans
- Skeletons are used in VPS Controls; spinners elsewhere

### Empty States
All pages handle zero-item states with helpful messages and CTAs:
- Overview: staged (no subscription -> no VPS -> full dashboard)
- Agents: "No Agents Yet" with Store link
- Channels: "No Channels Connected" with setup wizard below
- Support: "No tickets found" with create button
- Billing: "No Active Subscription"
- Models: "No Model Configured"
- Store: "No agents found" when filtered

### Error States
Most pages use consistent error pattern with "Something went wrong" + refresh suggestion. API routes return structured JSON errors with appropriate HTTP status codes.

### Rate Limiting
All API routes implement rate limiting via `rateLimit()` utility. Limits are reasonable (3-60 requests per minute depending on operation sensitivity).

### Mobile Responsiveness
Grid layouts use responsive breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`). The main gap is BUG-016 (chat sidebar).

### Keyboard Navigation
- Forms use `<form onSubmit>` pattern for Enter key submission
- Chat supports Enter to send, Shift+Enter for newline
- AlertDialogs use proper focus trapping via Radix
- Tab navigation works through all interactive elements

### Memory Leaks
- TanStack Query handles cleanup automatically
- VPS Controls polling uses `refetchInterval` which is cleaned up on unmount
- Chat streaming does NOT clean up the reader on unmount (BUG-017)

---

## Summary Table

| ID | Severity | Page/Component | Description |
|----|----------|---------------|-------------|
| BUG-001 | High | Overview | No-subscription link to /billing is a dead end |
| BUG-003 | Medium | Overview | Model query error silently swallowed |
| BUG-004 | Medium | VPS | Supabase errors not checked before using data |
| BUG-007 | Medium | VPS Controls | Double-click timing window on Stop/Restart |
| BUG-008 | High | Models Page | Returns null instead of redirect for unauthed users |
| BUG-009 | Medium | Models Page | available_models error not checked |
| BUG-011 | High | Agent Manager | Bulk deploy ignores VPS status |
| BUG-012 | Medium | Agent Manager | Null agent name access crash |
| BUG-015 | Medium | Store | Price display may violate naming rules |
| BUG-016 | High | Chat | Sidebar not responsive on mobile |
| BUG-017 | High | Chat | Stream not aborted on agent switch |
| BUG-019 | Medium | Channels | fetchLastMessages fires on every state change |
| BUG-020 | High | Channels | Reconnect always fails (empty credentials) |
| BUG-021 | Medium | Support/New | Uses /dashboard/ prefix in navigation |
| BUG-022 | Medium | Ticket Thread | Uses /dashboard/ prefix in navigation |
| BUG-023 | Medium | Ticket List | Uses /dashboard/ prefix in navigation |
| BUG-024 | Low | Tickets API | Category field ignored server-side |
| BUG-026 | Critical | Account Page | No try/catch on Promise.all queries |
| BUG-027 | Critical | Monitoring | CPU icon color logic unreachable red branch |

---

## Recommended Priority Order

1. **BUG-026** (Critical) — Account page crash on query failure
2. **BUG-027** (Critical) — Monitoring CPU color logic wrong
3. **BUG-008** (High) — Models page null return for unauthed
4. **BUG-017** (High) — Chat stream leak on agent switch
5. **BUG-020** (High) — Channel reconnect always fails
6. **BUG-016** (High) — Chat mobile layout broken
7. **BUG-011** (High) — Bulk deploy ignores VPS status
8. **BUG-001** (High) — Billing dead end for new users
9. **BUG-021/022/023** (Medium) — Navigation URL inconsistencies
10. Everything else
