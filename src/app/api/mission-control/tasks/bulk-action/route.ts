import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const body = await request.json();

  const { task_ids, action, value } = body as {
    task_ids?: string[];
    action?: "move" | "assign" | "priority" | "delete";
    value?: string;
  };

  if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0 || !action) {
    return NextResponse.json({ error: "task_ids and action required" }, { status: 400 });
  }
  if (task_ids.length > 50) {
    return NextResponse.json({ error: "Max 50 tasks per action" }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    if (action === "delete") {
      const { error } = await supabase.from("mc_tasks").delete().eq("user_id", user.id).in("id", task_ids);
      if (error) throw error;
    } else if (action === "move" && value) {
      const { error } = await supabase.from("mc_tasks").update({ column_id: value, updated_at: now }).eq("user_id", user.id).in("id", task_ids);
      if (error) throw error;
    } else if (action === "assign") {
      const { error } = await supabase.from("mc_tasks").update({ assigned_agent_id: value || null, updated_at: now }).eq("user_id", user.id).in("id", task_ids);
      if (error) throw error;
    } else if (action === "priority" && value) {
      const { error } = await supabase.from("mc_tasks").update({ priority: value, updated_at: now }).eq("user_id", user.id).in("id", task_ids);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, affected: task_ids.length });
  } catch {
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
  }
}
