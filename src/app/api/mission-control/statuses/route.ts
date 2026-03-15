import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

const DEFAULT_STATUSES = [
  { name: "Backlog", color: "#666666", sort_order: 0 },
  { name: "In Progress", color: "#3b82f6", sort_order: 1 },
  { name: "Review", color: "#f59e0b", sort_order: 2 },
  { name: "Done", color: "#22c55e", sort_order: 3 },
];

// GET /api/mission-control/statuses
export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();

  try {
    let { data, error } = await supabase
      .from("mc_task_statuses")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // Auto-seed defaults if user has no statuses
    if (!data || data.length === 0) {
      const inserts = DEFAULT_STATUSES.map((s) => ({
        ...s,
        user_id: user.id,
      }));
      const { data: seeded, error: seedErr } = await supabase
        .from("mc_task_statuses")
        .insert(inserts)
        .select();

      if (seedErr) throw seedErr;
      data = seeded;
    }

    return NextResponse.json({ statuses: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch statuses" },
      { status: 500 }
    );
  }
}

// POST /api/mission-control/statuses
export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 }, maxBodySize: 10240 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const body = await request.json();
  const { name, color = "#666666" } = body as { name?: string; color?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    // Max 10 statuses
    const { count } = await supabase
      .from("mc_task_statuses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count || 0) >= 10) {
      return NextResponse.json({ error: "Maximum 10 statuses allowed" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mc_task_statuses")
      .insert({
        user_id: user.id,
        name: name.trim(),
        color,
        sort_order: (count || 0),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ status: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create status" }, { status: 500 });
  }
}
