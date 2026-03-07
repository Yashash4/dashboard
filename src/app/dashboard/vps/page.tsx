import { Server } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { VPSControls } from "@/components/dashboard/vps-controls";
import { DashboardPassword } from "@/components/dashboard/dashboard-password";
import { UptimeDisplay } from "@/components/dashboard/uptime-display";

export default async function VpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: vps } = await supabase
    .from("vps_instances")
    .select(
      "status, hostname, ip_address, cpu_cores, ram_gb, storage_gb, bandwidth_tb, openclaw_dashboard_url, created_at"
    )
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">VPS</h1>
        <p className="text-muted-foreground mb-6">Manage your VPS instance.</p>
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
      <h1 className="text-2xl font-bold mb-1">VPS</h1>
      <p className="text-muted-foreground mb-6">Manage your VPS instance.</p>
      <VPSControls initialData={vps} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <UptimeDisplay />
        <DashboardPassword />
      </div>
    </div>
  );
}
