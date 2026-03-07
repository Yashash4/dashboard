import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { MissionControlOverview } from "@/components/mission-control/mission-control-overview";

export default async function MissionControlPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = (subscription?.plan as string) || "starter";

  if (!hasAccess(plan, "ultra")) {
    redirect("/billing?upgrade=ultra");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mission Control</h1>
      <p className="text-muted-foreground mb-6">
        Command center for your AI workforce.
      </p>
      <MissionControlOverview />
    </div>
  );
}
