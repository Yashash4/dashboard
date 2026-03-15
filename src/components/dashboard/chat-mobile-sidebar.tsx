"use client";

import { useState } from "react";
import { Menu, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string | null;
}

interface Props {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agent: Agent) => void;
}

/**
 * Mobile sidebar for chat — shows as a slide-out Sheet on small screens.
 * Replaces the fixed left panel when viewport is narrow.
 */
export function ChatMobileSidebar({ agents, selectedAgentId, onSelectAgent }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm">Agents</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  onSelectAgent(agent);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5",
                  selectedAgentId === agent.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <span className="truncate block">{agent.name}</span>
                  {agent.description && (
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {agent.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
