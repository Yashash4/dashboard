import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:model_performance`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all analytics for this user in the last 7 days
  const { data: analytics } = await admin
    .from("agent_analytics")
    .select("metric_type, response_time_ms, created_at")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo);

  if (!analytics || analytics.length === 0) {
    return NextResponse.json({
      message_count: 0,
      error_count: 0,
      avg_response_time_ms: 0,
      fastest_ms: 0,
      slowest_ms: 0,
      success_rate: 100,
    });
  }

  const messages = analytics.filter((a) => a.metric_type === "message");
  const errors = analytics.filter((a) => a.metric_type === "error");

  const responseTimes = messages
    .map((m) => m.response_time_ms)
    .filter((t): t is number => t != null && t > 0);

  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const fastest = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const slowest = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

  const total = messages.length + errors.length;
  const successRate = total > 0 ? (messages.length / total) * 100 : 100;

  return NextResponse.json({
    message_count: messages.length,
    error_count: errors.length,
    avg_response_time_ms: Math.round(avgResponseTime),
    fastest_ms: Math.round(fastest),
    slowest_ms: Math.round(slowest),
    success_rate: Math.round(successRate * 10) / 10,
  });
}
