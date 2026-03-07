import Link from "next/link";
import { Lock, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Plan } from "@/lib/tier";

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    "Mission Control — advanced VPS management",
    "Multi-model support & model playground",
    "No-code agent builder & workflows",
    "Real-time monitoring with alerts",
    "Logs explorer, usage analytics & audit log",
    "Team access with role-based permissions",
    "Direct API access to your OpenClaw instance",
    "2x credits & priority support",
  ],
  ultra: [
    "Full Mission Control command center",
    "Agent squad builder & task board",
    "Live event feed & session tracker",
    "End-to-end tracing & time travel debugging",
    "Workflow builder with continuous missions",
    "Advanced analytics & standup reports",
    "5x credits & enterprise-grade monitoring",
  ],
};

export function UpgradePrompt({ requiredPlan = "pro" }: { requiredPlan?: Plan }) {
  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);
  const features = PLAN_FEATURES[requiredPlan] || PLAN_FEATURES.pro;

  return (
    <Card className="border-border max-w-lg mx-auto">
      <CardContent className="pt-6">
        <div className="text-center py-4">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Upgrade to {planLabel}</h2>
          <p className="text-muted-foreground mb-6">
            This feature is available on the {planLabel} plan.
          </p>
        </div>

        <ul className="space-y-2.5 mb-6">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button className="w-full" asChild>
          <Link href="/billing">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
