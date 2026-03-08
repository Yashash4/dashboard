"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Wrench,
  Clock,
  TrendingUp,
  ChevronRight,
  Gauge,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { StatusIndicator } from "./status-indicator";
import { useMissionControlStream } from "@/hooks/use-mission-control-stream";
import { mockAgentStatuses } from "@/lib/mock-data/mission-control";
import type { MCAgentStatus } from "@/types/mission-control";

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AgentRoster() {
  useMissionControlStream();

  const { data: agents = mockAgentStatuses } = useQuery<MCAgentStatus[]>({
    queryKey: ["mc-agents"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/mission-control/agents/status");
        if (!res.ok) throw new Error();
        const json = await res.json();
        return json.agents?.length > 0 ? json.agents : mockAgentStatuses;
      } catch {
        return mockAgentStatuses;
      }
    },
    refetchInterval: 2000,
  });

  const [selectedAgent, setSelectedAgent] = useState<MCAgentStatus | null>(null);

  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(
          [
            ["online", "Online"],
            ["working", "Working"],
            ["idle", "Idle"],
            ["blocked", "Blocked"],
            ["sleeping", "Sleeping"],
            ["offline", "Offline"],
          ] as const
        ).map(([status, label]) => (
          <Card key={status} className="border-border">
            <CardContent className="p-3 flex items-center gap-2">
              <StatusIndicator status={status} showLabel={false} size="md" />
              <div>
                <p className="text-lg font-bold font-mono">
                  {statusCounts[status] || 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className="border-border cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelectedAgent(agent)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {agent.agent?.name}
                      </p>
                      <StatusIndicator status={agent.status} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {agent.current_task
                        ? agent.current_task.title
                        : agent.agent?.description || "No current task"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Capacity */}
                  <div className="w-24 hidden sm:block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        Capacity
                      </span>
                      <span className="text-[10px] font-mono">
                        {agent.capacity_used}%
                      </span>
                    </div>
                    <Progress value={agent.capacity_used} className="h-1.5" />
                  </div>

                  {/* Performance */}
                  <div className="hidden md:flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono">
                      {agent.performance_score
                        ? `${agent.performance_score}%`
                        : "—"}
                    </span>
                  </div>

                  {/* Last Active */}
                  <div className="hidden lg:flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(agent.last_activity_at)}
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Detail Sheet */}
      <Sheet open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {selectedAgent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {selectedAgent.agent?.name}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                {/* Status & Description */}
                <div>
                  <StatusIndicator status={selectedAgent.status} size="md" />
                  {selectedAgent.agent?.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedAgent.agent.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={selectedAgent.capacity_used}
                        className="h-2 flex-1"
                      />
                      <span className="text-sm font-mono">
                        {selectedAgent.capacity_used}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Performance
                    </p>
                    <p className="text-sm font-mono">
                      {selectedAgent.performance_score
                        ? `${selectedAgent.performance_score}%`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Last Active
                    </p>
                    <p className="text-sm">
                      {formatTimeAgo(selectedAgent.last_activity_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Version</p>
                    <p className="text-sm font-mono">
                      {selectedAgent.metadata?.version || "—"}
                    </p>
                  </div>
                </div>

                {/* Current Task */}
                {selectedAgent.current_task && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                        Current Task
                      </p>
                      <Card className="border-border">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium">
                            {selectedAgent.current_task.title}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {/* Deployed Tools */}
                {selectedAgent.metadata?.deployed_tools &&
                  selectedAgent.metadata.deployed_tools.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                          Deployed Tools
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {selectedAgent.metadata.deployed_tools.map((tool) => (
                            <Badge
                              key={tool}
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
