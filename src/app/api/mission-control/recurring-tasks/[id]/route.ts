import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const allowed = ["schedule_type", "schedule_value", "next_run_at", "is_enabled"];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in body) updates[k] = body[k]; }

  try {
    const { data, error } = await supabase.from("mc_recurring_tasks").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ recurring: data });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 10, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase.from("mc_recurring_tasks").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
