import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { isPrivateUrl } from "@/lib/knowledge-base";

/** POST /api/webhooks/[id]/deliveries/bulk-retry — Retry all failed deliveries */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:webhook_bulk_retry`, 3, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Get webhook
  const { data: webhook } = await admin.from("webhooks").select("id, url, secret")
    .eq("id", id).eq("user_id", user.id).single();
  if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  if (isPrivateUrl(webhook.url))
    return NextResponse.json({ error: "Webhook URL is private" }, { status: 400 });

  // Get failed deliveries (max 50)
  const { data: failed } = await admin.from("webhook_deliveries")
    .select("id, event_type, payload")
    .eq("webhook_id", id).eq("user_id", user.id).eq("success", false)
    .order("created_at", { ascending: false }).limit(50);

  if (!failed || failed.length === 0)
    return NextResponse.json({ retried: 0, succeeded: 0, failed: 0 });

  let succeeded = 0;
  let failedCount = 0;

  // Process in batches of 5 to avoid timeout (max 50s for 10 batches)
  const BATCH_SIZE = 5;
  for (let i = 0; i < failed.length; i += BATCH_SIZE) {
    const batch = failed.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (delivery) => {
        const timestamp = new Date().toISOString();
        const body = JSON.stringify(delivery.payload);
        const signature = crypto.createHmac("sha256", webhook.secret).update(`${timestamp}.${body}`).digest("hex");

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

        const responseBody = await res.text().catch(() => "");
        if (res.ok) {
          await admin.from("webhook_deliveries").update({
            success: true, status_code: res.status, next_retry_at: null,
            response_body: responseBody.slice(0, 1024),
          }).eq("id", delivery.id);
          return true;
        }
        return false;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) succeeded++;
      else failedCount++;
    }
  }

  // Only reduce failure count proportionally, don't fully reset
  if (succeeded > 0) {
    await admin.from("webhooks").update({
      last_status: succeeded > failedCount ? "success" : "failed",
    }).eq("id", id);
  }

  return NextResponse.json({ retried: failed.length, succeeded, failed: failedCount });
}
