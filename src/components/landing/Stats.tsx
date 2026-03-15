"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

const stats = [
  {
    number: "7",
    label: "Free Agents",
    desc: "Support, Research, Writer, Data, Sales, Reviewer, Manager — all free, pre-built, and ready to deploy in one click from the Agent Store.",
  },
  {
    number: "7",
    label: "Channels",
    desc: "WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat. All included on every plan. Connect in one click.",
  },
  {
    number: "99.9%",
    label: "Uptime",
    desc: "Automated health checks every 2 minutes. Auto-restart on crash. Dedicated infrastructure means no noisy neighbors degrading your performance.",
  },
  {
    number: "274+",
    label: "Features",
    desc: "85 Starter features, 91 Pro features, 98+ Ultra features. From health monitoring to Mission Control — every tier delivers serious value.",
  },
];

const CYCLE_INTERVAL = 4000;

export default function Stats() {
  const [active, setActive] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const selectStat = useCallback((index: number) => {
    setActive(index);
    setResetKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % stats.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, [resetKey]);

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-foreground mb-16">
          The numbers speak
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {stats.map((stat, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => selectStat(i)}
                className={`relative flex flex-col items-center gap-2 py-6 px-4 transition-colors duration-300 cursor-pointer ${
                  isActive ? "" : "opacity-100"
                }`}
              >
                <span
                  className={`text-5xl md:text-6xl font-bold transition-colors duration-300 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {stat.number}
                </span>
                <span
                  className={`text-sm uppercase tracking-widest transition-colors duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/30"
                  }`}
                >
                  {stat.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="stat-indicator"
                    className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-muted-foreground text-sm max-w-lg text-center"
            >
              {stats[active].desc}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
