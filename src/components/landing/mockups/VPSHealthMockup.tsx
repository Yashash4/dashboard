"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const gauges = [
  { label: "CPU", target: 23, color: "oklch(0.6762 0.0567 132.4479)" },
  { label: "RAM", target: 45, color: "#60a5fa" },
  { label: "Disk", target: 31, color: "#f59e0b" },
  { label: "Network", target: 12, color: "#a78bfa" },
];

const CIRCLE_RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function Gauge({
  label,
  target,
  color,
  delay,
  inView,
}: {
  label: string;
  target: number;
  color: string;
  delay: number;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let innerIntervalId: ReturnType<typeof setInterval> | null = null;
    const duration = 1.5;
    let start = 0;
    const step = target / (duration * 60);

    const timerId = setTimeout(() => {
      innerIntervalId = setInterval(() => {
        start += step;
        if (start >= target) {
          setCount(target);
          if (innerIntervalId) clearInterval(innerIntervalId);
          innerIntervalId = null;
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
    }, delay * 1000);

    return () => {
      clearTimeout(timerId);
      if (innerIntervalId) clearInterval(innerIntervalId);
    };
  }, [inView, target, delay]);

  const dashoffset = CIRCUMFERENCE - (count / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      <div className="relative w-[90px] h-[90px]">
        <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="45"
            cy="45"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="#333"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="45"
            cy="45"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        {/* Percentage in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground font-mono">{count}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1.5 font-mono">{label}</span>
    </motion.div>
  );
}

export function VPSHealthMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className="w-full max-w-md mx-auto rounded-lg border border-border bg-card p-4 font-mono"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
        </span>
        <span className="text-[11px] text-foreground font-medium">VPS Health</span>
        <span className="text-[10px] text-muted-foreground ml-auto">All systems normal</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {gauges.map((g, i) => (
          <Gauge
            key={g.label}
            label={g.label}
            target={g.target}
            color={g.color}
            delay={i * 0.2}
            inView={inView}
          />
        ))}
      </div>
    </div>
  );
}
