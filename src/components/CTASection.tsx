import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-28 noise-bg">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Stop managing infrastructure.
            <br />
            <span className="text-gradient">Start deploying agents.</span>
          </h2>
          <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Join the first wave of ClawHQ customers. Dedicated server, bundled AI models, every channel — live within 24 hours.
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
              href="mailto:hello@clawhq.tech"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact sales for Enterprise
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
