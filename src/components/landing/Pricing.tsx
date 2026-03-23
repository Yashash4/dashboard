"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Minus } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

/* ─── Plan Data ─── */

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    badge: null,
    monthly: 59,
    annual: 599,
    annualSavings: "$109",
    tagline: "All-inclusive. Zero hassle.",
    cta: "Get Started",
    ctaHref: "/pricing",
    highlighted: false,
    accentVar: "var(--accent)",
    features: [
      "Dedicated VPS (2 vCPU, 8GB RAM)",
      "AI models included — no API keys",
      "All 7 messaging channels",
      "Agent Store (7 free agents)",
      "Custom domain + auto-SSL",
      "Health monitoring + auto-restart",
      "Professional chat interface",
      "Ticket-based support",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    badge: "Most Popular",
    monthly: 129,
    annual: 1299,
    annualSavings: "$249",
    tagline: "For teams that build.",
    cta: "Get Pro",
    ctaHref: "/pricing",
    highlighted: true,
    accentVar: "var(--tier-pro)",
    features: [
      "Everything in Starter +",
      "Agent Builder (AI-assisted)",
      "Model Playground",
      "Knowledge Base with RAG",
      "Webhooks (9 events, auto-retry)",
      "Full API Access with SDKs",
      "Analytics + Logs + Audit Log",
      "4 vCPU, 16GB RAM",
    ],
  },
  {
    id: "ultra" as const,
    name: "Ultra",
    badge: "Most Powerful",
    monthly: 350,
    annual: 3499,
    annualSavings: "$701",
    tagline: "Command your AI workforce.",
    cta: "Go Ultra",
    ctaHref: "/pricing",
    highlighted: false,
    accentVar: "var(--tier-ultra)",
    features: [
      "Everything in Pro +",
      "Mission Control dashboard",
      "Kanban task board",
      "Agent orchestration + automation",
      "Session replay with traces",
      "Time tracking + calendar",
      "8 vCPU, 32GB RAM",
    ],
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    badge: "White Glove",
    monthly: null,
    annual: null,
    annualSavings: null,
    tagline: "Built around your business.",
    cta: "Talk to Us",
    ctaHref: "mailto:hello@clawhq.tech",
    highlighted: false,
    accentVar: "var(--tier-enterprise)",
    features: [
      "Custom VPS specs",
      "Custom AI agents built for you",
      "Bespoke integrations",
      "Dedicated account manager",
      "25x rate limits",
      "White-glove setup + support",
      "Everything in Ultra included",
    ],
  },
];

type PlanId = "starter" | "pro" | "ultra";

/* ─── Comparison Table ─── */

const comparisonRows = [
  { label: "vCPU", starter: "2", pro: "4", ultra: "8", enterprise: "Custom" },
  { label: "RAM", starter: "8 GB", pro: "16 GB", ultra: "32 GB", enterprise: "Custom" },
  { label: "NVMe Storage", starter: "100 GB", pro: "200 GB", ultra: "400 GB", enterprise: "Custom" },
  { label: "AI models", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "All 7 channels", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Agent Store", starter: true, pro: true, ultra: true, enterprise: true },
  { label: "Agent Builder", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Knowledge Base", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "API + Webhooks", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Analytics + Logs", starter: false, pro: true, ultra: true, enterprise: true },
  { label: "Mission Control", starter: false, pro: false, ultra: true, enterprise: true },
  { label: "Task Board", starter: false, pro: false, ultra: true, enterprise: true },
  { label: "Rate limits", starter: "1x", pro: "5x", ultra: "10x", enterprise: "25x" },
  { label: "Support", starter: "Tickets", pro: "Priority", ultra: "Priority", enterprise: "Dedicated" },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={15} className="text-[var(--success)] mx-auto" />;
  if (value === false) return <Minus size={15} className="text-[var(--text-tertiary)]/30 mx-auto" />;
  return <span className="text-[15px]">{value}</span>;
}

/* ─── Main Component ─── */

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<PlanId>("pro");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  function getCtaHref(planId: string) {
    if (planId === "enterprise") return "mailto:hello@clawhq.tech";
    const cycle = annual ? "annual" : "monthly";
    if (isLoggedIn) return `/checkout?plan=${planId}&cycle=${cycle}`;
    return `/register?plan=${planId}&cycle=${cycle}`;
  }

  return (
    <section id="pricing" className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-[15px] text-[var(--accent)] font-medium mb-4">Pricing</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight mb-5">
            Simple, transparent pricing
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-[17px] mb-8">
            Every plan includes AI models, all channels, dedicated VPS, and full dashboard access. No hidden fees.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-raised)] border border-[var(--border-primary)]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-[15px] transition-all ${
                !annual ? "bg-[var(--cta)] text-[var(--cta-foreground)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-[15px] transition-all ${
                annual ? "bg-[var(--cta)] text-[var(--cta-foreground)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Annual <span className="text-[var(--accent)] text-[13px] ml-1">Save 17%</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative p-6 rounded-2xl border brightness-125 hover:brightness-[1.75] transition-all duration-300 ${
                plan.highlighted
                  ? "border-[var(--tier-pro)]/30 bg-[var(--bg-raised)]"
                  : "border-[var(--border-primary)] bg-[var(--bg-raised)]"
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[13px] font-medium ${
                    plan.highlighted
                      ? "bg-[var(--tier-pro)] text-[var(--bg-base)]"
                      : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-primary)]"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-5">{plan.tagline}</p>

              <div className="mb-6">
                {plan.monthly ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${annual ? Math.round(plan.annual! / 12) : plan.monthly}</span>
                      <span className="text-[15px] text-[var(--text-secondary)]">/mo</span>
                    </div>
                    {annual && (
                      <p className="text-[14px] text-[var(--accent)] mt-1">${plan.annual}/yr — Save {plan.annualSavings}</p>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold">Custom</span>
                    <p className="text-[14px] text-[var(--text-secondary)] mt-1">Starting at $999/mo</p>
                  </>
                )}
              </div>

              <a
                href={getCtaHref(plan.id)}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[15px] font-medium transition-all mb-6 ${
                  plan.highlighted
                    ? "bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-90"
                    : "bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-primary)]"
                }`}
              >
                {plan.cta}
                <ArrowRight size={13} />
              </a>

              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[15px] text-[var(--text-secondary)]">
                    <Check size={14} className="text-[var(--success)] mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h3 className="text-xl font-semibold text-center mb-6">See what you get</h3>

          {/* Plan switcher */}
          <div className="flex justify-center gap-1 mb-8">
            {(["starter", "pro", "ultra"] as PlanId[]).map((p) => {
              const label = p === "starter" ? "Starter" : p === "pro" ? "Pro" : "Ultra";
              const isActive = previewPlan === p;
              const color = p === "starter" ? "var(--accent)" : p === "pro" ? "var(--tier-pro)" : "var(--tier-ultra)";
              return (
                <button
                  key={p}
                  onClick={() => setPreviewPlan(p)}
                  className={`px-5 py-2 rounded-lg text-[15px] font-medium transition-all ${
                    isActive
                      ? "text-[var(--bg-base)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent"
                  }`}
                  style={isActive ? { background: color } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Live Dashboard Demo */}
          <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
            <iframe
              key={previewPlan}
              src={`/dashboard-demo?plan=${previewPlan}`}
              className="w-full h-[500px] md:h-[600px] bg-[var(--bg-base)]"
              title={`ClawHQ ${previewPlan} dashboard preview`}
            />
          </div>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-center mb-10">Compare all plans</h3>
          <div className="md:hidden flex items-center justify-end gap-1 mb-2 text-[12px] text-[var(--text-tertiary)]">
            Scroll &rarr;
          </div>
          <div className="overflow-x-auto scrollbar-none rounded-2xl border border-[var(--border-primary)]">
            <table className="w-full text-[15px] min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-raised)]">
                  <th className="text-left py-3.5 px-5 text-[var(--text-tertiary)] font-medium text-[13px] uppercase tracking-wider">Feature</th>
                  <th className="text-center py-3.5 px-4 text-[var(--text-tertiary)] font-medium text-[13px] uppercase tracking-wider">Starter</th>
                  <th className="text-center py-3.5 px-4 text-[var(--text-primary)] font-semibold text-[13px] uppercase tracking-wider">Pro</th>
                  <th className="text-center py-3.5 px-4 text-[var(--text-tertiary)] font-medium text-[13px] uppercase tracking-wider">Ultra</th>
                  <th className="text-center py-3.5 px-4 text-[var(--text-tertiary)] font-medium text-[13px] uppercase tracking-wider">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={`border-t border-[var(--border-subtle)] ${i % 2 ? "bg-[var(--bg-raised)]/50" : ""}`}>
                    <td className="py-3 px-5 text-[var(--text-secondary)]">{row.label}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.starter} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.ultra} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.enterprise} /></td>
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
