import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";
import { processAutomationRules } from "@/lib/mc-automation";

// GET /api/mission-control/tasks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from("mc_tasks")
      .select("*, agents:assigned_agent_id(id, name)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = {
      ...data,
      assigned_agent: data.agents || null,
      agents: undefined,
    };

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

// PATCH /api/mission-control/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "title",
    "description",
    "column_id",
    "priority",
    "assigned_agent_id",
    "due_date",
    "estimated_hours",
    "actual_hours",
    "acceptance_criteria",
    "outcome",
    "error_message",
    "resolution",
    "metadata",
    "position",
    "completed_at",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const now = new Date().toISOString();
  updates.updated_at = now;

  // Auto-set completed_at when moving to done
  if (updates.column_id === "done") {
    updates.completed_at = now;
  } else if (updates.column_id && updates.column_id !== "done") {
    updates.completed_at = null;
  }

  try {
    // Fetch existing task to detect changes for automation rules (FIX-01)
    const { data: existingTask } = await supabase
      .from("mc_tasks")
      .select("column_id, priority")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    // FIX-02: Enforce dependencies — block move to active columns if deps unfinished
    if (updates.column_id && ["in_progress", "testing", "review"].includes(updates.column_id as string)) {
      const { data: deps } = await supabase
        .from("mc_task_dependencies")
        .select("depends_on_task_id")
        .eq("task_id", id);

      if (deps && deps.length > 0) {
        const { data: undone } = await supabase
          .from("mc_tasks")
          .select("id")
          .in("id", deps.map((d) => d.depends_on_task_id))
          .neq("column_id", "done")
          .limit(1);

        if (undone && undone.length > 0) {
          return NextResponse.json({
            error: "Task is blocked by unfinished dependencies",
            blocked_by: deps.map((d) => d.depends_on_task_id),
          }, { status: 409 });
        }
      }
    }

    // Check for review approval if moving to done (P1.1.9: merge metadata properly)
    if (updates.column_id === "done") {
      const { data: reviews } = await supabase
        .from("mc_reviews")
        .select("status")
        .eq("task_id", id)
        .eq("status", "approved");

      if (!reviews || reviews.length === 0) {
        // Fetch existing metadata and merge
        const { data: existing } = await supabase
          .from("mc_tasks")
          .select("metadata")
          .eq("id", id)
          .single();

        updates.metadata = {
          ...(existing?.metadata || {}),
          ...(typeof updates.metadata === "object" && updates.metadata
            ? updates.metadata
            : {}),
          _warning: "Moved to done without approved review",
        };
      }
    }

    const { data, error } = await supabase
      .from("mc_tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    emitMCEvent(user.id, "task_updated", { taskId: id });

    // Fire automation rules on column/priority changes (FIX-01)
    if (existingTask && updates.column_id && updates.column_id !== existingTask.column_id) {
      processAutomationRules(user.id, "task_enters_column", updates.column_id as string, {
        taskId: id, oldValue: existingTask.column_id, newValue: updates.column_id,
      }).catch(() => {});
    }
    if (existingTask && updates.priority && updates.priority !== existingTask.priority) {
      processAutomationRules(user.id, "task_priority_changes", updates.priority as string, {
        taskId: id, oldValue: existingTask.priority, newValue: updates.priority,
      }).catch(() => {});
    }

    // Auto-unblock dependents when task moves to done (FIX-02)
    if (updates.column_id === "done") {
      const { data: dependents } = await supabase
        .from("mc_task_dependencies")
        .select("task_id")
        .eq("depends_on_task_id", id);

      for (const dep of dependents || []) {
        const { data: allDeps } = await supabase
          .from("mc_task_dependencies")
          .select("depends_on_task_id")
          .eq("task_id", dep.task_id);

        // Check if all dependencies are done
        if (allDeps && allDeps.length > 0) {
          const { data: undone } = await supabase
            .from("mc_tasks")
            .select("id")
            .in("id", allDeps.map((d) => d.depends_on_task_id))
            .neq("column_id", "done")
            .limit(1);

          if (!undone || undone.length === 0) {
            emitMCEvent(user.id, "task_updated", { taskId: dep.task_id, unblocked: true });
          }
        }
      }
    }

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/mission-control/tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase
      .from("mc_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    emitMCEvent(user.id, "task_deleted", { taskId: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
