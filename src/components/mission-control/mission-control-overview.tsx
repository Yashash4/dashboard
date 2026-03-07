"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  HeartPulse,
  Bot,
  ListChecks,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Circle,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mockMetrics,
  mockAgentStatuses,
  mockTasks,
  mockEvents,
  mockSessions,
} from "@/lib/mock-data/mission-control";
import type { MCMetrics } from "@/types/mission-control";

const STATUS_COLORS: Record<string, string> = {
  online: "text-green-500",
  working: "text-blue-500",
  idle: "text-muted-foreground",
  blocked: "text-red-500",
  sleeping: "text-muted-foreground/50",
  offline: "text-muted-foreground/30",
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

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MissionControlOverview() {
  const { data: metrics, isLoading } = useQuery<MCMetrics>({
    queryKey: ["mission-control", "metrics"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/mission-control/metrics");
        if (!res.ok) throw new Error();
        return res.json();
      } catch {
        return mockMetrics;
      }
    },
    refetchInterval: 10000,
  });

  const m = metrics || mockMetrics;

  const inProgressTasks = mockTasks.filter(
    (t) => t.column_id === "in_progress"
  );
  const recentEvents = mockEvents.slice(0, 5);
  const activeSessions = mockSessions.filter((s) => !s.ended_at);

  const agentsByStatus: Record<string, number> = {};
  for (const a of mockAgentStatuses) {
    agentsByStatus[a.status] = (agentsByStatus[a.status] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="System Health"
          value={`${m.system_health_percent}%`}
          icon={HeartPulse}
          loading={isLoading}
          accent={
            m.system_health_percent >= 90
              ? "text-green-500"
              : m.system_health_percent >= 70
                ? "text-yellow-500"
                : "text-red-500"
          }
        />
        <MetricCard
          label="Active Agents"
          value={`${m.active_agents}/${m.total_agents}`}
          icon={Bot}
          loading={isLoading}
          accent="text-blue-500"
        />
        <MetricCard
          label="Tasks In Progress"
          value={String(m.tasks_in_progress)}
          icon={ListChecks}
          loading={isLoading}
          accent="text-primary"
        />
        <MetricCard
          label="Cost Today"
          value={`$${m.cost_today_usd.toFixed(2)}`}
          icon={DollarSign}
          loading={isLoading}
          accent="text-green-500"
        />
        <MetricCard
          label="Success Rate"
          value={`${m.success_rate_percent}%`}
          icon={TrendingUp}
          loading={isLoading}
          accent={
            m.success_rate_percent >= 90
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
            {mockAgentStatuses.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Circle
                    className={`h-2.5 w-2.5 fill-current ${STATUS_COLORS[agent.status]}`}
                  />
                  <span className="text-sm font-medium">
                    {agent.agent?.name}
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
            ))}
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
            {recentEvents.map((event) => {
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
            })}
          </CardContent>
        </Card>
      </div>

      {/* Two-column: In Progress Tasks + Active Sessions */}
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
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks in progress.
              </p>
            ) : (
              inProgressTasks.slice(0, 4).map((task) => (
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
              ))
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
              <p className="text-sm text-muted-foreground">
                No active sessions.
              </p>
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
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {session.tokens_input + session.tokens_output} tok · $
                    {session.cost_usd.toFixed(3)}
                  </span>
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
}: {
  label: string;
  value: string;
  icon: typeof HeartPulse;
  loading: boolean;
  accent: string;
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
    low: "bg-muted-foreground/30",
  };
  return (
    <span
      className={`h-2 w-2 rounded-full shrink-0 ${colors[priority] || colors.medium}`}
    />
  );
}
