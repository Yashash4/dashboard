import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";

function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return null;
  return rawKey;
}

/** GET /api/v1/threads — List user's threads */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("id, user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid or revoked API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0") || 0);

  const { data: threads } = await admin.from("api_threads")
    .select("id, agent, metadata, created_at, updated_at")
    .eq("user_id", apiKey.user_id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return apiSuccess({ threads: threads || [] }, ctx);
}

/** POST /api/v1/threads — Create a new thread */
export async function POST(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("id, user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid or revoked API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const rl = rateLimit(`${apiKey.user_id}:thread_create`, 30, 60_000);
  if (!rl.success) return apiError("rate_limited", "Too many requests", ctx);

  const body = await request.json().catch(() => null);
  const agent = (body as any)?.agent || "default";
  const metadata = (body as any)?.metadata || {};

  const threadId = `thread_${crypto.randomUUID().replace(/-/g, "")}`;

  const { data: thread, error } = await admin.from("api_threads").insert({
    id: threadId,
    user_id: apiKey.user_id,
    agent,
    metadata,
  }).select("id, agent, metadata, created_at").single();

  if (error) return apiError("internal_error", "Failed to create thread", ctx);

  return apiSuccess({ thread }, ctx);
}
