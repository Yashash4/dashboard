import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";
import { vpsDataFetch, hasVPSDataAPI } from "@/lib/vps-data-api";

// GET /api/mission-control/sessions — list sessions
export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const url = request.nextUrl;
  const agentId = url.searchParams.get("agent_id");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  try {
    if (await hasVPSDataAPI(user.id)) {
      const params = new URLSearchParams();
      if (agentId) params.set("agent_id", agentId);
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      const data = await vpsDataFetch<{ sessions: unknown[]; total: number }>(
        user.id, `/api/sessions?${params.toString()}`
      );
      return NextResponse.json({ ...data, page, limit });
    }

    const supabase = await createClient();
    let query = supabase
      .from("mc_sessions")
      .select("*, agent:agent_id(id, name), task:task_id(id, title)", { count: "exact" })
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (agentId) query = query.eq("agent_id", agentId);
    const { data, error, count } = await query;
    if (error) throw error;
    return NextResponse.json({ sessions: data || [], total: count || 0, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// POST /api/mission-control/sessions — start new session
export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const body = await request.json();
  const { agent_id, task_id } = body as { agent_id?: string; task_id?: string };
  if (!agent_id) return NextResponse.json({ error: "agent_id is required" }, { status: 400 });

  try {
    let sessionData;

    if (await hasVPSDataAPI(user.id)) {
      const result = await vpsDataFetch<{ session: unknown }>(user.id, "/api/sessions", {
        method: "POST", body: { agent_id, task_id },
      });
      sessionData = result.session;
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("mc_sessions")
        .insert({ user_id: user.id, agent_id, task_id: task_id || null, started_at: new Date().toISOString() })
        .select().single();
      if (error) throw error;
      sessionData = data;
    }

    emitMCEvent(user.id, "session_updated", { session_id: (sessionData as { id: string }).id });
    return NextResponse.json({ session: sessionData }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
