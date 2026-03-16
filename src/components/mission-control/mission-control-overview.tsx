"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  HeartPulse,
  Bot,
  ListChecks,
  TrendingUp,
  ArrowRight,
  Circle,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  Inbox,
  Activity,
  Radio,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/format-time";
import type {
  MCAgentStatus,
  MCTask,
  MCEvent,
  MCSession,
} from "@/types/mission-control";

interface MCMetricsResponse {
  system_health_percent: number | null;
  active_agents: number;
  total_agents: number;
  tasks_in_progress: number;
  tasks_completed_today: number;
  success_rate_percent: number | null;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  online: "text-green-500",
  working: "text-blue-500",
  idle: "text-muted-foreground",
  blocked: "text-red-500",
  sleeping: "text-muted-foreground opacity-50",
  offline: "text-muted-foreground opacity-30",
};

const SEVERITY_CONFIG: Record<
  string,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: { icon: CheckCircle2, className: "text-green-500" },
  info: { icon: Zap, className: "text-blue-500" },
  warning: { icon: AlertTriangle, className: "text-yellow-500" },
  error: { icon: AlertTriangle, className: "text-red-500" },
};

export function MissionControlOverview() {
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useQuery<MCMetricsResponse | null>({
    queryKey: ["mission-control", "metrics"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const {
    data: agents = [],
    isError: agentsError,
    refetch: refetchAgents,
  } = useQuery<MCAgentStatus[]>({
    queryKey: ["mc-agents"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/agents/status");
      if (!res.ok) throw new Error("Failed to fetch agents");
      const json = await res.json();
      return json.agents || [];
    },
    refetchInterval: 15000,
  });

  const {
    data: tasks = [],
    isError: tasksError,
    refetch: refetchTasks,
  } = useQuery<MCTask[]>({
    queryKey: ["mc-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const json = await res.json();
      return json.tasks || [];
    },
    refetchInterval: 15000,
  });

  const {
    data: events = [],
    isError: eventsError,
    refetch: refetchEvents,
  } = useQuery<MCEvent[]>({
    queryKey: ["mc-events"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/events?limit=5");
      if (!res.ok) throw new Error("Failed to fetch events");
      const json = await res.json();
      return json.events || [];
    },
    refetchInterval: 15000,
  });

  const {
    data: sessions = [],
  } = useQuery<MCSession[]>({
    queryKey: ["mc-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const json = await res.json();
      return json.sessions || [];
    },
    refetchInterval: 15000,
  });

  const m = metrics;
  const inProgressTasks = tasks.filter((t) => t.column_id === "in_progress");
  const recentEvents = events.slice(0, 5);
  const activeSessions = sessions.filter((s) => !s.ended_at);

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="System Health"
          value={m?.system_health_percent != null ? `${m.system_health_percent}%` : "—"}
          icon={HeartPulse}
          loading={metricsLoading}
          error={metricsError}
          onRetry={refetchMetrics}
          accent={
            m?.system_health_percent == null
              ? "text-muted-foreground"
              : m.system_health_percent >= 90
                ? "text-green-500"
                : m.system_health_percent >= 70
                  ? "text-yellow-500"
                  : "text-red-500"
          }
        />
        <MetricCard
          label="Active Agents"
          value={m ? `${m.active_agents}/${m.total_agents}` : "—"}
          icon={Bot}
          loading={metricsLoading}
          error={metricsError}
          onRetry={refetchMetrics}
          accent="text-blue-500"
        />
        <MetricCard
          label="Tasks In Progress"
          value={m ? String(m.tasks_in_progress) : "—"}
          icon={ListChecks}
          loading={metricsLoading}
          error={metricsError}
          onRetry={refetchMetrics}
          accent="text-primary"
        />
        <MetricCard
          label="Active Sessions"
          value={String(activeSessions.length)}
          icon={Radio}
          loading={metricsLoading}
          error={metricsError}
          onRetry={refetchMetrics}
          accent="text-blue-500"
        />
        <MetricCard
          label="Success Rate"
          value={m?.success_rate_percent != null ? `${m.success_rate_percent}%` : "—"}
          icon={TrendingUp}
          loading={metricsLoading}
          error={metricsError}
          onRetry={refetchMetrics}
          accent={
            m?.success_rate_percent == null
              ? "text-muted-foreground"
              : m.success_rate_percent >= 90
                ? "text-green-500"
                : "text-yellow-500"
          }
        />
      </div>

      {/* Two-column: Agent Status + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Roster Mini */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Agent Roster</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mission-control/agents">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentsError ? (
              <ErrorState message="Failed to load agents" onRetry={refetchAgents} />
            ) : agents.length === 0 ? (
              <EmptyState
                icon={Bot}
                message="No agents deployed yet"
                linkText="Deploy an agent"
                linkHref="/agents"
              />
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Circle
                      className={`h-2.5 w-2.5 fill-current ${STATUS_COLORS[agent.status] || ""}`}
                    />
                    <span className="text-sm font-medium">
                      {agent.agent?.name || agent.agent_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.current_task && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {agent.current_task.title}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize font-mono"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Events Mini */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">
              Recent Events
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mission-control/events">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsError ? (
              <ErrorState message="Failed to load events" onRetry={refetchEvents} />
            ) : recentEvents.length === 0 ? (
              <EmptyState
                icon={Activity}
                message="No events yet"
                description="Events appear when agents perform actions"
              />
            ) : (
              recentEvents.map((event) => {
                const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
                const SevIcon = sev.icon;
                return (
                  <div key={event.id} className="flex items-start gap-2">
                    <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sev.className}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.agent?.name && (
                          <span className="font-medium">{event.agent.name}</span>
                        )}
                        {event.agent?.name && " · "}
                        {formatTimeAgo(event.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column: In Progress Tasks + Active Sessions count */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* In Progress Tasks */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">
              Tasks In Progress
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mission-control/tasks">
                Task Board
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksError ? (
              <ErrorState message="Failed to load tasks" onRetry={refetchTasks} />
            ) : inProgressTasks.length === 0 ? (
              <EmptyState
                icon={Inbox}
                message="No tasks in progress"
                linkText="Create your first task"
                linkHref="/mission-control/tasks"
              />
            ) : (
              <>
                {inProgressTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PriorityDot priority={task.priority} />
                      <span className="text-sm truncate">{task.title}</span>
                    </div>
                    {task.assigned_agent && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {task.assigned_agent.name}
                      </span>
                    )}
                  </div>
                ))}
                {inProgressTasks.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{inProgressTasks.length - 4} more
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mission-control/sessions">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSessions.length === 0 ? (
              <EmptyState
                icon={Clock}
                message="No active sessions"
                description="Sessions are created when agents run tasks"
              />
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-sm truncate">
                      {session.agent?.name}
                    </span>
                    {session.task && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        — {session.task.title}
                      </span>
                    )}
                  </div>
                  <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px]">
                    Active
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
  error,
  onRetry,
}: {
  label: string;
  value: string;
  icon: typeof HeartPulse;
  loading: boolean;
  accent: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-border">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : error ? (
          <button onClick={onRetry} className="text-xs text-red-400 hover:underline">
            Retry
          </button>
        ) : (
          <p className={`text-xl font-bold font-mono ${accent}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-muted-foreground opacity-30",
  };
  return (
    <span
      className={`h-2 w-2 rounded-full shrink-0 ${colors[priority] || colors.medium}`}
    />
  );
}

function EmptyState({
  icon: Icon,
  message,
  description,
  linkText,
  linkHref,
}: {
  icon: typeof Bot;
  message: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
}) {
  return (
    <div className="text-center py-6">
      <Icon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1">{description}</p>
      )}
      {linkText && linkHref && (
        <Button variant="link" size="sm" className="mt-2 text-xs" asChild>
          <Link href={linkHref}>{linkText}</Link>
        </Button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-6">
      <AlertTriangle className="h-8 w-8 text-red-400/50 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
