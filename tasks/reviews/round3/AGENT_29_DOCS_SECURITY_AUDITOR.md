# Agent 29 — Docs — Security Auditor Review

**Total Issues Found: 14**
- CRITICAL: 1 / HIGH: 4 / MEDIUM: 5 / LOW: 4

---

## CRITICAL

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| C1 | `src/components/docs/knowledge-base-docs.tsx:31-46` | Docs instruct users to pass raw session cookies in cURL commands (`-H "Cookie: <your_session_cookie>"`). This teaches users to extract and manually handle session tokens, which encourages insecure cookie handling practices and increases risk of session token leakage through shell history, shared scripts, and logs. The Knowledge Base, Webhooks, and API Key management docs all use this pattern. | A07:2021 Identification and Authentication Failures | `const CURL_UPLOAD = \`curl -X POST ... -H "Cookie: <your_session_cookie>" ...\``; repeated in `webhooks-docs.tsx:101,110,472,502` and `knowledge-base-docs.tsx:31,35,40,43,46` |

---

## HIGH

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| H1 | `src/app/docs/vps/page.tsx:90-93` | VPS docs disclose internal service ports (18789, 443, 5555, 5556) and service names. This gives attackers a reconnaissance advantage — knowing exact ports and service names for the OpenClaw Gateway, Embeddings service, and Data API makes targeted attacks easier. Port 5555 and 5556 are internal services that should not be publicly documented. | A01:2021 Broken Access Control (Information Disclosure) | `<li><strong>ClawHQ Embeddings (port 5555)</strong>`, `<li><strong>ClawHQ Data API (port 5556)</strong> — The internal data API that powers analytics, logging, and inter-service communication.</li>` |
| H2 | `src/app/docs/api/auth/page.tsx:27-30` | API key format is fully documented including exact prefix (`clw_`), exact length (36 chars), and character set. While the prefix is useful for secret scanners, disclosing the exact length and character set reduces the brute-force search space. An attacker knows they need exactly 32 alphanumeric characters after the prefix. | A07:2021 Identification and Authentication Failures | `<li><strong>Prefix:</strong> All keys begin with <code>clw_</code></li>`, `<li><strong>Length:</strong> 36 characters total`, `<li><strong>Character set:</strong> Alphanumeric characters (a-z, 0-9)</li>` |
| H3 | `src/lib/rate-limit.ts:74-82` | Rate limiter used by V1 API auth (`v1-auth.ts:121`) uses in-memory store only (synchronous `rateLimit()`) — not the durable `rateLimitAsync()`. The code comments explicitly warn that "On serverless platforms each cold start resets the in-memory Map, so this alone cannot enforce hard limits." The docs at `rate-limits/page.tsx` describe rate limiting as if it is robust, but the implementation can be bypassed by triggering cold starts. This is a docs-vs-implementation mismatch that misleads users about their security posture. | A04:2021 Insecure Design | `v1-auth.ts:121`: `const rl = rateLimit(identifier, rpm, 60_000);` uses synchronous in-memory-only function. Comment in `rate-limit.ts:54-56`: "Prefer rateLimitAsync() for security-critical paths" |
| H4 | `src/components/docs/webhooks-docs.tsx:76` | Webhook verification Python example contains a hardcoded example secret `whsec_your_secret_here` that is assigned to a variable name (`WEBHOOK_SECRET`) suggesting it should be replaced but is easy to copy-paste as-is. Unlike the API key examples which use obvious placeholder format `clw_your_api_key_here`, this looks like a plausible secret value. | A07:2021 Identification and Authentication Failures | `WEBHOOK_SECRET = "whsec_your_secret_here"` — should use environment variable pattern like `os.environ["WEBHOOK_SECRET"]` |

---

## MEDIUM

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| M1 | `src/app/docs/getting-started/page.tsx:23` | Registration URL is shown without HTTPS protocol prefix: `clawhq.tech/register`. Users who type this directly into a browser address bar may initially connect over HTTP before redirect. Should be `https://clawhq.tech/register`. | A02:2021 Cryptographic Failures | `<strong>clawhq.tech/register</strong> and create your account` |
| M2 | `src/app/docs/api/auth/page.tsx:109` | JavaScript code example stores API key in a `const` variable at module scope: `const API_KEY = "clw_your_api_key_here"`. This pattern is repeated across all JS examples in chat, agents, models, and rate-limits docs. While the security best practices section says "Never expose API keys in client-side code", the JS examples use `fetch()` which works in browsers, suggesting client-side use. The examples should use `process.env.API_KEY` or equivalent to model secure patterns. | A07:2021 Identification and Authentication Failures | `const API_KEY = "clw_your_api_key_here";` repeated in auth:109, chat:209, agents:179, models:155, rate-limits:171 |
| M3 | `src/app/docs/api/auth/page.tsx:90-106` | Python code examples hardcode API key as a string variable `API_KEY = "clw_your_api_key_here"` instead of reading from environment variables. The best practices section recommends environment variables, but none of the code examples demonstrate this pattern. Users are more likely to copy code examples than read best practices text. | A07:2021 Identification and Authentication Failures | `API_KEY = "clw_your_api_key_here"` — should be `API_KEY = os.environ["CLAWHQ_API_KEY"]` |
| M4 | `src/app/docs/account/page.tsx:116` | Password policy documented as "at least 8 characters" with a suggestion to "use a mix of uppercase, lowercase, numbers, and symbols". The actual implementation (`register/page.tsx:27`, `account-settings.tsx:76`) only enforces min 8 chars with no complexity requirements. The docs make it sound like there are complexity requirements when there are none — this is misleading security guidance. | A07:2021 Identification and Authentication Failures | `<strong>New Password</strong> — Must be at least 8 characters. Use a mix of uppercase, lowercase, numbers, and symbols for maximum security.` — but actual validation is just `password.length < 8` |
| M5 | `src/app/docs/pro/webhooks/page.tsx:137-159` | The webhook HMAC verification docs describe a different signature scheme than the code examples in `webhooks-docs.tsx`. The prose says to compute HMAC of "the raw body" using the secret, but `webhooks-docs.tsx:46` shows `timestamp + "." + body` as the signed payload. Inconsistent signature verification guidance could lead to incorrect implementations that appear to work but fail to prevent replay attacks. | A02:2021 Cryptographic Failures | `pro/webhooks/page.tsx:152`: "Compute the HMAC-SHA256 hash of the raw body" vs `webhooks-docs.tsx:46`: `.update(\`\${timestamp}.\${body}\`)` which includes timestamp |

---

## LOW

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| L1 | `src/app/docs/api/auth/page.tsx:32` | Example API key `clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` is used as an example across auth and pro/api docs. While clearly a placeholder, it matches the documented format (36 chars, `clw_` prefix, alphanumeric). If any secret scanner or CI/CD pipeline is configured to detect the `clw_` prefix pattern, this will generate false positives. | A07:2021 Identification and Authentication Failures | `clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` in `auth/page.tsx:32` and `pro/api/page.tsx:31` |
| L2 | `src/app/docs/vps/page.tsx:172-176` | Docs state the OpenClaw dashboard uses HTTP basic authentication. Basic auth transmits credentials in base64 (not encrypted) on every request. While HTTPS provides transport encryption, basic auth is a weak authentication mechanism compared to token-based auth. The docs normalize this without warning about its limitations. | A07:2021 Identification and Authentication Failures | "Your OpenClaw dashboard is protected by HTTP basic authentication." |
| L3 | `src/app/docs/api/auth/page.tsx:73` | Auth docs reveal the internal hashing algorithm: "The key is hashed using SHA-256 and compared against stored hashes in the database. Raw keys are never stored." While transparency is good, disclosing the exact hashing algorithm helps attackers plan precomputation attacks if the database is ever compromised. SHA-256 without salting would be vulnerable. | A02:2021 Cryptographic Failures | `<li><strong>Hash lookup</strong> — The key is hashed using SHA-256 and compared against stored hashes` — confirmed by `v1-auth.ts:66`: `crypto.createHash("sha256").update(rawKey).digest("hex")` — no salt is used |
| L4 | `src/app/docs/support/page.tsx:189-195` | Docs state resolved tickets are auto-deleted after 48 hours. For security incidents reported via support tickets, this means evidence could be lost. The auto-deletion policy should be documented with a warning about preserving security-relevant tickets. | A09:2021 Security Logging and Monitoring Failures | "Resolved tickets are automatically deleted 48 hours after resolution if no further activity occurs." |

---

## Summary of Recommendations

1. **Critical (C1):** Replace all cookie-based cURL examples with a note explaining these endpoints are dashboard-only and should be accessed through the UI, not via manual cURL. If CLI access is needed, implement a proper API token-based auth flow.

2. **High (H1):** Remove internal port numbers (5555, 5556) from public docs. Port 18789 can remain as it is the user-facing gateway port, but the internal data API and embeddings ports should not be disclosed.

3. **High (H2):** Consider not disclosing exact key length and character set. The `clw_` prefix alone is sufficient for secret scanning.

4. **High (H3):** The V1 API auth should use `rateLimitAsync()` for durable rate limiting, or the docs should accurately describe the limitation. Currently the docs promise robust rate limiting that the implementation does not deliver on serverless deployments.

5. **High (H4):** All webhook secret examples should use environment variable patterns (e.g., `os.environ["WEBHOOK_SECRET"]`) instead of hardcoded strings.

6. **Medium (M1-M3):** All code examples should model secure patterns: environment variables for secrets, explicit HTTPS URLs, and server-side-only usage indicators.

7. **Medium (M4):** Either enforce password complexity requirements or update docs to accurately reflect that only length is enforced.

8. **Medium (M5):** Unify the webhook signature verification guidance so the prose description and code examples use the same scheme (timestamp-prefixed HMAC).

9. **Low (L3):** The API key hashing in `v1-auth.ts` uses unsalted SHA-256 (`crypto.createHash("sha256").update(rawKey).digest("hex")`). If the `api_keys` table is ever leaked, all key hashes can be rainbow-tabled. Consider adding a per-key salt or using a KDF. At minimum, do not document the exact algorithm publicly.
