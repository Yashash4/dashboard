import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

// PATCH /api/mission-control/statuses/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ("name" in body && body.name?.trim()) updates.name = body.name.trim();
  if ("color" in body) updates.color = body.color;
  if ("sort_order" in body) updates.sort_order = body.sort_order;
  if ("hidden" in body) updates.hidden = body.hidden;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("mc_task_statuses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ status: data });
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

// DELETE /api/mission-control/statuses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const { id } = await params;

  try {
    // Check if any tasks use this status
    const { count } = await supabase
      .from("mc_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("column_id", id);

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete status with tasks. Move tasks first." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("mc_task_statuses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete status" }, { status: 500 });
  }
}
