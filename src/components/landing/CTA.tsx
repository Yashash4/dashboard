"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const textRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = textRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <section className="px-6">
      {/* CTA content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center pt-24 pb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Ready to stop managing infrastructure?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Dedicated VPS, AI models, all channels, full dashboard. One price.
          Live in 24 hours. No API keys. No hidden fees.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/pricing"
            className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--cream)] text-[var(--cream-foreground)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Get Started — $59/mo
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </a>
          <a
            href="#pricing"
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            Compare Plans
          </a>
        </div>
      </motion.div>

      {/* Giant brand text — top fades out, bottom visible and bleeds naturally */}
      <div
        ref={textRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative max-w-7xl mx-auto select-none cursor-default flex items-start justify-center"
      >
        {/* Bottom fade mask — hides the bottom portion of the letters */}
        <div
          className="absolute inset-x-0 bottom-0 h-[80%] z-20 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #111111 0%, transparent 100%)",
          }}
        />

        {/* Base text */}
        <span
          className="text-[10rem] md:text-[16rem] lg:text-[22rem] font-bold tracking-tighter leading-[0.75] whitespace-nowrap"
          style={{ color: "#1e1e1e" }}
          aria-hidden="true"
        >
          CLAWHQ
        </span>

        {/* Glow layer clipped to letters */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-start justify-center text-[10rem] md:text-[16rem] lg:text-[22rem] font-bold tracking-tighter leading-[0.75] whitespace-nowrap pointer-events-none z-10"
          style={{
            backgroundImage: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(107,143,113,0.6), transparent 70%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          CLAWHQ
        </span>
      </div>
    </section>
  );
}
