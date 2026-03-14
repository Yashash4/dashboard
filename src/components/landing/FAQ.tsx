"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What AI models are included?",
    a: "Every plan includes production-ready AI models like Kimi K2.5 and MiniMax M2.5. Pro and Ultra plans get access to the full model library with instant switching. No API keys needed. No per-token billing.",
  },
  {
    q: "What messaging channels are supported?",
    a: "ClawHQ supports 7 channels: WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat. All are included on every plan at no extra cost. 5 are self-service from your dashboard. WhatsApp and Signal require a one-time setup by our team.",
  },
  {
    q: "Is this shared hosting?",
    a: "No. Every ClawHQ instance runs on a dedicated server. Your CPU, RAM, and storage are guaranteed and not shared with any other customer. You can verify this from your dashboard's real-time resource monitoring.",
  },
  {
    q: "How long does setup take?",
    a: "Your instance is provisioned, configured, and verified within 24 hours of signup. Every setup goes through a 12-step automated process including DNS, SSL, AI model configuration, and end-to-end testing.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. Your plan price includes everything: dedicated VPS, AI models, all messaging channels, dashboard access, managed infrastructure, updates, backups, and support. No API fees. No channel add-ons. No bandwidth overage charges.",
  },
  {
    q: "Is there a free trial?",
    a: "No. We provision dedicated infrastructure for each customer, which costs real money from minute one. Instead, we give you full transparency: every spec, every feature, every limitation is on this page. You know exactly what you're getting before you pay.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. Upgrade anytime from your dashboard — the change takes effect immediately. Your channels, agents, and data all carry over. No migration. No downtime. Downgrade anytime — it takes effect at the end of your current billing cycle.",
  },
  {
    q: "What happens if my server crashes?",
    a: "Your instance automatically restarts on crash. Automated health checks run every 2 minutes — if the gateway becomes unresponsive, it triggers automatic recovery. Downtime is measured in seconds, not minutes.",
  },
  {
    q: "Do you offer refunds?",
    a: "We do not offer refunds after provisioning, because we allocate dedicated resources for your instance immediately. You can cancel anytime — your service continues until the end of your billing period.",
  },
  {
    q: "What happens if ClawHQ shuts down?",
    a: "Your instance runs standard OpenClaw — the same open-source platform anyone can run. If ClawHQ ever ceases operations, we provide advance notice, full data exports, and documentation to help you migrate. You are never locked into proprietary technology.",
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: typeof faqs[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-5 text-left"
      >
        <span className="text-sm font-medium pr-4">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pr-8">
          {faq.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Questions? Straight answers.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.q}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
