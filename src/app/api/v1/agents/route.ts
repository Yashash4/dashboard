import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/agents — List deployed agents (offset-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "agents", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    let query = admin.from("user_agents")
      .select("agent_id, deployed, deployed_at, primary_model, fallback_model, agents(name, description)", { count: "exact" })
      .eq("user_id", apiKey.user_id)
      .eq("deployed", true)
      .order("deployed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: userAgents, error, count } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch agents", ctx);
    }

    const results = userAgents || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    const agents = results.map((ua: any) => ({
      id: ua.agent_id,
      name: ua.agents?.name || "Unknown",
      slug: (ua.agents?.name || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
      description: ua.agents?.description || null,
      status: "deployed",
      model: {
        primary: ua.primary_model || "default",
        fallback: ua.fallback_model || null,
      },
      deployed_at: ua.deployed_at,
    }));

    return apiSuccess({ agents, has_more: hasMore, total }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
