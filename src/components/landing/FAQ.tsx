"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Cpu, MessageSquare, Globe, Wand2, Shield,
  Code2, Command, Server, Clock, CreditCard, ArrowUpDown, Activity,
  Bot, Check,
} from "lucide-react";

const faqs = [
  {
    q: "What AI models are included?",
    a: "Every plan includes production-ready open-source AI models. No API keys needed. No per-token billing. Pro and Ultra plans get access to the full model library with instant switching.",
    icon: Cpu,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Available Models</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {["Kimi K2.5", "MiniMax M2.7", "DeepSeek V3", "Llama 4", "Qwen 3", "Mistral"].map((m) => (
            <span key={m} className="px-3 py-1.5 text-[13px] rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-border)] font-medium">{m}</span>
          ))}
        </div>
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">What you get</p>
        <div className="space-y-2">
          {["No API keys to manage", "No per-token billing — flat rate", "Auto-fallback between models", "Instant model switching on Pro/Ultra", "New models added regularly"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[14px]">
              <Check size={14} className="text-[var(--success)] shrink-0" />
              <span className="text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "What messaging channels are supported?",
    a: "ClawHQ supports 7 channels — all included on every plan at no extra cost. Connect any or all from your dashboard in one click.",
    icon: MessageSquare,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">All 7 Channels</p>
        <div className="space-y-2 mb-6">
          {[
            { name: "WhatsApp", status: "Self-service" },
            { name: "Telegram", status: "Self-service" },
            { name: "Discord", status: "Self-service" },
            { name: "Slack", status: "Self-service" },
            { name: "Microsoft Teams", status: "Self-service" },
            { name: "Signal", status: "Team setup" },
            { name: "Webchat", status: "Self-service" },
          ].map((ch) => (
            <div key={ch.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                <span className="text-[13px]">{ch.name}</span>
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)]">{ch.status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Every plan includes custom domain support with free auto-renewing SSL certificates. Point your domain to your ClawHQ instance and we handle the rest.",
    icon: Globe,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">How it works</p>
        <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)] p-4 font-mono text-[12px] mb-4">
          <p className="text-[var(--text-tertiary)] mb-2"># Point your domain</p>
          <p className="text-[var(--text-primary)]">yourdomain.com <span className="text-[var(--accent)]">→</span> clawhq.tech</p>
          <p className="text-[var(--text-tertiary)] mt-3 mb-2"># We handle the rest</p>
          <p className="text-[var(--success)]">✓ Cloudflare DNS configured automatically</p>
          <p className="text-[var(--success)]">✓ SSL certificate generated (Let&apos;s Encrypt)</p>
          <p className="text-[var(--success)]">✓ Auto-renewal — never expires</p>
          <p className="text-[var(--success)]">✓ HTTPS enforced on all routes</p>
        </div>
        <div className="space-y-2">
          {["Up to 3 custom domains on Starter", "Unlimited domains on Pro/Ultra", "No extra cost — included in every plan"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px]">
              <Check size={14} className="text-[var(--success)] shrink-0" />
              <span className="text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "How does the Agent Builder work?",
    a: "Available on Pro and above. Two modes: AI-assisted (describe what you want) or manual (full control). Deploy in one click.",
    icon: Wand2,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Build Flow</p>
        <div className="space-y-2 mb-5">
          {[
            { step: "1", title: "Describe your agent", desc: "Tell AI what you need or use the manual form" },
            { step: "2", title: "AI generates config", desc: "System prompt, personality, tools, model selection" },
            { step: "3", title: "Review & customize", desc: "Edit anything — name, behavior, fallback model" },
            { step: "4", title: "One-click deploy", desc: "Agent goes live on your VPS instantly" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{s.step}</span>
              <div>
                <p className="text-[13px] font-medium">{s.title}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-tertiary)]">Available on Pro ($129/mo) and Ultra ($350/mo)</p>
      </div>
    ),
  },
  {
    q: "Is my data secure?",
    a: "Your data stays on YOUR dedicated VPS. We don't access your conversations, documents, knowledge base, or agent configurations. VPS credentials are encrypted at rest.",
    icon: Shield,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Security Features</p>
        <div className="space-y-2">
          {[
            "All data stays on your dedicated VPS",
            "We never access your conversations",
            "Documents and KB are yours only",
            "VPS credentials encrypted at rest",
            "Isolated infrastructure per customer",
            "No shared resources or data mixing",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <Shield size={13} className="text-[var(--success)] shrink-0" />
              <span className="text-[13px] text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "Can I access my agents via API?",
    a: "Pro plan and above includes full REST API access with SSE streaming, Python and JavaScript SDKs. Build anything on top of your agents.",
    icon: Code2,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">API Endpoints</p>
        <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)] p-4 font-mono text-[12px] mb-4 space-y-2.5">
          <div><span className="text-[var(--accent)]">POST</span> <span className="text-[var(--text-secondary)]">/api/v1/chat</span> <span className="text-[var(--text-tertiary)]">— Send message</span></div>
          <div><span className="text-[var(--accent)]">GET</span>  <span className="text-[var(--text-secondary)]">/api/v1/chat?stream=true</span> <span className="text-[var(--text-tertiary)]">— SSE streaming</span></div>
          <div><span className="text-[var(--accent)]">GET</span>  <span className="text-[var(--text-secondary)]">/api/v1/agents</span> <span className="text-[var(--text-tertiary)]">— List agents</span></div>
          <div><span className="text-[var(--accent)]">GET</span>  <span className="text-[var(--text-secondary)]">/api/v1/threads</span> <span className="text-[var(--text-tertiary)]">— Conversations</span></div>
          <div><span className="text-[var(--accent)]">POST</span> <span className="text-[var(--text-secondary)]">/api/v1/files</span> <span className="text-[var(--text-tertiary)]">— Upload files</span></div>
          <div><span className="text-[var(--accent)]">GET</span>  <span className="text-[var(--text-secondary)]">/api/v1/usage</span> <span className="text-[var(--text-tertiary)]">— Usage analytics</span></div>
        </div>
        <div className="space-y-2">
          {["SDKs for Python, JavaScript, cURL", "Bearer token auth (clw_* keys)", "Webhooks with 9 event types", "Batch processing support"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px]">
              <Check size={14} className="text-[var(--success)] shrink-0" />
              <span className="text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "What's Mission Control?",
    a: "The Ultra-exclusive command center for managing your entire AI workforce. Think of it as a project management tool built specifically for AI agents.",
    icon: Command,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">5 Integrated Components</p>
        <div className="space-y-2 mb-5">
          {[
            { name: "Task Board", desc: "Kanban with drag-drop, priorities, dependencies, automation rules" },
            { name: "Agent Roster", desc: "Live status, capacity, performance metrics, start/stop/restart" },
            { name: "Event Feed", desc: "Real-time SSE stream of every action, error, and state change" },
            { name: "Session Tracker", desc: "Execution traces with step-by-step timeline and token usage" },
            { name: "Overview Dashboard", desc: "Active agents, pending tasks, completion rates, resolution time" },
          ].map((item) => (
            <div key={item.name} className="px-3 py-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <p className="text-[13px] font-medium">{item.name}</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-tertiary)]">Exclusive to Ultra ($350/mo)</p>
      </div>
    ),
  },
  {
    q: "Is this shared hosting?",
    a: "No. Every ClawHQ instance runs on a dedicated server. Your CPU, RAM, and storage are guaranteed and not shared with any other customer.",
    icon: Server,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Dedicated Resources per Plan</p>
        <div className="space-y-2 mb-5">
          {[
            { plan: "Starter", cpu: "2 vCPU", ram: "8 GB", storage: "100 GB", bandwidth: "8 TB" },
            { plan: "Pro", cpu: "4 vCPU", ram: "16 GB", storage: "200 GB", bandwidth: "16 TB" },
            { plan: "Ultra", cpu: "8 vCPU", ram: "32 GB", storage: "400 GB", bandwidth: "32 TB" },
          ].map((p) => (
            <div key={p.plan} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <span className="text-[13px] font-medium w-16">{p.plan}</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">{p.cpu}</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">{p.ram}</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">{p.storage}</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">{p.bandwidth}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {["Not shared with anyone", "Guaranteed resources", "Real-time monitoring included"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px]">
              <Check size={14} className="text-[var(--success)] shrink-0" />
              <span className="text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "How long does setup take?",
    a: "Your instance is provisioned in minutes. Our 12-step automated pipeline handles everything from DNS to health checks.",
    icon: Clock,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">12-Step Pipeline</p>
        <div className="space-y-1.5 mb-4">
          {[
            "Cloudflare DNS record",
            "Firewall ports opened",
            "System packages installed",
            "OpenClaw gateway installed",
            "Nginx reverse proxy configured",
            "SSL certificate generated",
            "Systemd service created",
            "OpenClaw installed",
            "AI model gateway initialized",
            "Embedding service started",
            "Health checks passed",
            "Dashboard live",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <Check size={12} className="text-[var(--success)] shrink-0" />
              <span className="text-[12px] text-[var(--text-secondary)]">{step}</span>
              <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">Step {i + 1}</span>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--success)]" style={{ width: "100%" }} />
        </div>
        <p className="text-[11px] text-[var(--success)] mt-1 text-center">All steps complete — your instance is live</p>
      </div>
    ),
  },
  {
    q: "Are there any hidden fees?",
    a: "No. Your plan price includes everything. One bill, one price. What you see is what you pay.",
    icon: CreditCard,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Everything Included</p>
        <div className="space-y-2">
          {[
            "Dedicated VPS hosting",
            "AI models — no API keys",
            "All 7 messaging channels",
            "Full management dashboard",
            "Updates and backups",
            "SSL certificates and DNS",
            "Health monitoring and auto-restart",
            "Support with attachments",
          ].map((item) => (
            <div key={item} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)] shrink-0" />
                <span className="text-[13px] text-[var(--text-secondary)]">{item}</span>
              </div>
              <span className="text-[var(--accent)] text-[11px]">Included</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "Can I upgrade or downgrade?",
    a: "Yes. Upgrade anytime from your dashboard — changes take effect immediately. Downgrade takes effect at the end of your billing cycle. No migration, no downtime.",
    icon: ArrowUpDown,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Seamless Tier Changes</p>
        <div className="space-y-3 mb-5">
          {[
            { from: "Starter $59", to: "Pro $129", label: "Upgrade", effect: "Instant — Pro tools unlock immediately" },
            { from: "Pro $129", to: "Ultra $350", label: "Upgrade", effect: "Instant — Mission Control activates" },
            { from: "Ultra $350", to: "Pro $129", label: "Downgrade", effect: "End of billing cycle" },
          ].map((change) => (
            <div key={change.from + change.to} className="px-3 py-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] text-[var(--text-tertiary)]">{change.from}</span>
                <span className="text-[var(--accent)]">→</span>
                <span className="text-[12px] font-medium">{change.to}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${change.label === "Upgrade" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--warning)]/10 text-[var(--warning)]"}`}>{change.label}</span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">{change.effect}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {["All channels, agents, and data carry over", "No migration needed", "Zero downtime during switch"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px]">
              <Check size={14} className="text-[var(--success)] shrink-0" />
              <span className="text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    q: "What happens if my server crashes?",
    a: "Your instance automatically restarts. Health checks run every 2 minutes — if the gateway becomes unresponsive, automatic recovery kicks in.",
    icon: Activity,
    visual: () => (
      <div className="mt-6">
        <p className="text-[13px] text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Auto-Recovery System</p>
        <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium">Health Check Timeline</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)]">Every 2 min</span>
          </div>
          <div className="flex gap-[3px] mb-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className={`flex-1 h-6 rounded-sm ${i === 22 ? "bg-[var(--error)]/50" : "bg-[var(--success)]/30"}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--text-tertiary)]">1 hour ago</span>
            <span className="text-[var(--error)]">↑ Crash detected</span>
            <span className="text-[var(--success)]">Auto-recovered 8s ↑</span>
            <span className="text-[var(--text-tertiary)]">Now</span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            "Automatic restart on crash",
            "Health checks every 2 minutes",
            "Gateway unresponsive detection",
            "Downtime measured in seconds, not minutes",
            "99.9% uptime across all instances",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px]">
              <Check size={14} className="text-[var(--success)] shrink-0" />
              <span className="text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFaq = faqs[activeIndex];
  const ActiveIcon = activeFaq.icon;
  const ActiveVisual = activeFaq.visual;

  return (
    <section id="faq" className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-[15px] text-[var(--accent)] font-medium mb-4">FAQ</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight mb-4">
            Common questions
          </h2>
          <p className="text-[var(--text-secondary)] text-[17px] max-w-lg">
            Everything you need to know about ClawHQ.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-10">
          {/* Left: Questions */}
          <div className="space-y-1">
            {faqs.map((faq, i) => {
              const Icon = faq.icon;
              return (
                <button
                  key={faq.q}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    activeIndex === i
                      ? "bg-[var(--accent-subtle)] border border-[var(--accent-border)]"
                      : "hover:bg-[var(--bg-subtle)] border border-transparent"
                  }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 ${activeIndex === i ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
                  />
                  <span className={`text-[15px] leading-snug ${
                    activeIndex === i ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"
                  }`}>
                    {faq.q}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Answer + Visual */}
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-8 lg:p-10 lg:sticky lg:top-24 flex flex-col justify-between min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
                    <ActiveIcon size={16} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    {activeFaq.q}
                  </h3>
                </div>
                <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">
                  {activeFaq.a}
                </p>
                <ActiveVisual />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
