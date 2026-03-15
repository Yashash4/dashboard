# Account Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 10
**Total features:** 9
**Last updated:** 2026-03-15

---

## CONTEXT: Current Account Page

**Files:**
- `src/app/dashboard/account/page.tsx` — server component, fetches user profile
- `src/components/dashboard/account-settings.tsx` — client component with name + password forms
- `src/app/api/account/update/route.ts` — update name
- `src/app/api/account/password/route.ts` — change password

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ Account Settings                                      │
├──────────────────────────────────────────────────────┤
│ Email: user@example.com (read-only)                  │
│ Name: [John Doe          ] [Save]                    │
│ Member since: March 1, 2026                          │
│ Role: User                                            │
├──────────────────────────────────────────────────────┤
│ Change Password                                       │
│ Current: [•••••••••] New: [•••••••••] Confirm: [•••] │
│ [Change Password]                                     │
└──────────────────────────────────────────────────────┘
```

**What's bad:** Only name + password. No avatar, no notifications, no security info, no timezone, no data export, no delete account. Very basic.

---

## 10.1 PROFILE AVATAR

### What it is
Upload a profile picture or select an emoji as avatar. Shows in sidebar, chat messages, and (later) team features.

### Database

```sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN avatar_emoji TEXT;
-- avatar_url: Supabase Storage URL for uploaded images
-- avatar_emoji: single emoji character as fallback (e.g., "🧑‍💻")
-- Priority: avatar_url > avatar_emoji > initials fallback
```

### What to build

**Upload flow:**

```typescript
// POST /api/account/avatar
// Multipart form data with image file
// Max 2MB, PNG/JPG/GIF/WebP only
// Resize to 200x200 on server (use sharp npm package)
// Upload to Supabase Storage bucket "avatars"
// Save URL to users.avatar_url
// Returns: { avatar_url: "https://..." }

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("avatar") as File;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 });

  const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, GIF, WebP allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize to 200x200 (install sharp: npm install sharp)
  const sharp = require("sharp");
  const resized = await sharp(buffer)
    .resize(200, 200, { fit: "cover" })
    .png()
    .toBuffer();

  // Upload to Supabase Storage
  const storageKey = `${user.id}/avatar-${Date.now()}.png`;
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(storageKey, resized, { contentType: "image/png", upsert: true });

  if (uploadError) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

  // Get public URL
  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(storageKey);

  // Delete old avatar if exists
  if (user.avatar_url) {
    const oldKey = user.avatar_url.split("/avatars/")[1];
    if (oldKey) await admin.storage.from("avatars").remove([oldKey]).catch(() => {});
  }

  // Update user record
  await admin.from("users").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);

  return NextResponse.json({ avatar_url: urlData.publicUrl });
}

// DELETE /api/account/avatar
// Remove avatar, revert to emoji or initials
```

**Emoji picker alternative:**

```typescript
// Instead of uploading, user can pick an emoji:
const AVATAR_EMOJIS = ["🧑‍💻", "👨‍💼", "👩‍💼", "🤖", "🦊", "🐱", "🦁", "🐻", "🎯", "⚡", "🚀", "💎", "🌟", "🔥", "🧠", "💡"];

// POST /api/account/avatar-emoji
// Body: { emoji: "🧑‍💻" }
// Saves to users.avatar_emoji
// Clears avatar_url (emoji takes over)
```

### UI

```typescript
// Profile section with avatar:
<div className="flex items-center gap-4 mb-6">
  {/* Avatar */}
  <div className="relative group">
    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
      ) : user.avatar_emoji ? (
        <span className="text-3xl">{user.avatar_emoji}</span>
      ) : (
        <span className="text-2xl font-bold text-muted-foreground">
          {(user.name || user.email)[0].toUpperCase()}
        </span>
      )}
    </div>

    {/* Hover overlay with edit */}
    <button
      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      onClick={() => setAvatarDialogOpen(true)}
    >
      <Camera className="h-5 w-5 text-white" />
    </button>
  </div>

  <div>
    <h2 className="text-lg font-semibold">{user.name || "Set your name"}</h2>
    <p className="text-sm text-muted-foreground">{user.email}</p>
    <p className="text-xs text-muted-foreground">Member since {formatDate(user.created_at)}</p>
  </div>
</div>

// Avatar dialog: two tabs — "Upload Photo" | "Choose Emoji"
// Upload tab: drag-drop area + file picker
// Emoji tab: grid of emoji options
// "Remove Avatar" button at bottom
```

**Update sidebar to show avatar:**

In `app-sidebar.tsx`, replace the initials circle with the avatar:
```typescript
// Current: <div className="w-8 h-8 ..."><span>J</span></div>
// New:
<Avatar className="h-8 w-8">
  {user.avatar_url ? (
    <AvatarImage src={user.avatar_url} alt={user.name} />
  ) : null}
  <AvatarFallback>
    {user.avatar_emoji || (user.name || user.email)[0].toUpperCase()}
  </AvatarFallback>
</Avatar>
```

### Files to create
- `src/app/api/account/avatar/route.ts` (POST, DELETE)
- `src/app/api/account/avatar-emoji/route.ts` (POST)
- Supabase Storage bucket: `avatars` (public)

### Files to modify
- `src/components/dashboard/account-settings.tsx` — avatar section with upload + emoji picker
- `src/components/dashboard/app-sidebar.tsx` — show avatar in user section
- `src/components/dashboard/agent-chat.tsx` — show user avatar on messages (optional)
- Install `sharp` for image resizing
- Migration for `avatar_url` + `avatar_emoji` columns

---

## 10.2 NOTIFICATION PREFERENCES

### What it is
Control what notifications and emails the user receives.

### Database

```sql
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{
  "email_ticket_replies": true,
  "email_billing_alerts": true,
  "email_vps_alerts": true,
  "email_weekly_summary": false,
  "dashboard_ticket_replies": true,
  "dashboard_agent_errors": true,
  "dashboard_vps_status": true,
  "dashboard_channel_disconnect": true,
  "sound_enabled": true
}';
```

### UI

```
┌──────────────────────────────────────────────────────┐
│ Notification Preferences                              │
├──────────────────────────────────────────────────────┤
│ Email Notifications                                   │
│                                                       │
│ [✓] Support ticket replies                            │
│     Get emailed when admin replies to your tickets    │
│                                                       │
│ [✓] Billing alerts                                    │
│     Payment failures, card expiring, plan renewing    │
│                                                       │
│ [✓] VPS alerts                                        │
│     VPS went down, critical resource usage            │
│                                                       │
│ [ ] Weekly summary                                    │
│     Weekly email with your usage stats                │
│                                                       │
│ Dashboard Notifications (bell icon)                   │
│                                                       │
│ [✓] Support ticket replies                            │
│ [✓] Agent deploy errors                               │
│ [✓] VPS status changes                                │
│ [✓] Channel disconnections                            │
│                                                       │
│ Sound                                                 │
│ [✓] Play sound for new chat responses                 │
│                                                       │
│ [Save Preferences]                                    │
└──────────────────────────────────────────────────────┘
```

Each preference is a toggle switch. Auto-saves on change (or explicit Save button).

**API:**
```typescript
// PATCH /api/account/notifications
// Body: { email_ticket_replies: false, sound_enabled: false }
// Merges with existing preferences
// Returns: { preferences: { ...updated } }
```

**Integration:** The notification system (1.6) and email sending (8.9) check these preferences before sending:
```typescript
// Before sending email notification:
const prefs = user.notification_preferences || {};
if (prefs.email_ticket_replies === false) return; // user opted out
```

### Files to create
- `src/app/api/account/notifications/route.ts` (GET, PATCH)

### Files to modify
- `src/components/dashboard/account-settings.tsx` — notification toggles section
- `src/lib/notifications.ts` — check preferences before creating
- Migration for `notification_preferences` column

---

## 10.3 SECURITY SECTION

### What it is
Show security-related info: last login time, password last changed, account security status.

### What to build

```
┌──────────────────────────────────────────────────────┐
│ Security                                              │
├──────────────────────────────────────────────────────┤
│ 🔒 Account Security: Good                            │
│                                                       │
│ Password                                              │
│ Last changed: 14 days ago                             │
│ Strength: Strong ████████████ [Change Password]       │
│                                                       │
│ Last Login                                            │
│ Today at 10:30 AM · 192.168.1.1 · Chrome on macOS   │
│                                                       │
│ Recent Activity                                       │
│ · Today 10:30 AM — Login from Chrome/macOS           │
│ · Yesterday 3:15 PM — Password changed               │
│ · Mar 12 — Login from Safari/iOS                      │
│ · Mar 10 — Account created                            │
│                                                       │
│ [View Full Audit Log →] (Pro feature)                 │
└──────────────────────────────────────────────────────┘
```

**Data sources:**
- Last login: from Supabase auth (`auth.users.last_sign_in_at`)
- Password last changed: track in `users` table (`password_changed_at` column)
- Login activity: from audit logs (category: "auth")
- Password strength: calculate from current validation (min 8 chars → "Good", has numbers+symbols → "Strong")

**Security score:**
```typescript
function getSecurityScore(user: any): { label: string; color: string } {
  let score = 0;
  if (user.password_changed_at && daysSince(user.password_changed_at) < 90) score++;
  if (user.email_confirmed_at) score++;
  // Future: if 2FA enabled, score++

  if (score >= 2) return { label: "Good", color: "text-green-500" };
  if (score >= 1) return { label: "Fair", color: "text-yellow-500" };
  return { label: "Weak", color: "text-red-500" };
}
```

**Database:**
```sql
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMPTZ;
-- Set in password/route.ts after successful password change
```

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add security section
- `src/app/api/account/password/route.ts` — set `password_changed_at`
- Migration for `password_changed_at` column

---

## 10.4 TIMEZONE SETTING

### What it is
Set the user's timezone. All dates/times in the dashboard display in their local time.

### Database

```sql
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
```

### What to build

```typescript
// Timezone selector:
<div className="space-y-2">
  <Label>Timezone</Label>
  <Select value={timezone} onValueChange={handleTimezoneChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select timezone" />
    </SelectTrigger>
    <SelectContent>
      {Intl.supportedValuesOf("timeZone").map(tz => (
        <SelectItem key={tz} value={tz}>
          {tz.replace(/_/g, " ")} ({getTimezoneOffset(tz)})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Current time: {new Date().toLocaleTimeString("en-US", { timeZone: timezone })}
  </p>
</div>

function getTimezoneOffset(tz: string): string {
  const offset = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" })
    .formatToParts(new Date())
    .find(p => p.type === "timeZoneName")?.value || "";
  return offset; // e.g., "GMT+5:30"
}
```

**Auto-detect on first visit:**
```typescript
// On account page load, if timezone is not set:
const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
if (!user.timezone && detected) {
  // Suggest: "We detected your timezone as Asia/Kolkata. [Set as default]"
}
```

**Impact:** All `formatDate()`, `formatTimeAgo()`, and chart labels should use the user's timezone. Create a shared `getUserTimezone()` utility that reads from the user context.

**API:**
```typescript
// PATCH /api/account/update
// Add timezone to the accepted fields
// Body: { timezone: "Asia/Kolkata" }
```

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add timezone selector + auto-detect
- `src/app/api/account/update/route.ts` — accept timezone field
- `src/lib/utils.ts` — update date formatting to use user timezone
- Migration for `timezone` column

---

## 10.5 DATA EXPORT

### What it is
"Download my data" — export everything the user has in one ZIP file. GDPR compliance.

### What to build

```typescript
// POST /api/account/export-data
// Auth required, rate limit: 1/day (heavy operation)
// Gathers ALL user data from Supabase + VPS
// Returns: downloadable JSON file (or ZIP with multiple files)

export async function POST(request: NextRequest) {
  // Auth...

  // Gather data from Supabase
  const [subscription, tickets, agents, channels, webhooks, apiKeys] = await Promise.all([
    admin.from("subscriptions").select("*").eq("user_id", user.id),
    admin.from("support_tickets").select("*, ticket_messages(*)").eq("user_id", user.id),
    admin.from("user_agents").select("*, agents(name, description)").eq("user_id", user.id),
    admin.from("channels").select("id, channel_type, status, created_at").eq("user_id", user.id),
    admin.from("webhooks").select("id, url, events, is_enabled, created_at").eq("user_id", user.id),
    admin.from("api_keys").select("id, name, created_at, last_used_at, usage_count, status").eq("user_id", user.id),
  ]);

  // Note: VPS data (chat history, KB docs, analytics, audit logs) is on the user's VPS
  // We can't easily include it in this export without SSH access
  // Include a note about where VPS data lives

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      plan: subscription.data?.[0]?.plan,
    },
    subscription: subscription.data?.[0] || null,
    support_tickets: tickets.data || [],
    agents: agents.data || [],
    channels: channels.data || [],
    webhooks: webhooks.data || [],
    api_keys: apiKeys.data || [],
    note: "Chat history, knowledge base documents, analytics, and audit logs are stored on your VPS. Connect via SSH or use the ClawHQ Data API to export that data.",
  };

  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="clawhq-data-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
```

### UI

```
┌──────────────────────────────────────────────────────┐
│ Data & Privacy                                        │
├──────────────────────────────────────────────────────┤
│ Export Your Data                                      │
│ Download all your account data as a JSON file.        │
│ Includes: profile, subscription, tickets, agents,     │
│ channels, webhooks, API keys.                         │
│                                                       │
│ Note: Chat history and KB documents are stored on     │
│ your VPS and can be exported from there.              │
│                                                       │
│ [Download My Data]            (once per day)          │
└──────────────────────────────────────────────────────┘
```

### Files to create
- `src/app/api/account/export-data/route.ts`

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add data export section

---

## 10.6 ACCOUNT DELETION

### What it is
"Delete my account" with proper confirmation flow. GDPR right to erasure.

### What to build

**Multi-step confirmation:**

1. User clicks "Delete Account"
2. Dialog: "Are you sure? This will permanently delete: your account, subscription, VPS, all data. This cannot be undone."
3. User must type their email to confirm
4. User must enter password for verification
5. On submit: mark account for deletion, schedule VPS teardown

```typescript
// POST /api/account/delete
// Body: { email: "user@example.com", password: "..." }
// 1. Verify email matches current user
// 2. Verify password (sign in to confirm identity)
// 3. Cancel subscription (if active) via payment provider
// 4. Mark VPS for deprovisioning (don't delete immediately — admin reviews)
// 5. Delete user data from Supabase (or schedule deletion)
// 6. Sign out all sessions
// 7. Delete auth user from Supabase Auth

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Verify identity
  if (email !== user.email) {
    return NextResponse.json({ error: "Email does not match your account" }, { status: 400 });
  }

  // Verify password
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Cancel subscription (if active)
  // ... payment provider cancellation ...

  // Mark VPS for deprovisioning
  await admin.from("vps_instances").update({
    status: "pending_deletion",
    deletion_requested_at: new Date().toISOString(),
  }).eq("user_id", user.id);

  // Delete user data
  // Cascade deletes will handle: tickets, agents, channels, webhooks, API keys, etc.
  // But explicit deletion ensures nothing is missed:
  await Promise.all([
    admin.from("support_tickets").delete().eq("user_id", user.id),
    admin.from("user_agents").delete().eq("user_id", user.id),
    admin.from("channels").delete().eq("user_id", user.id),
    admin.from("webhooks").delete().eq("user_id", user.id),
    admin.from("api_keys").delete().eq("user_id", user.id),
    admin.from("subscriptions").delete().eq("user_id", user.id),
    admin.from("users").delete().eq("id", user.id),
  ]);

  // Delete avatar from storage
  if (user.avatar_url) {
    const key = user.avatar_url.split("/avatars/")[1];
    if (key) await admin.storage.from("avatars").remove([key]).catch(() => {});
  }

  // Delete auth user (this signs out all sessions)
  await admin.auth.admin.deleteUser(user.id);

  // Note: VPS data (on the user's VPS) will be cleaned up when admin decommissions the VPS
  // The VPS itself gets destroyed during deprovisioning

  return NextResponse.json({ success: true, message: "Account deleted" });
}
```

### UI

```
┌──────────────────────────────────────────────────────┐
│ Danger Zone                                           │
├──────────────────────────────────────────────────────┤
│ Delete Account                                        │
│ Permanently delete your account, subscription, and    │
│ all data. Your VPS will be decommissioned. This       │
│ action cannot be undone.                              │
│                                                       │
│ [Delete My Account]  ← red button                    │
└──────────────────────────────────────────────────────┘

// Clicking opens a multi-step dialog:
// Step 1: Warning with list of what will be deleted
// Step 2: Type email to confirm
// Step 3: Enter password
// Step 4: Final "I understand, delete my account" button (red, prominent)
```

### Files to create
- `src/app/api/account/delete/route.ts`

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add danger zone section + deletion dialog

---

## 10.7 CONNECTED SERVICES

### What it is
Quick view of all connected services/integrations — channels, agents, webhooks, API keys.

### What to build

**Summary of connected items:**

```
┌──────────────────────────────────────────────────────┐
│ Connected Services                                    │
├──────────────────────────────────────────────────────┤
│ Channels: 5 connected  [Manage →]                    │
│ 📱 Telegram  💬 Discord  💼 Slack  🌐 Webchat  📞 Teams │
│                                                       │
│ Agents: 3 deployed  [Manage →]                       │
│ 🤖 Support Bot  🔬 Research Bot  ✍️ Writer Bot        │
│                                                       │
│ Webhooks: 2 active  [Manage →]  (Pro)                │
│ API Keys: 1 active  [Manage →]  (Pro)                │
└──────────────────────────────────────────────────────┘
```

**No new API needed** — aggregate from existing data (same queries as Overview page).

Each section links to the relevant management page. Pro features show badge but still show the count.

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add connected services summary

---

## 10.8 SESSION MANAGEMENT

### What it is
See active login sessions and revoke them. "Someone else logged in from a different device?"

### What to build

**Supabase Auth provides session management:**

```typescript
// Get current sessions (Supabase doesn't expose a list of all sessions easily)
// Alternative: track sessions manually

// Simplified approach: show current session info + "Sign out all other devices" button

// Current session info:
const sessionInfo = {
  current: {
    device: parseUserAgent(navigator.userAgent), // "Chrome on macOS"
    ip: "fetched from API",
    started: session.created_at,
  },
};

// "Sign out everywhere" button:
// Supabase: supabase.auth.admin.deleteUser + recreate, or
// Simpler: change password (invalidates all sessions)
```

### UI

```
┌──────────────────────────────────────────────────────┐
│ Active Sessions                                       │
├──────────────────────────────────────────────────────┤
│ 🟢 Current Session                                   │
│    Chrome on macOS · 192.168.1.1                     │
│    Started: Today 10:30 AM                            │
│                                                       │
│ [Sign Out All Other Devices]                          │
│ This will keep you logged in here but sign you out    │
│ everywhere else.                                      │
└──────────────────────────────────────────────────────┘
```

**"Sign Out All Other Devices":**
```typescript
// POST /api/account/revoke-sessions
// Uses Supabase auth to invalidate all sessions except current
// Supabase doesn't have a direct "revoke other sessions" API
// Workaround: admin refreshes the user's JWT secret, invalidating all existing tokens
// The current session re-authenticates automatically

// Simplest approach: just sign the user out globally, then sign them back in
await supabase.auth.signOut({ scope: "global" }); // signs out ALL sessions
// Then the current page detects auth loss and redirects to login
// User logs in again — only one session
```

### Files to create
- `src/app/api/account/revoke-sessions/route.ts`

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add sessions section

---

## 10.9 LANGUAGE / LOCALE PREFERENCE

### What it is
Store the user's language preference for future i18n support. For now, just store it — implement actual translations later.

### Database

```sql
ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'en';
-- Supported: 'en' (English) — more added later
```

### UI

```
┌──────────────────────────────────────────────────────┐
│ Language                                              │
│                                                       │
│ [English ▼]                                          │
│ More languages coming soon.                           │
└──────────────────────────────────────────────────────┘
```

**For now:** Only English available. Dropdown shows "English" as the only option. This sets up the infrastructure — when we add more languages, the preference is already stored and the UI selector exists.

### Files to modify
- `src/components/dashboard/account-settings.tsx` — add language selector
- `src/app/api/account/update/route.ts` — accept `locale` field
- Migration for `locale` column

---

## BUILD ORDER

```
PHASE 1 — Core Improvements:
  10.2 Notification Preferences (FIRST — needed by email notifications 8.9)
  10.4 Timezone Setting (affects all date displays)
  10.1 Profile Avatar (visual identity)

PHASE 2 — Security:
  10.3 Security Section (last login, password age, score)
  10.8 Session Management (revoke other sessions)

PHASE 3 — Compliance:
  10.5 Data Export (GDPR — download my data)
  10.6 Account Deletion (GDPR — right to erasure)

PHASE 4 — Polish:
  10.7 Connected Services (summary view)
  10.9 Language / Locale (infrastructure for future i18n)
```

Phase 1 = enables other features (notifications need preferences, dates need timezone). Phase 2 = security features. Phase 3 = compliance/legal. Phase 4 = polish.
