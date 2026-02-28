import { ArrowRight, Check } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import dashboardPreview from "@/assets/dashboard-preview.png";

const HeroSection = () => {
  return (
    <section className="relative pt-24">
      {/* Hero Background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />

        <div className="relative container mx-auto px-4 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight max-w-4xl mx-auto">
            Your AI agents, built and{" "}
            <span className="text-gradient">managed for you</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            All-inclusive — hosting, AI models, channels, dashboard. No API keys needed. Just use it.
          </p>
          <div className="mt-10">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity glow-primary"
            >
              Get Started <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Terminal Bar */}
      <div className="dashed-border">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-primary font-bold">$</span>
            <span className="text-muted-foreground">
              clawhq deploy <span className="text-foreground/50">@</span> yourbusiness.com
            </span>
          </div>
          <a
            href="#pricing"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Start for $59/mo <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="container mx-auto px-4 py-6 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
        {["Setup within 24 hours", "No API keys needed", "All channels included"].map((badge) => (
          <div key={badge} className="flex items-center gap-2">
            <Check size={16} className="text-primary" />
            <span>{badge}</span>
          </div>
        ))}
      </div>

      {/* Dashboard Preview */}
      <div className="container mx-auto px-4 pb-16">
        <div className="relative mx-auto max-w-5xl rounded-xl overflow-hidden border border-border glow-primary">
          <img
            src={dashboardPreview}
            alt="ClawHQ Dashboard showing visitor analytics, pageviews, and revenue metrics"
            className="w-full"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
