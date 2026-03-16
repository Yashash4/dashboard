import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/agents — List deployed agents (cursor-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "agents", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));
    const cursor = url.searchParams.get("cursor"); // ISO timestamp cursor (deployed_at)

    let query = admin.from("user_agents")
      .select("agent_id, deployed, deployed_at, primary_model, fallback_model, agents(name, description)")
      .eq("user_id", apiKey.user_id)
      .eq("deployed", true)
      .order("deployed_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("deployed_at", cursor);
    }

    const { data: userAgents, error } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch agents", ctx);
    }

    const results = userAgents || [];
    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? (page[page.length - 1] as any)?.deployed_at : null;

    const agents = page.map((ua: any) => ({
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

    return apiSuccess({ agents, has_more: hasMore, next_cursor: nextCursor }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
