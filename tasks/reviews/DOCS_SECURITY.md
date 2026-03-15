# Documentation Security Audit Report

**Auditor:** Claude (Automated)
**Date:** 2026-03-16
**Scope:** All pages under `dashboard/src/app/docs/` (37 page files) + 3 doc component files under `dashboard/src/components/docs/`
**Status:** PASS with findings

---

## Summary

37 doc page files and 3 doc component files were reviewed for leaked secrets, real API keys, provider name exposure, internal URLs, admin-only feature documentation, and copy-paste security vulnerabilities. The docs are in good shape overall. Several low and medium severity findings are documented below.

---

## 1. API Keys in Examples

**Status: PASS**

All code examples across the docs use placeholder API keys:
- `clw_your_api_key_here` -- used consistently in doc pages
- `clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` -- used as a pattern example (clearly fake)
- `clw_a1b2c3d4e5f6789012345678901234ab` -- used in component docs (clearly fake)

No real API keys were found.

**One inconsistency (LOW):** In `src/components/docs/api-docs.tsx`, the cURL basic example on line 32 uses `YOUR_API_KEY` as the placeholder, while the Python/JS examples on the same page use `clw_your_api_key_here`. The session example (line 188-198) also uses `YOUR_API_KEY`. These should all consistently use `clw_your_api_key_here`.

- File: `dashboard/src/components/docs/api-docs.tsx`, lines 32-38, 188-198

---

## 2. Real Hostnames / IPs

**Status: PASS with notes**

Hostnames used in docs:
- `yourname.clawhq.tech` -- generic placeholder, OK
- `app.clawhq.tech` -- used as the API base URL in all API reference pages. This appears to be the actual production app URL. **Acceptable** since this is the documented public API endpoint.
- `ai.yourcompany.com` -- example custom domain, OK
- `docs.example.com` -- example URL for crawling, OK
- `your-app.com` -- example webhook endpoint, OK
- `openclaw.dev` -- linked on intro page as the OpenClaw project site, OK
- `discord.com/developers`, `api.slack.com` -- third-party URLs for channel setup, OK

No real customer hostnames, IPs, or internal infrastructure addresses were found.

**One note (INFO):** The IP `203.0.113.42` appears in the audit log example at `dashboard/src/app/docs/pro/audit-log/page.tsx` line 195. This is from the RFC 5737 TEST-NET-3 range (203.0.113.0/24), which is reserved for documentation. This is correct usage.

---

## 3. Provider Name Exposure

**Status: FAIL -- MEDIUM**

Per the project naming rules, provider names should not appear in user-facing text. The following violations were found:

### 3a. Models API response example exposes provider names

- **File:** `dashboard/src/app/docs/api/models/page.tsx`, lines 33-71
- **Issue:** The Models API example response includes `"id": "gpt-4o"`, `"name": "GPT-4o"`, `"description": "OpenAI's most capable model..."`, `"id": "claude-3-5-sonnet"`, `"name": "Claude 3.5 Sonnet"`, `"description": "Anthropic's balanced model..."`, `"id": "gemini-2.0-flash"`, `"name": "Gemini 2.0 Flash"`, `"description": "Google's high-speed model..."`, `"id": "deepseek-r1"`, `"name": "DeepSeek R1"`.
- **Impact:** Directly names OpenAI, Anthropic, Google, and DeepSeek as providers.
- **Fix:** Replace model IDs/names with `clawhq-models` naming convention (e.g., `clawhq-fast-1`, `clawhq-balanced-1`, `clawhq-powerful-1`) and remove provider attributions from descriptions.

### 3b. Models API "Choosing the Right Model" section

- **File:** `dashboard/src/app/docs/api/models/page.tsx`, lines 176-181
- **Issue:** Directly recommends "GPT-4o or Claude 3.5 Sonnet", "GPT-4o Mini or Claude 3.5 Haiku", "DeepSeek R1", "Gemini 2.0 Flash" by provider name.
- **Fix:** Replace with ClawHQ model names and capability-based descriptions.

### 3c. Agents API response example exposes provider names

- **File:** `dashboard/src/app/docs/api/agents/page.tsx`, lines 42-57
- **Issue:** Example response includes `"primary": "gpt-4o"`, `"fallback": "gpt-4o-mini"`, `"primary": "claude-3-5-sonnet"`.
- **Fix:** Replace with `clawhq-models` naming.

---

## 4. Internal URLs

**Status: PASS**

No internal infrastructure URLs (e.g., Supabase dashboard URLs, Hostinger panel URLs, Cloudflare dashboard URLs, VPS management IPs) were found in user-facing docs.

**One note (LOW):** In `dashboard/src/components/docs/knowledge-base-docs.tsx` line 266, the text says "The file is stored in Supabase Storage" -- this exposes an implementation detail (Supabase as the storage provider). While not a security vulnerability, it leaks internal architecture to users.

- File: `dashboard/src/components/docs/knowledge-base-docs.tsx`, line 266
- Fix: Replace with "The file is stored securely" or "The file is stored on your account."

---

## 5. Banned Provider Names (Ollama / Hostinger / Blackbox)

**Status: PASS**

The strings "Ollama", "Hostinger", and "Blackbox" do not appear anywhere in the doc pages.

---

## 6. Code Example Security

**Status: PASS with notes**

### 6a. Webhook signature verification examples are secure (PASS)
Both Node.js and Python verification examples in `webhooks-docs.tsx` correctly use:
- `crypto.timingSafeEqual()` (Node.js)
- `hmac.compare_digest()` (Python)
These prevent timing attacks. Good.

### 6b. HMAC verification docs are correct (PASS)
The webhook docs page (`pro/webhooks/page.tsx`) explicitly warns users to "Use a constant-time comparison function to prevent timing attacks."

### 6c. SSRF protection is documented (PASS)
Both webhook creation and KB URL crawling docs mention that private IPs, localhost, and internal addresses are blocked.

### 6d. API key security best practices are documented (PASS)
`api/auth/page.tsx` includes proper best practices: no client-side exposure, environment variables, rotation, least-privilege rate limits.

### 6e. No dangerous patterns in copy-paste examples (PASS)
All code examples use HTTPS, proper auth headers, and placeholder values. No examples use `eval()`, disable SSL verification, or contain other dangerous patterns.

---

## 7. Admin-Only Features

**Status: PASS with one finding (LOW)**

### 7a. VPS Service Ports documented
- **File:** `dashboard/src/app/docs/vps/page.tsx`, lines 90-94
- **Issue:** Documents internal service ports: OpenClaw Gateway (18789), Embeddings (5555), Data API (5556). While these are visible to the customer on their own VPS, exposing the exact port numbers in public docs provides information useful for port scanning.
- **Severity:** LOW -- these ports are on the customer's own VPS, not shared infrastructure.

### 7b. No admin panel documentation exposed (PASS)
The docs do not document any admin-only pages (`/admin/*`), provisioning workflows, SSH credentials, or internal API routes. The admin routes (`/api/admin/provision`, `/api/admin/tickets`, `/api/admin/api-keys`, `/api/admin/vps-password`) are not mentioned anywhere in user-facing docs.

---

## 8. Data Consistency Issues (INFO)

### 8a. Plan feature inconsistencies across doc pages

The billing page (`docs/billing/page.tsx`) and plans page (`docs/plans/page.tsx`) show different values for several features:

| Feature | Plans page | Billing page |
|---------|-----------|-------------|
| Starter agents | Not specified | 1 |
| Starter channels | All 7 | 2 |
| Starter VPS | 2 vCPU / 8 GB | 2 vCPU / 4 GB |
| Pro VPS | 8 vCPU / 32 GB | 4 vCPU / 8 GB |
| Ultra VPS | 16 vCPU / 64 GB | 8 vCPU / 16 GB |
| Pro channels | Unlimited (Pro overview) | 5 (Billing) |
| Mission Control | Ultra only (Plans) | Pro and Ultra (Billing) |
| Starter webhooks | Not included (Plans) | 2 (Billing) |

While not a security issue, conflicting plan information could lead to customer disputes and trust issues.

### 8b. Pro Overview page shows different Starter limits

- `docs/pro/page.tsx` states Starter has "Up to 3 agents" and "2 channels"
- `docs/plans/page.tsx` says Starter has "All 7" channels
- `docs/billing/page.tsx` says Starter has "1" agent and "2" channels

---

## Findings Summary

| # | Severity | Finding | File(s) |
|---|----------|---------|---------|
| 1 | MEDIUM | Provider names (OpenAI, Anthropic, Google, DeepSeek) in API docs | `api/models/page.tsx`, `api/agents/page.tsx` |
| 2 | LOW | Inconsistent API key placeholder (`YOUR_API_KEY` vs `clw_your_api_key_here`) | `components/docs/api-docs.tsx` |
| 3 | LOW | "Supabase Storage" implementation detail exposed | `components/docs/knowledge-base-docs.tsx` |
| 4 | LOW | Internal service ports documented (18789, 5555, 5556) | `docs/vps/page.tsx` |
| 5 | INFO | Plan feature values inconsistent across pages | `docs/plans/`, `docs/billing/`, `docs/pro/` |

---

## Recommendations

1. **[MEDIUM] Replace all provider model names** in `api/models/page.tsx` and `api/agents/page.tsx` with `clawhq-models` naming convention per project rules.
2. **[LOW] Standardize API key placeholders** to `clw_your_api_key_here` everywhere, including the cURL examples in `api-docs.tsx`.
3. **[LOW] Remove "Supabase Storage" reference** from `knowledge-base-docs.tsx` -- replace with generic language.
4. **[LOW] Consider removing specific port numbers** from VPS docs, or keep them if customers need them for firewall rules.
5. **[INFO] Reconcile plan feature values** across all pages that list plan details to prevent customer confusion.
