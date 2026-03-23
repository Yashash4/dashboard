# Agent 04 — Starter Dashboard — Security Auditor Review

**Total Issues Found: 16**
- CRITICAL: 2
- HIGH: 4
- MEDIUM: 6
- LOW: 4

---

## CRITICAL

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| ST_S_CRIT_01 | `src/lib/rate-limit.ts:74-82` | **In-memory rate limiter never records requests -- all limits are bypassed.** The `rateLimit()` function calls `getRateLimitStatus()` which reads timestamps from the in-memory `store` Map, but neither function ever calls `store.set()` to record the current request. The store is always empty, so `remaining` always equals `limit` and `success` is always `true`. Every API route using `rateLimit()` has zero effective rate limiting. | A04:2021 Insecure Design | `rateLimit()` at line 74 calls `getRateLimitStatus()` at line 60 which does `const timestamps = store.get(identifier) \|\| [];` but no code path ever populates `store`. |
| ST_S_CRIT_02 | `src/lib/ssh.ts:863` | **OS command injection via dashboard password.** `updateDashboardPassword()` embeds user-supplied password into a shell command with only single-quote escaping. Base64 encoding (used elsewhere in ssh.ts) should be used instead. | A03:2021 Injection | Line 863: `` `htpasswd -cb /etc/nginx/.htpasswd '${username.replace(...)}' '${password.replace(...)}'` `` -- password from `src/app/api/vps/password/route.ts:69`. |

## HIGH

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| ST_S_HIGH_01 | `src/lib/ssh.ts:412-414` | **Heredoc delimiter injection in agent deploy.** Native mode writes config files via heredoc with `AGENTEOF` delimiter. If file content contains `AGENTEOF` on its own line, the heredoc terminates early and remaining content executes as shell commands. | A03:2021 Injection | Line 414: `` `cat > ${agentDir}/${safeFilename} << 'AGENTEOF'\n${safeContent}\nAGENTEOF` `` |
| ST_S_HIGH_02 | `src/app/api/webhooks/route.ts:183` | **Webhook secret exposed in creation response.** POST returns `.select("*")` which includes the full `secret`. GET properly masks it. | A01:2021 Broken Access Control | Line 167: `.select("*")` returns all columns including `secret`. |
| ST_S_HIGH_03 | `src/app/api/knowledge-base/url/route.ts:55` | **SSRF via DNS rebinding.** `isPrivateUrl()` checks hostname string only, before DNS resolution. Domains resolving to 127.0.0.1 (e.g., localtest.me) bypass the check. Redirects are followed by default. | A10:2021 SSRF | Line 43: `isPrivateUrl(url)` checks hostname. Line 55: `fetch(url, ...)` follows redirects. |
| ST_S_HIGH_04 | `src/app/api/vps/password/route.ts:71` | **No password complexity requirements.** VPS dashboard password only requires 8 chars minimum. Combined with CRIT_01 (broken rate limiting), brute force is feasible. | A07:2021 Auth Failures | Line 71: `if (!password \|\| password.length < 8)` -- only length check. |

## MEDIUM

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| ST_S_MED_01 | `src/app/api/keys/route.ts:125` | **Missing try/catch on request.json().** Malformed JSON causes unhandled error, potentially leaking stack traces. | A09:2021 Logging Failures | Line 125: `const body = await request.json();` -- no try/catch. |
| ST_S_MED_02 | `src/middleware.ts:33-35` | **Auth bypass when Supabase env vars missing.** All routes become public if env vars are not set. | A05:2021 Security Misconfiguration | `if (!process.env.NEXT_PUBLIC_SUPABASE_URL ...) { return NextResponse.next(); }` |
| ST_S_MED_03 | `src/app/api/webhooks/[id]/route.ts:108-115` | **Unsanitized filter_conditions and transformation stored.** No schema validation, size limits, or depth limits on arbitrary JSON. | A03:2021 Injection | Line 109: `updates.filter_conditions = filter_conditions;` -- no validation. |
| ST_S_MED_04 | `src/app/api/account/password/route.ts:46-62` | **Password verification creates real session.** Sign-out could fail, leaving stale session. Same pattern in account/delete. | A07:2021 Auth Failures | Lines 47-62: Creates client, signs in, signs out -- sign-out can fail. |
| ST_S_MED_05 | `src/app/api/chat/send/route.ts:297` | **SSRF via DB-stored dashboard URL.** `dashboardUrl` from DB is not validated for private IPs at fetch time. | A10:2021 SSRF | Line 297: `fetch(\`${baseUrl}/v1/chat/completions\`)` -- baseUrl from DB. |
| ST_S_MED_06 | `src/app/api/cron/apply-pending-changes/route.ts:143-148` | **SSH error details leaked in cron response.** Full `err.message` from SSH ops included in response. | A04:2021 Insecure Design | Line 148: `status: \`error: ${err.message}\`` |

## LOW

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| ST_S_LOW_01 | `src/app/api/audit-log/route.ts:53-57` | **Partial ilike injection in search.** Escaped value interpolated into PostgREST `.or()` filter syntax. | A03:2021 Injection | Line 55: `query.or(\`action.ilike.%${safe}%,...\`)` |
| ST_S_LOW_02 | `src/app/api/knowledge-base/upload/route.ts:43` | **File extension from user filename.** Only last extension checked; full filename stored in DB. | A03:2021 Injection | Line 43: `fileName.split(".").pop()` |
| ST_S_LOW_03 | `src/app/api/logs/alerts/route.ts:8-20` | **Missing rate limit on GET endpoint.** Unlike POST/DELETE handlers, GET has no rate limiting. | A04:2021 Insecure Design | GET handler has no `rateLimit()` call. |
| ST_S_LOW_04 | `src/app/api/account/avatar/route.ts:85` | **Avatar file extension not validated.** Magic bytes checked but extension could be arbitrary (e.g., `.html`). | A05:2021 Misconfiguration | Line 85: `file.name.split(".").pop()` -- no ext allowlist. |
