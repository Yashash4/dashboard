import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const agentId = searchParams.get("agent_id");
  const days = parseInt(searchParams.get("days") || "7", 10);
  const clampedDays = Math.min(Math.max(days, 1), 90);

  const admin = createAdminClient();
  const since = new Date(
    Date.now() - clampedDays * 24 * 60 * 60 * 1000
  ).toISOString();

  let query = admin
    .from("agent_analytics")
    .select("metric_type, response_time_ms, created_at, agent_id")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[agents/analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }

  // Aggregate stats
  const messages = rows?.filter((r) => r.metric_type === "message") || [];
  const errors = rows?.filter((r) => r.metric_type === "error") || [];

  const totalMessages = messages.length;
  const totalErrors = errors.length;
  const avgResponseTime =
    messages.length > 0
      ? Math.round(
          messages.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) /
            messages.length
        )
      : 0;

  // Daily breakdown
  const dailyMap: Record<string, { messages: number; errors: number }> = {};
  for (const row of rows || []) {
    const day = row.created_at.split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { messages: 0, errors: 0 };
    if (row.metric_type === "message") dailyMap[day].messages++;
    else if (row.metric_type === "error") dailyMap[day].errors++;
  }

  const daily = Object.entries(dailyMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Per-agent breakdown
  const agentMap: Record<string, { messages: number; errors: number; avgMs: number; totalMs: number }> = {};
  for (const row of rows || []) {
    const aid = row.agent_id;
    if (!agentMap[aid]) agentMap[aid] = { messages: 0, errors: 0, avgMs: 0, totalMs: 0 };
    if (row.metric_type === "message") {
      agentMap[aid].messages++;
      agentMap[aid].totalMs += row.response_time_ms || 0;
    } else if (row.metric_type === "error") {
      agentMap[aid].errors++;
    }
  }

  const perAgent = Object.entries(agentMap).map(([id, stats]) => ({
    agent_id: id,
    messages: stats.messages,
    errors: stats.errors,
    avg_response_time_ms:
      stats.messages > 0 ? Math.round(stats.totalMs / stats.messages) : 0,
  }));

  return NextResponse.json({
    total_messages: totalMessages,
    total_errors: totalErrors,
    avg_response_time_ms: avgResponseTime,
    error_rate:
      totalMessages + totalErrors > 0
        ? parseFloat(
            ((totalErrors / (totalMessages + totalErrors)) * 100).toFixed(1)
          )
        : 0,
    daily,
    per_agent: perAgent,
    days: clampedDays,
  });
}
