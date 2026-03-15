# Support Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 8
**Total features:** 14
**Last updated:** 2026-03-15

---

## CONTEXT: Current Support Page

**Files:**
- `src/app/dashboard/support/page.tsx` — ticket list with status tabs
- `src/app/dashboard/support/new/page.tsx` — create ticket form
- `src/app/dashboard/support/[id]/page.tsx` — ticket thread view
- `src/components/dashboard/ticket-list.tsx` — list component with filters
- `src/components/dashboard/ticket-thread.tsx` — thread component with reply
- `src/app/api/tickets/create/route.ts` — create ticket
- `src/app/api/tickets/[id]/reply/route.ts` — reply to ticket
- `src/app/api/tickets/[id]/resolve/route.ts` — resolve ticket

**Current tables:**
```sql
support_tickets: id, user_id, subject, description, priority, status (open/in_progress/resolved/closed), created_at, updated_at
ticket_messages: id, ticket_id, sender_role (user/admin), content, created_at
```

**What's bad:**
- Plain text only — no formatting, no attachments
- No ticket reference numbers (just UUIDs)
- No status timeline
- No satisfaction rating
- No categories/tags
- No search
- Can't reopen resolved tickets
- No email notifications
- "New reply" badge never clears
- No auto-close/auto-delete
- No estimated response time

---

## 8.1 FILE ATTACHMENTS

### What it is
Users can attach screenshots, documents, and files to ticket messages. Admin can attach files in replies too.

### Database

```sql
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_key TEXT NOT NULL, -- path in storage
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**File storage:** Use Supabase Storage (support tickets stay in Supabase). Create a `ticket-attachments` bucket. Files auto-delete when ticket is deleted (48hr cleanup).

### API changes

**Create ticket with attachments:**
```typescript
// POST /api/tickets/create
// Change from JSON body to multipart/form-data
// Fields: subject, description, priority, category
// Files: attachments[] (max 5, max 10MB each)

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const category = formData.get("category") as string;
  const files = formData.getAll("attachments") as File[];

  // Validate
  if (files.length > 5) return apiError("Too many attachments (max 5)");
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) return apiError(`File "${file.name}" exceeds 10MB`);
    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain", "text/csv"];
    if (!allowed.includes(file.type)) return apiError(`File type "${file.type}" not allowed`);
  }

  // Create ticket...
  // Create first message...

  // Upload attachments
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = `${user.id}/${ticket.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await admin.storage
      .from("ticket-attachments")
      .upload(storageKey, buffer, { contentType: file.type });

    if (!uploadError) {
      await admin.from("ticket_attachments").insert({
        message_id: firstMessage.id,
        ticket_id: ticket.id,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_key: storageKey,
      });
    }
  }
}
```

**Reply with attachments:**
Same pattern for `POST /api/tickets/[id]/reply` — accept multipart/form-data with optional file attachments.

**Get attachment URL:**
```typescript
// GET /api/tickets/attachments/[id]
// Auth + verify ticket belongs to user
// Generate signed URL from Supabase Storage (valid for 1 hour)
// Redirect to signed URL
```

### UI — attachment in ticket form

```typescript
// In support/new/page.tsx — add file input:
<div className="space-y-2">
  <Label>Attachments (optional)</Label>
  <div
    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
    onClick={() => fileInputRef.current?.click()}
    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    onDrop={(e) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files);
      setAttachments(prev => [...prev, ...dropped].slice(0, 5));
    }}
  >
    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">
      Drag & drop files here, or click to browse
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      PNG, JPG, PDF, TXT · Max 10MB · Up to 5 files
    </p>
  </div>
  <input
    ref={fileInputRef}
    type="file"
    className="hidden"
    multiple
    accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.csv"
    onChange={(e) => setAttachments(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 5))}
  />

  {/* Attachment previews */}
  {attachments.length > 0 && (
    <div className="space-y-2 mt-2">
      {attachments.map((file, i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Paperclip className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
            setAttachments(prev => prev.filter((_, idx) => idx !== i));
          }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  )}
</div>
```

### UI — attachments in thread messages

```typescript
// In ticket-thread.tsx, after message content:
{message.attachments?.map(att => (
  <div key={att.id} className="mt-2">
    {att.mime_type.startsWith("image/") ? (
      // Image preview
      <a href={`/api/tickets/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
        <img
          src={`/api/tickets/attachments/${att.id}`}
          alt={att.filename}
          className="max-w-xs max-h-48 rounded-lg border border-border hover:opacity-90 transition-opacity"
        />
      </a>
    ) : (
      // File download link
      <a
        href={`/api/tickets/attachments/${att.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{att.filename}</span>
        <span className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</span>
        <Download className="h-3 w-3 text-muted-foreground" />
      </a>
    )}
  </div>
))}
```

### Files to create
- `src/app/api/tickets/attachments/[id]/route.ts` (GET — signed URL redirect)
- Supabase Storage bucket: `ticket-attachments`
- Migration for `ticket_attachments` table

### Files to modify
- `src/app/api/tickets/create/route.ts` — multipart/form-data + file upload
- `src/app/api/tickets/[id]/reply/route.ts` — multipart/form-data + file upload
- `src/app/dashboard/support/new/page.tsx` — drag-drop file area
- `src/components/dashboard/ticket-thread.tsx` — render attachments (images inline, files as download)

---

## 8.2 RICH TEXT FORMATTING

### What it is
Bold, italic, lists, code blocks, links in ticket messages. Both user and admin replies.

### What to build

**Use a lightweight markdown editor** — user types markdown, it renders. Not a full WYSIWYG (too heavy for a ticket system).

**Option A (simplest): Markdown textarea + preview toggle**
```typescript
// In reply/create forms:
const [showPreview, setShowPreview] = useState(false);

<div>
  <div className="flex items-center justify-between mb-1">
    <Label>Description</Label>
    <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
      {showPreview ? "Edit" : "Preview"}
    </Button>
  </div>

  {showPreview ? (
    <div className="prose prose-sm prose-invert p-3 border border-border rounded-lg min-h-[120px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  ) : (
    <Textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="Describe your issue... (Markdown supported: **bold**, *italic*, `code`, - lists)"
      rows={5}
    />
  )}

  <p className="text-xs text-muted-foreground mt-1">
    Supports Markdown: **bold**, *italic*, `code`, ```code blocks```, - lists, [links](url)
  </p>
</div>
```

**In ticket thread:** Render ALL messages with ReactMarkdown (same as chat):
```typescript
<div className="prose prose-sm prose-invert max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.content}
  </ReactMarkdown>
</div>
```

**Option B (better UX): Simple toolbar**
Add a small toolbar above the textarea with buttons: **B** (bold), *I* (italic), `</>` (code), `- ` (list), `🔗` (link). Each button wraps selected text or inserts markdown syntax at cursor.

```typescript
function insertMarkdown(textarea: HTMLTextAreaElement, prefix: string, suffix: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const replacement = `${prefix}${selected || "text"}${suffix}`;
  textarea.setRangeText(replacement, start, end, "end");
  textarea.focus();
}

// Toolbar:
<div className="flex gap-1 border-b border-border pb-1 mb-1">
  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown(ref, "**", "**")} title="Bold">
    <Bold className="h-3 w-3" />
  </Button>
  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown(ref, "*", "*")} title="Italic">
    <Italic className="h-3 w-3" />
  </Button>
  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown(ref, "`", "`")} title="Code">
    <Code className="h-3 w-3" />
  </Button>
  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown(ref, "\n- ", "")} title="List">
    <List className="h-3 w-3" />
  </Button>
  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertMarkdown(ref, "[", "](url)")} title="Link">
    <Link className="h-3 w-3" />
  </Button>
  <div className="flex-1" />
  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowPreview(!showPreview)}>
    {showPreview ? "Edit" : "Preview"}
  </Button>
</div>
```

### Files to modify
- `src/app/dashboard/support/new/page.tsx` — markdown toolbar + preview
- `src/components/dashboard/ticket-thread.tsx` — render with ReactMarkdown + reply with toolbar

---

## 8.3 TICKET REFERENCE NUMBER

### What it is
Human-readable ticket numbers: #001, #002, #003... instead of UUIDs.

### Database

```sql
ALTER TABLE support_tickets ADD COLUMN ticket_number SERIAL;
-- Or if SERIAL doesn't work with Supabase, use a sequence:
CREATE SEQUENCE ticket_number_seq START 1;
ALTER TABLE support_tickets ADD COLUMN ticket_number INTEGER DEFAULT nextval('ticket_number_seq');
CREATE UNIQUE INDEX idx_ticket_number ON support_tickets(ticket_number);
```

### Display

```typescript
// Everywhere a ticket is shown:
// Before: "Ticket abc123-def456..."
// After: "#145 — Cannot connect WhatsApp"

// Format: pad to 3 digits minimum
function formatTicketNumber(num: number): string {
  return `#${String(num).padStart(3, "0")}`;
}
// #001, #002, ..., #145, ..., #1234
```

**In ticket list:** Show `#145` as the first column.
**In ticket thread header:** `#145 — Cannot connect WhatsApp`
**In ticket creation success toast:** `Ticket #145 created`
**In notification center:** `New reply on ticket #145`
**In support emails:** `[ClawHQ] Ticket #145 — Update`

### Files to modify
- `src/app/api/tickets/create/route.ts` — ticket_number auto-assigned
- `src/components/dashboard/ticket-list.tsx` — show #number
- `src/components/dashboard/ticket-thread.tsx` — show #number in header
- All places that reference tickets — use #number
- Migration for `ticket_number` column + sequence

---

## 8.4 STATUS TIMELINE

### What it is
Show when a ticket's status changed and who changed it. Visual timeline of the ticket's lifecycle.

### Database

```sql
CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL, -- 'user' or 'admin' or 'system'
  note TEXT, -- optional note: "Resolved by admin"
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Log status changes:**

```typescript
// Helper — call whenever ticket status changes:
async function logStatusChange(ticketId: string, fromStatus: string | null, toStatus: string, changedBy: string, note?: string) {
  const admin = createAdminClient();
  await admin.from("ticket_status_history").insert({
    ticket_id: ticketId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: changedBy,
    note,
  }).catch(() => {});
}

// In create route: logStatusChange(ticket.id, null, "open", "user", "Ticket created")
// In resolve route: logStatusChange(ticket.id, "open", "resolved", "user", "Marked as resolved by user")
// In admin reply (if status changes): logStatusChange(ticket.id, "open", "in_progress", "admin", "Admin started working on ticket")
```

### UI — timeline in ticket thread

```
┌──────────────────────────────────────────────────────┐
│ #145 — Cannot connect WhatsApp                       │
│                                                       │
│ Timeline:                                             │
│ ● Created                          Mar 15, 10:30 AM  │
│ │                                                     │
│ ● In Progress (admin)              Mar 15, 11:00 AM  │
│ │                                                     │
│ ● Resolved (admin)                 Mar 15, 2:15 PM   │
│ │  "Fixed WhatsApp QR pairing"                       │
│ │                                                     │
│ ● Auto-deleted in 46 hours                            │
└──────────────────────────────────────────────────────┘
```

Vertical timeline with dots. Status color: open=blue, in_progress=yellow, resolved=green, closed=gray. Show "Auto-deleted in X hours" countdown for resolved tickets (48hr rule).

### Files to create
- Migration for `ticket_status_history` table

### Files to modify
- `src/app/api/tickets/create/route.ts` — log "created" status
- `src/app/api/tickets/[id]/resolve/route.ts` — log "resolved" status
- `src/components/dashboard/ticket-thread.tsx` — render timeline

---

## 8.5 SATISFACTION RATING

### What it is
After a ticket is resolved, ask the user to rate their support experience. 1-5 stars.

### Database

```sql
ALTER TABLE support_tickets ADD COLUMN satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
ALTER TABLE support_tickets ADD COLUMN satisfaction_comment TEXT;
ALTER TABLE support_tickets ADD COLUMN rated_at TIMESTAMPTZ;
```

### UI — rating prompt on resolved tickets

When viewing a resolved ticket that hasn't been rated:

```
┌──────────────────────────────────────────────────────┐
│ ✅ This ticket has been resolved                      │
│                                                       │
│ How was your support experience?                      │
│                                                       │
│ ⭐⭐⭐⭐⭐  (click to rate)                           │
│                                                       │
│ [Optional: Leave a comment...]                        │
│                                                       │
│ [Submit Rating]                                       │
└──────────────────────────────────────────────────────┘
```

After rating: "Thank you for your feedback! ⭐⭐⭐⭐ (4/5)"

### API

```typescript
// POST /api/tickets/[id]/rate
// Body: { rating: 4, comment: "Quick and helpful!" }
// Auth + verify ticket belongs to user + verify ticket is resolved + verify not already rated
// Returns: { success: true }
```

### Files to modify
- `src/app/api/tickets/[id]/rate/route.ts` (new)
- `src/components/dashboard/ticket-thread.tsx` — show rating prompt for resolved unrated tickets
- Migration for new columns

---

## 8.6 TICKET CATEGORIES / TAGS

### What it is
Categorize tickets: billing, technical, account, channel setup, agent issue, feature request.

### Database

```sql
ALTER TABLE support_tickets ADD COLUMN category TEXT DEFAULT 'general';
-- Categories: 'general', 'billing', 'technical', 'account', 'channels', 'agents', 'feature_request'
```

### UI — category selector in create form

```typescript
const TICKET_CATEGORIES = [
  { value: "general", label: "General", icon: HelpCircle },
  { value: "billing", label: "Billing & Payments", icon: CreditCard },
  { value: "technical", label: "Technical Issue", icon: Wrench },
  { value: "account", label: "Account", icon: User },
  { value: "channels", label: "Channel Setup", icon: MessageSquare },
  { value: "agents", label: "Agent Issue", icon: Bot },
  { value: "feature_request", label: "Feature Request", icon: Lightbulb },
];

// In create form:
<Select value={category} onValueChange={setCategory}>
  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
  <SelectContent>
    {TICKET_CATEGORIES.map(cat => (
      <SelectItem key={cat.value} value={cat.value}>
        <div className="flex items-center gap-2">
          <cat.icon className="h-3 w-3" />
          {cat.label}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**In ticket list:** Category badge on each ticket card. Filter by category tab.

### Files to modify
- `src/app/dashboard/support/new/page.tsx` — add category selector
- `src/components/dashboard/ticket-list.tsx` — category badges + filter
- Migration for category column

---

## 8.7 SEARCH TICKETS

### What it is
Search across all tickets by subject, description, or message content.

### API

```typescript
// GET /api/tickets/search?q=whatsapp&status=open
// Auth required
// Searches support_tickets.subject, support_tickets.description, ticket_messages.content
// Returns: { tickets: [{ id, ticket_number, subject, status, match_preview, created_at }] }
```

### UI — search input in ticket list

```typescript
// Above the status tabs:
<div className="relative">
  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
  <Input
    placeholder="Search tickets..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="pl-8"
  />
</div>

// Results show with matching text highlighted
```

### Files to create
- `src/app/api/tickets/search/route.ts`

### Files to modify
- `src/components/dashboard/ticket-list.tsx` — add search input + results

---

## 8.8 REOPEN TICKET

### What it is
If a resolved ticket's issue comes back, the user can reopen it instead of creating a new ticket.

### What to build

```typescript
// POST /api/tickets/[id]/reopen
// Auth + verify ticket belongs to user
// Verify status is "resolved" (not "closed")
// Set status back to "open"
// Log status change
// Returns: { success: true }
```

**UI:**
On resolved tickets, show "Reopen" button next to the rating prompt:
```
✅ This ticket has been resolved
[⭐ Rate] [🔄 Reopen — Issue returned?]
```

Clicking "Reopen" → confirmation: "Reopen this ticket? You'll be able to send new messages." → reopens → reply box reappears.

**Impact on auto-delete:** Reopened tickets reset the 48hr auto-delete timer. Only delete when resolved AND 48hrs have passed since LAST resolution.

### Files to create
- `src/app/api/tickets/[id]/reopen/route.ts`

### Files to modify
- `src/components/dashboard/ticket-thread.tsx` — add reopen button + re-enable reply

---

## 8.9 EMAIL NOTIFICATION ON REPLY

### What it is
When admin replies to a ticket, user gets an email: "You have a new reply on ticket #145."

### What to build

**Send email after admin reply:**

```typescript
// In the admin reply route (or wherever admin replies are handled):
// After inserting the reply message:

await sendTicketNotificationEmail({
  to: user.email,
  subject: `[ClawHQ] New reply on ticket ${formatTicketNumber(ticket.ticket_number)} — ${ticket.subject}`,
  body: `
    Hi ${user.name || "there"},

    You have a new reply on your support ticket:

    Ticket: ${formatTicketNumber(ticket.ticket_number)} — ${ticket.subject}

    Reply preview:
    "${replyContent.substring(0, 200)}${replyContent.length > 200 ? "..." : ""}"

    View the full reply:
    ${process.env.NEXT_PUBLIC_APP_URL}/support/${ticket.id}

    — ClawHQ Support
  `,
});
```

**Email sending:** Use existing email infrastructure. If none exists, use Supabase's built-in email (via auth hooks) or a simple SMTP/Resend/SendGrid integration.

**User preference:** Add an email notification toggle in account settings:
```sql
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT true;
```

Only send if `email_notifications = true`.

### Files to modify
- Admin reply route — send email notification
- `src/app/dashboard/account/page.tsx` — add notification preference toggle
- Migration for `email_notifications` column

---

## 8.10 READ TRACKING (Fix "New Reply" Badge)

### What it is
Clear the "new reply" badge when user views the ticket. Currently it NEVER clears.

### Database

```sql
ALTER TABLE support_tickets ADD COLUMN last_read_at TIMESTAMPTZ;
-- A ticket has "new reply" if the last admin message's created_at > last_read_at
```

### Logic

```typescript
// When user opens a ticket thread:
// Update last_read_at to now()
await admin.from("support_tickets")
  .update({ last_read_at: new Date().toISOString() })
  .eq("id", ticketId)
  .eq("user_id", user.id);

// In ticket list, "new reply" badge:
const hasNewReply = ticket.last_admin_message_at > (ticket.last_read_at || "1970-01-01");
```

### Files to modify
- `src/app/dashboard/support/[id]/page.tsx` — update last_read_at on view
- `src/components/dashboard/ticket-list.tsx` — fix badge logic
- Migration for `last_read_at` column

---

## 8.11 AUTO-CLOSE AND AUTO-DELETE

### What it is
Resolved tickets auto-close after 48 hours. Closed tickets are deleted (including all messages and attachments).

### What to build

**Cron endpoint:**
```typescript
// GET /api/cron/cleanup-tickets
// Runs every hour

export async function GET() {
  const admin = createAdminClient();

  // Find tickets resolved more than 48 hours ago
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, user_id, ticket_number")
    .eq("status", "resolved")
    .lt("updated_at", cutoff);

  let deleted = 0;

  for (const ticket of tickets || []) {
    // Delete attachments from storage
    const { data: attachments } = await admin
      .from("ticket_attachments")
      .select("storage_key")
      .eq("ticket_id", ticket.id);

    for (const att of attachments || []) {
      await admin.storage.from("ticket-attachments").remove([att.storage_key]).catch(() => {});
    }

    // Delete ticket (cascade deletes messages + attachments + status history)
    await admin.from("support_tickets").delete().eq("id", ticket.id);
    deleted++;
  }

  return NextResponse.json({ deleted });
}
```

**Add `resolved_at` column:**
```sql
ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMPTZ;
```
Set when ticket is resolved. Use this instead of `updated_at` for the 48hr countdown (in case admin updates ticket metadata after resolving).

**UI — countdown in ticket thread:**
```
✅ Resolved — This ticket will be automatically deleted in 46 hours.
```

### Files to create
- `src/app/api/cron/cleanup-tickets/route.ts`

### Files to modify
- `src/app/api/tickets/[id]/resolve/route.ts` — set resolved_at
- `src/components/dashboard/ticket-thread.tsx` — show countdown
- Migration for `resolved_at` column

---

## 8.12 TICKET PRIORITY VISUAL

### What it is
Color-coded priority badges: urgent = red, high = orange, normal = default, low = gray.

### What to build

```typescript
const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertOctagon },
  high: { label: "High", className: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertTriangle },
  normal: { label: "Normal", className: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Circle },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border", icon: ArrowDown },
};

// In ticket list and thread header:
<Badge className={PRIORITY_CONFIG[ticket.priority]?.className}>
  {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
</Badge>
```

**Already partially exists** — priority field exists in DB and create form. Just needs visual badges in the list and thread.

### Files to modify
- `src/components/dashboard/ticket-list.tsx` — add priority badges
- `src/components/dashboard/ticket-thread.tsx` — priority badge in header

---

## 8.13 CANNED RESPONSES (Quick Actions)

### What it is
Pre-written quick replies for common situations. User clicks → text inserted into reply box.

### What to build

**For users (not admin):** Quick action buttons above the reply box:

```typescript
const USER_QUICK_REPLIES = [
  { label: "Provide more details", text: "Here are more details about the issue:\n\n- \n- \n- " },
  { label: "Share screenshot", text: "I've attached a screenshot showing the issue." },
  { label: "Confirm resolved", text: "Thank you! The issue is resolved. I'm marking this ticket as resolved." },
  { label: "Issue returned", text: "Unfortunately, the issue has returned. Here's what happened:\n\n" },
  { label: "Request update", text: "Hi, could I get an update on this ticket? It's been a while since the last reply." },
];

// Above reply textarea:
<div className="flex flex-wrap gap-1.5 mb-2">
  {USER_QUICK_REPLIES.map((qr, i) => (
    <Button
      key={i}
      variant="outline"
      size="sm"
      className="text-xs h-6"
      onClick={() => setReplyContent(prev => prev + qr.text)}
    >
      {qr.label}
    </Button>
  ))}
</div>
```

These are hardcoded quick actions — not user-configurable. Simple and helpful.

### Files to modify
- `src/components/dashboard/ticket-thread.tsx` — add quick reply buttons

---

## 8.14 ESTIMATED RESPONSE TIME

### What it is
Show users what to expect: "Typical response time: within 4 hours."

### What to build

**Static display (v1):** Just show a text message based on priority:

```typescript
const RESPONSE_TIME = {
  urgent: "We aim to respond within 1 hour",
  high: "We aim to respond within 4 hours",
  normal: "We aim to respond within 12 hours",
  low: "We aim to respond within 24 hours",
};

// In ticket creation success page:
<p className="text-sm text-muted-foreground">
  {RESPONSE_TIME[priority] || RESPONSE_TIME.normal}
</p>

// In ticket thread header (while awaiting reply):
{ticket.status === "open" && !hasAdminReply && (
  <p className="text-xs text-muted-foreground">
    ⏱ {RESPONSE_TIME[ticket.priority]} · Created {formatTimeAgo(ticket.created_at)}
  </p>
)}
```

**Dynamic (v2):** Calculate actual average response time from historical data. Show "Average response: 2.5 hours" based on real metrics. But this requires enough ticket data to be meaningful.

### Files to modify
- `src/components/dashboard/ticket-thread.tsx` — show estimated time
- `src/app/dashboard/support/new/page.tsx` — show on creation success

---

## BUILD ORDER

```
PHASE 1 — Core Improvements:
  8.3  Ticket Reference Numbers (quick, affects everything)
  8.12 Ticket Priority Visual (quick, just badges)
  8.10 Read Tracking (fix existing bug)
  8.2  Rich Text Formatting (markdown toolbar + preview)

PHASE 2 — Major Features:
  8.1  File Attachments (biggest build — storage + upload + render)
  8.4  Status Timeline (DB + logging + UI)
  8.6  Ticket Categories (DB + selector + filter)
  8.7  Search Tickets (API + UI)

PHASE 3 — User Experience:
  8.5  Satisfaction Rating (post-resolution prompt)
  8.8  Reopen Ticket (button + API)
  8.13 Canned Responses (quick reply buttons)
  8.14 Estimated Response Time (static text)

PHASE 4 — Infrastructure:
  8.9  Email Notifications (needs email sending setup)
  8.11 Auto-Close / Auto-Delete (cron + cleanup)
```

Phase 1 = quick wins that make tickets feel professional. Phase 2 = major features. Phase 3 = user experience polish. Phase 4 = backend infrastructure.
