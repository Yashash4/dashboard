"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UptimeData {
  uptime_percentage: number;
  total_checks: number;
  successful_checks: number;
  last_check: string | null;
  recent_statuses: boolean[]; // last 30 checks (true = up)
}

export function UptimeDisplay() {
  const { data, isLoading } = useQuery<UptimeData | null>({
    queryKey: ["vps-uptime"],
    queryFn: async () => {
      const res = await fetch("/api/vps/uptime");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Uptime
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Uptime
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Uptime data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const percentage = data.uptime_percentage;
  const statusColor =
    percentage >= 99
      ? "text-green-500"
      : percentage >= 95
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Gateway Uptime
        </CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${statusColor}`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">
            last {data.total_checks} checks
          </span>
        </div>

        {/* Status bar -- last 30 checks as tiny blocks */}
        {data.recent_statuses.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recent checks</p>
            <div className="flex gap-0.5">
              {data.recent_statuses.map((up, i) => (
                <div
                  key={i}
                  className={`h-5 flex-1 ${
                    up ? "bg-green-600" : "bg-red-600"
                  }`}
                  title={up ? "Up" : "Down"}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{data.total_checks > 30 ? "30 checks ago" : `${data.total_checks} checks ago`}</span>
              <span>Now</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {data.successful_checks} up
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {data.total_checks - data.successful_checks} down
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
