import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { isPrivateUrl } from "@/lib/knowledge-base";

/** PATCH /api/webhooks/[id] — update webhook (enable/disable, change events, URL) */
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

  const rl = rateLimit(`${user.id}:webhook_update`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Verify ownership
  const { data: existing } = await admin
    .from("webhooks")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  // ST_LOW_01: Wrap request.json() in try-catch for malformed JSON
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const {
    url, events, enabled, description,
    filter_conditions, transformation,
    retry_max_attempts, retry_interval_seconds,
    paused_at,
  } = body as {
    url?: string;
    events?: string[];
    enabled?: boolean;
    description?: string;
    filter_conditions?: any;
    transformation?: string | null;
    retry_max_attempts?: number;
    retry_interval_seconds?: number;
    paused_at?: string | null;
  };

  const updates: Record<string, unknown> = {};

  if (url !== undefined) {
    if (!url.startsWith("https://")) {
      return NextResponse.json({ error: "HTTPS URL is required" }, { status: 400 });
    }
    if (isPrivateUrl(url)) {
      return NextResponse.json({ error: "URL must point to a public endpoint" }, { status: 400 });
    }
    if (url.length > 2048) {
      return NextResponse.json({ error: "URL too long" }, { status: 400 });
    }
    updates.url = url;
  }

  if (events !== undefined) {
    if (events.length === 0) {
      return NextResponse.json({ error: "At least one event is required" }, { status: 400 });
    }
    const validEvents = [
      "message.received", "agent.deployed", "agent.undeployed",
      "vps.status_changed", "channel.connected", "channel.disconnected",
      "api.request", "kb.document.indexed", "session.started",
    ];
    const invalid = events.filter((e) => !validEvents.includes(e));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalid.join(", ")}` }, { status: 400 });
    }
    updates.events = events;
  }

  if (enabled !== undefined) {
    updates.enabled = enabled;
  }

  if (description !== undefined) {
    updates.description = description.trim() || null;
  }

  // 6.3 Event filtering
  if (filter_conditions !== undefined) {
    updates.filter_conditions = filter_conditions;
  }

  // 6.5 Payload transformation
  if (transformation !== undefined) {
    updates.transformation = transformation;
  }

  // 6.4 Configurable retry policy
  if (retry_max_attempts !== undefined) {
    const clamped = Math.max(1, Math.min(10, retry_max_attempts));
    updates.retry_max_attempts = clamped;
  }
  if (retry_interval_seconds !== undefined) {
    const validIntervals = [10, 30, 60, 300, 900];
    updates.retry_interval_seconds = validIntervals.includes(retry_interval_seconds)
      ? retry_interval_seconds : 30;
  }

  // 6.6 Pause/Resume
  if (paused_at !== undefined) {
    updates.paused_at = paused_at;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data: webhook, error } = await admin
    .from("webhooks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }

  logAudit({
    userId: user.id,
    action: "webhook_updated",
    entityType: "webhook",
    entityId: id,
    category: "webhook",
    details: updates,
    ip: getClientIp(request),
  });

  return NextResponse.json({ webhook });
}

/** DELETE /api/webhooks/[id] — delete webhook */
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

  const rl2 = rateLimit(`${user.id}:webhook_delete`, 10, 60_000);
  if (!rl2.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data: webhook, error } = await admin
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  logAudit({
    userId: user.id,
    action: "webhook_deleted",
    entityType: "webhook",
    entityId: id,
    category: "webhook",
    ip: getClientIp(request),
  });

  return NextResponse.json({ success: true });
}
