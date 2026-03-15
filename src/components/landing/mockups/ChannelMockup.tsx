"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const channels = [
  { name: "WhatsApp", color: "#25D366" },
  { name: "Telegram", color: "#0088cc" },
  { name: "Discord", color: "#5865F2" },
  { name: "Slack", color: "#E01E5A" },
  { name: "Teams", color: "#6264A7" },
  { name: "Signal", color: "#3A76F0" },
  { name: "Webchat", color: "#ffe0c2" },
];

export function ChannelMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const id = setInterval(() => {
      setActiveIndex(i);
      i++;
      if (i >= channels.length) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, [inView]);

  const cx = 150;
  const cy = 130;
  const radius = 95;

  return (
    <div ref={ref} className="w-full max-w-xs mx-auto font-mono">
      <svg viewBox="0 0 300 260" className="w-full h-auto">
        {/* Connection lines */}
        {channels.map((ch, i) => {
          const angle = (i / channels.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return (
            <motion.line
              key={`line-${ch.name}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={activeIndex >= i ? "#4ade80" : "#333"}
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.4 * i }}
            />
          );
        })}

        {/* Center hub */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={22}
          fill="#191919"
          stroke="oklch(0.6762 0.0567 132.4479)"
          strokeWidth={2}
          animate={inView ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="oklch(0.6762 0.0567 132.4479)"
          fontSize="7"
          fontFamily="monospace"
          fontWeight="600"
        >
          ClawHQ
        </text>

        {/* Channel nodes */}
        {channels.map((ch, i) => {
          const angle = (i / channels.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return (
            <motion.g
              key={ch.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                inView
                  ? {
                      opacity: 1,
                      scale: 1,
                      y: [0, -3, 0],
                    }
                  : {}
              }
              transition={{
                opacity: { duration: 0.3, delay: 0.2 + i * 0.1 },
                scale: { duration: 0.3, delay: 0.2 + i * 0.1 },
                y: { repeat: Infinity, duration: 2.5 + i * 0.3, ease: "easeInOut" },
              }}
            >
              <circle cx={x} cy={y} r={16} fill="#222222" stroke={ch.color} strokeWidth={1.5} />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={ch.color}
                fontSize="5.5"
                fontFamily="monospace"
                fontWeight="500"
              >
                {ch.name.length > 7 ? ch.name.slice(0, 6) + "." : ch.name}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
