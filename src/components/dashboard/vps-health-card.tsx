"use client";

import { useQuery } from "@tanstack/react-query";
import { Server, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthData {
  cpu_percent: number;
  ram_used_mb: number;
  ram_total_mb: number;
  disk_used_gb: number;
  disk_total_gb: number;
}

interface Props {
  /** Server-rendered VPS status from DB (running, stopped, error, etc.) */
  vpsStatus: string;
  statusLabel: string;
  statusClassName: string;
  cpuCores: number | null;
  ramGb: number | null;
  storageGb: number | null;
}

function computeHealth(data: HealthData) {
  const ramPct = data.ram_total_mb > 0 ? (data.ram_used_mb / data.ram_total_mb) * 100 : 0;
  const diskPct = data.disk_total_gb > 0 ? (data.disk_used_gb / data.disk_total_gb) * 100 : 0;
  const cpu = data.cpu_percent;

  if (cpu > 90 || ramPct > 95 || diskPct > 95) {
    const reasons: string[] = [];
    if (cpu > 90) reasons.push(`CPU ${cpu.toFixed(0)}%`);
    if (ramPct > 95) reasons.push(`RAM ${ramPct.toFixed(0)}%`);
    if (diskPct > 95) reasons.push(`Disk ${diskPct.toFixed(0)}%`);
    return {
      label: "Critical",
      detail: reasons.join(", "),
      className: "bg-red-600 text-white border-red-600",
    };
  }

  if (cpu > 75 || ramPct > 85 || diskPct > 85) {
    const reasons: string[] = [];
    if (cpu > 75) reasons.push(`CPU ${cpu.toFixed(0)}%`);
    if (ramPct > 85) reasons.push(`RAM ${ramPct.toFixed(0)}%`);
    if (diskPct > 85) reasons.push(`Disk ${diskPct.toFixed(0)}%`);
    return {
      label: "Warning",
      detail: reasons.join(", "),
      className: "bg-yellow-600 text-white border-yellow-600",
    };
  }

  return {
    label: "Healthy",
    detail: `CPU ${cpu.toFixed(0)}% · RAM ${ramPct.toFixed(0)}%`,
    className: "bg-green-600 text-white border-green-600",
  };
}

export function VpsHealthCard({
  vpsStatus,
  statusLabel,
  statusClassName,
  cpuCores,
  ramGb,
  storageGb,
}: Props) {
  const isRunning = vpsStatus === "running";

  // One-time fetch on page load — no polling for Starter overview
  const { data: health, isLoading: healthLoading } = useQuery<HealthData | null>({
    queryKey: ["overview-health"],
    queryFn: async () => {
      const res = await fetch("/api/vps/monitoring");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isRunning,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const healthInfo = health ? computeHealth(health) : null;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          VPS Status
        </CardTitle>
        <Server className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Primary badge: DB status OR health assessment */}
        {isRunning && healthInfo ? (
          <div className="space-y-1.5">
            <Badge className={healthInfo.className}>{healthInfo.label}</Badge>
            <p className="text-xs text-muted-foreground">{healthInfo.detail}</p>
          </div>
        ) : isRunning && healthLoading ? (
          <div className="flex items-center gap-2">
            <Badge className={statusClassName}>{statusLabel}</Badge>
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Badge className={statusClassName}>{statusLabel}</Badge>
        )}

        {/* Provisioned specs */}
        {cpuCores && (
          <p className="text-xs text-muted-foreground mt-2">
            {cpuCores} vCPU &middot; {ramGb}GB RAM &middot; {storageGb}GB
          </p>
        )}
      </CardContent>
    </Card>
  );
}
