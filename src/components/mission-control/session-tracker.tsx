"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Bot,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Timer,
  AlertTriangle,
  Radio,
  GitBranch,
  BarChart3,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatDuration, formatTimeAgo, formatTime } from "@/lib/format-time";
import type { MCSession } from "@/types/mission-control";

// Heat map color for step duration
function heatMapColor(stepMs: number, totalMs: number): string {
  if (totalMs === 0) return "text-muted-foreground";
  const ratio = stepMs / totalMs;
  if (ratio > 0.75) return "text-red-400";
  if (ratio > 0.5) return "text-yellow-400";
  return "text-muted-foreground";
}

export function SessionTracker() {
  const {
    data: sessions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<MCSession[]>({
    queryKey: ["mc-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const json = await res.json();
      return json.sessions || [];
    },
    refetchInterval: 10000,
  });

  const [selectedSession, setSelectedSession] = useState<MCSession | null>(null);
  const [traceView, setTraceView] = useState<"timeline" | "tree">("timeline");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<"all" | "active" | "completed" | "failed">("all");

  // FIX-19: Auto-highlight session from URL param (event-to-session link)
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  useEffect(() => {
    if (highlightId && sessions.length > 0 && !selectedSession) {
      const session = sessions.find((s) => s.id === highlightId);
      if (session) setSelectedSession(session);
    }
  }, [highlightId, sessions, selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      const updated = sessions.find((s) => s.id === selectedSession.id);
      if (updated) setSelectedSession(updated);
    }
  }, [sessions, selectedSession]);

  // Filter sessions (FIX-28)
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (sessionSearch) {
        const q = sessionSearch.toLowerCase();
        if (!(s.agent?.name || "").toLowerCase().includes(q) && !(s.task?.title || "").toLowerCase().includes(q)) return false;
      }
      if (sessionStatusFilter === "active" && s.ended_at) return false;
      if (sessionStatusFilter === "completed" && (!s.ended_at || !s.success)) return false;
      if (sessionStatusFilter === "failed" && (!s.ended_at || s.success)) return false;
      return true;
    });
  }, [sessions, sessionSearch, sessionStatusFilter]);

  const activeSessions = sessions.filter((s) => !s.ended_at);
  const completedSessions = sessions.filter((s) => s.ended_at && s.success);
  const failedSessions = sessions.filter((s) => s.ended_at && !s.success);

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-10 w-10 text-red-400/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load sessions</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border"><CardContent className="pt-4 pb-3 px-4"><Skeleton className="h-8 w-full" /></CardContent></Card>
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <Radio className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-lg font-medium text-muted-foreground mb-1">No sessions recorded</p>
        <p className="text-sm text-muted-foreground/60">Sessions are created automatically when agents work on tasks</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active" value={activeSessions.length} icon={Clock} color="text-blue-500" />
        <StatCard label="Total" value={sessions.length} icon={Timer} color="text-muted-foreground" />
        <StatCard label="Completed" value={completedSessions.length} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="Failed" value={failedSessions.length} icon={XCircle} color="text-red-500" />
      </div>

      {/* Search/Filter (FIX-28) */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search sessions..."
          value={sessionSearch}
          onChange={(e) => setSessionSearch(e.target.value)}
          className="h-8 text-xs max-w-[250px]"
        />
        <div className="flex border border-border rounded-sm">
          {(["all", "active", "completed", "failed"] as const).map((s) => (
            <button
              key={s}
              className={`px-2 py-1 text-[10px] capitalize ${sessionStatusFilter === s ? "bg-accent" : ""}`}
              onClick={() => setSessionStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filteredSessions.length} sessions</span>
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {filteredSessions.map((session) => {
          const isActive = !session.ended_at;
          return (
            <Card
              key={session.id}
              className="border-border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setSelectedSession(session)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 flex items-center justify-center shrink-0 ${isActive ? "bg-blue-500/10" : "bg-muted/30"}`}>
                      <Bot className={`h-4 w-4 ${isActive ? "text-blue-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{session.agent?.name || "Agent"}</p>
                        {session.task && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">— {session.task.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(session.started_at)}</span>
                        <span className="font-mono">{formatDuration(session.duration_ms)}</span>
                        {session.trace_data?.steps && (
                          <span className="font-mono">{session.trace_data.steps.length} steps</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isActive ? (
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                        </span>
                        <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px]">Active</Badge>
                      </div>
                    ) : session.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Session Detail Sheet */}
      <Sheet open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
          {selectedSession && (
            <>
              {/* Sticky Header */}
              <SheetHeader className="sticky top-0 bg-background z-10 pb-3 border-b border-border">
                <SheetTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {selectedSession.agent?.name || "Agent"}
                </SheetTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  {!selectedSession.ended_at ? (
                    <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px]">Active</Badge>
                  ) : selectedSession.success ? (
                    <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 text-[10px]">Success</Badge>
                  ) : (
                    <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px]">Failed</Badge>
                  )}
                  <span className="font-mono">{formatDuration(selectedSession.duration_ms)}</span>
                  {selectedSession.trace_data?.steps && (
                    <span>{selectedSession.trace_data.steps.length} steps</span>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Started</p>
                    <span className="text-sm">{formatTimeAgo(selectedSession.started_at)}</span>
                  </div>
                  {selectedSession.ended_at && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ended</p>
                      <span className="text-sm">{formatTimeAgo(selectedSession.ended_at)}</span>
                    </div>
                  )}
                </div>

                {selectedSession.task && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Task</p>
                      <p className="text-sm">{selectedSession.task.title}</p>
                    </div>
                  </>
                )}

                {selectedSession.error_message && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-red-400 mb-1 uppercase tracking-wider">Error</p>
                      <p className="text-sm text-red-400">{selectedSession.error_message}</p>
                    </div>
                  </>
                )}

                {/* Trace View */}
                {selectedSession.trace_data?.steps && selectedSession.trace_data.steps.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Execution Trace</p>
                        <div className="flex border border-border rounded-sm">
                          <button className={`p-1 ${traceView === "timeline" ? "bg-accent" : ""}`} onClick={() => setTraceView("timeline")} title="Timeline">
                            <BarChart3 className="h-3 w-3" />
                          </button>
                          <button className={`p-1 ${traceView === "tree" ? "bg-accent" : ""}`} onClick={() => setTraceView("tree")} title="Tree">
                            <GitBranch className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Trace summary header */}
                      <TraceSummary steps={selectedSession.trace_data.steps} />

                      {traceView === "timeline" ? (
                        <GanttTimeline steps={selectedSession.trace_data.steps} />
                      ) : (
                        <TraceTreeView steps={selectedSession.trace_data.steps} />
                      )}
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Clock; color: string }) {
  return (
    <Card className="border-border">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function TraceSummary({ steps }: { steps: Array<{ duration_ms?: number; result: string }> }) {
  const totalMs = steps.reduce((sum, s) => sum + (s.duration_ms || 0), 0);
  const succeeded = steps.filter((s) => s.result === "success" || s.result.includes("found") || s.result.includes("planned")).length;
  const failed = steps.filter((s) => s.result.includes("timeout") || s.result === "blocked").length;

  return (
    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/20 rounded-sm font-mono">
      {steps.length} steps · {totalMs >= 1000 ? `${(totalMs / 1000).toFixed(1)}s` : `${totalMs}ms`} total
      {succeeded > 0 && ` · ${succeeded} succeeded`}
      {failed > 0 && ` · ${failed} failed`}
    </div>
  );
}

// Gantt Timeline View
function GanttTimeline({ steps }: { steps: Array<{ timestamp: string; action: string; result: string; duration_ms?: number }> }) {
  const totalMs = steps.reduce((sum, s) => sum + (s.duration_ms || 0), 0);

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const width = totalMs > 0 && step.duration_ms ? Math.max((step.duration_ms / totalMs) * 100, 5) : 5;
        const isSuccess = step.result === "success" || step.result.includes("found") || step.result.includes("planned");
        const isProgress = step.result === "in progress";
        const isFailed = step.result.includes("timeout") || step.result === "blocked";
        const barColor = isSuccess ? "bg-green-500" : isProgress ? "bg-blue-500" : isFailed ? "bg-red-500" : "bg-muted-foreground";

        return (
          <div key={idx} className="group">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
              <span className="text-xs truncate flex-1">{step.action}</span>
              {step.duration_ms != null && step.duration_ms > 0 && (
                <span className={`text-[10px] font-mono shrink-0 ${heatMapColor(step.duration_ms, totalMs)}`}>
                  {step.duration_ms >= 1000 ? `${(step.duration_ms / 1000).toFixed(1)}s` : `${step.duration_ms}ms`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 shrink-0" />
              <div className="flex-1 h-4 bg-muted/30 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all ${barColor} group-hover:opacity-80`}
                  style={{ width: `${width}%` }}
                  title={`${step.action}: ${step.result}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Tree View
function TraceTreeView({ steps }: { steps: Array<{ timestamp: string; action: string; result: string; duration_ms?: number }> }) {
  const totalMs = steps.reduce((sum, s) => sum + (s.duration_ms || 0), 0);

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isSuccess = step.result === "success" || step.result.includes("found") || step.result.includes("planned");
          const isProgress = step.result === "in progress";
          const isFailed = step.result.includes("timeout") || step.result === "blocked";

          return (
            <div key={idx} className="flex gap-3 relative">
              <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 mt-0.5 z-10 ${
                isSuccess ? "border-green-500 bg-green-500/20" :
                isProgress ? "border-blue-500 bg-blue-500/20" :
                isFailed ? "border-red-500 bg-red-500/20" :
                "border-muted-foreground bg-muted"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{step.action}</p>
                  {step.duration_ms != null && step.duration_ms > 0 && (
                    <span className={`text-[10px] font-mono ${heatMapColor(step.duration_ms, totalMs)}`}>
                      {step.duration_ms >= 1000 ? `${(step.duration_ms / 1000).toFixed(1)}s` : `${step.duration_ms}ms`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{step.result}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{formatTime(step.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
