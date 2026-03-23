// ADMIN_HIGH_05 + ADMIN_LOW_10
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { stopOpenClaw } from "@/lib/ssh";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { action, userIds } = body;

  if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Action and userIds are required" }, { status: 400 });
  }

  // ADMIN_HIGH_05: Limit batch size
  if (userIds.length > 50) {
    return NextResponse.json({ error: "Cannot process more than 50 userIds at once" }, { status: 400 });
  }

  const validActions = ["suspend", "activate"];
  if (!validActions.includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  if (userIds.includes(user.id)) {
    return NextResponse.json({ error: "Cannot perform bulk action on your own account" }, { status: 400 });
  }

  const admin = createAdminClient();
  const newStatus = action === "suspend" ? "cancelled" : "active";

  // ADMIN_LOW_10: Suspend should also stop VPS
  if (action === "suspend") {
    const { data: vpsList } = await admin.from("vps_instances").select("user_id, ip_address, ssh_user, ssh_password, ssh_port, status").in("user_id", userIds).eq("status", "running");
    if (vpsList && vpsList.length > 0) {
      // Actually stop OpenClaw processes on each VPS via SSH
      await Promise.allSettled(
        vpsList.map((vps) =>
          stopOpenClaw({
            ip_address: vps.ip_address,
            ssh_user: vps.ssh_user,
            ssh_password: decryptField(vps.ssh_password),
            ssh_port: vps.ssh_port,
          }).catch(() => {})
        )
      );
      await admin.from("vps_instances").update({ status: "stopped" }).in("user_id", userIds).eq("status", "running");
    }
  }

  const { error, count } = await admin.from("subscriptions").update({ status: newStatus }).in("user_id", userIds);
  if (error) return NextResponse.json({ error: "Failed to update subscriptions" }, { status: 500 });

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "bulk_action", entityType: "customer", details: { action, count: count || userIds.length, userIds }, ip });

  return NextResponse.json({ success: true, count: count || userIds.length });
}
