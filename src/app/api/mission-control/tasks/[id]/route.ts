import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { emitMCEvent } from "@/lib/mc-event-bus";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/mission-control/tasks/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    // Check for review approval if moving to done
    if (updates.column_id === "done") {
      const { data: reviews } = await supabase
        .from("mc_reviews")
        .select("status")
        .eq("task_id", id)
        .eq("status", "approved");

      if (!reviews || reviews.length === 0) {
        // Warn but don't block
        updates.metadata = {
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
