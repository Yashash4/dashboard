import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/knowledge-base/connectors — List connectors */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { data } = await admin.from("kb_connectors").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return NextResponse.json({ connectors: data || [] });
}

/** POST /api/knowledge-base/connectors — Create a connector */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:kb_connectors`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { type, config } = body as { type?: string; config?: Record<string, unknown> };

  if (!type || !["url_sync", "google_drive", "notion"].includes(type))
    return NextResponse.json({ error: "Invalid connector type" }, { status: 400 });

  if (!config) return NextResponse.json({ error: "Config is required" }, { status: 400 });

  const { data, error } = await admin.from("kb_connectors").insert({
    user_id: user.id,
    type,
    config,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Failed to create connector" }, { status: 500 });
  return NextResponse.json({ connector: data });
}

/** DELETE /api/knowledge-base/connectors — Delete a connector */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await admin.from("kb_connectors").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
