import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:ticket_create`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { subject, description, priority } = body as {
    subject?: string;
    description?: string;
    priority?: string;
  };

  if (!subject?.trim()) {
    return NextResponse.json(
      { error: "Subject is required" },
      { status: 400 }
    );
  }

  if (subject.length > 200) {
    return NextResponse.json(
      { error: "Subject must be at most 200 characters" },
      { status: 400 }
    );
  }

  if (!description?.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  if (description.length > 5000) {
    return NextResponse.json(
      { error: "Description must be at most 5000 characters" },
      { status: 400 }
    );
  }

  const validPriorities = ["low", "medium", "high"];
  const ticketPriority = validPriorities.includes(priority || "")
    ? priority
    : "medium";

  const admin = createAdminClient();

  // Create the ticket
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject: subject.trim(),
      description: description.trim(),
      priority: ticketPriority,
      status: "open",
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }

  // Insert the first message
  const { error: msgError } = await admin.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_role: "customer",
    message: description.trim(),
  });

  if (msgError) {
    // Ticket was created but message failed — delete the orphan ticket
    await admin.from("support_tickets").delete().eq("id", ticket.id);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, ticket_id: ticket.id });
}
