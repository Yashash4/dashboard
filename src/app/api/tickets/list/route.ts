import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:ticket_list`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const url = new URL(request.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, category, created_at, user_read_at, ticket_messages(sender_role, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }

  return NextResponse.json({ tickets: tickets || [] });
}
