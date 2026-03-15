import Link from "next/link";

export default function DocsAgentRosterPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Agent Roster{" "}
        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono">ULTRA</span>
      </h1>
      <p className="lead text-lg text-muted-foreground">
        The Agent Roster provides real-time visibility into every AI agent in your fleet. Monitor
        status, review performance metrics, control agent lifecycle, reassign work, and receive
        intelligent workload recommendations &mdash; all from a single interface.
      </p>

      <h2>Agent Status</h2>
      <p>
        Each agent in the roster displays a real-time status indicator. Status is updated automatically
        via the Mission Control SSE stream as agents transition between states.
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Indicator</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Online</td>
              <td className="py-2 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> Green</td>
              <td className="py-2 px-3">Agent is healthy and ready to accept new tasks</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Busy</td>
              <td className="py-2 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> Amber</td>
              <td className="py-2 px-3">Agent is actively processing one or more tasks</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Idle</td>
              <td className="py-2 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Blue</td>
              <td className="py-2 px-3">Agent is deployed but has no tasks assigned</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Offline</td>
              <td className="py-2 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-500" /> Gray</td>
              <td className="py-2 px-3">Agent is not running or unreachable</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Capacity Indicator</h2>
      <p>
        Each agent card displays a capacity bar showing the agent&apos;s current workload relative
        to its maximum task capacity. The capacity indicator uses a color gradient:
      </p>
      <ul>
        <li><strong>Green (0&ndash;50%)</strong> &mdash; Agent has significant availability for new tasks</li>
        <li><strong>Amber (51&ndash;80%)</strong> &mdash; Agent is moderately loaded, can accept some tasks</li>
        <li><strong>Red (81&ndash;100%)</strong> &mdash; Agent is near or at capacity, avoid assigning new work</li>
      </ul>
      <p>
        The capacity calculation considers both the number of assigned tasks and their estimated
        complexity. High-priority and complex tasks consume more capacity than simple, low-priority ones.
      </p>

      <h2>Performance Metrics</h2>
      <p>
        The Agent Roster tracks three key performance indicators for each agent, displayed directly
        on the agent card with trend arrows showing the direction compared to the previous period.
      </p>

      <h3>Tasks Completed</h3>
      <p>
        Total number of tasks moved to the &quot;Done&quot; column by this agent within the selected
        time range (default: last 7 days). This metric provides a raw throughput measurement.
      </p>

      <h3>Success Rate</h3>
      <p>
        Percentage of completed tasks that did not require rework or manual intervention. A task
        counts as successful if it moved directly to Done without being sent back to a previous
        column. This metric reflects the quality of the agent&apos;s output.
      </p>

      <h3>Average Time</h3>
      <p>
        Mean duration from when a task is assigned to the agent until it is marked as completed.
        Measured in hours or minutes depending on the scale. This metric indicates how quickly
        the agent processes work.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Use the time range selector (24h, 7d, 30d)
          at the top of the Agent Roster to adjust the period for all performance metrics. This
          helps you spot trends and compare agent performance over different windows.
        </p>
      </div>

      <h2>Agent Controls</h2>
      <p>
        Each agent card provides direct lifecycle controls accessible via the action menu (three-dot
        button) or right-click context menu.
      </p>
      <ul>
        <li><strong>Start</strong> &mdash; Deploy and start an agent that is currently offline</li>
        <li><strong>Stop</strong> &mdash; Gracefully shut down a running agent (completes in-progress tasks first)</li>
        <li><strong>Restart</strong> &mdash; Stop and immediately restart the agent (useful after configuration changes)</li>
      </ul>
      <p>
        When you stop an agent, any tasks assigned to it remain in their current column but become
        unassigned. You can then manually reassign them or let the auto-assign automation rule
        distribute them to available agents.
      </p>

      <h2>Task Reassignment</h2>
      <p>
        From the Agent Roster, you can reassign tasks between agents without navigating to the
        Task Board. Click on an agent to expand their task list, then drag a task to a different
        agent card to reassign it. Alternatively, use the action menu on a task and select
        &quot;Reassign&quot; to choose a target agent from a dropdown.
      </p>
      <p>
        Reassignment triggers a <code>task.updated</code> event in the Event Feed and is recorded
        in the task&apos;s activity log for audit purposes.
      </p>

      <h2>Historical Charts</h2>
      <p>
        Click the chart icon on any agent card to expand a detailed performance history view. The
        historical charts include:
      </p>
      <ul>
        <li><strong>Throughput over time</strong> &mdash; Tasks completed per day/week as a bar chart</li>
        <li><strong>Success rate trend</strong> &mdash; Line chart showing quality over time</li>
        <li><strong>Average resolution time</strong> &mdash; Line chart tracking efficiency changes</li>
        <li><strong>Status timeline</strong> &mdash; Gantt-style bar showing when the agent was online, busy, idle, or offline</li>
      </ul>
      <p>
        Charts support zooming (click and drag to select a range) and export to CSV for offline
        analysis.
      </p>

      <h2>Workload Recommendations</h2>
      <p>
        The Agent Roster includes an intelligent recommendation engine that analyzes agent capacity,
        performance history, and pending task queue to suggest optimal task distribution.
      </p>
      <ul>
        <li><strong>Overloaded agents</strong> &mdash; Highlights agents above 80% capacity and suggests tasks to reassign</li>
        <li><strong>Idle agents</strong> &mdash; Identifies agents with available capacity and suggests tasks to assign</li>
        <li><strong>Performance-based routing</strong> &mdash; Recommends assigning specific task types to agents with the highest success rate for that category</li>
        <li><strong>Rebalancing suggestions</strong> &mdash; Proposes bulk reassignment operations to even out workload across the fleet</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Workload recommendations appear as a banner
          at the top of the Agent Roster when actionable suggestions are available. Click
          &quot;Apply&quot; to execute the recommendation in one click, or &quot;Dismiss&quot; to
          hide it.
        </p>
      </div>

      <h2>Integration with Other Components</h2>
      <p>
        The Agent Roster is tightly integrated with the rest of Mission Control:
      </p>
      <ul>
        <li>
          <Link href="/docs/ultra/task-board" className="text-amber-500">Task Board</Link> &mdash;
          Agent status affects which agents appear in the assignee dropdown and auto-assign rules
        </li>
        <li>
          <Link href="/docs/ultra/event-feed" className="text-amber-500">Event Feed</Link> &mdash;
          Agent status changes generate <code>agent.status_changed</code> events
        </li>
        <li>
          <Link href="/docs/ultra/sessions" className="text-amber-500">Session Tracker</Link> &mdash;
          Click an agent&apos;s active session count to jump directly to their filtered session list
        </li>
      </ul>
    </article>
  );
}
