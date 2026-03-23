import Link from "next/link";

export default function DocsQuickStartGuidePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Quick Start Guide</h1>
      <p className="lead text-lg text-muted-foreground">
        Get your first AI agent running and responding to messages in under 15 minutes.
        This guide walks you through every step from sign-up to your first conversation.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Before you begin</p>
        <p className="text-sm text-muted-foreground mt-1">
          All you need is an email address and a payment method. ClawHQ handles all the
          infrastructure — no technical setup required on your end.
        </p>
      </div>

      <h2>Step 1: Create Your Account</h2>
      <p>
        Go to{" "}
        <strong>clawhq.tech/register</strong> and create your account with an email and
        password. You&apos;ll be asked to choose a plan:
      </p>
      <ul>
        <li><strong>Starter ($59/mo)</strong> — Great for getting started with AI agents</li>
        <li><strong>Pro ($129/mo)</strong> — Adds logs, analytics, knowledge base, API access, and more</li>
        <li><strong>Ultra ($350/mo)</strong> — Adds Mission Control for managing agent workforces</li>
      </ul>
      <p>
        Not sure which plan to choose? Start with <strong>Starter</strong> — you can upgrade
        anytime from the Billing page, and all your data carries over.
      </p>
      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Tip: Annual billing</p>
        <p className="text-sm text-muted-foreground mt-1">
          Save approximately 15% by choosing annual billing. Starter drops to $599/year
          ($49.92/mo effective).
        </p>
      </div>

      <h2>Step 2: Wait for VPS Provisioning</h2>
      <p>
        After completing payment, ClawHQ begins setting up your dedicated server. This
        typically takes <strong>15–30 minutes</strong>. During this time, ClawHQ:
      </p>
      <ol>
        <li>Provisions a dedicated VPS with your chosen resources</li>
        <li>Installs and configures OpenClaw (the AI agent framework)</li>
        <li>Sets up your subdomain (e.g., <code>yourname.clawhq.tech</code>)</li>
        <li>Configures SSL certificates for secure HTTPS</li>
        <li>Installs the AI model gateway and embedding services</li>
      </ol>
      <p>
        You&apos;ll see a progress indicator on your dashboard showing which step is currently
        running. You can safely close the browser and come back later — provisioning continues
        in the background.
      </p>
      <div className="not-prose bg-[color-mix(in_srgb,var(--warning),transparent_95%)] border border-[color-mix(in_srgb,var(--warning),transparent_80%)] rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-[var(--warning)]">Don&apos;t worry if it takes a moment</p>
        <p className="text-sm text-muted-foreground mt-1">
          Provisioning involves 12 sequential steps including DNS setup, firewall configuration,
          and SSL certificate generation. If it takes longer than 30 minutes, reach out via{" "}
          <Link href="/docs/support" className="text-primary hover:underline">Support</Link>.
        </p>
      </div>

      <h2>Step 3: Explore the Dashboard</h2>
      <p>
        Once provisioning completes, your dashboard loads with the{" "}
        <Link href="/docs/dashboard" className="text-primary hover:underline">Overview</Link>{" "}
        page. You&apos;ll see:
      </p>
      <ul>
        <li>An <strong>onboarding checklist</strong> guiding you through your first actions</li>
        <li><strong>VPS status</strong> showing your server is running and healthy</li>
        <li><strong>Quick actions</strong> linking to the most common tasks</li>
      </ul>
      <p>
        The checklist tracks your progress automatically — each step checks itself off as you
        complete it. No manual clicking required.
      </p>

      <h2>Step 4: Connect Your First Channel</h2>
      <p>
        Navigate to the <Link href="/docs/channels" className="text-primary hover:underline">Channels</Link>{" "}
        page from the sidebar. We recommend starting with <strong>Telegram</strong> — it&apos;s
        the fastest to set up.
      </p>
      <h3>Telegram Setup (2 minutes)</h3>
      <ol>
        <li>Open Telegram and search for <code>@BotFather</code></li>
        <li>Send <code>/newbot</code> and follow the prompts to create a bot</li>
        <li>BotFather gives you an <strong>API token</strong> — copy it</li>
        <li>Back in ClawHQ, click <strong>Telegram</strong> under &quot;Connect New Channel&quot;</li>
        <li>Paste the API token and click <strong>Connect</strong></li>
        <li>Wait a few seconds for the connection to establish</li>
      </ol>
      <p>
        Once connected, the Telegram card shows a green &quot;Connected&quot; status. You can
        verify with the <strong>Test Connection</strong> button.
      </p>
      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Other channels</p>
        <p className="text-sm text-muted-foreground mt-1">
          Discord, Slack, Microsoft Teams, and Webchat are also self-service. WhatsApp and
          Signal require additional setup steps. See the{" "}
          <Link href="/docs/channels" className="text-primary hover:underline">Channels documentation</Link>{" "}
          for guides on each platform.
        </p>
      </div>

      <h2>Step 5: Add an Agent from the Store</h2>
      <p>
        Navigate to the <Link href="/docs/store" className="text-primary hover:underline">Agent Store</Link>{" "}
        from the sidebar. You&apos;ll find pre-built agents for common use cases:
      </p>
      <ul>
        <li><strong>Support Bot</strong> — Customer service agent that handles inquiries, returns, and FAQs</li>
        <li><strong>Research Bot</strong> — Research assistant that finds information and summarizes it</li>
        <li><strong>Writer Bot</strong> — Content writer for blog posts, emails, and documentation</li>
        <li><strong>Sales Bot</strong> — Sales assistant for product recommendations and objection handling</li>
      </ul>
      <p>
        Click on an agent to see its full description, capabilities, and reviews. When
        ready, click <strong>Add</strong> to add it to your agent list. Many agents are
        currently free.
      </p>

      <h2>Step 6: Deploy the Agent</h2>
      <p>
        Navigate to the <Link href="/docs/agents" className="text-primary hover:underline">Agents</Link>{" "}
        page. You&apos;ll see the agent you just added. Click <strong>Deploy</strong>.
      </p>
      <p>
        Deploying writes the agent&apos;s configuration files to your VPS and restarts the
        OpenClaw service to load the new agent. This takes 10–30 seconds.
      </p>
      <p>
        Once deployed, the agent card shows a green <strong>Deployed</strong> badge along
        with its health status.
      </p>

      <h2>Step 7: Send Your First Message</h2>
      <p>
        Navigate to the <Link href="/docs/chat" className="text-primary hover:underline">Chat</Link>{" "}
        page. Select your deployed agent from the sidebar, then type a message:
      </p>
      <pre><code>Hello! What can you help me with?</code></pre>
      <p>
        The agent&apos;s response streams in token by token — you&apos;ll see it typing in
        real time. The response comes from the AI model running through your dedicated VPS.
      </p>

      <h2>Step 8: Test on Telegram</h2>
      <p>
        Open Telegram and find your bot (the one you created with BotFather). Send it a
        message. The same agent that responded in the ClawHQ dashboard now responds on
        Telegram.
      </p>
      <p>
        That&apos;s it — your AI agent is live on Telegram and ready to handle conversations.
        You can connect more channels at any time.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">You&apos;re all set!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your AI agent is now running 24/7 on your dedicated server and responding on
          Telegram. The onboarding checklist on your dashboard should show all steps complete.
        </p>
      </div>

      <h2>What&apos;s Next</h2>
      <ul>
        <li>
          <Link href="/docs/channels" className="text-primary hover:underline">Connect more channels</Link>{" "}
          — add Discord, Slack, WhatsApp, and more
        </li>
        <li>
          <Link href="/docs/store" className="text-primary hover:underline">Deploy more agents</Link>{" "}
          — try different agents for different use cases
        </li>
        <li>
          <Link href="/docs/agents" className="text-primary hover:underline">Customize agent behavior</Link>{" "}
          — view and modify agent configurations
        </li>
        <li>
          <Link href="/docs/models" className="text-primary hover:underline">Switch AI models</Link>{" "}
          — compare and try different models
        </li>
        <li>
          <Link href="/docs/pro" className="text-primary hover:underline">Explore Pro features</Link>{" "}
          — knowledge base, analytics, webhooks, and API access
        </li>
      </ul>

      <h2>Troubleshooting</h2>

      <h3>VPS provisioning is stuck</h3>
      <p>
        If provisioning hasn&apos;t completed after 30 minutes, check the progress indicator
        for which step it&apos;s on. If it shows an error, try refreshing the page. If the
        issue persists, create a{" "}
        <Link href="/docs/support" className="text-primary hover:underline">support ticket</Link>{" "}
        with the step number and any error message shown.
      </p>

      <h3>Channel connection fails</h3>
      <p>
        Make sure your VPS is in <strong>Running</strong> status before connecting a channel.
        Double-check that you copied the full API token — partial tokens are the most common
        cause of connection failures.
      </p>

      <h3>Agent deployment fails</h3>
      <p>
        Ensure your VPS is running (check the{" "}
        <Link href="/docs/vps" className="text-primary hover:underline">VPS page</Link>).
        If the OpenClaw Gateway service is stopped, restart it from the Services panel.
      </p>

      <h3>No response from agent</h3>
      <p>
        On the Agents page, use the <strong>Test</strong> button to send a test message
        directly. If the test fails, check the agent&apos;s health status. A &quot;Degraded&quot;
        or &quot;Error&quot; status indicates a configuration issue — try undeploying and
        redeploying the agent.
      </p>

      <h3>Still need help?</h3>
      <p>
        Create a support ticket from your dashboard or visit the{" "}
        <Link href="/docs/faq" className="text-primary hover:underline">FAQ</Link> for answers
        to common questions.
      </p>
    </article>
  );
}
