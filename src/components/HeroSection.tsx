"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ParticleGrid } from "@/components/ui/particle-grid";

const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      {/* Particle grid background */}
      <div className="absolute inset-0">
        <ParticleGrid />
      </div>

      {/* Radial gradient overlay — darkens edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%)]" />

      {/* Corner Frame Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-white/20 z-20" />
      <div className="absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-white/20 z-20" />
      <div className="absolute bottom-12 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-white/20 z-20" />
      <div className="absolute bottom-12 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-white/20 z-20" />

      {/* Main Content — centered */}
      <div className="relative z-10 flex min-h-screen items-center justify-center pt-16 lg:pt-0">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          {/* Tag line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-px w-8 bg-primary/50" />
            <span className="text-primary text-[11px] font-mono tracking-[0.2em] uppercase">
              Managed OpenClaw Hosting
            </span>
            <div className="h-px w-8 bg-primary/50" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
          >
            Deploy AI Agents.
            <br />
            <span className="text-gradient">Not Infrastructure.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base lg:text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Dedicated VPS, bundled AI models, every messaging channel.
            No API keys. No config. We handle everything so you can focus on building.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/register"
              className="group relative px-8 py-3.5 bg-primary text-primary-foreground font-mono text-sm border border-primary hover:brightness-110 transition-all duration-200 inline-flex items-center gap-2.5 glow-primary-sm"
            >
              GET STARTED — $59/MO
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>

            <a
              href="#how-it-works"
              className="px-8 py-3.5 bg-transparent border border-white/20 text-white/80 font-mono text-sm hover:border-white/40 hover:text-white transition-all duration-200 inline-flex items-center gap-2.5"
            >
              SEE HOW IT WORKS
              <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 flex items-center justify-center gap-6 text-[11px] font-mono text-white/30"
          >
            <span>No credit card required</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>5-minute setup</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>Cancel anytime</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom Technical Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-6 text-[8px] lg:text-[9px] font-mono text-white/40">
            <span className="hidden lg:inline">SYSTEM.ACTIVE</span>
            <span className="lg:hidden">SYS.ACT</span>
            <div className="hidden lg:flex gap-1">
              {[14, 8, 12, 6, 16, 10, 7, 13].map((h, i) => (
                <div key={i} className="w-1 bg-white/20" style={{ height: `${h}px` }} />
              ))}
            </div>
            <span>V2.0.0</span>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 text-[8px] lg:text-[9px] font-mono text-white/40">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-1 h-1 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
            <span>ONLINE</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
