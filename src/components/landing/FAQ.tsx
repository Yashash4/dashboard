"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What AI models are included?",
    a: "Every plan includes production-ready AI models like Kimi K2.5 and MiniMax M2.5, plus a rotating third model. No API keys needed. No per-token billing. Pro and Ultra plans get access to the full model library with instant switching.",
  },
  {
    q: "What messaging channels are supported?",
    a: "ClawHQ supports 7 channels: WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal, and Webchat. All are included on every plan at no extra cost. 5 are self-service from your dashboard. WhatsApp and Signal require a one-time setup by our team.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. Every plan includes custom domain support with free auto-renewing SSL certificates. Point your domain to your ClawHQ instance and we handle the rest.",
  },
  {
    q: "How does the Agent Builder work?",
    a: "Available on Pro and above. Describe what you want your agent to do, or fill in a structured form. AI generates the agent configuration, personality, and instructions. One-click deploy. You can also build agents manually with full control over every setting.",
  },
  {
    q: "What agents come pre-built?",
    a: "The Agent Store includes 7 free agents at launch: Support, Research, Writer, Data Analyst, Sales Rep, Code Reviewer, and Manager. Deploy any of them in one click. Each comes with tested prompts and configurations.",
  },
  {
    q: "Is my data secure?",
    a: "Your data stays on YOUR dedicated VPS. We don't access your conversations, documents, knowledge base, or agent configurations. Account data (email, name, subscription) is stored securely on our servers. VPS credentials are encrypted at rest.",
  },
  {
    q: "Can I access my agents via API?",
    a: "Pro plan and above includes full REST API access with SSE streaming, Python and JavaScript SDKs, and 22 enterprise API features. Send messages, manage agents, configure webhooks, and more programmatically.",
  },
  {
    q: "What's Mission Control?",
    a: "Mission Control is the Ultra-exclusive command center for managing AI agent teams. It includes kanban task boards with drag-drop, real-time agent monitoring, session traces with Gantt timelines, automation rules, and time tracking. Think of it as a project management tool specifically designed for AI agents.",
  },
  {
    q: "What's the Knowledge Base?",
    a: "Available on Pro and above. Upload documents, URLs, or paste text. ClawHQ processes them into searchable chunks with vector embeddings. Your agents can then search this knowledge base to answer questions accurately — this is called RAG (Retrieval-Augmented Generation).",
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
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. Upgrade anytime from your dashboard — the change takes effect immediately. Your channels, agents, and data all carry over. No migration. No downtime. Downgrade anytime — it takes effect at the end of your current billing cycle.",
  },
  {
    q: "What happens if my server crashes?",
    a: "Your instance automatically restarts on crash. Automated health checks run every 2 minutes — if the gateway becomes unresponsive, it triggers automatic recovery. Downtime is measured in seconds, not minutes.",
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: (typeof faqs)[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border">
      <button onClick={onToggle} className="flex items-center justify-between w-full py-5 text-left">
        <span className="text-sm font-medium pr-4">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>
        <p className="text-sm text-muted-foreground leading-relaxed pr-8">{faq.a}</p>
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
          <p className="text-xs text-primary uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Questions? Straight answers.</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} faq={faq} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
