import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:ticket_reply`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
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

  // Verify user owns this ticket
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, status")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket not found" },
      { status: 404 }
    );
  }

  if (ticket.status === "closed" || ticket.status === "resolved") {
    return NextResponse.json(
      { error: "Cannot reply to a closed ticket" },
      { status: 400 }
    );
  }

  // Insert the reply
  const { error: msgError } = await admin.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_role: "customer",
    message: message.trim(),
  });

  if (msgError) {
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }

  // Update ticket updated_at
  await admin
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return NextResponse.json({ success: true });
}
