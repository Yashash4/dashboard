import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { enableAutoRestart } from "@/lib/ssh";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

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

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port")
    .eq("user_id", userId)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  const result = await enableAutoRestart(vps);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to enable auto-restart" },
      { status: 500 }
    );
  }

  const ip = getClientIp(_request);
  logAudit({ adminId: user.id, action: "auto_restart_enabled", entityType: "vps", entityId: userId, ip });

  return NextResponse.json({ success: true });
}
