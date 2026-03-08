import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { isPrivateUrl } from "@/lib/knowledge-base";

const MAX_WEBHOOKS = 10;

/** GET /api/webhooks — list user's webhooks */
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

  const rl = rateLimit(`${user.id}:webhooks_list`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data: webhooks, error } = await admin
    .from("webhooks")
    .select("id, url, secret, events, enabled, description, last_triggered_at, last_status, last_status_code, failure_count, created_at")

    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }

  // Mask secrets — only show prefix + last 4 chars
  const masked = (webhooks || []).map((w) => ({
    ...w,
    secret: w.secret.length > 10
      ? `${w.secret.slice(0, 6)}${"•".repeat(8)}${w.secret.slice(-4)}`
      : "whsec_••••••••",
  }));

  return NextResponse.json({ webhooks: masked });
}

/** POST /api/webhooks — create a webhook */
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

  const rl = rateLimit(`${user.id}:webhook_create`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const { url, events, description } = body as {
    url?: string;
    events?: string[];
    description?: string;
  };

  if (!url || !url.startsWith("https://")) {
    return NextResponse.json(
      { error: "HTTPS URL is required" },
      { status: 400 }
    );
  }

  if (isPrivateUrl(url)) {
    return NextResponse.json(
      { error: "URL must point to a public endpoint" },
      { status: 400 }
    );
  }

  if (url.length > 2048) {
    return NextResponse.json(
      { error: "URL too long (max 2048 characters)" },
      { status: 400 }
    );
  }

  if (!events || events.length === 0) {
    return NextResponse.json(
      { error: "At least one event is required" },
      { status: 400 }
    );
  }

  const validEvents = [
    "message.received", "agent.deployed", "vps.status_changed",
    "channel.connected", "channel.disconnected",
  ];
  const invalidEvents = events.filter((e) => !validEvents.includes(e));
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      { error: `Invalid events: ${invalidEvents.join(", ")}` },
      { status: 400 }
    );
  }

  // Enforce limit
  const { count } = await admin
    .from("webhooks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= MAX_WEBHOOKS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_WEBHOOKS} webhooks allowed. Delete an existing one first.` },
      { status: 400 }
    );
  }

  const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  const { data: webhook, error } = await admin
    .from("webhooks")
    .insert({
      user_id: user.id,
      url,
      secret,
      events,
      description: description?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }

  logAudit({
    userId: user.id,
    action: "webhook_created",
    entityType: "webhook",
    entityId: webhook.id,
    category: "webhook",
    details: { url, events },
    ip: getClientIp(request),
  });

  return NextResponse.json({ webhook });
}
