import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the ticket belongs to this user and is resolvable
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status === "resolved" || ticket.status === "closed") {
    return NextResponse.json(
      { error: "Ticket is already resolved or closed" },
      { status: 400 }
    );
  }

  // Use admin client since there's no UPDATE RLS policy for support_tickets
  const admin = createAdminClient();
  const { error } = await admin
    .from("support_tickets")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to resolve ticket" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
