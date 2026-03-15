import Link from "next/link";

export default function DocsLogsExplorerPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Logs Explorer{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The Logs Explorer gives you full visibility into your OpenClaw instance. Stream logs in
        real time directly from your VPS via SSH, search with keyword highlighting, filter by
        severity level, detect recurring patterns automatically, and configure alerting rules that
        notify you when things go wrong.
      </p>

      <h2>Real-Time Log Streaming</h2>

      <p>
        Logs are streamed live from your VPS over a secure SSH connection. As your agents process
        messages and handle requests, each log line appears in the explorer within seconds. The
        stream stays open as long as you have the page active, so you can monitor behavior during
        deployments, debugging sessions, or high-traffic periods.
      </p>

      <p>
        Auto-refresh intervals are configurable at <strong>5s, 10s, 30s, or 60s</strong>. Choose a
        faster interval for active debugging or a slower one for passive monitoring. You can also
        pause the stream entirely to inspect a specific moment in the log output without new entries
        pushing it out of view.
      </p>

      <h2>Search and Keyword Highlighting</h2>

      <p>
        Type any search term into the search bar to filter the visible log lines instantly. Matching
        keywords are highlighted in the output so you can spot them at a glance. Search works across
        all log fields including timestamps, log levels, agent names, and message content.
      </p>

      <p>
        Combine search with level filters to narrow results further. For example, search for
        &quot;timeout&quot; while filtering to <code>error</code> level to find only timeout-related
        errors without wading through informational noise.
      </p>

      <h2>Level Filtering</h2>

      <p>
        Filter logs by severity level to focus on what matters. The four supported levels are:
      </p>

      <ul>
        <li><strong>Error</strong> — Failures that need immediate attention (failed requests, crashes, unhandled exceptions)</li>
        <li><strong>Warn</strong> — Potential issues that may degrade performance or indicate misconfiguration</li>
        <li><strong>Info</strong> — Standard operational messages (agent started, channel connected, message processed)</li>
        <li><strong>Debug</strong> — Verbose output useful during development and troubleshooting</li>
      </ul>

      <p>
        Multiple levels can be selected simultaneously. The level filter persists across page
        refreshes and works in combination with the search bar.
      </p>

      <h2>Saved Searches and Views</h2>

      <p>
        Save frequently used filter combinations as named views for instant access. Each saved view
        stores the search query, selected log levels, line count, and date/time range. You can
        create up to <strong>20 saved views</strong> per account.
      </p>

      <p>
        Set any saved view as your <strong>default view</strong>, and it will load automatically
        every time you open the Logs Explorer. This is useful for teams that always want to start
        with a specific filter, such as &quot;errors only in the last hour.&quot;
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> Name your saved views descriptively. Instead
        of &quot;View 1&quot;, use &quot;Production Errors - Last Hour&quot; or &quot;Agent Timeout Debug&quot;.
        This makes it easy to switch between views quickly.
      </div>

      <h2>Log Pattern Detection</h2>

      <p>
        The pattern detection engine automatically scans your log stream and identifies recurring
        patterns. When the same error or warning appears repeatedly, the system groups those
        occurrences and surfaces them as a detected pattern with a count, first/last occurrence
        timestamps, and a representative sample.
      </p>

      <p>
        Pattern detection helps you identify systemic issues that might be missed when reading logs
        line by line. A single timeout error is easy to overlook; fifty of them in an hour is a
        pattern that demands investigation.
      </p>

      <h2>Log Alerting</h2>

      <p>
        Configure alerting rules to get notified when specific conditions are met. Each rule
        consists of three parts:
      </p>

      <ol>
        <li><strong>Condition</strong> — What to match (keyword, log level, or pattern)</li>
        <li><strong>Threshold</strong> — How many occurrences within a time window trigger the alert</li>
        <li><strong>Notification</strong> — Where to send the alert (email, webhook, or dashboard notification)</li>
      </ol>

      <p>
        For example, you can create a rule that sends a webhook notification if the word
        &quot;OutOfMemory&quot; appears more than 5 times in a 10-minute window. Alert rules are
        evaluated continuously against the incoming log stream.
      </p>

      <h2>Date/Time Filtering</h2>

      <p>
        Narrow your log view to a specific time range using the date/time picker. Select a start
        and end timestamp to view only the logs generated during that window. This is essential
        for post-incident analysis when you need to reconstruct what happened during a specific
        period.
      </p>

      <h2>Line Count and Download</h2>

      <p>
        Control how many log lines are displayed using the line count selector. Choose from
        predefined values or enter a custom count. For offline analysis or sharing with your team,
        download the currently filtered log output as a <code>.txt</code> file. The download
        respects all active filters, so you get exactly what you see on screen.
      </p>

      <h2>Log Forwarding</h2>

      <p>
        Forward your logs to external logging services for long-term storage, cross-service
        correlation, or integration with your existing observability stack. Configure a forwarding
        destination and ClawHQ will continuously ship log data to your external service alongside
        the in-dashboard experience.
      </p>

      <p>
        Log forwarding works independently of the Logs Explorer. Even if you never open the
        explorer, forwarded logs are delivered to your configured destination.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Pair with Audit Log.</strong>{" "}
        While the Logs Explorer shows operational logs from your OpenClaw instance, the{" "}
        <Link href="/docs/pro/audit-log" className="text-primary underline">Audit Log</Link>{" "}
        tracks administrative actions like agent deployments, model changes, and key management.
        Together, they give you complete visibility.
      </div>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/analytics">Analytics</Link> — Aggregate insights from your conversation data</li>
        <li><Link href="/docs/pro/audit-log">Audit Log</Link> — Track administrative actions with tamper-proof records</li>
        <li><Link href="/docs/pro/webhooks">Webhooks</Link> — Send log alerts to external services via webhook</li>
      </ul>
    </article>
  );
}
