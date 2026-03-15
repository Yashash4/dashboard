import Link from "next/link";

export default function DocsProFeaturesOverviewPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Pro Features Overview{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The ClawHQ Pro plan ($129/month) unlocks the full power of the platform. Beyond everything
        included in the Starter tier, Pro gives you advanced observability, analytics, knowledge
        management, integrations, and developer tools designed for production-grade AI deployments.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Upgrade anytime.</strong>{" "}
        All Pro features activate instantly when you upgrade from the Starter plan. Your existing
        agents, channels, and configuration remain untouched.
      </div>

      <h2>What&apos;s Included in Pro</h2>

      <p>
        Every Pro subscription includes the full Starter feature set plus the ten modules listed
        below. Each module is documented in detail on its own page.
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <Link
          href="/docs/pro/logs"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Logs Explorer</h3>
          <p className="text-sm text-muted-foreground">
            Real-time log streaming, search with keyword highlighting, saved views, pattern
            detection, and configurable alerting rules.
          </p>
        </Link>

        <Link
          href="/docs/pro/analytics"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Conversation funnels, CSAT dashboards, anomaly detection, custom chart layouts, cohort
            analysis, and scheduled email reports.
          </p>
        </Link>

        <Link
          href="/docs/pro/knowledge-base"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">
            RAG pipeline with file uploads, URL crawling, hybrid search, chunk inspection, retrieval
            tracking, and external connectors.
          </p>
        </Link>

        <Link
          href="/docs/pro/webhooks"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            9 event types, HMAC signature verification, automatic retries with exponential backoff,
            delivery logs, and circuit breaker protection.
          </p>
        </Link>

        <Link
          href="/docs/pro/api"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">API Access</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys with per-key rate limits, use the interactive playground, and integrate
            with SSE streaming in any language.
          </p>
        </Link>

        <Link
          href="/docs/pro/audit-log"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Audit Log</h3>
          <p className="text-sm text-muted-foreground">
            Tamper-proof hash chain verification, SIEM streaming to Datadog and Splunk, CSV/JSON
            export, and configurable retention.
          </p>
        </Link>

        <Link
          href="/docs/pro/agent-builder"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Agent Builder</h3>
          <p className="text-sm text-muted-foreground">
            AI-assisted or manual agent creation with personality configuration, tool selection,
            model assignment, and one-click deploy.
          </p>
        </Link>

        <Link
          href="/docs/pro/model-playground"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Model Playground</h3>
          <p className="text-sm text-muted-foreground">
            Side-by-side model comparison with streaming responses, adjustable temperature and
            length settings, and saved comparison history.
          </p>
        </Link>

        <Link
          href="/docs/pro/analytics#channel-analytics"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Channel Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Per-channel message volume, response time breakdowns, engagement metrics, and branding
            configuration for each connected channel.
          </p>
        </Link>

        <Link
          href="/docs/pro/analytics#auto-responses"
          className="block border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">Auto-Responses</h3>
          <p className="text-sm text-muted-foreground">
            Configure automatic replies for common patterns, set keyword triggers, define business
            hours rules, and track auto-response effectiveness.
          </p>
        </Link>
      </div>

      <h2>Pro vs. Starter at a Glance</h2>

      <table>
        <thead>
          <tr>
            <th>Capability</th>
            <th>Starter ($59/mo)</th>
            <th>Pro ($129/mo)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>VPS with OpenClaw</td>
            <td>Included</td>
            <td>Included</td>
          </tr>
          <tr>
            <td>Agent deployment</td>
            <td>Up to 3 agents</td>
            <td>Unlimited agents</td>
          </tr>
          <tr>
            <td>Channels</td>
            <td>2 channels</td>
            <td>Unlimited channels</td>
          </tr>
          <tr>
            <td>Logs</td>
            <td>Basic tail view</td>
            <td>Full explorer with search, alerts, patterns</td>
          </tr>
          <tr>
            <td>Analytics</td>
            <td>Basic message count</td>
            <td>Funnels, CSAT, anomalies, custom dashboards</td>
          </tr>
          <tr>
            <td>Knowledge Base</td>
            <td>Not included</td>
            <td>Full RAG pipeline</td>
          </tr>
          <tr>
            <td>Webhooks</td>
            <td>Not included</td>
            <td>9 event types with retries</td>
          </tr>
          <tr>
            <td>API access</td>
            <td>Not included</td>
            <td>Full REST API with playground</td>
          </tr>
          <tr>
            <td>Audit log</td>
            <td>Not included</td>
            <td>Hash-chained, exportable, SIEM-ready</td>
          </tr>
          <tr>
            <td>Agent Builder</td>
            <td>Not included</td>
            <td>AI-assisted + manual mode</td>
          </tr>
          <tr>
            <td>Model Playground</td>
            <td>Not included</td>
            <td>Side-by-side comparison</td>
          </tr>
        </tbody>
      </table>

      <h2>Getting Started with Pro</h2>

      <p>
        After upgrading, all Pro features appear in your dashboard sidebar immediately. We recommend
        starting with the{" "}
        <Link href="/docs/pro/knowledge-base">Knowledge Base</Link> to enrich your agents with
        your own data, then setting up{" "}
        <Link href="/docs/pro/webhooks">Webhooks</Link> to integrate with your existing tools.
      </p>

      <p>
        For monitoring and compliance, configure the{" "}
        <Link href="/docs/pro/audit-log">Audit Log</Link> and{" "}
        <Link href="/docs/pro/logs">Logs Explorer</Link> early so you have a full history from
        day one.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Need the full API reference?</strong>{" "}
        Head to <Link href="/docs/api/auth" className="text-primary underline">API Authentication</Link>{" "}
        for endpoint documentation, or jump into the{" "}
        <Link href="/docs/pro/api" className="text-primary underline">API Access</Link> guide for
        key management and the interactive playground.
      </div>
    </article>
  );
}
