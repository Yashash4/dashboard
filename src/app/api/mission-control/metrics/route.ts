import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();

  try {
    const [
      { count: activeAgents },
      { count: totalAgents },
      { count: tasksInProgress },
      { count: tasksCompletedToday },
      { data: todaySessions },
    ] = await Promise.all([
      supabase
        .from("mc_agent_status")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["online", "working"]),
      supabase
        .from("mc_agent_status")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("mc_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("column_id", "in_progress"),
      supabase
        .from("mc_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("column_id", "done")
        .gte("completed_at", new Date().toISOString().split("T")[0]),
      supabase
        .from("mc_sessions")
        .select("success")
        .eq("user_id", user.id)
        .gte("started_at", new Date().toISOString().split("T")[0]),
    ]);

    const totalSessions = (todaySessions || []).length;
    const successfulSessions = (todaySessions || []).filter(
      (s) => s.success
    ).length;
    const successRate =
      totalSessions > 0
        ? Math.round((successfulSessions / totalSessions) * 1000) / 10
        : null;

    return NextResponse.json({
      system_health_percent: null,
      active_agents: activeAgents || 0,
      total_agents: totalAgents || 0,
      tasks_in_progress: tasksInProgress || 0,
      tasks_completed_today: tasksCompletedToday || 0,
      success_rate_percent: successRate,
      status: totalAgents === 0 && tasksInProgress === 0 ? "no_data" : "ok",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
