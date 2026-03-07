"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  Activity,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  total_messages: number;
  total_errors: number;
  avg_response_time_ms: number;
  error_rate: number;
  daily: { date: string; messages: number; errors: number }[];
  per_agent: {
    agent_id: string;
    messages: number;
    errors: number;
    avg_response_time_ms: number;
  }[];
  days: number;
}

interface AgentInfo {
  agent_id: string;
  name: string;
}

export function AgentAnalytics({ agents }: { agents: AgentInfo[] }) {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["agent-analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/agents/analytics?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const agentNameMap = Object.fromEntries(
    agents.map((a) => [a.agent_id, a.name])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Usage Analytics</h2>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-colors border",
                days === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : !data || (data.total_messages === 0 && data.total_errors === 0) ? (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No usage data yet. Start chatting with your agents to see
                analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Messages
                  </span>
                </div>
                <p className="text-2xl font-bold">{data.total_messages}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Avg Response
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {data.avg_response_time_ms > 1000
                    ? `${(data.avg_response_time_ms / 1000).toFixed(1)}s`
                    : `${data.avg_response_time_ms}ms`}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Errors</span>
                </div>
                <p className="text-2xl font-bold">{data.total_errors}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Error Rate
                  </span>
                </div>
                <p className="text-2xl font-bold">{data.error_rate}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {data.daily.length > 1 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Messages per Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(v) => {
                          const d = new Date(v + "T00:00:00");
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 0,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="messages"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="errors"
                        stroke="hsl(0, 84%, 60%)"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-agent breakdown */}
          {data.per_agent.length > 1 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Per Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.per_agent.map((pa) => (
                    <div
                      key={pa.agent_id}
                      className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                    >
                      <span className="font-medium truncate">
                        {agentNameMap[pa.agent_id] || "Unknown"}
                      </span>
                      <div className="flex items-center gap-4 text-muted-foreground shrink-0">
                        <span>{pa.messages} msgs</span>
                        <span>
                          {pa.avg_response_time_ms > 1000
                            ? `${(pa.avg_response_time_ms / 1000).toFixed(1)}s`
                            : `${pa.avg_response_time_ms}ms`}
                        </span>
                        {pa.errors > 0 && (
                          <span className="text-red-500">
                            {pa.errors} err
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
