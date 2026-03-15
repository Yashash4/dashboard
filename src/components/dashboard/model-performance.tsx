"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceData {
  message_count: number;
  error_count: number;
  avg_response_time_ms: number;
  fastest_ms: number;
  slowest_ms: number;
  success_rate: number;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ModelPerformance({ modelName }: { modelName: string }) {
  const { data, isLoading } = useQuery<PerformanceData | null>({
    queryKey: ["model-performance", modelName],
    queryFn: async () => {
      const res = await fetch(`/api/models/performance?model=${encodeURIComponent(modelName)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Model Performance (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.message_count === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Model Performance (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No usage data yet. Start chatting with your agents to see performance stats.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">Model Performance (7d)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Messages</span>
            </div>
            <p className="text-lg font-bold">{data.message_count.toLocaleString()}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Response</span>
            </div>
            <p className="text-lg font-bold">{formatMs(data.avg_response_time_ms)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatMs(data.fastest_ms)} — {formatMs(data.slowest_ms)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Success Rate</span>
            </div>
            <p className={`text-lg font-bold ${data.success_rate >= 95 ? "text-green-500" : data.success_rate >= 80 ? "text-yellow-500" : "text-red-500"}`}>
              {data.success_rate.toFixed(1)}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Errors</span>
            </div>
            <p className="text-lg font-bold">{data.error_count}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
