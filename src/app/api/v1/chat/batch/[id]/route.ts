import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/chat/batch/:id — Poll batch status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "batch_status", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const { data: batch } = await admin.from("api_batches")
      .select("id, status, total, completed, failed, results, created_at, completed_at")
      .eq("id", id).eq("user_id", apiKey.user_id).single();

    if (!batch) return apiError("not_found", "Batch not found", ctx);

    return apiSuccess({ batch }, ctx, auth.rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
