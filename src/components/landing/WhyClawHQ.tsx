"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const stats = [
  {
    number: "$59",
    label: "per month, all-in",
    sublabel: "Hosting + AI + Channels + Dashboard",
  },
  {
    number: "24h",
    label: "to go live",
    sublabel: "From signup to running agents",
  },
  {
    number: "$0",
    label: "hidden fees",
    sublabel: "No API costs. No channel add-ons.",
  },
];

export default function WhyClawHQ() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Centered Feature Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap size={22} className="text-primary" />
            </div>
          </div>

          <p className="text-xs text-primary uppercase tracking-widest mb-4">
            WHY CLAWHQ
          </p>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Built different. Priced honestly.
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Most providers charge you for hosting, then send a separate bill for
            AI access. They give you a shared container and call it
            &ldquo;dedicated.&rdquo; We don&rsquo;t. One price. One server.
            Everything included.
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
              style={{
                backgroundColor: "var(--cream)",
                color: "var(--cream-foreground)",
              }}
            >
              See Plans
              <span aria-hidden="true">&rarr;</span>
            </a>
            <a
              href="#faq"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm border border-border text-foreground hover:border-primary/30 transition-colors"
            >
              Read the FAQ
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-lg bg-card border border-border p-8 text-center"
            >
              <p className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                {stat.number}
              </p>
              <p className="text-sm font-medium text-foreground mb-1">
                {stat.label}
              </p>
              <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
