import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(
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

  const rl = rateLimit(`${user.id}:ticket_rate`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { id: ticketId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rating } = body as { rating?: number };

  if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify the ticket belongs to this user and is resolved
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, status, user_id")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status !== "resolved") {
    return NextResponse.json(
      { error: "Only resolved tickets can be rated" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("support_tickets")
    .update({ satisfaction_rating: rating })
    .eq("id", ticketId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
