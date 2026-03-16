export interface PlanDef {
  name: string;
  label: string;
  monthlyUsd: number;
  annualUsd: number;
  annualSavings: string;
  tagline: string;
  contactUs?: boolean;
  highlighted?: boolean;
  badge?: string;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    name: "starter",
    label: "Starter",
    monthlyUsd: 59,
    annualUsd: 599,
    annualSavings: "$109",
    tagline: "All-inclusive. One price. Zero hassle.",
    features: [
      "Dedicated VPS (2 vCPU, 8GB RAM)",
      "30 AI models included — no API keys",
      "All 7 messaging channels",
      "Agent Store with free pre-built agents",
      "Professional chat with streaming",
      "Custom domain + auto-SSL",
      "Health monitoring + auto-restart",
      "Dashboard ticket support",
    ],
  },
  {
    name: "pro",
    label: "Pro",
    monthlyUsd: 129,
    annualUsd: 1299,
    annualSavings: "$249",
    tagline: "For builders who ship.",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter +",
      "Agent Builder (AI-assisted creation)",
      "Model Playground (compare models)",
      "Knowledge Base with AI search (RAG)",
      "Webhooks (9 events, auto-retry)",
      "Full API Access with SDKs",
      "Logs Explorer + Analytics + Audit Log",
      "8 vCPU, 32GB RAM, 400GB storage",
    ],
  },
  {
    name: "ultra",
    label: "Ultra",
    monthlyUsd: 350,
    annualUsd: 3499,
    annualSavings: "$701",
    tagline: "Command your AI workforce.",
    badge: "Most Powerful",
    features: [
      "Everything in Pro +",
      "Mission Control command center",
      "Kanban task board for AI agents",
      "Agent orchestration + automation",
      "Session replay with traces",
      "Time tracking + calendar view",
      "16 vCPU, 64GB RAM, 800GB storage",
    ],
  },
  {
    name: "enterprise",
    label: "Enterprise",
    monthlyUsd: 999,
    annualUsd: 0,
    annualSavings: "",
    tagline: "Built around your business.",
    contactUs: true,
    badge: "White Glove",
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

/** USD prices keyed by plan name for quick lookup */
export const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 59, annual: 599 },
  pro: { monthly: 129, annual: 1299 },
  ultra: { monthly: 350, annual: 3499 },
};
