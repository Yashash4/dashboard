"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePayment } from "@/hooks/use-payment";

interface Props {
  agentId: string;
  agentName: string;
  isOwned: boolean;
  isFree: boolean;
  price: number;
}

export function AgentDetailActions({ agentId, agentName, isOwned, isFree, price }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [owned, setOwned] = useState(isOwned);

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => router.refresh(),
  });

  const handleFreePurchase = async () => {
    setLoading(true);
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

      setOwned(true);
      toast.success(`${agentName} added to your library!`);
      router.refresh();
    } catch {
      toast.error("Failed to add agent");
    } finally {
      setLoading(false);
    }
  };

  const handlePaidPurchase = async () => {
    setLoading(true);
    const success = await initiatePayment({
      amount: price,
      paymentType: "agent_purchase",
      metadata: { agent_id: agentId, agent_name: agentName },
    });
    if (success) router.refresh();
    setLoading(false);
  };

  if (owned) {
    return (
      <Button className="w-full" disabled variant="outline">
        <Check className="mr-2 h-4 w-4 text-green-500" />
        Already in Library
      </Button>
    );
  }

  if (isFree) {
    return (
      <Button className="w-full" onClick={handleFreePurchase} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Add to Library
      </Button>
    );
  }

  return (
    <Button className="w-full" onClick={handlePaidPurchase} disabled={loading || isProcessing}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
      Buy for ${price.toFixed(2)}
    </Button>
  );
}
