"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LayoutDashboard, MessageSquare, Bot, Radio, BarChart3, Command } from "lucide-react";

/* ─── Tour Tab Data ─── */

const TOUR_TABS = [
  {
    id: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    title: "Everything at a glance",
    description:
      "VPS status, connected channels, deployed agents, and recent activity — all in one view. Health monitoring, onboarding checklist, and smart alerts keep you informed.",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    title: "Talk to your AI agents",
    description:
      "Professional chat with streaming responses, conversation history, file attachments, and code block rendering. Just like ChatGPT — but for YOUR agents on YOUR server.",
  },
  {
    id: "agents",
    label: "Agents",
    icon: Bot,
    title: "Deploy in one click",
    description:
      "7 pre-built agents ready to go — support, research, sales, writing, and more. Health monitoring, quick testing, and per-agent analytics. Build custom agents with AI on Pro.",
  },
  {
    id: "channels",
    label: "Channels",
    icon: Radio,
    title: "Connect everywhere",
    description:
      "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — all channels included on every plan. Real-time connection testing and health monitoring.",
  },
  {
    id: "pro",
    label: "Pro Tools",
    icon: BarChart3,
    title: "Built for builders",
    description:
      "Agent Builder, Model Playground, Knowledge Base with AI search, Webhooks, full API with SDKs, Logs Explorer, Usage Analytics, and tamper-proof Audit Log.",
  },
  {
    id: "ultra",
    label: "Mission Control",
    icon: Command,
    title: "Command your AI workforce",
    description:
      "Kanban task boards, real-time agent monitoring, session traces with Gantt timelines, automation rules, and time tracking. The command center your AI agents deserve.",
  },
] as const;

type TabId = (typeof TOUR_TABS)[number]["id"];

/* ─── Inline Mockups (simple, fast-loading versions) ─── */

function OverviewMock() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex">
        <div className="w-32 border-r border-border bg-[#161616] p-3 hidden sm:block">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-[10px] font-semibold">ClawHQ</span>
          </div>
          {["Overview", "VPS", "Agents", "Chat", "Channels", "Store"].map((s, i) => (
            <div key={s} className={`px-2 py-1.5 rounded text-[10px] mb-0.5 ${i === 0 ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
              {s}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4">
          <p className="text-xs font-semibold mb-3">Overview</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { l: "VPS", v: "Running", dot: true },
              { l: "Plan", v: "Starter" },
              { l: "Model", v: "Kimi K2.5" },
              { l: "Context", v: "128K" },
            ].map((s) => (
              <div key={s.l} className="border border-border rounded p-2">
                <p className="text-[8px] text-muted-foreground">{s.l}</p>
                <div className="flex items-center gap-1">
                  {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                  <span className="text-[10px] font-medium">{s.v}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ l: "Channels", v: "5" }, { l: "Agents", v: "3" }, { l: "Tickets", v: "0" }].map((s) => (
              <div key={s.l} className="border border-border rounded p-2">
                <p className="text-[8px] text-muted-foreground">{s.l}</p>
                <p className="text-sm font-bold">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMock() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-3 h-3 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-medium">Support Agent</p>
          <p className="text-[8px] text-green-500">● Online</p>
        </div>
      </div>
      <div className="p-3 space-y-2 h-40 flex flex-col justify-end">
        <div className="flex justify-end">
          <div className="bg-primary/20 rounded-lg rounded-br-sm px-3 py-1.5 text-[10px] max-w-[70%]">
            Where is my order #12345?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg rounded-bl-sm px-3 py-1.5 text-[10px] max-w-[70%] text-muted-foreground">
            Your order was shipped on March 10 and arrives by March 17. Want the tracking link?
          </div>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-border">
        <div className="bg-muted rounded px-2 py-1.5 text-[9px] text-muted-foreground">
          Type a message...
        </div>
      </div>
    </div>
  );
}

function AgentsMock() {
  const agents = [
    { name: "Support", color: "bg-blue-500/20 text-blue-400" },
    { name: "Research", color: "bg-purple-500/20 text-purple-400" },
    { name: "Writer", color: "bg-green-500/20 text-green-400" },
    { name: "Sales", color: "bg-amber-500/20 text-amber-400" },
    { name: "Data", color: "bg-cyan-500/20 text-cyan-400" },
    { name: "Reviewer", color: "bg-pink-500/20 text-pink-400" },
  ];
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="grid grid-cols-3 gap-2">
        {agents.map((a) => (
          <div key={a.name} className="border border-border rounded p-2 hover:border-primary/30 transition-colors">
            <div className={`w-6 h-6 rounded ${a.color} flex items-center justify-center mb-1.5`}>
              <Bot className="w-3 h-3" />
            </div>
            <p className="text-[10px] font-medium">{a.name}</p>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Free</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelsMock() {
  const ch = [
    { n: "WhatsApp", c: "bg-green-500" },
    { n: "Telegram", c: "bg-blue-400" },
    { n: "Discord", c: "bg-indigo-400" },
    { n: "Slack", c: "bg-purple-400" },
    { n: "Teams", c: "bg-blue-600" },
    { n: "Signal", c: "bg-cyan-400" },
    { n: "Webchat", c: "bg-orange-400" },
  ];
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="space-y-1.5">
        {ch.map((c) => (
          <div key={c.n} className="flex items-center justify-between bg-muted rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${c.c}`} />
              <span className="text-[10px]">{c.n}</span>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500">Connected</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProToolsMock() {
  const tools = [
    "Agent Builder", "Model Playground", "Knowledge Base",
    "Webhooks", "API Access", "Analytics",
  ];
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="grid grid-cols-3 gap-2">
        {tools.map((t) => (
          <div key={t} className="border border-border rounded p-3 text-center hover:border-primary/30 transition-colors">
            <div className="w-6 h-6 rounded bg-[#ffe0c2]/10 flex items-center justify-center mx-auto mb-1.5">
              <BarChart3 className="w-3 h-3 text-[#ffe0c2]" />
            </div>
            <p className="text-[9px] font-medium">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionControlMock() {
  const cols = [
    { title: "To Do", cards: ["Research competitor pricing", "Draft FAQ section"] },
    { title: "In Progress", cards: ["Analyze support tickets", "Generate weekly report"] },
    { title: "Done", cards: ["Update knowledge base", "Process refund #456"] },
  ];
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="grid grid-cols-3 gap-2">
        {cols.map((col) => (
          <div key={col.title}>
            <p className="text-[9px] font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">{col.title}</p>
            <div className="space-y-1.5">
              {col.cards.map((c) => (
                <div key={c} className="bg-muted rounded p-2 border-l-2 border-primary">
                  <p className="text-[9px]">{c}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const mockups: Record<TabId, () => JSX.Element> = {
  overview: OverviewMock,
  chat: ChatMock,
  agents: AgentsMock,
  channels: ChannelsMock,
  pro: ProToolsMock,
  ultra: MissionControlMock,
};

/* ─── Product Tour Component ─── */

export default function ProductTour() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const activeItem = TOUR_TABS.find((t) => t.id === activeTab)!;
  const MockupComponent = mockups[activeTab];

  return (
    <section id="product-tour" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">Product Tour</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">See it in action</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore every part of the ClawHQ dashboard — from basic monitoring to full AI workforce management.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex justify-center gap-1 mb-12 flex-wrap">
          {TOUR_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + "-text"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="text-2xl font-bold mb-3">{activeItem.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {activeItem.description}
                </p>
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--cream)] text-[var(--cream-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <ArrowRight size={14} />
                </a>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + "-mockup"}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <MockupComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
