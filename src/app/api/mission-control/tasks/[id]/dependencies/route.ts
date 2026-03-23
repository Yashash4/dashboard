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

    // Recursive circular dependency check: walk the full dependency chain from depends_on_task_id
    // to see if taskId appears anywhere in it (depth N, not just depth 1)
    const visited = new Set<string>();
    const stack = [depends_on_task_id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === taskId) {
        return NextResponse.json({ error: "Circular dependency detected" }, { status: 400 });
      }
      if (visited.has(current)) continue;
      visited.add(current);
      const { data: transitive } = await supabase
        .from("mc_task_dependencies")
        .select("depends_on_task_id")
        .eq("task_id", current);
      if (transitive) {
        for (const row of transitive) {
          if (!visited.has(row.depends_on_task_id)) {
            stack.push(row.depends_on_task_id);
          }
        }
      }
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
    // Verify the parent task belongs to the authenticated user
    const { data: task } = await supabase.from("mc_tasks").select("id").eq("id", taskId).eq("user_id", user.id).single();
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { error } = await supabase.from("mc_task_dependencies").delete().eq("id", dependency_id).eq("task_id", taskId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove dependency" }, { status: 500 });
  }
}
