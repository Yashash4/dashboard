import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/conversations/:id/messages — Get messages for a conversation (offset-based pagination) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "conversation_messages", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    // Verify conversation belongs to user
    const { data: conversation } = await admin
      .from("chat_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", apiKey.user_id)
      .single();

    if (!conversation) {
      return apiError("not_found", "Conversation not found", ctx);
    }

    // Parse query params — offset-based pagination
    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get("limit") || "50", 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(200, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    let query = admin
      .from("chat_messages")
      .select("id, role, content, created_at", { count: "exact" })
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch messages", ctx);
    }

    const results = messages || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    return apiSuccess({
      messages: results.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
      has_more: hasMore,
      total,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
