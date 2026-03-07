"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Check,
  Loader2,
  ShoppingCart,
  Plus,
  Tag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePayment } from "@/hooks/use-payment";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string;
  is_premium: boolean;
}

export function AgentStore({
  agents,
  ownedAgentIds,
}: {
  agents: Agent[];
  ownedAgentIds: string[];
}) {
  const router = useRouter();
  const [owned, setOwned] = useState<Set<string>>(new Set(ownedAgentIds));
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => window.location.reload(),
  });

  const categories = [
    "all",
    ...Array.from(new Set(agents.map((a) => a.category).filter(Boolean))),
  ];

  const filtered =
    activeCategory === "all"
      ? agents
      : agents.filter((a) => a.category === activeCategory);

  const handleFreePurchase = async (agentId: string) => {
    setLoadingAgent(agentId);
    try {
      const res = await fetch("/api/agents/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add agent");
        return;
      }

      setOwned((prev) => new Set([...prev, agentId]));
      toast.success("Agent added to your library!");
      router.refresh();
    } catch {
      toast.error("Failed to add agent");
    } finally {
      setLoadingAgent(null);
    }
  };

  const handlePaidPurchase = async (agent: Agent) => {
    const price = Number(agent.price);
    setLoadingAgent(agent.id);

    const success = await initiatePayment({
      amount: price,
      paymentType: "agent_purchase",
      metadata: {
        agent_id: agent.id,
        agent_name: agent.name,
      },
    });

    if (success) {
      setOwned((prev) => new Set([...prev, agent.id]));
    }

    setLoadingAgent(null);
  };

  return (
    <>
      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as string)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors border",
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {(cat as string) === "all"
              ? "All"
              : (cat as string).charAt(0).toUpperCase() +
                (cat as string).slice(1)}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      {filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No agents found</h2>
              <p className="text-muted-foreground text-sm">
                {activeCategory === "all"
                  ? "No agents are available in the store right now."
                  : "No agents in this category. Try a different filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => {
            const isOwned = owned.has(agent.id);
            const isLoading =
              loadingAgent === agent.id || (isProcessing && loadingAgent === agent.id);
            const price = Number(agent.price) || 0;
            const isFree = price === 0;

            return (
              <Card
                key={agent.id}
                className={cn(
                  "border-border transition-colors",
                  isOwned && "border-green-600/30 bg-green-600/5"
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold text-base">{agent.name}</h3>
                    </div>
                    {agent.is_premium && (
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                  </div>

                  {agent.category && (
                    <div className="flex items-center gap-1 mb-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">
                        {agent.category}
                      </span>
                    </div>
                  )}

                  {agent.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold">
                      {isFree ? (
                        <span className="text-green-500">Free</span>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground font-normal mr-0.5">
                            $
                          </span>
                          {price.toFixed(2)}
                        </>
                      )}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-muted-foreground">
                        one-time
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  {isOwned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full pointer-events-none border-green-600/30 text-green-500"
                      disabled
                    >
                      <Check className="mr-2 h-3 w-3" />
                      Owned
                    </Button>
                  ) : isFree ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => handleFreePurchase(agent.id)}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3 w-3" />
                      )}
                      Add to Library
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => handlePaidPurchase(agent)}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <ShoppingCart className="mr-2 h-3 w-3" />
                      )}
                      Buy for ${price.toFixed(2)}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
