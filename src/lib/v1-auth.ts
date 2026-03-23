import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimitAsync, getRateLimitStatus, type RateLimitInfo } from "@/lib/rate-limit";
import { createRequestContext, apiError, type RequestContext } from "@/lib/api-errors";

export type { RateLimitInfo };

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
  rateLimitInfo: RateLimitInfo;
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
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    const rawKey = authHeader?.slice(7).trim() || "";
    const keyPrefix = rawKey.slice(0, 8) || "(missing)";
    console.warn(`[v1-auth] Auth failure — missing/invalid header — IP: ${ip}, key_prefix: ${keyPrefix}, path: ${new URL(request.url).pathname}`);
    return apiError("invalid_api_key", "Missing Authorization: Bearer <api_key> header", ctx);
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    console.warn(`[v1-auth] Auth failure — invalid key format — IP: ${ip}, key_prefix: ${rawKey.slice(0, 8)}, path: ${new URL(request.url).pathname}`);
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
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    console.warn(`[v1-auth] Auth failure — key not found — IP: ${ip}, key_hash: ${keyHash.slice(0, 16)}..., path: ${new URL(request.url).pathname}`);
    return apiError("invalid_api_key", "Invalid API key", ctx);
  }

  // 4. Check key is active
  if (apiKey.status !== "active") {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    console.warn(`[v1-auth] Auth failure — revoked key — IP: ${ip}, user_id: ${apiKey.user_id}, key_id: ${apiKey.id}, path: ${new URL(request.url).pathname}`);
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
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    console.warn(`[v1-auth] Auth failure — insufficient plan — IP: ${ip}, user_id: ${apiKey.user_id}, plan: ${plan}, path: ${new URL(request.url).pathname}`);
    return apiError("plan_required", "API access requires a Pro plan or higher", ctx);
  }

  // 6. Rate limit (durable — backed by Supabase)
  let rateLimitInfo: RateLimitInfo;
  if (rateLimitOverride) {
    const windowMs = rateLimitOverride.windowMs ?? 60_000;
    const identifier = `${apiKey.user_id}:${rateLimitTag || "v1"}`;
    const rl = await rateLimitAsync(identifier, rateLimitOverride.limit, windowMs);
    if (!rl.success) {
      const { reset } = getRateLimitStatus(identifier, rateLimitOverride.limit, windowMs);
      const retryAfterSeconds = Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 1000));
      return apiError("rate_limited", "Rate limit exceeded. Try again later.", ctx, { retryAfterSeconds });
    }
    const { remaining, reset } = getRateLimitStatus(identifier, rateLimitOverride.limit, windowMs);
    rateLimitInfo = { limit: rateLimitOverride.limit, remaining, reset };
  } else {
    const rpm = apiKey.rate_limit_per_min || 60;
    const identifier = rateLimitTag
      ? `${apiKey.user_id}:${rateLimitTag}`
      : `apikey:${apiKey.id}`;
    const rl = await rateLimitAsync(identifier, rpm, 60_000);
    if (!rl.success) {
      const { reset } = getRateLimitStatus(identifier, rpm, 60_000);
      const retryAfterSeconds = Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 1000));
      return apiError("rate_limited", "Rate limit exceeded. Try again later.", ctx, { retryAfterSeconds });
    }
    const { remaining, reset } = getRateLimitStatus(identifier, rpm, 60_000);
    rateLimitInfo = { limit: rpm, remaining, reset };
  }

  // 7. Return auth result
  return {
    user: { id: apiKey.user_id },
    apiKey,
    plan,
    admin,
    ctx,
    rateLimitInfo,
  };
}
