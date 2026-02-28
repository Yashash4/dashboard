import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-28 bg-black border-t border-white/[0.06]">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4 opacity-60 justify-center">
            <div className="w-8 h-px bg-white" />
            <span className="text-white text-[10px] font-mono tracking-wider">008</span>
            <div className="w-8 h-px bg-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-mono">
            Stop managing infrastructure.
            <br />
            <span className="text-primary">Start deploying agents.</span>
          </h2>
          <p className="mt-6 text-sm text-white/50 max-w-md mx-auto leading-relaxed font-mono">
            Join the first wave of ClawHQ customers. Dedicated server, bundled AI models, every channel — live within 24 hours.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-7 py-3.5 text-sm font-mono tracking-wider hover:brightness-110 transition-all duration-200"
            >
              GET STARTED — $59/MO
              <ArrowRight size={16} />
            </a>
            <a
              href="mailto:hello@clawhq.tech"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-mono tracking-wider"
            >
              CONTACT SALES
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
