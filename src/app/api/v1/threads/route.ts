import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/threads — List user's threads (cursor-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "threads", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));
    const cursor = url.searchParams.get("cursor"); // ISO timestamp cursor

    let query = admin.from("api_threads")
      .select("id, agent, metadata, created_at, updated_at")
      .eq("user_id", apiKey.user_id)
      .order("updated_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("updated_at", cursor);
    }

    const { data: threads, error } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch threads", ctx);
    }

    const results = threads || [];
    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? page[page.length - 1]?.updated_at : null;

    return apiSuccess({ threads: page, has_more: hasMore, next_cursor: nextCursor }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

/** POST /api/v1/threads — Create a new thread */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "thread_create", { limit: 30 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const body = await request.json().catch(() => null);
    const agent = (body as any)?.agent || "default";
    const metadata = (body as any)?.metadata || {};

    const threadId = `thread_${crypto.randomUUID().replace(/-/g, "")}`;

    const { data: thread, error } = await admin.from("api_threads").insert({
      id: threadId,
      user_id: apiKey.user_id,
      agent,
      metadata,
    }).select("id, agent, metadata, created_at").single();

    if (error) return apiError("internal_error", "Failed to create thread", ctx);

    return apiSuccess({ thread }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
