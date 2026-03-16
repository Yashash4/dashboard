import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/predictions/:id — Poll async prediction status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "predictions", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const { data: prediction } = await admin.from("api_predictions")
      .select("id, status, response_body, processing_time_ms, created_at, completed_at")
      .eq("id", id).eq("user_id", apiKey.user_id).single();

    if (!prediction) return apiError("invalid_request", "Prediction not found", ctx);

    return apiSuccess({
      prediction_id: prediction.id,
      status: prediction.status,
      response: prediction.status === "completed" ? prediction.response_body : null,
      processing_time_ms: prediction.processing_time_ms,
      created_at: prediction.created_at,
      completed_at: prediction.completed_at,
    }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
