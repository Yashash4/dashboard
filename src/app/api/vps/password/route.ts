import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { updateDashboardPassword } from "@/lib/ssh";

export const dynamic = "force-dynamic";

// GET: Fetch current dashboard credentials for the logged-in user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("dashboard_username, dashboard_password, hostname")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  return NextResponse.json({
    username: vps.dashboard_username || null,
    password: vps.dashboard_password || null,
    hostname: vps.hostname || null,
  });
}

// POST: Customer changes their own dashboard password
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, dashboard_username")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  const username = vps.dashboard_username || "admin";

  // Update on VPS via SSH
  const result = await updateDashboardPassword(vps, username, password);

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }

  // Save to DB
  await admin
    .from("vps_instances")
    .update({ dashboard_password: password })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
