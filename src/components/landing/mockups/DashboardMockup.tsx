"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const sidebarItems = [
  { label: "Overview", active: true },
  { label: "VPS", active: false },
  { label: "Agents", active: false },
  { label: "Chat", active: false },
  { label: "Channels", active: false },
  { label: "Store", active: false },
  { label: "Support", active: false },
];

const statCards = [
  { label: "VPS Status", value: "Running", pulse: true },
  { label: "Plan", value: "Starter" },
  { label: "AI Model", value: "Kimi K2.5" },
  { label: "Context", value: "128K" },
];

const numericStats = [
  { label: "Channels", target: 5 },
  { label: "Agents", target: 3 },
  { label: "Tickets", target: 0 },
];

const activityItems = [
  { text: "Agent deployed: Support Agent", time: "2m ago" },
  { text: "WhatsApp channel connected", time: "15m ago" },
  { text: "Model switched to Kimi K2.5", time: "1h ago" },
];

function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || target === 0) return;
    let start = 0;
    const step = target / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

export function DashboardMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-2xl mx-auto rounded-lg border border-border bg-card overflow-hidden font-mono text-xs"
    >
      <div className="flex">
        {/* Mini Sidebar */}
        <div className="w-32 shrink-0 border-r border-border bg-[var(--bg-elevated)] p-2 space-y-0.5">
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`px-2 py-1.5 rounded-md text-[11px] ${
                item.active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 space-y-3">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-4 gap-2">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="rounded-md border border-border bg-[var(--bg-subtle)] p-2"
              >
                <div className="text-[10px] text-muted-foreground">{card.label}</div>
                <div className="flex items-center gap-1 mt-1">
                  {card.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
                    </span>
                  )}
                  <span className="text-foreground font-medium text-[11px]">{card.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Numeric Stats */}
          <div className="grid grid-cols-3 gap-2">
            {numericStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="rounded-md border border-border bg-[var(--bg-subtle)] p-2 text-center"
              >
                <div className="text-lg font-semibold text-foreground">
                  <CountUp target={stat.target} />
                </div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Recent Activity
            </div>
            {activityItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.15 }}
                className="flex items-center justify-between rounded-md border border-border bg-[var(--bg-subtle)] px-2 py-1.5"
              >
                <span className="text-[11px] text-foreground">{item.text}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
