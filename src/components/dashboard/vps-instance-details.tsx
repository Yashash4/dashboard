"use client";

import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUptime } from "@/lib/vps-status";

interface VPSData {
  cpu_cores: number | null;
  ram_gb: number | null;
  storage_gb: number | null;
  bandwidth_tb: number | null;
  created_at: string;
}

interface MonitoringData {
  uptime_seconds: number;
}

export function VPSInstanceDetails({
  vps,
  isRunning,
  monitoring,
}: {
  vps: VPSData;
  isRunning: boolean;
  monitoring: MonitoringData | null | undefined;
}) {
  return (
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
  );
}
