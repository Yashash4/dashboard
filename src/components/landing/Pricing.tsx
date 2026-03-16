"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, ArrowRight, Shield } from "lucide-react";

const plans = [
  {
    name: "Starter",
    badge: null,
    monthly: 59,
    annual: 599,
    annualSavings: "$109",
    tagline: "All-inclusive. One price. Zero hassle.",
    cta: "Get Started",
    ctaHref: "/pricing",
    highlighted: false,
    features: [
      "Dedicated VPS (2 vCPU, 8GB RAM)",
      "30 AI models included — no API keys",
      "All 7 messaging channels",
      "Agent Store with 7 free pre-built agents",
      "Professional chat with streaming",
      "Custom domain + auto-SSL",
      "Health monitoring + auto-restart",
      "Support with attachments",
    ],
  },
  {
    name: "Pro",
    badge: "Most Popular",
    monthly: 129,
    annual: 1299,
    annualSavings: "$249",
    tagline: "For builders who ship.",
    cta: "Get Pro",
    ctaHref: "/pricing",
    highlighted: true,
    features: [
      "Everything in Starter +",
      "Agent Builder (AI-assisted creation)",
      "Model Playground (compare models)",
      "Knowledge Base with AI search (RAG)",
      "Webhooks (9 events, auto-retry)",
      "Full API Access with SDKs",
      "Logs Explorer + Analytics + Audit Log",
      "8 vCPU, 32GB RAM",
    ],
  },
  {
    name: "Ultra",
    badge: "Most Powerful",
    monthly: 350,
    annual: 3499,
    annualSavings: "$701",
    tagline: "Command your AI workforce.",
    cta: "Go Ultra",
    ctaHref: "/pricing",
    highlighted: false,
    features: [
      "Everything in Pro +",
      "Mission Control command center",
      "Kanban task board for AI agents",
      "Agent orchestration + automation",
      "Session replay with traces",
      "Time tracking + calendar view",
      "16 vCPU, 64GB RAM",
    ],
  },
  {
    name: "Enterprise",
    badge: "White Glove",
    monthly: null,
    annual: null,
    annualSavings: null,
    tagline: "Built around your business.",
    cta: "Talk to Us",
    ctaHref: "mailto:hello@clawhq.tech",
    highlighted: false,
    features: [
      "Custom VPS specs",
      "Custom AI agents built for you",
      "Bespoke integrations & workflows",
      "Dedicated account manager",
      "25x rate limits",
      "White-glove setup + ongoing support",
      "Everything in Ultra included",
    ],
  },
];

const comparisonRows = [
  { label: "vCPU", starter: "2", pro: "8", ultra: "16", enterprise: "Custom" },
  { label: "RAM", starter: "8 GB", pro: "32 GB", ultra: "64 GB", enterprise: "Custom" },
  { label: "NVMe Storage", starter: "100 GB", pro: "400 GB", ultra: "800 GB", enterprise: "Custom" },
  { label: "Bandwidth", starter: "8 TB", pro: "32 TB", ultra: "64 TB", enterprise: "Custom" },
  { label: "AI models included", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Context window", starter: "128K", pro: "Full", ultra: "Full", enterprise: "Full" },
  { label: "Model switching", starter: "5/mo", pro: "Instant", ultra: "Instant", enterprise: "Instant" },
  { label: "All 7 channels", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Agent Store", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Custom domain + SSL", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Health monitoring", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Agent Builder", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Model Playground", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Knowledge Base (RAG)", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Webhooks", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "API Access + SDKs", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Logs Explorer", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Usage Analytics", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Audit Log", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Mission Control", starter: false, pro: false, ultra: true, enterprise: true },
  { label: "Task Board", starter: false, pro: false, ultra: true, enterprise: true },
  { label: "Session Tracking", starter: false, pro: false, ultra: true, enterprise: true },
  { label: "Custom agents built for you", starter: false, pro: false, ultra: false, enterprise: true },
  { label: "Rate limits", starter: "1x", pro: "5x", ultra: "10x", enterprise: "25x" },
  { label: "Support", starter: "Tickets", pro: "Priority", ultra: "Priority", enterprise: "Dedicated" },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-primary mx-auto" />;
  if (value === false) return <Minus size={16} className="text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm">{value}</span>;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            One price. No surprises.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-4">
            Every plan includes AI models, all channels, dedicated VPS, managed
            infrastructure, and full dashboard access. No hidden fees.
          </p>
          <p className="inline-flex items-center gap-2 text-xs text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-full mb-8">
            <Shield size={12} />
            14-day money-back guarantee on all plans
          </p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-card border border-border">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                !annual
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                annual
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual{" "}
              <span className="text-primary text-xs ml-1">Save up to 17%</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative p-6 rounded-lg border ${
                plan.highlighted
                  ? "border-[var(--cream)]/30 bg-card"
                  : "border-border bg-card"
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    plan.highlighted
                      ? "bg-[var(--cream)] text-[var(--cream-foreground)]"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {plan.tagline}
              </p>

              {/* Price */}
              <div className="mb-6">
                {plan.monthly ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        ${annual ? Math.round(plan.annual! / 12) : plan.monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /mo
                      </span>
                    </div>
                    {annual && (
                      <p className="text-xs text-primary mt-1">
                        ${plan.annual}/yr — Save {plan.annualSavings}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">Custom</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Starting at $999/mo
                    </p>
                  </>
                )}
              </div>

              {/* CTA */}
              <a
                href={plan.ctaHref}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 mb-6 ${
                  plan.highlighted
                    ? "bg-[var(--cream)] text-[var(--cream-foreground)]"
                    : "bg-muted text-foreground border border-border"
                }`}
              >
                {plan.cta}
                <ArrowRight size={14} />
              </a>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check
                      size={14}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-center mb-8">
            Compare all plans
          </h3>
          {/* Mobile scroll indicator */}
          <div className="md:hidden flex items-center justify-end gap-1 mb-2 text-[10px] text-muted-foreground">
            Scroll <span aria-hidden="true">&rarr;</span>
          </div>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-muted-foreground font-medium">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                    Starter
                  </th>
                  <th className="text-center py-3 px-4 text-[var(--cream)] font-medium">
                    Pro
                  </th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                    Ultra
                  </th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.starter} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.pro} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.ultra} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CellValue value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
