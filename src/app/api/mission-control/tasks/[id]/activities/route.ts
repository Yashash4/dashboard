import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { vpsDataFetch, hasVPSDataAPI } from "@/lib/vps-data-api";

// GET /api/mission-control/tasks/[id]/activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const { id: taskId } = await params;
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  try {
    if (await hasVPSDataAPI(user.id)) {
      const data = await vpsDataFetch<{ activities: unknown[]; total: number }>(
        user.id, `/api/activities/${taskId}?limit=${limit}&offset=${offset}`
      );
      return NextResponse.json({ ...data, page, limit });
    }

    // Fallback to Supabase
    const supabase = await createClient();

    // Verify task belongs to user
    const { data: task, error: taskError } = await supabase
      .from("mc_tasks").select("id").eq("id", taskId).eq("user_id", user.id).single();
    if (taskError || !task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { data, error, count } = await supabase
      .from("mc_activities")
      .select("*", { count: "exact" })
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({ activities: data || [], total: count || 0, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
