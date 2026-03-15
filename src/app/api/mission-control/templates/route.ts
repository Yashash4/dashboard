import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from("mc_task_templates").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ templates: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 }, maxBodySize: 20480 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const body = await request.json();

  const { name, description, priority, default_agent_id, subtasks, tags, estimated_hours, category } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const { count } = await supabase.from("mc_task_templates").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count || 0) >= 20) return NextResponse.json({ error: "Max 20 templates" }, { status: 400 });

    const { data, error } = await supabase
      .from("mc_task_templates")
      .insert({
        user_id: user.id, name: name.trim(), description, priority: priority || "medium",
        default_agent_id, subtasks: subtasks || [], tags: tags || [], estimated_hours, category,
      })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ template: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
