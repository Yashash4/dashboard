# Mission Control Post-Fix UX Review ($350/month Tier)

**Reviewer:** UX Reviewer (paying customer, $350/month)
**Date:** 2026-03-16
**Previous Rating:** 7/10 ($150-200 product)
**Scope:** Full re-evaluation of all Mission Control components after FIX-series patches

---

## 1. Command Palette (FIX improvement check)

**Previous complaint:** "Only 7 items, feels bare."

**Current state:** Still 7 items total (Create Task, Keyboard Shortcuts, Overview, Task Board, Agent Roster, Event Feed, Sessions). The shortcuts sub-view is a nice addition (lists 10 keyboard shortcuts), but the palette itself has not grown in actionable scope.

**What is still missing:**
- No "Assign agent to task" quick action
- No "Change task priority" bulk action
- No "Jump to task by name" (search tasks, not just navigate pages)
- No "Create automation rule" action
- No "Filter by..." quick action
- No recently accessed tasks/sessions

**Verdict:** Marginal improvement. Still feels like a navigation menu, not a command palette. A $350 product should let me do things from the palette, not just go places. **5/10**

---

## 2. Agent Roster -- Search/Filter (FIX-27)

**Previous complaint:** No way to search or filter agents.

**Current state:** Search input is present (line 164-172 of `agent-roster.tsx`). Text search works against agent name and description. There is a `statusFilter` state variable declared, but **the status filter buttons are never rendered in the UI**. The state exists but no toggle/dropdown is wired to it.

Also present:
- Agent count display ("X agents")
- Summary cards for all 6 statuses (online, working, idle, blocked, sleeping, offline)
- Agent action buttons (Start/Stop/Restart) in the detail sheet

**What is still missing:**
- Status filter UI is missing (state exists, UI does not)
- Sort options (by performance, by capacity, by last active)

**Verdict:** Search works. Status filter is half-implemented (backend state, no UI). **7/10**

---

## 3. Session Tracker -- Search/Filter/Sort (FIX-28)

**Previous complaint:** No search, filter, or sort.

**Current state:** This is well-implemented:
- Text search across agent name and task title
- Status filter tabs (All / Active / Completed / Failed) with visual tab group
- Session count display
- Trace views (Gantt timeline + tree view toggle)
- Heat-map coloring on step durations
- Trace summary header with step/timing aggregation

**What is still missing:**
- Sort controls (by duration, by date, by agent) -- no sort UI exists
- Date range filter

**Verdict:** Strong improvement. Feels functional and informative. The Gantt timeline is a standout feature. **8.5/10**

---

## 4. Task Deletion -- Confirmation Dialog (FIX-25)

**Previous complaint:** Tasks deleted instantly with no confirmation.

**Current state:** Fully implemented using `AlertDialog` from shadcn/ui (lines 895-926 of `task-detail-modal.tsx`):
- Shows task title in the confirmation prompt: `Delete "task title"?`
- "This action cannot be undone." warning text
- Cancel and Delete (red) buttons
- Delete also supports undo via `undoStack.push()` in the board

**Verdict:** Proper confirmation dialog. Undo support is a bonus. **9/10**

---

## 5. Overview -- "+X more" Indicators (FIX-40)

**Previous complaint:** Overview cards truncated lists with no indication of overflow.

**Current state:** In `mission-control-overview.tsx`, the "Tasks In Progress" section shows:
```
{inProgressTasks.length > 4 && (
  <p className="text-xs text-muted-foreground text-center pt-1">
    +{inProgressTasks.length - 4} more
  </p>
)}
```

This is present for in-progress tasks (shows first 4, then "+X more"). However:
- Agent roster mini shows ALL agents with no limit or "+X more"
- Recent events shows first 5 with no "+X more" indicator
- Active sessions shows all with no truncation

**Verdict:** Partially implemented. Only tasks section has it. **6/10**

---

## 6. Calendar -- Expanded Day Layout (FIX-26)

**Previous complaint:** Expanded day view broke the grid layout.

**Current state:** The expanded day uses `col-span-7` CSS class (line 846):
```
isExpanded ? "col-span-7 min-h-0" : ""
```

When a day is clicked, it spans the full width of the calendar row and renders full task cards with priority badges, agent names, and click-to-open-detail. The implementation is functional.

**Additional calendar features found:**
- Month/Week/Day view toggle
- Prev/Next/Today navigation
- Priority dot indicators on compact days
- "+X" overflow indicator when >5 tasks on a day
- "X tasks without due dates" info note

**What is still missing:**
- Drag-to-reschedule (no DnD on calendar)
- The expanded day takes over the entire row, which pushes all other days in that row out of view -- this is a layout tradeoff, not a fix

**Verdict:** Working but the col-span-7 approach is a layout hack. It works, but it is not elegant. **7/10**

---

## 7. Accessibility (FIX-47, 48, 49)

### Text sizes
- Most labels use `text-[10px]` or `text-[9px]` -- this is 10px and 9px. WCAG recommends minimum 12px for body text
- Session step numbers, tag badges, column counts, timestamps all use sub-10px sizing
- The `text-[8px]` class appears in calendar overflow indicators -- 8 pixels is functionally unreadable

### ARIA attributes
- View toggle buttons in FilterBar have `aria-pressed` and `role="button"` -- good
- That is the **only** ARIA usage across all MC components (8 total occurrences, all in the same FilterBar)
- Task cards have no `role="listitem"` or `aria-label`
- Drag handles have no `aria-roledescription="sortable"`
- Command palette uses cmdk which has built-in ARIA -- credit there
- No `aria-live` regions for real-time status updates
- No skip navigation links
- No focus management when modals open/close (relying on radix dialog defaults, which is acceptable)

### Keyboard navigation
- Keyboard shortcuts exist (n, j, k, h, l, /, ?, Enter, Escape, mod+k)
- Tab navigation relies on native browser behavior
- No visible focus indicators on task cards

**Verdict:** Accessibility is still weak. The text sizes are a legitimate readability concern. ARIA is nearly absent outside of view toggle buttons. **4/10**

---

## 8. Mobile -- Swimlane Scroll (FIX-50)

**Previous complaint:** Swimlane view broken on mobile.

**Current state:** The swimlane view uses CSS grid with:
```
style={{ gridTemplateColumns: `repeat(${MC_COLUMNS.length}, minmax(150px, 1fr))` }}
```

With 7 columns at 150px minimum, that is 1050px minimum width. The container has `overflow-x-auto` which allows horizontal scroll. The kanban board also uses `flex gap-4 overflow-x-auto` with `flex-shrink-0 w-[280px]` columns.

**Issues:**
- On mobile, 7 columns at 150px each in swimlane is unusable without very deliberate horizontal scrolling
- No responsive collapse (e.g., stack columns on mobile)
- Column headers in swimlane are `text-[10px]` -- barely readable on mobile
- Kanban columns are fixed at `w-[280px] sm:w-[300px]` -- reasonable for kanban scroll

**Verdict:** The scroll technically works but the swimlane experience on mobile is poor. Kanban scroll is acceptable as that is standard pattern. **5.5/10**

---

## 9. Create Task -- Column Selector (FIX-39)

**Previous complaint:** Tasks always created in Planning, no way to choose starting column.

**Current state:** The CreateTaskDialog (lines 987-1132) still hardcodes:
```
column_id: "planning",
```

There is **no column selector** in the create task form. The available fields are: Title, Description, Priority, Agent, Due Date, Estimated Hours, Tags, Subtasks. Column selection is absent.

**Verdict:** Not fixed. Tasks still always go to Planning. **2/10**

---

## 10. Automation Rules -- Functional?

**Backend exists:**
- API routes: GET/POST at `/api/mission-control/automation-rules`
- API routes: GET/PUT/DELETE at `/api/mission-control/automation-rules/[id]`
- Execution engine: `mc-automation.ts` handles 4 action types (assign_agent, move_to_column, create_task, send_notification)
- Trigger types supported: task state changes, agent status changes
- Run count tracking, activity logging to VPS

**Frontend exists:** NO. There is **zero UI** for automation rules. No component, no page, no settings panel. The API is fully built but completely invisible to the user.

**Verdict:** Backend-only feature. As a paying customer, I cannot access this at all. **1/10**

---

## 11. Dependencies -- Can I Block Tasks?

**Backend exists:**
- API routes: GET/POST/DELETE at `/api/mission-control/tasks/[id]/dependencies`
- Circular dependency detection (checks reverse dependency)
- Dependency data returned with task title and column_id via join

**Frontend exists:** NO. There is **zero UI** for dependencies. No dependency picker in task detail modal. No visual indicators on blocked tasks. No dependency graph. The API supports it but the user cannot interact with it.

**Verdict:** Backend-only feature. Invisible to the user. **1/10**

---

## 12. Overall Reassessment

### Scoring Summary

| Area | Previous | Current | Delta |
|------|----------|---------|-------|
| Command Palette | 5/10 | 5/10 | +0 |
| Agent Roster Search | 3/10 | 7/10 | +4 |
| Session Search/Filter | 3/10 | 8.5/10 | +5.5 |
| Task Deletion Confirm | 2/10 | 9/10 | +7 |
| Overview "+X more" | 4/10 | 6/10 | +2 |
| Calendar Expand | 4/10 | 7/10 | +3 |
| Accessibility | 3/10 | 4/10 | +1 |
| Mobile Swimlane | 3/10 | 5.5/10 | +2.5 |
| Create Task Column | 2/10 | 2/10 | +0 |
| Automation Rules UI | N/A | 1/10 | -- |
| Dependencies UI | N/A | 1/10 | -- |

### What Improved Significantly
1. **Task deletion** -- proper confirmation dialog with undo. Professional.
2. **Session tracker** -- search, filter tabs, Gantt timeline, trace summary. This is the best component in MC now.
3. **Agent roster** -- search works, action buttons (start/stop/restart) are a real operational feature.
4. **Event feed** -- type/severity filters, live/pause toggle, pagination, session linking. Solid.
5. **Task board** -- 4 view modes (kanban, list, swimlane, calendar), DnD, keyboard shortcuts, undo stack. Feature-rich.
6. **Task detail modal** -- tabs (details, comments, review, activity), inline editing, subtasks, tags, debounced updates. Comprehensive.

### What Is Still Missing for $350/month

**Critical gaps:**
1. **No automation rules UI** -- the backend is built, the frontend is not. This is a headline feature that does not exist for the user.
2. **No dependencies UI** -- same situation. API built, no way to use it.
3. **No column selector on task creation** -- trivial fix, still not done.
4. **Command palette is still just navigation** -- no task search, no quick actions.

**Important gaps:**
5. **Accessibility is below acceptable standards** -- 9-10px text sizes throughout, almost no ARIA attributes, no visible focus indicators on cards.
6. **No sort controls** in agent roster or session tracker.
7. **Status filter UI missing** in agent roster (state declared, no buttons rendered).
8. **Overview "+X more"** only implemented for tasks, not agents/events/sessions sections.

**Nice-to-have gaps:**
9. No bulk operations (select multiple tasks, bulk move/assign/delete)
10. No task templates UI (the backend `mc_task_templates` table exists for automation)
11. No export/reporting
12. No notification system (automation `send_notification` is a no-op placeholder)
13. No drag-to-reschedule on calendar

### Updated Rating

**Previous: 7/10 ($150-200 product)**

The session tracker, event feed, and task board are now genuinely strong. The detail modal with comments/reviews/activity tabs is feature-complete. Agent actions (start/stop/restart) add real operational value. The overall polish is noticeably better.

However, two major advertised features (automation rules and dependencies) have zero frontend. The command palette has not evolved. Accessibility is still below professional standards. Create-task column selector is still missing.

**Current: 7.5/10 ($200-250 product)**

The fixes addressed the easy wins (confirmation dialogs, search inputs, filter tabs) but did not tackle the hard, differentiating features (automation UI, dependency visualization, accessibility overhaul). The product improved in comfort and polish but not in capability ceiling.

---

## 13. What Is STILL Missing (Priority-Ordered)

1. **Automation Rules management UI** -- create, edit, enable/disable, view run history
2. **Task Dependencies UI** -- add/remove dependencies, blocked task indicators, dependency chain visualization
3. **Column selector** in create task dialog
4. **Accessibility overhaul** -- bump minimum text to 12px, add ARIA labels to all interactive elements, add visible focus indicators
5. **Command palette actions** -- search tasks by name, quick-assign, quick-move, quick-filter
6. **Agent roster status filter buttons** -- wire up the existing state
7. **Sort controls** across all list views
8. **Overview "+X more"** for all sections, not just tasks
9. **Bulk task operations**
10. **Notification system** to complete the automation loop

---

## 14. Would I Pay $350/month for This?

**No.** Not yet.

At $350/month, I expect:
- **Automation that I can configure and see working.** The engine exists but I cannot touch it. This alone blocks the premium tier.
- **Dependency management.** If I cannot block tasks and see them unblock, I am using a fancy to-do list, not a mission control system.
- **Accessibility that passes basic WCAG AA.** 9px text and no ARIA is not acceptable at any price point, let alone $350.

The product is closer to $200-250/month value. To reach $350, it needs the automation UI, dependency UI, and an accessibility pass. Those three things would push this to 8.5-9/10 territory and justify the price.

**Bottom line:** Good progress on comfort and polish. The hard features that justify premium pricing are built on the backend but invisible on the frontend. Ship those UIs and this becomes a $350 product.
