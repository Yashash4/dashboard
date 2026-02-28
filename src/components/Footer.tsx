import { ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-black border-t border-white/10">
      {/* Corner Frame Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 lg:w-10 lg:h-10 border-t border-l border-white/20 z-10" />
      <div className="absolute top-0 right-0 w-8 h-8 lg:w-10 lg:h-10 border-t border-r border-white/20 z-10" />
      <div className="absolute bottom-0 left-0 w-8 h-8 lg:w-10 lg:h-10 border-b border-l border-white/20 z-10" />
      <div className="absolute bottom-0 right-0 w-8 h-8 lg:w-10 lg:h-10 border-b border-r border-white/20 z-10" />

      {/* Terminal command bar */}
      <div className="border-b border-white/[0.06]">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-[10px] text-white/30">
            <span className="text-primary/60">$</span>
            <span>clawhq deploy <span className="text-white/15">@</span> yourbusiness.com</span>
          </div>
          <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-white/20">
            <span>UPTIME: 99.97%</span>
            <div className="w-1.5 h-1.5 bg-emerald-500/50" />
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 mb-16">
          {/* Brand block */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold font-mono">C</span>
              </div>
              <span className="text-white text-lg font-semibold tracking-widest font-mono uppercase">
                ClawHQ
              </span>
              <div className="h-4 w-px bg-white/15" />
              <span className="text-white/20 text-[9px] font-mono">EST. 2025</span>
            </div>

            <p className="text-sm text-white/35 leading-relaxed font-mono mb-6">
              Managed OpenClaw hosting with bundled AI models.
              Your agents, built and managed for you.
            </p>

            {/* Decorative dots */}
            <div className="flex gap-1 opacity-20 mb-8">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />
              ))}
            </div>

            {/* CTA in footer */}
            <a
              href="#pricing"
              className="relative inline-flex items-center gap-2 px-5 py-2 bg-transparent border border-white/20 text-white/60 font-mono text-[11px] tracking-wider hover:bg-white hover:text-black transition-all duration-200 group"
            >
              GET STARTED
              <ArrowRight size={12} />
            </a>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 lg:gap-16">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-4 h-px bg-white/20" />
                <h4 className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Product</h4>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "FAQ", href: "#faq" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-2 text-xs text-white/25 hover:text-white transition-colors font-mono group"
                  >
                    <span className="text-white/10 group-hover:text-primary transition-colors">→</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-4 h-px bg-white/20" />
                <h4 className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Company</h4>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Contact", href: "mailto:hello@clawhq.tech" },
                  { label: "Terms", href: "#" },
                  { label: "Privacy", href: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-2 text-xs text-white/25 hover:text-white transition-colors font-mono group"
                  >
                    <span className="text-white/10 group-hover:text-primary transition-colors">→</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-4 h-px bg-white/20" />
                <h4 className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Connect</h4>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Twitter / X", href: "#" },
                  { label: "Discord", href: "#" },
                  { label: "GitHub", href: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-2 text-xs text-white/25 hover:text-white transition-colors font-mono group"
                  >
                    <span className="text-white/10 group-hover:text-primary transition-colors">→</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Technical separator */}
        <div className="flex items-center gap-3 opacity-20">
          <div className="w-2.5 h-2.5 border border-white relative">
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-white/40 via-white/20 to-transparent" />
          <span className="text-[8px] font-mono text-white tracking-widest">SYS.INFO</span>
          <div className="flex-1 h-px bg-gradient-to-l from-white/40 via-white/20 to-transparent" />
          <div className="w-2.5 h-2.5 border border-white relative">
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white" />
          </div>
        </div>
      </div>

      {/* Bottom system status bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 lg:gap-8">
            <p className="text-[10px] text-white/20 font-mono tracking-wider">
              © 2026 CLAWHQ
            </p>
            <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-white/15">
              <span>LAT: 37.7749°</span>
              <div className="w-0.5 h-0.5 bg-white/20 rounded-full" />
              <span>LONG: 122.4194°</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden lg:flex gap-1">
              {[10, 6, 14, 8, 12, 5, 11, 9].map((h, i) => (
                <div key={i} className="w-1 bg-white/10" style={{ height: `${h}px` }} />
              ))}
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/20">
              <span className="hidden sm:inline">◐ FRAME: ∞</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-primary/50 animate-pulse" />
                <div className="w-1 h-1 bg-primary/30 animate-pulse" style={{ animationDelay: "0.2s" }} />
                <div className="w-1 h-1 bg-primary/15 animate-pulse" style={{ animationDelay: "0.4s" }} />
              </div>
              <span>SYSTEM.ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
