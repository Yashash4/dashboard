import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/analytics/funnels — Conversation funnel stages */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:analytics_funnels`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const days = Math.min(90, parseInt(url.searchParams.get("days") || "7"));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Count conversations at each stage
  const { data: conversations } = await admin.from("chat_conversations")
    .select("id, created_at, updated_at")
    .eq("user_id", user.id)
    .gte("created_at", since);

  const total = conversations?.length || 0;

  // For each conversation, count messages to determine stage
  let engaged = 0, substantive = 0, resolved = 0, satisfied = 0;

  if (conversations && conversations.length > 0) {
    for (const conv of conversations.slice(0, 200)) {
      const { count } = await admin.from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id);

      const msgCount = count || 0;
      if (msgCount >= 2) engaged++;
      if (msgCount >= 4) substantive++;
      if (msgCount >= 6) resolved++; // Simplified — real detection would check message content
    }

    // CSAT
    const { count: csatCount } = await admin.from("csat_ratings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("rating", 4)
      .gte("created_at", since);
    satisfied = csatCount || 0;
  }

  return NextResponse.json({
    funnel: {
      started: total,
      engaged,
      substantive,
      resolved,
      satisfied,
    },
    period_days: days,
  });
}
