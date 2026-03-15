import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

// GET /api/mission-control/tasks/[id]/dependencies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id: taskId } = await params;

  try {
    // Verify task ownership
    const { data: task } = await supabase.from("mc_tasks").select("id").eq("id", taskId).eq("user_id", user.id).single();
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("mc_task_dependencies")
      .select("*, depends_on:depends_on_task_id(id, title, column_id)")
      .eq("task_id", taskId);

    if (error) throw error;
    return NextResponse.json({ dependencies: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dependencies" }, { status: 500 });
  }
}

// POST /api/mission-control/tasks/[id]/dependencies
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id: taskId } = await params;
  const body = await request.json();
  const { depends_on_task_id } = body as { depends_on_task_id?: string };

  if (!depends_on_task_id) {
    return NextResponse.json({ error: "depends_on_task_id required" }, { status: 400 });
  }

  if (depends_on_task_id === taskId) {
    return NextResponse.json({ error: "Cannot depend on self" }, { status: 400 });
  }

  try {
    // Verify both tasks belong to user
    const { data: tasks } = await supabase.from("mc_tasks").select("id").eq("user_id", user.id).in("id", [taskId, depends_on_task_id]);
    if (!tasks || tasks.length < 2) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Simple circular dependency check: does depends_on_task_id already depend on taskId?
    const { data: reverse } = await supabase
      .from("mc_task_dependencies")
      .select("id")
      .eq("task_id", depends_on_task_id)
      .eq("depends_on_task_id", taskId);

    if (reverse && reverse.length > 0) {
      return NextResponse.json({ error: "Circular dependency detected" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mc_task_dependencies")
      .insert({ task_id: taskId, depends_on_task_id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ dependency: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add dependency" }, { status: 500 });
  }
}

// DELETE /api/mission-control/tasks/[id]/dependencies
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id: taskId } = await params;
  const body = await request.json();
  const { dependency_id } = body as { dependency_id?: string };

  if (!dependency_id) return NextResponse.json({ error: "dependency_id required" }, { status: 400 });

  try {
    const { error } = await supabase.from("mc_task_dependencies").delete().eq("id", dependency_id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove dependency" }, { status: 500 });
  }
}
