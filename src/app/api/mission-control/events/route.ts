import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";
import { vpsDataFetch, hasVPSDataAPI } from "@/lib/vps-data-api";

const VALID_EVENT_TYPES = [
  "webhook",
  "tool_invocation",
  "task_complete",
  "agent_state_change",
  "session_start",
  "session_end",
] as const;

const VALID_SEVERITIES = ["success", "info", "warning", "error"] as const;

// GET /api/mission-control/events — paginated, filterable
export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const url = request.nextUrl;
  const eventType = url.searchParams.get("type");
  const severity = url.searchParams.get("severity");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  try {
    // Try VPS Data API first
    if (await hasVPSDataAPI(user.id)) {
      const params = new URLSearchParams();
      if (eventType) params.set("type", eventType);
      if (severity) params.set("severity", severity);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const data = await vpsDataFetch<{ events: unknown[]; total: number }>(
        user.id,
        `/api/events?${params.toString()}`
      );
      return NextResponse.json({ ...data, page, limit });
    }

    // Fallback to Supabase
    const supabase = await createClient();
    let query = supabase
      .from("mc_events")
      .select("*, agent:agent_id(id, name)", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) query = query.eq("event_type", eventType);
    if (severity) query = query.eq("severity", severity);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ events: data || [], total: count || 0, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/mission-control/events — ingest new event
export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 100, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const body = await request.json();
  const {
    event_type, severity = "info", agent_id, task_id, session_id, message, payload = {},
  } = body as {
    event_type?: string; severity?: string; agent_id?: string;
    task_id?: string; session_id?: string; message?: string;
    payload?: Record<string, unknown>;
  };

  if (!event_type || !message) {
    return NextResponse.json({ error: "event_type and message are required" }, { status: 400 });
  }
  if (!VALID_EVENT_TYPES.includes(event_type as typeof VALID_EVENT_TYPES[number])) {
    return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  }
  if (!VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number])) {
    return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message too long (max 5000 chars)" }, { status: 400 });
  }

  try {
    let eventData;

    if (await hasVPSDataAPI(user.id)) {
      const result = await vpsDataFetch<{ event: unknown }>(user.id, "/api/events", {
        method: "POST",
        body: { event_type, severity, agent_id, task_id, session_id, message, payload },
      });
      eventData = result.event;
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("mc_events")
        .insert({ user_id: user.id, event_type, severity, agent_id: agent_id || null, task_id: task_id || null, session_id: session_id || null, message, payload })
        .select()
        .single();
      if (error) throw error;
      eventData = data;
    }

    emitMCEvent(user.id, "new_event", { event_type, severity });
    return NextResponse.json({ event: eventData }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
