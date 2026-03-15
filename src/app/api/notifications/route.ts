import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:notifications`, 30, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();
  const { data: notifications } = await admin
    .from("user_notifications")
    .select("id, type, title, message, href, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count } = await admin
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return NextResponse.json({
    notifications: notifications || [],
    unread_count: count || 0,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:notifications_read`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.all === true) {
    await admin
      .from("user_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    await admin
      .from("user_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("id", body.ids);
  }

  return NextResponse.json({ success: true });
}
