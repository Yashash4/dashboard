# Agent 02 — Starter Dashboard — Backend Developer Review

**Total Issues Found: 21**
- CRITICAL: 3
- HIGH: 6
- MEDIUM: 7
- LOW: 5

---

## CRITICAL

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| ST_B_CRIT_01 | `src/lib/rate-limit.ts:74-82` | **`rateLimit()` never records hits -- rate limiting is completely broken.** The function reads timestamps from the in-memory store but never pushes the current timestamp into it. Every call returns `success: true` because the store is always empty. All 40+ API routes using `rateLimit()` have zero rate limiting protection. | `rateLimit()` calls `getRateLimitStatus()` which reads `store.get(identifier)` but neither function ever calls `store.set()` to record the current request. The `cleanup()` function is also never invoked. |
| ST_B_CRIT_02 | `src/app/api/payments/verify/route.ts:96-129` | **Payment fulfillment is not idempotent -- replaying a verified payment can duplicate subscriptions/agent purchases.** If `fulfill()` succeeds but the response fails to reach the client, retries will re-process. The order status check does not filter by `status: "created"` before fulfilling. | Lines 71-76 fetch the order with `.eq("order_id", orderId).eq("user_id", user.id)` but do not filter by `status: "created"`. A fulfilled order will be found again and processed again. The `payments` insert has no unique constraint on `razorpay_payment_id`. |
| ST_B_CRIT_03 | `src/app/api/vps/restart/route.ts:46-57` | **VPS restart sets status to "running" immediately after calling `restartVM()`, before the VM has actually restarted.** Hostinger's `restartVM()` is async -- the VM takes time to restart. Setting "running" immediately causes SSH operations to fail. | Lines 46-49 set status to "restarting", then line 52 calls `restartVM()`, then line 56 immediately sets status to "running". Compare with `start/route.ts` which correctly sets "starting". |

## HIGH

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| ST_B_HIGH_01 | `src/app/api/chat/stream/route.ts:133-184` | **Streaming response runs DB insert in a detached async IIFE with no error propagation.** If the assistant message insert at line 173 fails, the message is lost silently. | The `(async () => { ... })()` at line 133 runs detached. Catch at line 179 swallows all errors. |
| ST_B_HIGH_02 | `src/app/api/chat/stream/route.ts:24-32` | **No message length validation in streaming chat endpoint.** Unlike `chat/send/route.ts` (10,000 char cap at line 59), the streaming endpoint has no length check. | `chat/send/route.ts:59-64` validates length, `chat/stream/route.ts` does not. |
| ST_B_HIGH_03 | `src/app/api/account/delete/route.ts:66-142` | **Account deletion uses `Promise.allSettled` for cascading deletes -- partial failures leave orphaned data with no notification.** Code continues to delete auth user regardless. | Lines 81-113 and 116-142 use `Promise.allSettled` which ignores rejections. No errors are logged or returned. |
| ST_B_HIGH_04 | `src/app/api/keys/route.ts:55-96` | **API key stats fetch pulls all `agent_analytics` rows into memory instead of using COUNT aggregation.** Three unbounded queries for potentially thousands of rows. | Lines 55-72 fetch all matching rows just to count them. Should use `{ count: "exact", head: true }`. |
| ST_B_HIGH_05 | `src/app/api/cron/apply-pending-changes/route.ts:97-116` | **Cron job reads API keys from `user_api_keys` but doesn't call `decryptField()`.** Either keys are plaintext (security gap) or encrypted (broken). | Line 104: `apiKey: k.api_key` -- no `decryptField()`. Compare with every VPS route that decrypts `ssh_password`. |
| ST_B_HIGH_06 | `src/app/api/vps/logs/stream/route.ts:83-88` | **SSE log stream's 30-minute maxDurationTimer is never cleared on normal close.** Timer fires on already-closed controller. | `maxDurationTimer` at line 83 is not cleared in the channel `close` handler (line 165) or the `cancel()` handler (line 187). |

## MEDIUM

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| ST_B_MED_01 | `src/app/api/chat/conversations/route.ts:31-37` | **Conversations query uses columns (`session_id`, `user_id`, `agent_id`) that don't exist on `chat_messages`.** Based on `chat/send/route.ts`, messages use `conversation_id` only. | Line 33-35: `.select("session_id, content, created_at").eq("user_id", user.id).eq("agent_id", agentId)` -- `chat/send/route.ts` inserts with `conversation_id, role, content` only. |
| ST_B_MED_02 | `src/app/api/vps/password/route.ts:37-41` | **GET endpoint returns decrypted dashboard password in plaintext over the API.** Visible in browser dev tools and network inspectors. | Line 39: `password: vps.dashboard_password ? decryptField(vps.dashboard_password) : null`. |
| ST_B_MED_03 | `src/app/api/webhooks/route.ts:38-41` | **Webhook GET fetches full `secret` from DB, masks it client-side.** Full secret is in server memory unnecessarily. | Line 38: `.select("id, url, secret, events, ...")` fetches the full secret. Should exclude it from SELECT. |
| ST_B_MED_04 | `src/app/api/tickets/attachment/route.ts:122` | **Storing signed URL (1-hour expiry) in DB is pointless -- it expires.** No endpoint to regenerate. | Line 104: `createSignedUrl(fileName, 3600)`. Line 122: stores the ephemeral URL. |
| ST_B_MED_05 | `src/app/api/models/change/route.ts:92-106` | **Billing cycle calculation assumes monthly only.** Annual subscribers' change counters never reset. | Line 97: `cycleStart.setMonth(cycleStart.getMonth() - 1)` -- hardcoded to 1 month. |
| ST_B_MED_06 | `src/app/api/cron/cleanup-tickets/route.ts:17-21` | **Ticket cleanup uses OR condition that can delete recently-resolved tickets.** Should be AND or check `resolved_at` only. | Line 21: `.or(\`resolved_at.lt.${cutoff},updated_at.lt.${cutoff}\`)` -- old `updated_at` can trigger premature deletion. |
| ST_B_MED_07 | `src/lib/idempotency.ts:40-47` | **`storeIdempotency()` silently swallows upsert errors.** Failed cache writes make idempotency ineffective. | Line 47: `.then(() => {}, () => {})`. |

## LOW

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| ST_B_LOW_01 | `src/app/api/vps/scheduled-restart/route.ts:53` | **POST handler does not wrap `request.json()` in try-catch.** Malformed JSON causes unhandled 500. | Line 53: `const body = await request.json()` -- no try-catch. |
| ST_B_LOW_02 | `src/app/api/account/password/route.ts:46-54` | **Password verification creates a full Supabase client instance on every call.** Unnecessary latency/memory. | Lines 46-54: dynamic import + `createClient()` for each request. |
| ST_B_LOW_03 | `src/app/api/chat/send/route.ts:388-393` | **RAG evaluation insert is fire-and-forget with silent error handler.** Analytics data silently lost on failure. | Line 388-393: `.then(() => {}, () => {})` pattern repeated throughout. |
| ST_B_LOW_04 | `src/app/api/webhooks/[id]/route.ts:50` | **Webhook PATCH does not wrap `request.json()` in try-catch.** | Line 50: no try-catch, unlike POST handler. |
| ST_B_LOW_05 | `src/app/api/keys/route.ts:125` | **API key POST does not wrap `request.json()` in try-catch.** | Line 125: no try-catch. PATCH handler properly catches. |
