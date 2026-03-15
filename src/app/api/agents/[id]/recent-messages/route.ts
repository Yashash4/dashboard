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

  const rl = rateLimit(`${user.id}:agent_messages`, 20, 60_000);
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

  // Get the conversation for this user + agent
  const { data: conversation } = await admin
    .from("chat_conversations")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .single();

  if (!conversation) {
    return NextResponse.json({ messages: [] });
  }

  // Get last 10 messages
  const { data: messages } = await admin
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Return in chronological order
  const sorted = (messages || []).reverse();

  return NextResponse.json({ messages: sorted });
}
