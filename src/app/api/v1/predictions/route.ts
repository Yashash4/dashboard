import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** POST /api/v1/predictions — Create an async prediction */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "predictions", { limit: 10 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const body = await request.json().catch(() => null);
    if (!body) return apiError("invalid_request", "Invalid JSON body", ctx);

    const { input, model } = body as { input?: string; model?: string };
    if (!input || typeof input !== "string" || input.length === 0 || input.length > 10000) {
      return apiError("invalid_parameter", "input must be a non-empty string, max 10000 characters", ctx, { param: "input" });
    }

    const predictionId = `pred_${crypto.randomUUID().replace(/-/g, "")}`;

    const { data: prediction, error } = await admin.from("api_predictions").insert({
      id: predictionId,
      user_id: apiKey.user_id,
      status: "pending",
      input_body: { input, model: model || "default" },
      response_body: null,
      processing_time_ms: null,
    }).select("id, status, created_at").single();

    if (error) return apiError("internal_error", "Failed to create prediction", ctx);

    return apiSuccess({
      prediction_id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
