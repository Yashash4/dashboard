import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

// GET /api/mission-control/agents/status — all agent statuses
export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 60, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("mc_agent_status")
      .select(
        "*, agent:agent_id(id, name, description), current_task:current_task_id(id, title)"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ agents: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch agent status" },
      { status: 500 }
    );
  }
}
