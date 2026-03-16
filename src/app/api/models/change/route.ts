import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { configureApiKeys } from "@/lib/ssh";
import { decryptField } from "@/lib/credential-utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:model_change`, 3, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { model } = body as { model?: string };

  if (!model) {
    return NextResponse.json(
      { error: "Model name is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Validate the model exists and is available
  const { data: availableModel } = await admin
    .from("available_models")
    .select("name, display_name, context_limit")
    .eq("name", model)
    .eq("is_available", true)
    .single();

  if (!availableModel) {
    return NextResponse.json(
      { error: "Model not available" },
      { status: 400 }
    );
  }

  // Get user's current model config
  const { data: modelConfig } = await admin
    .from("models")
    .select("id, current_model, changes_this_month, last_change_at")
    .eq("user_id", user.id)
    .single();

  if (!modelConfig) {
    return NextResponse.json(
      { error: "Model config not found" },
      { status: 404 }
    );
  }

  // Can't switch to the same model
  if (modelConfig.current_model === model) {
    return NextResponse.json(
      { error: "Already using this model" },
      { status: 400 }
    );
  }

  // Get subscription to check plan + billing date
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan, expires_at, started_at")
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  // Lazy reset: if billing cycle renewed since last change, reset counter
  if (modelConfig.last_change_at && subscription.expires_at) {
    const lastChange = new Date(modelConfig.last_change_at);
    const expiresAt = new Date(subscription.expires_at);
    // Calculate current cycle start (expires_at minus one billing period)
    const cycleStart = new Date(expiresAt);
    cycleStart.setMonth(cycleStart.getMonth() - 1);

    if (lastChange < cycleStart) {
      await admin
        .from("models")
        .update({ changes_this_month: 0 })
        .eq("id", modelConfig.id);
      modelConfig.changes_this_month = 0;
    }
  }

  // Check change limit based on plan
  const isStarter = subscription.plan === "starter";
  const maxChanges = isStarter ? 5 : Infinity;
  if ((modelConfig.changes_this_month || 0) >= maxChanges) {
    return NextResponse.json(
      {
        error:
          subscription.plan === "starter"
            ? "You've used all 5 model changes for this billing cycle. Upgrade to Pro for unlimited changes."
            : "Change limit reached",
      },
      { status: 400 }
    );
  }

  // For starter plan: change takes effect at next billing cycle
  // For pro plan: instant change (future)
  const isInstant = subscription.plan !== "starter";
  const effectiveDate = isInstant ? new Date() : subscription.expires_at;

  if (isInstant) {
    // Instant: atomically claim a change slot to prevent race conditions
    let updateQuery = admin
      .from("models")
      .update({
        current_model: model,
        context_limit: availableModel.context_limit,
        requested_model: null,
        change_effective_date: null,
        changes_this_month: (modelConfig.changes_this_month || 0) + 1,
        last_change_at: new Date().toISOString(),
      })
      .eq("id", modelConfig.id);

    // Only enforce limit for starter plans (pro/ultra are unlimited)
    if (isStarter) {
      updateQuery = updateQuery.lt("changes_this_month", maxChanges);
    }

    const { data: claimed } = await updateQuery.select("id");

    if (!claimed?.length) {
      return NextResponse.json(
        {
          error: "You've used all 5 model changes for this billing cycle. Upgrade to Pro for unlimited changes.",
        },
        { status: 400 }
      );
    }

    // Push config to VPS so the model change actually takes effect
    try {
      const { data: vps } = await admin
        .from("vps_instances")
        .select("ip_address, ssh_user, ssh_password, ssh_port, hostname, status")
        .eq("user_id", user.id)
        .single();

      if (vps && vps.status === "running") {
        const { data: apiKeys } = await admin
          .from("user_api_keys")
          .select("provider, api_key, base_url")
          .eq("user_id", user.id);

        if (apiKeys?.length) {
          await configureApiKeys(
            {
              ip_address: vps.ip_address,
              ssh_user: vps.ssh_user,
              ssh_password: decryptField(vps.ssh_password),
              ssh_port: vps.ssh_port,
            },
            apiKeys.map((k) => ({
              provider: k.provider,
              apiKey: k.api_key,
              baseUrl: k.base_url,
            })),
            {
              hostname: vps.hostname,
              email: user.email || "",
              appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.clawhq.tech",
              modelName: model,
              contextLimit: availableModel.context_limit,
            }
          );
        } else {
          // No API keys configured — model updated in DB but can't push to VPS
          return NextResponse.json({
            success: true,
            model: availableModel.display_name,
            effective_date: effectiveDate,
            instant: isInstant,
            warning: "Model updated in settings but no API keys are configured. Configure API keys to apply the change to your VPS.",
          });
        }
      }
    } catch {
      // SSH push failed but DB is updated — return warning so frontend can inform user
      return NextResponse.json({
        success: true,
        model: availableModel.display_name,
        effective_date: effectiveDate,
        instant: isInstant,
        warning: "Model updated in settings but may take a moment to apply. If the change doesn't take effect, try restarting your VPS.",
      });
    }
  } else {
    // Scheduled: atomically claim a change slot
    let scheduledQuery = admin
      .from("models")
      .update({
        requested_model: model,
        change_effective_date: effectiveDate,
        changes_this_month: (modelConfig.changes_this_month || 0) + 1,
        last_change_at: new Date().toISOString(),
      })
      .eq("id", modelConfig.id);

    if (isStarter) {
      scheduledQuery = scheduledQuery.lt("changes_this_month", maxChanges);
    }

    const { data: claimed } = await scheduledQuery.select("id");

    if (!claimed?.length) {
      return NextResponse.json(
        {
          error: "You've used all 5 model changes for this billing cycle. Upgrade to Pro for unlimited changes.",
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    model: availableModel.display_name,
    effective_date: effectiveDate,
    instant: isInstant,
  });
}

// Cancel a pending model change
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:model_cancel`, 3, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();

  const { data: modelConfig } = await admin
    .from("models")
    .select("id, requested_model, changes_this_month")
    .eq("user_id", user.id)
    .single();

  if (!modelConfig || !modelConfig.requested_model) {
    return NextResponse.json(
      { error: "No pending change to cancel" },
      { status: 400 }
    );
  }

  // Cancel the pending change and give back the change credit
  await admin
    .from("models")
    .update({
      requested_model: null,
      change_effective_date: null,
      changes_this_month: Math.max(
        (modelConfig.changes_this_month || 1) - 1,
        0
      ),
    })
    .eq("id", modelConfig.id);

  return NextResponse.json({ success: true });
}
