import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { createRequestContext, apiError, type RequestContext } from "@/lib/api-errors";

export interface V1AuthResult {
  user: { id: string };
  apiKey: {
    id: string;
    user_id: string;
    status: string;
    rate_limit_per_min: number;
    usage_count?: number;
    name?: string;
  };
  plan: string;
  admin: ReturnType<typeof createAdminClient>;
  ctx: RequestContext;
}

/**
 * Shared V1 API auth middleware.
 *
 * 1. Extract Bearer token from Authorization header
 * 2. Hash the token (SHA-256)
 * 3. Look up in `api_keys` table by key_hash
 * 4. Check key is active
 * 5. Check user's subscription plan (pro / ultra / enterprise)
 * 6. Apply rate limit based on key's `rate_limit_per_min`
 * 7. Return `{ user, apiKey, plan, admin, ctx }` on success, or a NextResponse error
 *
 * @param request  The incoming request
 * @param rateLimitTag  Optional suffix for the rate-limit bucket (e.g. "chat", "health").
 *                      Defaults to using `apikey:<id>` with the key's own RPM.
 * @param rateLimitOverride  Optional `{ limit, windowMs }` to override the per-key rate limit.
 */
export async function validateV1Auth(
  request: Request,
  rateLimitTag?: string,
  rateLimitOverride?: { limit: number; windowMs?: number }
): Promise<V1AuthResult | NextResponse> {
  const ctx = createRequestContext(request);

  // 1. Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiError("invalid_api_key", "Missing Authorization: Bearer <api_key> header", ctx);
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return apiError("invalid_api_key", "Invalid API key format", ctx);
  }

  // 2. Hash the token
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  // 3. Look up in api_keys
  const admin = createAdminClient();
  const { data: apiKey, error: keyError } = await admin
    .from("api_keys")
    .select("id, user_id, name, status, rate_limit_per_min, usage_count")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !apiKey) {
    return apiError("invalid_api_key", "Invalid API key", ctx);
  }

  // 4. Check key is active
  if (apiKey.status !== "active") {
    return apiError("revoked_api_key", "API key has been revoked", ctx);
  }

  // 5. Check subscription plan
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", apiKey.user_id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!["pro", "ultra", "enterprise"].includes(plan)) {
    return apiError("plan_required", "API access requires a Pro plan or higher", ctx);
  }

  // 6. Rate limit
  if (rateLimitOverride) {
    const rl = rateLimit(
      `${apiKey.user_id}:${rateLimitTag || "v1"}`,
      rateLimitOverride.limit,
      rateLimitOverride.windowMs ?? 60_000
    );
    if (!rl.success) {
      return apiError("rate_limited", "Rate limit exceeded. Try again later.", ctx);
    }
  } else {
    const rpm = apiKey.rate_limit_per_min || 60;
    const identifier = rateLimitTag
      ? `${apiKey.user_id}:${rateLimitTag}`
      : `apikey:${apiKey.id}`;
    const rl = rateLimit(identifier, rpm, 60_000);
    if (!rl.success) {
      return apiError("rate_limited", "Rate limit exceeded. Try again later.", ctx);
    }
  }

  // 7. Return auth result
  return {
    user: { id: apiKey.user_id },
    apiKey,
    plan,
    admin,
    ctx,
  };
}
