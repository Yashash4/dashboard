# Wave 1 — Critical Security Fixes Applied

Date: 2026-03-22

---

## Task 1: Rate Limiter Fix

**File:** `src/lib/rate-limit.ts` (lines 74-93)
**Issue:** `rateLimit()` never recorded hits — it read from the in-memory store but never wrote timestamps. Every call returned `success: true`, making all 40+ API routes unprotected.
**Fix:** Replaced the body of `rateLimit()` to: (1) call `cleanup(windowMs)` to prune stale entries, (2) filter valid timestamps from the store, (3) check if under limit, (4) push `Date.now()` to timestamps if allowed, (5) call `store.set()` to persist. The `rateLimitAsync()` DB-backed version also benefits since it calls `rateLimit()` as a pre-check.
**Lines changed:** 74-93 (was 74-82)

**Review IDs resolved:** ST_B_CRIT_01, ST_S_CRIT_01, C-01, C2

---

## Task 2: Payment Amount Validation

**File:** `src/app/api/payments/create-order/route.ts` (lines 7, 47-62)
**Issue:** Client-provided `amount` and `metadata.plan` were stored as-is. A user could create an order for $1 with `metadata: { plan: "ultra" }`, pay $1, and get Ultra activated.
**Fix:** Added import of `PLAN_PRICES` from `src/lib/payments/plans.ts`. For `subscription_new` and `subscription_upgrade` payment types, the server now: (1) validates that `metadata.plan` exists and is a known plan, (2) looks up the correct price from `PLAN_PRICES` based on billing cycle (monthly/annual), (3) rejects the request with 400 if the amount does not match the expected price.
**Lines changed:** Line 7 (added import), lines 47-62 (added validation block)

**Review IDs resolved:** C-02

---

## Task 3: SSH Command Injection Fix

**File:** `src/lib/ssh.ts` (lines 861-866)
**Issue:** `updateDashboardPassword()` embedded user-supplied password into a shell command with only single-quote escaping, which is insufficient against crafted payloads.
**Fix:** Replaced shell string interpolation with base64 encoding, matching the pattern used by `deployAgent()`, `configureApiKeys()`, and other functions in the same file. Username and password are encoded server-side with `Buffer.from().toString("base64")` and decoded on the remote host with `base64 -d` inside command substitution.
**Lines changed:** 861-866 (was 862-864)

**Review IDs resolved:** ST_S_CRIT_02

---

## Task 4: Env Template Credential Removal

**File:** `.env.local.template` (lines 5-6)
**Issue:** The git-tracked template contained the real Supabase project URL and a real anon key JWT.
**Fix:** Replaced with placeholder values: `https://your-project-ref.supabase.co` and `your-supabase-anon-key-here`.
**Lines changed:** Lines 5-6

**Review IDs resolved:** C1

**Note:** The real key is still in git history. Consider rotating the Supabase anon key if this repo has ever been shared externally.

---

## Task 5: Debug File Cleanup

**Files deleted:** `provision_route_backup.txt`, `test_write.txt`, `x.txt`
**Issue:** Stray debug/backup files in the project root containing source code and test data. Risk of accidental commit or deployment.
**Fix:** Deleted all three files.

**Review IDs resolved:** C3

---

## Verification Notes

- The rate limiter fix records hits even when the request is denied (the timestamp is only pushed when `success` is true), so denied requests don't count against the window.
- Payment validation only applies to subscription types (`subscription_new`, `subscription_upgrade`). The `agent_purchase` type is not validated here — if agent purchases have fixed prices, a similar check should be added.
- The SSH base64 fix uses single-quoted base64 strings in the shell command, which is safe because base64 output contains only `[A-Za-z0-9+/=]` characters.
- The `enterprise` plan is not in `PLAN_PRICES` (it has `contactUs: true`), so enterprise orders via this endpoint will be rejected. This is correct — enterprise should go through a separate flow.
