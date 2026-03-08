import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// POST /api/mission-control/agents/heartbeat — agent reports status, gets work items
export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { agent_id, status, current_task_id, capacity_used, metadata } =
    body as {
      agent_id?: string;
      status?: string;
      current_task_id?: string;
      capacity_used?: number;
      metadata?: Record<string, unknown>;
    };

  if (!agent_id || !status) {
    return NextResponse.json(
      { error: "agent_id and status are required" },
      { status: 400 }
    );
  }

  const validStatuses = [
    "online",
    "working",
    "idle",
    "blocked",
    "sleeping",
    "offline",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    // Check existing status to detect state changes
    const { data: existing } = await supabase
      .from("mc_agent_status")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("agent_id", agent_id)
      .single();

    const statusChanged = existing && existing.status !== status;

    // Upsert agent status
    const { error: upsertError } = await supabase
      .from("mc_agent_status")
      .upsert(
        {
          user_id: user.id,
          agent_id,
          status,
          current_task_id: current_task_id || null,
          capacity_used: capacity_used ?? 0,
          last_activity_at: now,
          metadata: metadata || {},
          updated_at: now,
        },
        { onConflict: "user_id,agent_id" }
      );

    if (upsertError) throw upsertError;

    // If status changed, insert an event
    if (statusChanged) {
      await supabase.from("mc_events").insert({
        user_id: user.id,
        event_type: "agent_state_change",
        severity: status === "offline" ? "warning" : "info",
        agent_id,
        message: `Agent changed status from ${existing.status} to ${status}`,
        payload: {
          old_status: existing.status,
          new_status: status,
        },
      });
    }

    // Get assigned tasks for this agent (work items)
    const { data: assignedTasks } = await supabase
      .from("mc_tasks")
      .select("id, title, priority, column_id")
      .eq("user_id", user.id)
      .eq("assigned_agent_id", agent_id)
      .in("column_id", ["assigned", "in_progress", "testing"])
      .order("priority", { ascending: true });

    return NextResponse.json({
      success: true,
      status_changed: statusChanged || false,
      work_items: {
        assigned_tasks: assignedTasks || [],
        notifications: [],
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Heartbeat failed" },
      { status: 500 }
    );
  }
}
