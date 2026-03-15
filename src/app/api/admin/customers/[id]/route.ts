import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
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

  // Prevent self-deletion
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify target user exists
  const { data: targetUser } = await admin
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Cascade delete in dependency order

    // 1. Chat messages (via conversations)
    const { data: conversations } = await admin
      .from("chat_conversations")
      .select("id")
      .eq("user_id", userId);

    if (conversations && conversations.length > 0) {
      const convIds = conversations.map((c: any) => c.id);
      await admin
        .from("chat_messages")
        .delete()
        .in("conversation_id", convIds);
    }

    // 2. Chat conversations
    await admin.from("chat_conversations").delete().eq("user_id", userId);

    // 3. Ticket messages (via tickets)
    const { data: tickets } = await admin
      .from("support_tickets")
      .select("id")
      .eq("user_id", userId);

    if (tickets && tickets.length > 0) {
      const ticketIds = tickets.map((t: any) => t.id);
      await admin
        .from("ticket_messages")
        .delete()
        .in("ticket_id", ticketIds);
    }

    // 4. Support tickets
    await admin.from("support_tickets").delete().eq("user_id", userId);

    // 5. User agents
    await admin.from("user_agents").delete().eq("user_id", userId);

    // 6. Channels
    await admin.from("channels").delete().eq("user_id", userId);

    // 7. User API keys
    await admin.from("user_api_keys").delete().eq("user_id", userId);

    // 8. Models
    await admin.from("models").delete().eq("user_id", userId);

    // 9. VPS instances
    await admin.from("vps_instances").delete().eq("user_id", userId);

    // 10. Subscriptions
    await admin.from("subscriptions").delete().eq("user_id", userId);

    // 11. Users table
    await admin.from("users").delete().eq("id", userId);

    // 12. Delete Supabase auth user
    await admin.auth.admin.deleteUser(userId);

    const ip = getClientIp(_request);
    logAudit({ adminId: user.id, action: "customer_deleted", entityType: "customer", entityId: userId, details: { email: targetUser.email }, ip });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
