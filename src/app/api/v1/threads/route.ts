import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/threads — List user's threads (offset-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "threads", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    let query = admin.from("api_threads")
      .select("id, agent, metadata, created_at, updated_at", { count: "exact" })
      .eq("user_id", apiKey.user_id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: threads, error, count } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch threads", ctx);
    }

    const results = threads || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    return apiSuccess({ threads: results, has_more: hasMore, total }, ctx, rateLimitInfo);
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
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const body = await request.json().catch(() => null);
    const agent = (body as any)?.agent || "default";
    const metadata = (body as any)?.metadata || {};

    // Validate metadata size and depth
    const MAX_METADATA_SIZE = 4000; // characters when stringified
    const MAX_METADATA_DEPTH = 5;
    const metadataStr = JSON.stringify(metadata);
    if (metadataStr.length > MAX_METADATA_SIZE) {
      return apiError("invalid_parameter", `metadata exceeds maximum size of ${MAX_METADATA_SIZE} characters`, ctx, { param: "metadata" });
    }
    function getDepth(obj: unknown, depth = 1): number {
      if (typeof obj !== "object" || obj === null) return depth;
      for (const val of Object.values(obj)) {
        const childDepth = getDepth(val, depth + 1);
        if (childDepth > MAX_METADATA_DEPTH) return childDepth;
      }
      return depth;
    }
    if (getDepth(metadata) > MAX_METADATA_DEPTH) {
      return apiError("invalid_parameter", `metadata exceeds maximum depth of ${MAX_METADATA_DEPTH} levels`, ctx, { param: "metadata" });
    }

    const threadId = `thread_${crypto.randomUUID().replace(/-/g, "")}`;

    const { data: thread, error } = await admin.from("api_threads").insert({
      id: threadId,
      user_id: apiKey.user_id,
      agent,
      metadata,
    }).select("id, agent, metadata, created_at").single();

    if (error) return apiError("internal_error", "Failed to create thread", ctx);

    return apiSuccess({ thread }, ctx, auth.rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
