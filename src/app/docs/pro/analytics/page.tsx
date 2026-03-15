import Link from "next/link";

export default function DocsAnalyticsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Analytics{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The Analytics module transforms raw conversation data into actionable insights. Track
        conversation funnels, measure customer satisfaction, detect anomalies, build custom
        dashboards, and schedule automated reports — all from a single interface.
      </p>

      <h2>Summary Cards</h2>

      <p>
        The analytics dashboard opens with four summary cards that provide an at-a-glance overview
        of your instance&apos;s activity:
      </p>

      <ul>
        <li><strong>Total Messages</strong> — The total number of messages sent and received across all channels and agents in the selected time range</li>
        <li><strong>Conversations</strong> — The number of distinct conversation sessions initiated during the period</li>
        <li><strong>Avg Response Time</strong> — The mean time between a user message and the agent&apos;s reply, measured in seconds</li>
        <li><strong>Peak Hour</strong> — The hour of day with the highest message volume, helping you understand when your users are most active</li>
      </ul>

      <p>
        Each card shows the current value alongside a percentage change compared to the previous
        period, so you can instantly see whether metrics are trending up or down.
      </p>

      <h2>Charts</h2>

      <p>
        Four built-in charts visualize your conversation data across different dimensions:
      </p>

      <ol>
        <li><strong>Messages Over Time</strong> — A line chart showing message volume by day, revealing trends and seasonal patterns</li>
        <li><strong>Requests by Hour</strong> — A bar chart breaking down activity by hour of day, useful for capacity planning and business hours decisions</li>
        <li><strong>Messages by Agent</strong> — A stacked chart showing how message volume distributes across your deployed agents</li>
        <li><strong>Daily Conversations</strong> — A bar chart of unique conversation sessions per day, distinct from raw message count</li>
      </ol>

      <p>
        All charts support <strong>7-day, 14-day, and 30-day</strong> time ranges. Select the
        range from the dropdown at the top of the page, and every chart and summary card updates
        to reflect the selected window.
      </p>

      <h2>Conversation Funnels</h2>

      <p>
        Funnels track how conversations progress through five stages:
      </p>

      <ol>
        <li><strong>Started</strong> — User initiated a conversation</li>
        <li><strong>Engaged</strong> — User sent at least two messages</li>
        <li><strong>Substantive</strong> — Conversation reached meaningful depth (5+ message exchanges)</li>
        <li><strong>Resolved</strong> — The conversation reached a resolution (user confirmed or conversation ended naturally)</li>
        <li><strong>Satisfied</strong> — User provided positive feedback or a high CSAT rating</li>
      </ol>

      <p>
        The funnel visualization shows the drop-off rate between each stage. If a large percentage
        of users start conversations but few reach the &quot;Engaged&quot; stage, your agents may
        need better opening responses. If most conversations engage but few resolve, the agents
        may need more domain knowledge via the{" "}
        <Link href="/docs/pro/knowledge-base">Knowledge Base</Link>.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> Funnel data pairs well with conversation
        path analysis. Check the paths view to understand <em>where</em> users drop off, then
        use funnels to measure whether your improvements change the drop-off rates.
      </div>

      <h2 id="csat">CSAT Dashboard</h2>

      <p>
        The Customer Satisfaction (CSAT) dashboard collects and visualizes satisfaction ratings
        from your users. When CSAT collection is enabled, users are prompted to rate their
        experience at the end of a conversation.
      </p>

      <p>
        The dashboard displays:
      </p>

      <ul>
        <li>Overall CSAT score as a percentage</li>
        <li>CSAT trend over time (daily scores plotted on a line chart)</li>
        <li>Score distribution breakdown (1-5 star histogram)</li>
        <li>Per-agent CSAT scores so you can identify which agents perform best</li>
        <li>Per-channel CSAT scores to compare satisfaction across communication channels</li>
      </ul>

      <h2>Conversation Paths Visualization</h2>

      <p>
        The paths view renders a Sankey-style diagram showing how conversations flow through
        different topics, intents, and outcomes. Each node represents a conversation state, and
        the width of each link represents the volume of conversations that followed that path.
      </p>

      <p>
        Use this to identify the most common conversation flows, spot unexpected branching points,
        and discover paths that lead to poor outcomes. Conversation paths are generated
        automatically from your message data — no manual tagging required.
      </p>

      <h2>Anomaly Detection</h2>

      <p>
        The anomaly detection engine monitors your key metrics continuously and alerts you when
        values deviate significantly from their expected range. Anomalies are detected using
        statistical baselines computed from your historical data.
      </p>

      <p>
        When an anomaly is detected, it appears as a highlighted point on the relevant chart
        along with a notification in your dashboard. Examples of detected anomalies include:
      </p>

      <ul>
        <li>A sudden spike in error rates</li>
        <li>An unusual drop in conversation volume</li>
        <li>Response times exceeding historical averages by more than two standard deviations</li>
        <li>CSAT scores dropping below the rolling average</li>
      </ul>

      <p>
        Anomaly alerts can be forwarded to external services via{" "}
        <Link href="/docs/pro/webhooks">Webhooks</Link>.
      </p>

      <h2>Custom Dashboards</h2>

      <p>
        Build your own dashboard layouts by arranging charts in a drag-and-drop grid. Add, remove,
        resize, and reposition charts to create a view tailored to your needs. Custom dashboards
        are saved to your account and persist across sessions.
      </p>

      <p>
        You can create multiple custom dashboards for different purposes — one for daily
        operational monitoring, another for weekly executive reporting, and a third focused on a
        specific agent or channel.
      </p>

      <h2>Cohort Analysis</h2>

      <p>
        Cohort analysis groups users by when they first interacted with your agents and tracks
        their behavior over subsequent periods. This reveals retention patterns and helps you
        understand whether changes to your agents improve long-term engagement.
      </p>

      <p>
        Cohorts are defined by week or month of first interaction. The retention table shows what
        percentage of each cohort returned in subsequent periods.
      </p>

      <h2>Scheduled Reports</h2>

      <p>
        Automate your reporting with scheduled email delivery. Configure a weekly report that
        includes your summary cards, top-level funnel metrics, and CSAT scores. Reports are
        delivered as formatted HTML emails with embedded charts.
      </p>

      <p>
        Set the delivery day and time, add multiple email recipients, and choose which metrics
        to include. Scheduled reports use the same data source as the live dashboard, ensuring
        consistency between what you see on screen and what arrives in your inbox.
      </p>

      <h2 id="channel-analytics">Channel Analytics</h2>

      <p>
        Channel Analytics provides per-channel breakdowns of message volume, response times, and
        engagement metrics. Compare performance across your connected channels to understand
        where your users prefer to interact and which channels deliver the best experience.
      </p>

      <h2 id="auto-responses">Auto-Responses</h2>

      <p>
        Configure automatic replies that trigger on keyword matches or during specific time
        windows (such as outside business hours). Auto-responses reduce response latency for
        common queries and ensure users always receive an acknowledgment, even when your agents
        are processing complex requests.
      </p>

      <h2>Export Data</h2>

      <p>
        Export your analytics data for use in external tools. All charts and tables support export,
        and the raw data underlying each visualization is available for download. Use exported data
        for custom analysis, compliance reporting, or integration with business intelligence
        platforms.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Want real-time logs instead?</strong>{" "}
        Analytics provides aggregate insights over time. For real-time operational visibility, use
        the <Link href="/docs/pro/logs" className="text-primary underline">Logs Explorer</Link>.
      </div>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/knowledge-base">Knowledge Base</Link> — Improve resolution rates by giving agents domain knowledge</li>
        <li><Link href="/docs/pro/logs">Logs Explorer</Link> — Real-time log streaming and search</li>
        <li><Link href="/docs/pro/webhooks">Webhooks</Link> — Forward anomaly alerts to external services</li>
      </ul>
    </article>
  );
}
