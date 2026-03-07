"use client";

import { motion } from "framer-motion";
import { Server, Brain, Bot, MessageSquare, Shield, Headphones } from "lucide-react";

const features = [
  {
    icon: Server,
    title: "Dedicated VPS",
    desc: "Your own virtual private server with full root access. 2-16 vCPU, 8-64GB RAM.",
    span: "col-span-1",
  },
  {
    icon: Brain,
    title: "AI Model Hub",
    desc: "Access 500+ AI models. Switch models instantly. No API keys needed.",
    span: "col-span-1",
  },
  {
    icon: Bot,
    title: "Agent Framework",
    desc: "Deploy autonomous AI agents that work 24/7 across all channels.",
    span: "col-span-1",
  },
  {
    icon: MessageSquare,
    title: "Multi-Channel",
    desc: "WhatsApp, Telegram, Slack, Discord, Instagram — all connected.",
    span: "col-span-1",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Encrypted at rest and in transit. SOC 2 compliant infrastructure.",
    span: "col-span-1",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Priority support from engineers who know your stack.",
    span: "col-span-2",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 bg-background border-t border-white/[0.06]">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white" />
            <span className="text-white text-[10px] font-mono tracking-wider">002</span>
            <div className="w-16 h-px bg-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything you need to deploy AI agents
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Row 1: 2 large cards */}
          {features.slice(0, 2).map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300 p-8 group"
            >
              <feature.icon size={24} className="text-primary mb-5" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}

          {/* Row 2: 3 small cards in a nested grid */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.slice(2, 5).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index + 2) * 0.1 }}
                className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300 p-8 group"
              >
                <feature.icon size={24} className="text-primary mb-5" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Row 3: 1 full-width card */}
          {features.slice(5).map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index + 5) * 0.1 }}
              className="md:col-span-2 border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300 p-8 group"
            >
              <feature.icon size={24} className="text-primary mb-5" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
