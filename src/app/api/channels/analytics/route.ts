import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/channels/analytics — Per-channel message stats */
export async function GET(request: NextRequest) {
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

  const rl = rateLimit(`${user.id}:channel_analytics`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "7");
  const validDays = [7, 14, 30].includes(days) ? days : 7;
  const since = new Date(Date.now() - validDays * 24 * 60 * 60 * 1000).toISOString();

  // Get analytics grouped by channel_type from agent_analytics
  const { data: analytics } = await admin
    .from("agent_analytics")
    .select("metadata, response_time_ms, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since);

  if (!analytics || analytics.length === 0) {
    return NextResponse.json({
      channels: [],
      hourly_heatmap: {},
    });
  }

  // Aggregate per channel
  const channelStats: Record<string, {
    total_messages: number;
    total_response_time: number;
    hourly: number[];
  }> = {};

  for (const row of analytics) {
    const channelType = (row.metadata as any)?.channel_type || "webchat";
    if (!channelStats[channelType]) {
      channelStats[channelType] = {
        total_messages: 0,
        total_response_time: 0,
        hourly: new Array(24).fill(0),
      };
    }

    channelStats[channelType].total_messages++;
    channelStats[channelType].total_response_time += row.response_time_ms || 0;

    const hour = new Date(row.created_at).getUTCHours();
    channelStats[channelType].hourly[hour]++;
  }

  const channels = Object.entries(channelStats).map(([type, stats]) => ({
    channel_type: type,
    total_messages: stats.total_messages,
    avg_response_time_ms: stats.total_messages > 0
      ? Math.round(stats.total_response_time / stats.total_messages)
      : 0,
    peak_hour: stats.hourly.indexOf(Math.max(...stats.hourly)),
  }));

  const hourly_heatmap: Record<string, number[]> = {};
  for (const [type, stats] of Object.entries(channelStats)) {
    hourly_heatmap[type] = stats.hourly;
  }

  return NextResponse.json({ channels, hourly_heatmap });
}
