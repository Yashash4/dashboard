"use client";

import { motion } from "framer-motion";
import { X, Check, Terminal, CreditCard, AlertTriangle, Settings, Clock, Shield } from "lucide-react";

export default function Comparison() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[15px] text-[var(--accent)] font-medium mb-4">Before &amp; After</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight mb-5">
            Stop managing infrastructure.
            <br />
            <span className="font-serif-italic font-normal text-[var(--text-secondary)]">Start shipping.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ═══ WITHOUT CLAWHQ ═══ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-[var(--error)]/20 bg-[var(--bg-raised)] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[var(--error)]/10 bg-[var(--error)]/[0.03]">
              <div className="flex items-center gap-2">
                <X size={18} className="text-[var(--error)]" />
                <h3 className="text-lg font-bold text-[var(--error)]">Without ClawHQ</h3>
              </div>
              <p className="text-[15px] text-[var(--text-tertiary)] mt-1">What self-hosting actually looks like</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Terminal mess */}
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-subtle)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--error)]/50" />
                  <div className="w-2 h-2 rounded-full bg-[var(--warning)]/50" />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]/30" />
                  <span className="text-[9px] text-[var(--text-tertiary)] ml-2 font-mono">terminal</span>
                </div>
                <div className="p-3 font-mono text-[10px] space-y-1 text-[var(--text-tertiary)]">
                  <p>$ sudo apt install nginx certbot docker.io</p>
                  <p>$ sudo certbot --nginx -d mysite.com</p>
                  <p className="text-[var(--error)]">ERROR: Could not bind to port 443</p>
                  <p>$ sudo kill -9 $(lsof -t -i:443)</p>
                  <p>$ docker pull openclaw/openclaw:latest</p>
                  <p>$ docker-compose up -d</p>
                  <p className="text-[var(--warning)]">WARNING: gateway not responding on :18789</p>
                  <p>$ sudo nano /etc/nginx/sites-available/default</p>
                  <p className="text-[var(--error)]">ERROR: SSL handshake failed</p>
                  <p>$ sudo systemctl restart nginx</p>
                  <p className="text-[var(--error)]">ERROR: trusted-proxy auth mode not configured</p>
                  <p className="text-[var(--text-tertiary)]">$ # 3 hours later...</p>
                </div>
              </div>

              {/* Pain points */}
              <div className="space-y-3">
                {[
                  { icon: Terminal, text: "Hours debugging Docker, nginx, SSL, DNS, firewall configs" },
                  { icon: CreditCard, text: "VPS $20 + AI API $40+ + channel plugins = $80+/mo and growing" },
                  { icon: AlertTriangle, text: "Server crashes at 3am — nobody monitoring, no auto-restart" },
                  { icon: Settings, text: "Every update requires SSH, manual config, and crossed fingers" },
                  { icon: Clock, text: "Your time is the most expensive cost — and it never stops" },
                ].map((pain) => {
                  const Icon = pain.icon;
                  return (
                    <div key={pain.text} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-[var(--error)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={12} className="text-[var(--error)]" />
                      </div>
                      <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{pain.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ═══ WITH CLAWHQ ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-[var(--accent-border)] bg-[var(--bg-raised)] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[var(--accent-border)] bg-[var(--accent-subtle)]">
              <div className="flex items-center gap-2">
                <Check size={18} className="text-[var(--accent)]" />
                <h3 className="text-lg font-bold text-[var(--accent)]">With ClawHQ</h3>
              </div>
              <p className="text-[15px] text-[var(--text-tertiary)] mt-1">What it actually looks like</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Clean dashboard — rich and tall */}
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-subtle)]">
                  <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                  <div className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2 h-2 rounded-full bg-[#28c840]" />
                  <span className="text-[9px] text-[var(--text-tertiary)] ml-2 font-mono">dashboard.clawhq.tech</span>
                </div>
                <div className="flex">
                  {/* Mini sidebar */}
                  <div className="w-24 border-r border-[var(--border-subtle)] p-2 hidden sm:block">
                    <div className="flex items-center gap-1.5 px-1.5 mb-3">
                      <div className="w-4 h-4 rounded bg-[var(--accent)] flex items-center justify-center">
                        <span className="text-[7px] font-bold text-[var(--accent-foreground)]">C</span>
                      </div>
                      <span className="text-[8px] font-semibold">ClawHQ</span>
                    </div>
                    {["Overview", "VPS", "Agents", "Chat", "Channels", "Models", "Store"].map((s, i) => (
                      <div key={s} className={`px-1.5 py-1 rounded text-[8px] mb-0.5 ${i === 0 ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>{s}</div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                      <p className="text-[6px] text-[var(--text-tertiary)] uppercase tracking-wider px-1.5 mb-1">Pro Tools</p>
                      {["Agent Builder", "Analytics", "API Access"].map((s) => (
                        <div key={s} className="px-1.5 py-1 rounded text-[8px] mb-0.5 text-[var(--tier-pro)]/50">{s}</div>
                      ))}
                    </div>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold">Overview</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
                        All systems operational
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[
                        { l: "VPS", v: "Running", dot: true },
                        { l: "Model", v: "Kimi K2.5" },
                        { l: "Agents", v: "5 active" },
                        { l: "Channels", v: "7/7" },
                      ].map((s) => (
                        <div key={s.l} className="border border-[var(--border-subtle)] rounded p-1.5">
                          <p className="text-[6px] text-[var(--text-tertiary)]">{s.l}</p>
                          <div className="flex items-center gap-1">
                            {s.dot && <span className="w-1 h-1 rounded-full bg-[var(--success)]" />}
                            <span className="text-[9px] font-semibold">{s.v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Chart */}
                    <div className="border border-[var(--border-subtle)] rounded p-2 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[8px] text-[var(--text-tertiary)]">CPU & RAM (24h)</p>
                        <div className="flex gap-2">
                          <span className="flex items-center gap-0.5 text-[6px] text-[var(--text-tertiary)]"><span className="w-1 h-1 rounded-full bg-[var(--accent)]" />CPU</span>
                          <span className="flex items-center gap-0.5 text-[6px] text-[var(--text-tertiary)]"><span className="w-1 h-1 rounded-full bg-[var(--success)]" />RAM</span>
                        </div>
                      </div>
                      <div className="h-16 flex items-end gap-[3px]">
                        {[45,55,50,65,60,70,55,75,65,80,70,75,65,85,75,70,60,78,68,72].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 2 === 0 ? "var(--accent)" : "#34d399", opacity: 0.7 }}>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Recent activity */}
                    <div className="border border-[var(--border-subtle)] rounded p-2">
                      <p className="text-[8px] text-[var(--text-tertiary)] mb-1.5">Recent Activity</p>
                      <div className="space-y-1.5">
                        {[
                          { dot: "bg-[var(--success)]", text: "Agent deployed — Support Agent", time: "2m ago" },
                          { dot: "bg-[var(--info)]", text: "Channel connected — WhatsApp", time: "15m ago" },
                          { dot: "bg-[var(--tier-pro)]", text: "Model switched → Kimi K2.5", time: "1h ago" },
                        ].map((a, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className={`w-1 h-1 rounded-full ${a.dot} shrink-0`} />
                            <span className="text-[8px] text-[var(--text-secondary)] flex-1">{a.text}</span>
                            <span className="text-[7px] text-[var(--text-tertiary)]">{a.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {[
                  { icon: Clock, text: "Deploy in minutes — we handle DNS, SSL, nginx, OpenClaw, everything" },
                  { icon: CreditCard, text: "One price, one bill — AI models, channels, VPS, dashboard all included" },
                  { icon: Shield, text: "Health checks every 2 min, auto-restart on crash, 99.9% uptime" },
                  { icon: Settings, text: "Updates, backups, scaling — managed by us, zero maintenance for you" },
                  { icon: Terminal, text: "Full API access, webhooks, Knowledge Base — build and integrate anything" },
                ].map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.text} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-[var(--accent-muted)] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={12} className="text-[var(--accent)]" />
                      </div>
                      <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{benefit.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
