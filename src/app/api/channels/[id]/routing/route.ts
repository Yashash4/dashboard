import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:channel_routing_get`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();

  // Verify channel belongs to user
  const { data: channel } = await admin
    .from("channels")
    .select("id")
    .eq("id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Get routing config
  const { data: routing } = await admin
    .from("channel_agent_routing")
    .select("agent_id, priority, agents(name)")
    .eq("channel_id", channelId)
    .order("priority", { ascending: true });

  return NextResponse.json({ routing: routing || [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:channel_routing`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { agent_id } = body as { agent_id?: string };

  const admin = createAdminClient();

  // Verify channel belongs to user
  const { data: channel } = await admin
    .from("channels")
    .select("id")
    .eq("id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  if (!agent_id) {
    // Remove routing — use default
    await admin
      .from("channel_agent_routing")
      .delete()
      .eq("channel_id", channelId);

    return NextResponse.json({ success: true, routing: "default" });
  }

  // Verify agent belongs to user and is deployed
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agent_id)
    .eq("deployed", true)
    .single();

  if (!userAgent) {
    return NextResponse.json(
      { error: "Agent not found or not deployed" },
      { status: 400 }
    );
  }

  // Upsert routing
  await admin
    .from("channel_agent_routing")
    .upsert(
      {
        channel_id: channelId,
        agent_id,
        priority: 1,
        user_id: user.id,
      },
      { onConflict: "channel_id" }
    );

  return NextResponse.json({ success: true, agent_id });
}
