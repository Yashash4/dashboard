import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { ApiAccessManager } from "@/components/dashboard/api-access-manager";

export default async function ApiAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: subscription }, { data: vps }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("vps_instances")
      .select("hostname")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = (subscription?.plan as string) || "starter";

  if (!hasAccess(plan, "pro")) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">API Access</h1>
        <p className="text-muted-foreground mb-6">
          Direct API access to your OpenClaw instance.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">API Access</h1>
      <p className="text-muted-foreground mb-6">
        Direct API access to your OpenClaw instance.
      </p>
      <ApiAccessManager hostname={vps?.hostname || null} />
    </div>
  );
}
