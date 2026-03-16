import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { decryptField } from "@/lib/credential-utils";
import { isPrivateUrl } from "@/lib/knowledge-base";
import { validateV1Auth } from "@/lib/v1-auth";

const MAX_BODY_SIZE = 102_400; // 100 KB

/** POST /api/v1/chat/batch — Submit batch of chat requests */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "batch", { limit: 5 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    // Body size check
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return apiError("invalid_request", "Request body too large (max 100KB)", ctx);
    }
    const rawBody = await request.text().catch(() => "");
    if (rawBody.length > MAX_BODY_SIZE) {
      return apiError("invalid_request", "Request body too large (max 100KB)", ctx);
    }
    const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    if (!body) return apiError("invalid_request", "Invalid JSON body", ctx);

    const { requests: batchRequests, webhook_url } = body as {
      requests?: { custom_id: string; message: string; agent?: string }[];
      webhook_url?: string;
    };

    if (!batchRequests || !Array.isArray(batchRequests) || batchRequests.length === 0)
      return apiError("missing_parameter", "requests array is required", ctx, { param: "requests" });

    if (batchRequests.length > 50)
      return apiError("batch_too_large", "Maximum 50 requests per batch", ctx);

    // SSRF protection: validate webhook_url is not a private/internal IP
    if (webhook_url) {
      if (isPrivateUrl(webhook_url)) {
        return apiError("invalid_parameter", "webhook_url must not point to a private or internal address", ctx, { param: "webhook_url" });
      }
    }

    // Check rate limit capacity
    const rpm = apiKey.rate_limit_per_min || 60;
    if (batchRequests.length > rpm)
      return apiError("rate_limited", `Batch size (${batchRequests.length}) exceeds your rate limit (${rpm} RPM)`, ctx);

    const batchId = `batch_${crypto.randomUUID().replace(/-/g, "")}`;

    const { error } = await admin.from("api_batches").insert({
      id: batchId,
      user_id: apiKey.user_id,
      status: "processing",
      total: batchRequests.length,
      results: batchRequests.map((r) => ({ custom_id: r.custom_id, status: "pending", message: r.message, agent: r.agent })),
      webhook_url: webhook_url || null,
    });

    if (error) return apiError("internal_error", "Failed to create batch", ctx);

    // Process in background (fire-and-forget)
    processBatch(admin, batchId, apiKey.user_id, batchRequests).catch(() => {});

    return apiSuccess({
      batch_id: batchId,
      status: "processing",
      total: batchRequests.length,
      completed: 0,
      failed: 0,
      created_at: new Date().toISOString(),
    }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

async function processBatch(
  admin: ReturnType<typeof createAdminClient>,
  batchId: string,
  userId: string,
  requests: { custom_id: string; message: string; agent?: string }[]
) {
  const { data: vps } = await admin.from("vps_instances")
    .select("hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status")
    .eq("user_id", userId).single();

  if (!vps || vps.status !== "running") {
    await admin.from("api_batches").update({ status: "failed" }).eq("id", batchId);
    return;
  }

  const dashboardUrl = vps.openclaw_dashboard_url || (vps.hostname ? `https://${vps.hostname}` : null);
  if (!dashboardUrl) return;

  const baseUrl = dashboardUrl.replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (vps.dashboard_username && vps.dashboard_password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`).toString("base64")}`;
  }

  const results: any[] = [];
  let completed = 0;
  let failed = 0;

  // Process 3 at a time
  for (let i = 0; i < requests.length; i += 3) {
    const batch = requests.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(async (req) => {
        try {
          const agentSlug = (req.agent || "default").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60000);

          const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: `openclaw:${agentSlug}`,
              messages: [{ role: "user", content: req.message }],
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) throw new Error("upstream_error");

          const data = await res.json();
          let content = data.choices?.[0]?.message?.content || "";
          content = content
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, "")
            .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
            .replace(/<inner_monologue>[\s\S]*?<\/inner_monologue>/gi, "")
            .trim() || "No response";

          return { custom_id: req.custom_id, status: "completed", response: content };
        } catch (err) {
          // Sanitize: never leak upstream error details to the client
          const isTimeout = err instanceof Error && err.name === "AbortError";
          return {
            custom_id: req.custom_id,
            status: "failed",
            error: isTimeout ? "Request timed out" : "Failed to get response from agent",
          };
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        results.push(r.value);
        if (r.value.status === "completed") completed++;
        else failed++;
      } else {
        results.push({ custom_id: "unknown", status: "failed", error: "Processing error" });
        failed++;
      }
    }

    // Update progress
    await admin.from("api_batches").update({ completed, failed, results }).eq("id", batchId);
  }

  const finalStatus = failed === results.length ? "failed" : failed > 0 ? "partial" : "completed";
  const completedAt = new Date().toISOString();
  await admin.from("api_batches").update({
    status: finalStatus,
    completed,
    failed,
    results,
    completed_at: completedAt,
  }).eq("id", batchId);

  // Fire webhook callback if configured
  const { data: batchRecord } = await admin.from("api_batches")
    .select("webhook_url")
    .eq("id", batchId)
    .single();

  if (batchRecord?.webhook_url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      await fetch(batchRecord.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          status: finalStatus,
          total: results.length,
          completed,
          failed,
          results,
          completed_at: completedAt,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      // Webhook delivery is best-effort — don't fail the batch for it
    }
  }
}
