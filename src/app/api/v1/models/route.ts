import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/models — List available AI models */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "models", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { admin, ctx } = auth;

    const { data: models, error, count } = await admin.from("available_models")
      .select("name, display_name, context_limit, description", { count: "exact" })
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return apiError("internal_error", "Failed to fetch models", ctx);
    }

    const results = models || [];
    const total = count ?? results.length;

    return apiSuccess({
      models: results.map((m) => ({
        id: m.name,
        name: m.display_name,
        context_window: m.context_limit,
        description: m.description,
      })),
      has_more: false,
      total,
    }, ctx, auth.rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
