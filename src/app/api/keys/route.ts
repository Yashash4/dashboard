import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, getClientIp } from "@/lib/audit-log";

const MAX_ACTIVE_KEYS = 5;

/** GET /api/keys — list user's API keys (never returns full key) */
export async function GET() {
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

  const rl = rateLimit(`${user.id}:keys_list`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data: keys, error } = await admin
    .from("api_keys")
    .select("id, name, key_prefix, usage_count, last_used_at, status, rate_limit_per_min, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }

  // Fetch per-key usage stats from agent_analytics
  const activeKeyIds = (keys || []).filter((k) => k.status === "active").map((k) => k.id);
  let keyStats: Record<string, { today: number; week: number; errors: number }> = {};

  if (activeKeyIds.length > 0) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Requests today
    const { data: todayData } = await admin
      .from("agent_analytics")
      .select("api_key_id")
      .in("api_key_id", activeKeyIds)
      .gte("created_at", todayStart);

    // Requests this week
    const { data: weekData } = await admin
      .from("agent_analytics")
      .select("api_key_id")
      .in("api_key_id", activeKeyIds)
      .gte("created_at", weekStart);

    // Errors this week
    const { data: errorData } = await admin
      .from("agent_analytics")
      .select("api_key_id")
      .in("api_key_id", activeKeyIds)
      .eq("metric_type", "error")
      .gte("created_at", weekStart);

    for (const keyId of activeKeyIds) {
      keyStats[keyId] = {
        today: (todayData || []).filter((r) => r.api_key_id === keyId).length,
        week: (weekData || []).filter((r) => r.api_key_id === keyId).length,
        errors: (errorData || []).filter((r) => r.api_key_id === keyId).length,
      };
    }
  }

  return NextResponse.json({ keys: keys || [], keyStats });
}

/** POST /api/keys — generate a new API key, return full key ONCE */
export async function POST(request: NextRequest) {
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

  const rl = rateLimit(`${user.id}:key_create`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const { name, rate_limit_per_min } = body as { name?: string; rate_limit_per_min?: number };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }

  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Key name must be 100 characters or less" }, { status: 400 });
  }

  // Enforce 5 active key limit
  const { count } = await admin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if ((count || 0) >= MAX_ACTIVE_KEYS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ACTIVE_KEYS} active keys allowed. Revoke an existing key first.` },
      { status: 400 }
    );
  }

  // Generate key: clw_ + 32 random hex chars
  const rawKey = `clw_${crypto.randomBytes(16).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12); // "clw_" + first 8 hex chars

  // Validate rate limit if provided
  const validLimits = [30, 60, 120, 300];
  const rateLimit_rpm = rate_limit_per_min && validLimits.includes(rate_limit_per_min)
    ? rate_limit_per_min
    : 60;

  const { data: key, error } = await admin
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
      rate_limit_per_min: rateLimit_rpm,
    })
    .select("id, name, key_prefix, status, rate_limit_per_min, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }

  logAudit({
    userId: user.id,
    action: "api_key_created",
    entityType: "api_key",
    entityId: key.id,
    category: "api_key",
    details: { name: name.trim(), prefix: keyPrefix },
    ip: getClientIp(request),
  });

  // Return the full key ONCE — it's never stored or retrievable again
  return NextResponse.json({ key: { ...key, full_key: rawKey } });
}
