import Link from "next/link";

export default function DocsAnalyticsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Analytics</h1>
      <p className="text-muted-foreground text-lg">
        Analytics features are available on Pro and Ultra plans. They provide
        deep insights into your agent performance, conversation funnels, and
        user engagement.
      </p>

      <h2>Analytics Tiers</h2>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Analytics Features</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Starter</td>
            <td>Basic message count and activity overview</td>
          </tr>
          <tr>
            <td>Pro</td>
            <td>Advanced analytics with funnels, CSAT dashboards, anomaly detection, and custom chart layouts</td>
          </tr>
          <tr>
            <td>Ultra</td>
            <td>Advanced + exports, cohort analysis, and scheduled email reports</td>
          </tr>
        </tbody>
      </table>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/faq" className="text-primary hover:underline">FAQ</Link> for common questions.</li>
        <li><Link href="/docs/pro/analytics" className="text-primary hover:underline">Pro Analytics</Link> documentation.</li>
        <li><Link href="/docs/billing" className="text-primary hover:underline">Compare plans</Link> to upgrade.</li>
      </ul>
    </article>
  );
}
