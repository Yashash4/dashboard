import { createAdminClient } from "@/lib/supabase-admin";

interface AuditParams {
  adminId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  category?: string;
  actorType?: "user" | "admin" | "system";
  details?: Record<string, unknown>;
  ip?: string | null;
}

export async function logAudit(params: AuditParams) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      admin_id: params.adminId || null,
      user_id: params.userId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      category: params.category || params.entityType,
      actor_type: params.actorType || (params.adminId ? "admin" : "user"),
      details: params.details || null,
      ip_address: params.ip || null,
    });
  } catch {
    // Non-blocking — never let audit logging break the main action
  }
}

export function getClientIp(request: Request): string | null {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}
