import { createClient } from "@/lib/supabase-server";
import { hasAccess, type Plan } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

interface PlanGateProps {
  children: React.ReactNode;
  requiredPlan: Plan;
}

export async function PlanGate({ children, requiredPlan }: PlanGateProps) {
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

  if (!hasAccess(plan, requiredPlan)) {
    return <UpgradePrompt requiredPlan={requiredPlan} />;
  }

  return <>{children}</>;
}
