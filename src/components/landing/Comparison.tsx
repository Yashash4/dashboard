"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellType = "bad" | "mid" | "good";

interface Row {
  feature: string;
  selfHosted: { type: CellType; text: string };
  budget: { type: CellType; text: string };
  clawhq: { type: CellType; text: string };
}

const rows: Row[] = [
  {
    feature: "Setup Time",
    selfHosted: { type: "bad", text: "Hours — Docker, DNS, SSL, reverse proxy" },
    budget: { type: "mid", text: "Minutes, but you configure AI separately" },
    clawhq: { type: "good", text: "Under 24 hours — we do everything" },
  },
  {
    feature: "AI Models",
    selfHosted: { type: "bad", text: "Find providers, manage API keys & billing" },
    budget: { type: "mid", text: "BYOK — bring your own keys + pay $20-60/mo" },
    clawhq: { type: "good", text: "Bundled. No API keys. Flat rate." },
  },
  {
    feature: "Total Monthly Cost",
    selfHosted: { type: "bad", text: "VPS $20 + AI API $40+ = $60+ and your time" },
    budget: { type: "mid", text: "$19-29 hosting + $20-60 AI = $40-89 total" },
    clawhq: { type: "good", text: "$59/mo. That's it. Everything included." },
  },
  {
    feature: "Infrastructure",
    selfHosted: { type: "bad", text: "Whatever VPS you rent, you manage it" },
    budget: { type: "mid", text: "Shared container — 2 vCPU, 2-4 GB RAM typical" },
    clawhq: { type: "good", text: "Dedicated VPS — 2-16 vCPU, 8-64 GB RAM" },
  },
  {
    feature: "Channels",
    selfHosted: { type: "bad", text: "Read docs, configure each one manually" },
    budget: { type: "mid", text: "2-3 channels, extras cost more" },
    clawhq: { type: "good", text: "All 7 channels. Every plan. $0 extra." },
  },
  {
    feature: "Dashboard",
    selfHosted: { type: "bad", text: "Terminal + raw OpenClaw UI" },
    budget: { type: "mid", text: "Basic hosting panel" },
    clawhq: { type: "good", text: "Full management dashboard — VPS, agents, monitoring, billing" },
  },
  {
    feature: "Agent Store",
    selfHosted: { type: "bad", text: "Build everything from scratch" },
    budget: { type: "bad", text: "Not offered" },
    clawhq: { type: "good", text: "Browse, buy, deploy with one click" },
  },
  {
    feature: "Monitoring",
    selfHosted: { type: "bad", text: "Set up Grafana / Prometheus yourself" },
    budget: { type: "mid", text: "Docker logs, maybe basic metrics" },
    clawhq: { type: "good", text: "Real-time CPU, RAM, disk, network + health checks" },
  },
  {
    feature: "Crash Recovery",
    selfHosted: { type: "bad", text: "Configure systemd, hope it works" },
    budget: { type: "mid", text: "Container restart flag — basic" },
    clawhq: { type: "good", text: "Auto-restart + health checks every 2 minutes" },
  },
  {
    feature: "Updates & Backups",
    selfHosted: { type: "bad", text: "SSH in, pull, rebuild, pray" },
    budget: { type: "mid", text: "Manual rebuild or wait for host" },
    clawhq: { type: "good", text: "Automatic updates. Daily backups." },
  },
  {
    feature: "Domain + SSL",
    selfHosted: { type: "bad", text: "Configure DNS, generate certs, renew manually" },
    budget: { type: "mid", text: "Sometimes included, often an add-on" },
    clawhq: { type: "good", text: "Custom domain + auto-SSL on every plan" },
  },
  {
    feature: "Hidden Costs",
    selfHosted: { type: "bad", text: "Your time — the most expensive cost" },
    budget: { type: "bad", text: "API fees, channel fees, overage charges" },
    clawhq: { type: "good", text: "None. One price. One bill." },
  },
];

function CellIcon({ type }: { type: CellType }) {
  if (type === "bad")
    return <X size={14} className="text-destructive shrink-0 mt-0.5" />;
  if (type === "mid")
    return <Minus size={14} className="text-muted-foreground/60 shrink-0 mt-0.5" />;
  return <Check size={14} className="text-primary shrink-0 mt-0.5" />;
}

export default function Comparison() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">
            Comparison
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Why not just self-host?
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            You could. But here&apos;s what the total picture actually looks
            like.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-lg border border-border overflow-hidden relative"
        >
          {/* Mobile scroll indicator */}
          <div className="md:hidden flex items-center justify-end gap-1 px-4 py-2 text-[10px] text-muted-foreground border-b border-border/50">
            Scroll <span aria-hidden="true">&rarr;</span>
          </div>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="text-left py-4 px-5 text-xs uppercase tracking-widest text-muted-foreground font-medium min-w-[120px]">
                    Feature
                  </th>
                  <th className="text-left py-4 px-5 text-xs uppercase tracking-widest text-muted-foreground font-medium min-w-[200px]">
                    Self-Hosted
                  </th>
                  <th className="text-left py-4 px-5 text-xs uppercase tracking-widest text-muted-foreground font-medium min-w-[200px]">
                    Budget Hosts ($19-29)
                  </th>
                  <th className="text-left py-4 px-5 text-xs uppercase tracking-widest font-medium min-w-[220px] text-[var(--cream)]">
                    ClawHQ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-t border-border/50 ${
                      i % 2 === 0 ? "" : "bg-card/50"
                    }`}
                  >
                    <td className="py-3.5 px-5 font-medium text-foreground whitespace-nowrap">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-5 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CellIcon type={row.selfHosted.type} />
                        <span className="leading-snug">{row.selfHosted.text}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CellIcon type={row.budget.type} />
                        <span className="leading-snug">{row.budget.text}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-start gap-2">
                        <CellIcon type={row.clawhq.type} />
                        <span className="leading-snug font-medium text-foreground">
                          {row.clawhq.text}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs text-muted-foreground text-center mt-8 tracking-wide"
        >
          Still comparing? Add up hosting + AI API + channel plugins +
          maintenance time. Then compare that to one ClawHQ plan.
        </motion.p>

        {/* Mini CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">Ready to stop stitching together tools?</p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 font-medium text-sm transition-opacity hover:opacity-90"
            style={{
              borderRadius: "var(--radius)",
              backgroundColor: "var(--cream)",
              color: "var(--cream-foreground)",
            }}
          >
            Get Started — $59/mo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
