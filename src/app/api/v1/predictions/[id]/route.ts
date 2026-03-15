import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";

/** GET /api/v1/predictions/:id — Poll async prediction status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return apiError("invalid_api_key", "Invalid API key", ctx);
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

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
}
