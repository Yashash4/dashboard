import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/conversations/:id/messages — Get messages for a conversation (cursor-based pagination) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "conversation_messages", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    // Verify conversation belongs to user
    const { data: conversation } = await admin
      .from("chat_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", apiKey.user_id)
      .single();

    if (!conversation) {
      return apiError("invalid_request", "Conversation not found", ctx);
    }

    // Parse query params — cursor-based pagination
    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50), 200);
    const cursor = url.searchParams.get("cursor"); // ISO timestamp cursor

    let query = admin
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch messages", ctx);
    }

    const results = messages || [];
    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? page[page.length - 1]?.created_at : null;

    return apiSuccess({
      messages: page.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
      has_more: hasMore,
      next_cursor: nextCursor,
    }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
