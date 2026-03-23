"use client";

import { motion } from "framer-motion";

const stats = [
  { number: "All", label: "AI Models", desc: "Included on every plan" },
  { number: "7", label: "Channels", desc: "All included, no add-ons" },
  { number: "99.9%", label: "Uptime", desc: "Auto-restart + health checks" },
  { number: "274+", label: "Features", desc: "Across all tiers" },
];

export default function Stats() {
  return (
    <section className="py-20 px-6 border-y border-[var(--border-primary)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-1">{stat.number}</p>
              <p className="text-[13px] font-medium text-[var(--accent)] mb-1">{stat.label}</p>
              <p className="text-[12px] text-[var(--text-secondary)]">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
