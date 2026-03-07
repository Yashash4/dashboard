import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { AgentRoster } from "@/components/mission-control/agent-roster";

export default async function AgentRosterPage() {
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

  if (!hasAccess(subscription?.plan || "starter", "ultra")) {
    redirect("/billing?upgrade=ultra");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Agent Roster</h1>
      <p className="text-muted-foreground mb-6">
        Real-time status and performance of your AI agents.
      </p>
      <AgentRoster />
    </div>
  );
}
