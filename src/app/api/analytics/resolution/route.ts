import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/analytics/resolution — Resolution rate analytics */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:analytics_resolution`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") || "7") || 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get conversations + message counts
  const { data: conversations } = await admin.from("chat_conversations")
    .select("id, agent_id, created_at, updated_at")
    .eq("user_id", user.id)
    .gte("created_at", since);

  const total = conversations?.length || 0;

  // Estimate resolution based on conversation age and update patterns (no N+1 queries)
  let resolved = 0;
  let abandoned = 0;
  let ongoing = 0;

  for (const conv of conversations || []) {
    const ageHours = (Date.now() - new Date(conv.updated_at).getTime()) / (1000 * 60 * 60);
    const lifespanHours = (new Date(conv.updated_at).getTime() - new Date(conv.created_at).getTime()) / (1000 * 60 * 60);

    // Heuristic: longer conversations that stopped = resolved, short + stale = abandoned
    if (lifespanHours > 0.05 && ageHours > 1) resolved++;
    else if (lifespanHours < 0.02 && ageHours > 24) abandoned++;
    else ongoing++;
  }

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return NextResponse.json({
    total,
    resolved,
    abandoned,
    ongoing,
    resolution_rate: resolutionRate,
    period_days: days,
  });
}
