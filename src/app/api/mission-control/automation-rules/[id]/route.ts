import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const allowed = ["name", "trigger_type", "trigger_value", "action_type", "action_value", "is_enabled"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No updates" }, { status: 400 });
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase.from("mc_automation_rules").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ rule: data });
  } catch {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase.from("mc_automation_rules").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
