"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const agents = [
  { name: "Support Agent", desc: "Handle customer queries", color: "#4ade80", rating: 4.9 },
  { name: "Research Assistant", desc: "Deep web research", color: "#60a5fa", rating: 4.7 },
  { name: "Content Writer", desc: "Blog posts & copy", color: "#f472b6", rating: 4.8 },
  { name: "Data Analyst", desc: "Charts & insights", color: "#facc15", rating: 4.6 },
  { name: "Sales Rep", desc: "Lead qualification", color: "#a78bfa", rating: 4.5 },
  { name: "Code Reviewer", desc: "PR review & feedback", color: "#fb923c", rating: 4.8 },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-2.5 h-2.5 ${star <= Math.round(rating) ? "text-[var(--warning)]" : "text-[#333]"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[9px] text-muted-foreground ml-0.5">{rating}</span>
    </div>
  );
}

export function AgentStoreMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="w-full max-w-xl mx-auto font-mono">
      <div className="grid grid-cols-3 gap-2">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="rounded-lg border border-border bg-card p-2.5 cursor-default"
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-md mb-2"
              style={{ backgroundColor: agent.color + "20", border: `1px solid ${agent.color}40` }}
            >
              <div
                className="w-full h-full rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{ color: agent.color }}
              >
                {agent.name.charAt(0)}
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[11px] text-foreground font-medium truncate">{agent.name}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mb-1.5">{agent.desc}</div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <StarRating rating={agent.rating} />
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                Free
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
