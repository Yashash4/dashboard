"use client";

import {
  Server,
  Square,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  Globe,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  ArrowDown,
  ArrowUp,
  Activity,
  Shield,
  Eye,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vpsStatusConfig } from "@/lib/vps-status";

export default function DemoVpsPage() {
  const vps = {
    status: "running",
    hostname: "demo.clawhq.tech",
    ip_address: "72.61.232.87",
    cpu_cores: 8,
    ram_gb: 32,
    storage_gb: 400,
    bandwidth_tb: 32,
    openclaw_dashboard_url: "https://demo.clawhq.tech",
    created_at: "2026-01-15T00:00:00Z",
  };

  const monitoring = {
    cpu_percent: 12.3,
    ram_used_mb: 11264,
    ram_total_mb: 32768,
    disk_used_gb: 87,
    disk_total_gb: 400,
    uptime_seconds: 4104900,
    net_rx_bytes: 15728640000,
    net_tx_bytes: 8589934592,
  };

  const ramPercent = (monitoring.ram_used_mb / monitoring.ram_total_mb) * 100;
  const diskPercent = (monitoring.disk_used_gb / monitoring.disk_total_gb) * 100;

  const statusConfig = vpsStatusConfig[vps.status] || vpsStatusConfig.error;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mission Control</h1>
      <p className="text-muted-foreground mb-6">
        Full control over your infrastructure.
      </p>

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
                      {statusConfig.label}
                    </Badge>
                    <Badge className="bg-green-600 text-white border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Gateway
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{vps.hostname}</span>
                    <span>&middot;</span>
                    <span>{vps.ip_address}</span>
                    <span>&middot;</span>
                    <span className="font-mono text-xs">v0.9.4</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button size="sm" variant="outline" disabled>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
                <Button size="sm" asChild>
                  <a href={vps.openclaw_dashboard_url} target="_blank" rel="noopener noreferrer">
                    Open OpenClaw
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Resource Usage Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CPU Usage
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-2">
                {monitoring.cpu_percent.toFixed(1)}%
              </p>
              <Progress value={monitoring.cpu_percent} className="h-2" />
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
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-2xl font-bold">
                  {(monitoring.ram_used_mb / 1024).toFixed(1)} /{" "}
                  {(monitoring.ram_total_mb / 1024).toFixed(1)} GB
                </p>
                <span className="text-sm text-muted-foreground">
                  ({ramPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress value={ramPercent} className="h-2" />
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
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-2xl font-bold">
                  {monitoring.disk_used_gb} / {monitoring.disk_total_gb} GB
                </p>
                <span className="text-sm text-muted-foreground">
                  ({diskPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress value={diskPercent} className="h-2" />
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
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ArrowDown className="h-3 w-3 text-green-500" />
                  <span className="text-sm font-medium">2.4 KB/s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="h-3 w-3 text-blue-500" />
                  <span className="text-sm font-medium">1.1 KB/s</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  14.65 GB in / 8.00 GB out
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts placeholder */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">CPU & RAM Usage</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />CPU</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />RAM</span>
                  </div>
                </div>
                <div className="h-28 flex items-end gap-[3px]">
                  {[18,22,19,25,20,28,24,30,22,35,28,32,25,38,30,26,22,28,24,20,26,22,30,25].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col-reverse gap-[1px]">
                      <div className="rounded-t-sm bg-primary/60" style={{ height: `${h}%` }} />
                      <div className="rounded-t-sm bg-emerald-500/40" style={{ height: `${h * 0.7}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Network I/O</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Download</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />Upload</span>
                  </div>
                </div>
                <div className="h-28 flex items-end gap-[3px]">
                  {[10,15,12,20,25,18,30,35,28,40,45,38,50,42,35,55,48,60,52,45,65,58,70,62].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col-reverse gap-[1px]">
                      <div className="rounded-t-sm bg-blue-500/50" style={{ height: `${h}%` }} />
                      <div className="rounded-t-sm bg-cyan-500/30" style={{ height: `${h * 0.4}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instance Details */}
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
                <p className="text-sm font-medium">{vps.cpu_cores} vCPU</p>
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
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Uptime
                </p>
                <p className="text-sm font-medium">47d 12h 35m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Uptime, Password, Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Uptime Display */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gateway Uptime
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-500">
                99.8%
              </span>
              <span className="text-xs text-muted-foreground">
                last 30 checks
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Recent checks</p>
              <div className="flex gap-0.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-5 flex-1 ${i === 14 ? "bg-red-600" : "bg-green-600"}`}
                    title={i === 14 ? "Down" : "Up"}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>30 checks ago</span>
                <span>Now</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                29 up
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                1 down
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Password */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dashboard Password
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Login credentials for your OpenClaw dashboard at {vps.hostname}.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Username</Label>
              <Input value="admin" readOnly className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  type="password"
                  value="demopassword123"
                  readOnly
                  className="font-mono text-sm pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  disabled
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Services</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "OpenClaw Gateway", port: 18789, status: "running" },
                { name: "Nginx", port: 443, status: "running" },
                { name: "Agent Runtime", port: 3100, status: "running" },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{svc.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">:{svc.port}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pro: Process List */}
      <div className="mt-6 space-y-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Running Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Process</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">PID</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">CPU %</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Memory</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "openclaw-gateway", pid: 1234, cpu: "2.3", mem: "256 MB", status: "running" },
                    { name: "nginx", pid: 892, cpu: "0.1", mem: "32 MB", status: "running" },
                    { name: "node (agent-runtime)", pid: 2341, cpu: "5.7", mem: "512 MB", status: "running" },
                  ].map((proc) => (
                    <tr key={proc.pid} className="border-b border-border">
                      <td className="py-2 font-mono text-xs">{proc.name}</td>
                      <td className="py-2 text-muted-foreground">{proc.pid}</td>
                      <td className="py-2">{proc.cpu}%</td>
                      <td className="py-2">{proc.mem}</td>
                      <td className="py-2">
                        <Badge className="bg-green-600 text-white border-green-600 text-xs">
                          {proc.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
