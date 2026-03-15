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

/** GET /api/v1/audit-log — Cursor-based paginated audit log access */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Missing or invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys")
    .select("id, user_id, status").eq("key_hash", keyHash).single();

  if (!apiKey || apiKey.status !== "active")
    return apiError("invalid_api_key", "Invalid or revoked API key", ctx);

  const { data: sub } = await admin.from("subscriptions")
    .select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const rl = rateLimit(`${apiKey.user_id}:v1_audit`, 30, 60_000);
  if (!rl.success) return apiError("rate_limited", "Too many requests", ctx);

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50));
  const cursor = url.searchParams.get("cursor"); // ISO timestamp cursor
  const category = url.searchParams.get("category");
  const action = url.searchParams.get("action");
  const entityType = url.searchParams.get("entity_type");
  const entityId = url.searchParams.get("entity_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = admin.from("audit_logs")
    .select("id, action, entity_type, entity_id, category, details, ip_address, created_at, entry_hash")
    .eq("user_id", apiKey.user_id)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // Fetch one extra for next cursor

  if (cursor) query = query.lt("created_at", cursor);
  if (category) query = query.eq("category", category);
  if (action) query = query.eq("action", action);
  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: entries, error } = await query;

  if (error) return apiError("internal_error", "Failed to fetch audit logs", ctx);

  const results = entries || [];
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? page[page.length - 1]?.created_at : null;

  return apiSuccess({
    entries: page.map((e) => ({
      id: e.id,
      action: e.action,
      entity_type: e.entity_type,
      entity_id: e.entity_id,
      category: e.category,
      details: e.details,
      ip_address: e.ip_address,
      created_at: e.created_at,
      integrity_hash: e.entry_hash,
    })),
    has_more: hasMore,
    next_cursor: nextCursor,
  }, ctx);
}
