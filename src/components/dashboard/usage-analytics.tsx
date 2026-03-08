"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AGENT_COLORS = [
  "hsl(10, 100%, 52%)",
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(265, 83%, 57%)",
  "hsl(47, 100%, 50%)",
  "hsl(340, 82%, 52%)",
];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 0,
  fontSize: 12,
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function UsageAnalytics() {
  const [timeRange, setTimeRange] = useState("30");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics-usage", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/usage?range=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading) return <AnalyticsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Failed to load analytics</p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const daily = (data?.daily || []).map((d: any) => ({
    ...d,
    date: formatDate(d.date),
  }));

  const hourly = (data?.hourly || []).map((h: any) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    requests: h.requests,
  }));

  const agents = (data?.agents || []).map((a: any, i: number) => ({
    ...a,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
  }));

  const summary = data?.summary || {};
  const prevSummary = data?.prev_summary || {};
  const conversations = data?.conversations || 0;
  const prevConversations = data?.prev_conversations || 0;

  const msgChange = pctChange(summary.total_messages || 0, prevSummary.total_messages || 0);
  const convChange = pctChange(conversations, prevConversations);

  const peakHour = hourly.reduce(
    (max: any, h: any) => (h.requests > (max?.requests || 0) ? h : max),
    hourly[0] || { hour: "--", requests: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total_messages || 0}</p>
            <ChangeIndicator value={msgChange} />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversations
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversations}</p>
            <ChangeIndicator value={convChange} />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary.avg_response_ms
                ? summary.avg_response_ms >= 1000
                  ? `${(summary.avg_response_ms / 1000).toFixed(1)}s`
                  : `${summary.avg_response_ms}ms`
                : "--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per message</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Peak Hour
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{peakHour.hour}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {peakHour.requests} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Messages over time chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Messages Over Time
            </CardTitle>
            {(summary.error_rate || 0) > 0 && (
              <span className="text-xs text-red-500">
                {summary.error_rate}% error rate
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="msgGradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  width={40}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="hsl(var(--primary))"
                  fill="url(#msgGradMain)"
                  strokeWidth={2}
                  name="Messages"
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke="hsl(0, 84%, 60%)"
                  fill="url(#errGrad)"
                  strokeWidth={1.5}
                  name="Errors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: "hsl(var(--primary))" }} />
              <span className="text-xs text-muted-foreground">Messages</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
              <span className="text-xs text-muted-foreground">Errors</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak hours chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Requests by Hour <span className="text-muted-foreground font-normal">(UTC)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`${value} requests`, "Requests"]}
                  />
                  <Bar
                    dataKey="requests"
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent breakdown */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Messages by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                No message data yet
              </div>
            ) : (
              <div className="h-[250px] flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={agents}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {agents.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number, name: string) => [
                          `${value} messages`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2.5">
                  {agents.map((agent: any) => (
                    <div
                      key={agent.agent_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: agent.color }}
                        />
                        <span className="text-muted-foreground truncate max-w-[120px]">
                          {agent.name}
                        </span>
                      </div>
                      <span className="font-medium">{agent.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversations chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Daily Conversations & Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  width={40}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="hsl(142, 76%, 36%)"
                  fill="url(#convGrad)"
                  strokeWidth={2}
                  name="Conversations"
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="hsl(217, 91%, 60%)"
                  fill="url(#msgGrad)"
                  strokeWidth={2}
                  name="Messages"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
              <span className="text-xs text-muted-foreground">Conversations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: "hsl(217, 91%, 60%)" }} />
              <span className="text-xs text-muted-foreground">Messages</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-1">No change</p>
    );
  }
  const isUp = value > 0;
  return (
    <div className="flex items-center gap-1 mt-1">
      {isUp ? (
        <ArrowUpRight className="h-3 w-3 text-green-500" />
      ) : (
        <ArrowDownRight className="h-3 w-3 text-red-500" />
      )}
      <span className={`text-xs ${isUp ? "text-green-500" : "text-red-500"}`}>
        {Math.abs(value)}%
      </span>
      <span className="text-xs text-muted-foreground">vs last period</span>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
