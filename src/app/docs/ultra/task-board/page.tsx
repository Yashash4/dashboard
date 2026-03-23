import Link from "next/link";

export default function DocsTaskBoardPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Task Board{" "}
        <span className="text-xs bg-[color-mix(in_srgb,var(--tier-ultra),transparent_90%)] text-[var(--tier-ultra)] px-2 py-0.5 rounded font-mono">ULTRA</span>
      </h1>
      <p className="lead text-lg text-muted-foreground">
        The Task Board is a Kanban-style management interface for orchestrating AI agent work. It supports
        four distinct view modes, configurable columns, keyboard-driven workflows, automation rules,
        and real-time synchronization across all connected clients.
      </p>

      <h2>View Modes</h2>
      <p>
        The Task Board offers four view modes, each optimized for a different workflow. Switch between
        them using the view selector in the top-right corner or the keyboard shortcuts.
      </p>

      <h3>Kanban View</h3>
      <p>
        The default view. Tasks are organized into vertical columns representing workflow stages.
        Drag and drop tasks between columns to update their status. Each card displays the task title,
        assignee, priority indicator, and due date. Column headers show task counts and can be
        collapsed to save screen space.
      </p>
      <ul>
        <li>Drag-and-drop between columns with smooth animation</li>
        <li>Drop position determines task order within the column</li>
        <li>Visual indicators for priority (color-coded left border)</li>
        <li>Assignee avatar with tooltip showing agent name &amp; status</li>
        <li>Due date badge that turns red when overdue</li>
      </ul>

      <h3>List View</h3>
      <p>
        A sortable table view for managing large numbers of tasks. Click any column header to sort
        ascending or descending. Columns include: title, status, assignee, priority, due date, tags,
        and created date. Each row is clickable to open the task detail modal.
      </p>

      <h3>Swimlane View</h3>
      <p>
        Tasks are grouped into horizontal lanes based on a selected dimension. You can group by:
      </p>
      <ul>
        <li><strong>Agent</strong> &mdash; One lane per assigned agent, showing workload distribution</li>
        <li><strong>Priority</strong> &mdash; Lanes for Critical, High, Medium, and Low priority</li>
        <li><strong>Tag</strong> &mdash; One lane per tag, useful for categorizing work streams</li>
      </ul>
      <p>
        Within each lane, tasks flow through the same column stages as the Kanban view. This makes
        the Swimlane view ideal for comparing progress across agents or priority levels.
      </p>

      <h3>Calendar View</h3>
      <p>
        Tasks with due dates are rendered on a monthly calendar grid. Click a date cell to create a
        new task with that due date pre-filled. Drag tasks between dates to reschedule. Tasks without
        due dates appear in an &quot;Unscheduled&quot; sidebar.
      </p>

      <h2>Configurable Columns</h2>
      <p>
        The Task Board ships with default columns (Backlog, To Do, In Progress, Review, Done), but
        you can fully customize the column configuration to match your workflow.
      </p>
      <ul>
        <li><strong>Add columns</strong> &mdash; Create new workflow stages with a custom name and color</li>
        <li><strong>Remove columns</strong> &mdash; Delete unused columns (tasks are moved to the previous column)</li>
        <li><strong>Rename columns</strong> &mdash; Double-click any column header to edit its name inline</li>
        <li><strong>Reorder columns</strong> &mdash; Drag column headers to rearrange the workflow sequence</li>
        <li><strong>Color coding</strong> &mdash; Assign a color to each column for visual distinction across views</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Column configurations are saved per-user.
          Each team member can customize their own column layout without affecting others.
        </p>
      </div>

      <h2>Keyboard Shortcuts</h2>
      <p>
        The Task Board is designed for keyboard-first operation. All major actions are accessible
        without touching the mouse.
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Shortcut</th>
              <th className="text-left py-2 px-3 text-white">Action</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>N</code></td><td className="py-2 px-3">Create new task</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>E</code></td><td className="py-2 px-3">Edit selected task</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>D</code></td><td className="py-2 px-3">Delete selected task (with confirmation)</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>1</code> - <code>9</code></td><td className="py-2 px-3">Move selected task to column 1 through 9</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>/</code></td><td className="py-2 px-3">Focus the search bar</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>Cmd+K</code> / <code>Ctrl+K</code></td><td className="py-2 px-3">Open command palette</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>J</code> / <code>K</code></td><td className="py-2 px-3">Navigate down / up through task list</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>H</code> / <code>L</code></td><td className="py-2 px-3">Navigate left / right between columns</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>Enter</code></td><td className="py-2 px-3">Open task detail modal</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>Escape</code></td><td className="py-2 px-3">Close modal or deselect</td></tr>
            <tr className="border-b border-white/5"><td className="py-2 px-3"><code>Space</code></td><td className="py-2 px-3">Toggle task selection (for bulk operations)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Command Palette</h2>
      <p>
        Press <code>Cmd+K</code> (or <code>Ctrl+K</code> on Windows/Linux) to open the command palette.
        It provides a fuzzy-search interface for:
      </p>
      <ul>
        <li>Searching tasks by title, description, or tag</li>
        <li>Jumping to a specific task by ID</li>
        <li>Quick actions: create task, change view, filter by agent, clear filters</li>
        <li>Navigating between Mission Control components</li>
      </ul>

      <h2>Task Creation</h2>
      <p>
        Press <code>N</code> or click the &quot;New Task&quot; button to open the task creation form.
        The following fields are available:
      </p>
      <ul>
        <li><strong>Title</strong> (required) &mdash; A concise summary of the work to be done</li>
        <li><strong>Description</strong> &mdash; Rich-text description with Markdown support</li>
        <li><strong>Assignee</strong> &mdash; Select from deployed agents or leave unassigned</li>
        <li><strong>Priority</strong> &mdash; Critical, High, Medium, or Low</li>
        <li><strong>Due Date</strong> &mdash; Optional deadline with calendar picker</li>
        <li><strong>Tags</strong> &mdash; Freeform labels for categorization (comma-separated)</li>
        <li><strong>Subtasks</strong> &mdash; Break work into smaller checklist items</li>
      </ul>

      <h2>Task Detail Modal</h2>
      <p>
        Click any task or press <code>Enter</code> on a selected task to open the detail modal. The
        modal provides a comprehensive view of the task and supports the following features:
      </p>

      <h3>Comments</h3>
      <p>
        Add comments to discuss the task with your team. Comments support Markdown formatting and
        are displayed in chronological order with timestamps and author attribution.
      </p>

      <h3>Reviews</h3>
      <p>
        Tasks can go through a review process. Reviewers can approve or reject a task with an
        optional comment. The review status is displayed on the task card and factors into the
        workflow automation rules.
      </p>

      <h3>Activity Log</h3>
      <p>
        Every change to the task is recorded in the activity log: status changes, reassignments,
        priority updates, comment additions, and review decisions. The log provides a complete
        audit trail for each task.
      </p>

      <h2>Dependencies</h2>
      <p>
        Tasks can declare relationships to other tasks using two dependency types:
      </p>
      <ul>
        <li><strong>Blocks</strong> &mdash; This task must be completed before the linked task can start</li>
        <li><strong>Blocked by</strong> &mdash; This task cannot start until the linked task is completed</li>
      </ul>
      <p>
        When a task has unresolved blockers, it is visually marked with a lock icon and cannot be moved
        to the &quot;In Progress&quot; column until all blocking tasks are completed. Dependencies are
        also reflected in the Calendar view with connector lines between related tasks.
      </p>

      <h2>Automation Rules</h2>
      <p>
        Automation rules let you define triggers and actions that execute automatically when task
        state changes. This reduces manual work and ensures consistent workflows.
      </p>
      <ul>
        <li><strong>Status change triggers</strong> &mdash; When a task moves to a specific column, execute an action</li>
        <li><strong>Auto-assign</strong> &mdash; Automatically assign tasks to the least-loaded agent when created</li>
        <li><strong>Auto-escalate</strong> &mdash; Increase priority if a task stays in the same column for too long</li>
        <li><strong>Notify on completion</strong> &mdash; Send a notification when a task reaches the Done column</li>
        <li><strong>Chain tasks</strong> &mdash; Automatically unblock dependent tasks when a blocker completes</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Combine automation rules with dependencies to
          build sophisticated pipelines. For example, set up a rule that auto-assigns the next task in a
          chain to an agent as soon as its blocker is completed.
        </p>
      </div>

      <h2>Recurring Tasks</h2>
      <p>
        For work that needs to happen on a schedule, configure recurring tasks. Specify a cron-like
        schedule (daily, weekly, monthly, or custom interval), and the Task Board will automatically
        create new task instances at the configured frequency. Each recurrence inherits the template
        task&apos;s title, description, assignee, priority, and tags.
      </p>

      <h2>Templates</h2>
      <p>
        Save frequently used task configurations as templates. When creating a new task, select a
        template to pre-fill all fields. Templates are shared across your organization and can
        include subtasks, tags, priority, and a default assignee.
      </p>

      <h2>Bulk Operations</h2>
      <p>
        Select multiple tasks using <code>Space</code> or click the checkbox on each task card. With
        tasks selected, a bulk action toolbar appears at the bottom of the screen. Available bulk
        actions include:
      </p>
      <ul>
        <li>Move to column (change status)</li>
        <li>Change priority</li>
        <li>Reassign to a different agent</li>
        <li>Add or remove tags</li>
        <li>Delete selected tasks</li>
      </ul>

      <h2>Search &amp; Filter</h2>
      <p>
        Use the search bar (<code>/</code> to focus) to filter tasks by title or description text.
        Additional filter controls let you narrow results by:
      </p>
      <ul>
        <li>Status (column)</li>
        <li>Assignee (agent)</li>
        <li>Priority level</li>
        <li>Tags</li>
        <li>Due date range</li>
        <li>Created date range</li>
      </ul>
      <p>
        Filters are combinable and persist across view mode switches. Active filters are displayed as
        dismissible chips above the board.
      </p>

      <h2>Real-Time Updates</h2>
      <p>
        The Task Board connects to the Mission Control SSE stream and reflects changes from all
        connected clients in real time. When another user moves a task, creates a new task, or
        updates a field, the board updates immediately without requiring a page refresh.
      </p>
      <p>
        Drag-and-drop operations use optimistic updates: the UI reflects the change instantly while
        the server persists the new state. If the server rejects the change (e.g., due to a
        dependency constraint), the task snaps back to its original position with an error notification.
      </p>

      <h2>Drag-and-Drop Persistence</h2>
      <p>
        Task ordering within columns and between columns is persisted server-side. When you reorder
        tasks by dragging within a column, the new sort order is saved and reflected for all users.
        The board uses fractional indexing to minimize write operations when reordering.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> The Task Board is the heart of Mission Control.
          Spend time configuring your columns, setting up automation rules, and learning the keyboard
          shortcuts to get the most out of it. Check the{" "}
          <Link href="/docs/ultra/agent-roster" className="text-[var(--tier-ultra)] hover:underline">
            Agent Roster
          </Link>{" "}
          docs to understand how agent status affects task assignment.
        </p>
      </div>
    </article>
  );
}
