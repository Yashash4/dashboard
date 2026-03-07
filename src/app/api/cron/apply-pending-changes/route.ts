import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { configureApiKeys } from "@/lib/ssh";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max for SSH operations

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find all pending model changes that are due
  const { data: pendingChanges, error } = await admin
    .from("models")
    .select("id, user_id, requested_model, current_model, context_limit")
    .not("requested_model", "is", null)
    .lte("change_effective_date", new Date().toISOString());

  if (error || !pendingChanges?.length) {
    return NextResponse.json({
      processed: 0,
      message: error ? error.message : "No pending changes",
    });
  }

  const results: { userId: string; model: string; status: string }[] = [];

  for (const change of pendingChanges) {
    try {
      // Get the new model's details
      const { data: modelInfo } = await admin
        .from("available_models")
        .select("name, context_limit, provider")
        .eq("name", change.requested_model)
        .eq("is_available", true)
        .single();

      if (!modelInfo) {
        results.push({
          userId: change.user_id,
          model: change.requested_model,
          status: "skipped: model no longer available",
        });
        // Clear the pending change since the model doesn't exist
        await admin
          .from("models")
          .update({ requested_model: null, change_effective_date: null })
          .eq("id", change.id);
        continue;
      }

      // Get user's VPS credentials
      const { data: vps } = await admin
        .from("vps_instances")
        .select("ip_address, ssh_user, ssh_password, ssh_port, hostname, status")
        .eq("user_id", change.user_id)
        .eq("status", "active")
        .single();

      if (!vps) {
        results.push({
          userId: change.user_id,
          model: change.requested_model,
          status: "skipped: no active VPS",
        });
        continue;
      }

      // Get user's API keys
      const { data: apiKeys } = await admin
        .from("user_api_keys")
        .select("provider, api_key, base_url")
        .eq("user_id", change.user_id);

      if (!apiKeys?.length) {
        results.push({
          userId: change.user_id,
          model: change.requested_model,
          status: "skipped: no API keys configured",
        });
        continue;
      }

      // Get user email for gateway config
      const { data: userProfile } = await admin
        .from("users")
        .select("email")
        .eq("id", change.user_id)
        .single();

      // Push new model config to VPS via SSH
      const sshResult = await configureApiKeys(
        {
          ip_address: vps.ip_address,
          ssh_user: vps.ssh_user,
          ssh_password: vps.ssh_password,
          ssh_port: vps.ssh_port,
        },
        apiKeys.map((k) => ({
          provider: k.provider,
          apiKey: k.api_key,
          baseUrl: k.base_url,
        })),
        {
          hostname: vps.hostname,
          email: userProfile?.email || "",
          appUrl: "https://app.clawhq.tech",
          modelName: change.requested_model,
          contextLimit: modelInfo.context_limit,
        }
      );

      if (!sshResult.success) {
        results.push({
          userId: change.user_id,
          model: change.requested_model,
          status: `failed: ${sshResult.error}`,
        });
        continue;
      }

      // SSH succeeded — update DB: apply the model change
      await admin
        .from("models")
        .update({
          current_model: change.requested_model,
          context_limit: modelInfo.context_limit,
          requested_model: null,
          change_effective_date: null,
        })
        .eq("id", change.id);

      results.push({
        userId: change.user_id,
        model: change.requested_model,
        status: "applied",
      });
    } catch (err: any) {
      console.error(
        `[cron/apply-pending] Error for user ${change.user_id}:`,
        err.message
      );
      results.push({
        userId: change.user_id,
        model: change.requested_model,
        status: `error: ${err.message}`,
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
