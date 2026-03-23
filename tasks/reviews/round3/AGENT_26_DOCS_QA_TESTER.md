# Agent 26 — Docs — QA Tester Review

**Total Issues Found: 16**
- CRITICAL: 3 / HIGH: 6 / MEDIUM: 5 / LOW: 2

---

### [QA-01] — Mislabeled link: "Conversations & Threads" points to Webhooks page
**File:** `src/app/docs/api/agents/page.tsx:227`
**Severity:** HIGH
**Description:** The "Next Steps" section has a link labeled "Conversations & Threads" that points to `/docs/api/webhooks`. The Webhooks page documents webhook events, not conversation history. The link text and destination are mismatched.
**Steps to Reproduce:** Navigate to Agents API docs, scroll to "Next Steps", click "Conversations & Threads".
**Expected vs Actual:** Expected: link goes to a conversations/threads endpoint doc. Actual: link goes to the Webhooks page.

---

### [QA-02] — Mislabeled link: "Usage API" points to Webhooks page
**File:** `src/app/docs/api/models/page.tsx:221`
**Severity:** HIGH
**Description:** The "Next Steps" section has a link labeled "Usage API" that points to `/docs/api/webhooks`. The Webhooks page has nothing to do with usage monitoring. There is a separate `/api/v1/usage` endpoint in the codebase, but no corresponding docs page exists.
**Steps to Reproduce:** Navigate to Models API docs, scroll to "Next Steps", click "Usage API".
**Expected vs Actual:** Expected: link goes to a usage/consumption docs page. Actual: link goes to the Webhooks page.

---

### [QA-03] — VPS storage values contradict source of truth (plans.ts)
**File:** `src/app/docs/billing/page.tsx:56`
**Severity:** CRITICAL
**Description:** The billing docs say Pro has "200 GB" storage and Ultra has "400 GB" storage. The authoritative source `src/lib/payments/plans.ts` says Pro has "400GB storage" (line 50) and Ultra has "800GB storage" (line 68). The same wrong values appear in `src/app/docs/plans/page.tsx:75` and `:144`/`:158`.
**Steps to Reproduce:** Compare the VPS resources row in billing docs vs `plans.ts`.
**Expected vs Actual:** Expected: Pro = 400GB, Ultra = 800GB (per plans.ts). Actual: Billing docs say Pro = 200GB, Ultra = 400GB.

---

### [QA-04] — Billing docs say Starter allows only 1 agent; plans.ts says Unlimited
**File:** `src/app/docs/billing/page.tsx:98`
**Severity:** CRITICAL
**Description:** The downgrade section states: "you have 10 agents but are downgrading to Starter which allows 1". However, plans.ts and the billing page's own plan comparison table (line 45) both say Starter has "Unlimited" agents. This example is factually wrong and would confuse users.
**Steps to Reproduce:** Read the "Downgrading Your Plan" section on the billing docs page.
**Expected vs Actual:** Expected: example reflects actual Starter limits. Actual: claims Starter allows only 1 agent.

---

### [QA-05] — Custom domain availability contradicts across docs pages
**File:** `src/app/docs/billing/page.tsx:51`
**Severity:** HIGH
**Description:** The billing page plan comparison says Starter has "No" custom domain. However, `plans.ts` line 28 lists "Custom domain + auto-SSL" as a Starter feature, and `src/app/docs/plans/page.tsx:77` shows Starter has 3 custom domains.
**Steps to Reproduce:** Compare billing page line 51 with plans page line 77 and plans.ts line 28.
**Expected vs Actual:** Expected: consistent custom domain info across all docs. Actual: billing says "No", plans page says "3", plans.ts says included.

---

### [QA-06] — Billing page Knowledge Base and API access values contradict Pro overview
**File:** `src/app/docs/billing/page.tsx:47-49`
**Severity:** HIGH
**Description:** The billing docs say Starter has "50" Knowledge Base documents and "Basic" API access. The Pro overview page (`src/app/docs/pro/page.tsx:179-191`) says Starter has "Not included" for both Knowledge Base and API access. The plans page (`src/app/docs/plans/page.tsx:95-97`) also shows Starter has no Knowledge Base or API access (dash marks).
**Steps to Reproduce:** Compare Starter row for KB and API between billing page and Pro overview table.
**Expected vs Actual:** Expected: consistent feature availability. Actual: billing says 50 docs + Basic API; Pro overview and plans page say not included.

---

### [QA-07] — Annual pricing in billing docs does not match plans.ts calculations
**File:** `src/app/docs/billing/page.tsx:44`
**Severity:** MEDIUM
**Description:** Billing docs list annual per-month prices as: Starter $50/mo, Pro $110/mo, Ultra $298/mo. Computed from plans.ts: Starter $599/12 = $49.92/mo, Pro $1299/12 = $108.25/mo, Ultra $3499/12 = $291.58/mo. The displayed values are rounded up in misleading ways (Pro $108.25 shown as $110, Ultra $291.58 shown as $298).
**Steps to Reproduce:** Divide annual prices from plans.ts by 12 and compare with billing doc values.
**Expected vs Actual:** Expected: accurate per-month equivalent. Actual: numbers are inflated/rounded inconsistently.

---

### [QA-08] — Broken internal links using /dashboard/ prefix in docs
**File:** `src/app/docs/account/page.tsx:234`, `src/app/docs/channels/page.tsx:227`, `src/app/docs/billing/page.tsx:205`
**Severity:** HIGH
**Description:** Three docs pages link to `/dashboard/monitoring` or `/dashboard/analytics` using the raw `/dashboard/` prefix. Per the middleware docs (CLAUDE.md), clean URLs rewrite `/monitoring` to `/dashboard/monitoring` etc., so users never see `/dashboard/` in the URL. More importantly, these links go to the authenticated app, not to documentation -- a user reading public docs would be redirected to login. These should point to the corresponding docs pages instead.
**Steps to Reproduce:** Click "Monitor your VPS" link on account docs page, "Monitor channel health" on channels page, or "View detailed analytics" on billing page.
**Expected vs Actual:** Expected: links point to docs pages like `/docs/monitoring`. Actual: links point to `/dashboard/monitoring` or `/dashboard/analytics`, which require auth and leave the docs site.

---

### [QA-09] — Support page auto-close vs auto-delete contradiction
**File:** `src/app/docs/support/page.tsx:111-113` and `src/app/docs/support/page.tsx:189-196`
**Severity:** HIGH
**Description:** The "Ticket Status Lifecycle" section says tickets are "Auto-Closed" after 48 hours with no replies. The "Auto-Deletion Policy" section says tickets are "automatically deleted 48 hours after resolution." These describe contradictory behaviors: auto-close (status change, ticket preserved) vs auto-delete (ticket destroyed). Users cannot know which actually happens.
**Steps to Reproduce:** Read "Ticket Status Lifecycle" step 4, then read "Auto-Deletion Policy" section.
**Expected vs Actual:** Expected: consistent description of what happens to resolved tickets. Actual: one section says closed, another says deleted.

---

### [QA-10] — Docs header and sidebar only show 3 of 30+ doc pages
**File:** `src/components/docs/docs-header.tsx:7-11`, `src/components/docs/docs-sidebar.tsx:20-24`
**Severity:** MEDIUM
**Description:** Both the header navigation and sidebar page list only contain 3 entries: "Chat API" (/docs), "Webhooks" (/docs/api/webhooks), "Knowledge Base" (/docs/pro/knowledge-base). There are 30+ doc pages but no navigation to reach most of them. Pages like Account, Billing, Channels, Support, Pro overview, API agents, API models, Monitoring, Analytics, Plans, etc. are all unreachable from the docs navigation.
**Steps to Reproduce:** Open any docs page and look at the header nav and sidebar links.
**Expected vs Actual:** Expected: navigation covering all major doc sections. Actual: only 3 pages listed.

---

### [QA-11] — Broken link to /docs/faq from support page
**File:** `src/app/docs/support/page.tsx:212,220`
**Severity:** MEDIUM
**Description:** While `/docs/faq` does exist as a page, the support page's "Best Practices" section tells users to "Check the FAQ before opening a ticket -- your question may already be answered." However, the FAQ page exists and this link works. This is actually fine. (Issue withdrawn upon verification that `/docs/faq/page.tsx` exists.)

*Replacing with:*

### [QA-11] — Broken link to /docs/api/auth from Pro API page (no styling)
**File:** `src/app/docs/pro/api/page.tsx:93`, `src/app/docs/pro/api/page.tsx:234`
**Severity:** LOW
**Description:** Multiple links in the Pro API page do not have `className="text-primary"` or any hover styling, making them invisible or hard to distinguish from regular text. For example, lines 93 and 234 have bare `<Link href="/docs/api/auth">` with no class.
**Steps to Reproduce:** Open the Pro API docs and look for clickable links in the Authentication section and Related Documentation list.
**Expected vs Actual:** Expected: links are visually distinct and styled consistently. Actual: links have no color/hover class, inheriting prose defaults inconsistently.

---

### [QA-12] — Docs header says "API Docs" but docs cover all product areas
**File:** `src/components/docs/docs-header.tsx:37`
**Severity:** LOW
**Description:** The header displays "API Docs" as the section label, but the docs section covers Account Settings, Billing, Channels, Support, VPS management, and many non-API topics. The label is misleading for users navigating to product documentation.
**Steps to Reproduce:** View the header on any docs page.
**Expected vs Actual:** Expected: label reflects full docs scope (e.g., "Documentation"). Actual: says "API Docs".

---

### [QA-13] — Webhooks limit inconsistency: billing says 2 for Starter, plans page says none
**File:** `src/app/docs/billing/page.tsx:53`
**Severity:** MEDIUM
**Description:** The billing plan comparison says Starter has "2" webhooks. The plans page (`src/app/docs/plans/page.tsx:96`) shows Starter has a dash (none) for webhooks. The Pro overview page (`src/app/docs/pro/page.tsx:185-186`) says webhooks are "Not included" in Starter.
**Steps to Reproduce:** Compare the Webhooks row for Starter across billing, plans, and Pro overview pages.
**Expected vs Actual:** Expected: consistent webhook limit for Starter. Actual: billing says 2, plans page and Pro overview say none.

---

### [QA-14] — Audit log retention inconsistency: billing says 7 days for Starter, plans page says none
**File:** `src/app/docs/billing/page.tsx:55`
**Severity:** MEDIUM
**Description:** The billing plan comparison says Starter has "7 days" audit logging. The plans page (`src/app/docs/plans/page.tsx:98`) shows Starter has a dash (none) for Audit Log. The Pro overview table says audit log is "Not included" in Starter.
**Steps to Reproduce:** Compare the Audit log row for Starter across billing, plans, and Pro overview pages.
**Expected vs Actual:** Expected: consistent audit log availability. Actual: billing says 7 days, plans page and Pro overview say not included.

---

### [QA-15] — Billing page says Mission Control is "No" for Starter; no contradiction but inconsistent with the feature actually being Ultra-only
**File:** `src/app/docs/billing/page.tsx:54`
**Severity:** MEDIUM (informational)
**Description:** The billing page says Mission Control is available on Pro, Ultra, and Enterprise but not Starter. However, the plans page (`src/app/docs/plans/page.tsx:100-106`) correctly shows Mission Control features only on Ultra and Enterprise, not Pro. The billing page incorrectly implies Pro has Mission Control.
**Steps to Reproduce:** Compare Mission Control availability between billing page (line 54 shows "Yes" for Pro) and plans page.
**Expected vs Actual:** Expected: Mission Control only on Ultra+. Actual: billing says Pro has it.

*Note: After verifying the plans page, this is confirmed -- billing line 54 says Pro "Yes" for Mission Control, but Mission Control is described everywhere else as an Ultra-exclusive feature.*

---

### [QA-16] — Multiple Pro feature doc links point to pages that may not exist or are stubs
**File:** `src/app/docs/pro/page.tsx:32-33` (logs), `:65-66` (webhooks), `:87-88` (audit-log), `:98-99` (agent-builder), `:109-110` (model-playground)
**Severity:** CRITICAL
**Description:** The Pro overview page links to 10 sub-pages. While the page files exist, the billing docs, Pro overview, and plans docs all describe different feature sets for each plan tier. The lack of a single source of truth means any user comparing plans across different docs pages will encounter contradictions (as documented in QA-03 through QA-15 above). This represents a systemic documentation reliability problem.
**Steps to Reproduce:** Open any two docs pages that describe plan features and compare Starter-tier capabilities.
**Expected vs Actual:** Expected: all pages agree on plan features. Actual: at least 6 data points differ between billing, plans, and Pro overview pages.

*Reclassifying as HIGH since individual contradictions are already documented.*

**Revised severity: HIGH**

---

## Summary of Systemic Issues

1. **Plan feature matrix is inconsistent across 3 docs pages** (billing, plans, pro overview). Storage, agents, webhooks, API access, knowledge base, audit logging, custom domains, and Mission Control availability all differ depending on which page the user reads. A single shared data source (like `plans.ts`) should drive all docs tables.

2. **Mislabeled "Next Steps" links** on API docs pages point to wrong destinations (Webhooks page masquerading as "Conversations & Threads" and "Usage API").

3. **Docs navigation is incomplete** -- only 3 of 30+ pages are reachable from header/sidebar navigation.

4. **Mixed link targets** -- some docs link to `/dashboard/*` authenticated routes instead of staying within the `/docs/` documentation namespace.
