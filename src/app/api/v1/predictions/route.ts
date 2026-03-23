import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** POST /api/v1/predictions — Create an async prediction
 *
 * NOTE: Predictions processing pipeline is not yet implemented.
 * Returns a clear error indicating the feature is unavailable.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "predictions", { limit: 10 });
    if (auth instanceof NextResponse) return auth;
    const { ctx } = auth;

    return apiError(
      "invalid_request",
      "The predictions API is not yet available. Use /v1/chat for synchronous completions or /v1/chat/batch for batch processing.",
      ctx
    );
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
