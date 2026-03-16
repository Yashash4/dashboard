import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isPrivateUrl } from "@/lib/knowledge-base";

const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [30_000, 120_000, 900_000]; // 30s, 2min, 15min

/** GET /api/cron/webhook-retry — Process pending webhook retries */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find failed deliveries that need retry
  const { data: pending, error } = await admin
    .from("webhook_deliveries")
    .select("id, webhook_id, user_id, event_type, payload")
    .eq("success", false)
    .lt("retry_count", MAX_RETRIES)
    .not("next_retry_at", "is", null)
    .lte("next_retry_at", new Date().toISOString())
    .limit(20);

  if (error || !pending || pending.length === 0) {
    return NextResponse.json({ retried: 0 });
  }

  let retriedCount = 0;

  for (const delivery of pending) {
    // Get webhook details
    const { data: webhook } = await admin
      .from("webhooks")
      .select("url, secret, enabled")
      .eq("id", delivery.webhook_id)
      .single();

    if (!webhook || !webhook.enabled || isPrivateUrl(webhook.url)) {
      // Clear retry — webhook deleted, disabled, or URL changed to private
      await admin
        .from("webhook_deliveries")
        .update({ next_retry_at: null })
        .eq("id", delivery.id);
      continue;
    }

    const timestamp = new Date().toISOString();
    const body = JSON.stringify(delivery.payload);
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

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
      const currentRetry = (delivery as any).retry_count || 0;
      const newRetryCount = currentRetry + 1;

      if (res.ok) {
        // Success — clear retry, update delivery
        await admin
          .from("webhook_deliveries")
          .update({
            success: true,
            status_code: res.status,
            response_body: responseBody.slice(0, 1024),
            latency_ms: latencyMs,
            retry_count: newRetryCount,
            next_retry_at: null,
          })
          .eq("id", delivery.id);

        // Reset webhook failure count on successful retry
        await admin
          .from("webhooks")
          .update({
            last_status: "success",
            last_status_code: res.status,
            failure_count: 0,
          })
          .eq("id", delivery.webhook_id);
      } else {
        // Still failing — schedule next retry or give up
        const nextRetryAt = newRetryCount < MAX_RETRIES
          ? new Date(Date.now() + BACKOFF_DELAYS[newRetryCount]).toISOString()
          : null;

        await admin
          .from("webhook_deliveries")
          .update({
            status_code: res.status,
            response_body: responseBody.slice(0, 1024),
            latency_ms: latencyMs,
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt,
          })
          .eq("id", delivery.id);
      }

      retriedCount++;
    } catch {
      const latencyMs = Date.now() - startMs;
      const currentRetry = (delivery as any).retry_count || 0;
      const newRetryCount = currentRetry + 1;
      const nextRetryAt = newRetryCount < MAX_RETRIES
        ? new Date(Date.now() + BACKOFF_DELAYS[newRetryCount]).toISOString()
        : null;

      await admin
        .from("webhook_deliveries")
        .update({
          status_code: 0,
          response_body: "Connection failed or timed out",
          latency_ms: latencyMs,
          retry_count: newRetryCount,
          next_retry_at: nextRetryAt,
        })
        .eq("id", delivery.id);

      retriedCount++;
    }
  }

  return NextResponse.json({ retried: retriedCount });
}
