import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** PATCH /api/agents/[id]/model — Set per-agent model + fallback */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const rl = rateLimit(`${user.id}:agent_model`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Verify agent belongs to user
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, agent_id, deployed")
    .eq("user_id", user.id)
    .eq("agent_id", id)
    .single();

  if (!userAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { primary_model, fallback_model } = body as {
    primary_model?: string | null;
    fallback_model?: string | null;
  };

  const updates: Record<string, unknown> = {};

  if (primary_model !== undefined) {
    // null = use VPS default, string = specific model
    if (primary_model !== null) {
      // Validate model exists
      const { data: model } = await admin
        .from("available_models")
        .select("id")
        .eq("model_id", primary_model)
        .single();
      if (!model) {
        return NextResponse.json({ error: "Primary model not found" }, { status: 400 });
      }
    }
    updates.primary_model = primary_model;
  }

  if (fallback_model !== undefined) {
    if (fallback_model !== null) {
      const { data: model } = await admin
        .from("available_models")
        .select("id")
        .eq("model_id", fallback_model)
        .single();
      if (!model) {
        return NextResponse.json({ error: "Fallback model not found" }, { status: 400 });
      }
    }
    updates.fallback_model = fallback_model;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await admin
    .from("user_agents")
    .update(updates)
    .eq("id", userAgent.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...updates });
}
