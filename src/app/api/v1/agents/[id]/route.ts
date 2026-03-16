import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { decryptField } from "@/lib/credential-utils";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/agents/:id — Get agent details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "agents_detail", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

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
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

/** DELETE /api/v1/agents/:id — Undeploy agent */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "agents_delete", { limit: 10 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    // Look up the agent
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
          { ip_address: vps.ip_address, ssh_user: vps.ssh_user, ssh_password: decryptField(vps.ssh_password), ssh_port: vps.ssh_port },
          (userAgent as any).agents?.name || id
        );
      } catch {
        // SSH failure — still mark as undeployed in DB
      }
    }

    await admin.from("user_agents").update({ deployed: false, deployed_at: null }).eq("id", userAgent.id);

    return apiSuccess({ undeployed: true }, ctx);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
