import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:usage_summary`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all message analytics for the past 7 days
  const { data: analytics } = await admin
    .from("agent_analytics")
    .select("agent_id, created_at")
    .eq("user_id", user.id)
    .eq("metric_type", "message")
    .gte("created_at", sevenDaysAgo);

  if (!analytics || analytics.length === 0) {
    return NextResponse.json({
      days: [],
      messages: [],
      total_messages: 0,
      top_agent: null,
      top_channel: null,
    });
  }

  // Build daily counts
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().split("T")[0]);
  }

  const dayCounts = days.map(() => 0);
  const agentCounts: Record<string, number> = {};

  for (const a of analytics) {
    const day = new Date(a.created_at).toISOString().split("T")[0];
    const idx = days.indexOf(day);
    if (idx >= 0) dayCounts[idx]++;

    agentCounts[a.agent_id] = (agentCounts[a.agent_id] || 0) + 1;
  }

  // Find top agent
  let topAgent: { name: string; count: number } | null = null;
  const topAgentId = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
  if (topAgentId) {
    const { data: agent } = await admin
      .from("agents")
      .select("name")
      .eq("id", topAgentId[0])
      .single();
    topAgent = { name: agent?.name || "Agent", count: topAgentId[1] };
  }

  return NextResponse.json({
    days: days.map((d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short" })),
    messages: dayCounts,
    total_messages: analytics.length,
    top_agent: topAgent,
    top_channel: null, // Would need channel tracking — not yet available
  });
}
