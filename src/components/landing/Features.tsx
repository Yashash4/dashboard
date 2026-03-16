"use client";

import { motion } from "framer-motion";
import {
  Bot,
  MessageSquare,
  Server,
  Store,
  Activity,
  Shield,
  Wand2,
  Database,
  Webhook,
  Code2,
  FileSearch,
  BarChart3,
  ClipboardList,
  Command,
  Calendar,
  Timer,
  Globe,
  Bell,
} from "lucide-react";

/* ───────────────────────── Unique Visuals ───────────────────────── */

function ModelsVisual() {
  const models = ["Kimi K2.5", "MiniMax M2.5", "Claude 4", "GPT-4.1", "Gemini 2.5", "DeepSeek V3", "Llama 4", "Qwen 3"];
  return (
    <div className="mt-4 h-28 overflow-hidden relative rounded-md bg-background/40 border border-border/50 p-3">
      <div className="flex flex-wrap gap-2">
        {models.map((m, i) => (
          <span
            key={m}
            className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 opacity-40 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            {m}
          </span>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent opacity-50 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
}

function ChannelsVisual() {
  const channels = ["WA", "TG", "DC", "SL", "TM", "SG", "WC"];
  const colors = [
    "bg-green-500/20 text-green-400",
    "bg-blue-400/20 text-blue-400",
    "bg-indigo-400/20 text-indigo-400",
    "bg-purple-400/20 text-purple-400",
    "bg-violet-400/20 text-violet-400",
    "bg-cyan-400/20 text-cyan-400",
    "bg-orange-400/20 text-orange-400",
  ];
  return (
    <div className="mt-4 h-28 flex items-center justify-center">
      <div className="flex items-center">
        {channels.map((ch, i) => (
          <div
            key={ch}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${colors[i]} border border-white/10 transition-all duration-500 -ml-2 first:ml-0 group-hover:ml-1 group-hover:first:ml-0`}
            style={{ zIndex: channels.length - i, transitionDelay: `${i * 30}ms` }}
          >
            {ch}
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketplaceVisual() {
  return (
    <div className="mt-4 h-24 flex items-center justify-center">
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-sm bg-primary/15 border border-primary/20 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-500"
            style={{ transitionDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function VPSVisual() {
  const bars = [
    { label: "CPU", target: 75 },
    { label: "RAM", target: 60 },
    { label: "NVMe", target: 45 },
  ];
  return (
    <div className="mt-4 space-y-2.5">
      {bars.map((bar, i) => (
        <div key={bar.label}>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{bar.label}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">{bar.target}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-background/60 overflow-hidden">
            <div
              className="vps-bar h-full rounded-full bg-primary/60 group-hover:bg-primary transition-all duration-700 ease-out"
              style={{ "--bar-target": `${bar.target}%`, transitionDelay: `${i * 120}ms` } as React.CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MonitoringVisual() {
  const heights = [40, 65, 35, 80, 55, 70, 45, 75, 50, 85, 60, 90];
  return (
    <div className="mt-4 h-24 flex items-end gap-[3px] px-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className="chart-bar flex-1 rounded-t-sm bg-primary/20 group-hover:bg-primary/50 transition-all duration-500 ease-out"
          style={{ "--bar-target": `${h}%`, transitionDelay: `${i * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function ManagedVisual() {
  const items = ["Setup", "SSL certs", "Updates", "Backups", "Monitoring", "Recovery"];
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
      {items.map((item, i) => (
        <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className="w-3.5 h-3.5 rounded-sm border border-border flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all duration-300"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <svg
              className="w-2.5 h-2.5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ transitionDelay: `${i * 100 + 100}ms` }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="group-hover:text-foreground transition-colors duration-300" style={{ transitionDelay: `${i * 100}ms` }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Feature Data — By Tier ───────────────────────── */

interface FeatureCard {
  icon: typeof Bot;
  title: string;
  description: React.ReactNode;
  visual?: React.FC;
  large?: boolean;
  bullets?: string[];
}

const starterFeatures: FeatureCard[] = [
  {
    icon: Bot,
    title: "AI Models Built In",
    description: (
      <>
        <span className="text-foreground font-medium">Kimi K2.5</span>,{" "}
        <span className="text-foreground font-medium">MiniMax M2.5</span>, and more. No API keys. No per-token billing. Flat rate, unlimited feel.
      </>
    ),
    visual: ModelsVisual,
    large: true,
    bullets: ["Unlimited messages", "Auto-fallback between models", "5 switches/month"],
  },
  {
    icon: MessageSquare,
    title: "7 Channels, Day One",
    description: (
      <>
        WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat.{" "}
        <span className="text-foreground font-medium">All included</span>. Real-time connection testing.
      </>
    ),
    visual: ChannelsVisual,
  },
  {
    icon: Store,
    title: "Agent Store",
    description: "7 pre-built agents free at launch — Support, Research, Writer, Data, Sales, Reviewer, Manager. One-click deploy.",
    visual: MarketplaceVisual,
  },
  {
    icon: Server,
    title: "Dedicated VPS",
    description: "Guaranteed CPU, RAM, NVMe. Not shared. Health monitoring + service status dashboard.",
    visual: VPSVisual,
  },
  {
    icon: Activity,
    title: "Real-Time Monitoring",
    description: "Live CPU, RAM, disk, network charts. Health checks every 2 min. Auto-restart on crash.",
    visual: MonitoringVisual,
  },
  {
    icon: Shield,
    title: "Fully Managed",
    description: (
      <>
        Setup, updates, SSL, crash recovery, custom domain.{" "}
        <span className="text-foreground font-medium">Live in 24 hours</span>. Onboarding checklist guides you.
      </>
    ),
    visual: ManagedVisual,
  },
];

const proFeatures: { icon: typeof Bot; title: string; desc: string }[] = [
  { icon: Wand2, title: "Agent Builder", desc: "AI-assisted + manual creation. Describe what you want, we generate the config." },
  { icon: Bot, title: "Model Playground", desc: "Side-by-side comparison. Test prompts across models before switching." },
  { icon: Database, title: "Knowledge Base", desc: "Upload docs, URLs, or paste text. Vector search (RAG) powers your agents." },
  { icon: Webhook, title: "Webhooks", desc: "9 event types, delivery logs, auto-retry, payload transformations, templates." },
  { icon: Code2, title: "API Access", desc: "Full REST API with SSE streaming. SDKs for Python, JS, cURL. 22 enterprise features." },
  { icon: FileSearch, title: "Logs Explorer", desc: "Live streaming, pattern detection, alerting rules. 12 features for debugging." },
  { icon: BarChart3, title: "Usage Analytics", desc: "Funnels, CSAT scores, resolution rates, intent analysis. 16 features total." },
  { icon: ClipboardList, title: "Audit Log", desc: "Tamper-proof, SIEM streaming, compliance export. 12 enterprise features." },
];

const ultraFeatures: { icon: typeof Bot; title: string; desc: string }[] = [
  { icon: Command, title: "Mission Control", desc: "Executive dashboard for your AI workforce. Real-time health, tasks, events." },
  { icon: Activity, title: "Kanban Task Board", desc: "Drag-drop, keyboard shortcuts, command palette, swimlane view." },
  { icon: Bot, title: "Agent Roster", desc: "Start, stop, restart agents. Live status, capacity, performance metrics." },
  { icon: Bell, title: "Event Feed", desc: "Live activity stream. Every agent action, task change, and system event." },
  { icon: Timer, title: "Session Tracker", desc: "Gantt timeline traces. Step-by-step execution replay." },
  { icon: Calendar, title: "Advanced Features", desc: "Task dependencies, automation rules, recurring tasks, time tracking." },
];

/* ───────────────────────── Component ───────────────────────── */

export default function Features() {
  const topRow = starterFeatures.slice(0, 2);
  const bottomRow = starterFeatures.slice(2);

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">Everything included</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">One price. Everything you need.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            No API keys to manage. No separate AI bills. No channel add-ons. Every plan includes the full platform.
          </p>
        </motion.div>

        {/* ─── Starter Features ─── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Starter — $59/mo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {topRow.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`group p-6 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors duration-300 ${feature.large ? "lg:col-span-2" : ""}`}
            >
              <feature.icon size={20} className="text-primary mb-3" />
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              {feature.visual && <feature.visual />}
              {feature.bullets && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
                  {feature.bullets.map((b) => (
                    <span key={b} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="text-primary">&#10003;</span> {b}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {bottomRow.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i + 2) * 0.08 }}
              className="group p-6 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors duration-300"
            >
              <feature.icon size={20} className="text-primary mb-3" />
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              {feature.visual && <feature.visual />}
            </motion.div>
          ))}
        </div>

        {/* ─── Pro Features ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#ffe0c2" }}>
            Pro — $129/mo
          </p>
          <p className="text-sm text-muted-foreground">Everything in Starter, plus:</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {proFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="p-5 rounded-lg bg-card border border-border hover:border-[#ffe0c2]/20 transition-colors duration-300"
            >
              <feature.icon size={18} className="mb-2.5" style={{ color: "#ffe0c2" }} />
              <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* ─── Ultra Features ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "oklch(0.7214 0.1337 49.9802)" }}>
            Ultra — $350/mo
          </p>
          <p className="text-sm text-muted-foreground">Everything in Pro, plus:</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ultraFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="p-5 rounded-lg bg-card border border-border hover:border-amber-500/20 transition-colors duration-300"
            >
              <feature.icon size={18} className="mb-2.5" style={{ color: "oklch(0.7214 0.1337 49.9802)" }} />
              <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
