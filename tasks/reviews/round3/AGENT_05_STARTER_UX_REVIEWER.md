# Agent 05 — Starter Dashboard — UX Reviewer Review

**Total Issues Found: 32**
- CRITICAL: 4
- HIGH: 10
- MEDIUM: 12
- LOW: 6

---

## Navigation & Information Architecture

### [UX-01] — Sidebar logout button has no accessible label text
**File:** `src/components/dashboard/app-sidebar.tsx:373-379`
**Severity:** HIGH
**Description:** The logout button in the sidebar footer uses only `title="Sign out"` rather than `aria-label`. The `title` attribute is not reliably announced by screen readers, so the button is effectively unlabeled for assistive technology users.
**User Impact:** Screen reader users cannot identify the logout action. They hear "button" with no context.
**Recommendation:** Add `aria-label="Sign out"` to the button element alongside the existing `title`.

---

### [UX-02] — Sidebar navigation has no skip-to-content link
**File:** `src/app/layout.tsx:40-46`
**Severity:** HIGH
**Description:** The layout has no skip navigation link. Keyboard-only users must tab through every sidebar item (up to 20+ links across all groups) before reaching main content on every page load.
**User Impact:** Keyboard users face significant navigation overhead, especially on pages they visit frequently.
**Recommendation:** Add a visually-hidden skip link as the first focusable element in the layout: `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to content</a>` and add `id="main-content"` to the main content area.

---

### [UX-03] — OpenClaw nav item visible to Starter users but gates to upgrade wall
**File:** `src/components/dashboard/app-sidebar.tsx:68-73` and `src/app/dashboard/openclaw/page.tsx:41-51`
**Severity:** MEDIUM
**Description:** The "OpenClaw" sidebar link appears in the "Agents & Channels" group for all users including Starter plan, but Starter users see an UpgradePrompt when they click it. This is a confusing dead end.
**User Impact:** Starter users click a visible nav item expecting functionality but hit a paywall, causing frustration. No visual indication (lock icon, "Pro" badge) on the sidebar item warns them beforehand.
**Recommendation:** Either hide the OpenClaw nav item for Starter users, or add a lock icon / "Pro" badge next to the item in the sidebar to signal the gate before clicking.

---

### [UX-04] — Sidebar plan badge has no accessible meaning
**File:** `src/components/dashboard/app-sidebar.tsx:194-201`
**Severity:** LOW
**Description:** The plan badge in the sidebar header (e.g., "STARTER") is purely visual with no `aria-label`. Screen readers will read just the text, but there is no context that this represents the user's current plan tier.
**User Impact:** Minor confusion for screen reader users about what "STARTER" means in context.
**Recommendation:** Add `aria-label="Current plan: starter"` or wrap in a descriptive element.

---

## Missing Feedback & Loading States

### [UX-05] — Error pages have no retry mechanism on several pages
**File:** `src/app/dashboard/models/page.tsx:59-65`, `src/app/dashboard/chat/page.tsx:42-49`, `src/app/dashboard/channels/page.tsx:55-62`
**Severity:** HIGH
**Description:** Multiple pages show "Something went wrong ... Please refresh the page" as the only error recovery, with no actionable button. The VPS page (line 64) correctly includes a "Try Again" link, but Models, Chat, Channels, Support, and Store pages do not.
**User Impact:** Users see a dead-end error screen and must manually refresh the browser. Less tech-savvy users may not know how to refresh or may abandon the page entirely.
**Recommendation:** Add a "Try Again" / "Refresh" button consistently across all error states, matching the pattern already used in the VPS page.

---

### [UX-06] — Ticket attachment upload only shows after ticket is created, then immediately navigates away
**File:** `src/app/dashboard/support/new/page.tsx:172-178` and `src/app/dashboard/support/new/page.tsx:81`
**Severity:** HIGH
**Description:** The `TicketAttachmentUpload` component is conditionally rendered after `ticketId` is set, but `router.push(\`/support/${data.ticket_id}\`)` fires on line 81 immediately after setting the ticket ID. The user is redirected before they can see or use the attachment upload interface.
**User Impact:** Attachment upload is effectively inaccessible. Users can never add attachments when creating tickets.
**Recommendation:** Either (a) move attachment upload to the ticket detail/thread page, or (b) delay navigation until attachments are uploaded, or (c) add a two-step flow where the user submits the ticket first, then is prompted to add attachments before being redirected.

---

### [UX-07] — Bulk agent deploy/undeploy shows per-item toast spam
**File:** `src/components/dashboard/agent-manager.tsx:250-253`
**Severity:** MEDIUM
**Description:** During bulk deploy/undeploy, a `toast.info()` fires for every single agent in the loop (line 252). If a user has 10+ undeployed agents, they get 10+ sequential toast notifications stacking up.
**User Impact:** Toast spam overwhelms the UI. Users cannot read individual toasts, and the toast queue may persist for a long time, covering important UI elements.
**Recommendation:** Replace per-item toasts with a single progress indicator (e.g., a progress bar in the card header or a single updating toast) that shows "Deploying 3/10..." and updates in place.

---

### [UX-08] — No loading state when navigating between dashboard pages
**File:** `src/components/dashboard/navigation-progress.tsx:1-71`
**Severity:** LOW
**Description:** The NavigationProgress component exists and shows a thin progress bar at the top during navigation. However, the main content area has no skeleton/loading state during server-side page transitions. Since all dashboard pages use server components with async data fetching, there can be a noticeable blank period.
**User Impact:** Users may perceive the app as frozen during slow data loads, especially on the Overview page which makes 6 parallel queries.
**Recommendation:** Consider adding `loading.tsx` files in key dashboard routes to show skeleton states during page transitions.

---

## Accessibility (WCAG 2.1 AA)

### [UX-09] — Channel ordering buttons are too small for touch targets
**File:** `src/components/dashboard/channel-manager.tsx:585-604`
**Severity:** CRITICAL
**Description:** The channel reorder buttons (up/down arrows) have `className="h-6 w-6"` which renders as 24x24 pixels. WCAG 2.1 AA requires a minimum touch target of 44x44 CSS pixels for interactive elements.
**User Impact:** Mobile users will have extreme difficulty tapping these buttons. Accidental taps on adjacent elements are likely.
**Recommendation:** Increase the button size to at least `h-11 w-11` (44px) or add sufficient padding/spacing to meet the 44px minimum target area.

---

### [UX-10] — Agent filter buttons and sort select lack sufficient touch targets
**File:** `src/components/dashboard/agent-manager.tsx:358-379`
**Severity:** HIGH
**Description:** Filter buttons use `px-2.5 py-1 text-xs` resulting in touch targets well below 44px. The native `<select>` element on line 372-379 has `px-2 py-1` and `text-xs`, making it approximately 24px tall.
**User Impact:** Mobile users struggle to tap the correct filter or select the sort option.
**Recommendation:** Increase padding to at least `py-2.5 px-4` on filter buttons and ensure the select element meets 44px minimum height.

---

### [UX-11] — Chat send button meets target size but textarea lacks visible focus ring
**File:** `src/components/dashboard/agent-chat.tsx:662`
**Severity:** MEDIUM
**Description:** The chat textarea uses `focus:outline-none focus:ring-1 focus:ring-primary`. While it does have a focus indicator, `ring-1` (1px) on a dark background with the sage green accent color may not provide sufficient 3:1 contrast for the focus indicator against adjacent colors.
**User Impact:** Users who rely on keyboard navigation may have difficulty seeing where focus currently is in the chat input area.
**Recommendation:** Use `focus:ring-2` for a more visible focus indicator, or add a focus border style with higher contrast.

---

### [UX-12] — Hardcoded color values used instead of CSS variables throughout
**File:** `src/components/dashboard/vps-resource-cards.tsx:43-46`, `src/components/dashboard/agent-manager.tsx:407-408`, `src/components/dashboard/channel-manager.tsx:562-567`
**Severity:** MEDIUM
**Description:** Multiple components use hardcoded Tailwind color classes like `text-red-500`, `text-yellow-500`, `bg-green-600`, `border-yellow-500/30` instead of the CSS variable system defined in globals.css (`--success`, `--warning`, `--error`). The CLAUDE.md design system explicitly forbids this.
**User Impact:** If the theme is changed via globals.css, these status colors will not update, breaking the design system's promise that editing one file updates the entire site.
**Recommendation:** Replace all hardcoded status colors with CSS variable equivalents: `text-[var(--error)]`, `text-[var(--warning)]`, `bg-[var(--success)]`, etc.

---

### [UX-13] — Notification bell button lacks aria-label
**File:** `src/components/dashboard/notification-bell.tsx:107`
**Severity:** HIGH
**Description:** The notification bell trigger button has no `aria-label`. Screen readers will announce it as just "button" since the only content is an SVG icon.
**User Impact:** Screen reader users cannot identify the notification bell button or understand that it shows notifications.
**Recommendation:** Add `aria-label="Notifications"` or `aria-label={unreadCount > 0 ? \`${unreadCount} unread notifications\` : "Notifications"}` for dynamic context.

---

### [UX-14] — Agent store search input lacks associated label
**File:** `src/components/dashboard/agent-store.tsx:117-123`
**Severity:** MEDIUM
**Description:** The search input in the Agent Store uses a plain `<input>` element with only a `placeholder` attribute. There is no `<label>`, `aria-label`, or `aria-labelledby` attribute.
**User Impact:** Screen reader users cannot identify the purpose of this input field.
**Recommendation:** Add `aria-label="Search agents"` to the input element.

---

### [UX-15] — Notification items with no href are still rendered as buttons but do nothing
**File:** `src/components/dashboard/notification-bell.tsx:144-146`
**Severity:** MEDIUM
**Description:** Notification items are always rendered as `<button>` elements, but the click handler only navigates if `n.href` is truthy. For notifications without an href, clicking does nothing, which violates the expectation that buttons should have an action.
**User Impact:** Users click notifications expecting something to happen, but nothing occurs. No visual distinction between actionable and non-actionable notifications.
**Recommendation:** For notifications without `href`, render as a `<div>` instead of `<button>`, or provide a default action (e.g., mark as read) with visual differentiation.

---

## Consistency Issues

### [UX-16] — Inconsistent error state patterns across pages
**File:** Multiple dashboard pages
**Severity:** MEDIUM
**Description:** Error states vary across pages: (a) VPS page has a styled error with icon + "Try Again" link, (b) Models/Chat/Support show plain text "Something went wrong", (c) Account page shows the error inside a Card component, (d) Billing page matches the plain text pattern. There is no shared error component.
**User Impact:** Users encounter different-looking error states on different pages, reducing trust and making the product feel inconsistent.
**Recommendation:** Create a shared `<DashboardError />` component that accepts optional props (icon, message, retryHref) and use it consistently across all dashboard pages.

---

### [UX-17] — Inconsistent use of native select vs shadcn Select component
**File:** `src/components/dashboard/agent-manager.tsx:372-379` vs `src/components/dashboard/agent-manager.tsx:469-485`
**Severity:** LOW
**Description:** The agent manager uses a native HTML `<select>` element for the sort dropdown (line 372) but uses the shadcn `<Select>` component for model selection (line 469). These render with completely different styles and interaction patterns.
**User Impact:** Visual inconsistency within the same component. The native select looks out of place compared to the styled shadcn select.
**Recommendation:** Replace the native `<select>` with the shadcn `<Select>` component for consistency, or use native selects everywhere.

---

### [UX-18] — Inconsistent heading hierarchy on Overview page
**File:** `src/app/dashboard/page.tsx:173` and `src/components/dashboard/quick-actions.tsx:84`
**Severity:** LOW
**Description:** The Overview page uses `<h1>` for the page title, then the Quick Actions component uses `<h2>` (correct), but the VpsHealthCard, SystemAlerts, and other embedded components may or may not follow proper heading levels. The OverviewSparklines and other sub-components were not checked but the pattern of mixing card titles (`<CardTitle>`) with semantic headings is inconsistent.
**User Impact:** Screen readers may present a confusing document outline if heading levels skip or repeat inappropriately.
**Recommendation:** Audit heading hierarchy across all dashboard components to ensure sequential heading levels (h1 > h2 > h3) without skipping.

---

## Mobile Usability

### [UX-19] — Chat page uses absolute positioning that may clip on mobile
**File:** `src/app/dashboard/chat/page.tsx:92`
**Severity:** CRITICAL
**Description:** The chat page wraps content in `<div className="absolute inset-0 flex flex-col">`. This takes the element out of normal flow and positions it relative to the nearest positioned ancestor. If the dashboard layout's content area does not have `position: relative` and proper height constraints, this will break on various mobile viewport sizes.
**User Impact:** On mobile devices, the chat interface may overflow, be clipped, or not be scrollable, making it unusable.
**Recommendation:** Replace absolute positioning with a flex-based layout that respects the parent container, such as `h-[calc(100vh-var(--header-height))] flex flex-col` or use CSS `dvh` units for mobile viewport handling.

---

### [UX-20] — Chat history panel hidden on mobile with no alternative
**File:** `src/components/dashboard/agent-chat.tsx:683`
**Severity:** HIGH
**Description:** The conversation history panel uses `hidden md:flex md:flex-col` which completely hides it on mobile. The "History" toggle button is visible on mobile but clicking it only toggles state that affects a panel that is always hidden on small screens.
**User Impact:** Mobile users see a "History" button that appears to do nothing. They have no way to access conversation history on mobile devices.
**Recommendation:** Make the history panel a slide-over drawer on mobile (similar to how the agent sidebar already works), or disable the History button on mobile with a tooltip explaining it is desktop-only.

---

### [UX-21] — VPS resource cards use 2-column grid on all mobile widths
**File:** `src/components/dashboard/vps-resource-cards.tsx:70`
**Severity:** MEDIUM
**Description:** The resource cards grid uses `grid-cols-2 lg:grid-cols-4`. On very small screens (320px width), two cards side by side creates very narrow cards where the RAM display "X.X / X.X GB" and percentage text may wrap or overflow.
**User Impact:** On small phones, resource cards become cramped and text may be truncated or wrap awkwardly.
**Recommendation:** Add `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` to allow single-column on the narrowest screens.

---

### [UX-22] — OpenClaw embed page uses negative margin that breaks on mobile
**File:** `src/app/dashboard/openclaw/page.tsx:103`
**Severity:** MEDIUM
**Description:** The OpenClaw embed page uses `className="-m-6 flex flex-col h-[calc(100vh-3.5rem)]"` to break out of the parent padding. The `-m-6` assumes a specific padding value on the parent container. If the mobile layout has different padding, this will misalign.
**User Impact:** On mobile, the iframe may extend beyond the viewport edges or leave gaps.
**Recommendation:** Use a more robust layout approach that doesn't rely on negative margins to cancel parent padding.

---

## Empty States & Onboarding

### [UX-23] — VPS "No VPS Provisioned" state has no clear next action
**File:** `src/app/dashboard/vps/page.tsx:86-97`
**Severity:** HIGH
**Description:** When a user has no VPS, the empty state says "Your VPS will appear here once it's provisioned" but provides no button, link, or guidance on how to get it provisioned. The user is left wondering what to do.
**User Impact:** Users who see this state (after subscribing but before admin deploys) have no way to check provisioning status, contact support, or understand the timeline.
**Recommendation:** Add a link to support ("Questions? Contact support") and/or show provisioning status if a job is pending, similar to the Overview page's Stage 2 state which does include a support link.

---

### [UX-24] — Models page empty state suggests subscription issue but may not be the case
**File:** `src/app/dashboard/models/page.tsx:86-96`
**Severity:** MEDIUM
**Description:** The Models empty state says "Your AI model will be configured once your subscription is active." However, this state can also appear if the models table row simply hasn't been created yet despite having an active subscription. The message incorrectly implies the subscription is not active.
**User Impact:** Users with active subscriptions may panic thinking their subscription failed when really their model config just hasn't been provisioned yet.
**Recommendation:** Show a more nuanced message: "Your AI model is being set up. This usually happens automatically during provisioning. If you've been waiting more than an hour, contact support."

---

## Error Recovery & Destructive Actions

### [UX-25] — Bulk "Undeploy All" has no indication of severity
**File:** `src/components/dashboard/agent-manager.tsx:641-663`
**Severity:** CRITICAL
**Description:** The "Undeploy All" confirmation dialog uses the standard `AlertDialogAction` button without destructive styling. Undeploying all agents takes every agent offline, disconnecting all channels from AI responses. The dialog text explains the action, but the visual weight of the confirmation button doesn't match the severity.
**User Impact:** Users may accidentally confirm "Undeploy All" without fully grasping the consequence, taking all their agents offline simultaneously.
**Recommendation:** Use `variant="destructive"` on the Undeploy All confirmation button, and add a warning about impact (e.g., "All connected channels will stop receiving AI responses until agents are redeployed").

---

### [UX-26] — Channel disconnect removes channel from state entirely with no undo
**File:** `src/components/dashboard/channel-manager.tsx:498-499`
**Severity:** HIGH
**Description:** When a channel is disconnected, `setChannels((prev) => prev.filter(...))` removes it from the local state entirely. There is no undo option and no way to reconnect that specific channel without re-entering all credentials from scratch.
**User Impact:** Users who accidentally disconnect a channel (e.g., Slack with complex credentials) must fully reconfigure it. There is no grace period or undo toast.
**Recommendation:** Show an undo toast (`toast.success("Telegram disconnected", { action: { label: "Undo", onClick: handleReconnect }})`) for a brief window, or keep disconnected channels visible in the list with a "Reconnect" button (which the component already supports for other flows).

---

## Cognitive Load & Progressive Disclosure

### [UX-27] — Overview page shows too many sections simultaneously for new users
**File:** `src/app/dashboard/page.tsx:171-267`
**Severity:** MEDIUM
**Description:** The Overview page for active users renders: SystemAlerts, GettingStartedGuide, OnboardingChecklist, 4 stat cards, OverviewSparklines, QuickActions, UsageSummaryCard, and RecentActivity all at once. For a brand new user with no data, this results in many empty/zero-state cards that provide little value.
**User Impact:** New users face cognitive overload seeing many sections with "0 channels, 0 agents, 0 tickets" and empty sparklines. The important onboarding steps get lost in the noise.
**Recommendation:** For users in their first week (or with zero activity), hide the sparklines, usage summary, and recent activity sections. Prominently show only the onboarding checklist and quick actions.

---

### [UX-28] — Billing page is extremely long with multiple information-dense sections
**File:** `src/components/dashboard/billing-overview.tsx:174-531`
**Severity:** LOW
**Description:** The billing overview renders: Current Subscription card, Next Invoice card, 4 plan comparison cards, Plan Comparison matrix, Billing Usage, Payment Method, Coupon Input, Billing Alerts, and full Payment History table all on a single scrollable page.
**User Impact:** Users looking for a specific piece of information (e.g., next payment date, or how to upgrade) must scroll through potentially hundreds of pixels of content.
**Recommendation:** Consider using tabs or collapsible sections to organize billing into "Subscription", "Plans", "Payment History", and "Settings" views.

---

### [UX-29] — Account page lacks clear section navigation for long page
**File:** `src/app/dashboard/account/page.tsx:89-112`
**Severity:** LOW
**Description:** The account page renders 6 sequential sections (AvatarUpload, AccountSettings, NotificationPreferences, TimezoneSetting, SecuritySection, DangerZone) in a single scrollable view. The Danger Zone is at the very bottom, requiring users to scroll past all other settings.
**User Impact:** Users may not find settings sections easily. The Danger Zone being far from the top is actually good for safety, but other settings like Notifications or Timezone may be missed.
**Recommendation:** Add anchor links at the top of the page for quick section navigation, or use a left-sidebar mini-nav within the account page.

---

## Miscellaneous

### [UX-30] — Connected Services card in Account uses wrong icon for tickets
**File:** `src/components/dashboard/account-settings.tsx:258-259`
**Severity:** LOW
**Description:** The "Open tickets" stat card uses the `Key` icon (line 259) which represents API keys or credentials, not support tickets. This is misleading.
**User Impact:** Users may be confused about what the icon represents at a glance.
**Recommendation:** Replace `Key` with `HelpCircle` or `Ticket` icon to match the support ticket context.

---

### [UX-31] — Onboarding checklist dismiss button has no accessible label
**File:** `src/components/dashboard/onboarding-checklist.tsx:91-98`
**Severity:** MEDIUM
**Description:** The dismiss button for the onboarding checklist renders only an `<X />` icon with no `aria-label`. Screen readers will announce this as just "button".
**User Impact:** Screen reader users cannot identify the dismiss action for the onboarding checklist.
**Recommendation:** Add `aria-label="Dismiss getting started checklist"` to the dismiss button.

---

### [UX-32] — Chat code block copy button invisible unless hovered, inaccessible to keyboard users
**File:** `src/components/dashboard/agent-chat.tsx:33-37`
**Severity:** CRITICAL
**Description:** The copy button on code blocks uses `opacity-0 group-hover:opacity-100` which makes it invisible by default and only appears on mouse hover. Keyboard users tabbing to the button will not see it (no `focus:opacity-100`), and it has no `aria-label`.
**User Impact:** Keyboard-only users and screen reader users cannot discover or use the copy-to-clipboard functionality on code blocks.
**Recommendation:** Add `focus:opacity-100` to make the button visible on keyboard focus, and add `aria-label="Copy code to clipboard"`.
