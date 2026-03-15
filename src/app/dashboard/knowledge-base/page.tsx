import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { KBTabs } from "./kb-tabs";

export default async function KnowledgeBasePage() {
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
        <h1 className="text-2xl font-bold mb-1">Knowledge Base</h1>
        <p className="text-muted-foreground mb-6">
          Upload documents for your agents to reference.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Knowledge Base</h1>
      <p className="text-muted-foreground mb-6">
        Upload documents for your agents to reference.
      </p>
      <KBTabs />
    </div>
  );
}
