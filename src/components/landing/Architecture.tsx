"use client";

import { motion } from "framer-motion";

/* ───────────────────────── Data ───────────────────────── */

const channels = [
  "WhatsApp",
  "Telegram",
  "Discord",
  "Slack",
  "Teams",
  "Signal",
  "Webchat",
];

const models = [
  "GPT-4o",
  "Claude",
  "Llama 3",
  "Mistral",
  "Gemma",
  "MiniMax",
  "500+ more",
];

const management = ["Dashboard", "Monitoring", "Agent Store", "Chat"];

/* ───────────────────────── Helpers ───────────────────────── */

function NodeCard({
  label,
  dotColor,
  delay,
  className = "",
}: {
  label: string;
  dotColor: string;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className={`flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md ${className}`}
    >
      <span
        className="block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="text-sm text-foreground whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

function ClusterLabel({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="text-[11px] uppercase tracking-widest text-muted-foreground text-center mt-4 font-medium"
    >
      {text}
    </motion.p>
  );
}

/* Animated line that grows from 0 to full size */
function HLine({ delay, className = "" }: { delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`h-px bg-border/60 origin-left ${className}`}
    />
  );
}

function VLine({ delay, className = "" }: { delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`w-px bg-border/60 origin-top ${className}`}
    />
  );
}

/* ───────────────────────── Colors ───────────────────────── */

const DOT_PRIMARY = "oklch(0.6762 0.0567 132.4479)"; // sage green
const DOT_AMBER = "#f59e0b"; // amber for models
const DOT_CREAM = "#ffe0c2"; // cream for management

/* ───────────────────────── Component ───────────────────────── */

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Your AI Infrastructure
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Everything connected. One dashboard.
          </p>
        </motion.div>

        {/* ── Desktop layout ── */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
            {/* ── Left: Channels ── */}
            <div className="flex flex-col items-end gap-2 pr-0">
              {channels.map((ch, i) => (
                <NodeCard
                  key={ch}
                  label={ch}
                  dotColor={DOT_PRIMARY}
                  delay={0.05 * i}
                />
              ))}
              <ClusterLabel text="Channels" delay={0.4} />
            </div>

            {/* ── Center column: lines + gateway ── */}
            <div className="flex items-center justify-center px-0">
              {/* Left connecting line */}
              <HLine delay={0.45} className="w-10 lg:w-16" />

              {/* Gateway node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.35 }}
                className="relative flex flex-col items-center justify-center px-6 py-5 bg-card border-2 border-primary rounded-lg shadow-[0_0_20px_rgba(107,142,35,0.12)] min-w-[140px]"
              >
                <span className="text-base font-semibold text-foreground">
                  ClawHQ
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Gateway
                </span>
              </motion.div>

              {/* Right connecting line */}
              <HLine delay={0.5} className="w-10 lg:w-16 origin-right" />
            </div>

            {/* ── Right: Models ── */}
            <div className="flex flex-col items-start gap-2 pl-0">
              {models.map((m, i) => (
                <NodeCard
                  key={m}
                  label={m}
                  dotColor={DOT_AMBER}
                  delay={0.35 + 0.05 * i}
                />
              ))}
              <ClusterLabel text="AI Models" delay={0.7} />
            </div>
          </div>

          {/* ── Vertical line + Management (below gateway) ── */}
          <div className="flex flex-col items-center mt-0">
            <VLine delay={0.7} className="h-10" />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-2 mt-0"
            >
              {management.map((item, i) => (
                <NodeCard
                  key={item}
                  label={item}
                  dotColor={DOT_CREAM}
                  delay={0.85 + 0.06 * i}
                />
              ))}
            </motion.div>
            <ClusterLabel text="Management" delay={1.1} />
          </div>
        </div>

        {/* ── Mobile layout (stacked) ── */}
        <div className="md:hidden flex flex-col items-center gap-0">
          {/* Channels */}
          <div className="flex flex-col items-center gap-2 w-full max-w-[220px]">
            {channels.map((ch, i) => (
              <NodeCard
                key={ch}
                label={ch}
                dotColor={DOT_PRIMARY}
                delay={0.05 * i}
                className="w-full justify-center"
              />
            ))}
            <ClusterLabel text="Channels" delay={0.4} />
          </div>

          <VLine delay={0.45} className="h-8" />

          {/* Gateway */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.5 }}
            className="flex flex-col items-center justify-center px-8 py-5 bg-card border-2 border-primary rounded-lg shadow-[0_0_20px_rgba(107,142,35,0.12)]"
          >
            <span className="text-base font-semibold text-foreground">
              ClawHQ
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Gateway
            </span>
          </motion.div>

          <VLine delay={0.6} className="h-8" />

          {/* Models */}
          <div className="flex flex-col items-center gap-2 w-full max-w-[220px]">
            {models.map((m, i) => (
              <NodeCard
                key={m}
                label={m}
                dotColor={DOT_AMBER}
                delay={0.65 + 0.05 * i}
                className="w-full justify-center"
              />
            ))}
            <ClusterLabel text="AI Models" delay={1.0} />
          </div>

          <VLine delay={1.05} className="h-8" />

          {/* Management */}
          <div className="flex flex-col items-center gap-2 w-full max-w-[220px]">
            {management.map((item, i) => (
              <NodeCard
                key={item}
                label={item}
                dotColor={DOT_CREAM}
                delay={1.1 + 0.06 * i}
                className="w-full justify-center"
              />
            ))}
            <ClusterLabel text="Management" delay={1.4} />
          </div>
        </div>
      </div>
    </section>
  );
}
