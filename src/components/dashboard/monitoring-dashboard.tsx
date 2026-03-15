"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Clock,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatUptime } from "@/lib/vps-status";

interface MonitoringData {
  cpu_percent: number;
  ram_used_mb: number;
  ram_total_mb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  uptime_seconds: number;
  net_rx_bytes: number;
  net_tx_bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getHealthState(cpu: number, ramPercent: number, diskPercent: number) {
  if (cpu > 90 || ramPercent > 95 || diskPercent > 95) {
    return { label: "Critical", className: "bg-red-600 text-white border-red-600", color: "text-red-500" };
  }
  if (cpu > 75 || ramPercent > 85 || diskPercent > 85) {
    return { label: "Warning", className: "bg-yellow-600 text-white border-yellow-600", color: "text-yellow-500" };
  }
  return { label: "Healthy", className: "bg-green-600 text-white border-green-600", color: "text-green-500" };
}

function getProgressColor(percent: number): string {
  if (percent > 90) return "[&>div]:bg-red-500";
  if (percent > 75) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-green-500";
}

export function MonitoringDashboard({ isRunning }: { isRunning: boolean }) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const {
    data: monitoring,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<MonitoringData>({
    queryKey: ["monitoring-snapshot"],
    queryFn: async () => {
      const res = await fetch("/api/vps/monitoring");
      if (!res.ok) throw new Error("Failed to fetch");
      setLastRefresh(new Date());
      return res.json();
    },
    enabled: isRunning,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    retry: 1,
  });

  if (!isRunning) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Start your VPS to view monitoring data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading monitoring data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !monitoring) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Could not fetch monitoring data. Your server may be starting up.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ramPercent = monitoring.ram_total_mb > 0
    ? (monitoring.ram_used_mb / monitoring.ram_total_mb) * 100
    : 0;
  const diskPercent = monitoring.disk_total_gb > 0
    ? (monitoring.disk_used_gb / monitoring.disk_total_gb) * 100
    : 0;
  const health = getHealthState(monitoring.cpu_percent, ramPercent, diskPercent);

  return (
    <div className="space-y-4">
      {/* Health + Refresh bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={health.className}>{health.label}</Badge>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* 4 Gauge Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPU</CardTitle>
            <Cpu className={`h-4 w-4 ${monitoring.cpu_percent > 75 ? "text-yellow-500" : monitoring.cpu_percent > 90 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold mb-2 ${monitoring.cpu_percent > 90 ? "text-red-500" : monitoring.cpu_percent > 75 ? "text-yellow-500" : ""}`}>
              {monitoring.cpu_percent.toFixed(1)}%
            </p>
            <Progress value={monitoring.cpu_percent} className={`h-2 ${getProgressColor(monitoring.cpu_percent)}`} />
          </CardContent>
        </Card>

        {/* RAM */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memory</CardTitle>
            <MemoryStick className={`h-4 w-4 ${ramPercent > 85 ? "text-yellow-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1.5 mb-2">
              <p className={`text-2xl font-bold ${ramPercent > 95 ? "text-red-500" : ramPercent > 85 ? "text-yellow-500" : ""}`}>
                {ramPercent.toFixed(1)}%
              </p>
              <span className="text-xs text-muted-foreground">
                {(monitoring.ram_used_mb / 1024).toFixed(1)}/{(monitoring.ram_total_mb / 1024).toFixed(1)} GB
              </span>
            </div>
            <Progress value={ramPercent} className={`h-2 ${getProgressColor(ramPercent)}`} />
          </CardContent>
        </Card>

        {/* Disk */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disk</CardTitle>
            <HardDrive className={`h-4 w-4 ${diskPercent > 85 ? "text-yellow-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1.5 mb-2">
              <p className={`text-2xl font-bold ${diskPercent > 95 ? "text-red-500" : diskPercent > 85 ? "text-yellow-500" : ""}`}>
                {diskPercent.toFixed(1)}%
              </p>
              <span className="text-xs text-muted-foreground">
                {monitoring.disk_used_gb}/{monitoring.disk_total_gb} GB
              </span>
            </div>
            <Progress value={diskPercent} className={`h-2 ${getProgressColor(diskPercent)}`} />
          </CardContent>
        </Card>

        {/* Network */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ArrowDown className="h-3 w-3 text-green-500" />
                <span className="text-sm font-medium">{formatBytes(monitoring.net_rx_bytes)}</span>
                <span className="text-xs text-muted-foreground">in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-medium">{formatBytes(monitoring.net_tx_bytes)}</span>
                <span className="text-xs text-muted-foreground">out</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uptime */}
      <Card className="border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{formatUptime(monitoring.uptime_seconds)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
