# Naming & Secrets Scan Report

**Scan date:** 2026-03-16
**Scope:** `dashboard/src/` (all files)
**Classification:** USER-FACING = everything except `src/app/admin/` and `src/components/dashboard/admin-*`

---

## Summary

| Category | User-Facing Findings | Server-Only Findings | Admin (Exempt) |
|----------|---------------------|---------------------|----------------|
| Provider names (Ollama) | 0 | 1 | 1 |
| Provider names (Hostinger) | 0 | 25+ | 3 |
| Provider names (Blackbox) | 0 | 0 | 0 |
| Supabase in UI text | **3** | many (imports OK) | 1 |
| Vercel in UI text | 0 | 3 (comments only) | 0 |
| Cloudflare in UI text | **1** | many (server lib OK) | 1 |
| Hardcoded IPs | 0 real IPs | localhost only | 2 placeholder |
| API keys/tokens | 0 real secrets | 0 | 0 |
| SSH passwords | 0 | many (server-side OK) | 3 |
| console.log | **6** (docs code samples) | 3 | 0 |
| "Coming Soon" | **5** | 0 | 0 |
| Mock data | **1** | 0 | 0 |
| Cost/token language | **2** | 0 | 0 |
| TODO/FIXME | 0 user-facing | **5** | 0 |

**Total actionable findings: 18 user-facing + 5 server-side TODOs**

---

## 1. Provider Names

### 1a. "Ollama" (should be "clawhq-models" / "ClawHQ AI")

| # | File | Line | Text | Scope | Severity |
|---|------|------|------|-------|----------|
| 1 | `src/lib/ssh.ts` | 952 | `ollama: { providerKey: "clawhq", api: "openai-completions" },` | Server-only (SSH config map) | LOW -- internal mapping, not shown to users |
| 2 | `src/components/dashboard/admin-api-keys.tsx` | 28 | `{ value: "ollama", label: "Local Model Provider" },` | ADMIN (exempt) | NONE |

**Verdict:** No user-facing violations. The `ssh.ts` key is an internal enum used server-side only. Admin file is exempt.

### 1b. "Hostinger" (should be "clawhq-vps" / "your VPS")

All Hostinger references fall into two categories:

**Server-side only (API routes + lib):** These are `import` statements and server logic in `src/lib/hostinger.ts`, `src/app/api/vps/start/route.ts`, `src/app/api/vps/stop/route.ts`, `src/app/api/vps/restart/route.ts`, `src/app/api/vps/status/route.ts`, `src/app/api/admin/provision/route.ts`, `src/app/api/admin/customers/[id]/vps/route.ts`. These never render to the browser.

**Admin components (exempt):** `admin-vps-editor.tsx`, `admin-customer-detail.tsx`, `admin-deploy.tsx`.

**Verdict:** No user-facing violations. All Hostinger references are server-side or admin-only.

### 1c. "Blackbox"

No matches found anywhere.

---

## 2. Third-Party Names in UI Text

### 2a. "Supabase" in user-facing UI text

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/components/docs/knowledge-base-docs.tsx` | 266 | `"The file is stored in Supabase Storage,"` -- visible in docs page | **HIGH** |
| 2 | `src/components/docs/knowledge-base-docs.tsx` | 544 | `"Storage file removed from Supabase Storage (if uploaded)"` -- visible in docs page | **HIGH** |
| 3 | `src/components/dashboard/ticket-attachment.tsx` | 40 | `* Uploads to Supabase Storage bucket \`ticket-attachments\`.` -- JSDoc comment, not rendered | LOW |

**Also found in code comments (not rendered):**
- `src/app/dashboard/mission-control/layout.tsx:13` -- code comment "Get user ID for Supabase Realtime channel"
- `src/app/dashboard/mission-control/layout.tsx:23` -- code comment "Supabase Realtime replaces dead SSE EventBus"
- `src/app/dashboard/agents/page.tsx:67` -- code comment "Supabase returns joined relation as array"

**Action required:** Lines 266 and 544 in `knowledge-base-docs.tsx` show "Supabase Storage" to users. Replace with "secure storage" or "encrypted storage".

### 2b. "Vercel" in user-facing text

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/lib/payments/detect-region.ts` | 17,23,24 | Comments: "Vercel sets x-vercel-ip-country" | LOW -- code comments, not rendered |
| 2 | `src/app/api/cron/log-alerts/route.ts` | 12 | Comment: "called by Vercel cron scheduler" | LOW -- server-side comment |
| 3 | `src/app/api/cron/apply-pending-changes/route.ts` | 13 | Comment: "Verify Vercel Cron secret" | LOW -- server-side comment |

**Verdict:** No user-facing violations. All are server-side code comments.

### 2c. "Cloudflare" in user-facing text

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/app/privacy/page.tsx` | 252 | `"DNS provider (Cloudflare):"` -- visible on public privacy policy page | **MEDIUM** |

**Server-side only (OK):** `src/lib/cloudflare.ts`, `src/lib/provision.ts`, `src/lib/provision-v3.ts`, `src/app/api/admin/provision/route.ts`.

**Action required:** The privacy page explicitly names Cloudflare. Consider replacing with "our DNS provider" or keeping it (privacy policies often legally require naming third-party processors). **Review with legal -- may be intentionally required.**

---

## 3. Hardcoded IP Addresses

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/app/docs/pro/audit-log/page.tsx` | 195 | `"ip_address": "203.0.113.42"` | NONE -- already uses RFC 5737 example IP |
| 2 | `src/lib/log-patterns.ts` | 14 | `"Error at 192.168.1.1: request abc-123 failed..."` | LOW -- example in code comment, private range |
| 3 | `src/components/dashboard/admin-vps-editor.tsx` | 60,185 | `"192.168.1.1"` / `"1.2.3.4"` placeholder | ADMIN (exempt) |
| 4 | `src/components/dashboard/admin-deploy.tsx` | 404 | `placeholder="192.0.2.1"` | ADMIN (exempt), uses RFC 5737 |

All remaining IP references are `127.0.0.1`, `0.0.0.0`, or `::1` (localhost/loopback in server code).

**Verdict:** No real IP addresses exposed. The specific IP `72.61.232.87` was NOT found anywhere.

---

## 4. API Keys / Tokens / Secrets

All `API_KEY = "clw_your_api_key_here"` instances are **placeholder examples** in documentation code samples (`src/components/docs/api-docs.tsx`, `src/app/docs/api/*/page.tsx`). No real API keys or tokens are hardcoded.

**Verdict:** Clean. No real secrets found.

---

## 5. SSH Passwords in Frontend

All `ssh_password` references are in:
- **API routes** (server-side only) -- reading from DB to establish SSH connections
- **Admin components** (exempt) -- `admin-vps-editor.tsx`, `admin-customer-detail.tsx`, `admin-deploy.tsx`
- **Server libs** -- `ssh.ts`, `provision.ts`, `provision-v3.ts`

**Verdict:** No SSH passwords exposed in user-facing frontend components.

---

## 6. console.log Statements

### In documentation code samples (user-visible but acceptable):

These are `console.log` inside `<code>` / `<pre>` blocks showing example API usage to developers:

| # | File | Lines | Context |
|---|------|-------|---------|
| 1 | `src/app/docs/pro/api/page.tsx` | 156 | `console.log(data.reply);` |
| 2 | `src/app/docs/api/webhooks/page.tsx` | 103, 283-287 | Example webhook handling code |
| 3 | `src/app/docs/api/rate-limits/page.tsx` | 189 | Rate limit retry example |
| 4 | `src/app/docs/api/models/page.tsx` | 167-168 | Model listing example |
| 5 | `src/app/docs/api/chat/page.tsx` | 227 | Chat response example |
| 6 | `src/app/docs/api/auth/page.tsx` | 124 | Auth example |
| 7 | `src/app/docs/api/agents/page.tsx` | 190-193 | Agent listing example |
| 8 | `src/components/docs/api-docs.tsx` | 74, 168, 185-186 | Code samples |
| 9 | `src/components/docs/webhooks-docs.tsx` | 66, 218 | Webhook example code |
| 10 | `src/components/docs/knowledge-base-docs.tsx` | 333-334 | KB upload example |
| 11 | `src/components/dashboard/api-access-manager.tsx` | 183 | API example snippet |

**Severity:** NONE -- These are intentional `console.log` in example code shown to developers.

### In actual production code:

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/lib/provision-v3.ts` | 394, 417 | `console.log("Embedding model loaded")` / `console.log("Embedding service on :5555")` | LOW -- strings written to VPS server.js, not Next.js console.log |
| 2 | `src/lib/vps-data-api/server.js` | 47 | `console.log(\`ClawHQ Data API running on port ${PORT}\`)` | LOW -- VPS-side server, not browser |
| 3 | `src/lib/email.ts` | 24 | Comment referencing console.log, no actual statement | NONE |

**Verdict:** No problematic `console.log` in production browser code. All instances are either documentation samples or VPS-side server code.

---

## 7. "Coming Soon"

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/components/docs/api-docs.tsx` | 944 | `{ lang: "Python", status: "Coming soon" }` | **HIGH** |
| 2 | `src/components/docs/api-docs.tsx` | 945 | `{ lang: "JavaScript / TypeScript", status: "Coming soon" }` | **HIGH** |
| 3 | `src/components/docs/api-docs.tsx` | 946 | `{ lang: "Go", status: "Coming soon" }` | **HIGH** |
| 4 | `src/components/docs/api-docs.tsx` | 947 | `{ lang: "Ruby", status: "Coming soon" }` | **HIGH** |
| 5 | `src/components/dashboard/agent-rating.tsx` | 149 | `"Reviews coming soon"` | **MEDIUM** |

**Action required:** Replace SDK statuses with "Available" or link to actual SDK repos. Replace "Reviews coming soon" with actual rating UI or remove the component.

---

## 8. Mock Data in Non-Test Files

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/components/dashboard/vps-maintenance.tsx` | 69 | `// Mock scheduled restarts` followed by hardcoded `INITIAL_SCHEDULES` array | **HIGH** |

**Action required:** The VPS maintenance page uses mock data for scheduled restarts. This should be backed by real VPS cron data or removed.

---

## 9. Cost / Token Pricing Language

| # | File | Line | Text | Severity |
|---|------|------|------|----------|
| 1 | `src/app/docs/faq/page.tsx` | 65 | `"Unlike platforms that charge per token or per API call"` | **LOW** -- This is comparing against competitors, not showing ClawHQ prices. Acceptable. |
| 2 | `src/app/docs/pro/model-playground/page.tsx` | 187 | `"you save on per-token costs"` | **MEDIUM** -- Implies token-based pricing exists. Should rephrase. |

**Action required:** Line 187 in model-playground docs implies per-token costs exist for ClawHQ users. Rephrase to: "you save on compute resources" or "you free up capacity for other workloads".

---

## 10. TODO / FIXME / HACK / XXX Comments

| # | File | Line | Text | Scope | Severity |
|---|------|------|------|-------|----------|
| 1 | `src/lib/email.ts` | 19 | `// TODO: Replace with real email provider` | Server-only | **MEDIUM** |
| 2 | `src/hooks/use-payment.ts` | 125 | `// TODO: implement XPay checkout flow` | User-facing hook | **MEDIUM** |
| 3 | `src/lib/payments/xpay.ts` | 14 | `* TODO: Implement when XPay API is ready.` | Server-only | **MEDIUM** |
| 4 | `src/lib/payments/xpay.ts` | 24 | `// TODO: Replace with actual XPay API call` | Server-only | **MEDIUM** |
| 5 | `src/lib/payments/xpay.ts` | 33 | `* TODO: Implement when XPay API is ready.` | Server-only | **MEDIUM** |
| 6 | `src/lib/payments/xpay.ts` | 42 | `// TODO: Replace with actual XPay verification` | Server-only | **MEDIUM** |

**Action required:** 6 TODOs remain. The XPay payment integration is stubbed out. The email system has no real provider. These indicate incomplete features shipping in production.

---

## Priority Action Items

### Critical (fix immediately)
1. **`knowledge-base-docs.tsx` lines 266, 544** -- Replace "Supabase Storage" with "secure storage"
2. **`api-docs.tsx` lines 944-947** -- Remove "Coming soon" from SDK section or replace with "Available"
3. **`vps-maintenance.tsx` line 69** -- Replace mock scheduled restart data with real data

### High (fix soon)
4. **`agent-rating.tsx` line 149** -- Remove "Reviews coming soon" or implement reviews
5. **`model-playground/page.tsx` line 187** -- Rephrase "per-token costs" to avoid implying token pricing

### Medium (address in next sprint)
6. **`privacy/page.tsx` line 252** -- Decide whether "Cloudflare" must stay for legal compliance or can be genericized
7. **`use-payment.ts`, `xpay.ts`, `email.ts`** -- 6 TODOs for incomplete features (XPay payments, email provider)

### Low (acceptable / informational)
8. All `console.log` in docs code samples -- intentional, no action needed
9. Hostinger/Ollama in server-side code -- internal, never rendered to users
10. `clw_your_api_key_here` placeholders in docs -- intentional example values
11. Localhost IPs (`127.0.0.1`) in server code -- standard, no action needed
