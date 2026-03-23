# Wave 1 + Wave 2 — Verification Report

**Date:** 2026-03-22
**Verified by:** Claude (post-agent code review)

---

## Wave 1 — Security Fixes (5/5 verified)

### 1. Rate limiter (`src/lib/rate-limit.ts:74-93`)
- **Status:** FIXED
- `rateLimit()` now pushes `Date.now()` on success, calls `store.set()`, and runs `cleanup()`
- Only records hits when `success: true` (denied requests don't waste quota)
- `rateLimitAsync()` also benefits since it calls `rateLimit()` as pre-check

### 2. Payment validation (`src/app/api/payments/create-order/route.ts:47-62`)
- **Status:** FIXED
- Imports `PLAN_PRICES`, validates amount for `subscription_new` and `subscription_upgrade`
- Rejects mismatched amounts with 400
- **Note:** `agent_purchase` type NOT validated — future fix if agents have fixed prices

### 3. SSH injection (`src/lib/ssh.ts:861-866`)
- **Status:** FIXED
- Base64 encoding replaces single-quote escaping
- Matches pattern used by `deployAgent()`, `configureApiKeys()`

### 4. Env template (`.env.local.template`)
- **Status:** FIXED
- Real JWT replaced with placeholders
- **Action needed:** Rotate Supabase anon key if repo was ever public/shared

### 5. Debug files
- **Status:** FIXED — all 3 deleted, confirmed gone

---

## Wave 2 — Money/Data Fixes (6/6 verified)

### 6. Payment idempotency (`src/app/api/payments/verify/route.ts:85-96`)
- **Status:** FIXED
- `status === "fulfilled"` → returns success without re-processing
- `status !== "created"` → rejects with error
- Prevents duplicate subscriptions on retry

### 7. VPS restart status (`src/app/api/vps/restart/route.ts`)
- **Status:** FIXED
- Removed immediate `status: "running"` update after `restartVM()`
- Status stays at `"restarting"`, frontend polling detects actual state
- Webhook now reports `"restarting"` instead of `"running"`

### 8. Bulk suspend (`src/app/api/admin/customers/bulk/route.ts:42-57`)
- **Status:** FIXED
- Imports `stopOpenClaw` + `decryptField`
- Fetches VPS credentials, calls `stopOpenClaw()` via `Promise.allSettled`
- Per-VPS error handling (one unreachable VPS doesn't block others)
- **Note:** If SSH fails, DB still shows "stopped" — admin should be aware

### 9. Provisioning DB save (`src/app/api/admin/provision/route.ts:~294-316`)
- **Status:** FIXED
- Checks `.error` on Supabase upsert/insert
- On failure: marks job as failed, logs audit event

### 10. Cron API key decryption (`src/app/api/cron/apply-pending-changes/route.ts:106`)
- **Status:** FIXED
- `k.api_key` → `decryptField(k.api_key)`
- **Note:** Verify that `user_api_keys.api_key` values are actually encrypted in DB

### 11. Provisioning token saved (`src/lib/provision-v3.ts` + `provision/route.ts:279`)
- **Status:** FIXED
- `provisionVPS()` now returns `dataApiToken` in result
- Route saves `data_api_token: encryptField(result.dataApiToken)` to DB
- **Note:** Requires `data_api_token` column in `vps_instances` table

---

## Summary

| Wave | Tasks | All Verified |
|------|-------|-------------|
| Wave 1 | 5 security fixes | YES |
| Wave 2 | 6 money/data fixes | YES |
| **Total** | **11 fixes** | **All clean** |

## Items needing manual attention:
1. Rotate Supabase anon key if repo was ever shared externally
2. Verify `user_api_keys.api_key` values are encrypted in DB (for cron fix)
3. Verify `vps_instances` table has `data_api_token` column (for provisioning fix)
4. Consider adding `agent_purchase` price validation in `create-order` route
