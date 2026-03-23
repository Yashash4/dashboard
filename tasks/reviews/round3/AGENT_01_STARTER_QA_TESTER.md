# Agent 01 — Starter Dashboard — QA Tester Review

**Total Issues Found: 22**
- CRITICAL: 2
- HIGH: 5
- MEDIUM: 10
- LOW: 5

**Reviewer:** QA Tester (Round 3)
**Date:** 2026-03-22
**Scope:** Dashboard pages, non-v1/non-admin API routes, dashboard components
**Note:** This review focuses on NEW issues not already covered in rounds 1-2 (59_QA_TESTER.md, 129_QA_TESTER.md, 350_QA_POSTFIX.md).

---

## Dashboard Pages — Auth Handling

### [QA-01] — 8 dashboard pages return `null` instead of redirecting unauthenticated users
**File:** `src/app/dashboard/webhooks/page.tsx:12`, `src/app/dashboard/analytics/page.tsx:12`, `src/app/dashboard/audit-log/page.tsx:12`, `src/app/dashboard/knowledge-base/page.tsx:12`, `src/app/dashboard/agent-builder/page.tsx:12`, `src/app/dashboard/api-access/page.tsx:14`, `src/app/dashboard/model-playground/page.tsx:12`, `src/app/dashboard/logs/page.tsx:12`
**Description:** Eight Pro-gated dashboard pages use `if (!user) return null;` instead of redirecting to `/login`. While the dashboard layout (`layout.tsx:22-24`) does redirect unauthenticated users, these pages can be accessed directly via URL. If the layout check somehow passes (race condition, stale session), the user sees a completely blank page with no indication of what happened.
**Severity:** HIGH
**Steps to Reproduce:** Navigate directly to `/webhooks` with an expired or invalid session token that the layout doesn't catch.
**Expected vs Actual:** Expected: redirect to `/login`. Actual: blank white page with no content or error message.

---

## Chat Page & Component

### [QA-02] — Chat page absolute positioning breaks scroll context
**File:** `src/app/dashboard/chat/page.tsx:92`
**Description:** The chat page wraps `AgentChat` in `<div className="absolute inset-0 flex flex-col">`. This `absolute inset-0` positions relative to the nearest positioned ancestor. Since the dashboard layout uses `<main className="flex-1 p-6">` which is not explicitly positioned, the chat area may overflow behind the sidebar or header on certain viewport sizes. The `-m-6` pattern used on the OpenClaw embed page (`openclaw/page.tsx:103`) is a better approach but also not used here.
**Severity:** MEDIUM
**Steps to Reproduce:** Open the chat page in a dashboard with the sidebar expanded. Resize the window to a narrow width (768-1024px range). The chat may overlap with the sidebar or extend below the viewport.
**Expected vs Actual:** Expected: chat fills available space within the main content area. Actual: chat may break out of its container bounds.

### [QA-03] — /compact command calls non-streaming endpoint but sendMessage uses streaming
**File:** `src/components/dashboard/agent-chat.tsx:299-306`
**Description:** The `/compact` command calls `/api/chat/send` (non-streaming endpoint) to get a summary, but `sendMessage()` on line 325 uses `/api/chat/stream` (streaming endpoint). The `/api/chat/send` call at line 299 does NOT have the AbortController signal attached, so aborting via agent switch during compaction will not cancel the summary request. Also, the user message from the summary prompt is stored server-side (in `chat_messages`), polluting the conversation history with internal "Summarize our conversation" messages.
**Severity:** MEDIUM
**Steps to Reproduce:** Type `/compact`, then immediately switch to a different agent. The summary fetch continues in the background and may complete after the agent switch.
**Expected vs Actual:** Expected: compact operation is fully cancelled. Actual: the `/api/chat/send` request continues, stores messages in the old conversation, and the resulting `sendMessage` call may fire for the wrong agent context.

### [QA-04] — /retry removes all messages after last user message, including system messages
**File:** `src/components/dashboard/agent-chat.tsx:378-382`
**Description:** The `/retry` command uses `findLastIndex` to find the last user message, then slices to remove everything from that index onward. If system messages (from `/help`, `/status`, etc.) were added after the last user message, they are also removed. This is confusing because the user types `/retry` and loses their `/help` output or `/status` results.
**Severity:** LOW
**Steps to Reproduce:** 1) Send a message. 2) Type `/help`. 3) Type `/retry`. The help output disappears along with the last user message and response.
**Expected vs Actual:** Expected: only the last exchange (user message + assistant response) is removed and retried. Actual: all messages after the last user message index are removed, including system messages.

---

## VPS Controls & API

### [QA-05] — VPS restart route sets status to "running" immediately after API call
**File:** `src/app/api/vps/restart/route.ts:51-57`
**Description:** The restart route calls `restartVM()` then immediately sets status to `"running"` (line 57). However, a VM restart is not instantaneous -- the machine needs to boot up, services need to start. Setting status to `"running"` immediately is premature. Compare with the start route which correctly sets status to `"starting"` (line 58 of start/route.ts). This means the dashboard will show "Running" while the VPS is still rebooting, and SSH connections will fail.
**Severity:** HIGH
**Steps to Reproduce:** Click "Restart" on the VPS page. Immediately try to deploy an agent or check monitoring. The VPS shows "Running" but SSH commands fail because the machine is still booting.
**Expected vs Actual:** Expected: status shows "Restarting" until the VM is confirmed running. Actual: status immediately shows "Running" after the restartVM API call returns.

### [QA-06] — VPS status sync silently swallows Hostinger API errors for "restarting" state
**File:** `src/app/api/vps/status/route.ts:63`
**Description:** The condition `if (hostingerState !== vps.status && vps.status !== "restarting")` prevents status updates when the DB says "restarting". Combined with QA-05 (restart route sets "running" immediately), this condition is effectively a no-op because the status will never be "restarting" in the DB when the status sync runs. However, if QA-05 is fixed to properly set "restarting", this guard would prevent the status from ever being updated FROM "restarting" to the actual state from Hostinger, leaving users stuck at "Restarting" indefinitely until a manual status poll with a different initial state.
**Severity:** MEDIUM
**Steps to Reproduce:** If QA-05 is fixed: restart VPS, then the status poll will see `vps.status === "restarting"` and skip the update even when Hostinger reports `"running"`.
**Expected vs Actual:** Expected: status updates from "restarting" to "running" once the VM is confirmed up. Actual: the guard skips the update.

### [QA-07] — VPS controls chart data dependency array includes redundant monitoring sub-fields
**File:** `src/components/dashboard/vps-controls.tsx:196`
**Description:** The `useEffect` for accumulating chart data has dependencies `[monitoring, monitoring?.cpu_percent, monitoring?.ram_used_mb, monitoring?.net_rx_bytes, monitoring?.net_tx_bytes]`. Since `monitoring` already includes these values, adding them as separate dependencies is redundant and can cause double execution in a single render cycle if TanStack Query returns a new object reference but the same sub-values (unlikely but possible with structural sharing). More importantly, if monitoring is `null`, all the sub-fields are `undefined`, and the effect still runs once (for the initial null check), which is fine. But if monitoring object reference changes while values stay the same, the effect runs but produces a duplicate chart point at the same time.
**Severity:** LOW
**Steps to Reproduce:** Watch the chart data accumulate over time. If TanStack Query returns the same monitoring data but a new object reference (e.g., from a refetch that returns identical data), duplicate points may appear.
**Expected vs Actual:** Expected: one chart point per monitoring poll. Actual: potentially duplicate points due to dependency array redundancy.

---

## Channel Manager

### [QA-08] — Channel health check runs pgrep for every channel sequentially
**File:** `src/app/api/channels/health/route.ts:128-136`
**Description:** For every connected channel, the health check route runs `pgrep -f 'openclaw'` via SSH (line 128-131). If a user has 5 channels, that's 5 sequential SSH exec commands for the same check (is OpenClaw running?). The result is always the same for all channels since it's checking the same process. This wastes SSH roundtrips and increases latency linearly with channel count.
**Severity:** MEDIUM
**Steps to Reproduce:** Connect 5 channels, click "Check Health". The request takes ~5x longer than necessary because the same process check runs 5 times.
**Expected vs Actual:** Expected: process check runs once, result applied to all channels. Actual: process check runs once per channel.

### [QA-09] — Channel health check JSON parsing strips comments incorrectly
**File:** `src/app/api/channels/health/route.ts:87-88`
**Description:** The OpenClaw config JSON cleaning uses `raw.replace(/\/\/.*$/gm, "")` to strip comments. This regex also strips `//` within string values, e.g., a URL like `"https://example.com"` would become `"https:`. This would cause JSON.parse to fail, and the channel health would show "unknown" for all channels even when they're properly configured.
**Severity:** HIGH
**Steps to Reproduce:** Have an OpenClaw config with any URL containing `//` in a string value (which is virtually guaranteed since webhook URLs, API endpoints all contain `//`). The health check fails to parse config.
**Expected vs Actual:** Expected: config is parsed correctly. Actual: JSON.parse fails due to corrupted URL strings, all channels show "unknown" health.

---

## Billing

### [QA-10] — Billing page doesn't check payments query error
**File:** `src/app/dashboard/billing/page.tsx:50-51`
**Description:** After `Promise.all`, the code checks `subRes.error` but not `paymentsRes.error`. If the payments query fails (e.g., table doesn't exist, RLS issue), the error is silently swallowed and `payments` stays null, which is coerced to `[]` on line 89. The user sees an empty payment history with no indication of an error.
**Severity:** LOW
**Steps to Reproduce:** If the `payments` table has an RLS policy that denies read access, the billing page shows "No payment history" instead of an error.
**Expected vs Actual:** Expected: error state shown. Actual: silent empty payments list.

### [QA-11] — Enterprise plan annual price is 0, causing "$0.00/yr" display
**File:** `src/components/dashboard/billing-overview.tsx:120`
**Description:** The enterprise plan has `annualUsd: 0` and `contactUs: true`. However, the plan card rendering doesn't check the `contactUs` flag before displaying the price. When `showAnnual` is true, the enterprise plan shows "$0.00/yr" instead of "Contact Us". The `handleUpgrade` function (line 160-161) has a guard `if (!amount) return;` which prevents the upgrade flow from working, but the price display is misleading.
**Severity:** MEDIUM
**Steps to Reproduce:** Go to Billing page, toggle to "Annual" billing view. The Enterprise card shows "$0.00/yr".
**Expected vs Actual:** Expected: Enterprise card shows "Contact Us" regardless of billing toggle. Actual: shows "$0.00/yr" when annual is selected.

---

## Account Page

### [QA-12] — Account page accesses profileRes.data without checking profileRes.error
**File:** `src/app/dashboard/account/page.tsx:67`
**Description:** After the try/catch block, `profileRes.data` is accessed directly (line 67) without checking `profileRes.error`. If the `users` table query returns an error with `data: null` (which Supabase does for single-row queries), `profile` will be null and the "Profile Not Found" fallback shows. But the actual error (e.g., permission denied) is lost. Additionally, `channelsRes.error`, `agentsRes.error`, and `ticketsRes.error` are never checked -- if any of them fail, the stats silently show 0.
**Severity:** MEDIUM
**Steps to Reproduce:** If the users table RLS policy denies access for a user, the account page shows "Profile Not Found" instead of "Something went wrong".
**Expected vs Actual:** Expected: error state with "Something went wrong" message. Actual: "Profile Not Found" message that misleads the user.

---

## Support Tickets

### [QA-13] — Ticket list "Load More" fetches from a non-existent API route
**File:** `src/components/dashboard/ticket-list.tsx:127-128`
**Description:** The `handleLoadMore` function fetches from `/api/tickets/list?offset=...&limit=...`. However, the tickets API routes visible in the codebase are `/api/tickets/create` and `/api/tickets/reply`. There is no `/api/tickets/list/route.ts` file. This means the "Load More" button will always silently fail (the catch block ignores errors), and users can never load more than the initial 20 tickets.
**Severity:** HIGH
**Steps to Reproduce:** Create more than 20 tickets. The "Load More" button appears but clicking it does nothing (no error toast, no new tickets loaded).
**Expected vs Actual:** Expected: additional tickets are loaded. Actual: fetch fails silently, button shows loading spinner briefly then resets.

---

## Monitoring Page

### [QA-14] — Monitoring page doesn't check vpsRes.error or subRes.error
**File:** `src/app/dashboard/monitoring/page.tsx:59-60`
**Description:** The monitoring page assigns `vps = vpsRes.data` and `subscription = subRes.data` without checking the `.error` property on either response. If the VPS query returns an error (e.g., PGRST116 for no rows), the error is swallowed and `vps` is null, showing the "No VPS Provisioned" state. But if the error is something else (permissions, network), the user gets a misleading "No VPS Provisioned" message instead of an error.
**Severity:** MEDIUM
**Steps to Reproduce:** If a database permission error occurs on the vps_instances query, the monitoring page shows "No VPS Provisioned" instead of "Something went wrong".
**Expected vs Actual:** Expected: error state shown for non-PGRST116 errors. Actual: "No VPS Provisioned" for any error.

---

## OpenClaw Dashboard Page

### [QA-15] — OpenClaw embed page passes decrypted password to client component
**File:** `src/app/dashboard/openclaw/page.tsx:118-124`
**Description:** The OpenClaw page passes `decryptField(vps.dashboard_password)` directly as props to client components `OpenClawCredentialsBanner` and `OpenClawEmbed`. Since these are client components, the decrypted password is serialized into the HTML payload sent to the browser. While this is the password for the user's own VPS dashboard (so they have a right to it), it means the plaintext password appears in the page source and React DevTools, and could be captured by browser extensions or XSS attacks.
**Severity:** MEDIUM
**Steps to Reproduce:** Open the OpenClaw dashboard page, view page source. The decrypted VPS dashboard password is visible in the serialized React props.
**Expected vs Actual:** Expected: password retrieved client-side via API call when needed. Actual: password embedded in HTML.

---

## Store

### [QA-16] — Store page uses wrong column name `is_active` instead of `is_available`
**File:** `src/app/dashboard/store/page.tsx:30`
**Description:** The store page queries agents with `.eq("is_active", true)` but the store detail page (`store/[id]/page.tsx:30`) also uses `.eq("is_active", true)`. Meanwhile, the agents deploy route checks agents table differently. If the column name in the database is `is_available` (as used for `available_models`), this query would fail silently, returning no agents and showing an empty store. This needs verification against the actual database schema.
**Severity:** LOW
**Steps to Reproduce:** Check if `is_active` exists as a column on the `agents` table. If it doesn't, the store shows no agents.
**Expected vs Actual:** Expected: store shows available agents. Actual: potentially empty store if column name is wrong.

---

## Cron Route

### [QA-17] — Cron route leaves pending change in place when SSH fails
**File:** `src/app/api/cron/apply-pending-changes/route.ts:118-125`
**Description:** When `configureApiKeys` returns `{ success: false }`, the cron route logs the failure but does NOT clear `requested_model` or `change_effective_date`. This means the same failed change will be retried on every cron run indefinitely, potentially causing repeated SSH connections to a misconfigured or unreachable VPS. There's no retry limit or backoff.
**Severity:** MEDIUM
**Steps to Reproduce:** Have a pending model change with a VPS that has an SSH issue (wrong password, firewall). Every cron invocation retries the change and fails.
**Expected vs Actual:** Expected: retry with backoff, or mark as failed after N attempts. Actual: infinite retries on every cron run.

---

## API Route — Password Change

### [QA-18] — Password change creates a throwaway Supabase session that could be leaked
**File:** `src/app/api/account/password/route.ts:46-62`
**Description:** The password change route creates a new Supabase client with `createClient` from `@supabase/supabase-js` (line 46-50), signs in with the user's email and current password to verify it, then signs out. However, between sign-in and sign-out, a valid session token exists. If `signOut()` fails (network error), this session remains valid. More importantly, `createClient` here uses the ANON key, so the session is fully valid for data operations. The `signOut()` call on line 62 does not have error handling.
**Severity:** MEDIUM
**Steps to Reproduce:** Change password while experiencing intermittent network issues. The `signOut()` call fails, leaving a stale session.
**Expected vs Actual:** Expected: throwaway session is always cleaned up. Actual: session may persist if signOut fails.

---

## Webhook Route

### [QA-19] — Webhook creation returns full secret in response
**File:** `src/app/api/webhooks/route.ts:183`
**Description:** The POST route returns the full webhook object including the unmasked `secret` field (line 183: `return NextResponse.json({ webhook })`). While the GET route masks secrets (line 48-53), the create response includes the raw secret. This is likely intentional (show once, like API keys), but there's no comment or documentation indicating this is by design. The `WebhooksManager` component should show a "copy secret" UI on creation, but if it doesn't handle this, the secret may be lost.
**Severity:** LOW
**Steps to Reproduce:** Create a webhook. The full secret is returned in the response.
**Expected vs Actual:** This is likely intended behavior but should be documented.

---

## Dashboard Password Component

### [QA-20] — Dashboard password fetches plaintext password via GET
**File:** `src/components/dashboard/dashboard-password.tsx:31`, `src/app/api/vps/password/route.ts:37-41`
**Description:** The GET endpoint at `/api/vps/password` returns the decrypted dashboard password in plaintext JSON (line 39). The client component then displays it in a toggleable password field. This means every page load of the VPS page makes a request containing the plaintext password in the response body. If the user's browser logs API responses (DevTools open, network inspector extensions), the password is logged in cleartext.
**Severity:** HIGH (sensitive data exposure)
**Steps to Reproduce:** Open the VPS page with browser DevTools Network tab open. The `/api/vps/password` response contains `{ username: "admin", password: "the_actual_password", hostname: "..." }` in plain text.
**Expected vs Actual:** Expected: password shown only when explicitly requested, or retrieved via a POST with additional verification. Actual: password always returned on page load via GET request with no additional verification.

---

## General

### [QA-21] — No CSRF protection on state-changing GET endpoints
**File:** `src/app/api/chat/messages/route.ts:57` (DELETE via query params), `src/app/api/vps/password/route.ts:11` (GET returns sensitive data)
**Description:** The DELETE handler for chat messages uses a GET-like pattern where `agent_id` comes from query params, and the actual deletion happens via DELETE method. However, the VPS password GET endpoint returns sensitive data without any additional CSRF token or confirmation. A malicious page could use `<img>` or `fetch` to exfiltrate the password if the user is logged in (since cookies are sent automatically).
**Severity:** CRITICAL
**Steps to Reproduce:** Craft a malicious page that calls `fetch("https://app.clawhq.tech/api/vps/password", {credentials:"include"})`. If SameSite cookies are not set to Strict, the password leaks.
**Expected vs Actual:** Expected: sensitive GET endpoints require additional verification or use POST. Actual: password returned via simple GET with cookie auth.

### [QA-22] — `decryptField` called on potentially null values without null check
**File:** Multiple files including `src/app/api/vps/monitoring/route.ts:59`, `src/app/api/agents/deploy/route.ts:213`, `src/app/api/channels/connect/route.ts:119`
**Description:** Many API routes call `decryptField(vps.ssh_password)` without first checking if `vps.ssh_password` is null. The VPS query selects `ssh_password` but if the field is null in the database (e.g., during provisioning or after a failed setup), `decryptField(null)` would throw a runtime error. The function likely expects a string input based on its usage pattern.
**Severity:** CRITICAL
**Steps to Reproduce:** Access monitoring, deploy, or channel connect endpoints when the VPS record exists but `ssh_password` is null (e.g., provisioning in progress, or data corruption).
**Expected vs Actual:** Expected: graceful error message like "VPS not fully configured". Actual: unhandled runtime error from `decryptField(null)`.

---

## Summary Table

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| QA-01 | HIGH | 8 dashboard pages | `return null` instead of redirect for unauthenticated users |
| QA-02 | MEDIUM | chat/page.tsx:92 | Absolute positioning may break layout bounds |
| QA-03 | MEDIUM | agent-chat.tsx:299 | /compact command not cancellable, pollutes history |
| QA-04 | LOW | agent-chat.tsx:378 | /retry removes system messages unintentionally |
| QA-05 | HIGH | vps/restart/route.ts:57 | Sets status "running" immediately after restart API call |
| QA-06 | MEDIUM | vps/status/route.ts:63 | Status sync guard prevents updating from "restarting" state |
| QA-07 | LOW | vps-controls.tsx:196 | Redundant useEffect dependencies may cause duplicate chart points |
| QA-08 | MEDIUM | channels/health/route.ts:128 | Redundant SSH pgrep calls for each channel |
| QA-09 | HIGH | channels/health/route.ts:87 | JSON comment stripping corrupts URLs in config strings |
| QA-10 | LOW | billing/page.tsx:50 | payments query error not checked |
| QA-11 | MEDIUM | billing-overview.tsx:120 | Enterprise plan shows "$0.00/yr" instead of "Contact Us" |
| QA-12 | MEDIUM | account/page.tsx:67 | Query errors not checked before accessing .data |
| QA-13 | HIGH | ticket-list.tsx:127 | "Load More" calls non-existent /api/tickets/list endpoint |
| QA-14 | MEDIUM | monitoring/page.tsx:59 | VPS/subscription query errors not checked |
| QA-15 | MEDIUM | openclaw/page.tsx:118 | Decrypted password serialized to client HTML |
| QA-16 | LOW | store/page.tsx:30 | Potentially wrong column name for agent availability |
| QA-17 | MEDIUM | cron/apply-pending-changes:118 | Failed SSH changes retried infinitely |
| QA-18 | MEDIUM | account/password/route.ts:62 | Throwaway Supabase session may leak on signOut failure |
| QA-19 | LOW | webhooks/route.ts:183 | Full secret returned on creation (by design?) |
| QA-20 | HIGH | vps/password/route.ts:37 | Plaintext password returned via GET on every page load |
| QA-21 | CRITICAL | vps/password/route.ts:11 | Sensitive data via GET without CSRF protection |
| QA-22 | CRITICAL | Multiple API routes | decryptField called on potentially null ssh_password |

---

## Recommended Priority Order

1. **QA-22** (CRITICAL) — decryptField on null crashes API routes
2. **QA-21** (CRITICAL) — Sensitive password GET without CSRF protection
3. **QA-20** (HIGH) — Plaintext password in GET response
4. **QA-05** (HIGH) — VPS restart sets "running" prematurely
5. **QA-09** (HIGH) — Channel health JSON parsing corrupts URLs
6. **QA-13** (HIGH) — Load More tickets calls missing endpoint
7. **QA-01** (HIGH) — 8 pages return null for unauthenticated users
8. **QA-11** (MEDIUM) — Enterprise plan $0.00/yr display
9. **QA-17** (MEDIUM) — Infinite cron retries for failed changes
10. Everything else
