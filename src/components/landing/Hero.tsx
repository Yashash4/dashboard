"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease },
});

export default function Hero() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <section className="hero-gradient relative min-h-[100vh] flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Beam lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[20%] w-px h-[40vh] bg-gradient-to-b from-[var(--accent-border)] via-[var(--accent-subtle)] to-transparent" />
        <div className="absolute top-0 left-[80%] w-px h-[30vh] bg-gradient-to-b from-[var(--accent-subtle)] to-transparent" />
        <div className="absolute top-0 left-[50%] w-px h-[50vh] bg-gradient-to-b from-[var(--accent-border)] via-[var(--accent-subtle)] to-transparent" />
      </div>

      <div className="absolute inset-0 dot-grid opacity-40" />

      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[14px] font-medium text-[var(--text-secondary)] border border-[var(--accent-border)] bg-[var(--accent-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            No API keys. No per-token billing. No DevOps. From Agent Builder to Mission Control — 274+ features, one platform.
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[1.1] tracking-tight mb-6"
        >
          Build, deploy, and
          <br />
          manage AI agents.
          <br />
          <span className="font-serif-italic font-normal text-[var(--accent)]">
            One subscription.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.2)}
          className="text-lg md:text-xl text-[var(--text-secondary)] max-w-[580px] mx-auto mb-10 leading-relaxed"
        >
          Built on OpenClaw. Knowledge Base, Agent Builder,
          API, Webhooks, and Mission Control. Everything you need
          to operate AI agents at scale.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href={user ? "/vps" : "/pricing"}
            className="group flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[var(--cta)] text-[var(--cta-foreground)] text-[16px] font-semibold hover:opacity-90 transition-all shadow-[0_0_0_1px_var(--accent-border),0_4px_20px_rgba(0,0,0,0.3)]"
          >
            {user ? "Go to Dashboard" : "Get Started"}
            <ArrowRight
              size={15}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </a>
          <a
            href="#product-tour"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[16px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] transition-all w-full sm:w-auto"
          >
            <Play size={14} className="text-[var(--accent)]" />
            See it in action
          </a>
        </motion.div>

        {/* Trust signal */}
        <motion.p
          {...fadeUp(0.4)}
          className="text-[15px] text-[var(--text-tertiary)] mt-6"
        >
          Built on OpenClaw &middot; Your server, your data &middot; Deploy in minutes
        </motion.p>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease }}
          className="mt-16 md:mt-20 relative"
        >
          <div className="absolute -inset-10 bg-gradient-to-t from-[var(--accent-muted)] via-[var(--accent-subtle)] to-transparent rounded-3xl blur-3xl" />

          {/* Browser mockup */}
          <div className="relative rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-raised)] overflow-hidden shadow-[0_20px_80px_-20px_var(--accent-muted)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-[var(--bg-subtle)] text-[10px] text-[var(--text-tertiary)] font-mono">
                  dashboard.clawhq.tech
                </div>
              </div>
              <div className="w-12" />
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-[180px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-base)] p-3">
                <div className="flex items-center gap-2 px-2 mb-5">
                  <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[var(--accent-foreground)]">C</span>
                  </div>
                  <span className="text-[11px] font-semibold">ClawHQ</span>
                  <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-medium">Pro</span>
                </div>

                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest px-2 mb-2">Dashboard</p>
                {[
                  { name: "Overview", active: true },
                  { name: "VPS" },
                  { name: "Agents" },
                  { name: "Chat" },
                  { name: "Channels" },
                  { name: "Models" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-2 px-2 py-[6px] rounded-md text-[11px] mb-0.5 ${
                      item.active
                        ? "bg-[var(--accent-subtle)] text-[var(--text-primary)] font-medium"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {item.name}
                  </div>
                ))}

                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-widest px-2 mb-2 mt-4">Pro Tools</p>
                {["Agent Builder", "Knowledge Base", "Analytics", "API Access"].map((item) => (
                  <div key={item} className="flex items-center gap-2 px-2 py-[6px] rounded-md text-[11px] mb-0.5 text-[var(--tier-pro)]/60">
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-4 md:p-5 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[13px] font-semibold">Overview</p>
                    <p className="text-[9px] text-[var(--text-tertiary)]">Welcome back, Yash</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[var(--success)] animate-pulse" />
                      All systems operational
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "VPS", value: "Running", sub: "2 vCPU · 8GB", dot: true },
                    { label: "Model", value: "Kimi K2.5", sub: "128K context" },
                    { label: "Agents", value: "5 active", sub: "of 7 deployed" },
                    { label: "Channels", value: "7 / 7", sub: "All connected" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-base)] p-2.5">
                      <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{stat.label}</p>
                      <div className="flex items-center gap-1.5">
                        {stat.dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />}
                        <span className="text-[11px] font-semibold">{stat.value}</span>
                      </div>
                      <p className="text-[8px] text-[var(--text-tertiary)] mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Two-column: Chart + Activity */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
                  {/* Chart */}
                  <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-base)] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-medium">Resource Usage</p>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[8px] text-[var(--text-tertiary)]">
                          <span className="w-1.5 h-1.5 rounded-sm bg-[var(--accent)]" /> CPU
                        </span>
                        <span className="flex items-center gap-1 text-[8px] text-[var(--text-tertiary)]">
                          <span className="w-1.5 h-1.5 rounded-sm bg-[var(--tier-pro)]" /> RAM
                        </span>
                        <span className="flex items-center gap-1 text-[8px] text-[var(--text-tertiary)]">
                          <span className="w-1.5 h-1.5 rounded-sm bg-[var(--info)]" /> Disk
                        </span>
                      </div>
                    </div>
                    {/* Stacked bar chart */}
                    <div className="h-[100px] flex items-end gap-[2px]">
                      {[55,68,58,78,62,72,60,82,70,88,75,84,68,92,80,74,64,82,70,60,74,64,80,72,84,76,90,78,70,80].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm overflow-hidden flex flex-col-reverse" style={{ height: `${h}%` }}>
                          <div className="w-full bg-[var(--accent)]" style={{ height: "50%", opacity: 0.8 }} />
                          <div className="w-full bg-[var(--tier-pro)]" style={{ height: "35%", opacity: 0.65 }} />
                          <div className="w-full bg-[var(--info)]" style={{ height: "15%", opacity: 0.5 }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1 border-t border-[var(--border-primary)] pt-1">
                      <span className="text-[7px] text-[var(--text-tertiary)]">00:00</span>
                      <span className="text-[7px] text-[var(--text-tertiary)]">06:00</span>
                      <span className="text-[7px] text-[var(--text-tertiary)]">12:00</span>
                      <span className="text-[7px] text-[var(--text-tertiary)]">18:00</span>
                      <span className="text-[7px] text-[var(--text-tertiary)]">Now</span>
                    </div>
                  </div>

                  {/* Activity feed */}
                  <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-base)] p-3 hidden md:block">
                    <p className="text-[10px] font-medium mb-3">Recent Activity</p>
                    <div className="space-y-2.5">
                      {[
                        { action: "Agent deployed", detail: "Support Agent", time: "2m ago", color: "bg-[var(--success)]" },
                        { action: "Channel connected", detail: "WhatsApp", time: "15m ago", color: "bg-[var(--info)]" },
                        { action: "Model switched", detail: "→ Kimi K2.5", time: "1h ago", color: "bg-[var(--tier-pro)]" },
                        { action: "VPS restarted", detail: "Auto-recovery", time: "3h ago", color: "bg-[var(--warning)]" },
                        { action: "Agent deployed", detail: "Sales Agent", time: "5h ago", color: "bg-[var(--success)]" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-1 h-1 rounded-full ${item.color} mt-1.5 shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-[9px] text-[var(--text-primary)] leading-tight">{item.action}</p>
                            <p className="text-[8px] text-[var(--text-tertiary)]">{item.detail} · {item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
