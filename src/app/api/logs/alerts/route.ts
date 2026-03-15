import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/logs/alerts — List log alert rules */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { data } = await admin.from("log_alert_rules").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return NextResponse.json({ alerts: data || [] });
}

/** POST /api/logs/alerts — Create a log alert rule */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:log_alerts`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, condition_type, condition_config, notification_channel, notification_target } = body as {
    name?: string; condition_type?: string; condition_config?: Record<string, unknown>;
    notification_channel?: string; notification_target?: string;
  };

  if (!name?.trim() || !condition_type) return NextResponse.json({ error: "name and condition_type are required" }, { status: 400 });

  const validTypes = ["keyword_count", "level_count", "pattern_match", "absence"];
  if (!validTypes.includes(condition_type))
    return NextResponse.json({ error: `Invalid condition_type. Valid: ${validTypes.join(", ")}` }, { status: 400 });

  const { data, error } = await admin.from("log_alert_rules").insert({
    user_id: user.id,
    name: name.trim(),
    condition_type,
    condition_config: condition_config || {},
    notification_channel: notification_channel || "webhook",
    notification_target: notification_target || null,
  }).select("*").single();

  if (error) return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  return NextResponse.json({ alert: data });
}

/** DELETE /api/logs/alerts — Delete an alert rule */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await admin.from("log_alert_rules").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
