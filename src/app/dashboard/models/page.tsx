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

  const [{ data: modelConfig }, { data: availableModels }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("models")
        .select(
          "current_model, requested_model, change_effective_date, context_limit, changes_this_month"
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
