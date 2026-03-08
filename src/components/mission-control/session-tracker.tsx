"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Bot,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Coins,
  Hash,
  Timer,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useMissionControlStream } from "@/hooks/use-mission-control-stream";
import { mockSessions } from "@/lib/mock-data/mission-control";
import type { MCSession } from "@/types/mission-control";

function formatDuration(ms: number | null): string {
  if (!ms) return "Active";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function SessionTracker() {
  useMissionControlStream();

  const { data: sessions = mockSessions } = useQuery<MCSession[]>({
    queryKey: ["mc-sessions"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/mission-control/sessions");
        if (!res.ok) throw new Error();
        const json = await res.json();
        return json.sessions?.length > 0 ? json.sessions : mockSessions;
      } catch {
        return mockSessions;
      }
    },
    refetchInterval: 3000,
  });

  const [selectedSession, setSelectedSession] = useState<MCSession | null>(
    null
  );

  const activeSessions = sessions.filter((s) => !s.ended_at);
  const totalTokens = sessions.reduce(
    (sum, s) => sum + s.tokens_input + s.tokens_output,
    0
  );
  const totalCost = sessions.reduce((sum, s) => sum + s.cost_usd, 0);

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Active
              </span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold font-mono text-blue-500">
              {activeSessions.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Total
              </span>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold font-mono">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Tokens
              </span>
              <Hash className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-xl font-bold font-mono text-violet-400">
              {totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Cost
              </span>
              <Coins className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl font-bold font-mono text-green-500">
              ${totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {sessions.map((session) => {
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
                    <div
                      className={`h-8 w-8 flex items-center justify-center shrink-0 ${isActive ? "bg-blue-500/10" : "bg-muted/30"}`}
                    >
                      <Bot
                        className={`h-4 w-4 ${isActive ? "text-blue-500" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {session.agent?.name}
                        </p>
                        {session.task && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                            — {session.task.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(session.started_at)}</span>
                        <span className="font-mono">
                          {formatDuration(session.duration_ms)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-mono">
                        {(
                          session.tokens_input + session.tokens_output
                        ).toLocaleString()}{" "}
                        tok
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {session.tokens_input.toLocaleString()} in /{" "}
                        {session.tokens_output.toLocaleString()} out
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono shrink-0"
                    >
                      ${session.cost_usd.toFixed(3)}
                    </Badge>

                    {isActive ? (
                      <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px]">
                        Active
                      </Badge>
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
      <Sheet
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedSession && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {selectedSession.agent?.name} — Session
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    {!selectedSession.ended_at ? (
                      <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px]">
                        Active
                      </Badge>
                    ) : selectedSession.success ? (
                      <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 text-[10px]">
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px]">
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Duration
                    </p>
                    <span className="text-sm font-mono">
                      {formatDuration(selectedSession.duration_ms)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Tokens In
                    </p>
                    <span className="text-sm font-mono">
                      {selectedSession.tokens_input.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Tokens Out
                    </p>
                    <span className="text-sm font-mono">
                      {selectedSession.tokens_output.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cost</p>
                    <span className="text-sm font-mono text-green-500">
                      ${selectedSession.cost_usd.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Started
                    </p>
                    <span className="text-sm">
                      {formatTimeAgo(selectedSession.started_at)}
                    </span>
                  </div>
                </div>

                {selectedSession.task && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                        Task
                      </p>
                      <p className="text-sm">{selectedSession.task.title}</p>
                    </div>
                  </>
                )}

                {selectedSession.error_message && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-red-400 mb-1 uppercase tracking-wider">
                        Error
                      </p>
                      <p className="text-sm text-red-400">
                        {selectedSession.error_message}
                      </p>
                    </div>
                  </>
                )}

                {/* Trace View */}
                {selectedSession.trace_data?.steps &&
                  selectedSession.trace_data.steps.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                          Execution Trace
                        </p>
                        <div className="relative">
                          {/* Vertical line */}
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                          <div className="space-y-4">
                            {selectedSession.trace_data.steps.map(
                              (step, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-3 relative"
                                >
                                  {/* Dot */}
                                  <div
                                    className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 mt-0.5 z-10 ${
                                      step.result === "success" ||
                                      step.result.includes("found") ||
                                      step.result.includes("planned")
                                        ? "border-green-500 bg-green-500/20"
                                        : step.result === "in progress"
                                          ? "border-blue-500 bg-blue-500/20"
                                          : step.result.includes("timeout") ||
                                              step.result === "blocked"
                                            ? "border-red-500 bg-red-500/20"
                                            : "border-muted-foreground bg-muted"
                                    }`}
                                  />

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      {step.action}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="text-xs text-muted-foreground">
                                        {step.result}
                                      </span>
                                      {step.duration_ms != null &&
                                        step.duration_ms > 0 && (
                                          <span className="text-[10px] font-mono text-muted-foreground">
                                            {step.duration_ms >= 1000
                                              ? `${(step.duration_ms / 1000).toFixed(1)}s`
                                              : `${step.duration_ms}ms`}
                                          </span>
                                        )}
                                      {step.cost_usd != null &&
                                        step.cost_usd > 0 && (
                                          <span className="text-[10px] font-mono text-green-500">
                                            ${step.cost_usd.toFixed(3)}
                                          </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                                      {formatTime(step.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
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
