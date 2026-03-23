"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Server,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Loader2,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { vpsStatusConfig } from "@/lib/vps-status";
import { VPSResourceCards } from "./vps-resource-cards";
import { VPSCharts } from "./vps-charts";
import { VPSInstanceDetails } from "./vps-instance-details";
import { VPSLogsPanel } from "./vps-logs-panel";

interface VPSData {
  status: string;
  hostname: string | null;
  ip_address: string;
  cpu_cores: number | null;
  ram_gb: number | null;
  storage_gb: number | null;
  bandwidth_tb: number | null;
  openclaw_dashboard_url: string | null;
  created_at: string;
}

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

interface GatewayHealth {
  active: boolean;
  httpOk: boolean;
  version: string | null;
  pid: number | null;
}

interface ChartPoint {
  time: string;
  cpu: number;
  ram: number;
  netIn: number;
  netOut: number;
}

export function VPSControls({ initialData }: { initialData: VPSData }) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  // LOW_02: Clear stale chart data if VPS hostname changed
  const [chartData, setChartData] = useState<ChartPoint[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedHost = sessionStorage.getItem("vps-chart-host");
      const currentHost = initialData.ip_address;
      if (savedHost && savedHost !== currentHost) {
        sessionStorage.removeItem("vps-chart-data");
        return [];
      }
      const saved = sessionStorage.getItem("vps-chart-data");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const prevNetRef = useRef<{ rx: number; tx: number; ts: number } | null>(null);
  const [netRate, setNetRate] = useState({ inRate: 0, outRate: 0 });

  // Save chart data to sessionStorage
  useEffect(() => {
    if (chartData.length > 0) {
      try {
        sessionStorage.setItem("vps-chart-data", JSON.stringify(chartData));
        sessionStorage.setItem("vps-chart-host", initialData.ip_address);
      } catch {
        // ignore
      }
    }
  }, [chartData, initialData.ip_address]);

  // Poll VPS status
  const { data: statusData } = useQuery({
    queryKey: ["vps-status"],
    queryFn: async () => {
      const res = await fetch("/api/vps/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json() as Promise<VPSData>;
    },
    initialData,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const vps = statusData || initialData;
  const isRunning = vps.status === "running";
  const isStopped = vps.status === "stopped";
  const isTransitioning = vps.status === "restarting" || vps.status === "provisioning";

  // Poll monitoring data every 10s
  const { data: monitoring, isLoading: monitoringLoading } = useQuery({
    queryKey: ["vps-monitoring"],
    queryFn: async () => {
      const res = await fetch("/api/vps/monitoring");
      if (!res.ok) return null;
      return res.json() as Promise<MonitoringData>;
    },
    refetchInterval: isRunning ? 10000 : false,
    refetchIntervalInBackground: false,
    enabled: isRunning,
  });

  // Poll gateway health every 30s
  const { data: gateway, isLoading: gatewayLoading } = useQuery<GatewayHealth>({
    queryKey: ["gateway-health"],
    queryFn: async () => {
      const res = await fetch("/api/vps/gateway-health");
      if (!res.ok)
        return { active: false, httpOk: false, version: null, pid: null };
      return res.json();
    },
    refetchInterval: isRunning ? 30000 : false,
    refetchIntervalInBackground: false,
    enabled: isRunning,
  });

  // Accumulate chart data
  useEffect(() => {
    if (!monitoring) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

    let inRate = 0;
    let outRate = 0;
    const nowMs = Date.now();
    if (prevNetRef.current) {
      const dtSec = (nowMs - prevNetRef.current.ts) / 1000;
      if (dtSec > 0) {
        inRate = Math.max(0, (monitoring.net_rx_bytes - prevNetRef.current.rx) / dtSec);
        outRate = Math.max(0, (monitoring.net_tx_bytes - prevNetRef.current.tx) / dtSec);
      }
    }
    prevNetRef.current = { rx: monitoring.net_rx_bytes, tx: monitoring.net_tx_bytes, ts: nowMs };
    setNetRate({ inRate, outRate });

    const ramPercent = monitoring.ram_total_mb > 0
      ? (monitoring.ram_used_mb / monitoring.ram_total_mb) * 100
      : 0;

    setChartData((prev) => {
      const next = [
        ...prev,
        {
          time: timeStr,
          cpu: Math.round(monitoring.cpu_percent * 10) / 10,
          ram: Math.round(ramPercent * 10) / 10,
          netIn: Math.round(inRate),
          netOut: Math.round(outRate),
        },
      ];
      return next.slice(-180);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoring]);

  // VPS actions
  const performAction = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/vps/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${action} VPS`);
        return;
      }
      toast.success(
        action === "start"
          ? "OpenClaw started successfully"
          : action === "stop"
            ? "OpenClaw stopped successfully"
            : "OpenClaw restarted successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["vps-status"] });
      queryClient.invalidateQueries({ queryKey: ["vps-monitoring"] });
      queryClient.invalidateQueries({ queryKey: ["gateway-health"] });
    } catch {
      toast.error(`Failed to ${action} VPS`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig = vpsStatusConfig[vps.status] || vpsStatusConfig.error;

  return (
    <div className="space-y-6">
      {/* Status + Controls Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2 flex-wrap" role="status" aria-live="polite">
                  <CardTitle className="text-lg">OpenClaw Instance</CardTitle>
                  <Badge className={statusConfig.className}>
                    {isTransitioning && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {statusConfig.label}
                  </Badge>
                  {isRunning && (
                    <>
                      {gatewayLoading ? (
                        <Skeleton className="h-5 w-20" />
                      ) : gateway?.active ? (
                        <Badge className="bg-green-600 text-white border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Gateway
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Gateway Down
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {vps.hostname && (
                    <>
                      <Globe className="h-3.5 w-3.5" />
                      <span>{vps.hostname}</span>
                      <span>&middot;</span>
                    </>
                  )}
                  <span>{vps.ip_address}</span>
                  {gateway?.version && (
                    <>
                      <span>&middot;</span>
                      <span className="font-mono text-xs">v{gateway.version}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(isStopped || vps.status === "error") && (
                <Button size="sm" onClick={() => performAction("start")} disabled={!!actionLoading}>
                  {actionLoading === "start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Start
                </Button>
              )}

              {isRunning && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={!!actionLoading}>
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Stop OpenClaw?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will stop your OpenClaw instance. All connected channels will go offline until you start it again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction disabled={!!actionLoading} onClick={() => performAction("stop")}>
                        {actionLoading === "stop" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Stop
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isRunning && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={!!actionLoading}>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restart OpenClaw?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restart your OpenClaw instance. There will be a brief downtime during the restart.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction disabled={!!actionLoading} onClick={() => performAction("restart")}>
                        {actionLoading === "restart" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Restart
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {vps.openclaw_dashboard_url && isRunning && (
                <Button size="sm" asChild>
                  <a href={vps.openclaw_dashboard_url} target="_blank" rel="noopener noreferrer">
                    Open OpenClaw
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resource Usage (MED_28 sub-component, UX_08 alert thresholds) */}
      <VPSResourceCards
        isRunning={isRunning}
        monitoringLoading={monitoringLoading}
        monitoring={monitoring}
        netRate={netRate}
      />

      {/* Charts (MED_38 tooltip z-index fix) */}
      <VPSCharts chartData={chartData} isRunning={isRunning} />

      {/* Instance Details */}
      <VPSInstanceDetails vps={vps} isRunning={isRunning} monitoring={monitoring} />

      {/* Logs */}
      <VPSLogsPanel showLogs={showLogs} setShowLogs={setShowLogs} />
    </div>
  );
}
