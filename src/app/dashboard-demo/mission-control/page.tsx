"use client";

import Link from "next/link";
import {
  HeartPulse,
  Bot,
  ListChecks,
  TrendingUp,
  ArrowRight,
  Circle,
  CheckCircle2,
  Zap,
  Clock,
  Inbox,
  Activity,
  Radio,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEMO_METRICS = {
  system_health_percent: 98,
  active_agents: 3,
  total_agents: 4,
  tasks_in_progress: 5,
  tasks_completed_today: 12,
  success_rate_percent: 94,
};

const DEMO_AGENTS = [
  { id: "1", agent_id: "support-bot", agent: { name: "Support Bot" }, status: "working", current_task: { title: "Handling ticket #847" } },
  { id: "2", agent_id: "research-bot", agent: { name: "Research Bot" }, status: "online", current_task: null },
  { id: "3", agent_id: "sales-agent", agent: { name: "Sales Agent" }, status: "working", current_task: { title: "Processing lead qualification" } },
  { id: "4", agent_id: "data-analyst", agent: { name: "Data Analyst" }, status: "idle", current_task: null },
];

const DEMO_EVENTS = [
  { id: "1", severity: "success", message: "Task 'Generate weekly report' completed successfully", agent: { name: "Data Analyst" }, created_at: "2026-03-22T14:28:00Z" },
  { id: "2", severity: "info", message: "Agent 'Support Bot' started session for ticket #847", agent: { name: "Support Bot" }, created_at: "2026-03-22T14:25:00Z" },
  { id: "3", severity: "warning", message: "Rate limit approaching for research-bot (85% utilized)", agent: { name: "Research Bot" }, created_at: "2026-03-22T14:20:00Z" },
  { id: "4", severity: "success", message: "Lead qualification completed: 3 qualified leads identified", agent: { name: "Sales Agent" }, created_at: "2026-03-22T14:15:00Z" },
  { id: "5", severity: "info", message: "Knowledge base updated with 12 new document chunks", agent: null, created_at: "2026-03-22T14:10:00Z" },
];

const DEMO_IN_PROGRESS_TASKS = [
  { id: "1", title: "Handle customer ticket #847", priority: "high", assigned_agent: { name: "Support Bot" } },
  { id: "2", title: "Process lead qualification batch", priority: "medium", assigned_agent: { name: "Sales Agent" } },
  { id: "3", title: "Research competitor pricing", priority: "high", assigned_agent: { name: "Research Bot" } },
  { id: "4", title: "Generate weekly analytics report", priority: "medium", assigned_agent: { name: "Data Analyst" } },
  { id: "5", title: "Update FAQ knowledge base", priority: "low", assigned_agent: { name: "Support Bot" } },
];

const DEMO_ACTIVE_SESSIONS = [
  { id: "1", agent: { name: "Support Bot" }, task: { title: "Handle ticket #847" }, ended_at: null },
  { id: "2", agent: { name: "Sales Agent" }, task: { title: "Lead qualification" }, ended_at: null },
];

const STATUS_COLORS: Record<string, string> = {
  online: "text-green-500",
  working: "text-blue-500",
  idle: "text-muted-foreground",
  blocked: "text-red-500",
  sleeping: "text-muted-foreground opacity-50",
  offline: "text-muted-foreground opacity-30",
};

const SEVERITY_CONFIG: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "text-green-500" },
  info: { icon: Zap, className: "text-blue-500" },
  warning: { icon: AlertTriangle, className: "text-yellow-500" },
  error: { icon: AlertTriangle, className: "text-red-500" },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-muted-foreground opacity-30",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default function MissionControlDemoPage() {
  const m = DEMO_METRICS;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mission Control</h1>
      <p className="text-muted-foreground mb-6">
        Command center for your AI workforce.
      </p>

      <div className="space-y-6">
        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard label="System Health" value={`${m.system_health_percent}%`} icon={HeartPulse} accent="text-green-500" />
          <MetricCard label="Active Agents" value={`${m.active_agents}/${m.total_agents}`} icon={Bot} accent="text-blue-500" />
          <MetricCard label="Tasks In Progress" value={String(m.tasks_in_progress)} icon={ListChecks} accent="text-primary" />
          <MetricCard label="Active Sessions" value={String(DEMO_ACTIVE_SESSIONS.length)} icon={Radio} accent="text-blue-500" />
          <MetricCard label="Success Rate" value={`${m.success_rate_percent}%`} icon={TrendingUp} accent="text-green-500" />
        </div>

        {/* Two-column: Agent Status + Recent Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Agent Roster Mini */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Agent Roster</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard-demo/mission-control/agents">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle className={`h-2.5 w-2.5 fill-current ${STATUS_COLORS[agent.status] || ""}`} />
                    <span className="text-sm font-medium">{agent.agent?.name || agent.agent_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.current_task && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {agent.current_task.title}
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize font-mono">
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
              <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard-demo/mission-control/events">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_EVENTS.map((event) => {
                const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
                const SevIcon = sev.icon;
                return (
                  <div key={event.id} className="flex items-start gap-2">
                    <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sev.className}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.agent?.name && <span className="font-medium">{event.agent.name}</span>}
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
              <CardTitle className="text-sm font-medium">Tasks In Progress</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard-demo/mission-control/tasks">
                  Task Board
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_IN_PROGRESS_TASKS.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`} />
                    <span className="text-sm truncate">{task.title}</span>
                  </div>
                  {task.assigned_agent && (
                    <span className="text-xs text-muted-foreground shrink-0">{task.assigned_agent.name}</span>
                  )}
                </div>
              ))}
              {DEMO_IN_PROGRESS_TASKS.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{DEMO_IN_PROGRESS_TASKS.length - 4} more
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard-demo/mission-control/sessions">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_ACTIVE_SESSIONS.map((session) => (
                <div key={session.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-sm truncate">{session.agent?.name}</span>
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
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof HeartPulse;
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
        <p className={`text-xl font-bold font-mono ${accent}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
