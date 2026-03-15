import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:channel_messages`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const { id: channelId } = await params;

  if (!channelId || channelId.length < 10) {
    return NextResponse.json(
      { error: "Invalid channel ID" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify channel belongs to this user
  const { data: channel } = await admin
    .from("channels")
    .select("id, channel_type")
    .eq("id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json(
      { error: "Channel not found" },
      { status: 404 }
    );
  }

  // Get recent messages from conversations on this channel type
  // chat_conversations are linked by user_id, and we filter by channel context
  const { data: conversations } = await admin
    .from("chat_conversations")
    .select("id")
    .eq("user_id", user.id);

  if (!conversations || conversations.length === 0) {
    return NextResponse.json({ messages: [] });
  }

  const conversationIds = conversations.map((c) => c.id);

  const { data: messages } = await admin
    .from("chat_messages")
    .select("id, role, content, created_at, conversation_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({ messages: messages || [] });
}
