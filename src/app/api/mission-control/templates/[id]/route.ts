import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const allowed = ["name", "description", "priority", "default_agent_id", "subtasks", "tags", "estimated_hours", "category"];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in body) updates[k] = body[k]; }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No updates" }, { status: 400 });

  try {
    const { data, error } = await supabase.from("mc_task_templates").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ template: data });
  } catch {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase.from("mc_task_templates").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
