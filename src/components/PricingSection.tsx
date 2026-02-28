import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);

  const tiers = [
    {
      name: "Starter",
      price: annual ? "$599" : "$59",
      period: annual ? "/year" : "/mo",
      badge: null,
      cta: "Get Started",
      ctaHref: "#",
      highlight: false,
      specs: [
        "2 vCPU cores · 8 GB RAM",
        "100 GB NVMe · 8 TB bandwidth",
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
      price: annual ? "$1,299" : "$129",
      period: annual ? "/year" : "/mo",
      badge: "Coming Soon",
      cta: "Pre-book at $109/mo",
      ctaHref: "#",
      highlight: true,
      specs: [
        "8 vCPU cores · 32 GB RAM",
        "400 GB NVMe · 32 TB bandwidth",
        "All Starter models + more",
        "Full context window (no cap)",
        "Agent control dashboard",
        "Chat with agents from dashboard",
        "5× rate limits",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "$999+",
      period: "/mo",
      badge: null,
      cta: "Talk to Us",
      ctaHref: "#",
      highlight: false,
      specs: [
        "Custom infrastructure",
        "Custom agents built for you",
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
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            No hidden fees. No surprise bills. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual <span className="text-xs opacity-75">Save ~15%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl p-8 flex flex-col ${
                tier.highlight
                  ? "bg-card border-2 border-primary glow-primary"
                  : "bg-card border border-border"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {tier.badge}
                </span>
              )}

              <h3 className="text-xl font-bold">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                <span className="text-muted-foreground text-sm">{tier.period}</span>
              </div>

              <ul className="mt-8 space-y-3 flex-1">
                {tier.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2 text-sm text-secondary-foreground">
                    <Check size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>

              <a
                href={tier.ctaHref}
                className={`mt-8 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 ${
                  tier.highlight
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground border border-border"
                }`}
              >
                {tier.cta} <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
