import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { classifyIntent } from "@/lib/conversation-analysis";

/**
 * GET /api/analytics/paths
 * Analyze user conversation paths — what sequence of intents do users follow?
 * Returns top 10 paths ranked by frequency, plus top transitions.
 */
export async function GET(request: NextRequest) {
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

  const rl = rateLimit(`${user.id}:analytics_paths`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const days = parseInt(
    request.nextUrl.searchParams.get("days") || "30",
    10
  );
  const validDays = [7, 14, 30].includes(days) ? days : 30;
  const since = new Date(
    Date.now() - validDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // Try to get pre-classified intents from conversation_intents table
  const { data: storedIntents } = await admin
    .from("conversation_intents")
    .select("conversation_id, intent, message_index")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("conversation_id")
    .order("message_index");

  let pathsByConversation: Map<string, string[]>;

  if (storedIntents && storedIntents.length > 0) {
    // Use pre-classified intents
    pathsByConversation = new Map();
    for (const row of storedIntents) {
      const existing = pathsByConversation.get(row.conversation_id) || [];
      existing.push(row.intent);
      pathsByConversation.set(row.conversation_id, existing);
    }
  } else {
    // Fallback: fetch recent conversations and classify on the fly
    const { data: conversations } = await admin
      .from("chat_conversations")
      .select("id")
      .eq("user_id", user.id)
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        paths: [],
        top_transitions: [],
        total_conversations: 0,
      });
    }

    pathsByConversation = new Map();

    // Fix H2: Batch-fetch all messages in single query instead of per-conversation
    const convIds = conversations.map(c => c.id);
    const { data: allMessages } = await admin
      .from("chat_messages")
      .select("conversation_id, role, content, created_at")
      .in("conversation_id", convIds)
      .eq("role", "user")
      .order("created_at", { ascending: true });

    // Group messages by conversation
    const messagesByConv: Record<string, typeof allMessages[number][]> = {};
    for (const msg of (allMessages || [])) {
      if (!messagesByConv[msg.conversation_id]) {
        messagesByConv[msg.conversation_id] = [];
      }
      messagesByConv[msg.conversation_id].push(msg);
    }

    for (const conv of conversations) {
      const messages = messagesByConv[conv.id] || [];
      if (messages.length === 0) continue;

      const intents = messages.map((m) => classifyIntent(m.content));
      // Deduplicate consecutive identical intents for cleaner paths
      const deduped = intents.filter(
        (intent, i) => i === 0 || intent !== intents[i - 1]
      );
      pathsByConversation.set(conv.id, deduped);
    }
  }

  // Aggregate paths by sequence
  const pathCounts = new Map<
    string,
    { sequence: string[]; count: number; totalMessages: number }
  >();

  for (const [, intents] of pathsByConversation) {
    if (intents.length === 0) continue;
    const key = intents.join(" -> ");
    const existing = pathCounts.get(key);
    if (existing) {
      existing.count++;
      existing.totalMessages += intents.length;
    } else {
      pathCounts.set(key, {
        sequence: intents,
        count: 1,
        totalMessages: intents.length,
      });
    }
  }

  // Sort by frequency and take top 10
  const sortedPaths = Array.from(pathCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalConversations = pathsByConversation.size;

  const paths = sortedPaths.map((p) => ({
    sequence: p.sequence,
    count: p.count,
    percentage: totalConversations > 0
      ? Math.round((p.count / totalConversations) * 1000) / 10
      : 0,
    avg_messages: Math.round((p.totalMessages / p.count) * 10) / 10,
  }));

  // Calculate top transitions (from -> to pairs)
  const transitionCounts = new Map<string, number>();
  for (const [, intents] of pathsByConversation) {
    for (let i = 0; i < intents.length - 1; i++) {
      const key = `${intents[i]}|${intents[i + 1]}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
    }
  }

  const topTransitions = Array.from(transitionCounts.entries())
    .map(([key, count]) => {
      const [from, to] = key.split("|");
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    paths,
    top_transitions: topTransitions,
    total_conversations: totalConversations,
  });
}
