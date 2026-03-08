import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// PATCH /api/mission-control/sessions/[id] — update/end session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "ended_at",
    "duration_ms",
    "tokens_input",
    "tokens_output",
    "cost_usd",
    "success",
    "error_message",
    "trace_data",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  // If ending session, auto-calculate duration if not provided
  if (updates.ended_at && !updates.duration_ms) {
    const { data: session } = await supabase
      .from("mc_sessions")
      .select("started_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (session) {
      const start = new Date(session.started_at).getTime();
      const end = new Date(updates.ended_at as string).getTime();
      updates.duration_ms = end - start;
    }
  }

  try {
    const { data, error } = await supabase
      .from("mc_sessions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
