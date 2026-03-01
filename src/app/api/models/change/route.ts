import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
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
    .select("id, current_model, changes_this_month")
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
    .select("plan, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  // Check change limit based on plan
  const maxChanges = subscription.plan === "starter" ? 1 : 999;
  if ((modelConfig.changes_this_month || 0) >= maxChanges) {
    return NextResponse.json(
      {
        error:
          subscription.plan === "starter"
            ? "You've used your model change for this month. Upgrade to Pro for unlimited changes."
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
    // Instant: update current model directly
    await admin
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
  } else {
    // Scheduled: set as pending change
    await admin
      .from("models")
      .update({
        requested_model: model,
        change_effective_date: effectiveDate,
        changes_this_month: (modelConfig.changes_this_month || 0) + 1,
        last_change_at: new Date().toISOString(),
      })
      .eq("id", modelConfig.id);
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
