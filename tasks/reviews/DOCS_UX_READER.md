# Documentation UX Review -- New User Perspective

**Reviewer Role:** New user who just signed up for ClawHQ
**Date:** 2026-03-16
**Scope:** All pages under `src/app/docs/` (36 pages total)
**Overall Rating: 8.5 / 10**

---

## Executive Summary

The ClawHQ documentation is remarkably thorough and well-structured for a product at this stage. A new user can go from zero to a working AI agent in under 15 minutes by following the Quick Start Guide. The writing is clear, the navigation is logical, and the API reference includes copy-pasteable code examples in three languages. The main gaps are data consistency between pages, a non-functional table of contents sidebar, and the absence of visual aids (screenshots, diagrams).

---

## 1. Can I Find the Getting Started Guide Easily?

**Verdict: Yes -- excellent.**

- The docs landing page (`/docs`) prominently links to the Quick Start Guide in two places: the "Documentation Overview" grid and the "Next Steps" section at the bottom.
- The sidebar navigation puts "Quick Start Guide" as the second item under "Getting Started," right after "Introduction."
- The guide itself is an 8-step walkthrough with clear prerequisites ("Before you begin" callout), numbered steps, and a troubleshooting section at the end.
- The "15 minutes" promise is realistic and sets good expectations.

**Minor issue:** The "Before you begin" callout says "no technical setup required," but Step 4 (Telegram setup) requires creating a bot via BotFather, which is mildly technical. The framing could better say "no server or coding setup required."

---

## 2. Are Channel Setup Guides Step-by-Step?

**Verdict: Yes -- solid.**

- All five self-service channels (Telegram, Discord, Slack, Microsoft Teams, Webchat) have numbered step-by-step instructions.
- Telegram and Discord guides are particularly good, with specific API endpoint mentions (e.g., `getMe`, `users/@me`) that help users verify success.
- The Slack guide includes the exact OAuth scopes needed (`chat:write`, `channels:history`, etc.), which prevents common mistakes.
- The Microsoft Teams guide is the weakest -- it mentions Azure Portal steps but is less hand-holding than the others. A new user unfamiliar with Azure would struggle.
- WhatsApp and Signal correctly explain they need admin assistance and link to support.

**What's missing:**
- No screenshots of the BotFather flow, Discord Developer Portal, or Slack app creation screens. Screenshots would significantly reduce friction for non-developer users.
- No mention of what to do if the channel connection shows "Pending" for too long.

---

## 3. Is the API Reference Complete with Examples?

**Verdict: Yes -- one of the strongest sections.**

The API reference spans 6 pages covering 8 endpoints:

| Page | Endpoints Covered | Languages | Quality |
|------|------------------|-----------|---------|
| Authentication | Key creation, format, validation | cURL, Python, JS | Excellent |
| Chat API | POST /chat (standard + streaming) | cURL, Python, JS | Excellent |
| Agents API | GET /agents | cURL, Python, JS | Good |
| Models API | GET /models | cURL, Python, JS | Good |
| Conversations/Threads/Usage/Health | 6 endpoints combined | cURL, Python, JS | Good |
| Rate Limits | 429 handling, backoff | Python, JS | Excellent |

**Strengths:**
- Every endpoint has request/response examples with realistic JSON payloads.
- Code examples in 3 languages (cURL, Python, JavaScript) are complete and copy-pasteable.
- The Rate Limits page includes full exponential backoff implementations in both Python and JS -- this is above average for API docs.
- Error responses are documented with status codes, error codes, and causes.
- The streaming SSE format is clearly documented with the `data: [DONE]` terminator pattern.

**Issues found:**
- The Pro API Access page (`/docs/pro/api`) uses `data.reply` in its JS example, but the Chat API reference page (`/docs/api/chat`) uses `data.response`. This inconsistency would confuse a developer integrating the API. The canonical field name should be consistent.
- The Pro API Access page uses the user's hostname (`yourname.clawhq.tech`) in URLs, while the API reference pages use `app.clawhq.tech`. Which is the correct base URL?
- The SSE streaming format differs between the Pro API Access page (uses `chunk` field with `done` boolean) and the Chat API reference (uses `content` field with `[DONE]` sentinel). These must be reconciled.
- The "Webhooks API" nav label links to the Conversations/Threads/Usage/Health page, and "Next Steps" links on some API pages label the webhooks page as "Conversations & Threads" while others call it "Usage API." The naming is confused.
- No OpenAPI/Swagger spec is mentioned or linked. Developers building integrations would expect one.

---

## 4. Can I Understand Pro/Ultra Features?

**Verdict: Yes -- well organized.**

**Pro Features ($129/mo):**
- The Pro overview page is a strong entry point with 10 linked feature cards, a comparison table, and a recommended getting-started sequence.
- Each Pro sub-feature (Logs, Analytics, KB, Webhooks, API, Audit Log, Agent Builder, Model Playground) has its own dedicated page.
- The Knowledge Base documentation is outstanding -- it explains RAG step-by-step with technical details (chunk size, overlap, embedding model, similarity threshold) that would satisfy both technical and non-technical readers.
- The Webhooks page documents all 9 event types with full JSON payload examples.

**Ultra Features ($350/mo):**
- The Mission Control overview clearly explains the "why" before diving into the "what."
- All 5 components (Overview Dashboard, Task Board, Agent Roster, Event Feed, Session Tracker) have dedicated pages with thorough documentation.
- The Task Board page documents 4 view modes, keyboard shortcuts, and automation rules.

**Issue:** The Pro vs. Starter comparison table on the Pro overview says Starter gets "2 channels" and "Up to 3 agents," but the Plans & Pricing page says Starter gets "All 7" channels and the FAQ says "no fixed limit" on agents. The Billing page says Starter gets "1 agent" and "2 channels." These contradictions would confuse a potential upgrader. The feature limits need to be reconciled across all pages.

---

## 5. Is Search Useful?

**Verdict: Functional but basic.**

- The sidebar has a search input that filters the navigation items by title. Typing "webhook" correctly surfaces both "Webhooks" under Pro Features and "Webhooks API" under API Reference.
- However, this is title-only search -- it does not search page content. A user searching for "HMAC" or "session_id" would get zero results even though those terms appear on multiple pages.
- There is no full-text search, no search results page, and no keyboard shortcut to focus search.

**Recommendation:** Implement content-aware search or at minimum add keyword metadata to nav items so terms like "RAG," "streaming," "SSL," and "HMAC" surface relevant pages.

---

## 6. Is Navigation Intuitive?

**Verdict: Good structure, some execution gaps.**

**Strengths:**
- The sidebar groups pages into 6 logical sections: Getting Started, Dashboard, Pro Features, Ultra Features, API Reference, Help.
- Sections are collapsible with chevron indicators.
- Active page highlighting works correctly.
- Mobile navigation uses a hamburger menu overlay.
- Every page ends with "Related Documentation" or "Next Steps" links, creating a web of cross-references.

**Issues:**
- The right sidebar "On this page" (table of contents) is a placeholder -- it says "On this page" but is always empty. This is a visible UI gap on every single documentation page. On long pages like Channels, Chat, or the Knowledge Base, a working TOC would be very helpful.
- There are two different sidebar components: `docs-sidebar.tsx` (the old API docs sidebar) and `docs-nav.tsx` (the current docs sidebar). The layout uses `docs-nav.tsx`, but `docs-sidebar.tsx` still exists and references only 3 pages (Chat API, Webhooks, Knowledge Base). This is dead code that could cause confusion during maintenance.
- The `docs-header.tsx` component shows "API Docs" branding and links to only 3 pages. This appears to be a leftover from an older docs design and is not used in the current layout, but it still exists in the codebase.
- Two nav items link to pages that do not have breadcrumbs or a "back to parent" indicator (e.g., `/docs/pro/logs` does not show you are inside "Pro Features").

---

## 7. Are Code Examples Copy-Pasteable?

**Verdict: Mostly yes, with caveats.**

- API reference pages use `<pre>` blocks with proper formatting. Code is syntactically correct and runnable.
- The Chat page documents a one-click copy button for code blocks in agent responses.
- Python examples use `f-strings` and standard `requests` library -- no exotic dependencies.
- JavaScript examples use modern `fetch` API and `async/await` -- compatible with Node.js 18+ and all modern browsers.
- The Go example on the Pro API Access page is a nice touch (4th language).

**Issues:**
- Code examples on some pages (Pro Webhooks, Pro Audit Log) use bare `<pre><code>` without the `bg-zinc-900 rounded-lg p-4` styling classes that the API reference pages use. This creates visual inconsistency -- some code blocks have dark backgrounds and padding, others inherit the prose styles and look different.
- The placeholder API key `clw_your_api_key_here` is used consistently, which is good.
- No "Copy" button is rendered on documentation code blocks (the copy button only exists in the Chat interface). Adding one-click copy to doc code blocks would improve developer experience.

---

## 8. Is the Tone Helpful?

**Verdict: Excellent.**

- The tone is professional but approachable -- not patronizing, not overly technical.
- Callout boxes are well-used: blue/primary for "Tip," amber for "Warning." They draw attention without being annoying.
- Sentences are concise. Paragraphs rarely exceed 3-4 lines.
- Technical terms are explained when first introduced (e.g., RAG, SSE, HMAC).
- The FAQ page anticipates real questions ("Do I need technical knowledge?", "Is there a free trial?") and gives honest, direct answers.
- The "Your data, your server" messaging is woven throughout without being repetitive.

---

## 9. What's Missing?

### Critical Gaps

1. **Data inconsistency across pages.** Plan limits (agents, channels, VPS specs) differ between the Plans page, Billing page, Pro overview, and FAQ. Examples:
   - Starter VPS: Plans page says "2 vCPU / 8 GB / 100 GB," Billing page says "2 vCPU / 4 GB."
   - Starter agents: Pro overview says "Up to 3 agents," Billing page says "1 agent," FAQ says "no fixed limit."
   - Starter channels: Plans page says "All 7," Pro overview says "2 channels," Billing says "2."
   - Pro VPS: Plans page says "8 vCPU / 32 GB / 200 GB," Billing says "4 vCPU / 8 GB."
   - Mission Control: Billing page says Pro gets it ("Yes"), but Plans page and Pro overview say it's Ultra-only.
   This is the single most damaging issue in the docs. A user comparing plans would encounter conflicting information on almost every attribute.

2. **No screenshots or visual aids.** Across 36 documentation pages, there is not a single screenshot, diagram, or illustration. The platform is visual (dashboards, Kanban boards, gauge cards, chat interfaces), but the docs describe everything purely in text. Even one annotated screenshot per major page would dramatically improve comprehension.

3. **Right sidebar TOC is non-functional.** Every page reserves space for an "On this page" table of contents, but it is always empty. This is wasted real estate and a broken UI promise.

### Moderate Gaps

4. **No versioning or changelog.** There is no indication of when docs were last updated, no changelog for platform updates, and no API versioning information beyond the `/v1/` prefix.

5. **No "Edit this page" or feedback mechanism.** Users cannot report doc errors or suggest improvements inline. A GitHub link or feedback button would help maintain accuracy.

6. **Broken internal links.** Several pages link to routes that don't exist in the nav:
   - `/docs/monitoring` (linked from Channels page, Account page) -- no such page exists.
   - `/docs/knowledge-base` (linked from Support page) -- should be `/docs/pro/knowledge-base`.
   - `/docs/analytics` (linked from Billing page) -- should be `/docs/pro/analytics`.

7. **No error handling guide for channels.** What happens when a Telegram bot token is revoked by BotFather? What if Discord permissions change? The docs explain setup but not recovery from common platform-side changes.

8. **Webhook signature verification has no code example.** The Webhooks page explains HMAC-SHA256 verification conceptually but doesn't include actual code showing how to compute and compare the signature. This is something every integrator will need.

### Minor Gaps

9. **No dark/light mode toggle in docs.** The docs are locked to dark mode (`prose-invert`). While this matches the dashboard, some users may prefer light mode for reading long documentation.

10. **No print-friendly styles.** Attempting to print a doc page would produce poor results due to the fixed sidebars and dark background.

11. **No anchor links on headings.** Users cannot link to a specific section of a page (e.g., `/docs/channels#discord`). The Ultra and Analytics pages use some anchor IDs but most pages do not.

---

## 10. What's Confusing?

1. **Two different data models for the same thing.** The Billing page plan comparison table tells a completely different story than the Plans & Pricing page. A new user reading both would not know which to trust.

2. **API base URL ambiguity.** Some examples use `https://app.clawhq.tech/api/v1/`, others use `https://yourname.clawhq.tech/api/v1/`. It is unclear whether the API runs on the shared app domain or the user's individual VPS hostname.

3. **"Webhooks API" naming.** The nav item "Webhooks API" leads to a page about Conversations, Threads, Usage, and Health -- not webhooks. The Pro "Webhooks" page is about outbound webhook configuration. These are completely different things with the same name.

4. **Pro overview says Starter gets 2 channels; the main docs landing page says every plan includes "all seven messaging channels."** A new user would be confused about whether they need to upgrade just to connect Slack.

5. **The `docs-sidebar.tsx` and `docs-header.tsx` components exist alongside the active `docs-nav.tsx`.** While not user-facing per se, they represent stale code that could resurface or cause routing confusion.

---

## Scoring Breakdown

| Criterion | Score (1-10) | Notes |
|-----------|:-----------:|-------|
| Discoverability / Getting Started | 9 | Prominent, clear, well-linked |
| Channel Setup Guides | 8 | Step-by-step but no screenshots |
| API Reference Completeness | 8.5 | Strong examples, minor inconsistencies |
| Pro/Ultra Feature Clarity | 8 | Well-structured, good detail depth |
| Search Functionality | 5 | Title-only filtering, no content search |
| Navigation / Information Architecture | 8 | Good grouping, broken TOC, some dead links |
| Code Example Quality | 8.5 | 3 languages, realistic payloads, no copy buttons |
| Tone and Readability | 9.5 | Clear, professional, well-paced |
| Visual Aids | 2 | Zero screenshots or diagrams |
| Data Consistency | 4 | Plan limits contradict across multiple pages |

**Overall: 8.5 / 10**

The documentation is comprehensive, well-written, and logically structured. A new user would be able to get up and running without external help. The deductions come from the plan data contradictions (which could erode trust during purchase decisions), the complete absence of visual aids, and the non-functional table of contents. Fixing the data consistency issues should be the highest priority, followed by adding screenshots and implementing the TOC.

---

## Priority Action Items

1. **[P0] Reconcile plan limits.** Audit every page that mentions plan features (Plans, Billing, Pro overview, FAQ, landing page) and ensure all numbers match a single source of truth.
2. **[P0] Fix broken internal links.** `/docs/monitoring`, `/docs/knowledge-base`, `/docs/analytics` need to point to existing pages.
3. **[P1] Reconcile API response formats.** The `reply` vs `response` field name and `chunk`/`content` SSE formats must be consistent between the Pro API page and the API reference.
4. **[P1] Implement the right-sidebar TOC.** Parse headings per page and generate anchor links.
5. **[P1] Add screenshots.** At minimum: dashboard overview, channel connection flow, agent deployment, chat interface, and Agent Store.
6. **[P2] Rename "Webhooks API" nav item.** Change to "Conversations & More" or split into separate nav entries.
7. **[P2] Add copy buttons to documentation code blocks.**
8. **[P2] Add webhook HMAC verification code examples (Python + JS).**
9. **[P3] Implement full-text search across doc content.**
10. **[P3] Remove stale `docs-sidebar.tsx` and `docs-header.tsx` components.**
