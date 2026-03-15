import { createAdminClient } from "@/lib/supabase-admin";
import { vpsDataFetch, hasVPSDataAPI } from "@/lib/vps-data-api";

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
    // Try VPS Data API first for user audit logs
    if (params.userId && await hasVPSDataAPI(params.userId)) {
      await vpsDataFetch(params.userId, "/api/audit-log", {
        method: "POST",
        body: {
          action: params.action,
          category: params.category || params.entityType,
          entity_type: params.entityType,
          entity_id: params.entityId || null,
          actor_type: params.actorType || (params.adminId ? "admin" : "user"),
          details: params.details || null,
          ip_address: params.ip || null,
        },
      });
      return;
    }

    // Fallback to Supabase
    const admin = createAdminClient();
    const auditEntry = {
      admin_id: params.adminId || null,
      user_id: params.userId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      category: params.category || params.entityType,
      actor_type: params.actorType || (params.adminId ? "admin" : "user"),
      details: params.details || null,
      ip_address: params.ip || null,
    };
    await admin.from("audit_logs").insert(auditEntry);

    // Stream to SIEM destinations (non-blocking, fire-and-forget)
    if (params.userId) {
      streamToSIEM(params.userId, auditEntry).catch(() => {});
    }
  } catch (err) {
    // Non-blocking — never let audit logging break the main action
    console.warn("[audit] logAudit failed:", err instanceof Error ? err.message : "unknown");
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

/**
 * Format an audit entry as CEF (Common Event Format) for SIEM integration.
 * CEF: CEF:0|Vendor|Product|Version|EventId|Name|Severity|Extensions
 */
function formatAsCEF(entry: Record<string, unknown>): string {
  const severity = 3; // Low-Medium for audit events
  const extensions = [
    `src=${entry.ip_address || "unknown"}`,
    `suser=${entry.user_id || "system"}`,
    `act=${entry.action}`,
    `cat=${entry.category || entry.entity_type}`,
    `cs1=${entry.entity_type}`,
    `cs2=${entry.entity_id || ""}`,
  ].join(" ");

  return `CEF:0|ClawHQ|Dashboard|1.0|${entry.action}|${entry.action}|${severity}|${extensions}`;
}

/**
 * Stream an audit entry to all configured SIEM destinations for a user.
 * Non-blocking — failures are silently ignored.
 */
async function streamToSIEM(
  userId: string,
  entry: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  const { data: configs } = await admin
    .from("siem_configs")
    .select("id, destination_type, destination_url, api_key, format")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (!configs || configs.length === 0) return;

  const timestamp = new Date().toISOString();
  const payload = { ...entry, timestamp };

  const deliveries = configs.map(async (config) => {
    try {
      const body =
        config.format === "cef"
          ? formatAsCEF(payload)
          : JSON.stringify(payload);

      const headers: Record<string, string> = {
        "Content-Type":
          config.format === "cef" ? "text/plain" : "application/json",
      };

      // Add auth headers based on destination type
      if (config.api_key) {
        switch (config.destination_type) {
          case "datadog":
            headers["DD-API-KEY"] = config.api_key;
            break;
          case "splunk":
            headers["Authorization"] = `Splunk ${config.api_key}`;
            break;
          default:
            headers["Authorization"] = `Bearer ${config.api_key}`;
            break;
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(config.destination_url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
    } catch {
      // Silent failure — SIEM delivery should never impact audit logging
    }
  });

  await Promise.allSettled(deliveries);
}
