"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bot, Tag, Sparkles } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string;
  is_premium: boolean;
  tools?: string[];
}

interface AgentComparisonProps {
  agent1: Agent;
  agent2: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AgentColumn({ agent }: { agent: Agent }) {
  const price = Number(agent.price) || 0;
  const isFree = price === 0;

  return (
    <div className="flex-1 space-y-4">
      {/* Name */}
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
        <h3 className="font-semibold text-base">{agent.name}</h3>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {agent.is_premium && (
          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            Premium
          </Badge>
        )}
        {agent.category && (
          <Badge variant="outline" className="text-xs">
            <Tag className="mr-1 h-3 w-3" />
            {agent.category}
          </Badge>
        )}
      </div>

      {/* Price */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Price</p>
        <p className="text-lg font-bold">
          {isFree ? (
            <span className="text-green-500">Free</span>
          ) : (
            <>${price.toFixed(2)}</>
          )}
        </p>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Description</p>
        <p className="text-sm">
          {agent.description || "No description available."}
        </p>
      </div>

      {/* Tools */}
      {agent.tools && agent.tools.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tools</p>
          <div className="flex flex-wrap gap-1">
            {agent.tools.map((tool) => (
              <Badge
                key={tool}
                variant="outline"
                className="text-xs font-normal"
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentComparison({
  agent1,
  agent2,
  open,
  onOpenChange,
}: AgentComparisonProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compare Agents</DialogTitle>
        </DialogHeader>
        <div className="flex gap-6 py-4">
          <AgentColumn agent={agent1} />
          <div className="w-px bg-border shrink-0" />
          <AgentColumn agent={agent2} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
