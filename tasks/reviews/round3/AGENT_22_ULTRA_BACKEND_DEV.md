# Agent 22 — Ultra Tier — Backend Developer Review

**Total Issues Found: 12**
- CRITICAL: 2 / HIGH: 4 / MEDIUM: 4 / LOW: 2

## CRITICAL

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| U-C1 | `src/lib/rate-limit.ts:74-82` | **In-memory rate limiter never records requests — all rate limits are non-functional.** The `rateLimit()` function calls `getRateLimitStatus()` which reads from `store` (a `Map<string, number[]>`), but nothing in the entire file ever pushes timestamps into the store. `store` is always empty, so `remaining` always equals `limit`, and `success` is always `true`. This means every rate limit in the application (V1 API routes, mission control, analytics, keys, payments) is completely unenforced. Ultra users get no protection from abuse, and all tier-based RPM differences are meaningless. | `rateLimit()` at line 74 calls `getRateLimitStatus()` at line 79, which reads `store.get(identifier)` at line 67, but no function ever calls `store.set()` to record a new timestamp. The `cleanup()` function (line 33) and `rateLimitAsync()` (line 92) also never write to `store`. |
| U-C2 | `src/lib/rate-limit.ts:97-101` | **`rateLimitAsync()` pre-check always passes, defeating the DB-backed rate limiter.** Since the in-memory `rateLimit()` always returns `success: true` (due to U-C1), the fast-path pre-check at line 98-101 never short-circuits. However, even if the DB RPC rejects a request, the in-memory fallback on DB error (lines 117-119, 127-129) will also always return success. This means even the "durable" rate limiter degrades to no enforcement on any DB error. | Lines 98-101: `const memResult = rateLimit(...)` always succeeds. Lines 117-119: on RPC error, returns `memResult` (always success). Lines 127-129: on any catch, returns `memResult` (always success). |

## HIGH

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| U-H1 | `src/app/api/keys/route.ts:9,136-148` | **API key limit is hardcoded to 5 for all tiers — Ultra users get the same quota as Pro.** `MAX_ACTIVE_KEYS` is a flat constant of 5. Ultra ($350/mo) and Enterprise users have no additional key capacity over Pro ($129/mo). There is no tier-based differentiation for key limits. | Line 9: `const MAX_ACTIVE_KEYS = 5;` — used at line 143 with no plan-based branching. |
| U-H2 | `src/app/api/keys/route.ts:156-159` | **API key rate limits are not tier-differentiated.** The valid RPM options are hardcoded to `[30, 60, 120, 300]` for all plans. Ultra users cannot set higher rate limits than Pro users. The Enterprise plan description says "25x rate limits" but there is no mechanism to allow higher RPM values for Ultra or Enterprise keys. | Line 156: `const validLimits = [30, 60, 120, 300];` — identical in `src/app/api/keys/[id]/route.ts:109`. |
| U-H3 | `src/app/api/v1/chat/batch/route.ts:60-61` | **Batch concurrent limit is hardcoded to 3 for all tiers.** Ultra users are limited to 3 concurrent batches, the same as Pro. There is no tier-based scaling of batch concurrency despite Ultra being a premium tier. | Line 60: `if (activeBatches && activeBatches.length >= 3)` — no check of `auth.plan`. |
| U-H4 | `src/app/api/v1/chat/route.ts:28-30` | **Chat API does not use plan-aware rate limits.** `validateV1Auth` is called without a `rateLimitOverride`, so the rate limit falls back to `apiKey.rate_limit_per_min || 60` (line 117 of v1-auth.ts). Since key RPM maxes at 300 for all tiers (U-H2), Ultra users cannot get higher throughput than Pro. The `plan` field from auth is extracted but never used for differentiated behavior. | Line 28: `const auth = await validateV1Auth(request);` — no tier-specific override. The `plan` is available in `auth` but unused. |

## MEDIUM

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| U-M1 | `src/app/api/v1/chat/batch/route.ts:41` | **Batch size limit is hardcoded to 50 for all tiers.** Ultra users cannot submit larger batches than Pro users, despite paying almost 3x more. | Line 41: `if (batchRequests.length > 50)` — no tier check. |
| U-M2 | `src/lib/payments/plans.ts:93-97` | **`PLAN_PRICES` omits Enterprise, causing silent lookup failures.** Code that does `PLAN_PRICES["enterprise"]` gets `undefined`. While Ultra is present, any code path handling upgrades from Ultra to Enterprise (or Enterprise billing) will break silently. | Lines 93-97: Only `starter`, `pro`, `ultra` are listed. |
| U-M3 | `src/app/api/payments/verify/route.ts:151-196` | **No `subscription_downgrade` case in payment fulfillment.** The `fulfill()` function handles `subscription_new` and `subscription_upgrade` but has no `subscription_downgrade` case. If a user downgrades from Ultra, no logic revokes Ultra-exclusive features (Mission Control data, higher limits). The subscription record is upserted, but MC data and automation rules persist. | Lines 151-196: `switch(paymentType)` only handles `agent_purchase`, `subscription_new`, `subscription_upgrade`. |
| U-M4 | `src/app/api/mission-control/stream/route.ts:8-27` | **MC stream route duplicates auth/tier logic instead of using `guardMCRoute`.** This route manually checks auth and Ultra tier access (lines 9-27) rather than using the shared `guardMCRoute` helper. This creates a maintenance risk: if `guardMCRoute` is updated (e.g., new security checks), this route won't inherit those changes. | Lines 9-27 manually implement the same auth + plan check pattern that `guardMCRoute` encapsulates. All other MC routes use `guardMCRoute`. |

## LOW

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| U-L1 | `src/app/api/analytics/funnels/route.ts:15-16` | **Analytics routes gate at Pro level, not Ultra.** All analytics routes use `hasAccess(plan, "pro")` which means Pro users get the same analytics as Ultra. This is correct if analytics is a Pro feature, but if any analytics endpoints are meant to be Ultra-exclusive, the gating needs updating. Given the plan descriptions, analytics is in Pro ("Logs Explorer + Analytics"), so this is by design. Noting for completeness. | `hasAccess(plan, "pro")` across all 9 analytics routes. |
| U-L2 | `src/app/api/mission-control/automation-rules/route.ts:48` | **Automation rules limit is hardcoded to 20 for all Ultra/Enterprise users.** No tier-based scaling — Enterprise users with custom needs get the same 20-rule cap as Ultra. | Line 48: `if ((count || 0) >= 20)` — no plan differentiation. |
