"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const points = [
  {
    stat: "$59",
    label: "/mo all-in",
    title: "One price. Everything included.",
    description: "VPS + AI models + 7 channels + dashboard. Competitors charge $19 hosting + $30-60 API fees separately. We bundle it all.",
  },
  {
    stat: "100%",
    label: "private",
    title: "Your data stays on your server.",
    description: "All conversations, documents, and agent configs stay on YOUR dedicated VPS. We never access your data. Period.",
  },
  {
    stat: "~min",
    label: "to deploy",
    title: "Zero DevOps required.",
    description: "We handle setup, updates, SSL, backups, crash recovery. Health checks every 2 minutes. Auto-restart on failure.",
  },
];

export default function WhyClawHQ() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-[13px] text-[var(--accent)] font-medium mb-4">Why ClawHQ</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight mb-5">
            Built different.{" "}
            <span className="font-serif-italic font-normal text-[var(--text-secondary)]">Priced honestly.</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-[15px] max-w-lg mx-auto">
            Most providers charge for hosting, then send a separate bill for AI access.
            We don&apos;t. One price. One server. Everything included.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {points.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-8 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-raised)] overflow-hidden group hover:border-[var(--accent-border)] transition-colors duration-500"
            >
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]">{point.stat}</span>
                  <span className="text-[13px] text-[var(--text-tertiary)]">{point.label}</span>
                </div>
              </div>
              <h3 className="text-[16px] font-semibold mb-3">{point.title}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4 mt-14"
        >
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--cta)] text-[var(--cta-foreground)] font-medium text-[14px] hover:opacity-90 transition-opacity"
          >
            See Plans <ArrowRight size={14} />
          </a>
          <a
            href="#faq"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[14px] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-border)] transition-all"
          >
            Read FAQ
          </a>
        </motion.div>
      </div>
    </section>
  );
}
