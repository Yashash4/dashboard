"use client";

import { useState } from "react";
import {
  Brain,
  Cpu,
  Check,
  Clock,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModelConfigData {
  current_model: string;
  requested_model: string | null;
  change_effective_date: string | null;
  context_limit: number;
  changes_this_month: number | null;
}

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

export function ModelConfig({
  modelConfig,
  availableModels,
  plan,
  billingDate,
}: {
  modelConfig: ModelConfigData;
  availableModels: AvailableModel[];
  plan: string;
  billingDate: string | null;
}) {
  const [config, setConfig] = useState(modelConfig);
  const [selectedModel, setSelectedModel] = useState<AvailableModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const maxChanges = plan === "starter" ? 1 : 999;
  const changesUsed = config.changes_this_month || 0;
  const canChange = changesUsed < maxChanges;

  const currentModelInfo = availableModels.find(
    (m) => m.name === config.current_model
  );
  const pendingModelInfo = config.requested_model
    ? availableModels.find((m) => m.name === config.requested_model)
    : null;

  const handleSelectModel = (model: AvailableModel) => {
    if (model.name === config.current_model) return;
    if (model.name === config.requested_model) return;
    if (!canChange) return;
    setSelectedModel(model);
    setDialogOpen(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedModel) return;
    setLoading(true);
    setDialogOpen(false);

    try {
      const res = await fetch("/api/models/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel.name }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to change model");
        return;
      }

      if (data.instant) {
        setConfig((prev) => ({
          ...prev,
          current_model: selectedModel.name,
          context_limit: selectedModel.context_limit,
          requested_model: null,
          change_effective_date: null,
          changes_this_month: (prev.changes_this_month || 0) + 1,
        }));
        toast.success(`Switched to ${selectedModel.display_name}`);
      } else {
        setConfig((prev) => ({
          ...prev,
          requested_model: selectedModel.name,
          change_effective_date: data.effective_date,
          changes_this_month: (prev.changes_this_month || 0) + 1,
        }));
        toast.success(
          `Model change to ${selectedModel.display_name} scheduled for ${new Date(data.effective_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
        );
      }
    } catch {
      toast.error("Failed to change model");
    } finally {
      setLoading(false);
      setSelectedModel(null);
    }
  };

  const handleCancelPending = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/models/change", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to cancel change");
        return;
      }

      setConfig((prev) => ({
        ...prev,
        requested_model: null,
        change_effective_date: null,
        changes_this_month: Math.max((prev.changes_this_month || 1) - 1, 0),
      }));
      toast.success("Pending model change cancelled");
    } catch {
      toast.error("Failed to cancel change");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Model */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Current Model</CardTitle>
          </div>
          <Badge className="bg-green-600 text-white border-green-600">
            Active
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">
                {currentModelInfo?.display_name || config.current_model}
              </p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5" />
                  {formatContext(config.context_limit)} tokens
                </span>
              </div>
              {currentModelInfo?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {currentModelInfo.description}
                </p>
              )}
            </div>
          </div>

          {/* Pending Change */}
          {config.requested_model && pendingModelInfo && (
            <div className="mt-4 p-3 rounded-md bg-yellow-600/10 border border-yellow-600/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">
                    Pending Change
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-muted-foreground hover:text-foreground"
                  onClick={handleCancelPending}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  <span className="ml-1 text-xs">Cancel</span>
                </Button>
              </div>
              <p className="text-sm mt-1">
                Switching to <strong>{pendingModelInfo.display_name}</strong>
                {config.change_effective_date && (
                  <> on{" "}
                    {new Date(config.change_effective_date).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Available Models</CardTitle>
            </div>
            {plan === "starter" && (
              <span className="text-sm text-muted-foreground">
                Changes this month:{" "}
                <strong>
                  {changesUsed}/{maxChanges}
                </strong>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!canChange && (
            <div className="mb-4 p-3 rounded-md bg-secondary text-sm text-muted-foreground">
              You&apos;ve used your model change for this month. Your next
              change will be available after your billing cycle resets.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableModels.map((model) => {
              const isCurrent = model.name === config.current_model;
              const isPending = model.name === config.requested_model;

              return (
                <div
                  key={model.name}
                  className={`relative rounded-lg border p-4 transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isPending
                        ? "border-yellow-600 bg-yellow-600/5"
                        : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{model.display_name}</h3>
                    {isCurrent && (
                      <Badge className="bg-green-600 text-white border-green-600 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Current
                      </Badge>
                    )}
                    {isPending && (
                      <Badge className="bg-yellow-600 text-white border-yellow-600 text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{formatContext(model.context_limit)} context</span>
                  </div>
                  {model.description && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {model.description}
                    </p>
                  )}
                  {!isCurrent && !isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={!canChange || loading}
                      onClick={() => handleSelectModel(model)}
                    >
                      {loading && selectedModel?.name === model.name ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : null}
                      Select
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {selectedModel?.display_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {plan === "starter" ? (
                <>
                  This change will take effect on your next billing cycle
                  {billingDate && (
                    <>
                      {" "}(
                      {new Date(billingDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      )
                    </>
                  )}
                  . You can use 1 model change per month on the Starter plan.
                </>
              ) : (
                "This change will take effect immediately."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
