import Link from "next/link";

export default function DocsSessionTrackerPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Session Tracker{" "}
        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono">ULTRA</span>
      </h1>
      <p className="lead text-lg text-muted-foreground">
        The Session Tracker gives you full visibility into every agent execution session. View running,
        completed, and failed sessions with step-by-step execution traces, Gantt timeline
        visualizations, and detailed duration analytics.
      </p>

      <h2>Session List</h2>
      <p>
        The main view displays a paginated list of sessions sorted by start time (most recent first).
        Each session row shows:
      </p>
      <ul>
        <li><strong>Session ID</strong> &mdash; Unique identifier (e.g., <code>ses_abc123</code>)</li>
        <li><strong>Agent</strong> &mdash; The agent that executed the session, with status indicator</li>
        <li><strong>Status</strong> &mdash; Running, Completed, or Failed with color-coded badge</li>
        <li><strong>Start time</strong> &mdash; When the session began (relative &amp; absolute)</li>
        <li><strong>Duration</strong> &mdash; Elapsed time for completed sessions, live counter for running ones</li>
        <li><strong>Steps</strong> &mdash; Number of execution steps (completed / total)</li>
      </ul>

      <h3>Session Statuses</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Badge</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Running</td>
              <td className="py-2 px-3"><span className="text-blue-400">Blue, animated pulse</span></td>
              <td className="py-2 px-3">Session is actively executing steps. Duration counter ticks live.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Completed</td>
              <td className="py-2 px-3"><span className="text-green-400">Green, checkmark</span></td>
              <td className="py-2 px-3">All steps finished successfully. Full trace data available.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Failed</td>
              <td className="py-2 px-3"><span className="text-red-400">Red, X icon</span></td>
              <td className="py-2 px-3">Session terminated with an error. Failed step is highlighted.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Execution Trace</h2>
      <p>
        Click any session to expand its execution trace. The trace shows every step the agent
        performed during the session, including:
      </p>
      <ul>
        <li><strong>Step number</strong> &mdash; Sequential index within the session</li>
        <li><strong>Step name</strong> &mdash; Human-readable label (e.g., &quot;Parse user query&quot;, &quot;Retrieve knowledge base context&quot;, &quot;Generate response&quot;)</li>
        <li><strong>Status</strong> &mdash; Completed, running, pending, or failed</li>
        <li><strong>Start time &amp; duration</strong> &mdash; Precise timing for each step</li>
        <li><strong>Input data</strong> &mdash; The data passed into the step (expandable)</li>
        <li><strong>Output data</strong> &mdash; The result produced by the step (expandable)</li>
        <li><strong>Error details</strong> &mdash; For failed steps, the error message and stack trace</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Use the execution trace to debug agent
          behavior. If a session produced an unexpected result, expand each step to see exactly
          what data flowed through the pipeline and where things diverged from expectations.
        </p>
      </div>

      <h2>Gantt Timeline View</h2>
      <p>
        The Gantt timeline view provides a visual representation of session execution. Each step
        is rendered as a horizontal bar on a time axis, showing:
      </p>
      <ul>
        <li><strong>Parallelism</strong> &mdash; Steps that execute concurrently appear on separate rows at the same horizontal position</li>
        <li><strong>Duration proportionality</strong> &mdash; Bar length is proportional to step duration, making bottlenecks immediately visible</li>
        <li><strong>Color coding</strong> &mdash; Green for completed steps, blue for running, gray for pending, red for failed</li>
        <li><strong>Hover details</strong> &mdash; Hover over any bar to see the step name, duration, and status</li>
        <li><strong>Zoom controls</strong> &mdash; Zoom in to see millisecond-level detail or zoom out for the full session overview</li>
      </ul>
      <p>
        The Gantt view is particularly useful for identifying performance bottlenecks. Long bars
        indicate steps that take disproportionate time and may benefit from optimization.
      </p>

      <h2>Duration Tracking</h2>
      <p>
        The Session Tracker records precise timing data at multiple levels:
      </p>
      <ul>
        <li><strong>Total session duration</strong> &mdash; Wall-clock time from first step start to last step completion</li>
        <li><strong>Per-step duration</strong> &mdash; Individual step execution time</li>
        <li><strong>Wait time</strong> &mdash; Time between steps (idle periods)</li>
        <li><strong>Overhead</strong> &mdash; Difference between total duration and sum of step durations</li>
      </ul>
      <p>
        Duration statistics are aggregated in the session list header, showing the average, median,
        and p95 session duration across all sessions in the current filter view.
      </p>

      <h2>Filtering Sessions</h2>
      <p>
        The Session Tracker supports multiple filter dimensions to help you find specific sessions:
      </p>

      <h3>Filter by Agent</h3>
      <p>
        Select one or more agents from the dropdown to show only sessions executed by those agents.
        This is useful for comparing performance between agents or investigating an issue with a
        specific agent.
      </p>

      <h3>Filter by Status</h3>
      <p>
        Toggle Running, Completed, and Failed to show only sessions matching the selected statuses.
        For example, filter to Failed only to review all error cases.
      </p>

      <h3>Filter by Date Range</h3>
      <p>
        Use the date picker to define a start and end date for the session list. Preset options
        include: Last hour, Last 24 hours, Last 7 days, Last 30 days, and Custom range.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Combine agent and status filters to quickly
          answer questions like &quot;How many sessions did Agent X fail in the last 24 hours?&quot;
          The result count is displayed in the filter bar.
        </p>
      </div>

      <h2>Session Detail View</h2>
      <p>
        Click any session row to open the full detail view. This view combines all available
        information about the session into a single page:
      </p>
      <ul>
        <li><strong>Header</strong> &mdash; Session ID, agent name, status badge, total duration, start/end timestamps</li>
        <li><strong>Gantt timeline</strong> &mdash; Full-width timeline visualization of all steps</li>
        <li><strong>Step list</strong> &mdash; Expandable list of each step with input/output data</li>
        <li><strong>Error panel</strong> &mdash; For failed sessions, a prominent error panel showing the failure step, error message, and context</li>
        <li><strong>Related events</strong> &mdash; Links to corresponding events in the{" "}
          <Link href="/docs/ultra/event-feed" className="text-amber-500">Event Feed</Link>
        </li>
        <li><strong>Related task</strong> &mdash; If the session was triggered by a task, a link to the task on the{" "}
          <Link href="/docs/ultra/task-board" className="text-amber-500">Task Board</Link>
        </li>
      </ul>

      <h2>Real-Time Updates</h2>
      <p>
        Running sessions update in real time via the Mission Control SSE stream. As an agent
        completes each step, the session detail view updates immediately:
      </p>
      <ul>
        <li>The step list adds the newly completed step</li>
        <li>The Gantt timeline extends with the new bar</li>
        <li>The duration counter continues to tick</li>
        <li>The step progress indicator (e.g., &quot;3 / 7 steps&quot;) increments</li>
      </ul>
      <p>
        When the session completes or fails, the status badge updates and the final duration is
        recorded. No page refresh is needed at any point.
      </p>

      <h2>Performance Analysis</h2>
      <p>
        Use the Session Tracker to identify performance patterns and optimization opportunities:
      </p>
      <ul>
        <li>Sort sessions by duration to find the slowest executions</li>
        <li>Compare Gantt timelines across sessions to spot inconsistent step durations</li>
        <li>Filter to failed sessions and examine common failure patterns</li>
        <li>Track duration trends over time to verify optimization improvements</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> If you notice a specific step consistently
          taking longer than expected, check the step&apos;s input data size. Large inputs can
          significantly impact processing time. Consider optimizing your knowledge base indexing
          or adjusting the agent&apos;s context window configuration.
        </p>
      </div>
    </article>
  );
}
