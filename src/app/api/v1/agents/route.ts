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

/** GET /api/v1/agents — List deployed agents */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid or revoked API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const { data: userAgents } = await admin.from("user_agents")
    .select("agent_id, deployed, deployed_at, primary_model, fallback_model, agents(name, description)")
    .eq("user_id", apiKey.user_id)
    .eq("deployed", true);

  const agents = (userAgents || []).map((ua: any) => ({
    id: ua.agent_id,
    name: ua.agents?.name || "Unknown",
    slug: (ua.agents?.name || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
    description: ua.agents?.description || null,
    status: "deployed",
    model: {
      primary: ua.primary_model || "default",
      fallback: ua.fallback_model || null,
    },
    deployed_at: ua.deployed_at,
  }));

  return apiSuccess({ agents }, ctx);
}
