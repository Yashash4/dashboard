import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";

// GET /api/mission-control/tasks — list tasks (filterable)
export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const url = request.nextUrl;
  const column = url.searchParams.get("column");
  const priority = url.searchParams.get("priority");
  const agentId = url.searchParams.get("agent_id");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 200);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("mc_tasks")
      .select("*, agents:assigned_agent_id(id, name)", { count: "exact" })
      .eq("user_id", user.id)
      .order("position", { ascending: true })
      .range(offset, offset + limit - 1);

    if (column) query = query.eq("column_id", column);
    if (priority) query = query.eq("priority", priority);
    if (agentId) query = query.eq("assigned_agent_id", agentId);

    const { data, error, count } = await query;

    if (error) throw error;

    const tasks = (data || []).map((t: Record<string, unknown>) => ({
      ...t,
      assigned_agent: t.agents || null,
      agents: undefined,
    }));

    return NextResponse.json({ tasks, total: count || 0, page, limit });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/mission-control/tasks — create task
export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const body = await request.json();
  const {
    title,
    description,
    column_id = "planning",
    priority = "medium",
    assigned_agent_id,
    due_date,
    estimated_hours,
    acceptance_criteria,
    metadata = {},
  } = body as {
    title?: string;
    description?: string;
    column_id?: string;
    priority?: string;
    assigned_agent_id?: string;
    due_date?: string;
    estimated_hours?: number;
    acceptance_criteria?: string;
    metadata?: Record<string, unknown>;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const { count } = await supabase
      .from("mc_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("column_id", column_id);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("mc_tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        column_id,
        priority,
        assigned_agent_id: assigned_agent_id || null,
        due_date: due_date || null,
        estimated_hours: estimated_hours || null,
        acceptance_criteria: acceptance_criteria?.trim() || null,
        position: count || 0,
        metadata,
        created_by: "user",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    emitMCEvent(user.id, "task_created", { taskId: data.id });

    return NextResponse.json({ task: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
