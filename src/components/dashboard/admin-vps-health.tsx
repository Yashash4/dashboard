"use client";

import { useState, useEffect } from "react";
import {
  Server,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VpsInstance {
  user_id: string;
  hostname: string | null;
  ip_address: string | null;
  status: string;
  users: any;
}

interface HealthResult {
  userId: string;
  status: "checking" | "healthy" | "unhealthy" | "error";
  detail?: string;
}

export function AdminVpsHealth({ instances }: { instances: VpsInstance[] }) {
  const [healthMap, setHealthMap] = useState<Record<string, HealthResult>>({});
  const [checking, setChecking] = useState(false);
  const [enablingAutoRestart, setEnablingAutoRestart] = useState<string | null>(
    null
  );

  const checkHealth = async (instance: VpsInstance) => {
    setHealthMap((prev) => ({
      ...prev,
      [instance.user_id]: {
        userId: instance.user_id,
        status: "checking",
      },
    }));

    try {
      const res = await fetch(
        `/api/admin/customers/${instance.user_id}/health`
      );
      const data = await res.json();

      setHealthMap((prev) => ({
        ...prev,
        [instance.user_id]: {
          userId: instance.user_id,
          status: data.gateway_active ? "healthy" : "unhealthy",
          detail: data.gateway_active
            ? `v${data.version || "?"} · PID ${data.pid || "?"}`
            : data.error || "Gateway not responding",
        },
      }));
    } catch {
      setHealthMap((prev) => ({
        ...prev,
        [instance.user_id]: {
          userId: instance.user_id,
          status: "error",
          detail: "Failed to check",
        },
      }));
    }
  };

  const checkAll = async () => {
    setChecking(true);
    const running = instances.filter((i) => i.status === "running");
    await Promise.allSettled(running.map(checkHealth));
    setChecking(false);
  };

  const handleEnableAutoRestart = async (userId: string) => {
    setEnablingAutoRestart(userId);
    try {
      const res = await fetch(
        `/api/admin/customers/${userId}/auto-restart`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to enable auto-restart");
        return;
      }
      toast.success("Auto-restart enabled");
    } catch {
      toast.error("Network error");
    } finally {
      setEnablingAutoRestart(null);
    }
  };

  const running = instances.filter((i) => i.status === "running");
  const stopped = instances.filter((i) => i.status !== "running");
  const healthyCount = Object.values(healthMap).filter(
    (h) => h.status === "healthy"
  ).length;
  const unhealthyCount = Object.values(healthMap).filter(
    (h) => h.status === "unhealthy"
  ).length;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          VPS Health ({running.length} running / {instances.length} total)
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={checkAll}
          disabled={checking || running.length === 0}
        >
          {checking ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Check All
        </Button>
      </CardHeader>
      <CardContent>
        {Object.keys(healthMap).length > 0 && (
          <div className="flex gap-3 mb-3 text-xs">
            {healthyCount > 0 && (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="h-3 w-3" /> {healthyCount} healthy
              </span>
            )}
            {unhealthyCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" /> {unhealthyCount} unhealthy
              </span>
            )}
          </div>
        )}

        {instances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No VPS instances.</p>
        ) : (
          <div className="space-y-2">
            {instances.map((inst) => {
              const health = healthMap[inst.user_id];
              const u = Array.isArray(inst.users) ? inst.users[0] : inst.users;
              const userName = u?.name || u?.email || "Unknown";

              return (
                <div
                  key={inst.user_id}
                  className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{userName}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {inst.hostname || inst.ip_address || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inst.status !== "running" ? (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/30 text-muted-foreground text-xs"
                      >
                        {inst.status}
                      </Badge>
                    ) : health ? (
                      <>
                        {health.status === "checking" && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {health.status === "healthy" && (
                          <Badge className="bg-green-600 text-white text-xs border-green-600">
                            Healthy
                          </Badge>
                        )}
                        {health.status === "unhealthy" && (
                          <div className="flex items-center gap-1">
                            <Badge className="bg-red-600 text-white text-xs border-red-600">
                              Down
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-1.5"
                              onClick={() =>
                                handleEnableAutoRestart(inst.user_id)
                              }
                              disabled={
                                enablingAutoRestart === inst.user_id
                              }
                              title="Enable auto-restart"
                            >
                              {enablingAutoRestart === inst.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {health.status === "error" && (
                          <Badge
                            variant="outline"
                            className="border-yellow-600/50 text-yellow-500 text-xs"
                          >
                            Error
                          </Badge>
                        )}
                        {health.detail && (
                          <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">
                            {health.detail}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge className="bg-green-600/20 text-green-500 text-xs border-green-600/30">
                        Running
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
