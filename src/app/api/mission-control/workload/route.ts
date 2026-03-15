import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();

  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [
      { count: totalAgents },
      { count: busyAgents },
      { count: backlogTasks },
      { data: recentErrors },
    ] = await Promise.all([
      supabase.from("mc_agent_status").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("mc_agent_status").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["working", "blocked"]),
      supabase.from("mc_tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("column_id", "planning"),
      supabase.from("mc_events").select("id").eq("user_id", user.id).eq("severity", "error").gte("created_at", fiveMinAgo),
    ]);

    const total = totalAgents || 0;
    const busy = busyAgents || 0;
    const backlog = backlogTasks || 0;
    const errors = recentErrors?.length || 0;
    const busyRatio = total > 0 ? busy / total : 0;

    let recommendation: "normal" | "throttle" | "shed" | "pause" = "normal";
    if (errors >= 5) recommendation = "pause";
    else if (busyRatio >= 0.8 || backlog > 20) recommendation = "shed";
    else if (busyRatio >= 0.5 || backlog > 10) recommendation = "throttle";

    return NextResponse.json({
      recommendation,
      metrics: {
        total_agents: total,
        busy_agents: busy,
        busy_ratio: Math.round(busyRatio * 100),
        backlog_depth: backlog,
        recent_errors: errors,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute workload" }, { status: 500 });
  }
}
