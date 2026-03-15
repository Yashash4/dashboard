import Link from "next/link";

export default function DocsEventFeedPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Event Feed{" "}
        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono">ULTRA</span>
      </h1>
      <p className="lead text-lg text-muted-foreground">
        The Event Feed provides a live, streaming log of every significant action and state change
        across your Mission Control environment. Powered by Server-Sent Events (SSE), it delivers
        updates to your browser in real time with zero polling overhead.
      </p>

      <h2>How It Works</h2>
      <p>
        When you open the Event Feed, your browser establishes a persistent HTTP connection to the
        Mission Control SSE endpoint. Events are pushed to the client as they occur, with no page
        refreshes or manual polling required. The connection automatically reconnects if interrupted.
      </p>

      <h2>Event Types</h2>
      <p>
        Every event in the feed has a type, timestamp, associated entity, and payload. The following
        event types are tracked:
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Event Type</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
              <th className="text-left py-2 px-3 text-white">Payload</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>task.created</code></td>
              <td className="py-2 px-3">A new task has been created on the Task Board</td>
              <td className="py-2 px-3">Task ID, title, assignee, priority</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>task.updated</code></td>
              <td className="py-2 px-3">A task field was modified (status, assignee, priority, etc.)</td>
              <td className="py-2 px-3">Task ID, changed fields, old &amp; new values</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>task.deleted</code></td>
              <td className="py-2 px-3">A task has been removed from the board</td>
              <td className="py-2 px-3">Task ID, title</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>task.commented</code></td>
              <td className="py-2 px-3">A comment was added to a task</td>
              <td className="py-2 px-3">Task ID, comment preview, author</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>task.reviewed</code></td>
              <td className="py-2 px-3">A task review decision was submitted</td>
              <td className="py-2 px-3">Task ID, verdict (approved/rejected), reviewer</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>agent.status_changed</code></td>
              <td className="py-2 px-3">An agent&apos;s operational status changed</td>
              <td className="py-2 px-3">Agent ID, name, previous status, new status</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>session.started</code></td>
              <td className="py-2 px-3">A new agent session has begun</td>
              <td className="py-2 px-3">Session ID, agent ID, trigger</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>session.completed</code></td>
              <td className="py-2 px-3">An agent session has finished (success or failure)</td>
              <td className="py-2 px-3">Session ID, agent ID, status, duration</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>session.failed</code></td>
              <td className="py-2 px-3">An agent session ended with an error</td>
              <td className="py-2 px-3">Session ID, agent ID, error message</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>system.alert</code></td>
              <td className="py-2 px-3">A system-level alert (high CPU, memory, disk usage)</td>
              <td className="py-2 px-3">Alert type, severity, metric value, threshold</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>system.maintenance</code></td>
              <td className="py-2 px-3">Scheduled maintenance or infrastructure event</td>
              <td className="py-2 px-3">Description, expected duration</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Filtering</h2>
      <p>
        The Event Feed supports granular filtering to help you focus on the events that matter most.
        Filters can be combined and persist across browser sessions.
      </p>

      <h3>Filter by Type</h3>
      <p>
        Toggle individual event types on or off using the filter panel. For example, you can show
        only <code>agent.status_changed</code> events to monitor agent health, or only
        <code>task.created</code> and <code>task.updated</code> events to track workflow activity.
      </p>

      <h3>Filter by Agent</h3>
      <p>
        Select one or more agents from the dropdown to show only events related to those agents.
        This is useful for investigating issues with a specific agent or reviewing its activity history.
      </p>

      <h3>Filter by Time Range</h3>
      <p>
        Choose a time range to limit the feed to events within a specific window. Available presets
        include: Last 15 minutes, Last hour, Last 24 hours, Last 7 days. You can also define a
        custom date range using the date picker.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> When investigating an incident, use the time
          range filter to narrow down to the relevant window, then enable all event types to see the
          complete sequence of events leading up to and following the issue.
        </p>
      </div>

      <h2>Live Mode</h2>
      <p>
        The Event Feed defaults to Live Mode, where new events appear at the top of the feed as
        they arrive. A toggle button in the toolbar lets you pause Live Mode, which freezes the
        feed in place so you can read and investigate events without the list scrolling.
      </p>
      <p>
        While Live Mode is paused, new events continue to be received in the background. A counter
        badge on the Live Mode toggle shows the number of unread events. Resuming Live Mode
        instantly appends all accumulated events and scrolls to the most recent.
      </p>

      <h2>Event Counter Badge</h2>
      <p>
        The Event Feed tab in the Mission Control sidebar displays a badge with the count of new
        events since you last viewed the feed. This badge updates in real time and resets to zero
        when you navigate to the Event Feed. The badge uses color coding:
      </p>
      <ul>
        <li><strong>Blue</strong> &mdash; Standard events (task updates, session activity)</li>
        <li><strong>Amber</strong> &mdash; Warning events (agent status changes, approaching thresholds)</li>
        <li><strong>Red</strong> &mdash; Critical events (session failures, system alerts)</li>
      </ul>

      <h2>Click-to-Navigate</h2>
      <p>
        Every event in the feed is interactive. Click an event to navigate directly to the related
        entity:
      </p>
      <ul>
        <li><code>task.*</code> events open the Task Detail modal on the{" "}
          <Link href="/docs/ultra/task-board" className="text-amber-500">Task Board</Link>
        </li>
        <li><code>agent.*</code> events scroll to and highlight the agent on the{" "}
          <Link href="/docs/ultra/agent-roster" className="text-amber-500">Agent Roster</Link>
        </li>
        <li><code>session.*</code> events open the session detail on the{" "}
          <Link href="/docs/ultra/sessions" className="text-amber-500">Session Tracker</Link>
        </li>
        <li><code>system.*</code> events open a detail popover with full alert information</li>
      </ul>

      <h2>SSE Connection Details</h2>
      <p>
        The Event Feed connects to the <code>/api/mission-control/stream</code> endpoint using
        the standard Server-Sent Events protocol. The connection sends a heartbeat every 30 seconds
        to keep the connection alive. If the connection drops, the client automatically reconnects
        with an exponential backoff strategy (1s, 2s, 4s, up to 30s max delay).
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> The SSE connection is shared across all
          Mission Control components. Opening the Event Feed does not create a separate connection
          if another Mission Control component is already connected.
        </p>
      </div>

      <h2>Event Data Format</h2>
      <p>
        Each event delivered via SSE follows a consistent JSON structure:
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "id": "evt_abc123",
  "type": "task.updated",
  "timestamp": "2026-03-16T10:30:00Z",
  "entity_id": "tsk_xyz789",
  "entity_type": "task",
  "agent_id": "agt_def456",
  "payload": {
    "field": "status",
    "old_value": "in_progress",
    "new_value": "review"
  }
}`}</code></pre>
      <p>
        The <code>entity_id</code> and <code>entity_type</code> fields enable the click-to-navigate
        feature, while the <code>payload</code> contains event-specific data that varies by type.
      </p>
    </article>
  );
}
