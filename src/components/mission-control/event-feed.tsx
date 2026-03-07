"use client";

import { useState, useMemo } from "react";
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
  ChevronDown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { mockEvents } from "@/lib/mock-data/mission-control";
import type { MCEvent } from "@/types/mission-control";

const SEVERITY_CONFIG: Record<
  string,
  { icon: typeof Info; className: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "text-green-500",
    bg: "bg-green-500/10",
  },
  info: { icon: Info, className: "text-blue-500", bg: "bg-blue-500/10" },
  warning: {
    icon: AlertTriangle,
    className: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  error: {
    icon: AlertTriangle,
    className: "text-red-500",
    bg: "bg-red-500/10",
  },
};

const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: typeof Zap; label: string; className: string }
> = {
  webhook: { icon: Webhook, label: "Webhook", className: "text-cyan-400" },
  tool_invocation: {
    icon: Wrench,
    label: "Tool",
    className: "text-violet-400",
  },
  error: { icon: AlertTriangle, label: "Error", className: "text-red-400" },
  task_complete: {
    icon: CheckCircle2,
    label: "Task Done",
    className: "text-green-400",
  },
  agent_state_change: {
    icon: Bot,
    label: "Agent",
    className: "text-blue-400",
  },
  session_start: { icon: Play, label: "Session", className: "text-emerald-400" },
  session_end: { icon: Square, label: "Session", className: "text-zinc-400" },
};

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
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function EventFeed() {
  const [events] = useState<MCEvent[]>(mockEvents);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter && e.event_type !== typeFilter) return false;
      if (severityFilter && e.severity !== severityFilter) return false;
      return true;
    });
  }, [events, typeFilter, severityFilter]);

  const eventTypes = [...new Set(events.map((e) => e.event_type))];
  const severities = [...new Set(events.map((e) => e.severity))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3 w-3 mr-1.5" />
              Type
              {typeFilter && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                  {EVENT_TYPE_CONFIG[typeFilter]?.label || typeFilter}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <button
              className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${!typeFilter ? "bg-accent" : ""}`}
              onClick={() => setTypeFilter(null)}
            >
              All Types
            </button>
            {eventTypes.map((type) => {
              const config = EVENT_TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${typeFilter === type ? "bg-accent" : ""}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {config?.label || type}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3 w-3 mr-1.5" />
              Severity
              {severityFilter && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1 capitalize">
                  {severityFilter}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="start">
            <button
              className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${!severityFilter ? "bg-accent" : ""}`}
              onClick={() => setSeverityFilter(null)}
            >
              All
            </button>
            {severities.map((sev) => (
              <button
                key={sev}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent capitalize ${severityFilter === sev ? "bg-accent" : ""}`}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {(typeFilter || severityFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setTypeFilter(null);
              setSeverityFilter(null);
            }}
          >
            Clear filters
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filteredEvents.length} events
        </span>
      </div>

      {/* Event List */}
      <div className="space-y-1">
        {filteredEvents.map((event) => {
          const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
          const eventType =
            EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.webhook;
          const SevIcon = sev.icon;
          const TypeIcon = eventType.icon;
          const isExpanded = expandedId === event.id;

          return (
            <Collapsible
              key={event.id}
              open={isExpanded}
              onOpenChange={() =>
                setExpandedId(isExpanded ? null : event.id)
              }
            >
              <CollapsibleTrigger asChild>
                <Card
                  className={`border-border cursor-pointer hover:border-primary/20 transition-colors ${isExpanded ? "border-primary/30" : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Timestamp */}
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-14">
                        {formatTime(event.created_at)}
                      </span>

                      {/* Severity Icon */}
                      <div
                        className={`h-6 w-6 flex items-center justify-center shrink-0 ${sev.bg}`}
                      >
                        <SevIcon className={`h-3.5 w-3.5 ${sev.className}`} />
                      </div>

                      {/* Type Badge */}
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono shrink-0 ${eventType.className} border-current/20`}
                      >
                        <TypeIcon className="h-2.5 w-2.5 mr-0.5" />
                        {eventType.label}
                      </Badge>

                      {/* Message */}
                      <p className="text-sm truncate flex-1 min-w-0">
                        {event.message}
                      </p>

                      {/* Agent */}
                      {event.agent && (
                        <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                          {event.agent.name}
                        </span>
                      )}

                      {/* Time ago */}
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimeAgo(event.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <Card className="border-border border-t-0 rounded-t-none">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                      Event Payload
                    </p>
                    <pre className="text-xs font-mono bg-muted/30 p-3 rounded-sm overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                    {event.agent && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Bot className="h-3 w-3" />
                        Agent: {event.agent.name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
