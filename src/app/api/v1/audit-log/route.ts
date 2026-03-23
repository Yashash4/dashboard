import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/audit-log — Offset-based paginated audit log access */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "v1_audit", { limit: 30 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get("limit") || "50", 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(100, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
    const category = url.searchParams.get("category");
    const action = url.searchParams.get("action");
    const entityType = url.searchParams.get("entity_type");
    const entityId = url.searchParams.get("entity_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let query = admin.from("audit_logs")
      .select("id, action, entity_type, entity_id, category, details, ip_address, created_at, entry_hash", { count: "exact" })
      .eq("user_id", apiKey.user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (action) query = query.eq("action", action);
    if (entityType) query = query.eq("entity_type", entityType);
    if (entityId) query = query.eq("entity_id", entityId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data: entries, error, count } = await query;

    if (error) return apiError("internal_error", "Failed to fetch audit logs", ctx);

    const results = entries || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    return apiSuccess({
      entries: results.map((e) => ({
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
      total,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
