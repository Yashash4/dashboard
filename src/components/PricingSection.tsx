import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);

  const tiers = [
    {
      name: "Starter",
      tagline: "For individuals & small teams",
      price: annual ? "$599" : "$59",
      period: annual ? "/year" : "/mo",
      badge: null,
      cta: "Get Started",
      highlighted: false,
      specs: [
        "2 vCPU · 8 GB RAM · 100 GB NVMe",
        "Kimi K2.5 + MiniMax M2.5 + 1 more",
        "128K context window",
        "All messaging channels",
        "Managed updates & backups",
        "Dashboard on your subdomain",
        "Email & ticket support",
      ],
    },
    {
      name: "Pro",
      tagline: "For power users & growing teams",
      price: annual ? "$1,299" : "$129",
      period: annual ? "/year" : "/mo",
      badge: "Coming Soon",
      cta: "Pre-book — $109/mo",
      highlighted: true,
      specs: [
        "8 vCPU · 32 GB RAM · 400 GB NVMe",
        "All Starter models + expanded list",
        "Full context window (no cap)",
        "Agent control dashboard",
        "Chat with agents from dashboard",
        "5× higher rate limits",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      tagline: "Custom-built for your business",
      price: "$999+",
      period: "/mo",
      badge: null,
      cta: "Talk to Us",
      highlighted: false,
      specs: [
        "Custom infrastructure & specs",
        "Custom agents for your use case",
        "Custom planner agents",
        "Custom integrations & workflows",
        "25× rate limits",
        "Dedicated infrastructure",
        "White-glove setup & support",
        "1-on-1 requirement calls",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-28 bg-black border-t border-white/[0.06]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <div className="flex items-center gap-2 mb-4 opacity-60 justify-center">
            <div className="w-8 h-px bg-white" />
            <span className="text-white text-[10px] font-mono tracking-wider">006</span>
            <div className="w-8 h-px bg-white" />
          </div>
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Pricing</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight font-mono">
            Simple pricing. No surprises.
          </h2>
          <p className="mt-3 text-sm text-white/50 font-mono">
            No hidden fees. Cancel anytime. Annual saves ~15%.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center border border-white/10 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 text-xs font-mono tracking-wider transition-all duration-200 ${
                !annual ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 text-xs font-mono tracking-wider transition-all duration-200 ${
                annual ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              ANNUAL
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/10 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="relative bg-black p-8 flex flex-col"
            >
              {tier.badge && (
                <span className="absolute top-4 right-4 text-primary text-[10px] font-bold font-mono px-2.5 py-1 border border-primary/30 uppercase tracking-wider">
                  {tier.badge}
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold tracking-tight font-mono">{tier.name}</h3>
                <p className="text-xs text-white/40 mt-1 font-mono">{tier.tagline}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight font-mono">{tier.price}</span>
                <span className="text-white/40 text-xs font-mono">{tier.period}</span>
              </div>

              <div className="h-px bg-white/10 my-6" />

              <ul className="space-y-3 flex-1">
                {tier.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2.5 text-[13px] text-white/70">
                    <Check size={14} className="text-primary mt-0.5 shrink-0" />
                    <span className="font-mono">{spec}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-8 flex items-center justify-center gap-2 py-3 text-sm font-mono tracking-wider transition-all duration-200 ${
                  tier.highlighted
                    ? "bg-primary text-primary-foreground hover:brightness-110"
                    : "border border-white/20 text-white hover:bg-white hover:text-black"
                }`}
              >
                {tier.cta} <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
