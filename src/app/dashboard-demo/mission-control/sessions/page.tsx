"use client";

import { useState } from "react";
import {
  Clock,
  Bot,
  CheckCircle2,
  XCircle,
  Timer,
  Radio,
  BarChart3,
  Search,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_SESSIONS = [
  {
    id: "1",
    agent: { name: "Support Bot" },
    task: { title: "Handle ticket #847" },
    started_at: "2026-03-22T14:25:00Z",
    ended_at: null,
    success: null as boolean | null,
    total_tokens: 4200,
    total_cost_usd: 0.042,
    steps: [
      { name: "Read ticket", duration_ms: 450, tokens: 800 },
      { name: "Search knowledge base", duration_ms: 1200, tokens: 1500 },
      { name: "Generate response", duration_ms: 2100, tokens: 1900 },
    ],
  },
  {
    id: "2",
    agent: { name: "Sales Agent" },
    task: { title: "Process lead qualification" },
    started_at: "2026-03-22T14:20:00Z",
    ended_at: null,
    success: null as boolean | null,
    total_tokens: 8500,
    total_cost_usd: 0.085,
    steps: [
      { name: "Fetch lead data", duration_ms: 320, tokens: 600 },
      { name: "Analyze lead profile", duration_ms: 3400, tokens: 4200 },
      { name: "Score leads", duration_ms: 1800, tokens: 2100 },
      { name: "Generate report", duration_ms: 2600, tokens: 1600 },
    ],
  },
  {
    id: "3",
    agent: { name: "Data Analyst" },
    task: { title: "Generate weekly analytics report" },
    started_at: "2026-03-22T13:50:00Z",
    ended_at: "2026-03-22T13:56:32Z",
    success: true,
    total_tokens: 18200,
    total_cost_usd: 0.182,
    steps: [
      { name: "Query database", duration_ms: 1200, tokens: 2400 },
      { name: "Process data", duration_ms: 8900, tokens: 8000 },
      { name: "Generate charts", duration_ms: 4500, tokens: 3800 },
      { name: "Compile report", duration_ms: 3200, tokens: 4000 },
    ],
  },
  {
    id: "4",
    agent: { name: "Research Bot" },
    task: { title: "Research competitor pricing" },
    started_at: "2026-03-22T13:30:00Z",
    ended_at: "2026-03-22T13:42:15Z",
    success: true,
    total_tokens: 24500,
    total_cost_usd: 0.245,
    steps: [
      { name: "Web search", duration_ms: 5400, tokens: 6000 },
      { name: "Parse results", duration_ms: 3200, tokens: 4500 },
      { name: "Compare data", duration_ms: 4100, tokens: 8000 },
      { name: "Write summary", duration_ms: 6800, tokens: 6000 },
    ],
  },
  {
    id: "5",
    agent: { name: "Support Bot" },
    task: { title: "Handle ticket #842" },
    started_at: "2026-03-22T12:45:00Z",
    ended_at: "2026-03-22T12:47:30Z",
    success: true,
    total_tokens: 3100,
    total_cost_usd: 0.031,
    steps: [
      { name: "Read ticket", duration_ms: 320, tokens: 600 },
      { name: "Generate response", duration_ms: 1500, tokens: 2500 },
    ],
  },
  {
    id: "6",
    agent: { name: "Data Analyst" },
    task: { title: "Process CSV export" },
    started_at: "2026-03-22T12:00:00Z",
    ended_at: "2026-03-22T12:05:30Z",
    success: false,
    total_tokens: 8400,
    total_cost_usd: 0.084,
    steps: [
      { name: "Read file", duration_ms: 450, tokens: 800 },
      { name: "Parse CSV", duration_ms: 12000, tokens: 4200 },
      { name: "Analysis (failed)", duration_ms: 30000, tokens: 3400 },
    ],
  },
];

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function SessionsDemoPage() {
  const [sessionSearch, setSessionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "failed">("all");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const filteredSessions = DEMO_SESSIONS.filter((s) => {
    if (sessionSearch) {
      const q = sessionSearch.toLowerCase();
      if (!(s.agent?.name || "").toLowerCase().includes(q) && !(s.task?.title || "").toLowerCase().includes(q)) return false;
    }
    if (statusFilter === "active" && s.ended_at) return false;
    if (statusFilter === "completed" && (!s.ended_at || !s.success)) return false;
    if (statusFilter === "failed" && (!s.ended_at || s.success !== false)) return false;
    return true;
  });

  const activeSessions = DEMO_SESSIONS.filter((s) => !s.ended_at);
  const completedSessions = DEMO_SESSIONS.filter((s) => s.ended_at && s.success);
  const failedSessions = DEMO_SESSIONS.filter((s) => s.ended_at && s.success === false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Sessions</h1>
      <p className="text-muted-foreground mb-6">
        Track agent sessions, token usage, and performance.
      </p>

      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Radio className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <p className="text-lg font-bold font-mono text-blue-500">{activeSessions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <p className="text-lg font-bold font-mono text-green-500">{completedSessions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <XCircle className="h-3 w-3 text-red-400" />
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
              <p className="text-lg font-bold font-mono text-red-400">{failedSessions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Tokens</span>
              </div>
              <p className="text-lg font-bold font-mono">
                {DEMO_SESSIONS.reduce((s, sess) => s + sess.total_tokens, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Session list */}
        <div className="space-y-2">
          {filteredSessions.map((session) => {
            const isActive = !session.ended_at;
            const isFailed = session.ended_at && session.success === false;
            const totalDurationMs = session.steps.reduce((s, step) => s + step.duration_ms, 0);
            const isExpanded = expandedSession === session.id;

            return (
              <Card
                key={session.id}
                className={`border-border cursor-pointer hover:bg-muted/20 transition-colors ${
                  isActive ? "border-l-2 border-l-blue-500" : isFailed ? "border-l-2 border-l-red-500" : ""
                }`}
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isActive ? (
                        <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
                      ) : isFailed ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{session.agent?.name}</span>
                          {session.task && (
                            <span className="text-xs text-muted-foreground">— {session.task.title}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>
                            <Timer className="h-3 w-3 inline mr-0.5" />
                            {formatDuration(totalDurationMs)}
                          </span>
                          <span>{session.total_tokens.toLocaleString()} tokens</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isActive
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : isFailed
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : "bg-green-500/15 text-green-400 border-green-500/30"
                        }`}
                      >
                        {isActive ? "Active" : isFailed ? "Failed" : "Completed"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(session.started_at)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: step trace */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Execution Trace</p>
                      <div className="space-y-1.5">
                        {session.steps.map((step, i) => {
                          const pct = totalDurationMs > 0 ? (step.duration_ms / totalDurationMs) * 100 : 0;
                          const isHot = pct > 50;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs">{step.name}</span>
                                  <span className={`text-[10px] font-mono ${isHot ? "text-red-400" : "text-muted-foreground"}`}>
                                    {formatDuration(step.duration_ms)} ({step.tokens} tok)
                                  </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isHot ? "bg-red-500/60" : "bg-primary/40"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
