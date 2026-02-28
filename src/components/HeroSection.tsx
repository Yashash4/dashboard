import { ArrowRight, Check } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import dashboardPreview from "@/assets/dashboard-preview.png";

const HeroSection = () => {
  return (
    <section className="relative pt-16 noise-bg">
      {/* Hero Background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />

        <div className="relative container mx-auto px-4 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              Now accepting Tier 1 customers
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] max-w-4xl mx-auto tracking-tight">
            Your OpenClaw.
            <br />
            <span className="text-gradient">Fully managed.</span>
            <br />
            Just use it.
          </h1>

          <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Dedicated VPS, bundled AI models, every messaging channel.
            No API keys. No config. We handle everything.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-7 py-3.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all duration-200 glow-primary-sm"
            >
              Get Started — $59/mo
              <ArrowRight size={16} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              See how it works
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Terminal Bar */}
      <div className="dashed-border-top dashed-border-bottom">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-primary font-bold">$</span>
            <span className="text-muted-foreground">
              clawhq deploy <span className="text-foreground/30">@</span>{" "}
              <span className="text-secondary-foreground">yourbusiness.com</span>
            </span>
          </div>
          <a
            href="#pricing"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all duration-200 flex items-center gap-2"
          >
            Track for free <ArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="container mx-auto px-4 py-8 flex flex-wrap justify-center gap-x-10 gap-y-3 text-[13px] text-muted-foreground">
        {[
          "Setup within 24 hours",
          "No credit card required for pre-book",
          "All channels included",
        ].map((badge) => (
          <div key={badge} className="flex items-center gap-2">
            <Check size={14} className="text-primary" />
            <span>{badge}</span>
          </div>
        ))}
      </div>

      {/* Dashboard Preview */}
      <div className="container mx-auto px-4 pb-24">
        <div className="relative mx-auto max-w-4xl">
          {/* Browser chrome */}
          <div className="bg-card border border-border rounded-t-xl px-4 py-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="ml-4 flex-1 max-w-xs">
              <div className="bg-secondary rounded-md px-3 py-1 text-xs text-muted-foreground font-mono">
                dashboard.clawhq.tech
              </div>
            </div>
          </div>
          <div className="rounded-b-xl overflow-hidden border border-t-0 border-border glow-primary">
            <img
              src={dashboardPreview}
              alt="ClawHQ agent management dashboard with analytics and channel integrations"
              className="w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
