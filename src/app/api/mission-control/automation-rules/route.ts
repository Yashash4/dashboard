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
      .from("mc_automation_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ rules: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 }, maxBodySize: 10240 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const body = await request.json();

  const { name, trigger_type, trigger_value, action_type, action_value } = body;

  // 350_LOW_07: Validate trigger_type and action_type against whitelist
  if (trigger_type && !["task_enters_column", "task_priority_changes", "task_status_changed"].includes(trigger_type)) {
    return NextResponse.json({ error: "Invalid trigger_type" }, { status: 400 });
  }
  if (action_type && !["assign_agent", "move_to_column", "create_task", "send_notification"].includes(action_type)) {
    return NextResponse.json({ error: "Invalid action_type" }, { status: 400 });
  }

  if (!name || !trigger_type || !action_type) {
    return NextResponse.json({ error: "name, trigger_type, action_type required" }, { status: 400 });
  }

  try {
    const { count } = await supabase.from("mc_automation_rules").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count || 0) >= 20) return NextResponse.json({ error: "Max 20 rules" }, { status: 400 });

    const { data, error } = await supabase
      .from("mc_automation_rules")
      .insert({ user_id: user.id, name, trigger_type, trigger_value, action_type, action_value })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rule: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
