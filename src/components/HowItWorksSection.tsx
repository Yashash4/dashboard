"use client";

import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Server, MessageSquare, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose Your Plan",
    icon: CreditCard,
    description: "Pick Starter, Pro, or Ultra. Pay monthly or yearly.",
  },
  {
    number: "02",
    title: "We Build Your Server",
    icon: Server,
    description: "VPS provisioned, OpenClaw installed, DNS configured. Automatic.",
  },
  {
    number: "03",
    title: "Connect Your Channels",
    icon: MessageSquare,
    description: "Link WhatsApp, Telegram, Slack — any messaging platform.",
  },
  {
    number: "04",
    title: "Deploy Your Agents",
    icon: Rocket,
    description: "Start deploying AI agents immediately. No infrastructure to manage.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 bg-background overflow-hidden"
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
              003
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-heading mb-4">
            From signup to deployed in 5 minutes
          </h2>
        </motion.div>

        {/* Desktop Timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="hidden lg:block relative"
        >
          {/* Connecting Line */}
          <div className="absolute top-16 left-0 right-0 h-[2px] bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={stepVariants}
                className="relative"
              >
                {/* Step Circle */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-2 border-primary bg-background flex items-center justify-center relative z-10">
                      <step.icon className="w-12 h-12 text-primary" />
                    </div>
                    {/* Connecting Dots */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-1/2 -right-8 w-16 h-[2px] border-t-2 border-dashed border-white/20" />
                    )}
                  </div>
                </div>

                {/* Step Content */}
                <div className="text-center space-y-3">
                  <div className="font-mono text-primary text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white font-heading">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile/Tablet Timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="lg:hidden relative"
        >
          {/* Vertical Connecting Line */}
          <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
          </div>

          {/* Steps */}
          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={stepVariants}
                className="relative flex gap-6 items-start"
              >
                {/* Step Circle */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-primary bg-background flex items-center justify-center relative z-10">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  {/* Connecting Line Segment */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-16 w-[2px] h-12 border-l-2 border-dashed border-white/20" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-2 space-y-2">
                  <div className="font-mono text-primary text-xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white font-heading">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
