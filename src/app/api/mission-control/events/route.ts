import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/mission-control/events — paginated, filterable
export async function GET(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const eventType = url.searchParams.get("type");
  const severity = url.searchParams.get("severity");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("mc_events")
      .select(
        "*, agent:agent_id(id, name)",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) query = query.eq("event_type", eventType);
    if (severity) query = query.eq("severity", severity);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      events: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ events: [], total: 0, page, limit });
  }
}

// POST /api/mission-control/events — ingest new event
export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    event_type,
    severity = "info",
    agent_id,
    task_id,
    session_id,
    message,
    payload = {},
  } = body as {
    event_type?: string;
    severity?: string;
    agent_id?: string;
    task_id?: string;
    session_id?: string;
    message?: string;
    payload?: Record<string, unknown>;
  };

  if (!event_type || !message) {
    return NextResponse.json(
      { error: "event_type and message are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("mc_events")
      .insert({
        user_id: user.id,
        event_type,
        severity,
        agent_id: agent_id || null,
        task_id: task_id || null,
        session_id: session_id || null,
        message,
        payload,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
