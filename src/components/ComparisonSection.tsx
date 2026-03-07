"use client";

import { motion } from "framer-motion";
import { X, Minus, Check } from "lucide-react";

const rows = [
  {
    feature: "Setup Time",
    selfHosted: "Hours of config",
    oneClick: "~30 minutes",
    clawHQ: "5 minutes",
  },
  {
    feature: "OpenClaw",
    selfHosted: "Manual install",
    oneClick: "Raw container",
    clawHQ: "Fully configured",
  },
  {
    feature: "Dashboard",
    selfHosted: "Terminal only",
    oneClick: "Basic gateway UI",
    clawHQ: "Custom branded dashboard",
  },
  {
    feature: "Domain + SSL",
    selfHosted: "Configure yourself",
    oneClick: "None (raw IP)",
    clawHQ: "yourname.clawhq.tech + auto-SSL",
  },
  {
    feature: "AI Models",
    selfHosted: "Find APIs, add keys",
    oneClick: "Add keys yourself",
    clawHQ: "500+ open-source models bundled",
  },
  {
    feature: "Channels",
    selfHosted: "Read docs, configure each",
    oneClick: "Configure manually",
    clawHQ: "1-click connect from dashboard",
  },
  {
    feature: "Agents",
    selfHosted: "Code from scratch",
    oneClick: "Build manually",
    clawHQ: "Deploy from dashboard + store",
  },
  {
    feature: "Monitoring",
    selfHosted: "Set up Grafana yourself",
    oneClick: "Docker logs only",
    clawHQ: "Real-time CPU/RAM/disk dashboard",
  },
  {
    feature: "Support",
    selfHosted: "Community forums",
    oneClick: "Generic host support",
    clawHQ: "Dedicated ticket system",
  },
  {
    feature: "Billing",
    selfHosted: "N/A",
    oneClick: "Host billing only",
    clawHQ: "Built-in subscription management",
  },
  {
    feature: "Updates",
    selfHosted: "Manual SSH + rebuild",
    oneClick: "Manual rebuild",
    clawHQ: "Automatic",
  },
  {
    feature: "Security",
    selfHosted: "Firewall + SSL yourself",
    oneClick: "Basic container isolation",
    clawHQ: "Managed firewall + SSL + auth",
  },
  {
    feature: "Auto-Restart",
    selfHosted: "Configure systemd yourself",
    oneClick: "Container restart flag",
    clawHQ: "Health checks + auto-recovery",
  },
  {
    feature: "Scaling",
    selfHosted: "Manual server migration",
    oneClick: "Buy bigger VPS yourself",
    clawHQ: "Upgrade plan, we migrate",
  },
];

// Classify each cell: "bad" | "mid" | "good"
function getCellType(colIndex: number): "bad" | "mid" | "good" {
  if (colIndex === 0) return "bad";
  if (colIndex === 1) return "mid";
  return "good";
}

const CellIcon = ({ type }: { type: "bad" | "mid" | "good" }) => {
  if (type === "bad") return <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />;
  if (type === "mid") return <Minus className="w-3.5 h-3.5 text-yellow-500/60 flex-shrink-0" />;
  return <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

const ComparisonSection = () => {
  return (
    <section
      id="comparison"
      className="py-24 md:py-32 bg-background border-t border-white/[0.06] overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-white/20" />
            <span className="font-mono text-sm text-white/40">005</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Why not just self-host?
          </h2>
          <p className="text-white/50 text-base max-w-2xl">
            You could. But here&apos;s what you&apos;d be signing up for.
          </p>
        </motion.div>

        {/* Desktop Table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="hidden md:block"
        >
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1.3fr] border border-white/10 bg-white/[0.02]">
            <div className="px-5 py-4 border-r border-white/10">
              <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                Feature
              </span>
            </div>
            <div className="px-5 py-4 border-r border-white/10">
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Self-Hosted
              </span>
            </div>
            <div className="px-5 py-4 border-r border-white/10">
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                One-Click Deploy
              </span>
            </div>
            <div className="px-5 py-4 bg-primary/[0.04] border-l border-primary/20">
              <span className="text-xs font-mono text-primary uppercase tracking-wider font-semibold">
                ClawHQ
              </span>
            </div>
          </div>

          {/* Data Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              variants={rowVariants}
              className={`grid grid-cols-[1fr_1fr_1fr_1.3fr] border-x border-b border-white/10 ${
                i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              }`}
            >
              <div className="px-5 py-3.5 border-r border-white/10">
                <span className="text-sm text-white/70 font-medium">
                  {row.feature}
                </span>
              </div>
              <div className="px-5 py-3.5 border-r border-white/10 flex items-center gap-2.5">
                <CellIcon type="bad" />
                <span className="text-sm text-white/35">{row.selfHosted}</span>
              </div>
              <div className="px-5 py-3.5 border-r border-white/10 flex items-center gap-2.5">
                <CellIcon type="mid" />
                <span className="text-sm text-white/45">{row.oneClick}</span>
              </div>
              <div className="px-5 py-3.5 bg-primary/[0.04] border-l border-primary/20 flex items-center gap-2.5">
                <CellIcon type="good" />
                <span className="text-sm text-white/90 font-medium">
                  {row.clawHQ}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="md:hidden space-y-3"
        >
          {rows.map((row) => (
            <motion.div
              key={row.feature}
              variants={rowVariants}
              className="border border-white/10 bg-white/[0.02]"
            >
              <div className="px-4 py-3 border-b border-white/10">
                <span className="text-sm font-medium text-white/80">
                  {row.feature}
                </span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-mono text-white/30 uppercase">Self-Hosted</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/35 text-right">{row.selfHosted}</span>
                    <CellIcon type="bad" />
                  </div>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-mono text-white/40 uppercase">One-Click</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/45 text-right">{row.oneClick}</span>
                    <CellIcon type="mid" />
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-primary/[0.04] flex items-center justify-between">
                  <span className="text-xs font-mono text-primary uppercase font-semibold">ClawHQ</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/90 font-medium text-right">{row.clawHQ}</span>
                    <CellIcon type="good" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center text-xs font-mono text-white/25"
        >
          ALL MODELS ARE OPEN-SOURCE. NO VENDOR LOCK-IN. YOUR DATA STAYS YOURS.
        </motion.p>
      </div>
    </section>
  );
};

export default ComparisonSection;
