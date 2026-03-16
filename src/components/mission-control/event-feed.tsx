"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Activity,
  Pause,
  PlayIcon,
  Link2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatTimeAgo } from "@/lib/format-time";
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
  error: { icon: AlertTriangle, label: "Error", className: "text-red-400" },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Severity border colors for left border
const SEVERITY_BORDER: Record<string, string> = {
  success: "border-l-green-500",
  info: "border-l-blue-500",
  warning: "border-l-yellow-500",
  error: "border-l-red-500",
};

export function EventFeed() {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLive, setIsLive] = useState(true);
  const [newEventCount, setNewEventCount] = useState(0);
  const prevEventCountRef = useRef(0);
  // 4.10: Accumulate events across pages instead of replacing
  const [accumulatedEvents, setAccumulatedEvents] = useState<MCEvent[]>([]);

  // Build URL with filter params sent to server (P1.3.2)
  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (severityFilter) params.set("severity", severityFilter);
    params.set("limit", "50");
    params.set("page", String(page));
    return `/api/mission-control/events?${params.toString()}`;
  }, [typeFilter, severityFilter, page]);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ events: MCEvent[]; total: number }>({
    queryKey: ["mc-events", typeFilter, severityFilter, page],
    queryFn: async () => {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    refetchInterval: isLive ? 10000 : false,
  });

  // 4.10: When data changes, append new page results or refresh page 1
  useEffect(() => {
    if (!data?.events) return;
    if (page === 1) {
      // Page 1 always replaces (live refresh or filter change)
      setAccumulatedEvents(data.events);
    } else {
      // Subsequent pages append, deduplicating by id
      setAccumulatedEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEvents = data.events.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newEvents];
      });
    }
  }, [data, page]);

  // Reset accumulated events when filters change
  useEffect(() => {
    setAccumulatedEvents([]);
    setPage(1);
  }, [typeFilter, severityFilter]);

  const events = accumulatedEvents;
  const total = data?.total || 0;

  // Track new events when paused
  useEffect(() => {
    if (!isLive && events.length > prevEventCountRef.current) {
      setNewEventCount(events.length - prevEventCountRef.current);
    }
    if (isLive) {
      prevEventCountRef.current = events.length;
      setNewEventCount(0);
    }
  }, [events.length, isLive]);

  // Client-side filtering for instant response (keep server filters too)
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter && e.event_type !== typeFilter) return false;
      if (severityFilter && e.severity !== severityFilter) return false;
      return true;
    });
  }, [events, typeFilter, severityFilter]);

  const eventTypes = Object.keys(EVENT_TYPE_CONFIG);
  const severities = ["success", "info", "warning", "error"];

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-10 w-10 text-red-400/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load events</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

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
              onClick={() => { setTypeFilter(null); setPage(1); }}
            >
              All Types
            </button>
            {eventTypes.map((type) => {
              const config = EVENT_TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${typeFilter === type ? "bg-accent" : ""}`}
                  onClick={() => { setTypeFilter(type); setPage(1); }}
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
              onClick={() => { setSeverityFilter(null); setPage(1); }}
            >
              All
            </button>
            {severities.map((sev) => (
              <button
                key={sev}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent capitalize ${severityFilter === sev ? "bg-accent" : ""}`}
                onClick={() => { setSeverityFilter(sev); setPage(1); }}
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
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filteredEvents.length} events
          {total > filteredEvents.length && ` of ${total}`}
        </span>

        {/* Live/Paused toggle */}
        <Button
          variant={isLive ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => { setIsLive(!isLive); if (!isLive) refetch(); }}
        >
          {isLive ? (
            <><Pause className="h-3 w-3" />Live</>
          ) : (
            <><PlayIcon className="h-3 w-3" />Paused {newEventCount > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1">{newEventCount} new</Badge>}</>
          )}
        </Button>
      </div>

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground mb-1">
            No events recorded
          </p>
          <p className="text-sm text-muted-foreground/60">
            Events will appear here when your agents perform actions, tasks change status, or sessions start
          </p>
        </div>
      ) : (
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
                    className={`border-border cursor-pointer hover:border-primary/20 transition-colors border-l-[3px] ${SEVERITY_BORDER[event.severity] || ""} ${isExpanded ? "border-primary/30" : ""}`}
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

                        {/* Session link (P7.2) */}
                        {event.session_id && (
                          <a
                            href={`/mission-control/sessions?highlight=${event.session_id}`}
                            className="text-primary/60 hover:text-primary shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            title="View linked session"
                          >
                            <Link2 className="h-3 w-3" />
                          </a>
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
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {event.agent && (
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {event.agent.name}
                          </span>
                        )}
                        {event.session_id && (
                          <a
                            href={`/mission-control/sessions?highlight=${event.session_id}`}
                            className="flex items-center gap-1 text-primary/70 hover:text-primary"
                          >
                            <Link2 className="h-3 w-3" />
                            View Session
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Pagination: Load More (P1.3.6) */}
      {total > filteredEvents.length && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
          >
            Load more events
          </Button>
        </div>
      )}
    </div>
  );
}
