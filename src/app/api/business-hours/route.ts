import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/business-hours — Get user's business hours config */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("business_hours")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ businessHours: data || [] });
}

/** POST /api/business-hours — Set business hours (upsert) */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:biz_hours`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { channel_type, timezone, schedule } = body as {
    channel_type?: string | null;
    timezone?: string;
    schedule?: Record<string, { start: string; end: string; enabled: boolean }>;
  };

  if (!timezone || !schedule) {
    return NextResponse.json({ error: "timezone and schedule are required" }, { status: 400 });
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const row: Record<string, unknown> = {
    user_id: user.id,
    channel_type: channel_type || null,
    timezone,
  };

  for (const day of days) {
    const dayConfig = schedule[day];
    if (dayConfig) {
      row[`${day}_start`] = dayConfig.start || "09:00";
      row[`${day}_end`] = dayConfig.end || "17:00";
      row[`${day}_enabled`] = dayConfig.enabled !== false;
    }
  }

  const { data, error } = await admin
    .from("business_hours")
    .upsert(row, { onConflict: "user_id,channel_type" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save business hours" }, { status: 500 });
  }

  return NextResponse.json({ businessHours: data });
}
