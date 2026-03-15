# Documentation Content Accuracy Review

**Reviewer:** Content Accuracy Reviewer
**Date:** 2026-03-16
**Scope:** All 36 doc pages under `dashboard/src/app/docs/`
**Navigation:** `dashboard/src/components/docs/docs-nav.tsx` (6 groups, 35 nav items)

---

## Summary

**Total Pages Reviewed:** 36 (including layout)
**Critical Issues:** 12
**Moderate Issues:** 9
**Minor Issues:** 6
**Pass Rate:** All pages have substantive content (no empty/placeholder pages)

---

## CRITICAL ISSUES

### C1. Billing page has WILDLY inconsistent plan data vs. Plans page

**File:** `dashboard/src/app/docs/billing/page.tsx` (lines 43-57)

The billing page feature comparison table contradicts the Plans & Pricing page on nearly every metric:

| Metric | Billing page says | Plans page says |
|--------|-------------------|-----------------|
| Starter VPS | 2 vCPU / 4 GB | 2 vCPU / 8 GB |
| Pro VPS | 4 vCPU / 8 GB | 8 vCPU / 32 GB |
| Ultra VPS | 8 vCPU / 16 GB | 16 vCPU / 64 GB |
| Starter Agents | 1 | No specific limit stated (says "3 models") |
| Pro Agents | 5 | "Unlimited agents" (in Pro overview) |
| Starter Channels | 2 | All 7 |
| Pro Channels | 5 | All 7 (plans page says "All 7" for every tier) |
| Starter Webhooks | 2 | Not included |
| Starter Custom Domain | No | Plans page says 3 domains for all tiers |
| Mission Control | Pro: Yes | Plans page: Ultra only (correct) |
| Starter KB docs | 50 | Not included |
| Starter Messages | 5,000 | No limit mentioned |
| Annual price Starter | $50/mo | Plans page: $49.92/mo |
| Annual price Pro | $110/mo | Plans page: $108.25/mo |
| Annual price Ultra | $298/mo | Plans page: $291.58/mo |

**The billing page is essentially a different product spec.** This must be reconciled with the Plans page which appears to be the canonical source.

### C2. Pro Features Overview contradicts Plans page on Starter limits

**File:** `dashboard/src/app/docs/pro/page.tsx` (lines 152-208)

The Pro vs Starter comparison table says:
- Starter: "Up to 3 agents" -- Plans page says no such limit
- Starter: "2 channels" -- Plans page says "All 7" for every tier
- Starter: "Basic tail view" for logs -- Plans page says no logs at all for Starter

These contradict what the Plans & Pricing page states. The Plans page is the more detailed/canonical source.

### C3. Model names in API docs use provider-branded names (violates naming rules)

**Files:**
- `dashboard/src/app/docs/api/models/page.tsx` -- Uses "GPT-4o", "GPT-4o Mini", "Claude 3.5 Sonnet", "Claude 3.5 Haiku", "Gemini 2.0 Flash", "DeepSeek R1"
- `dashboard/src/app/docs/api/agents/page.tsx` -- Uses "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet" in example responses

Per naming rules: model providers should never be prefixed. The landing page uses "Kimi K2.5" and "MiniMax M2.5" as the primary models. The API docs use completely different model names (OpenAI/Anthropic/Google branded names) that are not consistent with the landing page's model references. The docs should use `clawhq-models` naming convention or at minimum the same model names as the landing page (Kimi K2.5, MiniMax M2.5, etc.).

### C4. API docs base URL inconsistency

**Files:**
- `dashboard/src/app/docs/api/auth/page.tsx` -- Uses `https://app.clawhq.tech/api/v1`
- `dashboard/src/app/docs/pro/api/page.tsx` -- Uses `https://yourname.clawhq.tech/api/v1`

These are two different URLs. The auth page uses `app.clawhq.tech` (the dashboard URL), while the Pro API access page uses `yourname.clawhq.tech` (the user's VPS URL). Based on the architecture (API calls go through the user's VPS), `yourname.clawhq.tech` appears correct. The API reference pages should all use the same convention.

### C5. Broken cross-links to non-existent pages

**3 broken link targets found:**

1. `/docs/monitoring` -- Referenced from:
   - `dashboard/src/app/docs/account/page.tsx` (line 234)
   - `dashboard/src/app/docs/channels/page.tsx` (line 227)
   - **No `/docs/monitoring` page exists.** Should link to `/docs/vps` (which has monitoring content).

2. `/docs/knowledge-base` -- Referenced from:
   - `dashboard/src/app/docs/support/page.tsx` (lines 212, 220)
   - **No `/docs/knowledge-base` page exists.** Should link to `/docs/pro/knowledge-base`.

3. `/docs/analytics` -- Referenced from:
   - `dashboard/src/app/docs/billing/page.tsx` (lines 177, 205)
   - **No `/docs/analytics` page exists.** Should link to `/docs/pro/analytics`.

### C6. Naming rules violation: display rules say "No cost ($)" but docs show prices everywhere

Per memory rules: "No cost ($), tokens, usage bars, budgets, quotas shown to users." However, the docs are full of pricing: "$59/mo", "$129/mo", "$350/mo", "$999+/mo", annual pricing tables, etc.

**Determination:** The docs are a pre-purchase/informational resource, so pricing likely must be visible here. But this needs explicit clarification from the project owner on whether the "no cost shown" rule applies to documentation pages as well as dashboard UI. If the rule is strict, all pricing must be removed from docs. If docs are exempt, this is not an issue.

---

## MODERATE ISSUES

### M1. FAQ says "no fixed limit" on agents, contradicts billing/pro pages

**File:** `dashboard/src/app/docs/faq/page.tsx` (line 236-242)

The FAQ states: "There is no fixed limit on the number of agents you can deploy." But the Billing page says Starter=1 agent, Pro=5 agents. The Plans page does not explicitly state agent limits but says "3 models" for Starter. This is confusing. One canonical source of truth is needed.

### M2. Dashboard page links to wrong page for upgrade

**File:** `dashboard/src/app/docs/dashboard/page.tsx` (line 168)

The usage summary card says it displays "an upgrade prompt linking to the billing page" but the actual link points to `/docs/models` instead of `/docs/billing`.

### M3. API Webhooks page title mismatch in navigation

**File:** `dashboard/src/app/docs/api/webhooks/page.tsx`

The nav calls this "Webhooks API" but the page title is "Conversations, Threads, Usage & Health API". This is actually 4 separate API endpoints bundled into one page. The page has nothing to do with webhooks. The nav label "Webhooks API" is completely wrong -- it should be "Conversations & More" or similar. The "Next Steps" links from other API pages also reference this incorrectly (e.g., "Conversations & Threads" in Chat API links, "Usage API" in Models API links).

### M4. Support page references non-existent "Knowledge Base" for self-service answers

**File:** `dashboard/src/app/docs/support/page.tsx` (lines 212, 220)

Links to `/docs/knowledge-base` which does not exist. The Knowledge Base is a Pro feature for RAG document upload, not a self-service help center. The link text says "Search the knowledge base" implying it is a help center/FAQ -- should link to `/docs/faq` instead.

### M5. Channels page says 5 self-service + 2 admin-assisted, but WhatsApp setup is actually self-service

**File:** `dashboard/src/app/docs/channels/page.tsx` (lines 9-11, 104-127)

The page initially says WhatsApp requires "administrator assistance." But later in the page (and in the FAQ), WhatsApp is described as QR-code self-service pairing done directly in the dashboard. The intro is misleading. Signal is the only truly admin-assisted channel.

### M6. Docs sidebar (old component) has different nav structure than docs-nav

**File:** `dashboard/src/components/docs/docs-sidebar.tsx`

This old sidebar component only lists 3 pages (Chat API, Webhooks, Knowledge Base) with different URLs (/docs, /docs/webhooks, /docs/knowledge-base). This appears to be a legacy component from before the full docs rewrite. It references `/docs/webhooks` and `/docs/knowledge-base` which do not exist as standalone routes. This component should be removed or updated if still in use anywhere.

### M7. Enterprise pricing shown as "$999+/mo" in some places and "Custom" in others

The Plans page says "$999+/mo" for Enterprise. The Billing page says "Custom" for Enterprise pricing. The Support Contact page says "Enterprise (Custom)" for pricing. These should be consistent.

### M8. API key length inconsistency

- `dashboard/src/app/docs/pro/api/page.tsx` (line 28): Says "32 random alphanumeric characters, for a total of 36 characters" (prefix `clw_` = 4 + 32 = 36)
- `dashboard/src/app/docs/faq/page.tsx` (line 318): Says "36 alphanumeric characters" after the prefix -- meaning 40 total

The FAQ says `clw_` + 36 chars, while the API Access page says `clw_` + 32 chars (36 total). The example key in the FAQ (`clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8`) is 40 characters, supporting the FAQ's claim. The API Auth page example (`clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`) is 36 characters. Pick one and standardize.

### M9. Model Playground docs mention "cost optimization" and "per-token costs"

**File:** `dashboard/src/app/docs/pro/model-playground/page.tsx` (lines 185-188)

The text says: "Compare a larger, more expensive model against a smaller, faster one. If the smaller model produces acceptable quality for your use case, you save on per-token costs."

Per naming rules: "No cost ($), tokens, usage bars" -- models are bundled. Mentioning "per-token costs" implies usage-based billing which contradicts the flat-rate pricing model described everywhere else.

---

## MINOR ISSUES

### m1. Docs intro page mentions "seven channels" but FAQ correctly lists all 7 by name

The intro page (line 114) lists only 6 by name: "Telegram, Discord, Slack, Microsoft Teams, WhatsApp, Signal, and Webchat" -- this is actually all 7. Confirmed correct.

### m2. Right sidebar "On this page" is empty placeholder

**File:** `dashboard/src/app/docs/layout.tsx` (lines 33-39)

The right sidebar has a comment saying "Table of contents will be generated per page" but no TOC is actually generated. This is a cosmetic/UX issue, not a content accuracy issue.

### m3. "cost-effective" language in Models API docs

**File:** `dashboard/src/app/docs/api/models/page.tsx` (line 46)

GPT-4o Mini description says "more cost-effective version" -- implies per-model pricing which does not exist in ClawHQ's flat-rate model.

### m4. Notification preferences link points to dashboard overview instead of account

**File:** `dashboard/src/app/docs/dashboard/page.tsx` (line 106)

"Notification preferences can be configured from your Account Settings page" but the link href is `/docs/dashboard` (self-referencing) instead of `/docs/account`.

### m5. Model names in docs do not match landing page model names

The landing page uses: Kimi K2.5, MiniMax M2.5, Claude 4, GPT-4.1, Gemini 2.5, DeepSeek V3, Llama 4, Qwen 3.
The API docs use: GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3.5 Haiku, Gemini 2.0 Flash, DeepSeek R1.
These are completely different model lists. One is aspirational/branded, the other is real API IDs. They need alignment.

### m6. Chat API "Next Steps" link text mismatch

**File:** `dashboard/src/app/docs/api/chat/page.tsx` (line 270)

Link says "Conversations & Threads" but the href points to `/docs/api/webhooks`. While the page at that URL does cover conversations and threads, the URL name is misleading.

---

## CHECKS PASSED

### 1. No provider names in user-facing docs text
No instances of "Ollama", "Hostinger", "Blackbox", "Supabase", "Vercel", or "Cloudflare" found in any doc page. PASS.

### 2. Core pricing is correct
Starter $59/mo, Pro $129/mo, Ultra $350/mo, Enterprise $999+/mo -- consistent across intro, getting-started, plans, pro overview, ultra overview, support-contact, and FAQ pages. PASS.

### 3. Feature tiers are generally correct
- Pro features (Logs, Analytics, KB, Webhooks, API, Audit Log, Agent Builder, Model Playground) are consistently marked with PRO badge. PASS.
- Ultra features (Task Board, Agent Roster, Event Feed, Session Tracker) are consistently marked with ULTRA badge. PASS.

### 4. Code examples are syntactically correct
All cURL, Python, JavaScript, and Go examples use valid syntax. JSON payloads are well-formed. SSE streaming examples are correct. PASS.

### 5. Channel list is correct (7 channels)
WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, Webchat -- consistently listed. PASS.

### 6. No "Coming Soon" language
Zero instances found across all 36 doc pages. PASS.

### 7. No mock data references
All docs describe real features with realistic examples. No placeholder/lorem ipsum content. PASS.

### 8. No empty/placeholder pages
All 36 pages have full, substantive content. PASS.

### 9. FAQ is comprehensive
Covers 7 sections: Getting Started (4 Qs), Pricing (4 Qs), Channels (4 Qs), AI Models (3 Qs), Agents (3 Qs), Data & Privacy (4 Qs), API (3 Qs), Billing (3 Qs). Links to Contact Support for anything not covered. PASS.

### 10. API reference coverage
V1 endpoints documented:
- `POST /api/v1/chat` (standard + streaming)
- `GET /api/v1/agents`
- `GET /api/v1/models`
- `GET /api/v1/conversations`
- `GET /api/v1/threads` + `POST /api/v1/threads` + `POST /api/v1/threads/:id/messages`
- `GET /api/v1/usage`
- `GET /api/v1/health`
- Rate limits documentation
- Authentication documentation

All V1 endpoints appear covered. PASS.

### 11. Terminology is consistent
"ClawHQ AI", "dedicated VPS", "OpenClaw" used correctly throughout. PASS.

### 12. Tone is professional and clear
No overly casual or overly corporate language. Consistent professional technical documentation tone throughout. PASS.

---

## PRIORITY FIX LIST

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | C1: Billing page plan data contradicts Plans page | Reconcile billing table with Plans page as source of truth |
| P0 | C3: API model names use provider brands | Replace with clawhq-models naming or match landing page models |
| P0 | C5: 3 broken cross-links | Fix /docs/monitoring -> /docs/vps, /docs/knowledge-base -> /docs/pro/knowledge-base or /docs/faq, /docs/analytics -> /docs/pro/analytics |
| P1 | C2: Pro overview Starter limits contradict Plans page | Align with Plans page |
| P1 | C4: API base URL inconsistency | Standardize to yourname.clawhq.tech |
| P1 | M3: Webhooks API nav label is wrong | Rename to "Conversations & More" or split into separate pages |
| P1 | M8: API key length inconsistency | Standardize to one length |
| P1 | M9: "per-token costs" language | Remove cost/token language from playground docs |
| P2 | M1: FAQ agent limit claim | Align with canonical plan limits |
| P2 | M2: Dashboard upgrade link target | Change from /docs/models to /docs/billing |
| P2 | M5: WhatsApp admin-assisted label | Update intro to say 6 self-service + 1 admin-assisted |
| P2 | M6: Old docs-sidebar component | Remove or update legacy component |
| P2 | M7: Enterprise pricing inconsistency | Standardize to "$999+/mo" or "Custom" |
| P3 | m2: Empty TOC sidebar | Implement or remove |
| P3 | m3: "cost-effective" language | Rephrase to remove cost implication |
| P3 | m4: Notification preferences self-link | Change href to /docs/account |
| P3 | m5: Model name alignment | Decide canonical model list |
| P3 | m6: Chat API link text mismatch | Fix link text |
| P3 | C6: Pricing in docs vs display rules | Clarify whether docs are exempt from "no cost" rule |
