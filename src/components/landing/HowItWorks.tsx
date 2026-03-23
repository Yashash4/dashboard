"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* ═══ Outer Box ═══ */}
        <div className="bg-[var(--bg-raised)] border-l-2 border-t-2 border-[var(--accent)] pl-5 sm:pl-8 pt-5 sm:pt-8 rounded-tl-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-5 sm:p-8"
          >
            <p className="text-[15px] text-[var(--accent)] font-medium mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Deploy in minutes.{" "}
              <span className="font-serif-italic font-normal text-[var(--text-secondary)]">Seriously.</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl">
              You can get started with any plan in minutes. As you grow, connect more channels,
              deploy more agents, upgrade your server, or build custom agents with AI.
            </p>
          </motion.div>

          {/* ═══ Box 1: Pick a Plan ═══ */}
          <div className="border-l-2 border-t-2 border-[var(--accent)] pl-5 sm:pl-8 pt-5 sm:pt-8 rounded-tl-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-5 sm:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left: Text */}
                <div>
                  <span className="text-[13px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-2.5 py-1 rounded mb-4 inline-block">01</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--accent)] mb-4">
                    Pick a plan
                  </h3>
                  <p className="text-[17px] text-[var(--text-secondary)] leading-relaxed mb-6">
                    Every plan includes a dedicated server, AI models, all 7 messaging
                    channels, and a full management dashboard. No hidden add-ons.
                    Start with Starter and upgrade anytime.
                  </p>
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-2 text-[15px] border border-[var(--accent-border)] rounded-lg px-5 py-2.5 text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                  >
                    See pricing &rarr;
                  </a>
                </div>

                {/* Right: Plan cards */}
                <div className="space-y-3">
                  {[
                    { name: "Starter", price: "$59", desc: "Dedicated VPS, AI models, 7 channels, agent store, monitoring", specs: "2 vCPU · 8GB RAM · 100GB NVMe", highlight: false },
                    { name: "Pro", price: "$129", desc: "Agent Builder, Knowledge Base, API, Webhooks, Analytics, Audit Log", specs: "4 vCPU · 16GB RAM · 200GB NVMe", highlight: true },
                    { name: "Ultra", price: "$350", desc: "Mission Control, Task Board, Agent Roster, Session Tracker, Events", specs: "8 vCPU · 32GB RAM · 400GB NVMe", highlight: false },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${
                        plan.highlight
                          ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                          : "border-[var(--border-primary)] bg-[var(--bg-base)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[17px] font-semibold">{plan.name}</span>
                          {plan.highlight && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium">Popular</span>
                          )}
                        </div>
                        <p className="text-[14px] text-[var(--text-secondary)] mb-1">{plan.desc}</p>
                        <p className="text-[13px] text-[var(--text-tertiary)] font-mono">{plan.specs}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold">{plan.price}</p>
                        <p className="text-[13px] text-[var(--text-tertiary)]">/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ═══ Box 2: We Deploy Everything ═══ */}
            <div className="border-l-2 border-t-2 border-[var(--accent)] pl-5 sm:pl-8 pt-5 sm:pt-8 rounded-tl-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="p-5 sm:p-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Left: Text */}
                  <div>
                    <span className="text-[13px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-2.5 py-1 rounded mb-4 inline-block">02</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-[var(--accent)] mb-4">
                      We deploy everything
                    </h3>
                    <p className="text-[17px] text-[var(--text-secondary)] leading-relaxed mb-6">
                      Our automated pipeline provisions your dedicated VPS, installs OpenClaw,
                      configures DNS + SSL, sets up the AI gateway, and connects your dashboard.
                      12 steps, fully automated. You don&apos;t touch a terminal.
                    </p>
                    <a
                      href="#features"
                      className="inline-flex items-center gap-2 text-[15px] border border-[var(--accent-border)] rounded-lg px-5 py-2.5 text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                    >
                      View what&apos;s included &rarr;
                    </a>
                  </div>

                  {/* Right: Terminal / provisioning output */}
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-2 font-mono">Provisioning Pipeline</span>
                    </div>
                    <div className="p-4 font-mono text-[11px] space-y-2 text-[var(--text-secondary)]">
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 1/12 — Cloudflare DNS record created</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 2/12 — Firewall ports opened (22, 80, 443)</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 3/12 — System packages installed</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 4/12 — OpenClaw gateway installed</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 5/12 — Nginx reverse proxy configured</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 6/12 — SSL certificate generated</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 7/12 — Systemd service created</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 8/12 — OpenClaw installed</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 9/12 — AI model gateway initialized</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 10/12 — Embedding service started</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 11/12 — Health checks passed</p>
                      <p><span className="text-[var(--success)]">&#10003;</span> Step 12/12 — Dashboard live at <span className="text-[var(--accent)]">demo.clawhq.tech</span></p>
                      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                        <p className="text-[var(--success)] font-semibold">&#10003; Provisioning complete — all systems operational</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ═══ Box 3: Connect Your Channels ═══ */}
              <div className="border-l-2 border-t-2 border-[var(--accent)] pl-5 sm:pl-8 pt-5 sm:pt-8 rounded-tl-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-5 sm:p-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left: Text */}
                    <div>
                      <span className="text-[13px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-2.5 py-1 rounded mb-4 inline-block">03</span>
                      <h3 className="text-xl sm:text-2xl font-bold text-[var(--accent)] mb-4">
                        Connect your channels
                      </h3>
                      <p className="text-[17px] text-[var(--text-secondary)] leading-relaxed mb-6">
                        WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, or Webchat.
                        Connect any or all from your dashboard in one click. Your AI agents
                        are instantly available wherever your users are.
                      </p>
                      <a
                        href="#features"
                        className="inline-flex items-center gap-2 text-[15px] border border-[var(--accent-border)] rounded-lg px-5 py-2.5 text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                      >
                        Explore channels &rarr;
                      </a>
                    </div>

                    {/* Right: Channel dashboard mockup */}
                    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                        <p className="text-[12px] font-semibold">My Channels</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">6 of 7 connected</p>
                      </div>
                      <div className="p-3 space-y-2">
                        {[
                          { name: "WhatsApp", status: "connected", badge: "Primary", health: "Healthy" },
                          { name: "Telegram", status: "connected", health: "Healthy" },
                          { name: "Discord", status: "connected", health: "Healthy" },
                          { name: "Slack", status: "connected", health: "Healthy" },
                          { name: "Microsoft Teams", status: "connected", health: "Healthy" },
                          { name: "Signal", status: "setup", health: null },
                          { name: "Webchat", status: "connected", health: "Healthy" },
                        ].map((ch) => (
                          <div key={ch.name} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px]">{ch.name}</span>
                              {ch.badge && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)]">{ch.badge}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {ch.health && (
                                <span className="text-[9px] text-[var(--success)] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                                  {ch.health}
                                </span>
                              )}
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                ch.status === "connected"
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : "bg-[var(--warning)]/10 text-[var(--warning)]"
                              }`}>
                                {ch.status === "connected" ? "Connected" : "Requires Setup"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ═══ Box 4: You're Live ═══ */}
                <div className="border-l-2 border-t-2 border-[var(--accent)] pl-5 sm:pl-8 pt-5 sm:pt-8 rounded-tl-xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="p-5 sm:p-8"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                      {/* Left: Text */}
                      <div>
                        <span className="text-[13px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-2.5 py-1 rounded mb-4 inline-block">04</span>
                        <h3 className="text-xl sm:text-2xl font-bold text-[var(--accent)] mb-4">
                          You&apos;re live
                        </h3>
                        <p className="text-[17px] text-[var(--text-secondary)] leading-relaxed mb-6">
                          Your agents are running on dedicated hardware. Deploy more from the
                          agent store, monitor everything in real-time, connect via API and
                          webhooks, build custom agents, and scale up whenever you&apos;re ready.
                          Full control from day one.
                        </p>
                        <a
                          href="#pricing"
                          className="inline-flex items-center gap-2 text-[15px] bg-[var(--cta)] text-[var(--cta-foreground)] rounded-lg px-5 py-2.5 font-medium hover:opacity-90 transition-opacity"
                        >
                          Get started &rarr;
                        </a>
                      </div>

                      {/* Right: API code example */}
                      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] overflow-hidden">
                        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--border-subtle)]">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                          <span className="text-[10px] text-[var(--text-tertiary)] ml-2 font-mono">API Example — Send a message</span>
                        </div>
                        <div className="p-4 font-mono text-[11px] leading-relaxed">
                          <p className="text-[var(--text-tertiary)]"># Send a message to your AI agent</p>
                          <p className="mt-2">
                            <span className="text-[var(--success)]">curl</span>
                            <span className="text-[var(--text-secondary)]"> -X POST \</span>
                          </p>
                          <p className="pl-4 text-[var(--text-secondary)]">https://demo.clawhq.tech/api/v1/chat \</p>
                          <p className="pl-4 text-[var(--text-secondary)]">-H &quot;Authorization: Bearer <span className="text-[var(--accent)]">clw_your_api_key</span>&quot; \</p>
                          <p className="pl-4 text-[var(--text-secondary)]">-H &quot;Content-Type: application/json&quot; \</p>
                          <p className="pl-4 text-[var(--text-secondary)]">-d &apos;{'{'}</p>
                          <p className="pl-8 text-[var(--text-secondary)]">&quot;message&quot;: &quot;<span className="text-[var(--text-primary)]">How do I configure WhatsApp?</span>&quot;,</p>
                          <p className="pl-8 text-[var(--text-secondary)]">&quot;agent&quot;: &quot;<span className="text-[var(--text-primary)]">support-agent</span>&quot;,</p>
                          <p className="pl-8 text-[var(--text-secondary)]">&quot;stream&quot;: <span className="text-[var(--accent)]">true</span></p>
                          <p className="pl-4 text-[var(--text-secondary)]">{'}'}&apos;</p>

                          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <p className="text-[var(--text-tertiary)] mb-2"># Response (streaming)</p>
                            <p className="text-[var(--text-secondary)]">{'{'}</p>
                            <p className="pl-4 text-[var(--text-secondary)]">&quot;id&quot;: &quot;<span className="text-[var(--text-tertiary)]">msg_a1b2c3d4</span>&quot;,</p>
                            <p className="pl-4 text-[var(--text-secondary)]">&quot;role&quot;: &quot;<span className="text-[var(--accent)]">assistant</span>&quot;,</p>
                            <p className="pl-4 text-[var(--text-secondary)]">&quot;content&quot;: &quot;<span className="text-[var(--text-primary)]">To configure WhatsApp, go to...</span>&quot;,</p>
                            <p className="pl-4 text-[var(--text-secondary)]">&quot;model&quot;: &quot;<span className="text-[var(--text-tertiary)]">kimi-k2.5</span>&quot;,</p>
                            <p className="pl-4 text-[var(--text-secondary)]">&quot;tokens&quot;: <span className="text-[var(--accent)]">245</span></p>
                            <p className="text-[var(--text-secondary)]">{'}'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
