import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:onboarding`, 30, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();

  // Auto-create row if missing
  const { data: existing } = await admin
    .from("user_onboarding")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) return NextResponse.json(existing);

  // Auto-detect completed steps from existing data
  const [channelsRes, agentsRes, chatsRes] = await Promise.all([
    admin.from("channels").select("id").eq("user_id", user.id).eq("status", "connected").limit(1),
    admin.from("user_agents").select("id").eq("user_id", user.id).eq("deployed", true).limit(1),
    admin.from("chat_conversations").select("id").eq("user_id", user.id).limit(1),
  ]);

  const row = {
    user_id: user.id,
    channel_connected: !!(channelsRes.data?.length),
    agent_deployed: !!(agentsRes.data?.length),
    message_sent: !!(chatsRes.data?.length),
    store_visited: false,
  };

  const { data: created, error: insertError } = await admin
    .from("user_onboarding")
    .insert(row)
    .select("*")
    .single();

  if (insertError) {
    // Race condition: another request may have inserted first — try fetching
    const { data: retry } = await admin
      .from("user_onboarding")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (retry) return NextResponse.json(retry);
    // Table may not exist — return defaults gracefully
    return NextResponse.json({ ...row, checklist_dismissed: false, guide_dismissed: false, completed_at: null });
  }

  return NextResponse.json(created);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:onboarding_update`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowedFields = [
    "channel_connected", "agent_deployed", "message_sent",
    "store_visited", "guide_dismissed", "checklist_dismissed",
  ];

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (typeof body[key] === "boolean") updates[key] = body[key];
  }

  // Check if all items completed
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("user_onboarding")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (current) {
    const merged = { ...current, ...updates };
    if (merged.channel_connected && merged.agent_deployed && merged.message_sent && merged.store_visited && !merged.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
  }

  await admin.from("user_onboarding").update(updates).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
