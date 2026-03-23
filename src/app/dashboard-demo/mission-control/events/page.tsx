"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  Webhook,
  Wrench,
  Bot,
  Play,
  Square,
  Filter,
  Activity,
  Pause,
  PlayIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SEVERITY_CONFIG: Record<string, { icon: typeof Info; className: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, className: "text-green-500", bg: "bg-green-500/10", border: "border-l-green-500" },
  info: { icon: Info, className: "text-blue-500", bg: "bg-blue-500/10", border: "border-l-blue-500" },
  warning: { icon: AlertTriangle, className: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-l-yellow-500" },
  error: { icon: AlertTriangle, className: "text-red-500", bg: "bg-red-500/10", border: "border-l-red-500" },
};

const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Zap; label: string; className: string }> = {
  webhook: { icon: Webhook, label: "Webhook", className: "text-cyan-400" },
  tool_invocation: { icon: Wrench, label: "Tool", className: "text-violet-400" },
  task_complete: { icon: CheckCircle2, label: "Task Done", className: "text-green-400" },
  agent_state_change: { icon: Bot, label: "Agent", className: "text-blue-400" },
  session_start: { icon: Play, label: "Session", className: "text-emerald-400" },
  session_end: { icon: Square, label: "Session", className: "text-zinc-400" },
  error: { icon: AlertTriangle, label: "Error", className: "text-red-400" },
};

const DEMO_EVENTS = [
  { id: "1", event_type: "task_complete", severity: "success", message: "Task 'Generate weekly report' completed successfully", agent: { name: "Data Analyst" }, details: { duration: "4m 32s", tokens: 12400 }, created_at: "2026-03-22T14:28:00Z" },
  { id: "2", event_type: "session_start", severity: "info", message: "Agent 'Support Bot' started session for ticket #847", agent: { name: "Support Bot" }, details: { session_id: "sess_abc123" }, created_at: "2026-03-22T14:25:00Z" },
  { id: "3", event_type: "tool_invocation", severity: "info", message: "Tool 'web_search' invoked by Research Bot", agent: { name: "Research Bot" }, details: { tool: "web_search", query: "competitor pricing 2026" }, created_at: "2026-03-22T14:22:00Z" },
  { id: "4", event_type: "agent_state_change", severity: "warning", message: "Rate limit approaching for research-bot (85% utilized)", agent: { name: "Research Bot" }, details: { usage: "85%", limit: "60 RPM" }, created_at: "2026-03-22T14:20:00Z" },
  { id: "5", event_type: "task_complete", severity: "success", message: "Lead qualification completed: 3 qualified leads identified", agent: { name: "Sales Agent" }, details: { leads: 3, duration: "2m 15s" }, created_at: "2026-03-22T14:15:00Z" },
  { id: "6", event_type: "webhook", severity: "info", message: "Webhook delivered to https://api.example.com/hooks", agent: null, details: { status_code: 200, latency: "145ms" }, created_at: "2026-03-22T14:12:00Z" },
  { id: "7", event_type: "tool_invocation", severity: "info", message: "Tool 'memory_search' invoked by Support Bot", agent: { name: "Support Bot" }, details: { tool: "memory_search", query: "refund policy" }, created_at: "2026-03-22T14:10:00Z" },
  { id: "8", event_type: "error", severity: "error", message: "Agent 'Data Analyst' encountered timeout during CSV processing", agent: { name: "Data Analyst" }, details: { error: "Timeout after 30s", file: "export_q1.csv" }, created_at: "2026-03-22T14:05:00Z" },
  { id: "9", event_type: "session_end", severity: "success", message: "Session ended for Data Analyst - report generated", agent: { name: "Data Analyst" }, details: { duration: "6m 10s", tokens: 18200 }, created_at: "2026-03-22T14:02:00Z" },
  { id: "10", event_type: "agent_state_change", severity: "info", message: "Agent 'Sales Agent' changed state: idle -> working", agent: { name: "Sales Agent" }, details: { from: "idle", to: "working" }, created_at: "2026-03-22T14:00:00Z" },
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function EventFeedDemoPage() {
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(
    new Set(["success", "info", "warning", "error"])
  );
  const [paused, setPaused] = useState(false);

  const filtered = DEMO_EVENTS.filter((e) => severityFilter.has(e.severity));

  const severityCounts: Record<string, number> = {};
  for (const e of DEMO_EVENTS) {
    severityCounts[e.severity] = (severityCounts[e.severity] || 0) + 1;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Live Events</h1>
      <p className="text-muted-foreground mb-6">
        Real-time activity stream from your AI agents.
      </p>

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(["success", "info", "warning", "error"] as const).map((sev) => {
              const config = SEVERITY_CONFIG[sev];
              const SevIcon = config.icon;
              return (
                <button
                  key={sev}
                  onClick={() => {
                    const next = new Set(severityFilter);
                    if (next.has(sev)) next.delete(sev);
                    else next.add(sev);
                    setSeverityFilter(next);
                  }}
                  className={`inline-flex items-center gap-1 border rounded-md text-[10px] px-2 py-0.5 transition-opacity ${
                    severityFilter.has(sev) ? config.bg + " " + config.className + " border-current/30" : "opacity-30 border-border"
                  }`}
                >
                  <SevIcon className="h-3 w-3" />
                  {sev.toUpperCase()} {severityCounts[sev] || 0}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {paused ? "Paused" : "Live"} &middot; {filtered.length} events
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <PlayIcon className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Event timeline */}
        <div className="space-y-2">
          {filtered.map((event) => {
            const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
            const evType = EVENT_TYPE_CONFIG[event.event_type];
            const SevIcon = sev.icon;
            const TypeIcon = evType?.icon || Zap;

            return (
              <Card
                key={event.id}
                className={`border-border border-l-2 ${sev.border} hover:bg-muted/20 transition-colors`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sev.className}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {evType && (
                          <Badge variant="outline" className={`text-[9px] ${evType.className}`}>
                            <TypeIcon className="h-2.5 w-2.5 mr-0.5" />
                            {evType.label}
                          </Badge>
                        )}
                        {event.agent?.name && (
                          <span className="text-xs font-medium text-muted-foreground">{event.agent.name}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                          {formatTime(event.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{event.message}</p>
                      {event.details && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {Object.entries(event.details).map(([k, v]) => (
                            <span key={k} className="text-[10px] text-muted-foreground">
                              <span className="font-medium">{k}:</span> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
