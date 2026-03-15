# Security Audit Report -- Pro-Tier API Routes

**Auditor:** Claude Opus 4.6 (Security Review)
**Date:** 2026-03-16
**Scope:** All Pro-tier API routes, supporting libraries, cron jobs

---

## Executive Summary

The Pro-tier API surface is **generally well-defended**. Every dashboard route checks auth + plan; API key hashing, webhook HMAC, and audit log hash chains are correctly implemented. The main findings are:

- **2 HIGH** -- SQL injection via `.ilike()` (2 routes), cron auth bypass
- **3 MEDIUM** -- webhook secret leakage in GET, SIEM credentials stored in plaintext, missing rate limits on select routes
- **4 LOW** -- file processor DoS vectors, incomplete SSRF protection, minor audit chain gaps

No critical RCE or mass data exposure vulnerabilities were found.

---

## 1. Authentication & Authorization on Every Route

**Verdict: PASS (with caveats)**

### Dashboard Routes (session auth)

Every dashboard-facing route follows the pattern:
```
supabase.auth.getUser() -> 401 if null
admin.from("subscriptions").select("plan").eq("user_id", user.id) -> 403 if not Pro+
```

**Routes verified (all PASS):**
- `/api/analytics/usage`, `/funnels`, `/live`, `/intents`
- `/api/knowledge-base` (GET), `/[id]` (DELETE), `/search` (GET)
- `/api/webhooks` (GET, POST), `/[id]` (PATCH, DELETE), `/[id]/test`, `/[id]/deliveries`, `/[id]/deliveries/[deliveryId]/replay`, `/stats`
- `/api/keys` (GET, POST), `/[id]` (DELETE, PATCH)
- `/api/audit-log` (GET), `/verify`, `/export`
- `/api/playground/compare`
- `/api/agents/generate`
- `/api/channels/analytics`
- `/api/auto-responses` (GET, POST, PATCH, DELETE)
- `/api/business-hours` (GET, POST)
- `/api/logs/alerts` (GET, POST, DELETE), `/patterns`, `/saved-views`

### V1 API Routes (API key auth)

All V1 routes validate: `Bearer` header -> `clw_` prefix + length 36 -> SHA-256 hash lookup -> status=active check -> plan in `[pro, ultra, enterprise]`.

**Routes verified (all PASS):**
- `/api/v1/health`, `/models`, `/usage`, `/agents`
- `/api/v1/conversations` (GET), `/[id]/messages` (GET)
- `/api/v1/threads` (GET, POST), `/[id]` (GET, DELETE), `/[id]/messages` (GET, POST)

### Cron Routes

| Route | Auth Method | Verdict |
|-------|------------|---------|
| `/api/cron/apply-pending-changes` | `Bearer CRON_SECRET` | PASS |
| `/api/cron/cleanup-tickets` | `Bearer CRON_SECRET` | PASS |
| `/api/cron/log-alerts` | `Bearer CRON_SECRET` (conditional) | **FINDING [HIGH-01]** |
| `/api/cron/webhook-retry` | **NONE** | **FINDING [HIGH-02]** |
| `/api/cron/mc-recurring` | **NONE** | **FINDING [HIGH-02]** |

#### FINDING [HIGH-01]: Conditional cron auth in log-alerts

**File:** `src/app/api/cron/log-alerts/route.ts:19`
```ts
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
```
If `CRON_SECRET` is unset, the check is **skipped entirely**. The other cron routes (`apply-pending-changes`, `cleanup-tickets`) correctly return 500 when `CRON_SECRET` is missing. This route silently proceeds.

**Impact:** If `CRON_SECRET` is accidentally removed from env, anyone can trigger the log-alerts cron, causing SSH connections to every user's VPS.

**Fix:** Add `if (!process.env.CRON_SECRET) return 500` guard like the other cron routes.

#### FINDING [HIGH-02]: No auth on webhook-retry and mc-recurring crons

**Files:** `src/app/api/cron/webhook-retry/route.ts`, `src/app/api/cron/mc-recurring/route.ts`

These routes have **zero authentication**. Anyone who discovers the URL can:
- Trigger webhook retries (causing outbound HTTP requests to user webhook URLs)
- Create recurring tasks for all users

**Fix:** Add `CRON_SECRET` validation to both routes.

---

## 2. Cross-User Data Access (IDOR)

**Verdict: PASS**

Every query includes `.eq("user_id", user.id)` or `.eq("user_id", apiKey.user_id)` filtering. Specific patterns verified:

- **KB documents:** `GET` filters by `user_id`; `DELETE` uses `.eq("id", id).eq("user_id", user.id)` (ownership check)
- **Webhooks:** All CRUD operations filter by `user_id`. Deliveries query also checks webhook ownership first.
- **API keys:** All operations filter by `user_id`. Revoke/update uses `.eq("user_id", user.id)`.
- **Audit logs:** Filtered by `user_id` in both the main query and the admin query for verification.
- **Auto-responses, business-hours, log alerts, saved-views:** All filter by `user_id`.
- **V1 threads:** Ownership check via `.eq("user_id", apiKey.user_id)`.
- **V1 conversations/messages:** Conversation ownership verified before fetching messages.

No cross-user access vectors found.

---

## 3. API Key Security

**Verdict: PASS**

- **Key generation:** `clw_` + 16 random bytes (hex) = 36 chars total. Strong randomness via `crypto.randomBytes(16)`.
- **Storage:** Only `key_hash` (SHA-256) is stored. The `key_prefix` (first 12 chars) is stored for display.
- **Full key returned once:** POST `/api/keys` returns `full_key` only in the creation response. GET `/api/keys` only returns `id, name, key_prefix, usage_count, last_used_at, status, rate_limit_per_min, created_at` -- full key is never returned after creation.
- **Revocation:** Sets `status: "revoked"`. All V1 routes check `apiKey.status !== "active"`.
- **Limit:** Max 5 active keys per user.

No issues found.

---

## 4. Webhook Secrets

**Verdict: MEDIUM issue with masking**

- **Generation:** `whsec_` + 24 random bytes (hex) = strong secret. Good.
- **HMAC:** `crypto.createHmac("sha256", secret).update(timestamp + "." + body).digest("hex")` -- correct implementation with timestamp binding to prevent replay attacks.

#### FINDING [MED-01]: Webhook secret partially leaked in GET response

**File:** `src/app/api/webhooks/route.ts:48-53`
```ts
secret: w.secret.length > 10
  ? `${w.secret.slice(0, 6)}${"*".repeat(8)}${w.secret.slice(-4)}`
  : "whsec_********",
```

The first 6 characters and last 4 characters of the secret are exposed. For a `whsec_` prefixed secret, this reveals `whsec_` (the known prefix) + the last 4 hex chars. While the last 4 chars alone are not exploitable, this is more information than necessary.

Additionally, the raw `secret` column is **selected from the database** in the GET query (`select("id, url, secret, events, ...")`). The full secret transits through the application layer even though it is masked before the response.

**Fix:** Do not select `secret` in the GET query at all. Show only a fixed mask like `whsec_****...****`.

---

## 5. KB File Upload & Search

**Verdict: PASS (with minor notes)**

### SSRF Protection

`isPrivateUrl()` in `src/lib/knowledge-base.ts` blocks:
- `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `[::1]`
- `.local`, `.internal`, `.localhost` TLDs
- RFC 1918 ranges: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- Link-local: `169.254.x.x`
- Null range: `0.x.x.x`

#### FINDING [LOW-01]: Incomplete SSRF protection

Missing checks for:
- **IPv6 private ranges** (e.g., `fe80::`, `fd00::`, `fc00::`) -- only `::1` is blocked
- **DNS rebinding** -- URL is validated once but DNS could resolve to a private IP at fetch time
- **Cloud metadata endpoints** -- `169.254.169.254` is blocked (falls in 169.254.x.x), but `metadata.google.internal` may not be caught by `.internal` check depending on resolution

The IPv6 gap is the most concrete risk. If a user registers a webhook with an IPv6 private address, the SSRF check would pass.

### File Type Validation

File processors in `src/lib/file-processors.ts` accept DOCX, XLSX, PPTX by extension and MIME type. Unknown types fall back to UTF-8 text. No explicit allowlist enforcement is visible at the route level (the route that handles upload was not in scope, but the processor itself has no size/type rejection).

### Size Limits

Not enforced in the file processor itself. Presumably enforced at the upload route or storage layer (not in scope of this audit).

---

## 6. V1 API -- Key Validation Flow

**Verdict: PASS**

Every V1 route follows the correct flow:
1. Extract `Bearer` token
2. Validate `clw_` prefix and length 36
3. SHA-256 hash and lookup in `api_keys`
4. Check `status === "active"` (revoked keys rejected)
5. Plan check against `subscriptions` table

#### FINDING [LOW-02]: No rate limiting on most V1 read endpoints

Rate limiting is present on:
- `POST /api/v1/threads` (30/min)
- `POST /api/v1/threads/[id]/messages` (per-key RPM)

Rate limiting is **absent** on:
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/[id]/messages`
- `GET /api/v1/health`
- `GET /api/v1/models`
- `GET /api/v1/usage`
- `GET /api/v1/agents`
- `GET /api/v1/threads`
- `GET /api/v1/threads/[id]`
- `GET /api/v1/threads/[id]/messages`

An attacker with a valid API key could enumerate all data via rapid requests. The `rateLimit` import exists in some files but is not used.

**Fix:** Apply per-key rate limiting (e.g., 60-120/min) to all V1 GET endpoints.

---

## 7. Injection Vulnerabilities

### SQL/.ilike() Injection

#### FINDING [HIGH-03]: Unsanitized user input in .ilike() queries

**File 1:** `src/app/api/v1/conversations/route.ts:68`
```ts
.ilike("name", `%${agent}%`);
```
The `agent` query parameter is interpolated directly into the `.ilike()` pattern without sanitization. Supabase's `.ilike()` passes the value as a parameter, so this is **not a SQL injection** in the traditional sense. However, the `%` and `_` wildcard characters in LIKE/ILIKE are **not escaped**, meaning:
- `agent=_` matches any single character
- `agent=%` matches everything

This allows enumeration of all agent names across the system (though the outer query is scoped to the user's conversations).

**File 2:** `src/app/api/knowledge-base/search/route.ts:47`
```ts
.ilike("name", `%${q.trim()}%`)
```
Same pattern. The `q` parameter is trimmed but `%` and `_` are not escaped. Scoped to `user_id`, so no cross-user impact.

**File 3:** `src/app/api/audit-log/route.ts:52-55`
```ts
const safe = search.replace(/[,%().\\/_]/g, "");
query = query.or(`action.ilike.%${safe}%,entity_type.ilike.%${safe}%`);
```
This route **does** sanitize the search input by stripping special characters including `%` and `_`. Good.

**Impact:** Low for KB search (user-scoped). The V1 conversations route is also user-scoped. No cross-user data exposure, but the wildcard issue allows broader matching than intended.

**Fix:** Escape `%` and `_` in user input before passing to `.ilike()`:
```ts
const escaped = agent.replace(/[%_]/g, "\\$&");
```

### Command Injection

No user input reaches SSH commands directly. The `configureApiKeys()` in the cron route uses structured data, not string interpolation. Agent generation sends user input to the LLM, not to any shell.

---

## 8. SIEM Streaming

#### FINDING [MED-02]: SIEM API keys stored in plaintext

**File:** `src/lib/audit-log.ts:99`
```ts
const { data: configs } = await admin
  .from("siem_configs")
  .select("id, destination_type, destination_url, api_key, format")
```

The `api_key` column for SIEM destinations (Datadog, Splunk, etc.) is stored and retrieved as plaintext from Supabase. If the database is compromised, all SIEM API keys are exposed.

**Fix:** Encrypt SIEM API keys at rest using a server-side encryption key (`ENCRYPTION_KEY` env var). Decrypt only at dispatch time.

### Auto-disable on failure

The SIEM streaming function silently catches all errors (`catch { }`) but does **not** disable the config or increment a failure counter. If a SIEM endpoint goes down, the system will silently retry on every audit event forever without notifying the user.

The webhook system correctly auto-disables after 10 consecutive failures, but SIEM does not have this protection.

---

## 9. Webhook Transformations

**Verdict: PASS -- Safe implementation**

**File:** `src/lib/webhook-dispatch.ts:80-102`

The transformation system uses **template substitution only** (`{{event.type}}`, `{{data.fieldname}}`). There is no `eval()`, `new Function()`, or any code execution. The transformation:
1. Replaces `{{event.type}}` and `{{event.timestamp}}` with literal values
2. Replaces `{{data.fieldname}}` with data values (only `\w+` characters in field names)
3. Parses result as JSON to validate
4. Falls back to original payload on any error

The `\w+` regex for field names prevents injection of complex paths. No prototype pollution or code execution vectors found.

---

## 10. Audit Log Integrity

**Verdict: PASS (with gap)**

**File:** `src/lib/audit-hash.ts`

The hash chain is correctly implemented:
- Each entry's hash = SHA-256(id + user_id + action + entity_type + entity_id + category + details + created_at + previous_hash)
- Verification checks both the hash of each entry and the chain link to the previous entry
- Verification endpoint correctly fetches entries in ascending order

#### FINDING [LOW-03]: Hash chain not enforced at write time

The `logAudit()` function in `src/lib/audit-log.ts` does **not** compute or store `entry_hash` or `previous_hash`. It only stores the raw audit fields. The hash chain appears to be computed by a database trigger or a separate process (not visible in the code audited).

If the hashing is done client-side and the insert happens via the admin client (bypassing RLS), there is a window where entries could be inserted without hashes. The verification endpoint tolerates entries without hashes (`if (!entry.entry_hash) continue`), which means injected entries would be silently skipped.

**Fix:** Ensure the hash chain is computed in a database trigger (not client-side) so it cannot be bypassed.

---

## 11. File Processors

**Verdict: PASS (with DoS caution)**

**File:** `src/lib/file-processors.ts`

- **DOCX:** Uses `mammoth` library -- well-maintained, no known arbitrary code execution vulnerabilities
- **XLSX:** Uses `xlsx` library -- parses formulas by default. A malicious XLSX could contain extremely complex formula chains
- **PPTX:** Uses `jszip` + regex XML parsing -- safe, no XML external entity (XXE) risk since it uses regex, not an XML parser

#### FINDING [LOW-04]: No file size guard in processor

The `processFile()` function accepts a `Buffer` with no size check. A very large file (hundreds of MB) could cause memory exhaustion. The XLSX parser in particular can expand compressed data significantly.

**Fix:** Add a size check before processing (e.g., reject buffers > 50MB). Also consider setting `xlsx.read()` options to disable formula parsing.

---

## 12. Rate Limiting

**Verdict: Good coverage, some gaps**

### Dashboard routes -- rate limits present:

| Route | Key | Limit | Window |
|-------|-----|-------|--------|
| analytics/usage | `{uid}:analytics` | 10/min | 60s |
| analytics/funnels | `{uid}:analytics_funnels` | 20/min | 60s |
| analytics/intents | `{uid}:analytics_intents` | 10/min | 60s |
| knowledge-base (list) | `{uid}:kb_list` | 30/min | 60s |
| knowledge-base/[id] (delete) | `{uid}:kb_delete` | 20/min | 60s |
| knowledge-base/search | `{uid}:kb_search` | 20/min | 60s |
| webhooks (list) | `{uid}:webhooks_list` | 20/min | 60s |
| webhooks (create) | `{uid}:webhook_create` | 5/min | 60s |
| webhooks/[id] (update) | `{uid}:webhook_update` | 10/min | 60s |
| webhooks/[id] (delete) | `{uid}:webhook_delete` | 10/min | 60s |
| webhooks/[id]/test | `{uid}:webhook_test` | 5/min | 60s |
| webhooks/[id]/deliveries | `{uid}:webhook_deliveries` | 30/min | 60s |
| webhooks/[id]/.../replay | `{uid}:webhook_replay` | 10/min | 60s |
| webhooks/stats | `{uid}:webhook_stats` | 20/min | 60s |
| keys (list) | `{uid}:keys_list` | 20/min | 60s |
| keys (create) | `{uid}:key_create` | 5/min | 60s |
| keys/[id] (revoke) | `{uid}:key_revoke` | 10/min | 60s |
| keys/[id] (update) | `{uid}:key_update` | 10/min | 60s |
| audit-log | `{uid}:audit_log` | 20/min | 60s |
| audit-log/verify | `{uid}:audit_verify` | 5/min | 60s |
| audit-log/export | `{uid}:audit_export` | 3/min | 60s |
| playground/compare | `{uid}:playground` | 10/min | 60s |
| agents/generate | `{uid}:agent_generate` | 5/min | 60s |
| channels/analytics | `{uid}:channel_analytics` | 20/min | 60s |
| auto-responses (CRUD) | Various | 10-20/min | 60s |
| business-hours (POST) | `{uid}:biz_hours` | 10/min | 60s |
| logs/* | Various | 10/min | 60s |

### Missing rate limits:

| Route | Risk |
|-------|------|
| `GET /api/analytics/live` | Polled every 5s; no rate limit |
| `GET /api/business-hours` | Read-only, low risk |
| `GET /api/logs/alerts` (GET) | Read-only, low risk |
| `DELETE /api/logs/alerts` | No rate limit, could be abused |
| `DELETE /api/logs/saved-views` | No rate limit |
| All V1 GET endpoints | See Finding [LOW-02] |

### In-memory rate limiter limitations

The rate limiter in `src/lib/rate-limit.ts` is in-memory with a sliding window. This means:
- **Serverless cold starts** reset the counter (Vercel functions)
- **Multiple instances** do not share state
- In practice, limits are approximate, not strict

This is acceptable for a dashboard application but should be documented.

---

## 13. Agent Builder

**Verdict: PASS**

**File:** `src/app/api/agents/generate/route.ts`

- User description is length-validated (10-5000 chars)
- Description is passed as a user message to the LLM, not interpolated into any system command
- The system prompt is hardcoded (not user-controllable)
- Generated output is parsed as JSON with validation of required fields
- No code execution of the generated config occurs server-side

**Prompt injection risk:** A user could craft a description that manipulates the LLM to produce unexpected config (e.g., enabling all tools). However, the generated config is returned to the user for review, not auto-deployed. The user can already set any config they want manually, so this is not an escalation.

---

## Summary of Findings

| ID | Severity | Finding | Location |
|----|----------|---------|----------|
| HIGH-01 | **HIGH** | Conditional cron auth bypass when CRON_SECRET is unset | `cron/log-alerts/route.ts:19` |
| HIGH-02 | **HIGH** | No auth on webhook-retry and mc-recurring crons | `cron/webhook-retry/route.ts`, `cron/mc-recurring/route.ts` |
| HIGH-03 | **HIGH** | Unescaped LIKE wildcards in .ilike() | `v1/conversations/route.ts:68`, `knowledge-base/search/route.ts:47` |
| MED-01 | **MEDIUM** | Webhook secret partially exposed in GET + full secret selected from DB | `webhooks/route.ts:37-53` |
| MED-02 | **MEDIUM** | SIEM API keys stored in plaintext, no auto-disable on failure | `lib/audit-log.ts:99` |
| MED-03 | **MEDIUM** | Most V1 GET routes lack rate limiting | Multiple V1 route files |
| LOW-01 | **LOW** | SSRF check missing IPv6 private ranges | `lib/knowledge-base.ts:28-55` |
| LOW-02 | **LOW** | No rate limiting on V1 read endpoints | Multiple V1 files |
| LOW-03 | **LOW** | Audit hash chain not enforced at write time in application code | `lib/audit-log.ts` |
| LOW-04 | **LOW** | No file size guard in processFile() | `lib/file-processors.ts:11` |

---

## Recommended Priority

1. **Immediate (this sprint):** HIGH-01, HIGH-02 -- add CRON_SECRET checks to all cron routes
2. **This sprint:** MED-01 -- stop selecting `secret` column in webhook GET
3. **Next sprint:** HIGH-03 -- escape LIKE wildcards; MED-02 -- encrypt SIEM keys; MED-03 -- add V1 rate limits
4. **Backlog:** LOW-01 through LOW-04
