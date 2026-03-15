import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function GET(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("mc_recurring_tasks")
      .select("*, template:template_id(id, name, priority)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ recurring: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch recurring tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const body = await request.json();

  const { template_id, schedule_type, schedule_value, next_run_at } = body;
  if (!template_id || !schedule_type || !schedule_value || !next_run_at) {
    return NextResponse.json({ error: "template_id, schedule_type, schedule_value, next_run_at required" }, { status: 400 });
  }

  try {
    const { count } = await supabase.from("mc_recurring_tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count || 0) >= 10) return NextResponse.json({ error: "Max 10 recurring tasks" }, { status: 400 });

    const { data, error } = await supabase
      .from("mc_recurring_tasks")
      .insert({ user_id: user.id, template_id, schedule_type, schedule_value, next_run_at })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ recurring: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create recurring task" }, { status: 500 });
  }
}
