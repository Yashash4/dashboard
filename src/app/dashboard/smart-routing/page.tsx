import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { SmartRoutingManager } from "@/components/dashboard/smart-routing-manager";

export default async function SmartRoutingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = (subscription?.plan as string) || "starter";

  if (!hasAccess(plan, "pro")) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Smart Routing</h1>
        <p className="text-muted-foreground mb-6">
          Route conversations to the right agent based on intent and sentiment.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Smart Routing</h1>
      <p className="text-muted-foreground mb-6">
        Route conversations to the right agent based on intent and sentiment.
      </p>
      <SmartRoutingManager />
    </div>
  );
}
