"use client";

import { motion } from "framer-motion";
import { Zap, Server, Lock, Globe, Store, BarChart3, Clock, DollarSign, Layers } from "lucide-react";

const differentiators = [
  {
    icon: Zap,
    title: "All-inclusive pricing",
    description: "$59 includes VPS + AI models + all 7 channels + dashboard. Competitors charge $19 hosting + $30-60 API fees separately.",
    stat: "$59/mo",
    statLabel: "all-in",
  },
  {
    icon: Lock,
    title: "Your data, your server",
    description: "All data stays on your dedicated VPS. We never access your conversations, documents, or agent configurations.",
    stat: "100%",
    statLabel: "private",
  },
  {
    icon: Globe,
    title: "7 channels, day one",
    description: "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — all included. No per-channel fees. No limits.",
    stat: "7",
    statLabel: "channels",
  },
  {
    icon: Server,
    title: "Zero DevOps",
    description: "We handle setup, updates, backups, SSL, crash recovery. Your VPS runs 24/7 with health checks every 2 minutes.",
    stat: "24h",
    statLabel: "to go live",
  },
  {
    icon: Store,
    title: "Agent Store",
    description: "7 pre-built agents free. Deploy in one click. Build custom agents with AI on Pro. No coding required.",
    stat: "7",
    statLabel: "free agents",
  },
  {
    icon: BarChart3,
    title: "Enterprise tools, startup prices",
    description: "Webhooks, API, analytics, audit logs, knowledge base — features that competitors charge $500+ for. Included from $129/mo.",
    stat: "91+",
    statLabel: "Pro features",
  },
];

export default function WhyClawHQ() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">Why ClawHQ</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Built different. Priced honestly.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Most providers charge you for hosting, then send a separate bill for AI access. They give you a shared container and call it &ldquo;dedicated.&rdquo; We don&rsquo;t. One price. One server. Everything included.
          </p>
        </motion.div>

        {/* Why teams choose ClawHQ — benefit cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            {
              icon: Clock,
              title: "Go live in 24 hours",
              description: "No infrastructure setup, no DevOps hiring, no weekends lost configuring servers. We handle everything so you can focus on your product.",
            },
            {
              icon: DollarSign,
              title: "One bill, no surprises",
              description: "Other platforms charge hosting + AI API + channel fees separately. ClawHQ bundles everything into one flat price. What you see is what you pay.",
            },
            {
              icon: Layers,
              title: "Scale without complexity",
              description: "Start with Starter, grow into Pro or Ultra. Same dashboard, same workflow. Your agents, channels, and data carry forward seamlessly.",
            },
          ].map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-lg bg-primary/5 border border-primary/15 p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest">And here&rsquo;s the full breakdown</p>
        </motion.div>

        {/* Differentiator cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {differentiators.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-lg bg-card border border-border p-6 hover:border-primary/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{item.stat}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.statLabel}</p>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4 mt-12"
        >
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: "var(--cream)", color: "var(--cream-foreground)" }}
          >
            See Plans <span aria-hidden="true">&rarr;</span>
          </a>
          <a
            href="#faq"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm border border-border text-foreground hover:border-primary/30 transition-colors"
          >
            Read the FAQ <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
