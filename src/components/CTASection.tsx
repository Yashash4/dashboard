"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const CTASection = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, hsla(var(--primary) / 0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Decoration */}
        <div className="flex items-center gap-4 mb-6 justify-center">
          <div className="h-px w-12 bg-white/20" />
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white/40">009</span>
          <div className="h-px w-12 bg-white/20" />
        </div>

        {/* Headline */}
        <motion.h2
          className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Start deploying in 5 minutes
        </motion.h2>

        {/* Subtext */}
        <motion.p
          className="text-lg text-white/60 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Join developers who chose to build, not manage infrastructure.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/register"
            className="inline-block bg-primary text-black font-semibold px-8 py-4 text-lg hover:bg-primary/90 transition-colors"
            style={{ borderRadius: 0 }}
          >
            Get Started — $59/mo
          </Link>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8 text-sm text-white/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span>No credit card required</span>
          <span className="hidden md:inline text-white/20">·</span>
          <span>Cancel anytime</span>
          <span className="hidden md:inline text-white/20">·</span>
          <span>5-minute setup</span>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
