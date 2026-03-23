import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/threads/:id — Get thread details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "threads", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const { data: thread } = await admin.from("api_threads")
      .select("id, agent, metadata, created_at, updated_at")
      .eq("id", id).eq("user_id", apiKey.user_id).single();

    if (!thread) return apiError("thread_not_found", "Thread not found", ctx);

    return apiSuccess({ thread }, ctx, auth.rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

/** DELETE /api/v1/threads/:id — Delete thread and messages */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "threads_delete", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const { data: deleted } = await admin.from("api_threads").delete().eq("id", id).eq("user_id", apiKey.user_id).select("id").single();
    if (!deleted) return apiError("thread_not_found", "Thread not found", ctx);

    return apiSuccess({ deleted: true }, ctx, auth.rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
