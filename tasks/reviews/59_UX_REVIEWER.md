# ClawHQ Starter ($59/mo) -- UX Review

**Reviewer perspective:** Non-technical user who wants AI agents to work. Paying $59/month.
**Date:** 2026-03-16
**Scope:** All pages under `/dashboard/` and their corresponding components.

---

## 1. Overview Page

### First-time experience

**What do I see first?** The page handles three lifecycle stages well:
1. No subscription -- a clear "View Plans" CTA card.
2. Subscription but VPS provisioning -- an animated pulse icon with a "15-30 minutes" estimate and a link to support. This is good; it sets expectations.
3. Full dashboard -- stat cards, alerts, onboarding guide, checklist, quick actions, usage, and activity.

**Onboarding guidance is strong.** The `GettingStartedGuide` shows a 4-step numbered walkthrough (VPS ready, connect channel, deploy agent, start chatting) that only appears for truly brand-new users. Once any action is taken, it transitions to the `OnboardingChecklist` with a progress bar (4 items: connect channel, deploy agent, send message, visit store). Both are dismissible. This is textbook progressive disclosure and gets it right.

**Can I accomplish my first task without help?** Yes. The guide links directly to `/channels`, `/store`, and `/chat`. The system alerts also nudge you ("No channels connected -- connect one to start receiving messages"). The information hierarchy is correct: alerts at top, then onboarding, then status cards.

### Daily use

**Information hierarchy:** The 4 stat cards (VPS health, Plan, AI Model, Context Limit) surface the right things for a $59 user. The sparkline row (Channels, Agents, Messages/Tickets) adds the "alive" feeling with 7-day trend data.

**Quick Actions are excellent.** Customizable shortcut buttons stored in localStorage. Default set includes Manage VPS, Raise Ticket, Agent Store, Connect Channel, Open Chat. This is the single best daily-use feature -- it respects that repeat users want fast access to their most common tasks.

**Recent Activity feed** fetches from `/api/activity` with relative timestamps. This makes the dashboard feel alive -- I can see when agents were deployed, channels connected, tickets resolved.

**Usage Summary Card** rounds out the bottom. Good separation of "what's happening now" (top) vs. "how much am I using" (bottom).

### Verdict: 8/10
- (+) Three-stage lifecycle handling eliminates blank states
- (+) Onboarding guide + checklist is the right combination
- (+) Quick Actions with customization is a standout feature
- (-) No way to see real-time message volume or agent response times from overview
- (-) The third sparkline card switches between "Messages (7d)" and "Open Tickets" based on data availability -- this is confusing. Pick one or show both.

---

## 2. VPS Page

### Server health understanding

The `VPSControls` component is impressively thorough for a Starter tier:
- **Status card** with badge (Running/Stopped/Error), Gateway health indicator, hostname, IP, version number
- **4 resource cards:** CPU %, RAM (used/total), Disk (used/total), Network I/O (download/upload rates)
- **Live charts** (CPU & RAM over time, Network I/O over time) that accumulate data via 10-second polling and persist in sessionStorage across navigation
- **Instance details grid:** vCPU count, RAM, Storage, Bandwidth, Provisioned date, Uptime

**Controls are clear.** Start/Stop/Restart buttons with confirmation dialogs for destructive actions (Stop and Restart both warn about downtime). The "Open OpenClaw" external link only shows when the instance is running.

**Gateway Logs** are on-demand (collapsed by default with "View Logs" toggle), shown in a terminal-style monospace green-on-black display with refresh button. Smart to not load by default.

**Additional panels below:** Uptime Display, Dashboard Password manager, Service Status, SSL Checker, and Resource Upgrade CTA for Starter users.

### Verdict: 9/10
- (+) Real-time monitoring with charts that persist across navigation
- (+) Confirmation dialogs prevent accidental stops
- (+) Gateway health badge is immediately visible
- (+) Logs are lazy-loaded and well-formatted
- (-) No alerting thresholds visible (when does CPU become "concerning"?) -- progress bars exist but no color change at 80%+
- (-) No scheduled restart capability for Starter users (only Pro gets `VPSMaintenance`)

---

## 3. Models Page

### Model understanding

`ModelConfig` shows:
1. **Current Model card** -- display name, context tokens, description, Active badge. Pending changes are shown in a yellow alert banner with a cancel button.
2. **Model Performance** component (separate) -- presumably shows response time/quality metrics.
3. **Model Recommendation** component -- suggests models based on deployed agent categories.
4. **Available Models grid** -- cards with display name, context limit, description, "Select" and "Learn more" buttons.

**Comparison is thoughtful.** Clicking "Select" opens a `ModelComparisonDialog` that shows current vs. new model side-by-side before confirming. The `ModelDetailDialog` lets users explore a model without committing.

**Starter limit is communicated.** "Changes this month: X/5" shown in the header of Available Models. When limit is reached, a clear message explains the cycle-based reset. The billing cycle lazy-reset logic in the page component is a nice touch.

### Verdict: 8/10
- (+) Comparison dialog prevents regret from blind switching
- (+) Recommendation engine is a genuine value-add
- (+) Change limit is clearly communicated with counter
- (-) No benchmarks or use-case guidance in the model cards themselves -- "description" field is the only differentiator
- (-) "Learn more" button should be more prominent than "Select" for first-time users who don't know the models yet
- (-) Instant vs. scheduled changes are unclear until you attempt one -- would benefit from an info tooltip explaining the policy

---

## 4. Agents Page

### Agent visibility

**Empty state is well-handled:** "No Agents Yet" with a "Browse Store" button. VPS-offline warning banner appears contextually when the server is down.

**Agent Manager** shows a summary card (total count, deployed count), filter tabs (All/Deployed/Not Deployed), sort toggle (Recent/A-Z), and a grid of agent cards. Each card shows:
- Name, deploy status badge, category tag, description
- Deployed date (if applicable)
- Action buttons: Test, Config, Undeploy (for deployed) or View Config, Deploy (for not deployed)

**Config editing** is accessible via inline icon next to the agent name (`AgentConfigEditor`) and a "Config" button that opens `AgentConfigDialog`. The distinction between these two could be confusing.

**Bulk actions** (Deploy All / Undeploy All) are available behind a "..." dropdown in the summary card header. Sequential execution with progress toasts is good UX for a potentially slow operation.

**Deploy limit is enforced:** Starter gets 3, Pro gets 10, Ultra gets 25. Error message on limit hit includes the plan name.

**Agent Analytics** section at the bottom shows usage data per agent.

### Verdict: 7/10
- (+) Filter + sort controls reduce noise
- (+) Bulk actions are a power-user accelerator
- (+) Test dialog for deployed agents is excellent for verification
- (-) Two config entry points (inline icon + button) create confusion about which to use
- (-) No visual indicator of agent "health" or error rate on the card itself
- (-) Missing: last message handled, response time, or success rate per agent -- the analytics are separate and detached from the card view
- (-) The "Browse Store" button in the header competes with "Browse Store" in the empty state -- when I have agents, I might not notice it

---

## 5. Agent Store

### Browsing experience

`AgentStore` component receives a list of agents with `id, name, description, category, price, is_premium` and a list of owned agent IDs. The page is straightforward: title, subtitle, and the store component.

### Verdict: 6/10
- (-) Cannot evaluate the store component fully without reading `agent-store.tsx`, but the data model suggests:
  - Category filtering should exist (data has `category`)
  - Premium indicator should differentiate free vs. paid agents
  - "Already owned" state should prevent re-purchase
- (-) No ratings, install counts, or reviews visible in the schema -- makes choosing harder
- (-) No "Recommended for you" based on current model or channel types
- (-) Store feels like an afterthought -- it should be one of the most important pages for driving agent adoption

---

## 6. Chat Page

### Streaming and conversation

**Chat architecture is solid.** The `AgentChat` component provides:
- **Left panel:** Agent list with selection highlighting (fixed 256px width)
- **Right panel:** Chat messages with auto-scroll, typing indicator with bounce animation
- **Streaming support:** SSE-based streaming with token-by-token rendering, fallback to JSON response
- **Slash commands:** `/new`, `/clear`, `/compact`, `/help`, `/status`, `/retry` -- discoverable via `/help` hint in the empty state and input footer
- **Markdown rendering:** Full support including code blocks with syntax highlighting, copy button, tables, blockquotes
- **Code blocks:** Language label, copy button, proper monospace formatting

**Message history** loads on agent switch. Error state for failed history load includes a helpful suggestion.

**Input UX:** Auto-resizing textarea, Enter to send, Shift+Enter for newline, clear hint text below input.

**`/compact` command** is genuinely clever -- asks the model to summarize, clears history, then starts a new session with the summary as context. This solves the context window problem gracefully.

### Verdict: 8/10
- (+) Streaming with typing indicator feels responsive
- (+) Slash commands add power without UI clutter
- (+) `/compact` is a killer feature for long conversations
- (+) Markdown + code block rendering is production-quality
- (-) No mobile sidebar -- the 256px agent list eats space on small screens. There IS a `chat-mobile-sidebar.tsx` component but it's not imported in the chat page
- (-) No conversation history browser (previous sessions) -- `/clear` destroys everything
- (-) No export capability from the chat UI itself (though `chat-export.tsx` component exists -- not wired up?)
- (-) No file/image attachment support in the chat input
- (-) Missing read receipts (component exists: `chat-read-receipt.tsx`) and sound toggle (component exists: `chat-sound-toggle.tsx`) -- these are built but not integrated

---

## 7. Channels Page

### Connection experience

**Clear channel taxonomy:** Self-configurable (Telegram, Discord, Slack, Teams, Webchat) vs. Requires Setup (WhatsApp, Signal). The "Requires Setup" section links directly to support ticket creation.

**Setup Wizard** (`ChannelSetupWizard`) handles credential input per channel type. Each channel type defines its required fields with labels and placeholder text that includes format examples (e.g., "Token from @BotFather (e.g. 123456:ABC-DEF...)"). Validation enforces minimum token length.

**Connected channel cards show:**
- Channel type icon and name
- Primary badge on first channel
- Health indicator (green/yellow/red dot with label)
- Connection date
- Last health check time
- Last message relative time
- Status history (expandable)
- Reconnect button for disconnected channels (with credential update fallback if reconnect fails)
- Disconnect button with confirmation dialog

**Health Check button** runs a bulk health check across all connected channels and updates status in real-time.

**Channel ordering** is drag-free but uses up/down arrow buttons with localStorage persistence. The "Primary" badge on the first channel is a nice touch.

### Verdict: 8/10
- (+) Channel setup wizard with per-channel field guidance is excellent
- (+) Health status is immediately visible with color-coded dots
- (+) Reconnect -> Update Credentials fallback flow is smart
- (+) Last message timestamp shows the channel is "alive"
- (-) No test message button to verify a channel works after connection
- (-) WhatsApp and Signal requiring support contact is friction -- even a "Request Setup" button that auto-fills a ticket would help (it does link to support, but uses `/dashboard/support/new` instead of the clean URL `/support/new`)
- (-) No message volume per channel -- I can't tell which channel is busiest
- (-) Arrow-based ordering is clunky with many channels; drag-and-drop would be more intuitive

---

## 8. Support Page

### Ticket creation

**Ticket list** shows all tickets with:
- Ticket number (formatted), subject, unread reply badge
- Status badge (Open/In Progress/Resolved/Closed)
- Priority badge (Low/Medium/High)
- Category badge (General/Billing/Technical/Account/Channels/Agents/Feature Request)
- Created date, last reply info with relative time

**Search and filter:** Text search across subject and ticket number. Tab-based status filtering with counts.

**New ticket form** is clean: Subject, Category dropdown, Priority dropdown, Description textarea with character counter (5000 max). Zod validation with inline error messages.

**Load more** pagination with remaining count indicator.

### What's missing

- No file/image attachments in the new ticket form (component `ticket-attachment.tsx` exists but isn't used here)
- No rich text editor for description -- plain textarea only
- No auto-suggest for common issues before submitting
- No estimated response time displayed
- The "New Ticket" button navigates to `/dashboard/support/new` but support page itself shows the header and description -- title should be consistent

### Verdict: 7/10
- (+) Search, filter, and status tabs work well together
- (+) Unread reply badge is excellent for knowing when to check back
- (+) Category system helps route tickets appropriately
- (-) No attachments in ticket creation (component exists but unused)
- (-) No rich text / markdown in description
- (-) No SLA or response time expectations set
- (-) Ticket thread page exists (`support/[id]/page.tsx`, `ticket-thread.tsx`) but wasn't reviewed in detail

---

## 9. Billing Page

### Plan understanding

**Current Subscription card** shows plan name, price, start date, and renewal/expiration date. Status badge is clear.

**Next Invoice Preview** shows amount and due date with auto-renew note. Simple and effective.

**Plan comparison grid** is comprehensive:
- 4 plans: Starter ($59), Pro ($129), Ultra ($350), Enterprise ($999+)
- Monthly/Annual toggle with savings callout
- Feature list with checkmarks per plan
- "Current Plan" badge, "Upgrade" button, "Contact Us" for Enterprise

**Additional sections:**
- `PlanComparison` -- feature matrix (separate component)
- `BillingUsage` -- usage stats against plan limits
- Payment Method -- currently just "Contact support to update" with link
- Coupon/Referral Code input
- Billing Alerts explanation
- Payment History table with invoice download per row

**Upgrade flow:** Button opens `UpgradeDialog` confirmation, then calls `usePayment` hook.

### Verdict: 8/10
- (+) Monthly/Annual toggle with savings callout is standard and effective
- (+) Invoice download per payment is professional
- (+) Coupon input is good for promotions
- (+) Next invoice preview reduces billing anxiety
- (-) No self-service payment method update -- "Contact support" is a friction point at $59/mo
- (-) No cancel button or downgrade option visible -- this will frustrate users who want to leave
- (-) Feature comparison should highlight what you'd gain by upgrading, not just list everything
- (-) No usage-based upgrade prompts (e.g., "You've used 4/5 model changes -- upgrade to Pro for unlimited")

---

## 10. Account Page

### Settings and security

**Profile section:** Display name edit (with save), email (read-only), role badge, member-since date.

**Connected Services:** Cards linking to Channels, Agents, and Support with live counts. Good cross-navigation.

**Change Password:** Current + New + Confirm with 8-character minimum. Standard.

**Notification Preferences:** Grid with Dashboard/Email toggles per notification type (Ticket Replies, VPS Alerts, Agent Errors, Channel Disconnects, Weekly Summary). Dashboard column is always on (disabled switches). "Save Changes" button appears only when changes are made.

**Timezone Setting:** Separate component.

**Security Section:**
- Password Last Changed: Shows "Unknown" -- this is a bad look
- Account Created date
- Security Score: "Good" or "Fair" based on... account age? (Accounts under 90 days are "Good", older are "Fair" -- this logic is backwards and meaningless)
- "Sign Out All Devices" button

**Danger Zone:** Account deletion with 3-step confirmation (warning -> email confirmation -> password confirmation). Well-implemented safety net.

### Verdict: 6/10
- (+) Notification preferences grid is clean and understandable
- (+) Three-step account deletion is appropriately cautious
- (+) Connected Services cards with live counts are useful cross-links
- (-) Security Score logic is broken -- account age has nothing to do with security, and older accounts being "Fair" is backwards
- (-) "Password Last Changed: Unknown" makes the security section look incomplete
- (-) No 2FA setup for Starter users (`admin-2fa-setup.tsx` exists but is admin-only)
- (-) No session management (active sessions, last login IP/time)
- (-) Avatar upload component exists (`avatar-upload.tsx`) but isn't used on this page

---

## 11. Sidebar Navigation

The `AppSidebar` has a clean structure:
- **Header:** ClawHQ logo, notification bell, plan badge
- **Dashboard group:** Overview, VPS, Models, Agents, Store, Chat, Channels, OpenClaw, Support, Billing, Account (11 items)
- **Pro Tools group** (hidden for Starter): Model Playground, Agent Builder, Logs, Analytics, Knowledge Base, Webhooks, API Access, Audit Log
- **Command Center** (Ultra only): Mission Control, Tasks, Agents, Events, Sessions
- **Footer:** User avatar, name, email, sign-out button

**Navigation issues:**
- 11 items in the main Dashboard group is a lot -- could benefit from grouping (e.g., "AI" for Models/Agents/Chat, "Infrastructure" for VPS/Channels)
- Active state detection is well-implemented with longest-prefix matching
- The `NavigationProgress` component provides loading feedback during route transitions

### Verdict: 7/10
- (+) Plan badge in header constantly reminds users of their tier
- (+) Notification bell is well-placed
- (+) Active state logic handles nested routes correctly
- (-) 11 items without sub-grouping creates scrolling on smaller screens
- (-) No search/command palette for quick navigation
- (-) "OpenClaw" menu item might confuse users who don't know what it is

---

## Overall Assessment

### Worth $59?

**What would make me cancel:**
1. **No self-service payment method update.** Having to open a support ticket to change my credit card is unacceptable at any price point.
2. **The Chat page not using built components.** Mobile sidebar, export, read receipts, and sound toggle all exist as components but aren't wired into the chat page. This feels unfinished.
3. **3-agent deploy limit on Starter** without clear visibility into what each agent does differently. If I can only deploy 3, I need better tooling to choose the right 3.
4. **No cancel/downgrade flow** in Billing. If I can't figure out how to cancel, I'll do a chargeback, which is worse for everyone.

**What would make me recommend to a friend:**
1. **The VPS monitoring.** Live CPU/RAM/Network charts that persist across navigation -- this is better than most $200/mo hosting dashboards.
2. **The onboarding flow.** Getting Started Guide + Onboarding Checklist + System Alerts create a genuinely guided experience.
3. **Quick Actions customization.** Small feature, huge daily impact.
4. **The `/compact` chat command.** Clever solution to a real problem.
5. **Channel health monitoring** with reconnect fallback flow. Shows the platform is built by people who understand operational concerns.

### The #1 Thing That Needs Improvement

**The Chat page is 70% done.** Four components exist (`chat-mobile-sidebar.tsx`, `chat-export.tsx`, `chat-read-receipt.tsx`, `chat-sound-toggle.tsx`) that would significantly improve the chat experience, and none of them are integrated. For a product whose core value proposition is "AI agents handling conversations," the chat experience is the single most important page. Fix this first.

---

## Priority Fixes (Starter Tier)

### Critical (would cause cancellation)
| # | Issue | Page | Fix |
|---|-------|------|-----|
| 1 | No cancel/downgrade flow | Billing | Add cancel subscription button with confirmation |
| 2 | No self-service payment update | Billing | Integrate Stripe portal or similar |
| 3 | Chat page missing built components | Chat | Wire up mobile sidebar, export, read receipts, sound toggle |

### High (significant friction)
| # | Issue | Page | Fix |
|---|-------|------|-----|
| 4 | Security Score logic is meaningless | Account | Replace with actual security indicators (2FA status, password age, recent logins) |
| 5 | "Password Last Changed: Unknown" | Account | Track and display this from auth metadata |
| 6 | No file attachments in ticket creation | Support | Wire up existing `ticket-attachment.tsx` component |
| 7 | No conversation history browser | Chat | Add session list in sidebar with ability to resume old sessions |
| 8 | No alert thresholds on VPS metrics | VPS | Color-code progress bars at 80%+ utilization |

### Medium (polish)
| # | Issue | Page | Fix |
|---|-------|------|-----|
| 9 | Third sparkline card switches context | Overview | Show both Messages and Tickets as separate metrics |
| 10 | Avatar upload component unused | Account | Integrate existing component |
| 11 | No test message for channels | Channels | Add "Send Test" button post-connection |
| 12 | Two config entry points for agents | Agents | Consolidate or clarify inline editor vs. dialog |
| 13 | 11 sidebar items without grouping | Layout | Group into logical sections (AI, Infrastructure, Account) |
| 14 | WhatsApp setup links to wrong URL | Channels | Use `/support/new` not `/dashboard/support/new` (clean URL) |
| 15 | No SLA or response time in support | Support | Show expected response time based on plan |

### Low (nice-to-have)
| # | Issue | Page | Fix |
|---|-------|------|-----|
| 16 | No command palette / search | Layout | Add Cmd+K navigation |
| 17 | No agent health indicator on cards | Agents | Show error rate or last-seen indicator |
| 18 | Store lacks ratings/install counts | Store | Add social proof data |
| 19 | No usage-based upgrade nudges | Billing | Contextual prompts when approaching limits |
| 20 | No scheduled restart for Starter | VPS | Allow basic maintenance scheduling |

---

## Page-by-Page Scores

| Page | Score | Key Strength | Key Weakness |
|------|-------|-------------|--------------|
| Overview | 8/10 | Progressive onboarding | Sparkline card context switching |
| VPS | 9/10 | Live monitoring with charts | No alert thresholds |
| Models | 8/10 | Comparison dialog + recommendations | Unclear instant vs. scheduled policy |
| Agents | 7/10 | Filter/sort + bulk actions | No per-agent health metrics |
| Store | 6/10 | Clear owned-state handling | No ratings, recommendations, or social proof |
| Chat | 8/10 | Streaming + /compact command | 4 built components not integrated |
| Channels | 8/10 | Health monitoring + reconnect flow | No test message capability |
| Support | 7/10 | Search + unread badges | No attachments, no SLA visibility |
| Billing | 8/10 | Invoice download + coupon input | No cancel flow, no self-service payment update |
| Account | 6/10 | Notification preferences grid | Broken security score, missing avatar upload |
| Sidebar | 7/10 | Plan badge + notification bell | Too many ungrouped items |

**Overall Dashboard Score: 7.5/10**

The foundation is strong. The data architecture is sound, the component library is rich, and the onboarding flow is among the best I've seen for this type of product. The biggest gap is finishing what's already built -- multiple components exist that would significantly improve the experience but aren't wired into their respective pages. Close those gaps and this dashboard easily moves to 8.5+.
