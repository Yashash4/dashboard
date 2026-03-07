import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { updateDashboardPassword, enableBasicAuth } from "@/lib/ssh";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

// GET: Fetch current dashboard credentials for a customer
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("dashboard_username, dashboard_password")
    .eq("user_id", userId)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  return NextResponse.json({
    username: vps.dashboard_username || null,
    password: vps.dashboard_password || null,
  });
}

// POST: Change or regenerate dashboard password
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, password } = body as {
    userId?: string;
    password?: string;
  };

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, dashboard_username, dashboard_password")
    .eq("user_id", userId)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  const username = vps.dashboard_username || "admin";
  const newPassword = password || randomBytes(12).toString("base64url").slice(0, 16);

  // First-time setup: if no password was set before, enable Basic Auth on nginx
  const isFirstTime = !vps.dashboard_password;
  let result;
  if (isFirstTime) {
    result = await enableBasicAuth(vps, username, newPassword);
  } else {
    result = await updateDashboardPassword(vps, username, newPassword);
  }

  if (!result.success) {
    return NextResponse.json(
      { error: `SSH error: ${result.error}` },
      { status: 500 }
    );
  }

  // Save to DB
  await admin
    .from("vps_instances")
    .update({ dashboard_password: newPassword })
    .eq("user_id", userId);

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "vps_password_changed", entityType: "vps", entityId: userId, ip });

  return NextResponse.json({ success: true, password: newPassword });
}
