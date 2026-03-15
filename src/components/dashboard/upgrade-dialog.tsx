"use client";

import { Check, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeDialogProps {
  currentPlan: string;
  targetPlan: string;
  onConfirm: () => void;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_PRICES: Record<string, number> = {
  starter: 59,
  pro: 129,
  ultra: 350,
  enterprise: 999,
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  ultra: "Ultra",
  enterprise: "Enterprise",
};

const FEATURES_GAINED: Record<string, Record<string, string[]>> = {
  starter: {
    pro: [
      "8 vCPU, 32GB RAM, 400GB storage",
      "Full context window (no cap)",
      "Unlimited model changes",
      "Advanced monitoring & analytics",
      "Knowledge Base & Webhooks",
      "Priority support + live chat",
      "API access & Audit Log",
    ],
    ultra: [
      "16 vCPU, 64GB RAM, 800GB storage",
      "5X credits with full context window",
      "Mission Control command center",
      "Agent Squad Builder & orchestration",
      "Cost & token dashboard",
      "End-to-end tracing & debugging",
      "Workflow builder & automation",
      "Advanced API access & webhooks",
    ],
  },
  pro: {
    ultra: [
      "16 vCPU, 64GB RAM, 800GB storage",
      "5X credits with full context window",
      "Mission Control command center",
      "Agent Squad Builder & orchestration",
      "Cost & token dashboard",
      "End-to-end tracing & debugging",
      "Workflow builder & automation",
    ],
  },
};

export function UpgradeDialog({
  currentPlan,
  targetPlan,
  onConfirm,
  isLoading,
  open,
  onOpenChange,
}: UpgradeDialogProps) {
  const currentPrice = PLAN_PRICES[currentPlan] || 0;
  const targetPrice = PLAN_PRICES[targetPlan] || 0;
  const priceDiff = targetPrice - currentPrice;

  const features =
    FEATURES_GAINED[currentPlan]?.[targetPlan] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to {PLAN_LABELS[targetPlan] || targetPlan}</DialogTitle>
          <DialogDescription>
            Review your plan change before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan change summary */}
          <div className="flex items-center gap-3 justify-center py-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="text-lg font-bold capitalize">
                {PLAN_LABELS[currentPlan] || currentPlan}
              </p>
              <p className="text-sm text-muted-foreground">
                ${currentPrice}/mo
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">New</p>
              <p className="text-lg font-bold capitalize text-primary">
                {PLAN_LABELS[targetPlan] || targetPlan}
              </p>
              <p className="text-sm text-primary">${targetPrice}/mo</p>
            </div>
          </div>

          {priceDiff > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Price change:{" "}
              <span className="font-medium text-foreground">
                +${priceDiff}/mo
              </span>
            </p>
          )}

          {/* Features gained */}
          {features.length > 0 && (
            <div className="border border-border rounded-md p-4 space-y-2">
              <p className="text-sm font-medium">Features you&apos;ll gain:</p>
              <ul className="space-y-1.5">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Confirm Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
