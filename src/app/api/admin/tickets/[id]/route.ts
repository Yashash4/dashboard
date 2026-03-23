import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { logAudit, getClientIp } from "@/lib/audit-log";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

// POST: Send admin reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: ticketId } = await params;
  const body = await request.json();
  const { message } = body as { message?: string };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify ticket exists
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket not found" },
      { status: 404 }
    );
  }

  // Insert admin reply (ADMIN_MED_09: return inserted ID for optimistic update)
  const { error: msgError, data: msgData } = await admin.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_role: "admin",
    message: message.trim(),
  }).select("id").single();

  if (msgError) {
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }

  // ADMIN_MED_10: Combined single UPDATE (status always -> in_progress, updated_at always set)
  await admin
    .from("support_tickets")
    .update({
      status: "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "ticket_replied", entityType: "ticket", entityId: ticketId, ip });

  return NextResponse.json({ success: true });
}

// PATCH: Update ticket status or priority
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: ticketId } = await params;
  const body = await request.json();
  const { status, priority } = body as {
    status?: string;
    priority?: string;
  };

  const updates: Record<string, string> = {};

  if (status) {
    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    updates.status = status;
  }

  if (priority) {
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority" },
        { status: 400 }
      );
    }
    updates.priority = priority;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No updates provided" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("support_tickets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }

  const ip2 = getClientIp(request);
  logAudit({ adminId: user.id, action: "ticket_updated", entityType: "ticket", entityId: ticketId, details: updates, ip: ip2 });

  return NextResponse.json({ success: true });
}
