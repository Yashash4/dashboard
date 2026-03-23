import Link from "next/link";

export default function DocsDashboardOverviewPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Dashboard Overview</h1>
      <p className="text-muted-foreground text-lg">
        Your ClawHQ dashboard is the central hub for managing every aspect of your AI deployment.
        From real-time health monitoring to quick agent actions, everything you need is accessible
        from a single, unified interface.
      </p>

      <h2>Onboarding Checklist</h2>
      <p>
        When you first log in, the dashboard displays an onboarding checklist that guides you
        through the five essential steps to get your ClawHQ instance fully operational. Each step
        automatically marks itself as complete once the corresponding action has been taken, so
        you never need to manually check anything off.
      </p>
      <ol>
        <li><strong>VPS Provisioned</strong> — Your dedicated VPS has been set up and is running.</li>
        <li><strong>First Agent Deployed</strong> — You have deployed at least one agent from the <Link href="/docs/store" className="text-primary hover:underline">Agent Store</Link>.</li>
        <li><strong>Channel Connected</strong> — A communication channel (WhatsApp, Telegram, web widget, etc.) has been linked to your instance.</li>
        <li><strong>First Conversation</strong> — Your agent has handled at least one real conversation via a connected channel or the <Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> interface.</li>
        <li><strong>Model Configured</strong> — You have reviewed or switched your <Link href="/docs/models" className="text-primary hover:underline">AI model</Link> to the one that best suits your workload.</li>
      </ol>
      <p>
        The checklist remains visible at the top of the dashboard until all five steps are complete.
        After completion, it collapses into a small congratulatory banner that you can dismiss
        permanently.
      </p>

      <h2>Health Status Indicator</h2>
      <p>
        A prominent status badge at the top of the dashboard provides an at-a-glance assessment
        of your VPS health. The indicator uses three states:
      </p>
      <ul>
        <li><strong>Healthy (green)</strong> — CPU, RAM, and disk usage are all within normal operating ranges.</li>
        <li><strong>Warning (yellow)</strong> — One or more resources have crossed the 70% utilization threshold. You should investigate and consider optimizing your deployment.</li>
        <li><strong>Critical (red)</strong> — A resource has exceeded 90% utilization, or a core service is unresponsive. Immediate action is recommended.</li>
      </ul>
      <p>
        The health indicator pulls live data from your <Link href="/docs/vps" className="text-primary hover:underline">VPS</Link> and
        displays the current CPU percentage, RAM percentage, and disk percentage alongside the
        badge. Clicking the indicator navigates you directly to the VPS monitoring dashboard for
        a deeper breakdown.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          If your health indicator shows a persistent warning, check the VPS monitoring dashboard
          for trends. A gradual increase in RAM usage over several days could indicate a memory
          leak in a deployed agent.
        </p>
      </div>

      <h2>Recent Activity Feed</h2>
      <p>
        The recent activity feed shows the last 10 actions performed across your entire ClawHQ
        instance. Events are aggregated from multiple sources, giving you a single timeline of
        everything happening on your platform:
      </p>
      <ul>
        <li><strong>Agent events</strong> — deployments, undeployments, configuration changes, and errors.</li>
        <li><strong>Channel events</strong> — new connections, disconnections, and health check failures.</li>
        <li><strong>Ticket events</strong> — new support tickets, replies, and resolutions.</li>
        <li><strong>Chat events</strong> — notable conversations, escalations, and feedback submissions.</li>
      </ul>
      <p>
        Each activity entry includes a timestamp, the event type, a human-readable description,
        and a direct link to the relevant section of the dashboard. The feed refreshes
        automatically every 30 seconds.
      </p>

      <h2>Sparkline Trends on Stat Cards</h2>
      <p>
        The dashboard displays four primary stat cards — total conversations, active agents,
        connected channels, and open tickets. Each card includes a 7-day sparkline mini-chart
        that visualizes the trend for that metric over the past week.
      </p>
      <p>
        Sparklines use a subtle gradient fill beneath the line to make upward or downward trends
        immediately visible. A green sparkline indicates a positive trend (e.g., increasing
        conversations), while a red sparkline signals a metric that may need attention (e.g.,
        rising open tickets).
      </p>

      <h2>Notification Center</h2>
      <p>
        The bell icon in the top navigation bar serves as your notification center. A red badge
        displays the count of unread notifications. Clicking the bell opens a dropdown panel
        listing all recent in-app notifications, organized by time.
      </p>
      <p>Notifications are generated for the following events:</p>
      <ul>
        <li><strong>Ticket replies</strong> — When a support team member responds to one of your tickets.</li>
        <li><strong>Agent errors</strong> — When a deployed agent encounters an error or becomes unresponsive.</li>
        <li><strong>VPS status changes</strong> — When your VPS starts, stops, restarts, or enters a critical state.</li>
        <li><strong>Channel disconnects</strong> — When a connected channel loses its connection and requires reconfiguration.</li>
      </ul>
      <p>
        Each notification can be individually marked as read, or you can use the &quot;Mark all as
        read&quot; action to clear the entire list. Notification preferences can be configured from
        your <Link href="/docs/dashboard" className="text-primary hover:underline">Account Settings</Link> page.
      </p>

      <h2>System Alerts</h2>
      <p>
        When critical conditions are detected, the dashboard displays prominent alert banners
        at the top of the page. These banners persist until the underlying issue is resolved and
        cannot be dismissed. The following conditions trigger system alerts:
      </p>
      <ul>
        <li><strong>VPS Stopped</strong> — Your dedicated VPS is not running. All agents and channels are offline. A &quot;Start VPS&quot; button is included directly in the banner.</li>
        <li><strong>High Resource Usage</strong> — CPU or RAM has exceeded 90% for more than 5 minutes.</li>
        <li><strong>No Channels Connected</strong> — You have no active communication channels. Your agents cannot receive messages from end users.</li>
        <li><strong>No Agents Deployed</strong> — No agents are currently deployed on your VPS. Conversations cannot be handled.</li>
      </ul>

      <div className="not-prose bg-[color-mix(in_srgb,var(--warning),transparent_95%)] border border-[color-mix(in_srgb,var(--warning),transparent_80%)] rounded-lg p-4 my-6">
        <p className="font-semibold text-[var(--warning)] mb-1">Warning</p>
        <p className="text-sm text-muted-foreground">
          System alerts indicate conditions that directly impact your service availability.
          Address them promptly to avoid downtime for your end users.
        </p>
      </div>

      <h2>Quick Actions</h2>
      <p>
        The quick actions panel provides one-click shortcuts to the most common tasks. ClawHQ
        offers eight available quick actions, and you can customize which ones appear by pinning
        and unpinning them:
      </p>
      <ul>
        <li>Deploy an Agent</li>
        <li>Connect a Channel</li>
        <li>Open Chat</li>
        <li>Create a Ticket</li>
        <li>View Logs</li>
        <li>Restart VPS</li>
        <li>Switch Model</li>
        <li>Manage API Keys</li>
      </ul>
      <p>
        To customize your quick actions, click the gear icon on the panel header. In the
        configuration dialog, drag actions to reorder them or toggle the pin icon to show or
        hide specific actions. Your preferences are saved to your account and persist across
        sessions and devices.
      </p>

      <h2>Usage Summary Card</h2>
      <p>
        Starter plan users see a usage summary card on the dashboard that provides a clear
        breakdown of their plan consumption. The card displays:
      </p>
      <ul>
        <li>Total conversations this billing cycle vs. plan allocation.</li>
        <li>Number of deployed agents vs. maximum allowed.</li>
        <li>Number of connected channels vs. maximum allowed.</li>
        <li>Model switches used this month vs. the 5-switch monthly limit.</li>
      </ul>
      <p>
        Each metric includes a progress bar that fills as you approach your limit. The bar
        transitions from green to yellow at 70% and from yellow to red at 90%. If you reach
        a limit, the card displays an upgrade prompt linking to the{" "}
        <Link href="/docs/models" className="text-primary hover:underline">billing page</Link>.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary mb-1">Tip</p>
        <p className="text-sm text-muted-foreground">
          Pro and Ultra plan users do not see the usage summary card, as those plans include
          higher or unlimited allocations for all metrics.
        </p>
      </div>

      <h2>Related Documentation</h2>
      <ul>
        <li><Link href="/docs/vps" className="text-primary hover:underline">VPS Management</Link> — Monitor and control your dedicated VPS.</li>
        <li><Link href="/docs/agents" className="text-primary hover:underline">Agents</Link> — Deploy and manage your AI agents.</li>
        <li><Link href="/docs/chat" className="text-primary hover:underline">Chat</Link> — Interact with your agents in real time.</li>
        <li><Link href="/docs/models" className="text-primary hover:underline">AI Models</Link> — Configure and switch your AI model.</li>
        <li><Link href="/docs/store" className="text-primary hover:underline">Agent Store</Link> — Browse and install pre-built agents.</li>
      </ul>
    </article>
  );
}
