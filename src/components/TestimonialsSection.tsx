"use client";

import React from "react";
import { motion } from "framer-motion";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote:
        "ClawHQ eliminated our entire DevOps overhead. We went from 3 days of setup to 5 minutes.",
      name: "Alex Chen",
      role: "CTO at NexusAI",
      initial: "A",
    },
    {
      quote:
        "The multi-channel support is incredible. Our AI agents now respond on WhatsApp, Telegram, and Slack simultaneously.",
      name: "Sarah Kim",
      role: "Lead Engineer at Botflow",
      initial: "S",
    },
    {
      quote:
        "Finally, a managed platform that doesn't treat AI hosting like a black box. Full root access + zero ops is the dream.",
      name: "Marcus Rivera",
      role: "Founder at AgentStack",
      initial: "M",
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
    <section id="testimonials" className="py-24 px-6" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-white/20" />
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white/40">007</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)]">
            Loved by developers worldwide
          </h2>
        </div>

        {/* Testimonial Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="border border-white/10 bg-white/[0.02] p-8 flex flex-col"
              style={{
                borderRadius: 0,
                transform: index % 2 === 0 ? "rotate(1deg)" : "rotate(-1deg)",
              }}
            >
              {/* Quote */}
              <p className="text-white/80 leading-relaxed mb-6 flex-grow">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg font-[family-name:var(--font-space-grotesk)]"
                >
                  {testimonial.initial}
                </div>
                {/* Name & Role */}
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-white/60">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
