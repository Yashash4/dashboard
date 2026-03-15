import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/logs/saved-views — List saved log views */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { data } = await admin.from("log_saved_views").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return NextResponse.json({ views: data || [] });
}

/** POST /api/logs/saved-views — Create a saved view */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:log_views`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, filters, is_default } = body as { name?: string; filters?: Record<string, unknown>; is_default?: boolean };

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  // If setting as default, unset other defaults
  if (is_default) {
    await admin.from("log_saved_views").update({ is_default: false }).eq("user_id", user.id);
  }

  const { data, error } = await admin.from("log_saved_views").insert({
    user_id: user.id,
    name: name.trim(),
    filters: filters || {},
    is_default: is_default || false,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Failed to save view" }, { status: 500 });
  return NextResponse.json({ view: data });
}

/** DELETE /api/logs/saved-views — Delete a saved view */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await admin.from("log_saved_views").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
