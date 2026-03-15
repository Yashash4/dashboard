"use client";

import {
  ArrowRight,
  Cpu,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AvailableModel {
  name: string;
  display_name: string;
  context_limit: number;
  description: string | null;
}

function formatContext(limit: number) {
  if (limit >= 1000) return `${Math.round(limit / 1000)}K`;
  return String(limit);
}

export function ModelComparisonDialog({
  currentModel,
  newModel,
  plan,
  billingDate,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  currentModel: AvailableModel | null;
  newModel: AvailableModel | null;
  plan: string;
  billingDate: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!currentModel || !newModel) return null;

  const contextDiff = newModel.context_limit - currentModel.context_limit;
  const isUpgrade = contextDiff > 0;
  const isDowngrade = contextDiff < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compare Models</DialogTitle>
          <DialogDescription>
            Review the differences before switching.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* Current model */}
            <div className="rounded-md border border-border p-3 space-y-2">
              <Badge variant="outline" className="text-xs">
                Current
              </Badge>
              <p className="font-semibold text-sm">
                {currentModel.display_name}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cpu className="h-3 w-3" />
                {formatContext(currentModel.context_limit)} tokens
              </div>
              {currentModel.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {currentModel.description}
                </p>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            {/* New model */}
            <div className="rounded-md border border-primary/50 bg-primary/5 p-3 space-y-2">
              <Badge className="bg-primary text-primary-foreground text-xs">
                New
              </Badge>
              <p className="font-semibold text-sm">{newModel.display_name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cpu className="h-3 w-3" />
                {formatContext(newModel.context_limit)} tokens
              </div>
              {newModel.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {newModel.description}
                </p>
              )}
            </div>
          </div>

          {/* Gains / Losses */}
          {(isUpgrade || isDowngrade) && (
            <div className="space-y-2">
              {isUpgrade && (
                <div className="flex items-center gap-2 rounded-md bg-green-600/10 border border-green-600/30 p-2.5">
                  <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-500">
                    You&apos;ll gain{" "}
                    <strong>
                      +{formatContext(contextDiff)} tokens
                    </strong>{" "}
                    of context window
                  </span>
                </div>
              )}
              {isDowngrade && (
                <div className="flex items-center gap-2 rounded-md bg-yellow-600/10 border border-yellow-600/30 p-2.5">
                  <TrendingDown className="h-4 w-4 text-yellow-500 shrink-0" />
                  <span className="text-sm text-yellow-500">
                    You&apos;ll lose{" "}
                    <strong>
                      {formatContext(Math.abs(contextDiff))} tokens
                    </strong>{" "}
                    of context window
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Plan-specific note */}
          <div className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">
            {plan === "starter" ? (
              <>
                This change will take effect on your next billing cycle
                {billingDate && (
                  <>
                    {" "}
                    (
                    {new Date(billingDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    )
                  </>
                )}
                . You can use up to 5 model changes per billing cycle on the
                Starter plan.
              </>
            ) : (
              "This change will take effect immediately."
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
