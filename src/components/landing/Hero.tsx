"use client";

import { motion } from "framer-motion";
import { ArrowRight, Server, Bot, Zap } from "lucide-react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});

export default function Hero() {
  return (
    <section className="noise-bg relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Dual-tone dark background — darker edges, lighter center */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 60% at 50% 40%, #1a1a1a 0%, transparent 70%)",
            "radial-gradient(ellipse 100% 80% at 50% 0%, #151515 0%, #0a0a0a 100%)",
          ].join(", "),
        }}
      />

      {/* Spotlight vignette — dark edges pushing focus to center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 50% 45%, transparent 0%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Dramatic radial glow behind content — primary color */}
      <div
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: "oklch(0.6762 0.0567 132.4479 / 0.07)" }}
      />

      {/* Secondary warm glow for depth */}
      <div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "oklch(0.6762 0.0567 132.4479 / 0.04)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <span
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs"
            style={{
              borderColor: "oklch(0.6762 0.0567 132.4479 / 0.2)",
              background: "oklch(0.6762 0.0567 132.4479 / 0.05)",
              color: "#b4b4b4",
              boxShadow:
                "0 0 20px oklch(0.6762 0.0567 132.4479 / 0.06), inset 0 0 12px oklch(0.6762 0.0567 132.4479 / 0.03)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "oklch(0.6762 0.0567 132.4479)" }}
            />
            All plans live — hosting + AI models + 7 channels included
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.12)}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
          style={{ color: "#eeeeee" }}
        >
          Your AI Agents.{" "}
          <span style={{ color: "oklch(0.6762 0.0567 132.4479)" }}>
            Managed.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.24)}
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#b4b4b4" }}
        >
          Deploy AI agents on WhatsApp, Telegram, Discord, and more.
          Dedicated VPS. Bundled AI models. Zero DevOps. Live in 24 hours.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.36)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="/register"
            className="group flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all duration-200 hover:shadow-lg"
            style={{
              borderRadius: "var(--radius)",
              background: "var(--cream)",
              color: "var(--cream-foreground)",
              boxShadow: "0 0 24px rgba(255, 224, 194, 0.12)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 32px rgba(255, 224, 194, 0.22)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 24px rgba(255, 224, 194, 0.12)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started — $59/mo
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </a>
          <a
            href="#product-tour"
            className="flex items-center gap-2 px-6 py-3 text-sm transition-colors duration-200 hover:text-[#eeeeee]"
            style={{
              borderRadius: "var(--radius)",
              border: "1px solid #201e18",
              color: "#b4b4b4",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(238, 238, 238, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#201e18";
            }}
          >
            See It In Action ↓
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          {...fadeUp(0.48)}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm"
        >
          {[
            { icon: Server, label: "Dedicated VPS" },
            { icon: Bot, label: "AI models included" },
            { icon: Zap, label: "Live in 24 hours" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2"
              style={{ color: "#b4b4b4" }}
            >
              <Icon
                size={16}
                style={{ color: "oklch(0.6762 0.0567 132.4479)" }}
              />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
