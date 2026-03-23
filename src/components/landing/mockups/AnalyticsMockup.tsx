"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { label: "Messages", target: 1247, prefix: "" },
  { label: "Sessions", target: 89, prefix: "" },
  { label: "Avg Response", target: 1.2, prefix: "", suffix: "s", decimals: 1 },
  { label: "Satisfaction", target: 94, prefix: "", suffix: "%" },
];

const chartPoints = [
  [0, 70],
  [40, 60],
  [80, 65],
  [120, 45],
  [160, 50],
  [200, 35],
  [240, 40],
  [280, 25],
  [320, 20],
  [360, 15],
];

const polylineStr = chartPoints.map(([x, y]) => `${x},${y}`).join(" ");
const pathStr = `M ${chartPoints.map(([x, y]) => `${x} ${y}`).join(" L ")}`;

function CountUp({
  target,
  decimals = 0,
  suffix = "",
}: {
  target: number;
  decimals?: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1.5;
    let start = 0;
    const step = target / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(id);
      } else {
        setValue(start);
      }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}
      {suffix}
    </span>
  );
}

export function AnalyticsMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <div
      ref={containerRef}
      className="w-full max-w-xl mx-auto font-mono rounded-lg border border-border bg-card overflow-hidden"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-2 p-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="rounded-md border border-border bg-[var(--bg-subtle)] p-2"
          >
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">
              {stat.prefix}
              <CountUp target={stat.target} decimals={stat.decimals} suffix={stat.suffix} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-3 pb-3">
        <div className="rounded-md border border-border bg-[var(--bg-subtle)] p-3">
          <div className="text-[10px] text-muted-foreground mb-2">Messages (7 days)</div>
          <svg viewBox="0 0 360 80" className="w-full h-auto overflow-visible">
            {/* Grid lines */}
            {[20, 40, 60].map((y) => (
              <line
                key={y}
                x1={0}
                y1={y}
                x2={360}
                y2={y}
                stroke="#333"
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
            ))}

            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.6762 0.0567 132.4479)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="oklch(0.6762 0.0567 132.4479)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Fill area */}
            <motion.polygon
              points={`0,80 ${polylineStr} 360,80`}
              fill="url(#chartGrad)"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
            />

            {/* Animated line */}
            <motion.path
              d={pathStr}
              fill="none"
              stroke="oklch(0.6762 0.0567 132.4479)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            />

            {/* Data points */}
            {chartPoints.map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={2.5}
                fill="#191919"
                stroke="oklch(0.6762 0.0567 132.4479)"
                strokeWidth={1.5}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.2, delay: 0.3 + (i / chartPoints.length) * 1.5 }}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
