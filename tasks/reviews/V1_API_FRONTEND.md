# V1 API Frontend Review

**Scope:** API Access UI components -- interactive docs, playground, key management, code examples, streaming demo, rate limit display, responsiveness, accessibility.

**Files reviewed:**
- `dashboard/src/components/dashboard/api-access-manager.tsx`
- `dashboard/src/components/dashboard/api-playground.tsx`
- `dashboard/src/components/dashboard/model-playground.tsx`
- `dashboard/src/components/docs/api-docs.tsx`
- `dashboard/src/components/docs/code-block.tsx`
- `dashboard/src/components/docs/docs-sidebar.tsx`
- `dashboard/src/app/dashboard/api-access/page.tsx`
- `dashboard/src/app/dashboard/api-access/tabs.tsx`
- `dashboard/src/app/api/keys/route.ts`
- `dashboard/src/app/api/keys/[id]/route.ts`
- `dashboard/src/app/api/v1/chat/route.ts`
- `dashboard/src/app/api/v1/health/route.ts`
- `dashboard/src/app/api/v1/conversations/route.ts`
- `dashboard/src/app/api/v1/conversations/[id]/messages/route.ts`

---

## Summary

The API Access UI is well-structured, cleanly split into a "Keys & Examples" tab (ApiAccessManager) and an "API Docs & Playground" tab (ApiPlayground). Key management, code examples, streaming, and interactive testing are all present. The standalone docs page (api-docs.tsx) is comprehensive and polished. There are a handful of functional issues, a moderate accessibility gap, and a few UX improvements worth making.

---

## 1. Playground ("Try it Live")

### Working correctly
- Sends live requests to `/api/v1/chat` with message, optional agent, and stream toggle.
- Streaming mode reads the SSE body, accumulates content, and displays result with elapsed time.
- Non-streaming mode shows status code and full JSON response.
- Error handling wraps the entire request in try/catch and renders error JSON.
- Keyboard shortcut: Enter in the message field fires the request.

### Issues

**P2 -- Playground sends to `/api/v1/chat` without an API key.** The comment on line 161 says "Use the dashboard session (cookie auth) for the try-it feature by calling chat/send instead of v1/chat (which needs API key)," but the code actually calls `/api/v1/chat`. The v1/chat route requires a Bearer API key header, not cookie auth. The playground will always get a 401 back. Either the playground should call an internal route (e.g., `/api/chat/send`) that uses cookie auth, or it should let the user pick one of their API keys from the dropdown it already fetches (`activeKeys` is loaded but never used in the UI).

**P3 -- Stream parsing does not update UI incrementally.** The streaming handler reads all chunks into `streamedContent` and only calls `setTryResult` once after the stream completes (line 193). The user sees nothing until the full stream finishes. For a streaming demo, the result should update progressively as chunks arrive to actually demonstrate the streaming behavior.

**P3 -- `activeKeys` fetched but unused.** The playground queries api-keys (line 128-135) and derives `activeKeys`, but it is never rendered or selectable. This is dead data fetching. Either remove it or add a key selector dropdown.

---

## 2. Code Examples (ApiAccessManager)

### Working correctly
- Three endpoint sections (Chat, Health, Conversations) each with four language tabs (cURL, Python, JavaScript, PowerShell).
- Dynamic endpoint URL built from `window.location.origin`.
- Copy button per code block with visual confirmation.
- Agent parameter docs section at the bottom explains `agent`, `session_id`, and how to list agents.

### Issues

**P3 -- JavaScript streaming example uses `process.stdout.write`.** Line 149 of the JS code example calls `process.stdout.write(content)`, which is Node.js-only. Since many users will try this in a browser, the example should use `document.body.innerText +=` or `console.log` instead, or label the example explicitly as "Node.js."

**P4 -- Python streaming example: `line.startswith(b"data: ")` is correct but fragile.** The `iter_lines()` call returns bytes by default. This works, but it would be cleaner to pass `decode_unicode=True` so string methods work naturally. Minor style issue.

**P4 -- Conversations Python example uses f-string with `$` prefix.** Line 208: `f"${baseUrl}/api/v1/conversations/..."` -- the `$` is a JavaScript template literal artifact. In the rendered code it will show a literal `$` in the URL. It should be `f"{baseUrl}/api/v1/..."` (no dollar sign). Same issue on line 209 in the conversations JS example at line 219 (`\`${baseUrl}...`), which is correct for JS but the Python one is wrong.

---

## 3. Key Creation / Revocation UI

### Working correctly
- Create dialog with name input and rate limit selector (30/60/120/300 RPM).
- Shows full key once after creation with show/hide toggle and copy button.
- Warning message: "Copy your key now. You won't be able to see it again."
- Keyboard shortcut: Enter in the name field fires creation.
- 5-key limit enforced both client-side (button disabled at `activeCount >= 5`) and server-side.
- Revocation uses AlertDialog with confirmation ("Any applications using this key will stop working").
- Dialog state resets properly on close (key name, rate limit, full key cleared).
- React Query cache invalidated on create/revoke/update for instant list refresh.
- Loading skeletons displayed during initial fetch.
- Error state with retry button if key fetch fails.
- Empty state with icon and prompt if no keys exist.

### Issues

**P4 -- Revoke button has no loading state.** When `revokeMutation.mutate(key.id)` is called (line 669), the AlertDialogAction does not disable itself or show a spinner. If the network is slow, the user can click multiple times or close the dialog prematurely. Minor, since the backend is idempotent (revoke on already-revoked returns 404), but the UX could be tighter.

**P4 -- Create key dialog: the "Create Key" button should be disabled while `isPending` but isn't disabled when `keyName` is only whitespace.** Actually, looking again, it is: `disabled={!keyName.trim() || createMutation.isPending}`. This is fine. No issue here.

---

## 4. Rate Limit Display

### Working correctly
- Each active key shows its RPM with a gauge icon and inline edit pencil.
- Clicking opens an inline `<Select>` that triggers `updateRateLimitMutation` on value change.
- Valid limits (30, 60, 120, 300) enforced both client and server.
- PATCH `/api/keys/[id]` validates the limit value server-side.
- Per-key usage stats displayed: today count, week count, error count (red).
- Rate limit in API responses: `Retry-After: 60` header on 429.

### Issues

**P3 -- Inline rate limit edit does not have a cancel/close mechanism.** Once you click the rate limit badge and the `<Select>` appears, there is no way to dismiss it without changing the value. Clicking elsewhere does not close it (the state `editRateLimitId` stays set). The `onValueChange` immediately fires the mutation. Adding `onOpenChange` or a click-outside handler to reset `editRateLimitId` to null would fix this.

**P4 -- Rate limit docs inconsistency.** The `api-docs.tsx` rate limits table says "Custom limits: Contact support," but the dashboard UI allows users to change rate limits themselves via the inline edit (30/60/120/300 RPM). The docs should mention the self-service options.

---

## 5. Streaming Demo

### Working correctly
- The `/api/v1/chat` route supports `stream: true`, returning SSE with `text/event-stream` content type.
- Server-side strips OpenClaw's `choices[0].delta.content` format into simplified `{ content }` payloads.
- `data: [DONE]` terminator is forwarded correctly.
- The playground has a "Stream response" checkbox toggle.
- Code examples in all four languages show streaming usage for the chat endpoint.

### Issues

**P2 -- Streaming response missing `X-Request-Id` header.** The non-streaming path sets `X-Request-Id` and optionally `X-Client-Request-Id` (lines 403-404), but the streaming path (line 352-358) returns a bare `Response` without these headers. This breaks request traceability for streaming calls.

**P3 -- Streaming analytics may double-count.** In the streaming branch, the `finally` block (line 327) calls both `increment_api_key_usage` and inserts into `agent_analytics`. The non-streaming branch does the same. This is correct structurally, but if the stream is aborted mid-read (client disconnects), the `finally` block still fires and records a success metric. Consider checking whether the stream was fully consumed vs. aborted.

---

## 6. Responsiveness

### Working correctly
- The main API Access page uses standard Card components that fill available width.
- Code examples use `overflow-x-auto` for horizontal scrolling on small screens.
- The docs page (api-docs.tsx) has a responsive sidebar: hidden on mobile with a Sheet/drawer toggle, fixed on `lg:` breakpoint.
- The playground "Try it" form uses `grid grid-cols-2 gap-3` for the message/agent inputs.
- Key list items use `flex items-center justify-between` which wraps naturally.

### Issues

**P2 -- Playground form `grid-cols-2` does not collapse on mobile.** The message and agent inputs (line 315) are in a fixed 2-column grid with no responsive breakpoint. On narrow screens (< 640px), the two columns will be cramped. Should be `grid-cols-1 sm:grid-cols-2`.

**P3 -- Key list row layout breaks on narrow screens.** Each key row (line 537-676) is a flex row with the key info on the left and actions (rate limit edit, status badge, revoke button) on the right. On narrow screens, the right side actions will overlap or overflow. The row should wrap or stack on small screens.

**P3 -- Endpoint info badges + code blocks do not stack on mobile.** The endpoint listing (lines 362-378) uses `flex items-center gap-2` with no wrapping. The POST/GET badges and long code paths will clip on very narrow screens. Adding `flex-wrap` would help.

---

## 7. Accessibility

### Critical gaps

**P1 -- Zero ARIA attributes in ApiAccessManager and ApiPlayground.** Neither component uses `aria-label`, `aria-describedby`, `role`, or `sr-only` text anywhere. The shadcn Dialog/AlertDialog components provide some built-in accessibility (focus trapping, Escape to close), but the custom UI elements have none.

Specific items that need ARIA treatment:
- The show/hide key toggle button (line 421-430) has no `aria-label`. Screen readers will announce nothing meaningful for the Eye/EyeOff icon button.
- The copy buttons throughout have no `aria-label`. They are icon-only buttons.
- The rate limit edit button (line 617-628) is a raw `<button>` with no accessible label. The `title` attribute is present ("Click to edit rate limit"), which is something, but `aria-label` is preferred.
- The key status badges ("active"/"revoked") are visual-only with color coding. Screen readers will read the text which is fine, but the color semantics are lost.
- The playground "Stream response" checkbox uses a raw `<input type="checkbox">` without an associated `<label>` via `htmlFor`/`id` pairing. The label wraps it, which provides implicit association, so this is actually OK.

**P2 -- Code example blocks have no accessible label.** The `<pre>` blocks (line 712) have no `aria-label` or `role="region"` to indicate what code section they contain. The tab structure helps sighted users, but screen reader users navigating directly to the code block get no context.

**P3 -- Docs sidebar navigation buttons lack `aria-current`.** The sidebar buttons in docs-sidebar.tsx (line 91-102) show the active section visually but do not set `aria-current="true"` on the active item.

---

## 8. Standalone API Docs Page (api-docs.tsx)

### Working correctly
- Comprehensive 11-section reference covering Introduction, Quick Start, Authentication, Chat Endpoint, Sessions, Knowledge Base, Errors, Rate Limits, API Keys, Code Examples, SDKs.
- Proper section heading hierarchy with numbered markers.
- Intersection Observer for active sidebar tracking.
- Mobile sidebar via Sheet component.
- Code examples with syntax-appropriate copy buttons.
- Full error code reference with example error messages.
- Security best practices section.
- Cross-links to Webhooks and Knowledge Base docs.

### Issues

**P3 -- Hardcoded BASE_URL.** Line 29: `const BASE_URL = "https://app.clawhq.tech/api"`. This means the docs page always shows `app.clawhq.tech` URLs even if the user is on a different hostname or local dev. The ApiAccessManager correctly uses `window.location.origin` -- the docs page should do the same, or accept it as a prop.

**P4 -- "stream" parameter not documented in the docs page.** The `api-docs.tsx` Chat Endpoint section (Section 4, lines 416-441) documents `message`, `agent`, and `session_id` but omits the `stream` parameter. The code examples in `api-access-manager.tsx` do show streaming usage, but the formal docs page does not mention it as a parameter. This is a content gap since streaming is a real, functional feature of the API.

**P4 -- Conversations and messages endpoints not in docs page.** The `/api/v1/conversations` and `/api/v1/conversations/:id/messages` endpoints are shown in the playground (ApiPlayground ENDPOINTS array) and in the code examples, but the formal docs page (api-docs.tsx) does not have sections for them.

---

## 9. Additional Observations

**P4 -- `hostname` prop passed but unused in ApiAccessManager.** The page component fetches `vps.hostname` and passes it as `hostname` to `ApiAccessTabs` -> `ApiAccessManager`, but `ApiAccessManager` never reads it. The endpoint URL is built from `window.location.origin` instead. Either remove the prop or use it.

**P4 -- No syntax highlighting in code blocks.** Both the inline code examples in `api-access-manager.tsx` and the `CodeBlock` component in docs use plain `<pre><code>` with monospace green/white text. There is no syntax highlighting (e.g., Prism, Shiki). This is a polish item, not a bug.

**P4 -- Model playground (model-playground.tsx) has a `startMs` scope issue.** Line 108: `setElapsedMs(Date.now() - startMs)` in the `finally` block references `startMs` from line 73, but this is in the same closure so it works. However, the `finally` block clears the interval and then reads `startMs` -- this is fine, no actual issue.

---

## Issue Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P1       | 1     | No ARIA attributes on interactive elements (icon buttons, toggle, edit control) |
| P2       | 3     | Playground sends to auth-required endpoint without key; streaming response missing X-Request-Id; playground grid does not collapse on mobile |
| P3       | 6     | Stream UI not progressive; rate limit edit has no cancel; key list overflow on narrow; endpoint badges clip on mobile; hardcoded BASE_URL in docs; sidebar lacks aria-current |
| P4       | 6     | JS streaming example uses Node API; Python code example dollar-sign bug; revoke button no spinner; docs missing stream param; unused hostname prop; no syntax highlighting |

---

## Recommended Priority Actions

1. Fix the playground to either use cookie-auth route or add an API key selector (P2).
2. Add `aria-label` to all icon-only buttons throughout both components (P1).
3. Add responsive breakpoint (`grid-cols-1 sm:grid-cols-2`) to the playground form (P2).
4. Add `X-Request-Id` to the streaming response headers (P2).
5. Make streaming demo update the result incrementally as chunks arrive (P3).
6. Add `stream` parameter to the formal docs page parameter table (P4).
