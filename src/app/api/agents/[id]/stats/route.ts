import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:agent_stats`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify user owns this agent
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .single();

  if (!userAgent) {
    return NextResponse.json({ error: "Agent not found in your library" }, { status: 404 });
  }

  // Query agent_analytics for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: analytics } = await admin
    .from("agent_analytics")
    .select("metric_type, response_time_ms, created_at")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  const rows = analytics || [];

  const messageRows = rows.filter((r) => r.metric_type === "message");
  const errorRows = rows.filter((r) => r.metric_type === "error");

  const messageCount = messageRows.length;
  const errorCount = errorRows.length;

  const responseTimes = messageRows
    .map((r) => r.response_time_ms)
    .filter((t): t is number => t != null && t > 0);

  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

  const lastActive = rows.length > 0 ? rows[0].created_at : null;

  return NextResponse.json({
    message_count: messageCount,
    error_count: errorCount,
    avg_response_time_ms: avgResponseTime,
    last_active: lastActive,
    period_days: 7,
  });
}
