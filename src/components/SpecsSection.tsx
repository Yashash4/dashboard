"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, MemoryStick, HardDrive, Wifi, Zap, Brain } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "$59/mo",
    highlighted: false,
    specs: [
      { icon: Cpu, label: "2 vCPU", sublabel: "Processor cores" },
      { icon: MemoryStick, label: "8GB RAM", sublabel: "Memory" },
      { icon: HardDrive, label: "100GB NVMe", sublabel: "Storage" },
      { icon: Wifi, label: "8TB Transfer", sublabel: "Bandwidth" },
      { icon: Zap, label: "1X Credits", sublabel: "API usage" },
      { icon: Brain, label: "128K Context", sublabel: "Token limit" },
    ],
  },
  {
    name: "Pro",
    price: "$129/mo",
    highlighted: false,
    specs: [
      { icon: Cpu, label: "8 vCPU", sublabel: "Processor cores" },
      { icon: MemoryStick, label: "32GB RAM", sublabel: "Memory" },
      { icon: HardDrive, label: "400GB NVMe", sublabel: "Storage" },
      { icon: Wifi, label: "32TB Transfer", sublabel: "Bandwidth" },
      { icon: Zap, label: "2X Credits", sublabel: "API usage" },
      { icon: Brain, label: "Full Context", sublabel: "Unlimited tokens" },
    ],
  },
  {
    name: "Ultra",
    price: "$350/mo",
    highlighted: true,
    specs: [
      { icon: Cpu, label: "16 vCPU", sublabel: "Processor cores" },
      { icon: MemoryStick, label: "64GB RAM", sublabel: "Memory" },
      { icon: HardDrive, label: "800GB NVMe", sublabel: "Storage" },
      { icon: Wifi, label: "64TB Transfer", sublabel: "Bandwidth" },
      { icon: Zap, label: "5X Credits", sublabel: "API usage" },
      { icon: Brain, label: "Full Context", sublabel: "Unlimited tokens" },
    ],
  },
  {
    name: "Enterprise",
    price: "$999+/mo",
    highlighted: false,
    specs: [
      { icon: Cpu, label: "Custom", sublabel: "Processor cores" },
      { icon: MemoryStick, label: "Custom", sublabel: "Memory" },
      { icon: HardDrive, label: "Custom", sublabel: "Storage" },
      { icon: Wifi, label: "Custom", sublabel: "Bandwidth" },
      { icon: Zap, label: "Custom Credits", sublabel: "API usage" },
      { icon: Brain, label: "Full Context", sublabel: "White-glove support" },
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export function SpecsSection() {
  return (
    <section
      id="specs"
      className="relative py-24 md:py-32 bg-background overflow-hidden border-t border-white/[0.06]"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-block mb-4">
            <span className="text-primary font-mono text-sm tracking-widest">
              006
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-heading mb-4">
            Raw power for every tier
          </h2>
        </motion.div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              className="relative"
            >
              {tier.highlighted && (
                <>
                  {/* Glow Effect */}
                  <div className="absolute -inset-[1px] bg-primary/20 blur-sm" />
                  <div className="absolute -inset-[2px] bg-gradient-to-b from-primary/30 to-transparent opacity-50" />
                </>
              )}

              <div
                className={`relative border ${
                  tier.highlighted
                    ? "border-primary/30 bg-primary/[0.02]"
                    : "border-white/10 bg-background"
                } p-6 h-full flex flex-col`}
              >
                {/* Tier Header */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h3
                    className={`text-lg font-bold font-mono uppercase tracking-wider ${
                      tier.highlighted ? "text-primary" : "text-white"
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <div className="mt-2 text-2xl font-bold font-mono text-white">
                    {tier.price}
                  </div>
                </div>

                {/* Specs List */}
                <div className="space-y-4 flex-1">
                  {tier.specs.map((spec, specIndex) => (
                    <div key={specIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <spec.icon
                          className={`w-4 h-4 ${
                            tier.highlighted
                              ? "text-primary/70"
                              : "text-white/40"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-semibold font-mono ${
                            tier.highlighted ? "text-white" : "text-white/90"
                          }`}
                        >
                          {spec.label}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {spec.sublabel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Popular Badge for Ultra */}
                {tier.highlighted && (
                  <div className="mt-6 pt-6 border-t border-primary/20">
                    <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30">
                      <span className="text-xs font-mono text-primary uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SpecsSection;
