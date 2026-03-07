import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getVM } from "@/lib/hostinger";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: vps, error } = await admin
    .from("vps_instances")
    .select(
      "id, status, hostname, ip_address, cpu_cores, ram_gb, storage_gb, bandwidth_tb, openclaw_dashboard_url, created_at, hostinger_vm_id"
    )
    .eq("user_id", user.id)
    .single();

  if (error || !vps) {
    return NextResponse.json({ error: "VPS not found" }, { status: 404 });
  }

  // Sync status from Hostinger API if VM ID is available
  if (vps.hostinger_vm_id) {
    try {
      const vm = await getVM(vps.hostinger_vm_id);
      const hostingerState = vm.state === "running" ? "running" : "stopped";

      if (hostingerState !== vps.status && vps.status !== "restarting") {
        await admin
          .from("vps_instances")
          .update({ status: hostingerState })
          .eq("id", vps.id);
        vps.status = hostingerState;
      }
    } catch {
      // Hostinger API failed — keep DB status
    }
  }

  return NextResponse.json({
    status: vps.status,
    hostname: vps.hostname,
    ip_address: vps.ip_address,
    cpu_cores: vps.cpu_cores,
    ram_gb: vps.ram_gb,
    storage_gb: vps.storage_gb,
    bandwidth_tb: vps.bandwidth_tb,
    openclaw_dashboard_url: vps.openclaw_dashboard_url,
    created_at: vps.created_at,
  });
}
