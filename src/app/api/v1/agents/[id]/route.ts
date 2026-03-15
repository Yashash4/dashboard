import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";

function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return null;
  return rawKey;
}

/** GET /api/v1/agents/:id — Get agent details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const { data: userAgent } = await admin.from("user_agents")
    .select("agent_id, deployed, deployed_at, primary_model, fallback_model, custom_config, agents(name, description)")
    .eq("user_id", apiKey.user_id)
    .eq("agent_id", id)
    .single();

  if (!userAgent) return apiError("agent_not_found", "Agent not found", ctx);

  return apiSuccess({
    agent: {
      id: userAgent.agent_id,
      name: (userAgent as any).agents?.name || "Unknown",
      description: (userAgent as any).agents?.description || null,
      status: userAgent.deployed ? "deployed" : "not_deployed",
      model: {
        primary: userAgent.primary_model || "default",
        fallback: userAgent.fallback_model || null,
      },
      deployed_at: userAgent.deployed_at,
    },
  }, ctx);
}

/** DELETE /api/v1/agents/:id — Undeploy agent */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  // Call the undeploy route internally
  const { data: userAgent } = await admin.from("user_agents")
    .select("id, deployed, agent_id, agents(name)").eq("user_id", apiKey.user_id).eq("agent_id", id).single();

  if (!userAgent) return apiError("agent_not_found", "Agent not found", ctx);
  if (!userAgent.deployed) return apiError("invalid_request", "Agent is not deployed", ctx);

  // Get VPS credentials and undeploy via SSH
  const { data: vps } = await admin.from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", apiKey.user_id).single();

  if (vps && vps.status === "running") {
    try {
      const { undeployAgent } = await import("@/lib/ssh");
      await undeployAgent(
        { ip_address: vps.ip_address, ssh_user: vps.ssh_user, ssh_password: vps.ssh_password, ssh_port: vps.ssh_port },
        (userAgent as any).agents?.name || id
      );
    } catch {
      // SSH failure — still mark as undeployed in DB
    }
  }

  await admin.from("user_agents").update({ deployed: false, deployed_at: null }).eq("id", userAgent.id);

  return apiSuccess({ undeployed: true }, ctx);
}
