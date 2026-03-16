import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/chat/conversations — list conversation sessions for an agent */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:chat_convos`, 30, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const agentId = url.searchParams.get("agent_id");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  if (!agentId) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get distinct conversations (session_id groups) with last message
  const { data, error, count } = await admin
    .from("chat_messages")
    .select("session_id, content, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  // Group by session_id
  const sessions = new Map<string, {
    id: string;
    last_message: string | null;
    message_count: number;
    last_message_at: string;
    created_at: string;
  }>();

  for (const msg of data || []) {
    const sid = msg.session_id || "default";
    if (!sessions.has(sid)) {
      sessions.set(sid, {
        id: sid,
        last_message: msg.content?.slice(0, 100) ?? null,
        message_count: 1,
        last_message_at: msg.created_at,
        created_at: msg.created_at,
      });
    } else {
      const existing = sessions.get(sid)!;
      existing.message_count += 1;
    }
  }

  const conversations = Array.from(sessions.values());

  return NextResponse.json({
    conversations,
    total: conversations.length,
  });
}
