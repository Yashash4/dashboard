import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";

/** GET /api/v1/usage — API usage stats for the authenticated key */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return apiError("invalid_api_key", "Missing Authorization header", ctx);
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return apiError("invalid_api_key", "Invalid API key format", ctx);
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();

  const { data: apiKey } = await admin.from("api_keys")
    .select("id, user_id, name, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") {
    return apiError("invalid_api_key", "Invalid or revoked API key", ctx);
  }

  const { data: sub } = await admin.from("subscriptions")
    .select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter")) {
    return apiError("plan_required", "API access requires Pro plan or higher", ctx);
  }

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") || "7")));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics } = await admin.from("agent_analytics")
    .select("metric_type, response_time_ms, created_at")
    .eq("api_key_id", apiKey.id)
    .gte("created_at", since);

  // Group by date
  const daily: Record<string, { requests: number; errors: number; total_time: number }> = {};
  for (const row of analytics || []) {
    const date = row.created_at.slice(0, 10);
    if (!daily[date]) daily[date] = { requests: 0, errors: 0, total_time: 0 };
    daily[date].requests++;
    if (row.metric_type === "error") daily[date].errors++;
    daily[date].total_time += row.response_time_ms || 0;
  }

  const usage = Object.entries(daily)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, stats]) => ({
      date,
      requests: stats.requests,
      errors: stats.errors,
      avg_response_time_ms: stats.requests > 0 ? Math.round(stats.total_time / stats.requests) : 0,
    }));

  const totalRequests = usage.reduce((s, u) => s + u.requests, 0);
  const totalErrors = usage.reduce((s, u) => s + u.errors, 0);
  const totalTime = (analytics || []).reduce((s, r) => s + (r.response_time_ms || 0), 0);

  return apiSuccess({
    key_name: apiKey.name,
    period: `${days}d`,
    usage,
    totals: {
      total_requests: totalRequests,
      total_errors: totalErrors,
      avg_response_time_ms: totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0,
    },
  }, ctx);
}
