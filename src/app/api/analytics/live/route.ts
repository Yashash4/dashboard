import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";

/** GET /api/analytics/live — Real-time dashboard metrics (poll every 5s) */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  // Active conversations (activity in last 5 min)
  const { count: activeConversations } = await admin.from("chat_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("updated_at", fiveMinAgo);

  // Messages per minute (last minute)
  const { count: messagesLastMin } = await admin.from("agent_analytics")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("metric_type", "message")
    .gte("created_at", oneMinAgo);

  // Deployed agents count
  const { count: agentsOnline } = await admin.from("user_agents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("deployed", true);

  // Avg response time (last 5 min)
  const { data: recentMetrics } = await admin.from("agent_analytics")
    .select("response_time_ms")
    .eq("user_id", user.id)
    .gte("created_at", fiveMinAgo);

  const avgResponseTime = recentMetrics && recentMetrics.length > 0
    ? Math.round(recentMetrics.reduce((s, r) => s + (r.response_time_ms || 0), 0) / recentMetrics.length)
    : 0;

  return NextResponse.json({
    active_conversations: activeConversations || 0,
    messages_per_minute: messagesLastMin || 0,
    agents_online: agentsOnline || 0,
    avg_response_time_ms: avgResponseTime,
    timestamp: now.toISOString(),
  });
}
