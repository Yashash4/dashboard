import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { isPrivateUrl } from "@/lib/knowledge-base";

/** POST /api/webhooks/[id]/test — send a test event */
export async function POST(
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

  const rl = rateLimit(`${user.id}:webhook_test`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Get webhook
  const { data: webhook } = await admin
    .from("webhooks")
    .select("id, url, secret")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  if (isPrivateUrl(webhook.url)) {
    return NextResponse.json(
      { error: "Webhook URL points to a private address" },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  const payload = {
    event: "test",
    data: {
      message: "This is a test event from ClawHQ",
      webhook_id: webhook.id,
    },
    timestamp,
  };
  const body = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClawHQ-Signature": signature,
        "X-ClawHQ-Event": "test",
        "X-ClawHQ-Timestamp": timestamp,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Update webhook status
    await admin
      .from("webhooks")
      .update({
        last_triggered_at: timestamp,
        last_status: res.ok ? "success" : "failed",
        last_status_code: res.status,
      })
      .eq("id", id);

    return NextResponse.json({
      success: res.ok,
      status_code: res.status,
    });
  } catch {
    await admin
      .from("webhooks")
      .update({
        last_triggered_at: timestamp,
        last_status: "failed",
        last_status_code: 0,
      })
      .eq("id", id);

    return NextResponse.json(
      { success: false, error: "Request failed or timed out" },
      { status: 502 }
    );
  }
}
