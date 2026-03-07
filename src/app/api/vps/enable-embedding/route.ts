import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { enableDashboardEmbedding } from "@/lib/ssh";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json(
      { error: "No VPS instance found" },
      { status: 404 }
    );
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS must be running" },
      { status: 400 }
    );
  }

  try {
    const result = await enableDashboardEmbedding({
      ip_address: vps.ip_address,
      ssh_user: vps.ssh_user,
      ssh_password: vps.ssh_password,
      ssh_port: vps.ssh_port,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to configure embedding";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
