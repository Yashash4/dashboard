"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <section className="py-24 px-6">
      {/* CTA content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
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
            href="/register"
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

      {/* Giant brand text with cursor spotlight */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative max-w-7xl mx-auto overflow-hidden rounded-[var(--radius)] select-none"
        style={{ background: "#111111" }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(107,143,113,0.15), transparent 80%)`,
          }}
        />
        <div className="flex items-center justify-center py-12 md:py-16 lg:py-20">
          <span
            className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-bold tracking-tighter leading-none"
            style={{ color: "#1a1a1a" }}
          >
            CLAWHQ
          </span>
        </div>
      </div>
    </section>
  );
}
