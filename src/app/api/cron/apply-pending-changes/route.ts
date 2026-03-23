import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { configureApiKeys } from "@/lib/ssh";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max for SSH operations

// ST_MED_01: Maximum retry attempts before giving up on a failed change
const MAX_RETRY_ATTEMPTS = 3;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find all pending model changes that are due
  // ST_MED_01: Only fetch changes that haven't exceeded max retries
  const { data: pendingChanges, error } = await admin
    .from("models")
    .select("id, user_id, requested_model, current_model, context_limit, retry_count")
    .not("requested_model", "is", null)
    .lte("change_effective_date", new Date().toISOString());

  if (error || !pendingChanges?.length) {
    return NextResponse.json({
      processed: 0,
      message: error ? error.message : "No pending changes",
    });
  }

  const results: { idx: number; model: string; status: string }[] = [];

  for (const change of pendingChanges) {
    // ST_MED_01: Skip changes that have exceeded max retry attempts
    const retryCount = (change as any).retry_count || 0;
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      results.push({
        idx: results.length + 1,
        model: change.requested_model,
        status: `abandoned: exceeded ${MAX_RETRY_ATTEMPTS} retries`,
      });
      // Clear the pending change so it stops being retried
      await admin
        .from("models")
        .update({ requested_model: null, change_effective_date: null })
        .eq("id", change.id);
      continue;
    }

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
          idx: results.length + 1,
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
        .eq("status", "running")
        .single();

      if (!vps) {
        results.push({
          idx: results.length + 1,
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
          idx: results.length + 1,
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

      // ST_CRIT_02: Null check before decrypting ssh_password
      if (!vps.ssh_password) {
        results.push({
          idx: results.length + 1,
          model: change.requested_model,
          status: "skipped: VPS credentials not available",
        });
        continue;
      }

      // Push new model config to VPS via SSH
      const sshResult = await configureApiKeys(
        {
          ip_address: vps.ip_address,
          ssh_user: vps.ssh_user,
          ssh_password: decryptField(vps.ssh_password),
          ssh_port: vps.ssh_port,
        },
        apiKeys.map((k) => ({
          provider: k.provider,
          apiKey: decryptField(k.api_key),
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
        // ST_MED_01: Increment retry count on failure
        await admin
          .from("models")
          .update({ retry_count: retryCount + 1 })
          .eq("id", change.id);
        results.push({
          idx: results.length + 1,
          model: change.requested_model,
          // ST_MED_11: Sanitize SSH error details — don't leak internal info
          status: `failed: SSH configuration error (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
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
          retry_count: 0,
        })
        .eq("id", change.id);

      results.push({
        idx: results.length + 1,
        model: change.requested_model,
        status: "applied",
      });
    } catch (err: any) {
      // ST_MED_01: Increment retry count on error
      await admin
        .from("models")
        .update({ retry_count: retryCount + 1 })
        .eq("id", change.id)
        .catch(() => {}); // Don't let retry tracking failure crash the loop
      // ST_MED_11: Sanitize error — log internally, return generic message
      console.error(`[cron/apply-pending-changes] Error for model ${change.id}:`, err.message);
      results.push({
        idx: results.length + 1,
        model: change.requested_model,
        status: `error: processing failed (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
