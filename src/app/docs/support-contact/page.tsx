import Link from "next/link";

export default function DocsContactSupportPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Contact Support</h1>
      <p className="lead text-lg text-muted-foreground">
        ClawHQ provides dedicated support through an integrated ticket system built
        right into your dashboard. Whether you have a configuration question, need
        help with a channel integration, or are experiencing a service issue, our
        support team is here to help.
      </p>

      <h2>How to Reach Support</h2>
      <p>
        All support requests are handled through the <strong>in-dashboard ticket system</strong>.
        This ensures your request is linked to your account, VPS, and configuration details
        automatically, which helps our team resolve issues faster.
      </p>

      <h3>Creating a Support Ticket</h3>
      <ol>
        <li>
          Open your ClawHQ dashboard and navigate to{" "}
          <strong>Support</strong> in the sidebar
        </li>
        <li>
          Click <strong>New Ticket</strong> in the top-right corner
        </li>
        <li>
          Select a <strong>category</strong> that best describes your issue (e.g., VPS,
          Channels, Agents, Billing, Account, Other)
        </li>
        <li>
          Write a clear <strong>subject line</strong> summarizing the problem
        </li>
        <li>
          Provide a detailed <strong>description</strong> (see below for what to include)
        </li>
        <li>
          Click <strong>Submit Ticket</strong> to send it to our team
        </li>
      </ol>

      <p>
        Once submitted, your ticket appears in the{" "}
        <Link href="/docs/support" className="text-primary hover:underline">Support</Link>{" "}
        page with a status indicator. You&apos;ll receive updates as our team reviews
        and responds to your request.
      </p>

      <h2>What to Include in Your Ticket</h2>
      <p>
        The more detail you provide upfront, the faster we can diagnose and resolve
        your issue. Here&apos;s what to include for the most effective support experience:
      </p>

      <h3>Issue Description</h3>
      <ul>
        <li>
          <strong>What happened:</strong> Describe the problem clearly. What were you
          trying to do, and what went wrong?
        </li>
        <li>
          <strong>When it started:</strong> Note when you first noticed the issue. Was it
          after a specific action, or did it appear suddenly?
        </li>
        <li>
          <strong>Frequency:</strong> Does the problem happen every time, intermittently,
          or was it a one-time occurrence?
        </li>
      </ul>

      <h3>Steps to Reproduce</h3>
      <p>
        If the issue is reproducible, list the exact steps someone would follow to
        encounter the same problem. For example:
      </p>
      <ol>
        <li>Navigate to the Agents page</li>
        <li>Click Deploy on the &quot;Support Bot&quot; agent</li>
        <li>Wait for the deployment to complete</li>
        <li>Observe the error message that appears</li>
      </ol>

      <h3>Error Messages &amp; Screenshots</h3>
      <ul>
        <li>
          <strong>Error messages:</strong> Copy the full text of any error messages you see.
          Include error codes if they are displayed.
        </li>
        <li>
          <strong>Screenshots:</strong> Attach screenshots of the error, the page state,
          or any unexpected behavior. Screenshots dramatically reduce back-and-forth
          communication.
        </li>
        <li>
          <strong>Browser console errors:</strong> If you are comfortable opening browser
          developer tools (F12 or Cmd+Option+I), check the Console tab for red error
          messages and include those as well.
        </li>
      </ul>

      <h3>Environment Information</h3>
      <ul>
        <li>
          <strong>Browser:</strong> Which browser and version you are using (e.g., Chrome 120,
          Firefox 121, Safari 17)
        </li>
        <li>
          <strong>Device:</strong> Desktop, tablet, or mobile
        </li>
        <li>
          <strong>Operating system:</strong> Windows, macOS, Linux, iOS, or Android
        </li>
        <li>
          <strong>Network:</strong> If the issue involves connectivity, mention whether you
          are on a corporate network, VPN, or standard home connection
        </li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Tip: Be specific</p>
        <p className="text-sm text-muted-foreground mt-1">
          Instead of &quot;my agent doesn&apos;t work,&quot; try &quot;my Support Bot agent
          returns a 500 error when I send a message containing an image attachment via
          the Telegram channel.&quot; Specific descriptions help our team jump directly to
          the root cause.
        </p>
      </div>

      <h2>Response Times by Plan</h2>
      <p>
        ClawHQ offers tiered response times based on your subscription plan. Response
        time is measured from when the ticket is submitted to when a support engineer
        sends the first meaningful reply (not an automated acknowledgement).
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Plan</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">First Response</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Support Hours</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-3 px-4 text-muted-foreground">Starter ($59/mo)</td>
              <td className="py-3 px-4 text-muted-foreground">Within 24 hours</td>
              <td className="py-3 px-4 text-muted-foreground">Business hours (Mon–Fri)</td>
              <td className="py-3 px-4 text-muted-foreground">Standard</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-3 px-4 text-muted-foreground">Pro ($129/mo)</td>
              <td className="py-3 px-4 text-muted-foreground">Within 12 hours</td>
              <td className="py-3 px-4 text-muted-foreground">Extended (Mon–Sat)</td>
              <td className="py-3 px-4 text-muted-foreground">Elevated</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-3 px-4 text-muted-foreground">Ultra ($350/mo)</td>
              <td className="py-3 px-4 text-muted-foreground">Within 4 hours</td>
              <td className="py-3 px-4 text-muted-foreground">7 days a week</td>
              <td className="py-3 px-4 text-muted-foreground">High</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-muted-foreground">Enterprise (Custom)</td>
              <td className="py-3 px-4 text-muted-foreground">Within 1 hour (SLA-backed)</td>
              <td className="py-3 px-4 text-muted-foreground">24/7 including holidays</td>
              <td className="py-3 px-4 text-muted-foreground">Critical</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Enterprise SLA guarantee</p>
        <p className="text-sm text-muted-foreground mt-1">
          Enterprise customers receive a contractual SLA with guaranteed 1-hour first
          response times. If the SLA is missed, service credits are applied automatically.
          Contact our team for Enterprise pricing and SLA details.
        </p>
      </div>

      <h2>Ticket Lifecycle</h2>
      <p>
        Once you submit a ticket, it moves through the following statuses:
      </p>
      <ul>
        <li>
          <strong>Open:</strong> Your ticket has been submitted and is waiting for a
          support engineer to pick it up
        </li>
        <li>
          <strong>In Progress:</strong> A support engineer is actively working on your issue
        </li>
        <li>
          <strong>Waiting on Customer:</strong> We&apos;ve replied and need additional
          information from you to continue
        </li>
        <li>
          <strong>Resolved:</strong> The issue has been addressed. You can reopen the
          ticket if the problem recurs
        </li>
        <li>
          <strong>Closed:</strong> The ticket is finalized. You can always create a new
          ticket if a related issue arises
        </li>
      </ul>
      <p>
        You&apos;ll see the current status on the{" "}
        <Link href="/docs/support" className="text-primary hover:underline">Support</Link>{" "}
        page, along with the full conversation thread for each ticket.
      </p>

      <h2>Common Self-Service Fixes</h2>
      <p>
        Before creating a ticket, try these quick fixes for the most common issues.
        Many problems can be resolved in under a minute without waiting for support.
      </p>

      <h3>VPS or Agent Not Responding</h3>
      <ol>
        <li>
          Navigate to the{" "}
          <Link href="/docs/vps" className="text-primary hover:underline">VPS</Link>{" "}
          page and check the server status
        </li>
        <li>
          If the status shows <strong>Stopped</strong>, click <strong>Start</strong> to
          bring the server back online
        </li>
        <li>
          If the server is running but agents are unresponsive, try clicking{" "}
          <strong>Restart</strong> to restart the OpenClaw services
        </li>
        <li>
          Wait 30 seconds after restarting, then test your agent again from the{" "}
          <Link href="/docs/chat" className="text-primary hover:underline">Chat</Link>{" "}
          page
        </li>
      </ol>

      <h3>Channel Disconnected</h3>
      <ol>
        <li>
          Go to the{" "}
          <Link href="/docs/channels" className="text-primary hover:underline">Channels</Link>{" "}
          page and check the status of the affected channel
        </li>
        <li>
          Click <strong>Test Connection</strong> to verify connectivity
        </li>
        <li>
          If the test fails, try disconnecting and reconnecting the channel with
          fresh credentials
        </li>
        <li>
          For WhatsApp, you may need to re-scan the QR code if the session expired
        </li>
      </ol>

      <h3>Agent Deployment Failed</h3>
      <ol>
        <li>
          Ensure your VPS is in <strong>Running</strong> status before deploying
        </li>
        <li>
          Try undeploying the agent first, wait 10 seconds, then deploy again
        </li>
        <li>
          If the error persists, check the{" "}
          <Link href="/docs/agents" className="text-primary hover:underline">Agents</Link>{" "}
          page for specific error messages and include them in your support ticket
        </li>
      </ol>

      <h3>Slow or Degraded Responses</h3>
      <ul>
        <li>
          Check the{" "}
          <Link href="/docs/models" className="text-primary hover:underline">Models</Link>{" "}
          page to see the health status of your current AI model
        </li>
        <li>
          Try switching to a different model temporarily to rule out model-specific
          issues
        </li>
        <li>
          Check the VPS resource usage on the dashboard overview — high CPU or memory
          usage can cause slowdowns
        </li>
      </ul>

      <h3>Billing or Payment Issues</h3>
      <ul>
        <li>
          Visit the{" "}
          <Link href="/docs/billing" className="text-primary hover:underline">Billing</Link>{" "}
          page to review your current plan, payment history, and upcoming invoices
        </li>
        <li>
          If a payment failed, update your payment method and retry
        </li>
        <li>
          For refund requests or billing disputes, create a support ticket with the
          category set to <strong>Billing</strong>
        </li>
      </ul>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-amber-500">When in doubt, restart</p>
        <p className="text-sm text-muted-foreground mt-1">
          A surprising number of issues are resolved by restarting your VPS from the
          VPS page. This restarts all OpenClaw services and re-establishes channel
          connections. It takes about 30 seconds and does not affect your data or
          configuration.
        </p>
      </div>

      <h2>Escalation</h2>
      <p>
        If your issue is not resolved within the expected response time for your plan,
        you can escalate by replying to the existing ticket with the word{" "}
        <strong>&quot;escalate&quot;</strong> in the message. This flags the ticket for
        senior engineering review and increases its priority.
      </p>
      <p>
        Enterprise customers have a dedicated escalation path and can request a live
        call with a support engineer directly through their ticket.
      </p>

      <h2>Helpful Resources</h2>
      <p>
        Before creating a ticket, these resources may already have the answer you need:
      </p>
      <ul>
        <li>
          <Link href="/docs/faq" className="text-primary hover:underline">
            Frequently Asked Questions
          </Link>{" "}
          — Answers to 25+ common questions about ClawHQ
        </li>
        <li>
          <Link href="/docs/getting-started" className="text-primary hover:underline">
            Quick Start Guide
          </Link>{" "}
          — Step-by-step setup from sign-up to first message
        </li>
        <li>
          <Link href="/docs/vps" className="text-primary hover:underline">
            VPS Management
          </Link>{" "}
          — Server controls, status monitoring, and troubleshooting
        </li>
        <li>
          <Link href="/docs/channels" className="text-primary hover:underline">
            Channels Documentation
          </Link>{" "}
          — Setup guides for all supported messaging platforms
        </li>
        <li>
          <Link href="/docs/agents" className="text-primary hover:underline">
            Agents Documentation
          </Link>{" "}
          — Agent deployment, configuration, and management
        </li>
        <li>
          <Link href="/docs/models" className="text-primary hover:underline">
            AI Models
          </Link>{" "}
          — Model switching, fallback configuration, and performance
        </li>
        <li>
          <Link href="/docs/plans" className="text-primary hover:underline">
            Plans &amp; Pricing
          </Link>{" "}
          — Detailed feature comparison across all tiers
        </li>
        <li>
          <Link href="/docs/account" className="text-primary hover:underline">
            Account Settings
          </Link>{" "}
          — Profile, password, data export, and account management
        </li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">We value your feedback</p>
        <p className="text-sm text-muted-foreground mt-1">
          After your ticket is resolved, you&apos;ll have the opportunity to rate the
          support experience. Your feedback helps us continuously improve our support
          quality and response times.
        </p>
      </div>
    </article>
  );
}
