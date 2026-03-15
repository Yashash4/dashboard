"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Clock,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface ChannelStat {
  channel_type: string;
  total_messages: number;
  avg_response_time_ms: number;
  peak_hour: number;
}

const CHANNEL_COLORS: Record<string, string> = {
  webchat: "bg-blue-500",
  telegram: "bg-sky-500",
  discord: "bg-indigo-500",
  slack: "bg-purple-500",
  whatsapp: "bg-green-500",
  teams: "bg-violet-500",
  signal: "bg-cyan-500",
};

export function ChannelAnalytics() {
  const [days, setDays] = useState("7");

  const { data, isLoading } = useQuery({
    queryKey: ["channel-analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/channels/analytics?days=${days}`);
      if (!res.ok) return { channels: [], hourly_heatmap: {} };
      return res.json();
    },
  });

  const channels: ChannelStat[] = data?.channels || [];
  const heatmap: Record<string, number[]> = data?.hourly_heatmap || {};
  const totalMessages = channels.reduce((s, c) => s + c.total_messages, 0);
  const avgResponseTime = channels.length > 0
    ? Math.round(channels.reduce((s, c) => s + c.avg_response_time_ms, 0) / channels.length)
    : 0;
  const mostActive = channels.length > 0
    ? [...channels].sort((a, b) => b.total_messages - a.total_messages)[0]?.channel_type
    : "—";
  const maxMessages = Math.max(...channels.map((c) => c.total_messages), 1);

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32">
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
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Messages</p>
            {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <p className="text-2xl font-bold">{totalMessages}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
            {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <p className="text-2xl font-bold">{avgResponseTime}ms</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Most Active</p>
            {isLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
              <p className="text-lg font-bold capitalize">{mostActive}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Channels Active</p>
            {isLoading ? <Skeleton className="h-8 w-8 mt-1" /> : (
              <p className="text-2xl font-bold">{channels.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-channel bar chart */}
      {isLoading ? (
        <Card className="border-border">
          <CardContent className="pt-6 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </CardContent>
        </Card>
      ) : channels.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No channel data yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Per Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.channel_type} className="flex items-center gap-3">
                <span className="text-xs font-medium capitalize w-20 shrink-0">{ch.channel_type}</span>
                <div className="flex-1 bg-muted/30 h-6 relative">
                  <div
                    className={`h-full ${CHANNEL_COLORS[ch.channel_type] || "bg-primary"} transition-all`}
                    style={{ width: `${(ch.total_messages / maxMessages) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{ch.total_messages}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Response time per channel */}
      {channels.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Time Per Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {channels.map((ch) => (
                <div key={ch.channel_type} className="border border-border p-3">
                  <p className="text-xs text-muted-foreground capitalize">{ch.channel_type}</p>
                  <p className="text-lg font-bold">{ch.avg_response_time_ms}ms</p>
                  <p className="text-[10px] text-muted-foreground">Peak: {ch.peak_hour}:00</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      {Object.keys(heatmap).length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Activity Heatmap (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(heatmap).map(([channel, hours]) => {
                const max = Math.max(...hours, 1);
                return (
                  <div key={channel} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground capitalize w-16 shrink-0">{channel}</span>
                    <div className="flex gap-0.5 flex-1">
                      {hours.map((count, hour) => (
                        <div
                          key={hour}
                          className="flex-1 h-4"
                          style={{
                            backgroundColor: count === 0
                              ? "var(--muted)"
                              : `rgba(var(--primary-rgb, 107, 142, 35), ${Math.max(0.15, count / max)})`,
                          }}
                          title={`${hour}:00 — ${count} messages`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-0.5 ml-[4.5rem]">
                {Array.from({ length: 24 }, (_, i) => (
                  <span key={i} className="flex-1 text-[8px] text-muted-foreground text-center">
                    {i % 6 === 0 ? `${i}` : ""}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
