import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { WebhooksManager } from "@/components/dashboard/webhooks-manager";

export default async function WebhooksPage() {
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
        <h1 className="text-2xl font-bold mb-1">Webhooks</h1>
        <p className="text-muted-foreground mb-6">
          Get notified when events happen in your instance.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Webhooks</h1>
      <p className="text-muted-foreground mb-6">
        Get notified when events happen in your instance.
      </p>
      <WebhooksManager />
    </div>
  );
}
