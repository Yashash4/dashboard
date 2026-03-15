import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { detectAnomalies, type MetricSet } from "@/lib/analytics-anomalies";

/**
 * GET /api/analytics/anomalies
 * Compares last 24 hours of metrics against the previous 24 hours.
 * Returns any detected anomalies.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const rl = rateLimit(`${user.id}:analytics_anomalies`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  // Fetch current period metrics (last 24h)
  const currentMetrics = await fetchPeriodMetrics(
    admin,
    user.id,
    oneDayAgo,
    now.toISOString()
  );

  // Fetch baseline period metrics (previous 24h)
  const baselineMetrics = await fetchPeriodMetrics(
    admin,
    user.id,
    twoDaysAgo,
    oneDayAgo
  );

  const anomalies = detectAnomalies(currentMetrics, baselineMetrics);

  return NextResponse.json({
    anomalies,
    current: currentMetrics,
    baseline: baselineMetrics,
    period: {
      current: { start: oneDayAgo, end: now.toISOString() },
      baseline: { start: twoDaysAgo, end: oneDayAgo },
    },
  });
}

/**
 * Fetch aggregated metrics for a time period from agent_analytics.
 */
async function fetchPeriodMetrics(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  start: string,
  end: string
): Promise<MetricSet> {
  // Message volume and avg response time from agent_analytics
  const { data: analytics } = await admin
    .from("agent_analytics")
    .select("response_time_ms, metric_type")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lt("created_at", end);

  const messages = analytics?.filter((a) => a.metric_type === "message") || [];
  const messageVolume = messages.length;
  const avgResponseTime =
    messageVolume > 0
      ? Math.round(
          messages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) /
            messageVolume
        )
      : 0;

  // Resolution rate from conversation_stages (if available)
  let resolutionRate = 0;
  const { count: totalConvs } = await admin
    .from("conversation_stages")
    .select("conversation_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("stage", "started")
    .gte("reached_at", start)
    .lt("reached_at", end);

  if (totalConvs && totalConvs > 0) {
    const { count: resolvedConvs } = await admin
      .from("conversation_stages")
      .select("conversation_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("stage", "resolved")
      .gte("reached_at", start)
      .lt("reached_at", end);

    resolutionRate = Math.round(
      ((resolvedConvs || 0) / totalConvs) * 1000
    ) / 10;
  }

  // CSAT from conversation_ratings (if available)
  let csatAverage = 0;
  const { data: ratings } = await admin
    .from("conversation_ratings")
    .select("rating")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lt("created_at", end);

  if (ratings && ratings.length > 0) {
    const satisfied = ratings.filter((r) => r.rating >= 4).length;
    csatAverage = Math.round((satisfied / ratings.length) * 1000) / 10;
  }

  return { messageVolume, avgResponseTime, resolutionRate, csatAverage };
}
