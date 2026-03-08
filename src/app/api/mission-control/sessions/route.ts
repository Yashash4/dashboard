import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/mission-control/sessions — list sessions
export async function GET(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const agentId = url.searchParams.get("agent_id");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("mc_sessions")
      .select(
        "*, agent:agent_id(id, name), task:task_id(id, title)",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) query = query.eq("agent_id", agentId);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      sessions: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ sessions: [], total: 0, page, limit });
  }
}

// POST /api/mission-control/sessions — start new session
export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { agent_id, task_id } = body as {
    agent_id?: string;
    task_id?: string;
  };

  if (!agent_id) {
    return NextResponse.json(
      { error: "agent_id is required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("mc_sessions")
      .insert({
        user_id: user.id,
        agent_id,
        task_id: task_id || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
