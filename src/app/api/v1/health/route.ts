import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/health — Validate API key without sending a message */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "health", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, plan, admin, ctx } = auth;

    // Get deployed agents for the user
    const { data: userAgents } = await admin
      .from("user_agents")
      .select("agents(name)")
      .eq("user_id", apiKey.user_id)
      .eq("deployed", true);

    const agents = (userAgents || []).map((ua: any) => ua.agents?.name || "unknown");

    return apiSuccess({
      status: "ok",
      plan,
      key_name: apiKey.name,
      rate_limit: apiKey.rate_limit_per_min || 60,
      agents,
    }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
