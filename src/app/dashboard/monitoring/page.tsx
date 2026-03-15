import Link from "next/link";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Globe,
  Activity,
  ArrowUpRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { vpsStatusConfig } from "@/lib/vps-status";
import { hasAccess } from "@/lib/tier";
import { CopyButton } from "@/components/ui/copy-button";
import { MonitoringDashboard } from "@/components/dashboard/monitoring-dashboard";

export default async function MonitoringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  let vps: any = null;
  let subscription: any = null;

  try {
    const [vpsRes, subRes] = await Promise.all([
      supabase
        .from("vps_instances")
        .select(
          "status, hostname, ip_address, cpu_cores, ram_gb, storage_gb, bandwidth_tb, openclaw_dashboard_url"
        )
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single(),
    ]);
    vps = vpsRes.data;
    subscription = subRes.data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load monitoring data. Please refresh the page.</p>
      </div>
    );
  }

  if (!vps) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Monitoring</h1>
        <p className="text-muted-foreground mb-6">
          Monitor your VPS instance.
        </p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No VPS Provisioned</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your VPS monitoring will appear here once your instance is
                provisioned.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = vpsStatusConfig[vps.status] || vpsStatusConfig.error;
  const plan = (subscription?.plan as string) || "starter";
  const isPro = hasAccess(plan, "pro");
  const isRunning = vps.status === "running";

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
              {vps.hostname && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Hostname:</span>
                  <code className="font-mono text-xs">{vps.hostname}</code>
                  <CopyButton value={vps.hostname} />
                </div>
              )}
              {vps.ip_address && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">IP:</span>
                <code className="font-mono text-xs">{vps.ip_address}</code>
                <CopyButton value={vps.ip_address} />
              </div>
              )}
              {vps.openclaw_dashboard_url && (
                <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                  <a
                    href={vps.openclaw_dashboard_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenClaw Dashboard
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
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
            <p className="text-2xl font-bold">{vps.cpu_cores ?? "—"}</p>
            <p className="text-xs text-muted-foreground">vCPU cores</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memory</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.ram_gb ?? "—"}</p>
            <p className="text-xs text-muted-foreground">GB RAM</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.storage_gb ?? "—"}</p>
            <p className="text-xs text-muted-foreground">GB SSD</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bandwidth</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vps.bandwidth_tb ?? "—"}</p>
            <p className="text-xs text-muted-foreground">TB / month</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Monitoring Gauges */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Live Usage</h2>
        <MonitoringDashboard isRunning={isRunning} />
      </div>

      {/* Pro Upsell */}
      {!isPro && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">
                  Want real-time charts, process management, and historical data?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro for continuous monitoring, auto-refresh charts,
                  process list, and advanced analytics.
                </p>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/billing">Upgrade to Pro</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
