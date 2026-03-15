import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();

  const period = request.nextUrl.searchParams.get("period") || "7d";
  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: completedTasks, error } = await supabase
      .from("mc_tasks")
      .select("id, title, assigned_agent_id, estimated_hours, actual_hours, created_at, completed_at, metadata")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .gte("completed_at", since)
      .order("completed_at", { ascending: false });

    if (error) throw error;

    const tasks = completedTasks || [];
    const totalCompleted = tasks.length;

    // Calculate stats
    let totalActualHours = 0;
    let totalEstimatedHours = 0;
    let onTimeCount = 0;

    const perTask = tasks.map((t) => {
      const actualMs = t.completed_at && t.created_at
        ? new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()
        : 0;
      const actualHours = actualMs / (1000 * 60 * 60);
      const estimated = t.estimated_hours || 0;
      const efficiency = estimated > 0 ? Math.round((estimated / actualHours) * 100) : null;

      totalActualHours += actualHours;
      if (estimated > 0) totalEstimatedHours += estimated;
      if (t.completed_at && t.metadata?.due_date) {
        if (new Date(t.completed_at) <= new Date(t.metadata.due_date as string)) onTimeCount++;
      }

      return {
        id: t.id,
        title: t.title,
        agent_id: t.assigned_agent_id,
        estimated_hours: estimated,
        actual_hours: Math.round(actualHours * 10) / 10,
        efficiency,
        completed_at: t.completed_at,
      };
    });

    const avgCompletionTime = totalCompleted > 0 ? Math.round((totalActualHours / totalCompleted) * 10) / 10 : 0;
    const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : null;

    return NextResponse.json({
      summary: {
        total_completed: totalCompleted,
        avg_completion_hours: avgCompletionTime,
        on_time_rate: onTimeRate,
        period_days: days,
      },
      tasks: perTask,
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute time tracking" }, { status: 500 });
  }
}
