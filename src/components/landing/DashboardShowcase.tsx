"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const tabs = [
  {
    id: "chat",
    label: "Agent Chat",
    bullets: [
      "Talk to any agent directly",
      "Multi-turn conversations",
      "Session history",
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    bullets: [
      "Real-time CPU & RAM",
      "Health checks every 2 min",
      "Uptime tracking",
    ],
  },
  {
    id: "channels",
    label: "Channels",
    bullets: [
      "Connect in one click",
      "All 7 channels included",
      "Status monitoring",
    ],
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

function WindowChrome() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
      <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
      <span className="w-2 h-2 rounded-full bg-[#eab308]" />
      <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
    </div>
  );
}

function ChatMockup() {
  const agents = [
    { name: "Support Agent", online: true },
    { name: "Sales Assistant", online: true },
    { name: "Research Bot", online: false },
    { name: "Code Helper", online: true },
  ];

  const messages = [
    {
      role: "user" as const,
      text: "Can you summarize yesterday's support tickets?",
    },
    {
      role: "agent" as const,
      text: "Sure! Yesterday there were 12 tickets total: 8 resolved, 3 pending, and 1 escalated. The most common issue was API key configuration.",
    },
    { role: "user" as const, text: "What about the escalated one?" },
  ];

  return (
    <div className="flex h-[320px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0 bg-card border-r border-border p-3 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
          Agents
        </p>
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-muted/50"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                agent.online ? "bg-[#22c55e]" : "bg-muted-foreground/40"
              }`}
            />
            <span className="text-foreground/80 truncate">{agent.name}</span>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/20 text-foreground"
                  : "bg-muted text-foreground/80"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitoringMockup() {
  const stats = [
    { label: "CPU", value: "23%", bar: 23, color: "bg-primary" },
    { label: "RAM", value: "4.2 / 8 GB", bar: 52, color: "bg-primary" },
    { label: "Disk", value: "31 / 100 GB", bar: 31, color: "bg-primary" },
    { label: "Uptime", value: "99.9%", bar: 99.9, color: "bg-[#22c55e]" },
  ];

  return (
    <div className="p-4 space-y-5 h-[320px]">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-muted rounded-lg p-3 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-lg font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Resource Usage
        </p>
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="text-foreground/70">{stat.value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${stat.color}`}
                style={{ width: `${stat.bar}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelsMockup() {
  const channels = [
    { name: "Discord", connected: true },
    { name: "Slack", connected: true },
    { name: "Telegram", connected: false },
    { name: "WhatsApp", connected: true },
    { name: "Web Widget", connected: false },
  ];

  return (
    <div className="p-4 h-[320px]">
      <div className="space-y-2">
        {channels.map((channel) => (
          <div
            key={channel.name}
            className="flex items-center justify-between bg-muted rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  channel.connected
                    ? "bg-[#22c55e]"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span className="text-sm text-foreground">{channel.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  channel.connected
                    ? "bg-[#22c55e]/15 text-[#22c55e]"
                    : "bg-muted-foreground/10 text-muted-foreground"
                }`}
              >
                {channel.connected ? "Connected" : "Disconnected"}
              </span>
              {/* Toggle switch visual */}
              <div
                className={`w-8 h-4.5 rounded-full relative ${
                  channel.connected ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${
                    channel.connected ? "left-[calc(100%-16px)]" : "left-0.5"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const mockups: Record<TabId, () => JSX.Element> = {
  chat: ChatMockup,
  monitoring: MonitoringMockup,
  channels: ChannelsMockup,
};

export default function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("monitoring");

  const activeTabData = tabs.find((t) => t.id === activeTab)!;
  const MockupComponent = mockups[activeTab];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need, one dashboard
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage your agents, monitor performance, and connect channels
            — all from a single, clean interface.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bullets */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + "-bullets"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center gap-6 flex-wrap"
            >
              {activeTabData.bullets.map((bullet) => (
                <span
                  key={bullet}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {bullet}
                </span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dashboard mockup */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
          <WindowChrome />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MockupComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
