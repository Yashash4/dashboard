import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { classifyIntent } from "@/lib/conversation-analysis";

/** GET /api/analytics/intents — Top questions/intents */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:analytics_intents`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const days = Math.min(90, parseInt(url.searchParams.get("days") || "7"));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get recent user messages
  const { data: conversations } = await admin.from("chat_conversations")
    .select("id").eq("user_id", user.id).gte("created_at", since).limit(100);

  if (!conversations || conversations.length === 0) {
    return NextResponse.json({ intents: [] });
  }

  const convIds = conversations.map((c) => c.id);
  const { data: messages } = await admin.from("chat_messages")
    .select("content")
    .in("conversation_id", convIds)
    .eq("role", "user")
    .limit(500);

  // Classify intents
  const intentCounts: Record<string, number> = {};
  for (const msg of messages || []) {
    const intent = classifyIntent(msg.content || "");
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  }

  const intents = Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ intents, total_messages: messages?.length || 0 });
}
