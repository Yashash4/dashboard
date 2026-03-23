import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/conversations — List user's conversations (offset-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "conversations", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    // Parse query params
    const url = new URL(request.url);
    const agent = url.searchParams.get("agent");
    const rawLimit = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    let query = admin
      .from("chat_conversations")
      .select("id, agent_id, created_at, updated_at, agents(name)", { count: "exact" })
      .eq("user_id", apiKey.user_id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agent) {
      // Filter by agent name — escape wildcards to prevent ilike injection
      const escapedAgent = agent.replace(/%/g, "\\%").replace(/_/g, "\\_");
      const { data: agentRows } = await admin
        .from("agents")
        .select("id, name")
        .ilike("name", `%${escapedAgent}%`);

      if (agentRows && agentRows.length > 0) {
        query = query.in("agent_id", agentRows.map((a) => a.id));
      } else {
        return apiSuccess({ conversations: [], has_more: false, next_cursor: null, total: 0 }, ctx, rateLimitInfo);
      }
    }

    const { data: conversations, error, count } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch conversations", ctx);
    }

    const results = conversations || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    const mapped = results.map((c: any) => ({
      id: c.id,
      agent_name: c.agents?.name || "Unknown",
      created_at: c.created_at,
      last_message_at: c.updated_at,
    }));

    return apiSuccess({
      conversations: mapped,
      has_more: hasMore,
      next_cursor: hasMore ? String(offset + results.length) : null,
      total,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
