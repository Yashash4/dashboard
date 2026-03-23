"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, MessageSquare, Server, Store, Activity, Shield,
  Wand2, Database, Webhook, Code2, FileSearch, BarChart3, ClipboardList,
  Command, Bell, Timer, Calendar,
} from "lucide-react";

/* ───────────────────────── Hover Visuals ───────────────────────── */

function ModelsVisual() {
  const models = ["Kimi", "MiniMax", "DeepSeek", "Llama", "Qwen", "Mistral"];
  return (
    <div className="mt-3 flex flex-wrap gap-2 items-center justify-center">
      {models.map((m, i) => (
        <span
          key={m}
          className="anim-float px-2.5 py-1 text-xs rounded-md bg-[var(--accent-muted)] text-[var(--text-primary)] border border-[var(--accent)] font-medium"
          style={{ animationDelay: `${i * 300}ms` }}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

function ChannelsVisual() {
  const channels = ["WA", "TG", "DC", "SL", "TM", "SG", "WC"];
  const colors = [
    "bg-[var(--success)]/20 text-[var(--success)]",
    "bg-[var(--info)]/20 text-[var(--info)]",
    "bg-[var(--tier-pro)]/20 text-[var(--tier-pro)]",
    "bg-[var(--tier-pro)]/20 text-[var(--tier-pro)]",
    "bg-[var(--info)]/20 text-[var(--info)]",
    "bg-[var(--accent)]/20 text-[var(--accent)]",
    "bg-[var(--tier-ultra)]/20 text-[var(--tier-ultra)]",
  ];
  return (
    <div className="mt-3 pb-1 flex items-center justify-center">
      <div className="flex items-center">
        {channels.map((ch, i) => (
          <div
            key={ch}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${colors[i]} border border-[var(--border-primary)] ml-1.5 first:ml-0`}
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
  const agents = [
    { name: "Support", color: "bg-[var(--info)]/15 text-[var(--info)]" },
    { name: "Research", color: "bg-[var(--tier-pro)]/15 text-[var(--tier-pro)]" },
    { name: "Writer", color: "bg-[var(--success)]/15 text-[var(--success)]" },
    { name: "Data", color: "bg-[var(--accent)]/15 text-[var(--accent)]" },
    { name: "Sales", color: "bg-[var(--tier-ultra)]/15 text-[var(--tier-ultra)]" },
    { name: "Reviewer", color: "bg-[var(--error)]/15 text-[var(--error)]" },
    { name: "Manager", color: "bg-[var(--info)]/15 text-[var(--info)]" },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {agents.map((agent, i) => (
        <div
          key={agent.name}
          className={`anim-fade-pulse flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-base)]`}
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <div className={`w-4 h-4 rounded-sm ${agent.color} flex items-center justify-center`}>
            <Bot className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">{agent.name}</span>
        </div>
      ))}
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
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
            <span>{bar.label}</span>
            <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-500">{bar.target}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-base)]/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${bar.target}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MonitoringVisual() {
  const data = [
    { h: 40, color: "bg-[var(--accent)]" },
    { h: 65, color: "bg-[var(--tier-pro)]" },
    { h: 35, color: "bg-[var(--accent)]" },
    { h: 80, color: "bg-[var(--info)]" },
    { h: 55, color: "bg-[var(--accent)]" },
    { h: 70, color: "bg-[var(--tier-pro)]" },
    { h: 45, color: "bg-[var(--accent)]" },
    { h: 75, color: "bg-[var(--info)]" },
    { h: 50, color: "bg-[var(--accent)]" },
    { h: 85, color: "bg-[var(--tier-pro)]" },
    { h: 60, color: "bg-[var(--accent)]" },
    { h: 90, color: "bg-[var(--info)]" },
  ];
  return (
    <div className="mt-4 h-24 flex items-end gap-[3px] px-2">
      {data.map((d, i) => (
        <div
          key={i}
          className={`anim-wave flex-1 rounded-t-sm ${d.color} opacity-70`}
          style={{ "--bar-min": `${d.h * 0.5}%`, "--bar-max": `${d.h}%`, "--bar-target": `${d.h}%`, animationDelay: `${i * 200}ms` } as React.CSSProperties}
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
        <div key={item} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <div
            className="anim-check-glow w-3.5 h-3.5 rounded-sm border border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center shrink-0 transition-all duration-300"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <svg
              className="w-2.5 h-2.5 text-[var(--accent-foreground)] opacity-100"
              style={{ transitionDelay: `${i * 100 + 100}ms` }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[var(--text-primary)]">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Feature Data ───────────────────────── */

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
        <span className="text-[var(--text-primary)] font-medium">Kimi K2.5</span>,{" "}
        <span className="text-[var(--text-primary)] font-medium">MiniMax M2.7</span>, DeepSeek, Llama, Qwen, Mistral and more. No API keys. No per-token billing. Flat rate.
      </>
    ),
    visual: ModelsVisual,
    large: true,
    bullets: ["Unlimited messages", "Auto-fallback between models"],
  },
  {
    icon: MessageSquare,
    title: "7 Channels, Day One",
    description: (
      <>
        WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat.{" "}
        <span className="text-[var(--text-primary)] font-medium">All included</span>. Real-time connection testing.
      </>
    ),
    visual: ChannelsVisual,
  },
  {
    icon: Store,
    title: "Agent Store",
    description: "Pre-built agents free at launch — Support, Research, Writer, Data, Sales, Reviewer, Manager. One-click deploy.",
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
        <span className="text-[var(--text-primary)] font-medium">Deploy in minutes</span>. Onboarding checklist guides you.
      </>
    ),
    visual: ManagedVisual,
  },
];

const proFeatures: { icon: typeof Bot; title: string; desc: string }[] = [
  { icon: Wand2, title: "Agent Builder", desc: "AI-assisted + manual creation. Describe what you want, we generate the config." },
  { icon: Bot, title: "Model Playground", desc: "Side-by-side comparison. Test prompts across models before switching." },
  { icon: Database, title: "Knowledge Base", desc: "Upload docs, URLs, or paste text. Vector search (RAG) powers your agents." },
  { icon: Webhook, title: "Webhooks", desc: "9 event types, delivery logs, auto-retry, payload transformations." },
  { icon: Code2, title: "API Access", desc: "Full REST API with SSE streaming. SDKs for Python, JS, cURL." },
  { icon: FileSearch, title: "Logs Explorer", desc: "Live streaming, pattern detection, alerting rules." },
  { icon: BarChart3, title: "Usage Analytics", desc: "Funnels, CSAT scores, resolution rates, intent analysis." },
  { icon: ClipboardList, title: "Audit Log", desc: "Tamper-proof, SIEM streaming, compliance export." },
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
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className={`py-24 md:py-32 px-6 ${inView ? "section-visible" : ""}`}>
      <style>{`
        .vps-bar { width: 8%; transition: width 0.7s ease-out; }
        .group:hover .vps-bar { width: var(--bar-target); }
        .chart-bar { height: 4px; transition: height 0.5s ease-out; }
        .group:hover .chart-bar { height: var(--bar-target); }

        /* Continuous animations when section is visible */
        @keyframes float-tag {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse-circle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes breathe-bar {
          0%, 100% { width: var(--bar-min); }
          50% { width: var(--bar-max); }
        }
        @keyframes wave-bar {
          0%, 100% { height: var(--bar-min); }
          50% { height: var(--bar-max); }
        }
        @keyframes fade-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes check-glow {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 6px 1px var(--accent-muted); }
        }

        .section-visible .anim-float {
          animation: float-tag 3s ease-in-out infinite;
        }
        .section-visible .anim-pulse-circle {
          animation: pulse-circle 2.5s ease-in-out infinite;
        }
        .section-visible .anim-breathe {
          animation: breathe-bar 4s ease-in-out infinite;
        }
        .section-visible .anim-wave {
          animation: wave-bar 5s ease-in-out infinite;
        }
        .section-visible .anim-fade-pulse {
          animation: fade-pulse 3s ease-in-out infinite;
        }
        .section-visible .anim-check-glow {
          animation: check-glow 2s ease-in-out infinite;
        }

      `}</style>

      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-16 md:mb-20"
        >
          <p className="text-[15px] text-[var(--accent)] font-medium mb-4">Everything included</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight leading-[1.1] mb-5">
            One price.{" "}
            <span className="text-[var(--text-secondary)]">Everything you need.</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-[17px] leading-relaxed">
            Built on OpenClaw. No API keys to manage. No separate AI bills. No channel add-ons. Every plan includes the full platform.
          </p>
        </motion.div>

        {/* ─── Platform Features (All Plans) ─── */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          {topRow.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`group p-5 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-primary)] hover:border-[var(--accent-border)] brightness-125 hover:brightness-[1.75] transition-all duration-300 ${feature.large ? "lg:col-span-2" : ""}`}
            >
              <feature.icon size={18} className="text-[var(--accent)] mb-2" />
              <h3 className="text-[17px] font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              {feature.visual && <feature.visual />}
              {feature.bullets && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {feature.bullets.map((b) => (
                    <span key={b} className="text-[13px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                      <span className="text-[var(--accent)]">&#10003;</span> {b}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-24">
          {bottomRow.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i + 2) * 0.08 }}
              className={`group p-6 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-primary)] hover:border-[var(--accent-border)] brightness-125 hover:brightness-[1.75] transition-all duration-300`}
            >
              <feature.icon size={20} className="text-[var(--accent)] mb-3" />
              <h3 className="text-[17px] font-semibold mb-2">{feature.title}</h3>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              {feature.visual && <feature.visual />}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
