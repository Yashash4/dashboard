"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PlanKey = "starter" | "pro" | "ultra" | "enterprise";

interface FeatureRow {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  ultra: string | boolean;
  enterprise: string | boolean;
  expanded?: boolean;
}

const CORE_FEATURES: FeatureRow[] = [
  {
    label: "VPS Specs",
    starter: "2 vCPU, 8GB RAM, 100GB",
    pro: "8 vCPU, 32GB RAM, 400GB",
    ultra: "16 vCPU, 64GB RAM, 800GB",
    enterprise: "Custom",
  },
  {
    label: "Context Window",
    starter: "128K",
    pro: "Unlimited",
    ultra: "Unlimited + 5X credits",
    enterprise: "Custom",
  },
  {
    label: "Model Changes",
    starter: "5 per cycle",
    pro: "Unlimited",
    ultra: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Channels",
    starter: true,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "Agents",
    starter: true,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "Chat",
    starter: true,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "Monitoring",
    starter: "Basic",
    pro: "Advanced",
    ultra: "Advanced + Tracing",
    enterprise: "Custom",
  },
];

const EXPANDED_FEATURES: FeatureRow[] = [
  {
    label: "Support",
    starter: "Dashboard tickets",
    pro: "Priority + Live chat",
    ultra: "Priority + Live chat",
    enterprise: "Dedicated + 1-on-1 calls",
  },
  {
    label: "Analytics",
    starter: false,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "Knowledge Base",
    starter: false,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "Webhooks",
    starter: false,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "API Access",
    starter: false,
    pro: "Standard",
    ultra: "Advanced",
    enterprise: "Custom",
  },
  {
    label: "Audit Log",
    starter: false,
    pro: true,
    ultra: true,
    enterprise: true,
  },
  {
    label: "Mission Control",
    starter: false,
    pro: false,
    ultra: true,
    enterprise: true,
  },
];

const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter",
  pro: "Pro",
  ultra: "Ultra",
  enterprise: "Enterprise",
};

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  }
  return <span className="text-sm">{value}</span>;
}

export function PlanComparison({ currentPlan }: { currentPlan: string }) {
  const [expanded, setExpanded] = useState(false);

  const features = expanded
    ? [...CORE_FEATURES, ...EXPANDED_FEATURES]
    : CORE_FEATURES;

  const plans: PlanKey[] = ["starter", "pro", "ultra", "enterprise"];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Feature</TableHead>
                {plans.map((plan) => (
                  <TableHead
                    key={plan}
                    className={`text-center min-w-[120px] ${
                      currentPlan === plan
                        ? "border-x-2 border-t-2 border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    {PLAN_LABELS[plan]}
                    {currentPlan === plan && (
                      <span className="block text-xs text-primary font-normal mt-0.5">
                        Current
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.label}>
                  <TableCell className="font-medium text-sm">
                    {feature.label}
                  </TableCell>
                  {plans.map((plan) => (
                    <TableCell
                      key={plan}
                      className={`text-center ${
                        currentPlan === plan
                          ? "border-x-2 border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <CellValue value={feature[plan]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Show fewer features
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show all features
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
