import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

// 2.25: Log admin login events to audit trail
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    // Not an admin — no audit entry needed, just return OK
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  logAudit({
    adminId: user.id,
    action: "admin_login",
    entityType: "auth",
    entityId: user.id,
    details: { email: profile.email },
    ip,
  });

  return NextResponse.json({ ok: true });
}
