import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { deleteSubdomain } from "@/lib/cloudflare";

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
    // --- 2.23/2.26: Resource cleanup before DB deletion ---

    // Fetch VPS instance for cleanup context
    const { data: vpsInstance } = await admin
      .from("vps_instances")
      .select("hostname, hostinger_vm_id, ip_address")
      .eq("user_id", userId)
      .single();

    // Clean DNS records (Cloudflare)
    if (vpsInstance?.hostname) {
      try {
        const subdomain = vpsInstance.hostname.replace(".clawhq.tech", "");
        await deleteSubdomain(subdomain);
      } catch (dnsErr: any) {
        console.warn(`[delete] DNS cleanup failed for ${vpsInstance.hostname}:`, dnsErr.message);
      }
    }

    // TODO: 2.23 — Call Hostinger API to destroy/stop VPS when API supports it.
    // Hostinger's public API does not currently expose a "delete VM" endpoint.
    // For now, mark it in audit log so ops team can manually reclaim the VPS.
    if (vpsInstance?.hostinger_vm_id) {
      console.warn(`[delete] VPS ${vpsInstance.hostinger_vm_id} (IP: ${vpsInstance.ip_address}) needs manual cleanup — Hostinger API has no destroy endpoint.`);
    }

    // Clean Supabase Storage (avatars, ticket attachments)
    try {
      const { data: avatarFiles } = await admin.storage.from("avatars").list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f: any) => `${userId}/${f.name}`);
        await admin.storage.from("avatars").remove(paths);
      }
    } catch {
      // Non-fatal — storage bucket may not exist
    }

    try {
      const { data: tickets } = await admin
        .from("support_tickets")
        .select("id")
        .eq("user_id", userId);

      if (tickets && tickets.length > 0) {
        for (const t of tickets) {
          const { data: files } = await admin.storage
            .from("ticket-attachments")
            .list(t.id);
          if (files && files.length > 0) {
            const paths = files.map((f: any) => `${t.id}/${f.name}`);
            await admin.storage.from("ticket-attachments").remove(paths);
          }
        }
      }
    } catch {
      // Non-fatal — storage cleanup best-effort
    }

    // Cancel subscription (mark as cancelled in DB — no Stripe integration yet)
    try {
      await admin
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("user_id", userId);
    } catch {
      // Non-fatal — subscription may not exist
    }

    // --- End resource cleanup ---

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
    const { data: ticketsForMsgs } = await admin
      .from("support_tickets")
      .select("id")
      .eq("user_id", userId);

    if (ticketsForMsgs && ticketsForMsgs.length > 0) {
      const ticketIds = ticketsForMsgs.map((t: any) => t.id);
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
    logAudit({
      adminId: user.id,
      action: "customer_deleted",
      entityType: "customer",
      entityId: userId,
      details: {
        email: targetUser.email,
        dns_cleaned: !!vpsInstance?.hostname,
        vps_needs_manual_cleanup: !!vpsInstance?.hostinger_vm_id,
        hostinger_vm_id: vpsInstance?.hostinger_vm_id || null,
      },
      ip,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
