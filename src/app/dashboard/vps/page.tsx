import { Server } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { Card, CardContent } from "@/components/ui/card";
import { VPSControls } from "@/components/dashboard/vps-controls";
import { DashboardPassword } from "@/components/dashboard/dashboard-password";
import { UptimeDisplay } from "@/components/dashboard/uptime-display";
import { SSLChecker } from "@/components/dashboard/ssl-checker";
import { VPSProcessList } from "@/components/dashboard/vps-process-list";
import { VPSMaintenance } from "@/components/dashboard/vps-maintenance";
import { ServiceStatusPanel } from "@/components/dashboard/service-status";
import { ResourceUpgrade } from "@/components/dashboard/resource-upgrade";

export default async function VpsPage() {
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
          "status, hostname, ip_address, cpu_cores, ram_gb, storage_gb, bandwidth_tb, openclaw_dashboard_url, created_at"
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
        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm mb-4">We couldn&apos;t load your data.</p>
        <a href="/vps" className="inline-flex items-center justify-center text-sm font-medium border border-border px-4 py-2 hover:bg-muted transition-colors">
          Try Again
        </a>
      </div>
    );
  }

  const plan = (subscription?.plan as string) || "starter";
  const isPro = hasAccess(plan, "pro");

  if (!vps) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">
          {isPro ? "Mission Control" : "VPS"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isPro
            ? "Full control over your infrastructure."
            : "Manage your VPS instance."}
        </p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No VPS Provisioned</h2>
              <p className="text-muted-foreground">
                Your VPS will appear here once it&apos;s provisioned.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        {isPro ? "Mission Control" : "VPS"}
      </h1>
      <p className="text-muted-foreground mb-6">
        {isPro
          ? "Full control over your infrastructure."
          : "Manage your VPS instance."}
      </p>
      <VPSControls initialData={vps} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <UptimeDisplay />
        <DashboardPassword />
        <ServiceStatusPanel isRunning={vps.status === "running"} />
      </div>
      {vps.hostname && (
        <div className="mt-4">
          <SSLChecker hostname={vps.hostname} />
        </div>
      )}

      {/* Resource Upgrade CTA (Starter only) */}
      {!isPro && vps && (
        <div className="mt-4">
          <ResourceUpgrade
            cpuCores={vps.cpu_cores}
            ramGb={vps.ram_gb}
            storageGb={vps.storage_gb}
            bandwidthTb={vps.bandwidth_tb}
            plan={plan}
          />
        </div>
      )}

      {/* Pro: Process List + Maintenance */}
      {isPro && (
        <div className="mt-6 space-y-4">
          <VPSProcessList />
          <VPSMaintenance />
        </div>
      )}
    </div>
  );
}
