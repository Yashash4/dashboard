# ClawHQ Testing Report — User Perspective
**Date:** 2026-03-06
**User:** Yashash Sheshagiri (yashashsheshagiri2005@gmail.com)
**Plan:** Pro ($129/mo) | **VPS:** yashash.clawhq.tech | **Model:** kimi-k2.5

---

## How I tested
Walked through every page, every button, every action as Yashash would. Checked what shows, what's clickable, what's confusing, what's broken, what's missing.

---

## LOGIN / REGISTER

### Login Page
- [BUG] No "Forgot Password?" link — user locked out if they forget password
- [IMPROVE] No social login (Google/GitHub) — extra friction for sign up
- [IMPROVE] No "Remember me" checkbox
- [IMPROVE] After login, user lands on /dashboard — good

### Register Page
- [BUG] User registers but there's no onboarding — drops into empty dashboard with nothing to do
- [IMPROVE] No email verification step shown to user
- [IMPROVE] Should ask for name during registration (currently blank until user goes to Account)

---

## SIDEBAR NAVIGATION

- [BUG] Clicking "Overview" in sidebar goes to `/` (landing page) instead of `/dashboard` — BROKEN navigation
- [BUG] Because of the above, the "Overview" item never shows as active/highlighted
- [IMPROVE] "Monitoring" link exists in sidebar but just redirects to VPS page — confusing, should remove or build a real page
- [IMPROVE] "OpenClaw" link — unclear what this means to a new user. No tooltip or description
- [IMPROVE] Logout button has no confirmation — one accidental click and you're signed out
- [IMPROVE] User's email shows truncated with no way to see full email
- [IMPROVE] No notification bell/badge for new ticket replies

---

## OVERVIEW PAGE (/dashboard)

What Yashash sees:
- 4 stat cards: Plan (Pro), VPS (Running), Model (kimi-k2.5), Channels (1 connected)
- 2 more cards: Agents (1 deployed), Open Tickets (1)
- Quick Actions: "Open OpenClaw", "Manage VPS", "Raise Ticket"

Issues:
- [BUG] Quick Actions link to `/vps` and `/support` — should be `/dashboard/vps` and `/dashboard/support`. May 404 or go to wrong page
- [IMPROVE] "Open OpenClaw" button shows even if VPS is stopped — clicking it would show a dead page
- [IMPROVE] No "Welcome back, Yashash" greeting — feels impersonal
- [IMPROVE] No recent activity feed (e.g., "Agent deployed 2 hours ago", "Ticket reply received")
- [IMPROVE] Stat cards are not clickable — user expects clicking "VPS: Running" to go to VPS page
- [IMPROVE] Payment shows $59 (Starter payment history) but plan says Pro $129 — user might think billing is wrong
- [IMPROVE] "1 connected" for channels — doesn't say WHICH channel (Telegram). User has to go to Channels page to find out

---

## VPS PAGE (/dashboard/vps)

What Yashash sees:
- VPS status card: Running, hostname, IP address, specs (2 vCPU, 8GB RAM, 100GB)
- Start/Stop/Restart buttons
- "Open OpenClaw" button
- Live CPU/RAM charts (updates every 10 seconds)
- Network I/O chart
- Gateway health badge
- Logs panel (toggle)
- Dashboard Password section at bottom

Issues:
- [IMPROVE] No "Copy IP Address" button — user has to manually select and copy
- [IMPROVE] No "Copy Hostname" button
- [IMPROVE] Charts show last 30 minutes but no way to see historical data (yesterday, last week)
- [IMPROVE] Logs panel — no auto-scroll, no search within logs, no "Download Logs" button
- [IMPROVE] Gateway health badge says "Gateway" or nothing — should say "Online" / "Offline" clearly
- [IMPROVE] User can click Stop and Start at the same time — buttons should disable during any action
- [IMPROVE] No uptime display in human-readable format (e.g., "Up for 3 days, 5 hours")
- [IMPROVE] Disk usage not shown in the stat cards or charts
- [BUG] If VPS is stuck in "restarting" state forever, user has no way to force-stop or know something is wrong

### Dashboard Password Section
- [IMPROVE] No "Copy Password" button — user has to click reveal then manually copy
- [IMPROVE] No "Generate Random" button for new password — user has to think of one
- [IMPROVE] Username field looks editable but isn't — confusing
- [IMPROVE] No explanation of what this password is for ("This is your login for yashash.clawhq.tech")

---

## MODELS PAGE (/dashboard/models)

What Yashash sees:
- Current model card: kimi-k2.5 with 128K context
- Grid of available models (5 models)
- "Select" button on each model

Issues:
- [IMPROVE] No "Current" badge on the kimi-k2.5 card — user has to compare names to know which is active
- [IMPROVE] All models show the same vague descriptions — no comparison of strengths (speed vs quality vs coding)
- [IMPROVE] No indication of which models are "better" or recommended
- [IMPROVE] Context limit shown as "128K" but most users don't know what context means — add tooltip
- [IMPROVE] "Changes this month: 0/unlimited" for Pro — good, but Starter users see "0/1" with no explanation of why limited
- [IMPROVE] After selecting a model, no indication of whether it takes effect immediately or after restart
- [MISSING] No way to test a model before switching (e.g., "Try in chat" button)

---

## AGENTS PAGE (/dashboard/agents)

What Yashash sees:
- 1 agent card: "AI Customer Support" (deployed, free)
- Smart FAQ Bot not shown (not purchased)

Issues:
- [BUG] Only purchased agents are shown — there's no marketplace/store to browse and buy new agents
- [IMPROVE] No "Browse Marketplace" button to discover new agents
- [IMPROVE] Agent card shows "Deployed" badge but no indication of what the agent does or how to use it
- [IMPROVE] No link from agent card to Chat page ("Chat with this agent")
- [IMPROVE] No agent configuration — user can't customize the agent's behavior, name, or prompt
- [IMPROVE] Deploy/Undeploy buttons — no explanation of what deploying means (downtime? restart?)
- [MISSING] No agent analytics (messages handled, response time, success rate)

---

## CHAT PAGE (/dashboard/chat)

What Yashash sees:
- Left panel: "AI Customer Support" agent listed with green dot
- Right panel: Empty chat area with text input
- "Send" button

Issues:
- [IMPROVE] Green dot next to agent implies it's "online" — but it's always green regardless of VPS status
- [IMPROVE] If VPS is stopped, user clicks send and gets an error — should show "VPS is offline" before they type
- [IMPROVE] No message timestamps shown in chat
- [IMPROVE] No markdown rendering — code blocks, bold, links all show as plain text
- [IMPROVE] No "Copy" button on assistant messages
- [IMPROVE] Textarea doesn't auto-expand — stays 1 line even for long messages
- [IMPROVE] No typing indicator while AI is generating response
- [IMPROVE] No chat history — user comes back next day and previous messages are gone (if DB is empty)
- [IMPROVE] No "Clear Chat" or "New Conversation" button
- [IMPROVE] Agent description not shown anywhere in the chat view — user forgets what this agent is for
- [MISSING] No file/image upload in chat
- [MISSING] No way to rate responses (thumbs up/down)

---

## CHANNELS PAGE (/dashboard/channels)

What Yashash sees:
- Available channels grid: WhatsApp, Telegram, Discord, Slack, Signal, Teams, Webchat
- Telegram shows "Connected" (green badge)
- Discord shows "Pending" (no connect button since it's in pending state)
- Others show "Connect" button

Issues:
- [IMPROVE] WhatsApp and Signal show "Request Setup" instead of "Connect" — no explanation of why these are different
- [IMPROVE] After connecting a channel, no instructions on how to USE it (e.g., "Send a message to your Telegram bot at @YourBot")
- [IMPROVE] No test button ("Send Test Message") after connecting
- [IMPROVE] No QR code for WhatsApp/Telegram bot
- [IMPROVE] Webchat has no fields — after connecting, no embed code or URL provided
- [IMPROVE] Discord pending but no indication of what's wrong or next steps
- [IMPROVE] No channel statistics (messages received, messages sent, active users)
- [MISSING] No way to see channel logs or recent messages

---

## SUPPORT PAGE (/dashboard/support)

What Yashash sees:
- 2 tickets listed:
  1. "Cannot connect Discord channel" (Open, Medium priority)
  2. "12" (In Progress, High priority)
- Filter tabs: All, Open, In Progress, Resolved, Closed
- "New Ticket" button

Issues:
- [IMPROVE] Ticket "12" has nonsense subject — user clearly was testing. No way to delete test tickets
- [IMPROVE] No "Last Reply" indicator — user can't see if admin has responded without clicking into each ticket
- [IMPROVE] No unread badge — if admin replied, ticket looks the same as before
- [IMPROVE] No search within tickets
- [IMPROVE] No priority filter — only status filter
- [MISSING] No way to close/resolve a ticket from the customer side
- [MISSING] No satisfaction survey after ticket is resolved

### Ticket Detail Page
- [IMPROVE] Messages show "Customer" and "Admin" labels — should show actual names (Yashash, Support Team)
- [IMPROVE] No "Mark as Resolved" button for customer
- [IMPROVE] Reply box is at the bottom — on long threads user has to scroll all the way down
- [IMPROVE] No file attachments on replies
- [IMPROVE] No email notification when admin replies — user has to keep checking manually
- [IMPROVE] Closed tickets still show reply box — should be disabled with "This ticket is closed" message

### New Ticket Page
- [IMPROVE] No category selection (billing, technical, general)
- [IMPROVE] No suggested articles before submitting ("Have you tried...?")
- [IMPROVE] No auto-fill subject when coming from channels page ("Request Setup" should pre-fill)

---

## BILLING PAGE (/dashboard/billing)

What Yashash sees:
- Current plan: Pro ($129/month, active)
- Plan comparison cards: Starter ($59), Pro ($129, current), Enterprise ($499)
- Payment history: 1 entry — $59.00 Starter plan payment

Issues:
- [BUG] Payment history shows $59 Starter payment but user is on Pro plan — where's the Pro payment? Looks like billing is broken
- [BUG] "Upgrade" buttons on plan cards are all disabled — user literally cannot upgrade or change plans
- [MISSING] No "Cancel Subscription" option — user is stuck
- [MISSING] No "Update Payment Method" — user can't change credit card
- [MISSING] No "Download Invoice" or receipt for tax purposes
- [MISSING] No next billing date shown — user doesn't know when they'll be charged
- [IMPROVE] Enterprise card shows "Contact Us" but no phone number, just email — feels impersonal
- [IMPROVE] No billing cycle toggle (monthly vs annual) with savings shown
- [IMPROVE] No proration info if switching plans mid-cycle
- [IMPROVE] Plan features list is text-only — no checkmarks or visual comparison

---

## ACCOUNT PAGE (/dashboard/account)

What Yashash sees:
- Name: "Yashash Sheshagiri" (editable)
- Email: "yashashsheshagiri2005@gmail.com" (read-only)
- Role: "customer" badge
- Change Password section

Issues:
- [IMPROVE] Role shows "customer" — this is internal jargon, should say "Member" or hide it entirely
- [IMPROVE] Email is read-only with no way to change — should at least show "Contact support to change email"
- [IMPROVE] Change Password doesn't require current password — security risk (if someone has access to their session)
- [IMPROVE] No profile photo
- [IMPROVE] No timezone setting
- [IMPROVE] No notification preferences (email notifications on/off)
- [IMPROVE] No "Delete Account" option (GDPR compliance issue)
- [IMPROVE] No "Connected Devices" or "Active Sessions" view
- [MISSING] No 2FA (Two-Factor Authentication) option

---

## OPENCLAW PAGE (/dashboard/openclaw)

What Yashash sees:
- Embedded iframe of yashash.clawhq.tech
- Small "Open in new tab" button

Issues:
- [IMPROVE] If VPS is stopped, iframe shows blank/error page — no helpful message
- [IMPROVE] No loading spinner while iframe loads
- [IMPROVE] "Open in new tab" button is easy to miss
- [IMPROVE] No explanation of what OpenClaw dashboard is or what user can do there
- [BUG] If user's VPS has Basic Auth enabled, the iframe will show a login popup INSIDE the iframe — awkward UX, credentials needed but not shown

---

## MONITORING PAGE (/dashboard/monitoring)

What Yashash sees:
- Immediately redirected to VPS page

Issues:
- [BUG] This is a dead page that just redirects — shouldn't exist in sidebar
- [IMPROVE] If keeping it, build a real monitoring page with: historical graphs, uptime percentage, alert history, bandwidth usage over time

---

## ADMIN PANEL (for admin user apexitsolutions.pvtltd@gmail.com)

### Admin Customer Detail Page (/admin/customers/[id])
- Shows Yashash's data: subscription, VPS, model, agents, channels, tickets
- Dashboard Access card: username + password (NEW)
- API Keys card: Ollama key configured

Issues:
- [BUG] Dashboard Access card shows nothing if VPS was deployed before this feature — need to manually set credentials for existing users
- [IMPROVE] No "SSH into VPS" quick action for admin
- [IMPROVE] No "Restart Gateway" button for admin
- [IMPROVE] No quick "Change Plan" action — admin has to go to Supabase directly
- [IMPROVE] No activity log showing what admin has done for this customer
- [IMPROVE] Ticket section only shows last 5 — no "View All" link

### Admin Deploy Page
- [IMPROVE] After deploying, no automatic setup of API keys — admin has to go back to customer detail and add keys manually. Should be one flow.
- [IMPROVE] No progress percentage — user sees step names but not how many total steps

---

## LANDING PAGE (clawhq.tech)

- Not in scope (built by co-founder) but login/register buttons should be visible

---

## OVERALL USER EXPERIENCE ISSUES

### Onboarding
- [MISSING] New user registers → lands on empty dashboard → no idea what to do next
- [MISSING] No getting started guide, checklist, or wizard
- [MISSING] No welcome email with next steps

### Notifications
- [MISSING] No in-app notifications at all — no bell icon, no badge counts
- [MISSING] No email notifications for anything (ticket replies, VPS down, plan expiring)
- [MISSING] No browser push notifications

### Navigation
- [IMPROVE] No breadcrumbs on any page
- [IMPROVE] No keyboard shortcuts
- [IMPROVE] No global search (Cmd+K)

### Data Freshness
- [IMPROVE] Only VPS page auto-refreshes — every other page shows stale data until manual refresh
- [IMPROVE] No "Last updated X seconds ago" indicator anywhere except VPS

### Mobile
- [IMPROVE] Sidebar doesn't collapse on mobile — takes up full screen
- [IMPROVE] Charts on VPS page are too small on mobile
- [IMPROVE] Tables overflow on small screens

### Consistency
- [IMPROVE] Some pages show "No data" messages, others show nothing
- [IMPROVE] Some actions have confirmation dialogs, others don't (logout has none, stop VPS has one)
- [IMPROVE] Toast notifications sometimes appear, sometimes page redirects before user sees them

---

## PRIORITY SUMMARY

### P0 — Fix Now (Broken)
1. Sidebar "Overview" link goes to `/` instead of `/dashboard`
2. Overview Quick Actions link to wrong paths (`/vps` instead of `/dashboard/vps`)
3. Monitoring page is a dead redirect — remove from sidebar
4. Billing: Upgrade buttons all disabled — user literally cannot change plans
5. OpenClaw iframe + Basic Auth = login popup inside iframe (bad UX after password feature)
6. Dashboard Access card empty for pre-existing VPS (Yashash's current deployment)

### P1 — Fix Soon (Bad UX)
1. No "Forgot Password?" on login
2. No email notifications for ticket replies
3. No unread indicator on tickets
4. No "Mark as Resolved" for customers on tickets
5. No explanation of what Dashboard Password is for
6. Chat: no message timestamps, no markdown, no copy button
7. Billing: no next billing date, no cancel option
8. Account: password change doesn't require current password
9. VPS: buttons not disabled during actions (can click Start + Stop)

### P2 — Improve (Polish)
1. Add onboarding wizard for new users
2. Add in-app notification system
3. Make stat cards clickable on Overview
4. Add "Current" badge on active model
5. Add channel usage stats
6. Add agent marketplace/store
7. Add chat history persistence
8. Add breadcrumbs to all pages
9. Show actual names in ticket messages instead of "Customer"/"Admin"
10. Add copy buttons everywhere (IP, hostname, password, messages)

### P3 — Future (Nice to Have)
1. Social login
2. 2FA
3. Profile photos
4. Historical monitoring graphs
5. Invoice downloads
6. File attachments in tickets/chat
7. Dark/light mode toggle
8. Global search (Cmd+K)
9. Agent analytics
10. Webhook notifications
