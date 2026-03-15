import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { vpsDataFetch } from "@/lib/vps-data-api";

// GET /api/mission-control/tasks/[id]/reviews
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
    // Verify the task belongs to the user
    const { data: task, error: taskError } = await supabase
      .from("mc_tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch ALL reviews for this task (not just the user's)
    const { data, error } = await supabase
      .from("mc_reviews")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reviews: data || [] });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

// POST /api/mission-control/tasks/[id]/reviews
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
  const { reviewer, status, notes } = body as {
    reviewer?: string;
    status?: string;
    notes?: string;
  };

  if (!status) {
    return NextResponse.json(
      { error: "Status is required" },
      { status: 400 }
    );
  }

  const validStatuses = ["approved", "rejected", "needs_changes"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: approved, rejected, or needs_changes" },
      { status: 400 }
    );
  }

  try {
    // Get user name for reviewer field fallback
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("mc_reviews")
      .insert({
        user_id: user.id,
        task_id: taskId,
        reviewer: reviewer || profile?.name || user.email || "reviewer",
        status,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity to VPS (historical data)
    vpsDataFetch(user.id, "/api/activities", {
      method: "POST",
      body: {
        task_id: taskId,
        actor: profile?.name || user.email || "reviewer",
        action: "added_review",
        old_value: null,
        new_value: status,
      },
    }).catch(() => {}); // non-blocking

    // FIX-09: Auto-move task to Done on approval
    if (status === "approved") {
      const now = new Date().toISOString();
      await supabase
        .from("mc_tasks")
        .update({ column_id: "done", completed_at: now, updated_at: now })
        .eq("id", taskId)
        .eq("user_id", user.id);

      vpsDataFetch(user.id, "/api/activities", {
        method: "POST",
        body: {
          task_id: taskId,
          actor: profile?.name || "reviewer",
          action: "Review approved — task moved to Done",
        },
      }).catch(() => {});
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
