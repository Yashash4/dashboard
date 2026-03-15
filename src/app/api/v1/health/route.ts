import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/** GET /api/v1/health — Validate API key without sending a message */
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
    .select("id, user_id, name, status, rate_limit_per_min")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (apiKey.status !== "active") {
    return NextResponse.json(
      { error: "API key has been revoked" },
      { status: 401 }
    );
  }

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

  // Get deployed agents for the user
  const { data: userAgents } = await admin
    .from("user_agents")
    .select("agents(name)")
    .eq("user_id", apiKey.user_id)
    .eq("deployed", true);

  const agents = (userAgents || []).map((ua: any) => ua.agents?.name || "unknown");

  return NextResponse.json({
    status: "ok",
    plan,
    key_name: apiKey.name,
    rate_limit: apiKey.rate_limit_per_min || 60,
    agents,
  });
}
