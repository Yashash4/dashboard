"use client";

import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bot,
  Wrench,
  Clock,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Play,
  Square,
  RotateCcw,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusIndicator } from "./status-indicator";
import { formatTimeAgo } from "@/lib/format-time";
import type { MCAgentStatus } from "@/types/mission-control";

export function AgentRoster() {
  const {
    data: agents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<MCAgentStatus[]>({
    queryKey: ["mc-agents"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/agents/status");
      if (!res.ok) throw new Error("Failed to fetch agents");
      const json = await res.json();
      return json.agents || [];
    },
    refetchInterval: 10000,
  });

  // Use ref for selected ID to avoid useEffect infinite loop (FIX-16)
  const selectedAgentIdRef = useRef<string | null>(null);
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentIdRef.current) || null,
    [agents]
  );

  function selectAgent(agent: MCAgentStatus | null) {
    selectedAgentIdRef.current = agent?.id || null;
    // Force re-render by updating a dummy state
    setForceRender((v) => v + 1);
  }
  const [, setForceRender] = useState(0);
  const [agentSearch, setAgentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (agentSearch) {
        const q = agentSearch.toLowerCase();
        if (!(a.agent?.name || "").toLowerCase().includes(q) && !(a.agent?.description || "").toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [agents, agentSearch, statusFilter]);

  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-10 w-10 text-red-400/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load agent status</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-3">
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-16">
        <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-lg font-medium text-muted-foreground mb-1">
          No agents registered yet
        </p>
        <p className="text-sm text-muted-foreground/60 mb-4">
          Deploy an agent from your Agents page to see it here
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="/agents">Go to Agents</a>
        </Button>
      </div>
    );
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

      {/* Status Filter Buttons (4.14) */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {(
          [
            ["all", "All"],
            ["online", "Online"],
            ["offline", "Offline"],
            ["working", "Working"],
            ["idle", "Idle"],
            ["blocked", "Error"],
          ] as const
        ).map(([value, label]) => {
          const count = value === "all" ? agents.length : (statusCounts[value] || 0);
          return (
            <Button
              key={value}
              variant={statusFilter === value ? "default" : "outline"}
              size="sm"
              className="h-7 text-[11px] gap-1 px-2.5"
              onClick={() => setStatusFilter(value)}
            >
              {label}
              <Badge variant="outline" className="text-[9px] font-mono h-4 px-1 ml-0.5 border-current/20">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Search/Filter (FIX-27) */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search agents..."
          value={agentSearch}
          onChange={(e) => setAgentSearch(e.target.value)}
          className="h-8 text-xs max-w-[250px]"
        />
        <span className="text-xs text-muted-foreground ml-auto">{filteredAgents.length} agents</span>
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        {filteredAgents.map((agent) => (
          <Card
            key={agent.id}
            className="border-border cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => selectAgent(agent)}
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
                        {agent.agent?.name || agent.agent_id}
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
      <Sheet open={!!selectedAgent} onOpenChange={() => selectAgent(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {selectedAgent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {selectedAgent.agent?.name || selectedAgent.agent_id}
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

                {/* Agent Actions */}
                <AgentActions agentId={selectedAgent.agent_id} status={selectedAgent.status} onRefresh={() => refetch()} />

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

// ─── Agent Action Buttons ──────────────────────────────────
function AgentActions({
  agentId,
  status,
  onRefresh,
}: {
  agentId: string;
  status: string;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function executeAction(action: "start" | "stop" | "restart") {
    setLoading(action);
    try {
      const res = await fetch(`/api/mission-control/agents/${agentId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to ${action} agent`);
      }
      toast.success(`Agent ${action === "start" ? "started" : action === "stop" ? "stopped" : "restarted"}`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} agent`);
    } finally {
      setLoading(null);
    }
  }

  const isOffline = status === "offline" || status === "sleeping";
  const isOnline = status === "online" || status === "working" || status === "idle";

  return (
    <div className="flex gap-2">
      {isOffline && (
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
          onClick={() => executeAction("start")}
          disabled={!!loading}
        >
          {loading === "start" ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Play className="h-3 w-3 mr-1.5" />}
          Start
        </Button>
      )}
      {isOnline && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => executeAction("stop")}
            disabled={!!loading}
          >
            {loading === "stop" ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Square className="h-3 w-3 mr-1.5" />}
            Stop
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => executeAction("restart")}
            disabled={!!loading}
          >
            {loading === "restart" ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1.5" />}
            Restart
          </Button>
        </>
      )}
    </div>
  );
}
