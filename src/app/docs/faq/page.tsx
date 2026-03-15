import Link from "next/link";

export default function DocsFAQPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Frequently Asked Questions</h1>
      <p className="lead text-lg text-muted-foreground">
        Answers to the most common questions about ClawHQ, from getting started to
        advanced features. If you can&apos;t find what you&apos;re looking for here,{" "}
        <Link href="/docs/support-contact" className="text-primary hover:underline">
          contact our support team
        </Link>.
      </p>

      {/* ── Getting Started ─────────────────────────────────── */}

      <h2>Getting Started</h2>

      <h3>What is ClawHQ?</h3>
      <p>
        ClawHQ is a fully managed OpenClaw hosting platform. When you sign up, we
        provision a dedicated VPS (virtual private server) with OpenClaw pre-installed,
        configure your subdomain (e.g., <code>yourname.clawhq.tech</code>), set up SSL
        certificates, and bundle AI models — all included in your subscription. You get
        a complete AI agent infrastructure without needing to manage servers, install
        software, or deal with API keys for AI providers.
      </p>

      <h3>What is OpenClaw?</h3>
      <p>
        OpenClaw is an open-source AI agent framework that powers the core functionality
        behind ClawHQ. It handles agent configuration, multi-channel messaging, model
        routing, and conversation management. ClawHQ takes care of hosting, updating, and
        managing OpenClaw so you can focus on building and deploying agents rather than
        maintaining infrastructure.
      </p>

      <h3>How long does setup take?</h3>
      <p>
        After you complete registration and payment, your dedicated VPS is provisioned
        automatically. The process typically takes <strong>15 to 30 minutes</strong> and
        involves 12 sequential steps including server provisioning, DNS configuration, SSL
        certificate generation, OpenClaw installation, and AI model gateway setup. You can
        track progress on your dashboard in real time. See the{" "}
        <Link href="/docs/getting-started" className="text-primary hover:underline">
          Quick Start Guide
        </Link>{" "}
        for a full walkthrough.
      </p>

      <h3>Do I need technical knowledge to use ClawHQ?</h3>
      <p>
        No. ClawHQ is designed to be fully managed, meaning you never need to SSH into a
        server, edit configuration files manually, or write code. Everything is controlled
        through the dashboard — deploying agents, connecting channels, switching AI models,
        and monitoring performance. If you can use a web browser, you can use ClawHQ.
      </p>

      {/* ── Pricing ─────────────────────────────────────────── */}

      <h2>Pricing</h2>

      <h3>What does &quot;bundled AI models&quot; mean?</h3>
      <p>
        Unlike platforms that charge per token or per API call, ClawHQ includes AI model
        access as part of your subscription. You do not receive a separate bill for model
        usage — the cost of running AI models is bundled into your monthly or annual plan
        price. This makes costs predictable and eliminates surprise charges from
        high-volume conversations.
      </p>

      <h3>Can I change my plan?</h3>
      <p>
        Yes. You can <strong>upgrade</strong> at any time from the{" "}
        <Link href="/docs/billing" className="text-primary hover:underline">Billing</Link>{" "}
        page — the upgrade takes effect immediately, and you&apos;re charged the prorated
        difference for the remainder of your billing cycle. <strong>Downgrades</strong> take
        effect at the end of your current billing period so you retain access to your
        current plan&apos;s features until the cycle ends.
      </p>

      <h3>Is there a free trial?</h3>
      <p>
        ClawHQ does not offer a free trial because each account requires provisioning a
        dedicated VPS with real infrastructure costs. However, if you choose{" "}
        <strong>annual billing</strong>, you save approximately 15% compared to monthly
        billing — for example, the Starter plan drops from $59/month to an effective
        $49.92/month when billed annually at $599/year.
      </p>

      <h3>What payment methods are accepted?</h3>
      <p>
        Payments are processed through Razorpay, which supports a wide range of payment
        methods including <strong>credit and debit cards</strong> (Visa, Mastercard,
        American Express, RuPay), <strong>UPI</strong> (Google Pay, PhonePe, Paytm),{" "}
        <strong>netbanking</strong> from all major banks, and <strong>wallet payments</strong>.
        See the{" "}
        <Link href="/docs/billing" className="text-primary hover:underline">Billing</Link>{" "}
        documentation for more details.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Plan comparison</p>
        <p className="text-sm text-muted-foreground mt-1">
          For a detailed side-by-side comparison of all features across Starter, Pro,
          Ultra, and Enterprise plans, visit the{" "}
          <Link href="/docs/plans" className="text-primary hover:underline">
            Plans &amp; Pricing
          </Link>{" "}
          page.
        </p>
      </div>

      {/* ── Channels ────────────────────────────────────────── */}

      <h2>Channels</h2>

      <h3>Which messaging channels are supported?</h3>
      <p>
        ClawHQ supports <strong>seven messaging channels</strong>: Telegram, Discord,
        Slack, WhatsApp, Signal, Microsoft Teams, and Webchat. All seven channels are
        available on every plan — there are no channel restrictions based on your
        subscription tier. See the{" "}
        <Link href="/docs/channels" className="text-primary hover:underline">
          Channels documentation
        </Link>{" "}
        for setup guides for each platform.
      </p>

      <h3>Can I use multiple channels at once?</h3>
      <p>
        Yes. You can connect all seven channels simultaneously and have the same agent
        respond across all of them. Messages from different channels are handled
        independently, so a conversation on Telegram does not interfere with one on
        Discord. Each channel maintains its own connection and session state.
      </p>

      <h3>How do I connect WhatsApp?</h3>
      <p>
        WhatsApp uses QR code pairing. Navigate to the{" "}
        <Link href="/docs/channels" className="text-primary hover:underline">Channels</Link>{" "}
        page, click <strong>WhatsApp</strong> under &quot;Connect New Channel,&quot; and scan
        the displayed QR code with the WhatsApp app on your phone (Settings &rarr; Linked
        Devices &rarr; Link a Device). The connection is established within seconds. If
        the session expires (typically after 14 days of inactivity), you&apos;ll need to
        re-scan the QR code.
      </p>

      <h3>Can I assign different agents to different channels?</h3>
      <p>
        Yes. ClawHQ supports per-channel agent routing. You can assign a customer support
        agent to WhatsApp and Webchat while running a sales assistant on Telegram and
        Discord. Channel-to-agent assignments are managed from the{" "}
        <Link href="/docs/channels" className="text-primary hover:underline">Channels</Link>{" "}
        page by selecting the desired agent for each connected channel.
      </p>

      {/* ── AI Models ───────────────────────────────────────── */}

      <h2>AI Models</h2>

      <h3>What AI models are available?</h3>
      <p>
        The available models depend on your plan tier. All plans include access to multiple
        AI models with different capabilities, speed profiles, and specializations. You can
        view the full list of available models and their characteristics on the{" "}
        <Link href="/docs/models" className="text-primary hover:underline">Models</Link>{" "}
        page within your dashboard. Higher-tier plans unlock access to more powerful and
        specialized models.
      </p>

      <h3>Can I switch AI models?</h3>
      <p>
        Yes. On the <strong>Starter</strong> plan, you can switch models up to{" "}
        <strong>5 times per month</strong>. On <strong>Pro</strong> and{" "}
        <strong>Ultra</strong> plans, model switching is <strong>unlimited</strong>. Model
        changes take effect within seconds — there is no downtime or redeployment required.
        Navigate to the{" "}
        <Link href="/docs/models" className="text-primary hover:underline">Models</Link>{" "}
        page and click <strong>Switch</strong> next to the model you want to use.
      </p>

      <h3>How does model fallback work?</h3>
      <p>
        Model fallback is a <strong>Pro and Ultra</strong> feature. You configure a primary
        model and a fallback model. If the primary model encounters an error, experiences
        high latency, or becomes temporarily unavailable, ClawHQ automatically routes
        requests to the fallback model. This ensures your agents remain responsive even
        during model provider outages. Fallback configuration is available on the{" "}
        <Link href="/docs/models" className="text-primary hover:underline">Models</Link>{" "}
        page.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Pro tip: Test before switching</p>
        <p className="text-sm text-muted-foreground mt-1">
          Pro and Ultra users can use the{" "}
          <Link href="/docs/pro/model-playground" className="text-primary hover:underline">
            Model Playground
          </Link>{" "}
          to test different models side-by-side with sample prompts before committing
          to a switch. This helps you find the best model for your specific use case.
        </p>
      </div>

      {/* ── Agents ──────────────────────────────────────────── */}

      <h2>Agents</h2>

      <h3>What is an agent?</h3>
      <p>
        An agent is an AI personality defined by configuration files that run on your
        dedicated VPS. Each agent has a name, a system prompt that shapes its behavior,
        and optional settings like response style, conversation memory, and tool access.
        Agents are the core unit of interaction — when a user sends a message on any
        channel, it&apos;s an agent that formulates and sends the response.
      </p>

      <h3>Can I create custom agents?</h3>
      <p>
        On the <strong>Pro</strong> and <strong>Ultra</strong> plans, you have access to
        the{" "}
        <Link href="/docs/pro/agent-builder" className="text-primary hover:underline">
          Agent Builder
        </Link>
        , which provides a visual interface for creating agents from scratch — including
        setting system prompts, personality traits, response formats, and more. On the{" "}
        <strong>Starter</strong> plan, you can browse and deploy pre-built agents from
        the{" "}
        <Link href="/docs/store" className="text-primary hover:underline">Agent Store</Link>,
        which includes agents for common use cases like customer support, sales, research,
        and content writing.
      </p>

      <h3>How many agents can I deploy?</h3>
      <p>
        There is no fixed limit on the number of agents you can deploy. The practical
        limit depends on your VPS resources — each agent consumes a small amount of memory
        and CPU. Most users comfortably run 5 to 15 agents on a single VPS without
        performance issues. If you need to scale beyond that, upgrading to a higher plan
        provides more VPS resources.
      </p>

      {/* ── Data & Privacy ──────────────────────────────────── */}

      <h2>Data &amp; Privacy</h2>

      <h3>Where is my data stored?</h3>
      <p>
        Your conversation data, agent configurations, and uploaded files are stored on{" "}
        <strong>your dedicated VPS</strong> — not on a shared server or multi-tenant
        database. This means your data is physically isolated from other customers. Account
        metadata (email, plan information, billing records) is stored separately in
        ClawHQ&apos;s application database.
      </p>

      <h3>Is my data encrypted?</h3>
      <p>
        Yes. All data in transit is encrypted with <strong>SSL/TLS</strong> — every
        connection between your browser and ClawHQ, between ClawHQ and your VPS, and
        between your VPS and messaging channels uses HTTPS. At rest, your VPS uses
        server-level disk encryption. API keys and sensitive credentials are stored
        encrypted and are never exposed in the dashboard UI after initial entry.
      </p>

      <h3>Can I export my data?</h3>
      <p>
        Yes. From the{" "}
        <Link href="/docs/account" className="text-primary hover:underline">Account</Link>{" "}
        settings page, you can export your data including conversation history, agent
        configurations, and account information. Exports are generated as downloadable
        files that you can save locally for your records or migrate to another platform.
      </p>

      <h3>Who has access to my VPS?</h3>
      <p>
        Only <strong>you</strong> and <strong>ClawHQ administrators</strong> have access
        to your VPS. Administrator access is used exclusively for support purposes — for
        example, if you submit a ticket about a deployment issue, a support engineer may
        need to inspect your server logs to diagnose the problem. ClawHQ staff do not
        access your VPS without a support reason, and all administrative access is logged
        in the{" "}
        <Link href="/docs/pro/audit-log" className="text-primary hover:underline">
          audit log
        </Link>{" "}
        (available on Pro and Ultra plans).
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-foreground">Your data, your control</p>
        <p className="text-sm text-muted-foreground mt-1">
          ClawHQ&apos;s architecture ensures that your conversation data never leaves your
          dedicated VPS. Unlike shared platforms where data is pooled across customers,
          your VPS is an isolated environment that only you control.
        </p>
      </div>

      {/* ── API ─────────────────────────────────────────────── */}

      <h2>API</h2>

      <h3>How do I get API access?</h3>
      <p>
        API access is available on the <strong>Pro</strong> plan and above. Once you are
        on a Pro or Ultra plan, navigate to the{" "}
        <Link href="/docs/pro/api" className="text-primary hover:underline">API Access</Link>{" "}
        page in your dashboard and click <strong>Create Key</strong> to generate your
        first API key. You can create multiple keys with different permissions for
        different integrations. See the{" "}
        <Link href="/docs/api/auth" className="text-primary hover:underline">
          API Authentication
        </Link>{" "}
        documentation for full details.
      </p>

      <h3>What is the API key format?</h3>
      <p>
        ClawHQ API keys use the <code>clw_</code> prefix followed by 36 alphanumeric
        characters (e.g., <code>clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8</code>). Keys
        are passed in the <code>Authorization</code> header using the Bearer scheme:
      </p>
      <pre><code>Authorization: Bearer clw_your_api_key_here</code></pre>
      <p>
        API keys are shown only once at creation time. If you lose a key, revoke it and
        create a new one from the API Access page.
      </p>

      <h3>Does the API support streaming?</h3>
      <p>
        Yes. The ClawHQ API supports <strong>Server-Sent Events (SSE)</strong> for
        streaming responses. Set <code>{`"stream": true`}</code> in your request body, and
        the response will be delivered as a stream of events, each containing a token
        chunk. This enables real-time display of AI responses in your application. See
        the{" "}
        <Link href="/docs/api/chat" className="text-primary hover:underline">
          Chat API documentation
        </Link>{" "}
        for streaming examples and the{" "}
        <Link href="/docs/api/rate-limits" className="text-primary hover:underline">
          Rate Limits
        </Link>{" "}
        page for throughput details.
      </p>

      {/* ── Billing ─────────────────────────────────────────── */}

      <h2>Billing</h2>

      <h3>How does billing work?</h3>
      <p>
        ClawHQ offers both <strong>monthly</strong> and <strong>annual</strong> billing
        cycles. Monthly plans renew automatically on the same date each month. Annual
        plans renew once per year and include a ~15% discount compared to monthly billing.
        You can view your billing cycle, payment history, and upcoming invoices on the{" "}
        <Link href="/docs/billing" className="text-primary hover:underline">Billing</Link>{" "}
        page.
      </p>

      <h3>Can I cancel anytime?</h3>
      <p>
        Yes. You can cancel your subscription at any time from the{" "}
        <Link href="/docs/billing" className="text-primary hover:underline">Billing</Link>{" "}
        page. When you cancel, you retain full access to your account and all features
        until the end of your current billing period. There are no cancellation fees or
        early termination penalties.
      </p>

      <h3>What happens to my data if I cancel?</h3>
      <p>
        After your billing period ends, your VPS is retained for{" "}
        <strong>30 days</strong> in a suspended state. During this grace period, you can
        reactivate your subscription to restore full access immediately. After 30 days,
        the VPS and all data on it (conversations, agent configurations, uploaded files)
        are permanently deleted. We recommend{" "}
        <Link href="/docs/account" className="text-primary hover:underline">
          exporting your data
        </Link>{" "}
        before canceling if you want to keep a copy.
      </p>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="text-sm font-medium text-amber-500">Important: Export before canceling</p>
        <p className="text-sm text-muted-foreground mt-1">
          Once the 30-day retention period expires after cancellation, your data cannot
          be recovered. Use the data export feature in{" "}
          <Link href="/docs/account" className="text-primary hover:underline">
            Account Settings
          </Link>{" "}
          to download your conversations and configurations before canceling.
        </p>
      </div>

      {/* ── Still Need Help ─────────────────────────────────── */}

      <h2>Still Have Questions?</h2>
      <p>
        If your question is not answered here, we are happy to help:
      </p>
      <ul>
        <li>
          <Link href="/docs/support-contact" className="text-primary hover:underline">
            Contact Support
          </Link>{" "}
          — Create a ticket from your dashboard for personalized assistance
        </li>
        <li>
          <Link href="/docs/getting-started" className="text-primary hover:underline">
            Quick Start Guide
          </Link>{" "}
          — Step-by-step walkthrough from sign-up to first conversation
        </li>
        <li>
          <Link href="/docs/plans" className="text-primary hover:underline">
            Plans &amp; Pricing
          </Link>{" "}
          — Detailed feature comparison across all subscription tiers
        </li>
        <li>
          <Link href="/docs/dashboard" className="text-primary hover:underline">
            Dashboard Guide
          </Link>{" "}
          — Complete overview of every dashboard feature
        </li>
      </ul>
    </article>
  );
}
