import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";
import { vpsDataFetch, hasVPSDataAPI } from "@/lib/vps-data-api";

// PATCH /api/mission-control/sessions/[id] — update/end session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const { id } = await params;
  const body = await request.json();

  const allowedFields = ["ended_at", "duration_ms", "success", "error_message", "trace_data"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  try {
    let sessionData;

    if (await hasVPSDataAPI(user.id)) {
      const result = await vpsDataFetch<{ session: unknown }>(
        user.id, `/api/sessions/${id}`, { method: "PATCH", body: updates }
      );
      sessionData = result.session;
    } else {
      const supabase = await createClient();

      // Auto-calculate duration if ending
      if (updates.ended_at && !updates.duration_ms) {
        const { data: session } = await supabase
          .from("mc_sessions").select("started_at").eq("id", id).eq("user_id", user.id).single();
        if (session) {
          updates.duration_ms = new Date(updates.ended_at as string).getTime() - new Date(session.started_at).getTime();
        }
      }

      const { data, error } = await supabase
        .from("mc_sessions").update(updates).eq("id", id).eq("user_id", user.id).select().single();
      if (error) throw error;
      sessionData = data;
    }

    emitMCEvent(user.id, "session_updated", { session_id: id });
    return NextResponse.json({ session: sessionData });
  } catch {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
