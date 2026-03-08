import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Fire-and-forget: dispatch webhooks for a user's event.
 * Queries enabled webhooks subscribed to the event, sends POST with HMAC signature.
 * Updates last_triggered_at, last_status, last_status_code, failure_count.
 */
export async function dispatchWebhooks(
  userId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  const { data: webhooks } = await admin
    .from("webhooks")
    .select("id, url, secret")
    .eq("user_id", userId)
    .eq("enabled", true)
    .contains("events", [event]);

  if (!webhooks || webhooks.length === 0) return;

  const timestamp = new Date().toISOString();
  const payload: WebhookPayload = { event, data, timestamp };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    webhooks.map((wh) => deliverWebhook(admin, wh.id, wh.url, wh.secret, event, body, timestamp))
  );
}

async function deliverWebhook(
  admin: ReturnType<typeof createAdminClient>,
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  body: string,
  timestamp: string
): Promise<void> {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClawHQ-Signature": signature,
        "X-ClawHQ-Event": event,
        "X-ClawHQ-Timestamp": timestamp,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    await admin
      .from("webhooks")
      .update({
        last_triggered_at: timestamp,
        last_status: res.ok ? "success" : "failed",
        last_status_code: res.status,
        failure_count: res.ok ? 0 : undefined,
      })
      .eq("id", webhookId);

    if (!res.ok) {
      // Increment failure count
      await admin.rpc("increment_webhook_failure", { p_webhook_id: webhookId });
    }
  } catch {
    await admin
      .from("webhooks")
      .update({
        last_triggered_at: timestamp,
        last_status: "failed",
        last_status_code: 0,
      })
      .eq("id", webhookId);

    await admin.rpc("increment_webhook_failure", { p_webhook_id: webhookId });
  }
}
