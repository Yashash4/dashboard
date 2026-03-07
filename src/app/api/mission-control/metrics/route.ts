import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { mockMetrics } from "@/lib/mock-data/mission-control";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try real data from mc_ tables
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
        .select("cost_usd, success")
        .eq("user_id", user.id)
        .gte("started_at", new Date().toISOString().split("T")[0]),
    ]);

    // If we got real data (tables exist), compute metrics
    if (totalAgents !== null && totalAgents > 0) {
      const costToday = (todaySessions || []).reduce(
        (sum, s) => sum + Number(s.cost_usd || 0),
        0
      );
      const totalSessions = (todaySessions || []).length;
      const successfulSessions = (todaySessions || []).filter(
        (s) => s.success
      ).length;
      const successRate =
        totalSessions > 0
          ? Math.round((successfulSessions / totalSessions) * 1000) / 10
          : 100;

      return NextResponse.json({
        system_health_percent: 94.5, // Placeholder until VPS health check is wired
        active_agents: activeAgents || 0,
        total_agents: totalAgents || 0,
        tasks_in_progress: tasksInProgress || 0,
        tasks_completed_today: tasksCompletedToday || 0,
        cost_today_usd: Math.round(costToday * 100) / 100,
        success_rate_percent: successRate,
      });
    }

    // Fallback to mock data if tables are empty or don't exist
    return NextResponse.json(mockMetrics);
  } catch {
    // Tables probably don't exist yet — return mock data
    return NextResponse.json(mockMetrics);
  }
}
