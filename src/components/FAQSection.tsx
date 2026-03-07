"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "What is ClawHQ?",
      answer:
        "ClawHQ is a managed hosting platform for OpenClaw. We provision a dedicated VPS, install OpenClaw, configure everything, and give you a dashboard to manage your AI agents.",
    },
    {
      question: "What is OpenClaw?",
      answer:
        "OpenClaw is an open-source AI agent framework. It lets you build, deploy, and manage autonomous AI agents that can interact across multiple messaging channels.",
    },
    {
      question: "How long does setup take?",
      answer:
        "About 5 minutes. Choose a plan, we automatically provision your VPS, install OpenClaw, configure DNS and SSL, and you're ready to deploy agents.",
    },
    {
      question: "Which AI models are supported?",
      answer:
        "500+ models including GPT-4, Claude, Llama, Mistral, Kimi, and more. Switch between models instantly from your dashboard.",
    },
    {
      question: "Which messaging channels are supported?",
      answer:
        "WhatsApp, Telegram, Slack, Discord, Instagram, and more. Connect any channel from your dashboard in one click.",
    },
    {
      question: "Do I get root access to my VPS?",
      answer:
        "Yes. You get full root SSH access to your dedicated VPS. It's your server — we just make it easy to manage.",
    },
    {
      question: "Can I bring my own API keys?",
      answer:
        "Yes. Use our bundled AI credits or bring your own API keys from OpenAI, Anthropic, or any provider.",
    },
    {
      question: "What happens if I cancel?",
      answer:
        "You keep access until the end of your billing period. We don't delete your data for 30 days after cancellation.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "We don't offer a free trial, but you can cancel anytime within the first 7 days for a full refund.",
    },
    {
      question: "How is ClawHQ different from running OpenClaw myself?",
      answer:
        "We handle everything: server provisioning, DNS, SSL, updates, monitoring, and backups. You focus on building agents, not managing infrastructure.",
    },
  ];

  return (
    <section id="faq" className="py-24 px-6" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column - Header */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-white/20" />
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white/40">008</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6">
              Frequently asked questions
            </h2>
            <p className="text-white/60 mb-4">
              Still have questions?{" "}
              <a
                href="mailto:hello@clawhq.tech"
                className="text-primary hover:underline transition-colors"
              >
                hello@clawhq.tech
              </a>
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-white/10 bg-white/[0.02] px-6"
                  style={{ borderRadius: 0 }}
                >
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4 text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-white/70 leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
