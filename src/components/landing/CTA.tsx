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
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-5">
          Ready to deploy?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-[17px] leading-relaxed">
          Dedicated VPS, AI models, all channels, full dashboard.
          One price. Deploy in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/pricing"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--cream)] text-[var(--cream-foreground)] font-semibold text-[16px] hover:opacity-90 transition-opacity"
          >
            Get Started
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </a>
          <a
            href="mailto:hello@clawhq.tech?subject=Book a Demo"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border text-[16px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            Book a Demo
          </a>
        </div>
      </motion.div>

      {/* Giant brand text — bleeds into footer like Resend */}
      <div
        ref={textRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative select-none cursor-default flex items-start justify-center overflow-hidden -mb-4"
      >
        {/* Bottom fade mask */}
        <div
          className="absolute inset-x-0 bottom-0 h-[70%] z-20 pointer-events-none"
          style={{
            background: "linear-gradient(to top, var(--bg-base) 0%, transparent 100%)",
          }}
        />

        {/* Base text — sans-serif for smooth round letters at large size */}
        <span
          className="text-[6rem] sm:text-[9rem] md:text-[13rem] lg:text-[17rem] xl:text-[20rem] font-black tracking-tighter leading-[0.8] whitespace-nowrap"
          style={{
            color: "#1a1a1a",
          }}
          aria-hidden="true"
        >
          CLAWHQ
        </span>

        {/* Glow layer clipped to letters */}
        <span
          className="absolute inset-0 flex items-start justify-center text-[6rem] sm:text-[9rem] md:text-[13rem] lg:text-[17rem] xl:text-[20rem] font-black tracking-tighter leading-[0.8] whitespace-nowrap pointer-events-none z-10"
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
