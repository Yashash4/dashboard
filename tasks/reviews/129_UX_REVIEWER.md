# ClawHQ Pro ($129/month) UX Review

**Reviewer perspective:** Paying customer who upgraded from Starter ($59) expecting professional-grade tools worth the extra $70/month.

**Date:** 2026-03-16

---

## Feature-by-Feature Review

---

### 1. Logs Explorer

**Files:** `logs/page.tsx`, `logs-tabs.tsx`, `logs-explorer.tsx`

**What it does:** Real-time VPS log viewer with search, filtering by level (info/warn/error/debug), auto-refresh (5s polling), line count selector (100/200/500), and download. Also has sub-tabs for Saved Views, Patterns, and Alerts.

#### Clarity (no docs needed?)
Yes. The subtitle "Search and filter your VPS logs in real-time" is sufficient. Anyone who needs logs knows what this is.

#### Intuitive?
Very. The toolbar layout is clean: search left, controls right. Level filter badges double as toggle buttons in the stats bar -- clever and space-efficient. Pause/play for auto-refresh, refresh, and download are standard icons that need no explanation.

#### $129 quality or $29 quality?
**$79 quality.** The core log viewer is solid but basic. 500-line cap is limiting for debugging real incidents. No regex search. No time-range picker (only "latest N lines"). No structured log parsing (JSON log expansion). The 4-tab layout (Explorer, Saved Views, Patterns, Alerts) elevates it, but those sub-components weren't reviewed here.

#### "Aha moment"
When you search for an error term and the `HighlightText` component highlights matches inline with colored badges showing level counts updating in real time. That feels like a real observability tool.

#### Confusing or missing
- No date/time range picker. You can only fetch the "latest N lines." For debugging issues from 3 hours ago, this is useless.
- Max 500 lines is too low. Need at least 5000 or streaming/pagination.
- No regex or advanced query language. At $129 I expect `level:error AND "timeout"` syntax.
- No log line detail expansion (click to see full structured context).
- The trash icon for "no logs" empty state is misleading -- Trash2 implies deletion, not emptiness. Use FileX or InboxIcon.

#### Empty state guidance
Minimal. "No logs available" with a trash icon. No guidance like "Make sure your VPS is running" or "Logs appear when your agents process messages."

#### Mobile
Toolbar wraps to column layout via `flex-col sm:flex-row`. The monospace table will require horizontal scroll on mobile. Timestamp column (160px) + level (60px) + message will overflow. Not great but functional.

#### Keyboard shortcuts
None. Enter to search would be natural but search is already live-filter. No `Ctrl+F` override, no `Ctrl+K` for command palette, no `Escape` to clear filters.

**Score: 6.5/10**

---

### 2. Usage Analytics

**Files:** `analytics/page.tsx`, `analytics-tabs.tsx`, `usage-analytics.tsx`

**What it does:** Dashboard with summary cards (Messages, Conversations, Avg Response Time, Peak Hour), area/bar/pie charts (Messages Over Time, Requests by Hour, Messages by Agent, Daily Conversations & Messages). Time range selector (7/14/30 days). Sub-tabs for Funnels, CSAT, Live, and Intents dashboards.

#### Clarity
Yes. "Track conversations, performance metrics, and insights" is clear. The 4 summary cards immediately communicate value.

#### Intuitive?
Excellent. The time range selector top-right is standard. Charts are well-labeled with legends. Percentage change indicators with colored arrows are immediately readable. The donut chart for agent breakdown with a side legend is clean.

#### $129 quality?
**$99 quality.** This is the strongest Pro feature. 4 summary KPI cards with period-over-period comparison, 4 distinct charts, plus the 5-tab layout (Overview, Funnels, CSAT, Live, Intents) is genuinely comprehensive. The Recharts implementation with proper gradients, tooltips, and responsive containers looks polished. The `pctChange` function with the `ChangeIndicator` component showing green/red arrows is a nice touch.

#### "Aha moment"
Seeing the period-over-period percentage change on Messages and Conversations. That's when you think "okay, this is actually tracking my business metrics." The Peak Hour card is also surprisingly useful for understanding usage patterns.

#### Confusing or missing
- No export functionality (no CSV download of chart data).
- No custom date range (only 7/14/30 preset).
- Error rate is shown as a tiny red text next to a chart title -- easy to miss. Should be its own KPI card.
- No drill-down. Clicking a bar in the hourly chart should filter to that hour.
- No comparison view (this month vs last month overlay).
- "Avg Response" shows ms or seconds but the `per message` subtext is vague -- is this time-to-first-token or full completion?

#### Empty state
Charts show "No data yet" centered in the chart area. Adequate but could suggest "Send some messages through your agents to see analytics here."

#### Mobile
Grid switches from `grid-cols-4` to `grid-cols-2` on small screens. Charts are in `ResponsiveContainer` so they resize. The pie chart + legend side-by-side layout may crush on very narrow screens.

#### Keyboard shortcuts
None.

**Score: 8/10**

---

### 3. Knowledge Base

**Files:** `knowledge-base/page.tsx`, `kb-tabs.tsx`, `knowledge-base-manager.tsx`

**What it does:** Upload documents (PDF, TXT, MD, CSV) or crawl URLs, which get chunked and indexed for agent RAG retrieval. Shows document list with status (indexed/processing/error/pending_embedding), file metadata, chunk counts, retrieval counts. Includes a "Test Your Knowledge Base" section with vector similarity search. Storage limit: 100 MB. Sub-tabs for Chunks viewer and Connectors.

#### Clarity
Yes. "Upload documents for your agents to reference" is immediately clear. The upload dialog further explains "Documents are chunked and indexed for your agents to reference."

#### Intuitive?
Very good. The upload flow is clean: choose file or URL, drag-drop zone, file type restrictions shown. The 4 stat cards (Documents, Indexed, Total Chunks, Storage Used with progress bar) give immediate context. The per-document metadata row showing retrieval count ("Referenced 3x in chat") is excellent -- it proves the KB is actually being used.

#### $129 quality?
**$109 quality.** This is a killer feature. RAG knowledge base with file upload, URL crawling, chunking, vector search, re-indexing, retrieval tracking, and a test interface -- that's a real product feature. The storage progress bar with 100MB limit, the status system with processing states, and the "Test Your Knowledge Base" section with similarity scores are all genuinely professional. The 3-tab layout (Documents, Chunks, Connectors) adds depth.

#### "Aha moment"
The "Test Your Knowledge Base" section. Typing a question and seeing which documents match with similarity percentages -- that's the moment you understand the value. Also seeing "Referenced 12x in chat" on a document proves your upload wasn't wasted.

#### Confusing or missing
- 100 MB storage limit feels low at $129/month. No indication of what happens when you hit it.
- No drag-and-drop file upload (the zone is clickable, not droppable).
- No bulk upload. Uploading 20 documents one at a time would be painful.
- No document preview -- you can see name/size/chunks but can't read the content.
- `searchMode` state exists for name vs content search, but the content search filtering in `filtered` only searches by name. The content search seems to only work via the Test KB section.
- The "search content" mode in the dropdown is misleading if it doesn't actually filter the document list by content.
- No tag/category system for organizing documents.
- No notification when processing completes (you have to check back).

#### Empty state
Good. "No documents yet" with subtext "Upload documents so your agents can reference them." Clear call to action.

#### Mobile
Stats grid goes to 2 columns. Toolbar wraps. Document rows may be tight with metadata on mobile.

#### Keyboard shortcuts
Enter key works on the Test KB search input. No other shortcuts.

**Score: 8.5/10**

---

### 4. Webhooks

**Files:** `webhooks/page.tsx`, `webhooks-manager.tsx`

**What it does:** Create webhook endpoints that receive POST requests when events occur (message.received, agent.deployed, vps.status_changed, channel.connected/disconnected, agent.undeployed, api.request, kb.document.indexed, session.started). Features: HMAC secret for verification, enable/disable toggle, test delivery, pause/resume, edit URL/events, delivery history with per-delivery replay, bulk retry failed deliveries, delivery stats (success rate, avg latency). Quick-start templates for Slack, Discord, Zapier.

#### Clarity
Yes. "Get notified when events happen in your instance" plus 9 clearly described event types.

#### Intuitive?
Very good. The create flow is clean: URL input, description, event checkboxes with descriptions. The green dot toggle for enable/disable is intuitive. Templates (Slack/Discord/Zapier) reduce time to first webhook. The secret shown-once dialog with copy button follows security best practices.

#### $129 quality?
**$119 quality.** This is enterprise-grade webhook management. 9 event types, HMAC signing, delivery history with replay, bulk retry failed, delivery stats with success rate and avg latency, pause/resume, edit in place, templates. The `DeliveryLogs` sub-component with per-delivery status codes, latency, retry counts, and individual replay buttons is seriously thorough. The summary cards (Active, Events Tracked, Last Triggered) give immediate context. This would not be out of place in a $200/month product.

#### "Aha moment"
The delivery history panel. Expanding it to see every delivery attempt with status codes, latency, retry counts, and the ability to replay individual failed deliveries -- that's professional tooling. The "Retry All Failed" bulk action is the cherry on top.

#### Confusing or missing
- Secret is displayed in plain text in the webhook card (`webhook.secret`). If it's supposed to be shown-once (the create dialog implies this), why is it visible on every card? This is either a bug or the create dialog messaging is misleading.
- No webhook payload preview/documentation. I can subscribe to `message.received` but what does the payload look like?
- No rate limiting configuration on the webhook itself.
- Templates pre-fill the URL field with placeholder text (`https://hooks.slack.com/services/T.../B.../...`). Users might accidentally submit the placeholder.
- 3-column grid for templates doesn't stack on mobile.
- No webhook logs search/filter.
- The `filter_conditions` and `transformation` fields exist in the interface but aren't exposed in the UI. Dead fields?

#### Empty state
Good. "No webhooks configured" with "Add a webhook to start receiving event notifications."

#### Mobile
Summary stats grid is 3 columns -- will be cramped on mobile. The webhook card header has many buttons (Edit, Test, Pause, Delete) that will overflow on narrow screens.

#### Keyboard shortcuts
None.

**Score: 8.5/10**

---

### 5. API Access

**Files:** `api-access/page.tsx`, `tabs.tsx`, `api-access-manager.tsx`

**What it does:** API key management with create/revoke lifecycle. Shows 3 endpoints (POST /api/v1/chat, GET /api/v1/health, GET /api/v1/conversations). Up to 5 active keys with per-key rate limits (30/60/120/300 RPM). Usage stats per key (today, this week, errors). Inline rate limit editing. Code examples in 4 languages (cURL, Python, JavaScript, PowerShell) for 3 endpoints (Chat, Health, Conversations), including streaming examples. Sub-tab for API Playground.

#### Clarity
Yes. "Direct API access to your OpenClaw instance" plus the endpoint listing makes it immediately clear.

#### Intuitive?
Excellent. The endpoint card with colored method badges (POST/GET) and monospace URLs is developer-standard. The key creation flow (name + rate limit) is minimal and appropriate. The code examples with language tabs and copy buttons are exactly what a developer expects. The "Agent Parameter" docs section at the bottom explains the non-obvious parts.

#### $129 quality?
**$129 quality.** This is the feature that most justifies the Pro price for developers. 4-language code examples with streaming, session persistence, and conversation history API. Per-key rate limit editing with inline UI. Usage stats with today/week/errors breakdown. The key-prefix-only display with revoke confirmation is security-correct. The 2-tab layout (Keys & Examples, API Docs & Playground) adds extra value. PowerShell inclusion is a nice touch for enterprise users.

#### "Aha moment"
Seeing the code examples with streaming support. Copy the cURL command, replace the key, and you have a working API call in 30 seconds. The session_id documentation for conversation persistence is the moment you realize you can build real applications on this.

#### Confusing or missing
- The `clw_your_key_here` placeholder in code examples should ideally auto-populate with the user's first active key (masked). Having to manually replace it is friction.
- No API usage chart/graph -- just numbers. A mini sparkline showing daily usage would help spot trends.
- No IP allowlist for keys.
- No key expiration/rotation schedule.
- 5-key limit is fine but the limit message is just `disabled={activeCount >= 5}` with no explanation text when you hit the cap.
- The code examples have template literal syntax issues in the JavaScript conversation example (mixing `${}` string interpolation inside a template literal that's already a plain string).

#### Empty state
Good. "No API keys yet. Create one to get started."

#### Mobile
Endpoint cards and key list will be functional. Code examples with `overflow-x-auto` will scroll horizontally. Tab-within-tab (endpoint type > language) may be cramped.

#### Keyboard shortcuts
Enter key works on key name input for creation. No other shortcuts.

**Score: 9/10**

---

### 6. Audit Log

**Files:** `audit-log/page.tsx`, `audit-log-viewer.tsx`

**What it does:** Paginated table of all account activity. Categories: auth, vps, agent, model, api_key, account, knowledge_base, webhook. Each entry shows timestamp, category badge (color-coded with icon), action, details, and IP address. Features: search with debounce, category filter, pagination (50/page), export current page as CSV, export all (up to 10K), and hash chain integrity verification.

#### Clarity
Yes. "Track all activity across your account" is clear. The color-coded category badges make it visually scannable.

#### Intuitive?
Very good. Standard table layout with filters on top. Category filter dropdown, search bar, pagination controls -- all standard patterns. The CSV export is straightforward.

#### $129 quality?
**$109 quality.** The table itself is standard, but two features elevate it: (1) The "Export All" button that streams up to 10K entries, and (2) the "Verify" button that checks hash chain integrity. Hash chain verification is a serious compliance feature -- it proves no one has tampered with the audit trail. That's enterprise security tooling. The CSV injection protection (`csvSafe` function) shows attention to security detail.

#### "Aha moment"
The "Verify" button. Clicking it and seeing "Chain verified: 847 of 847 entries intact" is the moment you realize this isn't just a log viewer -- it's tamper-proof record keeping. That's $129-worthy for regulated industries.

#### Confusing or missing
- No date range filter. For compliance, "show me all activity from March 1-7" is a basic need.
- No user/actor filter (though for single-user accounts this is less relevant).
- Details column is truncated at 250px with `truncate` class -- no way to see full details. Need a click-to-expand or detail drawer.
- Export Page vs Export All buttons are confusing -- two similar buttons with different icons. Combine into a single dropdown: "Export > Current Page / All Records."
- No retention policy information. How long are audit logs kept?
- The `formatDetails` function just joins key-value pairs with commas. Complex nested details will be unreadable.
- No way to link from an audit entry to the actual entity (e.g., clicking "Agent Deployed" should link to the agent).

#### Empty state
Good. "No audit entries yet. Actions you take will appear here."

#### Mobile
Table will be very cramped. 5 columns at minimum widths (170+120+auto+250+110 = 650px+) will require horizontal scroll.

#### Keyboard shortcuts
None. The search has debounce (400ms) which is appropriate.

**Score: 7.5/10**

---

### 7. Model Playground

**Files:** `model-playground/page.tsx`, `model-playground.tsx`

**What it does:** Side-by-side model comparison. Select 2 models from your available models, type a prompt, and compare responses simultaneously. Shows response time for each. Advanced settings for temperature (0-2) and max tokens (64-4096). Markdown rendering in responses.

#### Clarity
Yes. "Compare AI models side by side" -- immediately clear. The "Each comparison sends 2 requests" disclaimer is honest and important.

#### Intuitive?
Excellent. Two model selectors at top, two response panels in the middle, prompt at the bottom. Enter to submit, Shift+Enter for newline -- standard. The Settings dialog for temperature and max tokens keeps the main UI clean while providing advanced controls. The live elapsed timer during generation adds responsiveness.

#### $129 quality?
**$89 quality.** The concept is great but the implementation is minimal. It's a single-turn comparison only -- no conversation continuity. No prompt history. No saved comparisons. No parameter sweep (same prompt, different temperatures). No token count display. No side-by-side diff highlighting to spot differences. For a "playground," it's more of a single-use tool.

#### "Aha moment"
Seeing both responses render simultaneously with their individual response times. If Model A responds in 1.2s and Model B in 3.4s with similar quality, you instantly know which to use.

#### Confusing or missing
- Single-turn only. No conversation mode to test multi-turn behavior.
- No prompt library or history. Every comparison starts from scratch.
- No way to save/share a comparison result.
- No token usage display (how many tokens did each response consume?).
- No system prompt field for testing agent personas.
- The response panels show "Model 1" and "Model 2" as labels -- should show the actual model name more prominently (it's in a tiny badge).
- No blind/randomized comparison mode (hide which model is which to reduce bias).
- Advanced settings dialog resets when closed (no persistence).
- Panels don't show word count or any output metrics beyond response time.

#### Empty state
"Response will appear here" in each panel. Adequate.

#### Mobile
Model selectors go to 2-column grid. Response panels stack to single column on `md` breakpoint. Functional.

#### Keyboard shortcuts
Enter to submit (when prompt is focused and not holding Shift). Good.

**Score: 6/10**

---

### 8. Agent Builder

**Files:** `agent-builder/page.tsx`, `agent-builder.tsx`

**What it does:** Two modes: (1) AI-assisted -- describe what you want, AI generates SOUL.md, identity.md, TOOLS.md, and config.json. (2) Manual builder -- form-based: agent name, personality (with AI generation), identity (display name, emoji, theme), tool selection (5 groups: Coding, Browser, Memory, Session, Thinking), model selection (primary + fallback), user context. Preview mode shows editable config files in tabs. Deploy button pushes to VPS.

#### Clarity
Yes. "Create custom AI agents with AI-assisted or manual configuration." The two-mode tab (AI Assistant / Manual Builder) is immediately clear.

#### Intuitive?
Very good. The AI mode is dead simple: describe, click generate, review, deploy. The manual mode has a logical top-to-bottom flow: name > personality > identity > tools > model > context > preview. Example prompts in the AI mode reduce the blank-page problem. The tool selection with grouped checkboxes and descriptions is well-organized.

#### $129 quality?
**$109 quality.** The dual-mode approach is smart. The AI-assisted generation that produces 4 config files from a description is impressive. The manual builder's "Generate with AI" button for the personality section is a great hybrid approach. The tool groups (Coding, Browser, Memory, Session, Thinking) are well-categorized. The preview mode with editable config files in code-editor style (green text on dark background) feels professional.

#### "Aha moment"
Clicking "Generate Agent" in AI mode and watching 4 config files appear. Being able to read and edit the generated SOUL.md before deploying -- that hybrid AI-assisted-but-human-controlled workflow is genuinely powerful.

#### Confusing or missing
- No agent testing before deploy. You preview config files but can't send a test message to see how the agent behaves.
- No indication of what the tools actually do in practice. "Read Files" says "Read file contents" but what files? Where? This needs tooltips with examples.
- The sanitize function strips everything to `[a-z0-9_-]` but there's no visible validation feedback -- the user types "My Agent!" and it silently becomes "my_agent". Show the transformation.
- No version control. Editing an agent overwrites the previous config. No diff, no rollback.
- No clone/duplicate functionality for iterating on agents.
- The `primaryModel` default is "default" which maps to "clawhq/default" -- but what model IS that? Users need to know.
- No way to assign a knowledge base to the agent during creation.
- Example prompts are hardcoded. These should rotate or be contextual.
- After successful deploy, all state resets. The user can't go back and tweak -- they have to start over or go to a different page.
- The `TOOL_GROUPS` don't include integration tools (API calls, database queries) which limits agent capabilities.

#### Empty state
The initial state IS the builder form, so there's no empty state problem. The example prompts in AI mode serve as inspiration. Good.

#### Mobile
Form layout is single-column friendly. Tool checkboxes are fine. Model selectors are 2-column grid that may need stacking on very narrow screens.

#### Keyboard shortcuts
None beyond standard form behavior.

**Score: 7.5/10**

---

## Overall Assessment

---

### 9. Is Pro worth $129/month?

**Yes, conditionally.** The total feature package is substantial: 8 distinct feature areas, each with sub-tabs adding depth (Logs has 4 tabs, Analytics has 5, KB has 3, API Access has 2). The strongest features (API Access, Knowledge Base, Webhooks) are genuinely professional-grade and would cost more as standalone SaaS products.

**The upgrade value vs Starter ($59):**
- Starter gets: VPS, models, agents, channels, chat, monitoring, OpenClaw dashboard, support
- Pro adds: Logs (4 tabs), Analytics (5 tabs), Knowledge Base (3 tabs), Webhooks, API Access (2 tabs), Audit Log, Model Playground, Agent Builder
- That's 8 major features with 19+ sub-features for $70 more

The per-feature value breaks down to roughly $8.75/feature/month, which is reasonable for what's offered. The API Access alone could justify $30-40/month as a standalone product.

**However**, the value depends heavily on the user's use case:
- **Developers building on the API:** Worth every penny. API Access + Webhooks + Knowledge Base = a complete AI application backend.
- **Non-technical users managing agents:** Probably not worth it. The Model Playground and Agent Builder are the only relevant features, and both are light.
- **Compliance-sensitive users:** Audit Log with hash chain verification is unique and valuable.

### 10. Strongest and weakest features

**Strongest: API Access (9/10)**
Complete API management with 4-language code examples, streaming support, rate limiting, usage stats, and security-correct key lifecycle. This is the feature that makes Pro feel like a developer platform, not just a dashboard.

**Runner-up: Knowledge Base (8.5/10) and Webhooks (8.5/10)**
Both are genuinely enterprise-grade. KB's test interface with similarity scores and retrieval tracking proves the feature works. Webhooks' delivery history with replay is professional ops tooling.

**Weakest: Model Playground (6/10)**
Single-turn comparison only, no history, no saved results. It's a demo, not a tool you'd use daily. Needs conversation mode, prompt library, and comparison history to justify its place in a $129 plan.

**Runner-up weakest: Logs Explorer (6.5/10)**
500-line cap, no time range, no regex, no structured log parsing. For serious debugging, users will SSH into the VPS and use `journalctl` directly, which defeats the purpose.

### 11. What would make me cancel back to Starter?

- If I'm not using the API and don't need webhooks, the remaining features don't justify $70/month.
- If the Knowledge Base 100MB limit blocks my use case with no upgrade path.
- If the Analytics data feels unreliable or incomplete (can't verify what's tracked).
- If the Agent Builder agents don't actually perform well in production (the builder is config generation, not agent intelligence).
- If I realize the Logs Explorer can't help me debug real issues and I'm SSH-ing in anyway.

### 12. What's missing at this price?

**Critical gaps:**
1. **No team/collaboration features.** The upgrade prompt mentions "Team access with role-based permissions" but no team management UI exists in any reviewed component. At $129/month, multi-user access with role-based permissions should be built and visible.
2. **No alerting dashboard.** Log Alerts tab exists but the main analytics page has no threshold-based alerts (e.g., "alert me if error rate exceeds 5%").
3. **No cost/token tracking.** At $129/month I expect to see how many tokens I'm consuming across models. There's no token usage visibility anywhere.
4. **No data retention policies or data export.** How long is my data kept? Can I export everything if I cancel?
5. **No custom dashboard.** Can't pin my most-used charts or rearrange the layout.
6. **No integration marketplace.** Webhook templates for Slack/Discord/Zapier are nice but I'd expect first-party integrations.
7. **No A/B testing framework.** With the Model Playground supporting comparison, the logical next step is "run 50% of traffic through Model A, 50% through Model B and compare metrics."
8. **No scheduled reports.** Weekly email digest of analytics would reduce the need to check the dashboard daily.
9. **No mobile-optimized views.** Several features (Audit Log table, Webhook cards, API code examples) are desktop-first and degrade on mobile.
10. **No keyboard shortcuts anywhere.** Power users at this price tier expect `Cmd+K` command palette, `Escape` to close dialogs, and feature-specific shortcuts.

---

## Summary Scorecard

| Feature | Score | Quality Tier | "Aha Moment" |
|---------|-------|-------------|---------------|
| Logs Explorer | 6.5/10 | $79 | Search highlighting with level counts |
| Usage Analytics | 8/10 | $99 | Period-over-period change indicators |
| Knowledge Base | 8.5/10 | $109 | Test KB with similarity percentages |
| Webhooks | 8.5/10 | $119 | Delivery history with replay |
| API Access | 9/10 | $129 | Copy-paste code examples with streaming |
| Audit Log | 7.5/10 | $109 | Hash chain integrity verification |
| Model Playground | 6/10 | $89 | Side-by-side response time comparison |
| Agent Builder | 7.5/10 | $109 | AI-generated 4-file config from description |

**Overall Pro Rating: 7.7/10**

**Verdict:** Pro is a solid upgrade for developers and power users. Three features (API Access, Knowledge Base, Webhooks) punch above their weight class. Two features (Model Playground, Logs Explorer) need significant depth added. The missing team collaboration features are the biggest gap between what's promised and what's delivered.

**Recommendation priority for improvement:**
1. Add team/collaboration features (promised in upgrade prompt but not delivered)
2. Deepen Model Playground (conversation mode, history, saved comparisons)
3. Expand Logs Explorer (time range, regex, higher line limits, structured logs)
4. Add token/cost tracking across all features
5. Add keyboard shortcuts and command palette
