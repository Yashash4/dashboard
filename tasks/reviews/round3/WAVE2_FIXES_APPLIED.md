# Wave 2 Fixes Applied

## TASK 6: Payment fulfillment idempotency (ST_B_CRIT_02)
**File:** `src/app/api/payments/verify/route.ts`
**Issue:** The verify endpoint didn't check if an order was already fulfilled. Retries could duplicate subscriptions/agent purchases.
**Fix:** Added status checks after fetching the order: if `status === "fulfilled"`, return success without re-processing. If `status !== "created"`, reject with error. This ensures only fresh orders are fulfilled.
**Lines changed:** ~85-96 (inserted 12 lines after the order lookup)

## TASK 7: VPS restart sets status to "running" immediately (ST_B_CRIT_03)
**File:** `src/app/api/vps/restart/route.ts`
**Issue:** After calling `restartVM()`, the route immediately set status to `"running"` even though the VM takes minutes to restart. This caused SSH operations to fail against a booting VM.
**Fix:** Removed the DB update that set status to `"running"` after `restartVM()`. Status stays at `"restarting"` (set before the call). The webhook now correctly reports `"restarting"`. Frontend polling will detect when VM is actually running.
**Lines changed:** ~51-57 (removed 5 lines, changed webhook status)

## TASK 8: Bulk suspend doesn't actually stop VPS processes (QA-09 / H-02)
**File:** `src/app/api/admin/customers/bulk/route.ts`
**Issue:** Bulk suspend only updated DB status to "stopped" but never SSHed into VPS instances to actually stop OpenClaw processes. VPS continued running and serving traffic.
**Fix:** Added imports for `stopOpenClaw` and `decryptField`. Before updating DB status, now fetches full VPS credentials (ip, ssh_user, ssh_password, ssh_port) and calls `stopOpenClaw()` on each running VPS via `Promise.allSettled`. SSH failures are caught per-VPS so one unreachable VPS doesn't block the rest.
**Lines changed:** Lines 1-6 (added imports), Lines 41-57 (expanded suspend block)

## TASK 9: Provisioning DB save ignores errors (C-02)
**File:** `src/app/api/admin/provision/route.ts`
**Issue:** The DB upsert after successful provisioning didn't check for errors. If DB write failed, the job was marked "success" but no VPS record existed.
**Fix:** Capture `{ error }` from both the update and insert Supabase calls. If either fails, mark the job as failed with a descriptive error message and log an audit event, then return early (don't mark as success).
**Lines changed:** ~294-316 (wrapped DB calls in error checking, added failure path)

## TASK 10: Cron job doesn't decrypt API keys (ST_B_HIGH_05)
**File:** `src/app/api/cron/apply-pending-changes/route.ts`
**Issue:** The cron job read API keys from `user_api_keys` but passed `k.api_key` directly without calling `decryptField()`. Either keys were sent as ciphertext (breaking the config) or stored in plaintext (security gap).
**Fix:** Changed `apiKey: k.api_key` to `apiKey: decryptField(k.api_key)` in the `apiKeys.map()` call. The `decryptField` import already existed in the file (used for SSH password decryption).
**Lines changed:** Line 106 (one line change)

## TASK 11: Data API token not saved to database (C-01)
**Files:** `src/lib/provision-v3.ts`, `src/app/api/admin/provision/route.ts`
**Issue:** The `dataApiToken` generated in `provisionVPS()` was never returned or saved. The Data API was deployed with an auth token that was immediately lost.
**Fix:**
1. In `provision-v3.ts`: Changed return from `{ success: true }` to `{ success: true, dataApiToken }`. Removed stale comment about caller saving the token.
2. In `provision/route.ts`: Added `data_api_token: result.dataApiToken ? encryptField(result.dataApiToken) : null` to the DB record, so the encrypted token is persisted in `vps_instances`.
**Lines changed:** provision-v3.ts line 493 (return value), route.ts line 279 (DB record field)

## Concerns / Manual Verification
- **TASK 8 (bulk suspend):** SSH stops run in parallel with `Promise.allSettled`. If a VPS is unreachable, the DB status is still set to "stopped". This matches the existing pattern where individual suspend also proceeds on SSH failure, but admins should be aware that some VPS instances may still be running if SSH fails.
- **TASK 11 (data API token):** Assumes `vps_instances` table has a `data_api_token` column. If it doesn't exist, the DB write will fail — but Task 9's error handling will now catch that and report it properly.
- **TASK 10 (cron decrypt):** If API keys were previously stored in plaintext (not encrypted), calling `decryptField()` on them could fail or return garbage. Verify that `user_api_keys.api_key` values are actually encrypted in the database.
