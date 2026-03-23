"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, MessageSquare, Bot, Radio, BarChart3, Command } from "lucide-react";

const TABS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, title: "Everything at a glance", description: "VPS status, connected channels, deployed agents, and recent activity — all in one view. Health monitoring, onboarding checklist, and smart alerts keep you informed." },
  { id: "chat", label: "Chat", icon: MessageSquare, title: "Talk to your AI agents", description: "Professional chat with streaming responses, conversation history, file attachments, and code block rendering. Like ChatGPT — but for YOUR agents on YOUR server." },
  { id: "agents", label: "Agents", icon: Bot, title: "Deploy in one click", description: "7 pre-built agents ready to go — support, research, sales, writing, and more. Health monitoring, quick testing, and per-agent analytics." },
  { id: "channels", label: "Channels", icon: Radio, title: "Connect everywhere", description: "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — all channels included. Real-time connection testing and health monitoring." },
  { id: "pro", label: "Pro Tools", icon: BarChart3, title: "Built for builders", description: "Agent Builder, Model Playground, Knowledge Base, Webhooks, API with SDKs, Logs Explorer, Analytics, and Audit Log." },
  { id: "ultra", label: "Mission Control", icon: Command, title: "Command your AI workforce", description: "Kanban task boards, real-time agent monitoring, session traces, automation rules, and time tracking. The command center your AI agents deserve." },
] as const;

type TabId = (typeof TABS)[number]["id"];

function OverviewMock() {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] overflow-hidden">
      <div className="flex">
        <div className="w-36 border-r border-[var(--border-primary)] bg-[var(--bg-base)] p-3 hidden sm:block">
          <div className="flex items-center gap-1.5 mb-5">
            <div className="w-5 h-5 bg-[var(--accent-muted)] rounded flex items-center justify-center">
              <span className="text-[8px] font-bold text-[var(--accent)]">C</span>
            </div>
            <span className="text-[11px] font-semibold">ClawHQ</span>
          </div>
          {["Overview", "VPS", "Agents", "Chat", "Channels"].map((s, i) => (
            <div key={s} className={`px-2.5 py-1.5 rounded-lg text-[11px] mb-0.5 ${i === 0 ? "bg-[var(--accent-subtle)] text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)]"}`}>{s}</div>
          ))}
        </div>
        <div className="flex-1 p-4 md:p-5">
          <p className="text-[12px] font-semibold mb-4">Overview</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {[{ l: "VPS", v: "Running", dot: true }, { l: "Plan", v: "Starter" }, { l: "Model", v: "Kimi K2.5" }, { l: "Uptime", v: "99.9%" }].map((s) => (
              <div key={s.l} className="border border-[var(--border-primary)] rounded-lg p-2.5">
                <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{s.l}</p>
                <div className="flex items-center gap-1.5">
                  {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />}
                  <span className="text-[11px] font-medium">{s.v}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ l: "Channels", v: "7" }, { l: "Agents", v: "5" }, { l: "Messages", v: "2.4k" }].map((s) => (
              <div key={s.l} className="border border-[var(--border-primary)] rounded-lg p-2.5">
                <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">{s.l}</p>
                <p className="text-[14px] font-bold mt-0.5">{s.v}</p>
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
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border-primary)]">
        <div className="w-6 h-6 rounded-full bg-[var(--accent-muted)] flex items-center justify-center"><Bot className="w-3 h-3 text-[var(--accent)]" /></div>
        <div><p className="text-[11px] font-medium">Support Agent</p><p className="text-[9px] text-[var(--success)]">Online</p></div>
      </div>
      <div className="p-4 space-y-3 h-44 flex flex-col justify-end">
        <div className="flex justify-end"><div className="bg-[var(--accent-muted)] rounded-xl rounded-br-sm px-3.5 py-2 text-[11px] max-w-[70%]">Where is my order #12345?</div></div>
        <div className="flex justify-start"><div className="bg-[var(--bg-subtle)] rounded-xl rounded-bl-sm px-3.5 py-2 text-[11px] max-w-[70%] text-[var(--text-secondary)]">Your order was shipped on March 10 and arrives by March 17. Want the tracking link?</div></div>
      </div>
      <div className="px-4 py-2.5 border-t border-[var(--border-primary)]"><div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-tertiary)]">Type a message...</div></div>
    </div>
  );
}

function AgentsMock() {
  const agents = [
    { name: "Support", color: "bg-[var(--info)]/15 text-[var(--info)]" },
    { name: "Research", color: "bg-[var(--tier-pro)]/15 text-[var(--tier-pro)]" },
    { name: "Writer", color: "bg-[var(--success)]/15 text-[var(--success)]" },
    { name: "Sales", color: "bg-[var(--tier-ultra)]/15 text-[var(--tier-ultra)]" },
    { name: "Data", color: "bg-[var(--accent)]/15 text-[var(--accent)]" },
    { name: "Reviewer", color: "bg-[var(--error)]/15 text-[var(--error)]" },
  ];
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-4">
      <div className="grid grid-cols-3 gap-2.5">
        {agents.map((a) => (
          <div key={a.name} className="border border-[var(--border-primary)] rounded-xl p-3 hover:border-[var(--accent-border)] transition-colors">
            <div className={`w-7 h-7 rounded-lg ${a.color} flex items-center justify-center mb-2`}><Bot className="w-3.5 h-3.5" /></div>
            <p className="text-[11px] font-medium">{a.name}</p>
            <span className="text-[9px] text-[var(--success)]">Active</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelsMock() {
  const ch = [
    { n: "WhatsApp", c: "bg-[var(--success)]" },
    { n: "Telegram", c: "bg-[var(--info)]" },
    { n: "Discord", c: "bg-[var(--tier-pro)]" },
    { n: "Slack", c: "bg-[var(--tier-pro)]" },
    { n: "Teams", c: "bg-[var(--info)]" },
    { n: "Signal", c: "bg-[var(--accent)]" },
    { n: "Webchat", c: "bg-[var(--tier-ultra)]" },
  ];
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-4">
      <div className="space-y-2">
        {ch.map((c) => (
          <div key={c.n} className="flex items-center justify-between bg-[var(--bg-subtle)] rounded-lg px-3.5 py-2.5">
            <div className="flex items-center gap-2.5"><span className={`w-2 h-2 rounded-full ${c.c}`} /><span className="text-[11px]">{c.n}</span></div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)]">Connected</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProToolsMock() {
  const tools = ["Agent Builder", "Playground", "Knowledge Base", "Webhooks", "API Access", "Analytics"];
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-4">
      <div className="grid grid-cols-3 gap-2.5">
        {tools.map((t) => (
          <div key={t} className="border border-[var(--border-primary)] rounded-xl p-3.5 text-center hover:border-[var(--tier-pro)]/20 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-[var(--tier-pro)]/10 flex items-center justify-center mx-auto mb-2"><BarChart3 className="w-3.5 h-3.5 text-[var(--tier-pro)]" /></div>
            <p className="text-[10px] font-medium">{t}</p>
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
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-4">
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col) => (
          <div key={col.title}>
            <p className="text-[10px] font-medium mb-2 text-[var(--text-tertiary)] uppercase tracking-wider">{col.title}</p>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div key={c} className="bg-[var(--bg-subtle)] rounded-lg p-2.5 border-l-2 border-[var(--accent)]">
                  <p className="text-[10px] leading-snug">{c}</p>
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
  overview: OverviewMock, chat: ChatMock, agents: AgentsMock,
  channels: ChannelsMock, pro: ProToolsMock, ultra: MissionControlMock,
};

export default function ProductTour() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const activeItem = TABS.find((t) => t.id === activeTab)!;
  const MockupComponent = mockups[activeTab];

  return (
    <section id="product-tour" className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <p className="text-[13px] text-[var(--accent)] font-medium mb-4">Product Tour</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight mb-4">See it in action</h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-[15px]">Explore every part of the ClawHQ dashboard.</p>
        </motion.div>

        <div className="flex justify-start md:justify-center gap-1 mb-10 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:pb-0 scrollbar-none" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button key={tab.id} role="tab" aria-selected={isSelected} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition-all whitespace-nowrap ${
                  isSelected ? "bg-[var(--cta)] text-[var(--cta-foreground)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]"
                }`}
              >
                <Icon size={14} />{tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + "-text"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">{activeItem.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-[15px]">{activeItem.description}</p>
                <a href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cta)] text-[var(--cta-foreground)] text-[13px] font-medium hover:opacity-90 transition-opacity">Get Started</a>
              </motion.div>
            </AnimatePresence>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + "-mockup"} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <MockupComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
