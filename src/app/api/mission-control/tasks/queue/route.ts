import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { vpsDataFetch } from "@/lib/vps-data-api";

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];
const MAX_RETRIES = 5;

// GET /api/mission-control/tasks/queue?agent_id=xxx — atomic task pickup
export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();

  const agentId = request.nextUrl.searchParams.get("agent_id");
  if (!agentId) {
    return NextResponse.json(
      { error: "agent_id is required" },
      { status: 400 }
    );
  }

  try {
    // Check if agent has an existing in_progress task
    const { data: existing } = await supabase
      .from("mc_tasks")
      .select("id, title, priority, column_id")
      .eq("user_id", user.id)
      .eq("assigned_agent_id", agentId)
      .eq("column_id", "in_progress")
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        task: existing,
        reason: "existing_in_progress",
      });
    }

    // Check agent capacity
    const { count: activeCount } = await supabase
      .from("mc_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("assigned_agent_id", agentId)
      .in("column_id", ["assigned", "in_progress", "testing"]);

    if ((activeCount || 0) >= 3) {
      return NextResponse.json({
        task: null,
        reason: "at_capacity",
      });
    }

    // Try to claim highest-priority task from inbox
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Find candidate: highest priority, then earliest due_date, then oldest
      const { data: candidates } = await supabase
        .from("mc_tasks")
        .select("id, title, priority")
        .eq("user_id", user.id)
        .eq("column_id", "inbox")
        .is("assigned_agent_id", null)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .limit(10);

      if (!candidates || candidates.length === 0) {
        return NextResponse.json({
          task: null,
          reason: "no_tasks_available",
        });
      }

      // Sort by priority (critical > high > medium > low)
      candidates.sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) -
          PRIORITY_ORDER.indexOf(b.priority)
      );

      const candidate = candidates[0];

      // Atomic conditional update: only claim if still in inbox and unassigned
      const { data: claimed, error } = await supabase
        .from("mc_tasks")
        .update({
          column_id: "assigned",
          assigned_agent_id: agentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id)
        .eq("column_id", "inbox")
        .is("assigned_agent_id", null)
        .select()
        .single();

      if (error || !claimed) {
        // Race condition — another agent grabbed it, retry
        continue;
      }

      // 4.21: Log event with VPS-first pattern
      const eventPayload = {
        user_id: user.id,
        event_type: "task_assigned",
        severity: "info",
        agent_id: agentId,
        task_id: claimed.id,
        message: `Task "${candidate.title}" assigned to agent via queue`,
        payload: { action: "queue_pickup", attempt: attempt + 1 },
      };

      try {
        await vpsDataFetch(user.id, "/api/events", {
          method: "POST",
          body: eventPayload,
        });
      } catch {
        // Fallback to Supabase when VPS is unavailable
        await supabase.from("mc_events").insert(eventPayload);
      }

      return NextResponse.json({
        task: claimed,
        reason: "claimed",
      });
    }

    // All retries exhausted
    return NextResponse.json({
      task: null,
      reason: "contention_retry_exhausted",
    });
  } catch {
    return NextResponse.json(
      { error: "Queue pickup failed" },
      { status: 500 }
    );
  }
}
