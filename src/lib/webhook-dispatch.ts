import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { isPrivateUrl } from "@/lib/knowledge-base";

const MAX_FAILURES = 10;

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface WebhookRow {
  id: string;
  url: string;
  secret: string;
  failure_count: number;
  filter_conditions: any;
  transformation: string | null;
  paused_at: string | null;
  retry_max_attempts: number | null;
  retry_interval_seconds: number | null;
}

/**
 * Evaluate filter conditions against event payload.
 * Returns true if the event passes all filters (or no filters set).
 */
function evaluateFilters(
  filters: any,
  event: string,
  data: Record<string, unknown>
): boolean {
  if (!filters || !Array.isArray(filters) || filters.length === 0) return true;

  for (const filter of filters) {
    const { field, operator, value } = filter;
    if (!field || !operator) continue;

    // Resolve field value from event/data
    let fieldValue: unknown;
    if (field === "event_type") {
      fieldValue = event;
    } else if (field.startsWith("payload.")) {
      const key = field.slice(8);
      fieldValue = data[key];
    } else {
      fieldValue = data[field];
    }

    const strFieldValue = String(fieldValue ?? "").toLowerCase();
    const strValue = String(value ?? "").toLowerCase();

    switch (operator) {
      case "equals":
        if (strFieldValue !== strValue) return false;
        break;
      case "not_equals":
        if (strFieldValue === strValue) return false;
        break;
      case "contains":
        if (!strFieldValue.includes(strValue)) return false;
        break;
      case "in":
        if (Array.isArray(value)) {
          if (!value.map((v: string) => v.toLowerCase()).includes(strFieldValue)) return false;
        }
        break;
    }
  }

  return true;
}

/**
 * Apply user-defined payload transformation using safe template substitution.
 * NO code execution — only string templates with {{event.field}} placeholders.
 * Returns transformed payload or original on error.
 */
function applyTransformation(
  transformation: string,
  payload: WebhookPayload
): string {
  try {
    // Parse transformation as a JSON template with {{placeholders}}
    let result = transformation;
    // Replace {{event}} with actual values
    result = result.replace(/\{\{event\.type\}\}/g, payload.event);
    result = result.replace(/\{\{event\.timestamp\}\}/g, payload.timestamp);
    // Replace {{data.fieldname}} with data values
    result = result.replace(/\{\{data\.(\w+)\}\}/g, (_, key) => {
      const val = payload.data[key];
      return val !== undefined ? String(val) : "";
    });
    // Try parsing as JSON to validate
    const parsed = JSON.parse(result);
    return JSON.stringify(parsed);
  } catch {
    // Transformation failed — use original payload
    return JSON.stringify(payload);
  }
}

/**
 * Fire-and-forget: dispatch webhooks for a user's event.
 * Supports: filtering, pausing, transformations, per-webhook retry policy.
 */
export async function dispatchWebhooks(
  userId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  const { data: webhooks } = await admin
    .from("webhooks")
    .select("id, url, secret, failure_count, filter_conditions, transformation, paused_at, retry_max_attempts, retry_interval_seconds")
    .eq("user_id", userId)
    .eq("enabled", true)
    .contains("events", [event]);

  if (!webhooks || webhooks.length === 0) return;

  const timestamp = new Date().toISOString();
  const payload: WebhookPayload = { event, data, timestamp };

  const deliverable = (webhooks as WebhookRow[]).filter((wh) => {
    if (isPrivateUrl(wh.url)) return false;
    if ((wh.failure_count || 0) >= MAX_FAILURES) {
      admin.from("webhooks").update({ enabled: false }).eq("id", wh.id)
        .then(() => {}, () => {});
      return false;
    }
    return true;
  });

  if (deliverable.length === 0) return;

  await Promise.allSettled(
    deliverable.map((wh) => {
      // 6.6 Pause check
      if (wh.paused_at) {
        // Log as paused delivery
        admin.from("webhook_deliveries").insert({
          webhook_id: wh.id,
          user_id: userId,
          event_type: event,
          payload: payload as unknown as Record<string, unknown>,
          status_code: null,
          response_body: "Delivery paused",
          latency_ms: 0,
          success: false,
        }).then(() => {}, () => {});
        return Promise.resolve();
      }

      // 6.3 Filter check
      if (!evaluateFilters(wh.filter_conditions, event, data)) {
        admin.from("webhook_deliveries").insert({
          webhook_id: wh.id,
          user_id: userId,
          event_type: event,
          payload: payload as unknown as Record<string, unknown>,
          status_code: null,
          response_body: "Filtered — conditions not met",
          latency_ms: 0,
          success: true,
        }).then(() => {}, () => {});
        return Promise.resolve();
      }

      // 6.5 Apply transformation
      const body = wh.transformation
        ? applyTransformation(wh.transformation, payload)
        : JSON.stringify(payload);

      const retryInterval = (wh.retry_interval_seconds || 30) * 1000;

      return deliverWebhook(admin, userId, wh.id, wh.url, wh.secret, event, body, payload, timestamp, retryInterval);
    })
  );
}

async function deliverWebhook(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  body: string,
  payload: WebhookPayload,
  timestamp: string,
  retryIntervalMs: number = 30_000
): Promise<void> {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  const startMs = Date.now();

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

    const latencyMs = Date.now() - startMs;
    const responseBody = await res.text().catch(() => "");

    const deliveryRow: Record<string, unknown> = {
      webhook_id: webhookId,
      user_id: userId,
      event_type: event,
      payload: payload as unknown as Record<string, unknown>,
      status_code: res.status,
      response_body: responseBody.slice(0, 1024),
      latency_ms: latencyMs,
      success: res.ok,
    };
    if (!res.ok) {
      deliveryRow.next_retry_at = new Date(Date.now() + retryIntervalMs).toISOString();
    }
    admin.from("webhook_deliveries").insert(deliveryRow)
      .then(() => {}, (e) => console.warn("[webhook] delivery log failed:", e?.message));

    if (res.ok) {
      await admin.from("webhooks").update({
        last_triggered_at: timestamp,
        last_status: "success",
        last_status_code: res.status,
        failure_count: 0,
      }).eq("id", webhookId);
    } else {
      await admin.rpc("increment_webhook_failure", { p_webhook_id: webhookId });
      await admin.from("webhooks").update({
        last_triggered_at: timestamp,
        last_status: "failed",
        last_status_code: res.status,
      }).eq("id", webhookId);
    }
  } catch {
    const latencyMs = Date.now() - startMs;

    admin.from("webhook_deliveries").insert({
      webhook_id: webhookId,
      user_id: userId,
      event_type: event,
      payload: payload as unknown as Record<string, unknown>,
      status_code: 0,
      response_body: "Connection failed or timed out",
      latency_ms: latencyMs,
      success: false,
      next_retry_at: new Date(Date.now() + retryIntervalMs).toISOString(),
    }).then(() => {}, (e) => console.warn("[webhook] delivery log failed:", e?.message));

    await admin.from("webhooks").update({
      last_triggered_at: timestamp,
      last_status: "failed",
      last_status_code: 0,
    }).eq("id", webhookId);

    await admin.rpc("increment_webhook_failure", { p_webhook_id: webhookId });
  }
}
