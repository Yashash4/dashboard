import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Free agent purchase only.
 * Paid agent purchases go through /api/payments/create-order + /api/payments/verify.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agent_id } = (await request.json()) as { agent_id?: string };

  if (!agent_id) {
    return NextResponse.json(
      { error: "agent_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify agent exists, is active, and is free
  const { data: agent } = await admin
    .from("agents")
    .select("id, name, price, is_active")
    .eq("id", agent_id)
    .single();

  if (!agent || !agent.is_active) {
    return NextResponse.json(
      { error: "Agent not found or unavailable" },
      { status: 404 }
    );
  }

  const price = Number(agent.price) || 0;
  if (price > 0) {
    return NextResponse.json(
      { error: "This is a paid agent. Use the payment flow instead." },
      { status: 400 }
    );
  }

  // Check if user already owns it
  const { data: existing } = await admin
    .from("user_agents")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", agent_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You already own this agent" },
      { status: 400 }
    );
  }

  // Add to library
  const { error: insertError } = await admin.from("user_agents").insert({
    user_id: user.id,
    agent_id,
    deployed: false,
  });

  if (insertError) {
    console.error("[agents/purchase] Insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to add agent to your library" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
