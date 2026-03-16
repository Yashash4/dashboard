import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { vpsDataFetch, hasVPSDataAPI } from "@/lib/vps-data-api";
import { processAutomationRules } from "@/lib/mc-automation";
import { emitMCEvent } from "@/lib/mc-event-bus";

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
    // Verify the task belongs to the authenticated user
    const { data: task } = await supabase
      .from("mc_tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

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

      // 4.17: Check if dependent tasks are now unblocked
      const { data: dependentTasks } = await supabase
        .from("mc_task_dependencies")
        .select("task_id")
        .eq("depends_on_task_id", taskId);

      if (dependentTasks && dependentTasks.length > 0) {
        for (const dep of dependentTasks) {
          // Check if ALL dependencies of this task are done
          const { data: allDeps } = await supabase
            .from("mc_task_dependencies")
            .select("depends_on_task_id")
            .eq("task_id", dep.task_id);

          if (allDeps) {
            const { data: blockers } = await supabase
              .from("mc_tasks")
              .select("id")
              .in("id", allDeps.map((d) => d.depends_on_task_id))
              .neq("column_id", "done")
              .eq("user_id", user.id)
              .limit(1);

            // If no remaining blockers, move from planning/inbox to assigned
            if (!blockers || blockers.length === 0) {
              const { data: unblockedTask } = await supabase
                .from("mc_tasks")
                .select("id, column_id, title")
                .eq("id", dep.task_id)
                .eq("user_id", user.id)
                .in("column_id", ["planning", "inbox"])
                .single();

              if (unblockedTask) {
                await supabase
                  .from("mc_tasks")
                  .update({ column_id: "assigned", updated_at: now })
                  .eq("id", unblockedTask.id)
                  .eq("user_id", user.id);

                vpsDataFetch(user.id, "/api/activities", {
                  method: "POST",
                  body: {
                    task_id: unblockedTask.id,
                    actor: "system",
                    action: `Task unblocked — moved to Assigned (dependency "${taskId.slice(0, 8)}" completed)`,
                  },
                }).catch(() => {});
              }
            }
          }
        }
      }

      // 4.18: Fire automation rules after status change to done
      processAutomationRules(user.id, "task_status_changed", "done", {
        taskId,
        oldValue: "review",
        newValue: "done",
      }).catch(() => {}); // non-blocking

      // 4.19: Emit realtime event for the event feed
      emitMCEvent(user.id, "task_updated", {
        task_id: taskId,
        action: "review_approved",
        new_column: "done",
      });

      // 4.19: Insert mc_event for the event feed (VPS-first pattern)
      const eventPayload = {
        user_id: user.id,
        event_type: "review_approved",
        severity: "success",
        task_id: taskId,
        message: `Review approved — task moved to Done`,
        payload: { reviewer: reviewer || profile?.name || "reviewer" },
      };

      const hasVPS = await hasVPSDataAPI(user.id).catch(() => false);
      if (hasVPS) {
        vpsDataFetch(user.id, "/api/events", {
          method: "POST",
          body: eventPayload,
        }).catch(() => {
          // Fallback to Supabase
          supabase.from("mc_events").insert(eventPayload).then(() => {});
        });
      } else {
        await supabase.from("mc_events").insert(eventPayload);
      }
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
