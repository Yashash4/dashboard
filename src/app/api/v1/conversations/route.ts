import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/** GET /api/v1/conversations — List user's conversations (API key auth) */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <api_key> header" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401 }
    );
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();

  const { data: apiKey, error: keyError } = await admin
    .from("api_keys")
    .select("id, user_id, status")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !apiKey || apiKey.status !== "active") {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  // Plan check
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", apiKey.user_id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!["pro", "ultra", "enterprise"].includes(plan)) {
    return NextResponse.json(
      { error: "API access requires a Pro plan or higher" },
      { status: 403 }
    );
  }

  // Parse query params
  const url = new URL(request.url);
  const agent = url.searchParams.get("agent");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = admin
    .from("chat_conversations")
    .select("id, agent_id, created_at, updated_at, agents(name)")
    .eq("user_id", apiKey.user_id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (agent) {
    // Filter by agent name
    const { data: agentRows } = await admin
      .from("agents")
      .select("id, name")
      .ilike("name", `%${agent}%`);

    if (agentRows && agentRows.length > 0) {
      query = query.in("agent_id", agentRows.map((a) => a.id));
    } else {
      return NextResponse.json({ conversations: [], total: 0 });
    }
  }

  const { data: conversations, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  const result = (conversations || []).map((c: any) => ({
    id: c.id,
    agent_name: c.agents?.name || "Unknown",
    created_at: c.created_at,
    last_message_at: c.updated_at,
  }));

  return NextResponse.json({ conversations: result, total: count || result.length });
}
