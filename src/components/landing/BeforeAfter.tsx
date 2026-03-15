"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const comparisons = [
  { without: "Manage your own VPS", with: "Managed VPS, 24/7 uptime" },
  { without: "Set up API keys per model", with: "AI models included, no API keys" },
  { without: "Configure OpenClaw manually", with: "One-click agent deployment" },
  { without: "2-3 messaging channels", with: "All 7 channels, day one" },
  { without: "No monitoring or analytics", with: "Health monitoring + analytics" },
  { without: "$50-80/mo total (hosting + API)", with: "$59/mo all-inclusive" },
  { without: "Build agents from scratch", with: "7 free pre-built agents in store" },
  { without: "Self-manage SSL and domains", with: "Custom domain + auto-SSL" },
];

export default function BeforeAfter() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">
            The difference
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Before and after ClawHQ
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Stop piecing together hosting, AI APIs, and channel plugins. Get everything in one platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Without ClawHQ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-destructive/20 bg-card p-6"
          >
            <p className="text-sm font-semibold text-destructive mb-4 uppercase tracking-wider">
              Without ClawHQ
            </p>
            <div className="space-y-3">
              {comparisons.map((item, i) => (
                <motion.div
                  key={item.without}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-2.5"
                >
                  <X size={14} className="text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{item.without}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* With ClawHQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg border border-primary/20 bg-card p-6"
          >
            <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
              With ClawHQ
            </p>
            <div className="space-y-3">
              {comparisons.map((item, i) => (
                <motion.div
                  key={item.with}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-2.5"
                >
                  <Check size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground font-medium">{item.with}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
