import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { isPrivateUrl } from "@/lib/knowledge-base";

/** POST /api/webhooks/[id]/deliveries/[deliveryId]/replay — Replay a delivery */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  const { id, deliveryId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:webhook_replay`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Get webhook
  const { data: webhook } = await admin.from("webhooks").select("id, url, secret")
    .eq("id", id).eq("user_id", user.id).single();
  if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

  if (isPrivateUrl(webhook.url))
    return NextResponse.json({ error: "Webhook URL is private" }, { status: 400 });

  // Get original delivery
  const { data: delivery } = await admin.from("webhook_deliveries")
    .select("event_type, payload").eq("id", deliveryId).eq("webhook_id", id).single();
  if (!delivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

  const timestamp = new Date().toISOString();
  const body = JSON.stringify(delivery.payload);
  const signature = crypto.createHmac("sha256", webhook.secret).update(`${timestamp}.${body}`).digest("hex");

  const startMs = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClawHQ-Signature": signature,
        "X-ClawHQ-Event": delivery.event_type,
        "X-ClawHQ-Timestamp": timestamp,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - startMs;
    const responseBody = await res.text().catch(() => "");

    await admin.from("webhook_deliveries").insert({
      webhook_id: id,
      user_id: user.id,
      event_type: delivery.event_type,
      payload: delivery.payload,
      status_code: res.status,
      response_body: responseBody.slice(0, 1024),
      latency_ms: latencyMs,
      success: res.ok,
      is_replay: true,
    });

    return NextResponse.json({ success: res.ok, status_code: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Replay failed" }, { status: 502 });
  }
}
