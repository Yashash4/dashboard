"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Server,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VpsInstance {
  user_id: string;
  hostname: string | null;
  ip_address: string | null;
  status: string;
  ssh_user: string | null;
  ssh_port: number | null;
  users: any;
}

interface HealthResult {
  userId: string;
  status: "checking" | "healthy" | "degraded" | "unhealthy" | "error";
  services?: {
    openclaw?: boolean;
    nginx?: boolean;
    embeddings?: boolean;
    dataApi?: boolean;
  };
  resources?: {
    cpu_percent: number;
    ram_percent: number;
    disk_percent: string;
    uptime_seconds: number;
  };
  error?: string;
}

export function AdminBulkHealth({ instances }: { instances: VpsInstance[] }) {
  const router = useRouter();
  const [healthMap, setHealthMap] = useState<Record<string, HealthResult>>({});
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const checkOne = async (instance: VpsInstance): Promise<HealthResult> => {
    try {
      const res = await fetch(`/api/admin/customers/${instance.user_id}/services`);
      const data = await res.json();

      if (data.error) {
        return { userId: instance.user_id, status: "error", error: data.error };
      }

      const allUp =
        data.services?.openclaw &&
        data.services?.nginx;

      const highResources =
        data.resources?.cpu_percent > 90 || data.resources?.ram_percent > 90;

      let status: HealthResult["status"] = "healthy";
      if (!allUp) status = "unhealthy";
      else if (highResources) status = "degraded";

      return {
        userId: instance.user_id,
        status,
        services: data.services,
        resources: data.resources
          ? {
              cpu_percent: data.resources.cpu_percent,
              ram_percent: data.resources.ram_percent,
              disk_percent: data.resources.disk_percent,
              uptime_seconds: data.resources.uptime_seconds,
            }
          : undefined,
      };
    } catch {
      return { userId: instance.user_id, status: "error", error: "Network error" };
    }
  };

  const checkAll = async () => {
    const running = instances.filter((i) => i.status === "running");
    if (running.length === 0) {
      toast.info("No running VPSes to check");
      return;
    }

    setChecking(true);
    setProgress({ done: 0, total: running.length });

    // Check in batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < running.length; i += BATCH_SIZE) {
      const batch = running.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(checkOne));

      for (const result of results) {
        if (result.status === "fulfilled") {
          const hr = result.value;
          setHealthMap((prev) => ({ ...prev, [hr.userId]: hr }));
        }
      }
      setProgress((prev) => ({ ...prev, done: Math.min(i + BATCH_SIZE, running.length) }));
    }

    setChecking(false);
    toast.success(`Checked ${running.length} VPSes`);
  };

  const running = instances.filter((i) => i.status === "running");
  const stopped = instances.filter((i) => i.status !== "running");
  const healthyCount = Object.values(healthMap).filter((h) => h.status === "healthy").length;
  const degradedCount = Object.values(healthMap).filter((h) => h.status === "degraded").length;
  const unhealthyCount = Object.values(healthMap).filter((h) => h.status === "unhealthy" || h.status === "error").length;

  const sortedInstances = [...instances].sort((a, b) => {
    const ha = healthMap[a.user_id];
    const hb = healthMap[b.user_id];
    const order = { unhealthy: 0, error: 0, degraded: 1, checking: 2, healthy: 3 };
    const oa = ha ? (order[ha.status] ?? 4) : 4;
    const ob = hb ? (order[hb.status] ?? 4) : 4;
    return oa - ob;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bulk Health Check</h1>
          <p className="text-muted-foreground">
            Check all VPSes at once. {running.length} running / {instances.length} total.
          </p>
        </div>
        <Button onClick={checkAll} disabled={checking}>
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking {progress.done}/{progress.total}...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check All VPSes
            </>
          )}
        </Button>
      </div>

      {/* Summary cards */}
      {Object.keys(healthMap).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{healthyCount}</p>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{degradedCount}</p>
                  <p className="text-xs text-muted-foreground">Degraded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{unhealthyCount}</p>
                  <p className="text-xs text-muted-foreground">Unhealthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stopped.length}</p>
                  <p className="text-xs text-muted-foreground">Stopped</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>VPS Status</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>CPU</TableHead>
              <TableHead>RAM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInstances.map((inst) => {
              const u = Array.isArray(inst.users) ? inst.users[0] : inst.users;
              const health = healthMap[inst.user_id];

              return (
                <TableRow
                  key={inst.user_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/customers/${inst.user_id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{u?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{inst.hostname || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{inst.ip_address || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        inst.status === "running"
                          ? "bg-green-600/20 text-green-500 border-green-600/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {inst.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {health ? (
                      health.status === "checking" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : health.status === "healthy" ? (
                        <Badge className="bg-green-600/20 text-green-500 border-green-600/30 text-xs">Healthy</Badge>
                      ) : health.status === "degraded" ? (
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Degraded</Badge>
                      ) : (
                        <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">
                          {health.error?.slice(0, 20) || "Unhealthy"}
                        </Badge>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {health?.services ? (
                      <div className="flex gap-1">
                        <span title="OpenClaw">{health.services.openclaw ? "🟢" : "🔴"}</span>
                        <span title="Nginx">{health.services.nginx ? "🟢" : "🔴"}</span>
                        <span title="Embeddings">{health.services.embeddings ? "🟢" : "🔴"}</span>
                        <span title="Data API">{health.services.dataApi ? "🟢" : "🔴"}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {health?.resources ? `${health.resources.cpu_percent.toFixed(0)}%` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {health?.resources ? `${health.resources.ram_percent.toFixed(0)}%` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
