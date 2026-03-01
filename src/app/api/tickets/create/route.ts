import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
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

  if (!description?.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
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
  await admin.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_role: "customer",
    message: description.trim(),
  });

  return NextResponse.json({ success: true, ticket_id: ticket.id });
}
