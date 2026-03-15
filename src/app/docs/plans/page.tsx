import Link from "next/link";

export default function DocsPlansPricingPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Plans &amp; Pricing</h1>
      <p className="lead text-lg text-muted-foreground">
        ClawHQ offers four plans to match your needs. Every plan includes a dedicated VPS,
        bundled AI models with no per-token charges, and all seven messaging channels.
      </p>

      <h2>Plan Overview</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-5 rounded-lg border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-mono">STARTER</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">$59<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-sm text-muted-foreground mt-1">$599/year (save ~15%)</p>
          <p className="text-sm text-muted-foreground mt-3">
            Everything you need to run AI agents. Dedicated VPS, bundled models, all channels,
            Agent Store, and managed infrastructure.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-[#ffe0c2]/20 bg-[#ffe0c2]/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">$129<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-sm text-muted-foreground mt-1">$1,299/year (save ~15%)</p>
          <p className="text-sm text-muted-foreground mt-3">
            Everything in Starter plus professional tools: Logs Explorer, Analytics,
            Knowledge Base, Webhooks, API Access, Audit Log, Agent Builder, and Model Playground.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono">ULTRA</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">$350<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-sm text-muted-foreground mt-1">$3,499/year (save ~15%)</p>
          <p className="text-sm text-muted-foreground mt-3">
            Everything in Pro plus Mission Control — a command center for managing your AI
            agent workforce with task boards, real-time monitoring, and session tracking.
          </p>
        </div>
        <div className="p-5 rounded-lg border border-teal-500/20 bg-teal-500/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-teal-500/10 text-teal-500 px-2 py-0.5 rounded font-mono">ENTERPRISE</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">$999+<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-sm text-muted-foreground mt-1">Custom pricing</p>
          <p className="text-sm text-muted-foreground mt-3">
            Custom resources, dedicated support, SLAs, unlimited everything, and a
            tailored onboarding experience for your organization.
          </p>
        </div>
      </div>

      <h2>Feature Comparison</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
              <th className="text-center py-3 px-3 text-green-500 font-medium">Starter</th>
              <th className="text-center py-3 px-3 text-[#ffe0c2] font-medium">Pro</th>
              <th className="text-center py-3 px-3 text-amber-500 font-medium">Ultra</th>
              <th className="text-center py-3 px-3 text-teal-500 font-medium">Enterprise</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            <tr className="border-b border-border/50"><td colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/20">Infrastructure</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Dedicated VPS</td><td className="text-center">2 vCPU / 8 GB</td><td className="text-center">8 vCPU / 32 GB</td><td className="text-center">16 vCPU / 64 GB</td><td className="text-center">Custom</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Storage</td><td className="text-center">100 GB</td><td className="text-center">200 GB</td><td className="text-center">400 GB</td><td className="text-center">Custom</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Bandwidth</td><td className="text-center">8 TB</td><td className="text-center">16 TB</td><td className="text-center">32 TB</td><td className="text-center">Unlimited</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Custom Domains</td><td className="text-center">3</td><td className="text-center">3</td><td className="text-center">3</td><td className="text-center">Unlimited</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">SSL Certificates</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>

            <tr className="border-b border-border/50"><td colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/20">AI &amp; Agents</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Bundled AI Models</td><td className="text-center">3 models</td><td className="text-center">3+ models</td><td className="text-center">All models</td><td className="text-center">Custom</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Model Switches / Month</td><td className="text-center">5</td><td className="text-center">Unlimited</td><td className="text-center">Unlimited</td><td className="text-center">Unlimited</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Agent Store</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Agent Builder</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Model Playground</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>

            <tr className="border-b border-border/50"><td colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/20">Channels</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Messaging Channels</td><td className="text-center">All 7</td><td className="text-center">All 7</td><td className="text-center">All 7</td><td className="text-center">All 7 + Custom</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Channel Analytics</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Auto-Responses</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>

            <tr className="border-b border-border/50"><td colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/20">Pro Tools</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Logs Explorer</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Usage Analytics</td><td className="text-center">Basic</td><td className="text-center">Full</td><td className="text-center">Full</td><td className="text-center">Full + Custom</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Knowledge Base (RAG)</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Webhooks</td><td className="text-center">—</td><td className="text-center">10 endpoints</td><td className="text-center">10 endpoints</td><td className="text-center">Unlimited</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">API Access</td><td className="text-center">—</td><td className="text-center">5 keys</td><td className="text-center">5 keys</td><td className="text-center">Unlimited</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Audit Log</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>

            <tr className="border-b border-border/50"><td colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/20">Mission Control (Ultra)</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Task Board</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Agent Roster</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Event Feed</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Session Tracker</td><td className="text-center">—</td><td className="text-center">—</td><td className="text-center">&#10003;</td><td className="text-center">&#10003;</td></tr>

            <tr className="border-b border-border/50"><td colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/20">Support</td></tr>
            <tr className="border-b border-border/30"><td className="py-2.5 px-4">Support Level</td><td className="text-center">Tickets</td><td className="text-center">Priority</td><td className="text-center">Priority</td><td className="text-center">Dedicated</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Starter — $59/mo</h2>
      <p>
        The Starter plan is designed for individuals and small businesses who want to deploy
        AI agents without complexity. Everything runs on your dedicated VPS with no per-token
        billing.
      </p>
      <ul>
        <li><strong>Dedicated VPS</strong> — 2 vCPU, 8 GB RAM, 100 GB storage, 8 TB bandwidth</li>
        <li><strong>Bundled AI models</strong> — Three models included, switch up to 5 times per billing cycle</li>
        <li><strong>All 7 channels</strong> — Telegram, Discord, Slack, Teams, WhatsApp, Signal, Webchat</li>
        <li><strong>Agent Store</strong> — Browse, install, and deploy pre-built agents</li>
        <li><strong>Chat interface</strong> — Streaming responses, conversation history, file support</li>
        <li><strong>VPS management</strong> — Start, stop, restart, monitor, custom domains</li>
        <li><strong>Basic monitoring</strong> — CPU, RAM, disk, and network gauges</li>
        <li><strong>Support tickets</strong> — Create and track support requests</li>
      </ul>

      <h2>Pro — $129/mo</h2>
      <p>
        The Pro plan adds professional tools for deeper insights, automation, and integration.
        See <Link href="/docs/pro" className="text-primary hover:underline">Pro Features</Link> for details.
      </p>
      <p>Everything in Starter, plus:</p>
      <ul>
        <li><strong>Logs Explorer</strong> — Real-time streaming, search, saved views, alerting</li>
        <li><strong>Usage Analytics</strong> — Funnels, CSAT, paths, anomaly detection, custom dashboards</li>
        <li><strong>Knowledge Base</strong> — Upload documents, RAG-powered responses, hybrid search</li>
        <li><strong>Webhooks</strong> — 9 event types, HMAC signatures, auto-retry, delivery tracking</li>
        <li><strong>API Access</strong> — REST API with streaming, per-key rate limits</li>
        <li><strong>Audit Log</strong> — Tamper-proof logging, SIEM streaming, export</li>
        <li><strong>Agent Builder</strong> — Create agents with AI assistance or manual configuration</li>
        <li><strong>Model Playground</strong> — Side-by-side model comparison</li>
        <li><strong>Upgraded VPS</strong> — 8 vCPU, 32 GB RAM, 200 GB storage</li>
      </ul>

      <h2>Ultra — $350/mo</h2>
      <p>
        The Ultra plan adds Mission Control. See{" "}
        <Link href="/docs/ultra" className="text-primary hover:underline">Ultra Features</Link> for details.
      </p>
      <p>Everything in Pro, plus:</p>
      <ul>
        <li><strong>Task Board</strong> — Kanban with drag-drop, keyboard shortcuts, dependencies, automation</li>
        <li><strong>Agent Roster</strong> — Real-time status, performance metrics, agent controls</li>
        <li><strong>Event Feed</strong> — Live activity stream with SSE</li>
        <li><strong>Session Tracker</strong> — Execution traces with timeline views</li>
        <li><strong>Upgraded VPS</strong> — 16 vCPU, 64 GB RAM, 400 GB storage</li>
      </ul>

      <h2>Enterprise — $999+/mo</h2>
      <p>Everything in Ultra, plus custom resources, dedicated support, SLAs, and unlimited everything. Contact <strong>enterprise@clawhq.tech</strong>.</p>

      <h2>Annual Billing</h2>
      <p>Save approximately 15% with annual billing:</p>
      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-4 text-muted-foreground font-medium">Plan</th>
              <th className="text-center py-2 px-4 text-muted-foreground font-medium">Monthly</th>
              <th className="text-center py-2 px-4 text-muted-foreground font-medium">Annual</th>
              <th className="text-center py-2 px-4 text-muted-foreground font-medium">Effective Monthly</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            <tr className="border-b border-border/30"><td className="py-2 px-4">Starter</td><td className="text-center">$59</td><td className="text-center">$599</td><td className="text-center">$49.92</td></tr>
            <tr className="border-b border-border/30"><td className="py-2 px-4">Pro</td><td className="text-center">$129</td><td className="text-center">$1,299</td><td className="text-center">$108.25</td></tr>
            <tr className="border-b border-border/30"><td className="py-2 px-4">Ultra</td><td className="text-center">$350</td><td className="text-center">$3,499</td><td className="text-center">$291.58</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Upgrading &amp; Downgrading</h2>
      <p>
        <strong>Upgrades</strong> take effect immediately. Your VPS is upgraded and new features
        become available instantly. You pay the prorated difference for the current cycle.
      </p>
      <p>
        <strong>Downgrades</strong> take effect at the end of your current billing cycle. You
        retain access to all features until then.
      </p>

      <h2>Related</h2>
      <ul>
        <li><Link href="/docs/getting-started" className="text-primary hover:underline">Quick Start Guide</Link></li>
        <li><Link href="/docs/billing" className="text-primary hover:underline">Billing &amp; Payments</Link></li>
        <li><Link href="/docs/pro" className="text-primary hover:underline">Pro Features</Link></li>
        <li><Link href="/docs/ultra" className="text-primary hover:underline">Ultra Features</Link></li>
      </ul>
    </article>
  );
}
