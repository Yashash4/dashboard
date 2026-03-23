import Link from "next/link";

export default function DocsUltraFeaturesOverviewPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Mission Control{" "}
        <span className="text-xs bg-[color-mix(in_srgb,var(--tier-ultra),transparent_90%)] text-[var(--tier-ultra)] px-2 py-0.5 rounded font-mono">ULTRA</span>
      </h1>
      <p className="lead text-lg text-muted-foreground">
        Mission Control is the command center for your AI agent workforce. Available exclusively on the
        Ultra plan ($350/mo), it provides a unified operations hub where you can orchestrate tasks,
        monitor agent performance, track sessions, and respond to events in real time.
      </p>

      <h2>Why Mission Control?</h2>
      <p>
        Running a fleet of AI agents across multiple channels generates enormous operational complexity.
        Mission Control consolidates everything into a single, real-time interface so you can manage
        workloads, identify bottlenecks, and keep your agents running at peak efficiency.
      </p>
      <ul>
        <li>Centralized task management with drag-and-drop Kanban boards</li>
        <li>Live agent monitoring with health indicators &amp; performance metrics</li>
        <li>Real-time event streaming via Server-Sent Events (SSE)</li>
        <li>Session tracing with step-by-step execution timelines</li>
        <li>Keyboard-driven workflow with command palette &amp; shortcuts</li>
      </ul>

      <h2>Core Components</h2>
      <p>
        Mission Control is organized into five interconnected components. Each is accessible from the
        Mission Control sidebar and works together to give you full visibility into your agent operations.
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
        <Link
          href="/docs/ultra"
          className="block border border-[var(--border-primary)] rounded-lg p-5 hover:border-[color-mix(in_srgb,var(--tier-ultra),transparent_60%)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📊</span>
            <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">Overview Dashboard</h3>
          </div>
          <p className="text-sm text-muted-foreground m-0">
            High-level metrics at a glance: active agents, pending tasks, running sessions,
            and recent events. Your operational heartbeat.
          </p>
        </Link>

        <Link
          href="/docs/ultra/task-board"
          className="block border border-[var(--border-primary)] rounded-lg p-5 hover:border-[color-mix(in_srgb,var(--tier-ultra),transparent_60%)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📋</span>
            <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">Task Board</h3>
          </div>
          <p className="text-sm text-muted-foreground m-0">
            Kanban-style task management with four view modes, configurable columns,
            automation rules, and full keyboard navigation.
          </p>
        </Link>

        <Link
          href="/docs/ultra/agent-roster"
          className="block border border-[var(--border-primary)] rounded-lg p-5 hover:border-[color-mix(in_srgb,var(--tier-ultra),transparent_60%)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🤖</span>
            <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">Agent Roster</h3>
          </div>
          <p className="text-sm text-muted-foreground m-0">
            Real-time agent status monitoring with capacity indicators, performance metrics,
            direct controls, and workload recommendations.
          </p>
        </Link>

        <Link
          href="/docs/ultra/event-feed"
          className="block border border-[var(--border-primary)] rounded-lg p-5 hover:border-[color-mix(in_srgb,var(--tier-ultra),transparent_60%)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚡</span>
            <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">Event Feed</h3>
          </div>
          <p className="text-sm text-muted-foreground m-0">
            Live-streaming event log powered by SSE. Filter by type, agent, or time range.
            Click any event to navigate directly to the related entity.
          </p>
        </Link>

        <Link
          href="/docs/ultra/sessions"
          className="block border border-[var(--border-primary)] rounded-lg p-5 hover:border-[color-mix(in_srgb,var(--tier-ultra),transparent_60%)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔍</span>
            <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">Session Tracker</h3>
          </div>
          <p className="text-sm text-muted-foreground m-0">
            Trace every agent session from start to finish with Gantt timeline views,
            step-by-step execution data, and duration analytics.
          </p>
        </Link>
      </div>

      <h2>Overview Dashboard</h2>
      <p>
        The Overview Dashboard is the default landing view when you open Mission Control. It surfaces
        the most important operational metrics so you can assess the state of your agent workforce
        at a glance.
      </p>
      <h3>Key Metrics</h3>
      <ul>
        <li><strong>Active Agents</strong> &mdash; Number of agents currently online and processing requests</li>
        <li><strong>Pending Tasks</strong> &mdash; Tasks awaiting assignment or currently in progress</li>
        <li><strong>Running Sessions</strong> &mdash; Live sessions with step-by-step status indicators</li>
        <li><strong>Recent Events</strong> &mdash; The latest events from your agent fleet, updated in real time</li>
        <li><strong>Task Completion Rate</strong> &mdash; Percentage of tasks completed successfully over the last 24 hours</li>
        <li><strong>Average Resolution Time</strong> &mdash; Mean time from task creation to completion</li>
      </ul>

      <h3>Real-Time Updates</h3>
      <p>
        The Overview Dashboard connects to the Mission Control SSE stream and updates all metrics
        automatically. There is no need to refresh the page. When an agent changes status, a task
        moves between columns, or a session completes, the dashboard reflects it instantly.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-[var(--text-primary)]">Tip:</strong> Use the Overview Dashboard as your primary
          monitoring screen. Its lightweight design makes it ideal for display on a secondary monitor
          or wall-mounted dashboard where you need continuous visibility into operations.
        </p>
      </div>

      <h2>Getting Started</h2>
      <p>
        Mission Control is available immediately when you subscribe to the Ultra plan. Navigate to the
        Mission Control section in your dashboard sidebar to access all five components. No additional
        configuration is required &mdash; Mission Control automatically discovers your deployed agents
        and begins tracking their activity.
      </p>

      <h3>Prerequisites</h3>
      <ul>
        <li>Active Ultra plan subscription ($350/mo)</li>
        <li>At least one deployed AI agent</li>
        <li>A modern browser with JavaScript enabled (for SSE real-time updates)</li>
      </ul>

      <h3>Navigation</h3>
      <p>
        All Mission Control components are accessible from the dedicated sidebar section. You can also
        use the command palette (<code>Cmd+K</code> / <code>Ctrl+K</code>) to jump between components
        quickly, search for specific tasks, or execute common actions without leaving the keyboard.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-[var(--text-primary)]">Tip:</strong> Explore each component in detail using the links
          above. The Task Board documentation is the most comprehensive, covering all four view modes,
          keyboard shortcuts, automation rules, and bulk operations.
        </p>
      </div>

      <h2>Architecture</h2>
      <p>
        Mission Control is built on a real-time event-driven architecture. All state changes flow
        through a centralized event bus, which broadcasts updates via Server-Sent Events to connected
        clients. This ensures every open dashboard reflects the current state within milliseconds.
      </p>
      <ul>
        <li><strong>Event Bus</strong> &mdash; Central message broker for all Mission Control events</li>
        <li><strong>SSE Stream</strong> &mdash; Persistent HTTP connection delivering real-time updates to the browser</li>
        <li><strong>Optimistic Updates</strong> &mdash; UI updates immediately on user action, reconciles with server state</li>
        <li><strong>Conflict Resolution</strong> &mdash; Last-write-wins with timestamp comparison for concurrent edits</li>
      </ul>
    </article>
  );
}
