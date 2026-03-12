import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:chat_messages_get`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const agentId = request.nextUrl.searchParams.get("agent_id");
  if (!agentId) {
    return NextResponse.json(
      { error: "agent_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Find conversation
  const { data: conversation } = await admin
    .from("chat_conversations")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .single();

  if (!conversation) {
    return NextResponse.json({ messages: [] });
  }

  // Get messages
  const { data: messages } = await admin
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const sorted = (messages || []).reverse();

  return NextResponse.json({ messages: sorted });
}

// Clear chat history for an agent
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:chat_messages_delete`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const agentId = request.nextUrl.searchParams.get("agent_id");
  if (!agentId) {
    return NextResponse.json(
      { error: "agent_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: conversation } = await admin
    .from("chat_conversations")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .single();

  if (conversation) {
    await admin
      .from("chat_messages")
      .delete()
      .eq("conversation_id", conversation.id);
  }

  return NextResponse.json({ success: true });
}
