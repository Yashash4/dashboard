"use client";

import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024)
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return "[&>div]:bg-red-500";
  if (percent >= 80) return "[&>div]:bg-yellow-500";
  return "";
}

export function VPSResourceCards({
  isRunning,
  monitoringLoading,
  monitoring,
  netRate,
}: {
  isRunning: boolean;
  monitoringLoading: boolean;
  monitoring: MonitoringData | null | undefined;
  netRate: { inRate: number; outRate: number };
}) {
  const cpuPercent = monitoring?.cpu_percent ?? 0;
  const ramPercent =
    monitoring && monitoring.ram_total_mb > 0
      ? (monitoring.ram_used_mb / monitoring.ram_total_mb) * 100
      : 0;
  const diskPercent =
    monitoring && monitoring.disk_total_gb > 0
      ? (monitoring.disk_used_gb / monitoring.disk_total_gb) * 100
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            CPU Usage
          </CardTitle>
          <Cpu className={`h-4 w-4 ${cpuPercent >= 90 ? "text-red-500" : cpuPercent >= 80 ? "text-yellow-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          {!isRunning ? (
            <p className="text-sm text-muted-foreground">VPS is offline</p>
          ) : monitoringLoading || !monitoring ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <>
              <p className={`text-2xl font-bold mb-2 ${cpuPercent >= 90 ? "text-red-500" : cpuPercent >= 80 ? "text-yellow-500" : ""}`}>
                {monitoring.cpu_percent.toFixed(1)}%
              </p>
              <Progress value={monitoring.cpu_percent} className={`h-2 ${getProgressColor(cpuPercent)}`} />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            RAM Usage
          </CardTitle>
          <MemoryStick className={`h-4 w-4 ${ramPercent >= 90 ? "text-red-500" : ramPercent >= 80 ? "text-yellow-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          {!isRunning ? (
            <p className="text-sm text-muted-foreground">VPS is offline</p>
          ) : monitoringLoading || !monitoring ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`text-2xl font-bold ${ramPercent >= 90 ? "text-red-500" : ramPercent >= 80 ? "text-yellow-500" : ""}`}>
                  {(monitoring.ram_used_mb / 1024).toFixed(1)} /{" "}
                  {(monitoring.ram_total_mb / 1024).toFixed(1)} GB
                </p>
                <span className="text-sm text-muted-foreground">
                  ({ramPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={ramPercent}
                className={`h-2 ${getProgressColor(ramPercent)}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Disk Usage
          </CardTitle>
          <HardDrive className={`h-4 w-4 ${diskPercent >= 90 ? "text-red-500" : diskPercent >= 80 ? "text-yellow-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          {!isRunning ? (
            <p className="text-sm text-muted-foreground">VPS is offline</p>
          ) : monitoringLoading || !monitoring ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`text-2xl font-bold ${diskPercent >= 90 ? "text-red-500" : diskPercent >= 80 ? "text-yellow-500" : ""}`}>
                  {monitoring.disk_used_gb} / {monitoring.disk_total_gb} GB
                </p>
                <span className="text-sm text-muted-foreground">
                  ({diskPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={diskPercent}
                className={`h-2 ${getProgressColor(diskPercent)}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Network I/O
          </CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {!isRunning ? (
            <p className="text-sm text-muted-foreground">VPS is offline</p>
          ) : monitoringLoading || !monitoring ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ArrowDown className="h-3 w-3 text-green-500" />
                <span className="text-sm font-medium">
                  {formatRate(netRate.inRate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-medium">
                  {formatRate(netRate.outRate)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {formatBytes(monitoring.net_rx_bytes)} in /{" "}
                {formatBytes(monitoring.net_tx_bytes)} out
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
