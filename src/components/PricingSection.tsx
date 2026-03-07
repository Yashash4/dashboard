"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "For individuals getting started",
      monthlyPrice: 59,
      annualPrice: 599,
      features: [
        "Dedicated VPS (2 vCPU/8GB)",
        "500+ AI Models",
        "Agent deployment",
        "All channels",
        "128K context",
        "Email + ticket support",
      ],
      cta: "Get Started",
      href: "/register",
      highlighted: false,
      badge: null,
    },
    {
      name: "Pro",
      description: "For teams that need more power",
      monthlyPrice: 129,
      annualPrice: 1299,
      features: [
        "All Starter features",
        "8 vCPU/32GB VPS",
        "Instant model switching",
        "Agent builder",
        "Real-time monitoring",
        "Priority support",
      ],
      cta: "Get Started",
      href: "/register",
      highlighted: false,
      badge: "Coming Soon",
    },
    {
      name: "Ultra",
      description: "For power users and agencies",
      monthlyPrice: 350,
      annualPrice: 3499,
      features: [
        "All Pro features",
        "16 vCPU/64GB VPS",
        "Mission Control",
        "5X credits",
        "Advanced analytics",
        "Time travel debugging",
      ],
      cta: "Get Started",
      href: "/register",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      description: "For organizations at scale",
      monthlyPrice: 999,
      annualPrice: null,
      features: [
        "Everything in Ultra",
        "Custom VPS specs",
        "Dedicated support engineer",
        "SLA guarantee",
        "Custom integrations",
      ],
      cta: "Talk to Us",
      href: "mailto:hello@clawhq.tech",
      highlighted: false,
      badge: null,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="pricing" className="py-24 px-6" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-white/20" />
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white/40">006</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6">
            Simple, transparent pricing
          </h2>

          {/* Billing Toggle */}
          <div className="flex items-center gap-4 justify-start">
            <span className={`text-sm ${!isAnnual ? "text-white" : "text-white/40"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-8 bg-white/10 border border-white/20 transition-colors hover:bg-white/[0.15]"
              style={{ borderRadius: 0 }}
              aria-label="Toggle annual billing"
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-primary"
                initial={false}
                animate={{ left: isAnnual ? "calc(100% - 28px)" : "4px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${isAnnual ? "text-white" : "text-white/40"}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="text-sm text-primary font-medium">Save ~15%</span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              className={`relative border bg-white/[0.02] p-8 flex flex-col ${
                plan.highlighted
                  ? "border-primary/40 shadow-[0_0_20px_rgba(255,61,0,0.15)]"
                  : "border-white/10"
              }`}
              style={{ borderRadius: 0 }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 text-xs font-[family-name:var(--font-jetbrains-mono)] uppercase tracking-wider ${
                    plan.highlighted
                      ? "bg-primary text-black"
                      : "bg-white/10 text-white/60 border border-white/20"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-white/60 mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-8">
                {plan.annualPrice === null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plan.monthlyPrice}+</span>
                    <span className="text-white/60">/mo</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-white/60">
                        {isAnnual ? "/yr" : "/mo"}
                      </span>
                    </div>
                    {isAnnual && (
                      <p className="text-xs text-white/40 mt-1">
                        ${(plan.annualPrice / 12).toFixed(0)}/mo billed annually
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.href.startsWith("mailto:") ? (
                <a
                  href={plan.href}
                  className={`block w-full py-3 px-6 text-center font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-primary text-black hover:bg-primary/90"
                      : "bg-white/5 text-white border border-white/20 hover:bg-white/10"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.href}
                  className={`block w-full py-3 px-6 text-center font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-primary text-black hover:bg-primary/90"
                      : "bg-white/5 text-white border border-white/20 hover:bg-white/10"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {plan.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
