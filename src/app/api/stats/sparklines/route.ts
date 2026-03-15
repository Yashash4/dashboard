import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:sparklines`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get message counts per day (from agent_analytics)
  // Limit to 5000 rows to prevent memory issues for very active users
  const { data: messageData } = await admin
    .from("agent_analytics")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("metric_type", "message")
    .gte("created_at", sevenDaysAgo)
    .limit(5000);

  // Get agent deploy events per day
  const { data: agentData } = await admin
    .from("user_agents")
    .select("deployed_at")
    .eq("user_id", user.id)
    .not("deployed_at", "is", null)
    .gte("deployed_at", sevenDaysAgo);

  // Get channel connect events per day
  const { data: channelData } = await admin
    .from("channels")
    .select("configured_at")
    .eq("user_id", user.id)
    .not("configured_at", "is", null)
    .gte("configured_at", sevenDaysAgo);

  // Build 7-day buckets
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().split("T")[0]);
  }

  function countByDay(items: { [key: string]: string }[] | null, field: string) {
    const counts: number[] = days.map(() => 0);
    if (!items) return counts;
    for (const item of items) {
      const dateStr = (item as any)[field];
      if (!dateStr) continue;
      const day = new Date(dateStr).toISOString().split("T")[0];
      const idx = days.indexOf(day);
      if (idx >= 0) counts[idx]++;
    }
    return counts;
  }

  return NextResponse.json({
    days: days.map((d) => {
      const date = new Date(d + "T00:00:00Z");
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }),
    messages: countByDay(messageData, "created_at"),
    agents: countByDay(agentData, "deployed_at"),
    channels: countByDay(channelData, "configured_at"),
  });
}
