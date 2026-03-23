import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/usage — API usage stats for the authenticated key */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "usage", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const url = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") || "7")));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: analytics, error } = await admin.from("agent_analytics")
      .select("metric_type, response_time_ms, created_at")
      .eq("api_key_id", apiKey.id)
      .gte("created_at", since)
      .lte("created_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return apiError("internal_error", "Failed to fetch usage data", ctx);
    }

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
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
