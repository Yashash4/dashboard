import { Brain } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { ModelConfig } from "@/components/dashboard/model-config";

export default async function ModelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let modelConfig: any = null;
  let availableModels: any[] | null = null;
  let subscription: any = null;

  try {
    const [modelRes, modelsListRes, subRes] = await Promise.all([
      supabase
        .from("models")
        .select(
          "current_model, requested_model, change_effective_date, context_limit, changes_this_month, last_change_at"
        )
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("available_models")
        .select("name, display_name, context_limit, description")
        .eq("is_available", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("subscriptions")
        .select("plan, expires_at")
        .eq("user_id", user.id)
        .single(),
    ]);
    modelConfig = modelRes.data;
    availableModels = modelsListRes.data;
    subscription = subRes.data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your data. Please refresh the page.</p>
      </div>
    );
  }

  // Lazy reset: if billing cycle renewed since last change, reset counter
  if (modelConfig?.last_change_at && subscription?.expires_at) {
    const lastChange = new Date(modelConfig.last_change_at);
    const expiresAt = new Date(subscription.expires_at);
    const cycleStart = new Date(expiresAt);
    cycleStart.setMonth(cycleStart.getMonth() - 1);

    if (lastChange < cycleStart) {
      modelConfig.changes_this_month = 0;
    }
  }

  if (!modelConfig || !subscription) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Models</h1>
        <p className="text-muted-foreground mb-6">Configure your AI model.</p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Model Configured</h2>
              <p className="text-muted-foreground">
                Your AI model will be configured once your subscription is active.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Models</h1>
      <p className="text-muted-foreground mb-6">Configure your AI model.</p>
      <ModelConfig
        modelConfig={modelConfig}
        availableModels={availableModels || []}
        plan={subscription.plan}
        billingDate={subscription.expires_at}
      />
    </div>
  );
}
