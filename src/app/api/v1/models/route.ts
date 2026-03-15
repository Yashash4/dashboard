import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";

/** GET /api/v1/models — List available AI models */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return apiError("invalid_api_key", "Missing Authorization: Bearer <api_key> header", ctx);
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return apiError("invalid_api_key", "Invalid API key format", ctx);
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();

  const { data: apiKey } = await admin.from("api_keys")
    .select("id, user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") {
    return apiError("invalid_api_key", "Invalid or revoked API key", ctx);
  }

  const { data: sub } = await admin.from("subscriptions")
    .select("plan").eq("user_id", apiKey.user_id).single();
  const plan = (sub?.plan as string) || "starter";
  if (!["pro", "ultra", "enterprise"].includes(plan)) {
    return apiError("plan_required", "API access requires a Pro plan or higher", ctx);
  }

  const { data: models } = await admin.from("available_models")
    .select("name, display_name, context_limit, description")
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  return apiSuccess({
    models: (models || []).map((m) => ({
      id: m.name,
      name: m.display_name,
      context_window: m.context_limit,
      description: m.description,
    })),
  }, ctx);
}
