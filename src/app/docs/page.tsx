import Link from "next/link";

export default function DocsIntroduction() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>ClawHQ Documentation</h1>
      <p className="lead text-lg text-muted-foreground">
        ClawHQ is a managed AI agent hosting platform. Deploy intelligent agents on your own
        dedicated server, connect them to seven messaging channels, and manage everything from
        a single dashboard — all for a flat monthly price.
      </p>

      <h2>What is ClawHQ?</h2>
      <p>
        ClawHQ provisions a dedicated VPS with{" "}
        <a href="https://openclaw.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          OpenClaw
        </a>{" "}
        (an open-source AI agent framework) pre-installed and configured. You get bundled AI
        models, SSL certificates, reverse proxy, and everything else needed to run production
        AI agents — without managing any infrastructure yourself.
      </p>
      <p>
        Your data stays on <strong>your</strong> server. Unlike shared SaaS platforms, every
        ClawHQ customer gets their own isolated VPS. Chat history, knowledge base documents,
        and agent configurations never leave your instance.
      </p>

      <h2>Who is ClawHQ for?</h2>
      <ul>
        <li><strong>Businesses</strong> that want AI-powered customer support across WhatsApp, Telegram, Discord, Slack, and more</li>
        <li><strong>Developers</strong> who need a managed AI agent platform with full API access</li>
        <li><strong>Teams</strong> that want to coordinate multiple AI agents working on tasks simultaneously</li>
        <li><strong>Agencies</strong> deploying AI solutions for clients without managing infrastructure</li>
      </ul>

      <h2>How it Works</h2>
      <div className="not-prose grid grid-cols-1 sm:grid-cols-5 gap-4 my-8">
        {[
          { step: "1", title: "Sign Up", desc: "Create your account and choose a plan" },
          { step: "2", title: "Provisioning", desc: "We set up your dedicated VPS (15–30 min)" },
          { step: "3", title: "Connect", desc: "Link your messaging channels" },
          { step: "4", title: "Deploy", desc: "Add AI agents from the store or build your own" },
          { step: "5", title: "Chat", desc: "Your agents respond to messages automatically" },
        ].map((item) => (
          <div key={item.step} className="text-center p-4 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-mono text-sm flex items-center justify-center mx-auto mb-2">
              {item.step}
            </div>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2>Plans</h2>
      <p>
        ClawHQ offers four tiers, each building on the previous one. Every plan includes a
        dedicated VPS, bundled AI models with no per-token charges, and all seven messaging
        channels.
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-subtle)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-[var(--accent-muted)] text-[var(--accent)] px-2 py-0.5 rounded font-mono">STARTER</span>
            <span className="text-sm font-bold text-foreground">$59/mo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Dedicated VPS, bundled AI models, 7 channels, Agent Store, monitoring, support
            tickets. The &quot;it just works&quot; tier.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-[color-mix(in_srgb,var(--tier-pro),transparent_80%)] bg-[color-mix(in_srgb,var(--tier-pro),transparent_95%)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-[color-mix(in_srgb,var(--tier-pro),transparent_90%)] text-[var(--tier-pro)] px-2 py-0.5 rounded font-mono">PRO</span>
            <span className="text-sm font-bold text-foreground">$129/mo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Everything in Starter plus Logs Explorer, Analytics, Knowledge Base (RAG), Webhooks,
            API Access, Audit Log, Agent Builder, and Model Playground.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-[color-mix(in_srgb,var(--tier-ultra),transparent_80%)] bg-[color-mix(in_srgb,var(--tier-ultra),transparent_95%)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-[color-mix(in_srgb,var(--tier-ultra),transparent_90%)] text-[var(--tier-ultra)] px-2 py-0.5 rounded font-mono">ULTRA</span>
            <span className="text-sm font-bold text-foreground">$350/mo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Everything in Pro plus Mission Control — a command center with task board, agent
            roster, event feed, and session tracking.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-[color-mix(in_srgb,var(--tier-enterprise),transparent_80%)] bg-[color-mix(in_srgb,var(--tier-enterprise),transparent_95%)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-[color-mix(in_srgb,var(--tier-enterprise),transparent_90%)] text-[var(--tier-enterprise)] px-2 py-0.5 rounded font-mono">ENTERPRISE</span>
            <span className="text-sm font-bold text-foreground">$999+/mo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Custom resources, dedicated support, SLAs, unlimited webhooks and API keys,
            and a tailored onboarding experience.
          </p>
        </div>
      </div>
      <p>
        See the full feature comparison on the{" "}
        <Link href="/docs/plans" className="text-primary hover:underline">Plans &amp; Pricing</Link> page.
      </p>

      <h2>Key Differentiators</h2>
      <ul>
        <li><strong>Dedicated, not shared.</strong> Every customer gets their own VPS — no noisy neighbors, no shared resources.</li>
        <li><strong>Flat-rate pricing.</strong> AI models are bundled. No per-token billing, no surprise charges.</li>
        <li><strong>Seven channels included.</strong> Telegram, Discord, Slack, Microsoft Teams, WhatsApp, Signal, and Webchat — all on every plan.</li>
        <li><strong>Your data, your server.</strong> Chat history and knowledge base documents stay on your VPS, not on a shared cloud.</li>
        <li><strong>Fully managed.</strong> SSL, DNS, updates, and monitoring are handled for you.</li>
      </ul>

      <h2>Documentation Overview</h2>
      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
        {[
          { title: "Quick Start Guide", href: "/docs/getting-started", desc: "Get your first agent running in 15 minutes" },
          { title: "Dashboard", href: "/docs/dashboard", desc: "Overview page, health, activity, notifications" },
          { title: "VPS Management", href: "/docs/vps", desc: "Server controls, domains, SSL, services" },
          { title: "AI Models", href: "/docs/models", desc: "Model switching, comparison, recommendations" },
          { title: "Agents", href: "/docs/agents", desc: "Deploy, test, configure, and monitor agents" },
          { title: "Agent Store", href: "/docs/store", desc: "Browse and install pre-built agents" },
          { title: "Chat", href: "/docs/chat", desc: "Streaming chat with your AI agents" },
          { title: "Channels", href: "/docs/channels", desc: "Connect Telegram, Discord, Slack, and more" },
          { title: "Pro Features", href: "/docs/pro", desc: "Logs, Analytics, KB, Webhooks, API, Audit" },
          { title: "Ultra Features", href: "/docs/ultra", desc: "Mission Control: Task Board, Agent Roster" },
          { title: "API Reference", href: "/docs/api/auth", desc: "REST API with code examples" },
          { title: "FAQ", href: "/docs/faq", desc: "Common questions answered" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 rounded-lg border border-border bg-card hover:bg-[#2a2a2a] transition-colors no-underline"
          >
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      <h2>Next Steps</h2>
      <p>
        Ready to get started?{" "}
        <Link href="/docs/getting-started" className="text-primary hover:underline">
          Follow the Quick Start Guide
        </Link>{" "}
        to have your first AI agent running in under 15 minutes.
      </p>
    </article>
  );
}
