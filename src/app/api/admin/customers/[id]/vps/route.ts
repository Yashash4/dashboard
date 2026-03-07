import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  // Auth: admin only
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

  // Only allow known fields
  const allowedFields = [
    "ip_address",
    "hostname",
    "ssh_user",
    "ssh_password",
    "ssh_port",
    "hostinger_vm_id",
    "cpu_cores",
    "ram_gb",
    "storage_gb",
    "bandwidth_tb",
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify VPS exists for this user
  const { data: existing } = await admin
    .from("vps_instances")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "No VPS found for this user" },
      { status: 404 }
    );
  }

  const { error } = await admin
    .from("vps_instances")
    .update(updateData)
    .eq("user_id", userId);

  if (error) {
    console.error("[admin/vps] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update VPS details" },
      { status: 500 }
    );
  }

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "vps_updated", entityType: "vps", entityId: userId, details: { fields: Object.keys(updateData) }, ip });

  return NextResponse.json({ success: true });
}
