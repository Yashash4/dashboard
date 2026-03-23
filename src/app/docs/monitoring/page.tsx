import Link from "next/link";

export default function DocsMonitoringPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Monitoring</h1>
      <p className="text-muted-foreground text-lg">
        Monitoring your VPS and OpenClaw instance is essential for maintaining
        reliable AI agent performance. ClawHQ provides real-time monitoring
        directly from your dashboard.
      </p>

      <h2>VPS Monitoring</h2>
      <p>
        Your dashboard provides real-time stats on CPU usage, memory, disk, and
        network traffic. You can also view OpenClaw process status, restart
        services, and access live logs.
      </p>

      <h2>Pro Monitoring Features</h2>
      <p>
        Pro and Ultra plans include the{" "}
        <Link href="/docs/pro/logs" className="text-primary hover:underline">Logs Explorer</Link>{" "}
        with real-time log streaming, search with keyword highlighting, saved
        views, pattern detection, and configurable alerting rules.
      </p>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/faq" className="text-primary hover:underline">FAQ</Link> for common questions.</li>
        <li><Link href="/docs/vps" className="text-primary hover:underline">VPS Documentation</Link> for server details.</li>
        <li><Link href="/docs/billing" className="text-primary hover:underline">Compare plans</Link> to upgrade.</li>
      </ul>
    </article>
  );
}
