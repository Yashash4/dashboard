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
  Network,
  CheckCircle2,
  XCircle,
  ArrowDown,
  ArrowUp,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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

export function VPSControls({ initialData }: { initialData: VPSData }) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const prevNetRef = useRef<{ rx: number; tx: number; ts: number } | null>(
    null
  );
  const [netRate, setNetRate] = useState({ inRate: 0, outRate: 0 });

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
  const isTransitioning =
    vps.status === "restarting" || vps.status === "provisioning";

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

  const [logsError, setLogsError] = useState<string | null>(null);

  // Fetch logs on demand
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["vps-logs"],
    queryFn: async () => {
      const res = await fetch("/api/vps/logs?lines=200");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLogsError(err.error || "Failed to fetch logs");
        return "";
      }
      setLogsError(null);
      const data = await res.json();
      return data.logs as string;
    },
    enabled: showLogs,
    refetchInterval: false,
  });

  // Auto-scroll logs
  useEffect(() => {
    if (logsData && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logsData]);

  // Accumulate chart data
  useEffect(() => {
    if (!monitoring) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    let inRate = 0;
    let outRate = 0;
    const nowMs = Date.now();
    if (prevNetRef.current) {
      const dtSec = (nowMs - prevNetRef.current.ts) / 1000;
      if (dtSec > 0) {
        inRate = Math.max(
          0,
          (monitoring.net_rx_bytes - prevNetRef.current.rx) / dtSec
        );
        outRate = Math.max(
          0,
          (monitoring.net_tx_bytes - prevNetRef.current.tx) / dtSec
        );
      }
    }
    prevNetRef.current = {
      rx: monitoring.net_rx_bytes,
      tx: monitoring.net_tx_bytes,
      ts: nowMs,
    };
    setNetRate({ inRate, outRate });

    const ramPercent =
      monitoring.ram_total_mb > 0
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
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">OpenClaw Instance</CardTitle>
                  <Badge className={statusConfig.className}>
                    {isTransitioning && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
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
                      <span className="font-mono text-xs">
                        v{gateway.version}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

      {/* Resource Usage — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    (
                    {monitoring.ram_total_mb > 0
                      ? (
                          (monitoring.ram_used_mb / monitoring.ram_total_mb) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %)
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
                    (
                    {monitoring.disk_total_gb > 0
                      ? (
                          (monitoring.disk_used_gb / monitoring.disk_total_gb) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %)
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

      {/* Charts */}
      {chartData.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                CPU & RAM Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} width={45} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === "cpu" ? "CPU" : "RAM"]}
                    />
                    <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="url(#cpuGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="ram" stroke="hsl(142, 76%, 36%)" fill="url(#ramGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-primary" />
                  <span className="text-xs text-muted-foreground">CPU</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
                  <span className="text-xs text-muted-foreground">RAM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="netInGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="netOutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={60} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatRate(v)} width={65} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number, name: string) => [formatRate(value), name === "netIn" ? "Download" : "Upload"]}
                    />
                    <Area type="monotone" dataKey="netIn" stroke="hsl(142, 76%, 36%)" fill="url(#netInGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="netOut" stroke="hsl(217, 91%, 60%)" fill="url(#netOutGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <div className="flex items-center gap-1.5">
                  <ArrowDown className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Download</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length < 2 && isRunning && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Activity className="h-6 w-6 mx-auto mb-2 animate-pulse" />
              Collecting chart data...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instance Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Instance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {vps.cpu_cores != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">CPU</p>
                <p className="text-sm font-medium">{vps.cpu_cores} vCPU</p>
              </div>
            )}
            {vps.ram_gb != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">RAM</p>
                <p className="text-sm font-medium">{vps.ram_gb} GB</p>
              </div>
            )}
            {vps.storage_gb != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Storage</p>
                <p className="text-sm font-medium">{vps.storage_gb} GB</p>
              </div>
            )}
            {vps.bandwidth_tb != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bandwidth</p>
                <p className="text-sm font-medium">{vps.bandwidth_tb} TB</p>
              </div>
            )}
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
              Gateway Logs
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
            ) : logsError ? (
              <div className="bg-black/50 p-4 max-h-96 overflow-y-auto text-sm text-muted-foreground">
                Could not load logs. Your server may be stopped.
              </div>
            ) : (
              <div className="bg-black/50 p-4 max-h-96 overflow-y-auto font-mono text-xs text-green-400 whitespace-pre-wrap">
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
