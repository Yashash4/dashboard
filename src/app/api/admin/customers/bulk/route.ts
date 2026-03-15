import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
  const { action, userIds } = body as {
    action?: string;
    userIds?: string[];
  };

  if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { error: "Action and userIds are required" },
      { status: 400 }
    );
  }

  const validActions = ["suspend", "activate"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Prevent admin from suspending themselves
  if (userIds.includes(user.id)) {
    return NextResponse.json(
      { error: "Cannot perform bulk action on your own account" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const newStatus = action === "suspend" ? "cancelled" : "active";

  const { error, count } = await admin
    .from("subscriptions")
    .update({ status: newStatus })
    .in("user_id", userIds);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update subscriptions" },
      { status: 500 }
    );
  }

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "bulk_action", entityType: "customer", details: { action, count: count || userIds.length, userIds }, ip });

  return NextResponse.json({ success: true, count: count || userIds.length });
}
