"use client";

import {
  Brain,
  Cpu,
  Check,
  Sparkles,
  Info,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEMO_MODEL_CONFIG = {
  current_model: "kimi-k2.5",
  requested_model: null as string | null,
  change_effective_date: null as string | null,
  context_limit: 128000,
  changes_this_month: 1,
};

const DEMO_AVAILABLE_MODELS = [
  { name: "kimi-k2.5", display_name: "Kimi K2.5", context_limit: 128000, description: "Moonshot AI's flagship model with excellent reasoning and multilingual support." },
  { name: "minimax-m2.7", display_name: "MiniMax M2.7", context_limit: 128000, description: "MiniMax's advanced model optimized for conversational AI and content generation." },
  { name: "deepseek-v3", display_name: "DeepSeek V3", context_limit: 128000, description: "DeepSeek's latest model with strong coding and analytical capabilities." },
  { name: "llama-4", display_name: "Llama 4", context_limit: 128000, description: "Meta's open-source model with broad general knowledge and reasoning." },
  { name: "qwen-3", display_name: "Qwen 3", context_limit: 128000, description: "Alibaba's advanced model excelling in multilingual tasks and instruction following." },
  { name: "mistral", display_name: "Mistral", context_limit: 128000, description: "Mistral AI's efficient model with strong performance across diverse tasks." },
];

function formatContext(limit: number) {
  if (limit >= 1000) return `${Math.round(limit / 1000)}K`;
  return String(limit);
}

export default function DemoModelsPage() {
  const config = DEMO_MODEL_CONFIG;
  const currentModelInfo = DEMO_AVAILABLE_MODELS.find(
    (m) => m.name === config.current_model
  );
  const changesUsed = config.changes_this_month || 0;
  const maxChanges = 5;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Models</h1>
      <p className="text-muted-foreground mb-6">Configure your AI model.</p>

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
          </CardContent>
        </Card>

        {/* Model Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center py-4">
                <p className="text-3xl font-bold">1.2s</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold">99.8%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold">4,521</p>
                <p className="text-sm text-muted-foreground">Requests (7d)</p>
              </div>
            </div>
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
              <span className="text-sm text-muted-foreground">
                Changes this month:{" "}
                <strong>
                  {changesUsed}/{maxChanges}
                </strong>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_AVAILABLE_MODELS.map((model) => {
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
                          Active
                        </Badge>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {model.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {formatContext(model.context_limit)} context
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          disabled
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        {!isCurrent && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
