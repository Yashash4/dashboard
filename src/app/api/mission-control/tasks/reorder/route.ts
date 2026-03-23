import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

const VALID_COLUMNS = ["planning", "inbox", "assigned", "in_progress", "testing", "review", "done"] as const;

// PATCH /api/mission-control/tasks/reorder — bulk position update for drag-drop
export async function PATCH(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const body = await request.json();
  const { updates } = body as {
    updates?: Array<{
      id: string;
      column_id: string;
      position: number;
    }>;
  };

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json(
      { error: "Updates array is required" },
      { status: 400 }
    );
  }

  if (updates.length > 100) {
    return NextResponse.json(
      { error: "Max 100 items per reorder" },
      { status: 400 }
    );
  }

  // 350_MED_09: Validate each item individually
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const u of updates) {
    if (!UUID_RE.test(u.id)) {
      return NextResponse.json({ error: `Invalid task ID format: ${u.id}` }, { status: 400 });
    }
    if (!VALID_COLUMNS.includes(u.column_id as typeof VALID_COLUMNS[number])) {
      return NextResponse.json({ error: `Invalid column_id: ${u.column_id}` }, { status: 400 });
    }
    if (typeof u.position !== "number" || u.position < 0 || !Number.isFinite(u.position)) {
      return NextResponse.json({ error: `Invalid position for task ${u.id}: must be a non-negative number` }, { status: 400 });
    }
  }

  try {
    // 4.11: Validate that all tasks exist and belong to the user before updating
    const taskIds = updates.map((u) => u.id);
    const { data: existingTasks, error: fetchError } = await supabase
      .from("mc_tasks")
      .select("id")
      .in("id", taskIds)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (fetchError) throw fetchError;

    const existingIds = new Set((existingTasks || []).map((t) => t.id));
    const missingIds = taskIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: "Some tasks not found or not owned by you", missing_ids: missingIds },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const promises = updates.map((u) =>
      supabase
        .from("mc_tasks")
        .update({
          column_id: u.column_id,
          position: u.position,
          updated_at: now,
          ...(u.column_id === "done" ? { completed_at: now } : { completed_at: null }),
        })
        .eq("id", u.id)
        .eq("user_id", user.id)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}
