import { ArrowRight } from "lucide-react";
import HeroAsciiBackground from "@/components/ui/hero-ascii";

const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden bg-black">
      <HeroAsciiBackground />

      {/* Corner Frame Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-white/30 z-20" />
      <div className="absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-white/30 z-20" />
      <div className="absolute bottom-12 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-white/30 z-20" />
      <div className="absolute bottom-12 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-white/30 z-20" />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center pt-16 lg:pt-0">
        <div className="container mx-auto px-6 lg:px-16 lg:ml-[10%]">
          <div className="max-w-lg relative">
            {/* Top decorative line */}
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <div className="w-8 h-px bg-white" />
              <span className="text-white text-[10px] font-mono tracking-wider">001</span>
              <div className="flex-1 h-px bg-white" />
            </div>

            {/* Title with dithered accent */}
            <div className="relative">
              <div className="hidden lg:block absolute -left-3 top-0 bottom-0 w-1 dither-pattern opacity-40" />
              <h1
                className="text-3xl lg:text-5xl font-bold text-white mb-3 lg:mb-4 leading-tight font-mono tracking-wider"
                style={{ letterSpacing: "0.1em" }}
              >
                YOUR OPENCLAW.
                <span className="block text-white/90 mt-1 lg:mt-2">
                  FULLY MANAGED.
                </span>
              </h1>
            </div>

            {/* Decorative dots */}
            <div className="hidden lg:flex gap-1 mb-3 opacity-40">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />
              ))}
            </div>

            {/* Description */}
            <div className="relative">
              <p className="text-xs lg:text-base text-gray-300 mb-5 lg:mb-6 leading-relaxed font-mono opacity-80">
                Dedicated VPS, bundled AI models, every messaging channel.
                No API keys. No config. We handle everything.
              </p>
              <div
                className="hidden lg:block absolute -right-4 top-1/2 w-3 h-3 border border-white opacity-30"
                style={{ transform: "translateY(-50%)" }}
              >
                <div
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-white"
                  style={{ transform: "translate(-50%, -50%)" }}
                />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <a
                href="#pricing"
                className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-primary text-primary-foreground font-mono text-xs lg:text-sm border border-primary hover:brightness-110 transition-all duration-200 group inline-flex items-center gap-2"
              >
                <span className="hidden lg:block absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="hidden lg:block absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                GET STARTED — $59/MO
                <ArrowRight size={14} />
              </a>

              <a
                href="#how-it-works"
                className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent border border-white/50 text-white font-mono text-xs lg:text-sm hover:bg-white hover:text-black transition-all duration-200 inline-flex items-center gap-2"
              >
                HOW IT WORKS
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Bottom technical notation */}
            <div className="hidden lg:flex items-center gap-2 mt-6 opacity-40">
              <span className="text-white text-[9px] font-mono">∞</span>
              <div className="flex-1 h-px bg-white" />
              <span className="text-white text-[9px] font-mono">CLAWHQ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-6 text-[8px] lg:text-[9px] font-mono text-white/50">
            <span className="hidden lg:inline">SYSTEM.ACTIVE</span>
            <span className="lg:hidden">SYS.ACT</span>
            <div className="hidden lg:flex gap-1">
              {[14, 8, 12, 6, 16, 10, 7, 13].map((h, i) => (
                <div key={i} className="w-1 bg-white/30" style={{ height: `${h}px` }} />
              ))}
            </div>
            <span>V1.0.0</span>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 text-[8px] lg:text-[9px] font-mono text-white/50">
            <span className="hidden lg:inline">◐ RENDERING</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-1 h-1 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
            <span className="hidden lg:inline">ONLINE</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
