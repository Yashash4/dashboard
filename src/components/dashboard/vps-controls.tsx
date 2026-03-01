"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Server,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Globe,
  Loader2,
  ScrollText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { vpsStatusConfig, formatUptime } from "@/lib/vps-status";

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
}

export function VPSControls({ initialData }: { initialData: VPSData }) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Poll VPS status (only when page is visible)
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
  const isTransitioning =
    vps.status === "restarting" || vps.status === "provisioning";

  // Poll monitoring data (only when running + page visible)
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

  // Fetch logs (only when logs panel is open)
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["vps-logs"],
    queryFn: async () => {
      const res = await fetch("/api/vps/logs?lines=200");
      if (!res.ok) {
        const err = await res.json();
        return err.error || "Failed to fetch logs";
      }
      const data = await res.json();
      return data.logs as string;
    },
    enabled: showLogs,
    refetchInterval: false,
  });

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsData && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logsData]);

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
      if (showLogs) refetchLogs();
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">OpenClaw Instance</CardTitle>
                  <Badge className={statusConfig.className}>
                    {isTransitioning && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    {statusConfig.label}
                  </Badge>
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Start button — shown when stopped or error */}
              {(isStopped || vps.status === "error") && (
                <Button
                  size="sm"
                  onClick={() => performAction("start")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "start" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Start
                </Button>
              )}

              {/* Stop button — shown when running */}
              {isRunning && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!actionLoading}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Stop OpenClaw?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will stop your OpenClaw instance. All connected
                        channels will go offline until you start it again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => performAction("stop")}
                      >
                        Stop
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Restart button — shown when running */}
              {isRunning && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!actionLoading}
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restart OpenClaw?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restart your OpenClaw instance. There will be a
                        brief downtime during the restart.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => performAction("restart")}
                      >
                        Restart
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Open OpenClaw */}
              {vps.openclaw_dashboard_url && isRunning && (
                <Button size="sm" asChild>
                  <a
                    href={vps.openclaw_dashboard_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open OpenClaw
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPU Usage
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!isRunning ? (
              <p className="text-sm text-muted-foreground">VPS is offline</p>
            ) : monitoringLoading || !monitoring ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <>
                <p className="text-2xl font-bold mb-2">
                  {monitoring.cpu_percent.toFixed(1)}%
                </p>
                <Progress value={monitoring.cpu_percent} className="h-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              RAM Usage
            </CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!isRunning ? (
              <p className="text-sm text-muted-foreground">VPS is offline</p>
            ) : monitoringLoading || !monitoring ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-2xl font-bold">
                    {(monitoring.ram_used_mb / 1024).toFixed(1)} /{" "}
                    {(monitoring.ram_total_mb / 1024).toFixed(1)} GB
                  </p>
                  <span className="text-sm text-muted-foreground">
                    ({monitoring.ram_total_mb > 0
                      ? ((monitoring.ram_used_mb / monitoring.ram_total_mb) * 100).toFixed(1)
                      : "0"}%)
                  </span>
                </div>
                <Progress
                  value={
                    monitoring.ram_total_mb > 0
                      ? (monitoring.ram_used_mb / monitoring.ram_total_mb) * 100
                      : 0
                  }
                  className="h-2"
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
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!isRunning ? (
              <p className="text-sm text-muted-foreground">VPS is offline</p>
            ) : monitoringLoading || !monitoring ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-2xl font-bold">
                    {monitoring.disk_used_gb} / {monitoring.disk_total_gb} GB
                  </p>
                  <span className="text-sm text-muted-foreground">
                    ({monitoring.disk_total_gb > 0
                      ? ((monitoring.disk_used_gb / monitoring.disk_total_gb) * 100).toFixed(1)
                      : "0"}%)
                  </span>
                </div>
                <Progress
                  value={
                    monitoring.disk_total_gb > 0
                      ? (monitoring.disk_used_gb / monitoring.disk_total_gb) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* VPS Specs + Uptime */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Instance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">CPU</p>
              <p className="text-sm font-medium">
                {vps.cpu_cores} vCPU
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">RAM</p>
              <p className="text-sm font-medium">{vps.ram_gb} GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Storage</p>
              <p className="text-sm font-medium">{vps.storage_gb} GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bandwidth</p>
              <p className="text-sm font-medium">{vps.bandwidth_tb} TB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Provisioned</p>
              <p className="text-sm font-medium">
                {new Date(vps.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            {isRunning && monitoring && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Uptime
                </p>
                <p className="text-sm font-medium">
                  {formatUptime(monitoring.uptime_seconds)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Logs
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {showLogs && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetchLogs()}
                disabled={logsLoading}
              >
                {logsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? "Hide Logs" : "View Logs"}
            </Button>
          </div>
        </CardHeader>
        {showLogs && (
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <div className="bg-black/50 rounded-md p-4 max-h-96 overflow-y-auto font-mono text-xs text-green-400 whitespace-pre-wrap">
                {logsData || "No logs available"}
                <div ref={logsEndRef} />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
