import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/conversations — List user's conversations (cursor-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "conversations", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    // Parse query params
    const url = new URL(request.url);
    const agent = url.searchParams.get("agent");
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20), 100);
    const cursor = url.searchParams.get("cursor"); // ISO timestamp cursor

    let query = admin
      .from("chat_conversations")
      .select("id, agent_id, created_at, updated_at, agents(name)")
      .eq("user_id", apiKey.user_id)
      .order("updated_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra for next cursor

    if (cursor) {
      query = query.lt("updated_at", cursor);
    }

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
        return apiSuccess({ conversations: [], has_more: false, next_cursor: null }, ctx);
      }
    }

    const { data: conversations, error } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch conversations", ctx);
    }

    const results = conversations || [];
    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? page[page.length - 1]?.updated_at : null;

    const mapped = page.map((c: any) => ({
      id: c.id,
      agent_name: c.agents?.name || "Unknown",
      created_at: c.created_at,
      last_message_at: c.updated_at,
    }));

    return apiSuccess({ conversations: mapped, has_more: hasMore, next_cursor: nextCursor }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
