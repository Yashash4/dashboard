import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/analytics/dashboards — List custom dashboards */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { data } = await admin.from("analytics_dashboards").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ dashboards: data || [] });
}

/** POST /api/analytics/dashboards — Create or update dashboard */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:dashboards`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { id, name, layout, widgets, is_default } = body as {
    id?: string; name?: string; layout?: unknown[]; widgets?: unknown[]; is_default?: boolean;
  };

  if (id) {
    // Update existing
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (layout !== undefined) updates.layout = layout;
    if (widgets !== undefined) updates.widgets = widgets;
    if (is_default !== undefined) updates.is_default = is_default;

    const { error } = await admin.from("analytics_dashboards").update(updates).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Create new
  const { data, error } = await admin.from("analytics_dashboards").insert({
    user_id: user.id,
    name: name || "My Dashboard",
    layout: layout || [],
    widgets: widgets || [],
    is_default: is_default || false,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  return NextResponse.json({ dashboard: data });
}

/** DELETE /api/analytics/dashboards — Delete a dashboard */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await admin.from("analytics_dashboards").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
