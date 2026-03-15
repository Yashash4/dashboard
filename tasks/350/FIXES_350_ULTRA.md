# 350 Ultra — Review Fixes

**Owner:** Plan 350 Agent
**Source:** 5 review agents (QA Tester, UX Reviewer, Senior Developer, Security Auditor, Integration Tester)
**Total issues:** 10 critical + 15 high + 18 medium + 21 low = 64 items
**Last updated:** 2026-03-15

---

## DATA LOCATION REMINDER — FOLLOW THIS EXACTLY

When writing data in fixes, use the correct destination:

**Write to Supabase (real-time data):**
- `mc_tasks` — task CRUD, column moves, priority changes
- `mc_agent_status` — agent status updates
- `mc_comments` — task comments
- `mc_reviews` — task reviews
- `mc_task_dependencies` — dependency links
- `mc_automation_rules` — rule CRUD (config, not execution logs)
- `mc_task_templates` — template CRUD
- `mc_recurring_tasks` — recurring task config
- `mc_task_statuses` — configurable columns

**Write to VPS via `vpsDataFetch()` (heavy/historical data):**
- `mc_events` — event feed entries
- `mc_sessions` — session records + trace data
- `mc_activities` — task activity history (who did what when)
- `audit_logs` — audit trail entries
- `webhook_deliveries` — webhook delivery logs
- `analytics` — detailed analytics data

**Helper:** `import { vpsDataFetch } from "@/lib/vps-data-api";`
```typescript
await vpsDataFetch(userId, "/api/activities", { method: "POST", body: { ... } });
await vpsDataFetch(userId, "/api/events", { method: "POST", body: { ... } });
```

If VPS is unavailable, catch the error gracefully — non-critical writes should not block the main action.

---

## PRIORITY 1: CRITICAL (Fix immediately — features broken or security holes)

### FIX-01: Build Automation Rules Execution Engine
**Source:** Integration Tester Flow 4
**Problem:** Automation rules have CRUD but ZERO execution engine. Rules are stored but never fire. An entire advertised feature does nothing.
**What to build:**

Create `src/lib/mc-automation.ts`:
```typescript
export async function processAutomationRules(
  userId: string,
  triggerType: string, // "task_enters_column" | "task_priority_changes" | "agent_goes_offline" | "task_overdue"
  triggerValue: string, // column_id, priority value, agent_id, etc.
  context: Record<string, any> // { taskId, agentId, oldValue, newValue }
): Promise<void> {
  const admin = createAdminClient();

  // Get user's enabled rules matching this trigger
  const { data: rules } = await admin
    .from("mc_automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("trigger_type", triggerType)
    .eq("is_enabled", true);

  if (!rules?.length) return;

  for (const rule of rules) {
    // Check if trigger_value matches (if specified)
    if (rule.trigger_value && rule.trigger_value !== triggerValue) continue;

    try {
      // Execute the action
      await executeAction(admin, userId, rule.action_type, rule.action_value, context);

      // Increment run count
      await admin.from("mc_automation_rules").update({
        run_count: (rule.run_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", rule.id);

      // Log activity on the task (if task-related)
      // NOTE: mc_activities lives on VPS — use vpsDataFetch, NOT Supabase
      if (context.taskId) {
        try {
          const { vpsDataFetch } = await import("@/lib/vps-data-api");
          await vpsDataFetch(userId, "/api/activities", {
            method: "POST",
            body: {
              task_id: context.taskId,
              actor: "automation",
              action: `Rule "${rule.name}" fired: ${rule.action_type}`,
              old_value: JSON.stringify(context),
              new_value: rule.action_value,
            },
          });
        } catch {
          // VPS may be unavailable — log but don't block
        }
      }
    } catch (err) {
      console.warn(`[automation] Rule "${rule.name}" failed:`, err);
    }
  }
}

async function executeAction(
  admin: SupabaseClient,
  userId: string,
  actionType: string,
  actionValue: string,
  context: Record<string, any>
): Promise<void> {
  switch (actionType) {
    case "assign_agent":
      if (context.taskId) {
        await admin.from("mc_tasks").update({
          assigned_agent_id: actionValue,
        }).eq("id", context.taskId).eq("user_id", userId);
      }
      break;

    case "move_to_column":
      if (context.taskId) {
        await admin.from("mc_tasks").update({
          column_id: actionValue,
          ...(actionValue === "done" ? { completed_at: new Date().toISOString() } : { completed_at: null }),
        }).eq("id", context.taskId).eq("user_id", userId);
      }
      break;

    case "send_notification":
      // Use notification system if available
      try {
        const { createNotification } = await import("@/lib/notifications");
        await createNotification({
          userId,
          type: "system",
          title: `Automation: ${actionValue}`,
          message: `Rule fired for task ${context.taskId || "unknown"}`,
          link: context.taskId ? `/mission-control/tasks` : undefined,
        });
      } catch {
        // Notification system may not exist yet
      }
      break;

    case "create_task":
      // actionValue = template_id
      const { data: template } = await admin
        .from("mc_task_templates")
        .select("*")
        .eq("id", actionValue)
        .eq("user_id", userId)
        .single();

      if (template) {
        await admin.from("mc_tasks").insert({
          user_id: userId,
          title: template.name,
          description: template.description,
          priority: template.priority || "medium",
          column_id: "inbox",
          assigned_agent_id: template.default_agent_id,
          tags: template.tags || [],
          subtasks: template.subtasks || [],
          estimated_hours: template.estimated_hours,
          position: 0,
        });
      }
      break;
  }
}
```

**Wire into task PATCH route** (`tasks/[id]/route.ts`):
```typescript
// After successful task update, check if column changed:
if (updates.column_id && updates.column_id !== existingTask.column_id) {
  processAutomationRules(user.id, "task_enters_column", updates.column_id, {
    taskId: id,
    oldValue: existingTask.column_id,
    newValue: updates.column_id,
  }).catch(() => {}); // fire-and-forget
}

if (updates.priority && updates.priority !== existingTask.priority) {
  processAutomationRules(user.id, "task_priority_changes", updates.priority, {
    taskId: id,
    oldValue: existingTask.priority,
    newValue: updates.priority,
  }).catch(() => {});
}
```

**Wire into agent heartbeat** (`agents/heartbeat/route.ts`):
```typescript
// When agent status changes to "offline" or "error":
if (previousStatus !== newStatus && (newStatus === "offline" || newStatus === "error")) {
  processAutomationRules(user.id, "agent_goes_offline", agent_id, {
    agentId: agent_id,
    oldValue: previousStatus,
    newValue: newStatus,
  }).catch(() => {});
}
```

---

### FIX-02: Enforce Task Dependencies
**Source:** Integration Tester Flow 3
**Problem:** Dependencies exist in DB but have zero enforcement. Blocked tasks move freely.

**A) Add dependency check to task PATCH:**
```typescript
// In tasks/[id]/route.ts, before allowing column change to in_progress/testing/review:
if (updates.column_id && ["in_progress", "testing", "review"].includes(updates.column_id)) {
  // Check if this task has unresolved dependencies
  const { data: deps } = await admin
    .from("mc_task_dependencies")
    .select("depends_on_task_id, mc_tasks!depends_on_task_id(column_id)")
    .eq("task_id", id);

  const blockedBy = deps?.filter(d => {
    const depTask = Array.isArray(d.mc_tasks) ? d.mc_tasks[0] : d.mc_tasks;
    return depTask?.column_id !== "done";
  });

  if (blockedBy?.length) {
    return NextResponse.json({
      error: "Task is blocked by unfinished dependencies",
      blocked_by: blockedBy.map(d => d.depends_on_task_id),
    }, { status: 409 });
  }
}
```

**B) Auto-unblock when dependency completes:**
```typescript
// In tasks/[id]/route.ts, after moving a task to "done":
if (updates.column_id === "done") {
  // Find tasks that depend on this one
  const { data: dependents } = await admin
    .from("mc_task_dependencies")
    .select("task_id")
    .eq("depends_on_task_id", id);

  // For each dependent, check if ALL its dependencies are now done
  for (const dep of dependents || []) {
    const { data: allDeps } = await admin
      .from("mc_task_dependencies")
      .select("depends_on_task_id, mc_tasks!depends_on_task_id(column_id)")
      .eq("task_id", dep.task_id);

    const allDone = allDeps?.every(d => {
      const depTask = Array.isArray(d.mc_tasks) ? d.mc_tasks[0] : d.mc_tasks;
      return depTask?.column_id === "done";
    });

    if (allDone) {
      // Emit event: task unblocked
      emitMCEvent(userId, "task_unblocked", { taskId: dep.task_id });
    }
  }
}
```

**C) Fix circular dependency detection (BFS):**
```typescript
// In dependencies/route.ts, replace the shallow check with:
async function hasCircularDependency(admin, taskId, dependsOnId, userId): Promise<boolean> {
  // BFS from dependsOnId — can we reach taskId?
  const visited = new Set<string>();
  const queue = [dependsOnId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === taskId) return true; // cycle found
    if (visited.has(current)) continue;
    visited.add(current);

    const { data: deps } = await admin
      .from("mc_task_dependencies")
      .select("depends_on_task_id")
      .eq("task_id", current);

    for (const dep of deps || []) {
      queue.push(dep.depends_on_task_id);
    }
  }
  return false;
}
```

---

### FIX-03: Fix Cross-User Dependency Deletion (Security)
**Source:** Security Auditor VULN-02
**File:** `dependencies/route.ts:99`
**Fix:**
```typescript
// BEFORE:
await admin.from("mc_task_dependencies").delete().eq("id", dependency_id);

// AFTER: verify the dependency belongs to a task owned by the user
const { data: dep } = await admin
  .from("mc_task_dependencies")
  .select("task_id")
  .eq("id", dependency_id)
  .single();

if (!dep) return NextResponse.json({ error: "Dependency not found" }, { status: 404 });

// Verify task belongs to user
const { data: task } = await admin
  .from("mc_tasks")
  .select("id")
  .eq("id", dep.task_id)
  .eq("user_id", user.id)
  .single();

if (!task) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

await admin.from("mc_task_dependencies").delete().eq("id", dependency_id);
```

---

### FIX-04: Fix Task Queue Route Auth Bypass
**Source:** Security Auditor VULN-01
**File:** `tasks/queue/route.ts`
**Fix:** Replace custom auth with `guardMCRoute`:
```typescript
const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
if (guard instanceof NextResponse) return guard;
const { user } = guard;
```

---

### FIX-05: Debounce Task Detail PATCH Calls
**Source:** Senior Dev CRIT-3
**File:** `task-detail-modal.tsx:443-464`
**Fix:** Don't call `onUpdate()` in `onChange`. Use local state + debounced save:
```typescript
const [localDescription, setLocalDescription] = useState(task.description);
const debouncedSave = useMemo(
  () => debounce((value: string) => onUpdate(task.id, { description: value }), 500),
  [task.id, onUpdate]
);

<Textarea
  value={localDescription}
  onChange={(e) => {
    setLocalDescription(e.target.value);
    debouncedSave(e.target.value);
  }}
/>
```
Same for `acceptance_criteria`.

---

### FIX-06: Fix `estimated_hours: 0` → `null` Bug
**Source:** QA Tester BUG-001
**File:** `tasks/route.ts:105`
**Fix:** `estimated_hours: estimated_hours ?? null` (not `||`)

---

### FIX-07: Clear `completed_at` When Moving Out of "done"
**Source:** QA Tester BUG-002
**File:** `tasks/reorder/route.ts:45-46`
**Fix:**
```typescript
// Add after the existing completed_at set:
if (u.column_id !== "done") {
  updateData.completed_at = null;
}
```

---

### FIX-08: Add "error" to VALID_EVENT_TYPES
**Source:** Senior Dev CRIT-2
**File:** `events/route.ts:7-14`
**Fix:** Add `"error"` to the array. Also add to `EVENT_TYPE_CONFIG` in `event-feed.tsx`.

---

### FIX-09: Auto-Move Task to Done on Review Approval
**Source:** Integration Tester Flow 2
**File:** `reviews/route.ts`
**Fix:** After inserting an "approved" review:
```typescript
if (status === "approved") {
  await admin.from("mc_tasks").update({
    column_id: "done",
    completed_at: new Date().toISOString(),
  }).eq("id", taskId).eq("user_id", user.id);

  // Log activity — mc_activities lives on VPS, use vpsDataFetch
  try {
    const { vpsDataFetch } = await import("@/lib/vps-data-api");
    await vpsDataFetch(user.id, "/api/activities", {
      method: "POST",
      body: {
        task_id: taskId,
        actor: reviewer,
        action: "Review approved — task moved to Done",
      },
    });
  } catch {
    // VPS may be unavailable — activity logging is non-critical
  }
}
```

---

### FIX-10: Wire Supabase Realtime (Replace Dead SSE EventBus)
**Source:** Integration Tester Flow 9
**Problem:** `mc-event-bus.ts` uses process-local EventEmitter (broken in serverless). `use-mc-realtime.ts` exists with Supabase Realtime but is UNUSED.
**Fix:**
1. In `src/app/dashboard/mission-control/layout.tsx`: replace `useMissionControlStream()` with `useMCRealtime()`
2. Remove or deprecate `use-mission-control-stream.ts` (the SSE hook)
3. Remove or deprecate `mc-event-bus.ts`
4. Remove SSE stream route `api/mission-control/stream/route.ts` (or keep as fallback)
5. In all API routes that call `emitMCEvent()`: replace with Supabase Realtime broadcast:
```typescript
await admin.channel(`mc:${userId}`).send({
  type: "broadcast",
  event: eventType,
  payload: data,
});
```

---

## PRIORITY 2: HIGH (Fix before launch — security + data integrity)

### FIX-11: Add Task Ownership Check to Comments/Reviews POST
**Source:** Security VULN-15, VULN-16
**Files:** `comments/route.ts`, `reviews/route.ts`
**Fix:** Before inserting comment/review, verify task belongs to user:
```typescript
const { data: task } = await admin
  .from("mc_tasks")
  .select("id")
  .eq("id", taskId)
  .eq("user_id", user.id)
  .single();
if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
```

---

### FIX-12: Validate column_id and priority Against Enums
**Source:** Security VULN-04, Senior Dev HIGH-4, QA BUG-011
**Files:** `tasks/route.ts`, `tasks/[id]/route.ts`, `tasks/reorder/route.ts`, `tasks/bulk-update/route.ts`, `tasks/bulk-action/route.ts`
**Fix:**
```typescript
const VALID_COLUMNS = ["planning", "inbox", "assigned", "in_progress", "testing", "review", "done"];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

if (column_id && !VALID_COLUMNS.includes(column_id)) {
  return NextResponse.json({ error: "Invalid column_id" }, { status: 400 });
}
if (priority && !VALID_PRIORITIES.includes(priority)) {
  return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
}
```
Note: If configurable columns (mc_task_statuses) are used, validate against user's statuses instead of hardcoded list.

---

### FIX-13: Add String Length Validation
**Source:** Security VULN-08, Senior Dev HIGH-3, QA BUG-010
**Files:** All POST/PATCH routes for tasks, comments, reviews, statuses, templates, rules
**Fix:** Add to each route:
```typescript
if (title && title.length > 500) return error("Title must be under 500 characters");
if (description && description.length > 10000) return error("Description must be under 10,000 characters");
if (content && content.length > 5000) return error("Comment must be under 5,000 characters");
if (name && name.length > 200) return error("Name must be under 200 characters");
```

---

### FIX-14: Fix Body Size Check (Don't Trust Content-Length)
**Source:** Security VULN-05, QA BUG-013
**File:** `mc-route-guard.ts:70-78`
**Fix:** Read body as text first, check actual size:
```typescript
if (options?.maxBodySize && ["POST", "PATCH", "PUT"].includes(request.method)) {
  const bodyText = await request.text();
  if (bodyText.length > options.maxBodySize) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  // Re-parse for downstream: store parsed body for the route to use
  // This requires changing how routes read the body
}
```
Alternative: use Next.js route segment config: `export const maxDuration = 10; export const bodyParser = { sizeLimit: '50kb' };`

---

### FIX-15: Fix Undo-Delete (Soft Delete Instead of Re-Create)
**Source:** QA BUG-012, Senior Dev HIGH-2
**File:** `task-board.tsx:1396-1401`
**Fix:** Instead of POST to recreate, implement soft delete:
```typescript
// Add column: ALTER TABLE mc_tasks ADD COLUMN deleted_at TIMESTAMPTZ;

// DELETE route: soft delete instead of hard delete
await admin.from("mc_tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);

// Undo: clear deleted_at
await fetch(`/api/mission-control/tasks/${deletedTask.id}`, {
  method: "PATCH",
  body: JSON.stringify({ deleted_at: null }),
});

// All queries: add .is("deleted_at", null) filter
// Hard delete after 30 days via cron
```

---

### FIX-16: Fix useEffect Infinite Re-render Risk
**Source:** QA BUG-007/008, Senior Dev MED-2
**Files:** `agent-roster.tsx:55-60`, `task-board.tsx:1181-1186`
**Fix:** Use ref for selected ID, derive full object:
```typescript
const selectedIdRef = useRef<string | null>(null);
const selectedAgent = useMemo(
  () => agents.find(a => a.id === selectedIdRef.current) || null,
  [agents]
);

function selectAgent(agent: MCAgentStatus) {
  selectedIdRef.current = agent.id;
  // Force re-render if needed
}
```

---

### FIX-17: Fix isSyncingRef Timeout
**Source:** QA BUG-006
**File:** `task-board.tsx:1308`
**Fix:** Clear syncing flag in the API callback, not a timer:
```typescript
// BEFORE:
setTimeout(() => { isSyncingRef.current = false; }, 500);

// AFTER:
persistDragMove(taskId, newColumnId, newPosition)
  .then(() => { isSyncingRef.current = false; })
  .catch(() => { isSyncingRef.current = false; /* rollback already handled */ });
```

---

### FIX-18: Fix Event Feed Pagination (Append, Don't Replace)
**Source:** Integration Tester Flow 8, Senior Dev MED-4
**File:** `event-feed.tsx:107`
**Fix:** Use `useInfiniteQuery` or accumulate pages:
```typescript
const [allEvents, setAllEvents] = useState<MCEvent[]>([]);

// On "Load more": fetch next page, append to allEvents
// Display allEvents instead of single-page data
```

---

### FIX-19: Fix Event-to-Session Highlight Link
**Source:** Integration Tester Flow 8
**File:** `event-feed.tsx:362` → `session-tracker.tsx`
**Fix:** In session-tracker, read `?highlight=` from URL and auto-select that session:
```typescript
const searchParams = useSearchParams();
const highlightId = searchParams.get("highlight");

useEffect(() => {
  if (highlightId && sessions.length > 0) {
    const session = sessions.find(s => s.id === highlightId);
    if (session) setSelectedSession(session);
  }
}, [highlightId, sessions]);
```

---

### FIX-20: Fix VPS Token in Cleartext Systemd File
**Source:** Security VULN-07
**File:** `vps-data-api-bundle.ts:52`
**Fix:** Use EnvironmentFile instead of inline:
```ini
# Instead of: Environment=AUTH_TOKEN=xxx
EnvironmentFile=/opt/clawhq-data-api/.env
```
Write token to `.env` file with `chmod 600`.

---

### FIX-21: Validate `reviewer` Field (Use Auth User, Not User Input)
**Source:** Security VULN-21
**File:** `reviews/route.ts:91`
**Fix:**
```typescript
// BEFORE: reviewer from request body
// AFTER: always use authenticated user's name
const reviewer = user.name || user.email || "Unknown";
```

---

### FIX-22: Validate Reorder Item Fields
**Source:** QA BUG-003
**File:** `tasks/reorder/route.ts:38-49`
**Fix:** Validate each item:
```typescript
for (const u of updates) {
  if (!u.id || typeof u.id !== "string") return error("Invalid task ID");
  if (u.column_id && !VALID_COLUMNS.includes(u.column_id)) return error("Invalid column_id");
  if (typeof u.position !== "number" || u.position < 0) return error("Invalid position");
}
```

---

## PRIORITY 3: MEDIUM (Fix for quality — UX + performance)

- [x] **FIX-23:** Add VPS cache eviction (delete expired entries periodically) — `vps-data-api.ts`
- [x] **FIX-24:** Add DELETE existence check (return 404 if task not found) — `tasks/[id]/route.ts`
- [x] **FIX-25:** Add confirmation dialog before task deletion — `task-detail-modal.tsx`
- [x] **FIX-26:** Fix calendar expanded day grid layout (use popover instead of col-span-7) — `task-board.tsx`
- [x] **FIX-27:** Add search/filter to Agent Roster — `agent-roster.tsx`
- [x] **FIX-28:** Add search/filter/sort to Session Tracker — `session-tracker.tsx`
- [x] **FIX-29:** Populate command palette with more actions (agent control, view switching, filters, task search) — `command-palette.tsx`
- [x] **FIX-30:** Reduce polling frequency (overview: 15-30s, agents: 5-10s, events: 10s, sessions: 10s) — multiple files
- [x] **FIX-31:** Fix duplicate formatTimeAgo (import from shared lib, remove local copies) — `task-detail-modal.tsx`
- [x] **FIX-32:** Validate `color` field as hex color regex — `statuses/route.ts`
- [x] **FIX-33:** Validate automation rule `trigger_type` and `action_type` against whitelists — `automation-rules/route.ts`
- [x] **FIX-34:** Validate UUID format on all ID parameters to prevent path traversal — `vps-data-api.ts`
- [x] **FIX-35:** Validate `mentions` array (max 50 items, strings only, max 100 chars each) — `comments/route.ts`
- [x] **FIX-36:** Validate `metadata` depth (max 3 levels) and size (max 10KB) — `tasks/route.ts`
- [x] **FIX-37:** Validate `trace_data` size (max 100KB) — `sessions/[id]/route.ts`
- [x] **FIX-38:** Fix NaN handling on pagination params (use `Math.max(1, parseInt(...) || 1)`) — all paginated routes
- [x] **FIX-39:** Add task column selector to Create Task dialog — `task-board.tsx` create dialog
- [x] **FIX-40:** Add "X more" indicator on overview task/session widgets — `mission-control-overview.tsx`

## PRIORITY 4: LOW (Fix for polish)

- [x] **FIX-41:** Remove unused `Settings2` import — `task-board.tsx:40`
- [x] **FIX-42:** Remove unused `agents` prop from SwimlaneView — `task-board.tsx:557`
- [x] **FIX-43:** Fix `success_rate_percent` to integer (consistent with other metrics) — `metrics/route.ts:53`
- [x] **FIX-44:** Fix create dialog not resetting on Escape — `task-board.tsx:1043`
- [x] **FIX-45:** Add null check for `formatTimeAgo(agent.last_activity_at)` — `agent-roster.tsx:202`
- [x] **FIX-46:** Add debounce to search input (200ms) — `task-board.tsx:397`
- [x] **FIX-47:** Bump minimum text size to 11px (WCAG accessibility) — multiple files
- [x] **FIX-48:** Add `tabIndex`, `role`, `aria` to task cards for keyboard nav — `task-board.tsx:127`
- [x] **FIX-49:** Add `aria-pressed` to view toggle buttons — `task-board.tsx:451-480`
- [x] **FIX-50:** Fix swimlane horizontal scroll on mobile (add overflow-x-auto) — `task-board.tsx:658`
- [x] **FIX-51:** Fix calendar monthName label in week view crossing month boundary — `task-board.tsx:784`
- [x] **FIX-52:** Strip `cost_usd` from API responses (naming rules: no cost shown) — `types/mission-control.ts`
- [x] **FIX-53:** Add missing `error` entry in `EVENT_TYPE_CONFIG` — `event-feed.tsx`
- [x] **FIX-54:** Extract constants for magic numbers (20 rules, 20 templates, 10 statuses) — multiple routes
- [x] **FIX-55:** Add server-side error logging in catch blocks — all routes
- [x] **FIX-56:** Normalize rate limit pathname (strip trailing slash) — `mc-route-guard.ts:58`
- [x] **FIX-57:** Fix `handleDragEnd` reading stale `tasks` state — `task-board.tsx:1327`
- [x] **FIX-58:** Split task-board.tsx into separate files (CalendarView, SwimlaneView, TaskListView, CreateTaskDialog, FilterBar) — `task-board.tsx`

---

## BUILD ORDER

```
PHASE 1 — Critical Security + Broken Features (do first):
  FIX-03 (cross-user dependency deletion)
  FIX-04 (queue route auth bypass)
  FIX-11 (comments/reviews ownership)
  FIX-06 (estimated_hours ?? null)
  FIX-07 (clear completed_at on un-done)
  FIX-08 (add "error" to event types)

PHASE 2 — Feature Completion:
  FIX-01 (automation rules engine — biggest gap)
  FIX-02 (dependency enforcement — second biggest gap)
  FIX-09 (review approval auto-move to done)
  FIX-10 (wire Supabase Realtime, replace dead SSE)

PHASE 3 — Data Integrity + Performance:
  FIX-05 (debounce task detail PATCH)
  FIX-12 (enum validation)
  FIX-13 (string length validation)
  FIX-14 (body size check)
  FIX-15 (soft delete for undo)
  FIX-16 (useEffect infinite loop)
  FIX-17 (isSyncingRef callback)
  FIX-18 (event pagination append)
  FIX-19 (event-to-session highlight)
  FIX-20 (VPS token cleartext)
  FIX-21 (reviewer field)
  FIX-22 (reorder validation)

PHASE 4 — Medium fixes (UX + quality)
  FIX-23 through FIX-40

PHASE 5 — Low fixes (polish)
  FIX-41 through FIX-58
```

Run `npx next build` after each phase.
