"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, X, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  currentModel: string;
  deployedAgentCategories: string[];
  availableModels: { name: string; display_name: string; context_limit: number; description: string | null }[];
  onSelectModel: (model: { name: string; display_name: string; context_limit: number; description: string | null }) => void;
}

/**
 * Recommends a model based on the user's deployed agent categories.
 *
 * Matching logic:
 * - Support/Sales agents → prefer models with large context (customer conversations are long)
 * - Research/Data agents → prefer models with highest context window (processing documents)
 * - Content/Writer agents → prefer creative models (medium context is fine)
 * - Management agents → prefer fast models (orchestration needs speed)
 * - Default → suggest the model with the largest context window
 */
function getRecommendation(
  currentModel: string,
  categories: string[],
  models: Props["availableModels"]
) {
  if (models.length <= 1) return null;

  const otherModels = models.filter((m) => m.name !== currentModel);
  if (otherModels.length === 0) return null;

  // Score models based on agent categories
  const scores = otherModels.map((m) => {
    let score = 0;
    const ctx = m.context_limit;
    const desc = (m.description || "").toLowerCase();

    for (const cat of categories) {
      const c = cat.toLowerCase();
      if (c === "support" || c === "sales") {
        // Prefer large context for long conversations
        score += ctx > 100000 ? 3 : ctx > 50000 ? 2 : 1;
      } else if (c === "research" || c === "data") {
        // Prefer largest context for document processing
        score += ctx > 100000 ? 4 : ctx > 50000 ? 2 : 0;
      } else if (c === "content" || c === "writer" || c === "review") {
        // Prefer creative capabilities
        score += desc.includes("creative") || desc.includes("writing") ? 3 : 1;
        score += ctx > 50000 ? 1 : 0;
      } else if (c === "management" || c === "manager") {
        // Prefer fast models for orchestration
        score += desc.includes("fast") || desc.includes("speed") ? 3 : 1;
      }
    }

    // Base score: prefer larger context
    score += Math.min(ctx / 50000, 3);

    return { model: m, score };
  });

  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (!best || best.score <= 0) return null;

  // Don't recommend if the current model is already the best choice
  const currentCtx = models.find((m) => m.name === currentModel)?.context_limit || 0;
  if (best.model.context_limit <= currentCtx && best.score < 3) return null;

  let reason = "Based on your deployed agents";
  if (categories.length > 0) {
    const catNames = categories.slice(0, 2).map((c) => c.charAt(0).toUpperCase() + c.slice(1));
    reason = `Optimized for your ${catNames.join(" & ")} agents`;
  }

  return { model: best.model, reason };
}

export function ModelRecommendation({ currentModel, deployedAgentCategories, availableModels, onSelectModel }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (deployedAgentCategories.length === 0) return null;

  const recommendation = getRecommendation(currentModel, deployedAgentCategories, availableModels);
  if (!recommendation) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">
                Recommended: {recommendation.model.display_name}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {recommendation.reason}. This model has{" "}
                {recommendation.model.context_limit >= 1000
                  ? `${Math.round(recommendation.model.context_limit / 1000)}K`
                  : recommendation.model.context_limit}{" "}
                context window.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onSelectModel(recommendation.model)}
              >
                Switch to {recommendation.model.display_name}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
