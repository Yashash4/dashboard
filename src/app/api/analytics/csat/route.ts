import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/analytics/csat — CSAT summary */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const url = new URL(request.url);
  const days = Math.min(90, parseInt(url.searchParams.get("days") || "30"));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: ratings } = await admin.from("csat_ratings")
    .select("rating, agent_id, channel_type, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since);

  if (!ratings || ratings.length === 0) {
    return NextResponse.json({
      average: 0, total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      by_agent: {},
    });
  }

  const total = ratings.length;
  const average = ratings.reduce((s, r) => s + r.rating, 0) / total;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const byAgent: Record<string, { total: number; sum: number }> = {};

  for (const r of ratings) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    const agentKey = r.agent_id || "unknown";
    if (!byAgent[agentKey]) byAgent[agentKey] = { total: 0, sum: 0 };
    byAgent[agentKey].total++;
    byAgent[agentKey].sum += r.rating;
  }

  return NextResponse.json({
    average: Math.round(average * 10) / 10,
    total,
    distribution,
    by_agent: Object.fromEntries(
      Object.entries(byAgent).map(([k, v]) => [k, Math.round((v.sum / v.total) * 10) / 10])
    ),
  });
}

/** POST /api/analytics/csat — Submit a CSAT rating */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const rl = rateLimit(`${user.id}:csat_submit`, 30, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { conversation_id, agent_id, rating, comment, channel_type } = body as {
    conversation_id?: string; agent_id?: string; rating?: number; comment?: string; channel_type?: string;
  };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const { data, error } = await admin.from("csat_ratings").insert({
    user_id: user.id,
    conversation_id: conversation_id || null,
    agent_id: agent_id || null,
    channel_type: channel_type || "webchat",
    rating,
    comment: comment?.trim() || null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
