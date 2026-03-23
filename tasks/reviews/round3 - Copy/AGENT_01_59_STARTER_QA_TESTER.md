# Agent 01 — 59-Starter Dashboard — QA Tester Review

**Total Issues Found: 16**
- CRITICAL: 3
- HIGH: 4
- MEDIUM: 6
- LOW: 3

---

## Dashboard Pages

### [QA-01] — Chat page uses `position: absolute` with incomplete stacking context
**File:** `src/app/dashboard/chat/page.tsx:92`
**Description:** The chat page container uses `className="absolute inset-0 flex flex-col"` which requires a parent with `position: relative`. If the parent does not establish a proper stacking context, this will break mobile layout and cause the chat interface to cover other UI elements. The `AgentChat` component also has a mobile sidebar overlay that depends on the parent providing the right positioning context.
**Severity:** HIGH
**Steps to Reproduce:** 1. Navigate to `/chat` on mobile or in a browser with mobile viewport. 2. Observe if the chat interface overlaps the header/navigation unexpectedly.
**Expected vs Actual:** Chat should be contained within the page layout without overlapping other elements.

---

### [QA-02] — Chat page missing `agent_id` validation before rendering
**File:** `src/app/dashboard/chat/page.tsx:20-24`
**Description:** The `userAgents` query on line 40 (`agentsRes.data`) is not checked for errors before being used. If the query fails silently, `userAgents` could be `null` or `undefined`, leading to a runtime error during the `.map()` call at line 53. Additionally, no validation exists to ensure the selected agent actually exists when rendering.
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Login as a user. 2. Navigate to `/chat` with no deployed agents. 3. If the API returns an error object instead of null, the `.map()` on line 53 crashes.
**Expected vs Actual:** The page should gracefully handle empty or error responses from the agents API.

---

### [QA-03] — Dashboard `overview` page makes 6 sequential DB queries in try-catch
**File:** `src/app/dashboard/page.tsx:62-116`
**Description:** All 6 Supabase queries are wrapped in a single try-catch that returns a generic error screen. If one query fails with a real error (not PGRST116 "no rows"), the user sees a full-page error and cannot see any of the other data that loaded successfully. There is no granular error handling per query.
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Have a valid subscription and VPS data. 2. Artificially cause the channels query to fail (e.g., permissions issue). 3. The entire dashboard becomes inaccessible with a generic error.
**Expected vs Actual:** Partial data should be displayed with individual error states for failed components.

---

### [QA-04] — Models page mutation of `modelConfig.changes_this_month` is a no-op
**File:** `src/app/dashboard/models/page.tsx:68-77`
**Description:** The code at lines 74-76 computes `modelConfig.changes_this_month = 0` when the billing cycle has renewed, but this mutation is local-only and never persisted back to the database. The counter only resets when the user makes another model change API call, not when the billing cycle renews.
**Severity:** LOW
**Steps to Reproduce:** 1. Change a model. 2. Wait for billing cycle renewal (or manually advance `expires_at`). 3. Refresh the models page. 4. The "Changes this month" counter may show stale values.
**Expected vs Actual:** Counter should reset to 0 on page load if billing cycle has renewed.

---

## API Routes

### [QA-05] — `chat/stream` route does not validate VPS running status
**File:** `src/app/api/chat/stream/route.ts:57-59`
**Description:** Unlike `chat/send` which explicitly checks `vps.status !== "running"` at line 101 and returns a descriptive error, the streaming endpoint only checks `!vps || vps.status !== "running"` at line 57 and returns a generic "VPS not running" message. More importantly, the error message for this case is not user-friendly and doesn't guide the user to start their VPS.
**Severity:** HIGH
**Steps to Reproduce:** 1. Have a VPS that is stopped. 2. Attempt to send a chat message via the streaming endpoint. 3. The error "VPS not running" is returned but no actionable guidance is provided.
**Expected vs Actual:** Should return a clear message: "Your VPS is not running. Start it from the VPS page first."

---

### [QA-06] — `chat/stream` route has unhandled stream error causing silent 502
**File:** `src/app/api/chat/stream/route.ts:119-122`
**Description:** When `openclawRes.ok` is false or `openclawRes.body` is null, the route returns a 502 with `{ error: "Agent unavailable" }`. However, the `agent-chat.tsx` streaming handler at line 192 checks `contentType.includes("text/event-stream")` - if the non-streaming fallback at line 121 returns JSON instead of SSE, the client will receive a non-stream response that it tries to parse as SSE, potentially causing an unhandled error.
**Severity:** HIGH
**Steps to Reproduce:** 1. Deploy an agent. 2. Stop the VPS. 3. Send a chat message. 4. Observe if the error is properly displayed or if the UI gets stuck in a loading state.
**Expected vs Actual:** The error should be caught and displayed to the user without crashing the chat UI.

---

### [QA-07] — `chat/stream` route's async IIFE swallows all errors silently
**File:** `src/app/api/chat/stream/route.ts:179-184`
**Description:** The async IIFE `(async () => { ... })()` at line 133 has a catch block at line 179 that does `// Stream error` with no error handling, logging, or cleanup. If an error occurs during streaming, the `writer.close()` is called in `finally` at line 182, but no error is propagated to the client and no cleanup of the assistant message occurs.
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Start a chat stream. 2. Interrupt the stream mid-response (e.g., stop the VPS). 3. The server-side error is swallowed silently, and no user-facing error is shown.
**Expected vs Actual:** Stream errors should be logged and communicated to the client.

---

### [QA-08] — `chat/stream` doesn't store user message before starting stream
**File:** `src/app/api/chat/stream/route.ts:81-85`
**Description:** The non-streaming `chat/send` route stores the user message before calling the OpenClaw API (line 159). However, `chat/stream` stores the user message but if the stream fails to start (line 106-122), the message is already in the DB but the user never gets a response. The message appears sent with no response.
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Send a chat message. 2. Before the response arrives, the OpenClaw API returns an error. 3. The user message is stored but appears without a response in history.
**Expected vs Actual:** If the stream fails to start, the orphan message should be deleted or an error message should be stored.

---

### [QA-09] — `vps/restart` sets status to "running" immediately after async call
**File:** `src/app/api/vps/restart/route.ts:41-52`
**Description:** The restart endpoint sets `status: "running"` immediately after `restartVM()` returns without waiting for the VPS to actually complete restarting. A Hostinger restart can take 1-5 minutes. The user's dashboard will show "running" while the VPS is still restarting, causing misleading status information.
**Severity:** HIGH
**Steps to Reproduce:** 1. Call `POST /api/vps/restart`. 2. Immediately poll `GET /api/vps/status`. 3. Status returns "running" even though the VPS is still in the restart process.
**Expected vs Actual:** Status should remain "restarting" until the VPS actually confirms it's running (via Hostinger webhook or subsequent poll).

---

### [QA-10] — `vps/start` has no check if VPS is already in a transitioning state
**File:** `src/app/api/vps/start/route.ts:41-46`
**Description:** The start endpoint checks if `vps.status === "running"` to prevent starting an already-running VPS. However, it does NOT check if `vps.status === "starting"` or `vps.status === "restarting"`. If a user spam-clicks "Start" while the VPS is already in a starting transition, multiple `startVM()` calls could be made to Hostinger.
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Have a stopped VPS. 2. Click "Start" twice in rapid succession (or make two API calls before the first completes). 3. Two `startVM` calls are made to Hostinger.
**Expected vs Actual:** Should check for and reject transitioning states ("starting", "restarting", "provisioning").

---

### [QA-11] — `keys/route.ts` POST has no `await` on `request.json()`
**File:** `src/app/api/keys/route.ts:125`
**Description:** At line 125, `request.json()` is called without `await`. Since the function is `async`, this returns a Promise that gets passed to the destructuring. The `name` and `rate_limit_per_min` will be undefined, causing validation to fail with a confusing "Key name is required" error instead of a "Invalid request body" error.
**Severity:** HIGH
**Steps to Reproduce:** 1. Send a POST to `/api/keys` with valid JSON body. 2. Observe that the validation fails with "Key name is required" even though the name was provided.
**Expected vs Actual:** The `await` keyword is missing, causing the body to not be parsed correctly.

---

### [QA-12] — `channels/connect` silently swallows SSH errors
**File:** `src/app/api/channels/connect/route.ts:178-179`
**Description:** The catch block at line 178 only returns `{ error: "Failed to connect channel." }` without any logging or error details. The underlying SSH error from `configureChannel()` is lost, making it impossible to debug connection failures. Compare with `agents/deploy` which at least logs the error message (even if unused client-side).
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Attempt to connect a channel with invalid credentials. 2. The SSH library throws a detailed error about why the connection failed. 3. The user sees only a generic "Failed to connect channel" with no actionable information.
**Expected vs Actual:** At minimum, the error should be logged server-side. Better: return a more specific error when possible.

---

### [QA-13] — `tickets/create` deletes orphan ticket on message insert failure
**File:** `src/app/api/tickets/create/route.ts:100-106`
**Description:** If the ticket is created successfully but the initial message insert fails (line 94-98), the code deletes the orphan ticket (line 102). However, this delete operation is not awaited and has no error handling. If the delete fails, there's no indication of what happened, and the user may have paid for a ticket that doesn't exist in our system.
**Severity:** LOW
**Steps to Reproduce:** 1. Create a ticket. 2. Artificially cause the `ticket_messages` insert to fail. 3. The delete operation may fail silently, leaving an orphan ticket record.
**Expected vs Actual:** The delete operation should be awaited and any failures should be logged.

---

## Components

### [QA-14] — `AgentChat` streaming has no timeout on the SSE response itself
**File:** `src/components/dashboard/agent-chat.tsx:152-269`
**Description:** The `sendMessage` function uses `controller.signal` with a 60-second timeout at the fetch level (line 273), but this only aborts the fetch, not the SSE stream processing. If the server starts sending but sends very slowly (e.g., 1 byte per minute), the fetch will timeout but the stream processing loop may continue indefinitely since `controller.abort()` at line 155 only aborts the fetch, not the `reader.read()` loop.
**Severity:** MEDIUM
**Steps to Reproduce 1:** 1. Deploy an agent that takes an extremely long time to respond. 2. The 60s fetch timeout fires but the stream reader may not be aborted.
**Expected vs Actual:** The AbortController should be connected to the reader as well.

---

### [QA-15] — `AgentManager` bulk deploy doesn't update `agents` state correctly on failure
**File:** `src/components/dashboard/agent-manager.tsx:261-277`
**Description:** When a bulk deploy operation fails for a specific agent (line 261: `if (!res.ok) { failed++; continue; }`), the local `agents` state is NOT updated for that agent. However, subsequent agents in the loop DO update the state. If the operation is then retried or the page is refreshed, the displayed state may not match the actual deployed state. Additionally, `startingDeployedCount` at line 243 is captured at the start but never updated during the loop, so it becomes stale.
**Severity:** LOW
**Steps to Reproduce:** 1. Attempt to bulk deploy 3 agents. 2. The second agent fails (e.g., bad config). 3. The third agent deploys successfully but `startingDeployedCount` is used for the limit check, causing incorrect deployment limit calculations.
**Expected vs Actual:** Failed agents should be clearly marked, and the deploy limit check should use the current count.

---

### [QA-16] — `channel-manager` reconnect uses undefined credentials fallback
**File:** `src/components/dashboard/channel-manager.tsx:458-466`
**Description:** When a new channel is connected and `data.channel_id` is undefined (line 460), the code creates a new channel object with `{ id: undefined, channel_type: connectType, ... }`. While React's `key={channel.id}` will cause a warning, the channel is still added to state. If the channel ID is truly undefined, subsequent operations (disconnect, health check) that rely on `channel.id` will fail.
**Severity:** MEDIUM
**Steps to Reproduce:** 1. Connect a channel. 2. If the API returns success but without a `channel_id`. 3. The channel appears in the UI with an undefined ID. 4. Clicking "Disconnect" sends a malformed request.
**Expected vs Actual:** The code should validate that `channel_id` exists before adding the channel to state.

---

## No Issues Found In

- `src/app/api/agents/deploy/route.ts` — Proper error handling, VPS status check, rate limiting
- `src/app/api/agents/undeploy/route.ts` — Proper validation, error handling
- `src/app/api/vps/status/route.ts` — Good error handling with `_stale` indicator
- `src/app/api/vps/stop/route.ts` — Proper state checks and error handling
- `src/app/api/vps/start/route.ts` — Proper state check for already-running VPS
- `src/components/dashboard/model-config.tsx` — Well-structured with proper loading states
- `src/components/dashboard/vps-controls.tsx` — Good polling implementation with proper cleanup
- `src/components/dashboard/channel-manager.tsx` (general structure) — Proper error boundaries

---

## Summary

The most critical issues requiring immediate attention are:
1. **Missing `await` on `request.json()` in keys API** — causes all key creation to fail
2. **VPS restart status race condition** — users see incorrect "running" status during restart
3. **Chat stream missing VPS status validation** — returns generic error instead of actionable guidance

The most common pattern of issues was around async operations that don't properly handle intermediate failure states, leading to data inconsistency between the UI and backend.
