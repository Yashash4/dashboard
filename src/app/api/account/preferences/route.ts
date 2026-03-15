import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const DEFAULT_PREFERENCES = {
  ticket_replies: { dashboard: true, email: true },
  vps_alerts: { dashboard: true, email: true },
  agent_errors: { dashboard: true, email: true },
  channel_disconnects: { dashboard: true, email: true },
  weekly_summary: { dashboard: true, email: true },
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:prefs_get`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("notification_preferences, timezone")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { preferences: DEFAULT_PREFERENCES, timezone: "UTC" },
      { status: 200 }
    );
  }

  return NextResponse.json({
    preferences: data.notification_preferences || DEFAULT_PREFERENCES,
    timezone: data.timezone || "UTC",
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:prefs_update`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { preferences, timezone } = body as {
    preferences?: Record<string, unknown>;
    timezone?: string;
  };

  const updateData: Record<string, unknown> = {};

  if (preferences) {
    updateData.notification_preferences = preferences;
  }

  if (timezone && typeof timezone === "string" && timezone.length <= 50) {
    updateData.timezone = timezone;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
