import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";

function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return null;
  return rawKey;
}

/** POST /api/v1/chat/batch — Submit batch of chat requests */
export async function POST(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("id, user_id, status, rate_limit_per_min").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid or revoked API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const rl = rateLimit(`${apiKey.user_id}:batch`, 5, 60_000);
  if (!rl.success) return apiError("rate_limited", "Too many requests", ctx);

  const body = await request.json().catch(() => null);
  if (!body) return apiError("invalid_request", "Invalid JSON body", ctx);

  const { requests: batchRequests, webhook_url } = body as {
    requests?: { custom_id: string; message: string; agent?: string }[];
    webhook_url?: string;
  };

  if (!batchRequests || !Array.isArray(batchRequests) || batchRequests.length === 0)
    return apiError("missing_parameter", "requests array is required", ctx, { param: "requests" });

  if (batchRequests.length > 50)
    return apiError("batch_too_large", "Maximum 50 requests per batch", ctx);

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
    headers["Authorization"] = `Basic ${Buffer.from(`${vps.dashboard_username}:${vps.dashboard_password}`).toString("base64")}`;
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

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          let content = data.choices?.[0]?.message?.content || "";
          content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim() || "No response";

          return { custom_id: req.custom_id, status: "completed", response: content };
        } catch (err) {
          return { custom_id: req.custom_id, status: "failed", error: err instanceof Error ? err.message : "Unknown error" };
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
  await admin.from("api_batches").update({
    status: finalStatus,
    completed,
    failed,
    results,
    completed_at: new Date().toISOString(),
  }).eq("id", batchId);
}
