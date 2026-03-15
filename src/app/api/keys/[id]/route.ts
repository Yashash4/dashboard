import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, getClientIp } from "@/lib/audit-log";

/** DELETE /api/keys/[id] — revoke an API key */
export async function DELETE(
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

  const rl = rateLimit(`${user.id}:key_revoke`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Verify ownership and revoke
  const { data: key, error } = await admin
    .from("api_keys")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .select("id")
    .single();

  if (error || !key) {
    return NextResponse.json({ error: "Key not found or already revoked" }, { status: 404 });
  }

  logAudit({
    userId: user.id,
    action: "api_key_revoked",
    entityType: "api_key",
    entityId: id,
    category: "api_key",
    ip: getClientIp(request),
  });

  return NextResponse.json({ success: true });
}

/** PATCH /api/keys/[id] — update key name or rate limit */
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

  const rl = rateLimit(`${user.id}:key_update`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const { name, rate_limit_per_min } = body as { name?: string; rate_limit_per_min?: number };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) {
      return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 });
    }
    updates.name = trimmed;
  }
  if (rate_limit_per_min !== undefined) {
    const validLimits = [30, 60, 120, 300];
    if (!validLimits.includes(rate_limit_per_min)) {
      return NextResponse.json({ error: `Rate limit must be one of: ${validLimits.join(", ")}` }, { status: 400 });
    }
    updates.rate_limit_per_min = rate_limit_per_min;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: key, error } = await admin
    .from("api_keys")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .select("id, name, rate_limit_per_min")
    .single();

  if (error || !key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  logAudit({
    userId: user.id,
    action: "api_key_updated",
    entityType: "api_key",
    entityId: id,
    category: "api_key",
    details: updates,
    ip: getClientIp(request),
  });

  return NextResponse.json({ key });
}
