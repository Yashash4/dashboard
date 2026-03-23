"use client";

import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Globe,
  Activity,
  ArrowUpRight,
  Clock,
  ArrowDown,
  ArrowUp,
  Network,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { vpsStatusConfig } from "@/lib/vps-status";
import { CopyButton } from "@/components/ui/copy-button";

export default function DemoMonitoringPage() {
  const vps = {
    status: "running",
    hostname: "demo.clawhq.tech",
    ip_address: "72.61.232.87",
    cpu_cores: 8,
    ram_gb: 32,
    storage_gb: 400,
    bandwidth_tb: 32,
    openclaw_dashboard_url: "https://demo.clawhq.tech",
  };

  const statusConfig = vpsStatusConfig[vps.status] || vpsStatusConfig.error;

  // Simulated live data
  const liveData = {
    cpu_percent: 23.5,
    ram_used_mb: 12288,
    ram_total_mb: 32768,
    disk_used_gb: 87,
    disk_total_gb: 400,
    uptime_seconds: 4104900, // ~47d 12h
    net_rx_bytes: 1248576000,
    net_tx_bytes: 856432000,
  };

  const ramPercent = (liveData.ram_used_mb / liveData.ram_total_mb) * 100;
  const diskPercent = (liveData.disk_used_gb / liveData.disk_total_gb) * 100;

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Monitoring</h1>
      <p className="text-muted-foreground mb-6">
        Monitor your VPS instance.
      </p>

      {/* Status + Connection Info */}
      <Card className="border-border mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-muted-foreground" />
              <Badge className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Hostname:</span>
                <code className="font-mono text-xs">{vps.hostname}</code>
                <CopyButton value={vps.hostname} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">IP:</span>
                <code className="font-mono text-xs">{vps.ip_address}</code>
                <CopyButton value={vps.ip_address} />
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <a href={vps.openclaw_dashboard_url} target="_blank" rel="noopener noreferrer">
                  OpenClaw Dashboard
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provisioned Specs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.cpu_cores}</p>
            <p className="text-xs text-muted-foreground">vCPU cores</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memory</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.ram_gb}</p>
            <p className="text-xs text-muted-foreground">GB RAM</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.storage_gb}</p>
            <p className="text-xs text-muted-foreground">GB SSD</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bandwidth</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.bandwidth_tb}</p>
            <p className="text-xs text-muted-foreground">TB / month</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Usage */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Live Usage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Usage */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{liveData.cpu_percent}%</p>
              <Progress value={liveData.cpu_percent} className="mt-2 h-2" />
            </CardContent>
          </Card>

          {/* RAM Usage */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">RAM Usage</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{ramPercent.toFixed(1)}%</p>
              <Progress value={ramPercent} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {(liveData.ram_used_mb / 1024).toFixed(1)} / {(liveData.ram_total_mb / 1024).toFixed(1)} GB
              </p>
            </CardContent>
          </Card>

          {/* Disk Usage */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disk Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{diskPercent.toFixed(1)}%</p>
              <Progress value={diskPercent} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {liveData.disk_used_gb} / {liveData.disk_total_gb} GB
              </p>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatUptime(liveData.uptime_seconds)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Network */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Network In</CardTitle>
              <ArrowDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBytes(liveData.net_rx_bytes)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Network Out</CardTitle>
              <ArrowUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBytes(liveData.net_tx_bytes)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
