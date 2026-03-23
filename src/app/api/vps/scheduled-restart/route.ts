import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** GET /api/vps/scheduled-restart — fetch user's restart schedule */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:sched_restart_get`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();
  const { data: schedule, error } = await admin
    .from("scheduled_restarts")
    .select("id, restart_type, day_of_week, time_utc, enabled, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }

  return NextResponse.json({ schedule: schedule || null });
}

/** POST /api/vps/scheduled-restart — create or update restart schedule */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:sched_restart_set`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // ST_LOW_01: Wrap request.json() in try-catch for malformed JSON
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { restart_type, day_of_week, time_utc } = body as {
    restart_type?: string;
    day_of_week?: number;
    time_utc?: string;
  };

  // Validate restart_type
  if (!restart_type || !["openclaw", "full_vps"].includes(restart_type)) {
    return NextResponse.json(
      { error: 'restart_type must be "openclaw" or "full_vps"' },
      { status: 400 }
    );
  }

  // Validate day_of_week (0 = Sunday, 6 = Saturday)
  if (day_of_week === undefined || day_of_week === null || !Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6) {
    return NextResponse.json(
      { error: `day_of_week must be 0-6 (${DAYS.join(", ")})` },
      { status: 400 }
    );
  }

  // Validate time_utc format HH:MM
  if (!time_utc || !TIME_REGEX.test(time_utc)) {
    return NextResponse.json(
      { error: "time_utc must be in HH:MM format (24-hour UTC)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if user has a VPS
  const { data: vps } = await admin
    .from("vps_instances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vps) {
    return NextResponse.json(
      { error: "No VPS found. Deploy a VPS first." },
      { status: 400 }
    );
  }

  // Upsert — one schedule per user
  const { data: existing } = await admin
    .from("scheduled_restarts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await admin
      .from("scheduled_restarts")
      .update({
        restart_type,
        day_of_week,
        time_utc,
        enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, restart_type, day_of_week, time_utc, enabled, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule: updated });
  }

  const { data: created, error } = await admin
    .from("scheduled_restarts")
    .insert({
      user_id: user.id,
      restart_type,
      day_of_week,
      time_utc,
      enabled: true,
    })
    .select("id, restart_type, day_of_week, time_utc, enabled, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }

  return NextResponse.json({ schedule: created });
}

/** DELETE /api/vps/scheduled-restart — remove restart schedule */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:sched_restart_del`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("scheduled_restarts")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove schedule" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
