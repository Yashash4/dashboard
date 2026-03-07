import { createAdminClient } from "@/lib/supabase-admin";

interface AuditParams {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string | null;
}

export async function logAudit(params: AuditParams) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      admin_id: params.adminId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || null,
      ip_address: params.ip || null,
    });
  } catch (err) {
    // Non-blocking — never let audit logging break the main action
    console.error("[audit-log] Failed to log:", err);
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
