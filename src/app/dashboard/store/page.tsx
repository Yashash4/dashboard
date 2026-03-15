import { createClient } from "@/lib/supabase-server";
import { AgentStore } from "@/components/dashboard/agent-store";

export default async function StorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  let agents: any[] | null = null;
  let userAgents: any[] | null = null;

  try {
    const [agentsRes, userAgentsRes] = await Promise.all([
      supabase
        .from("agents")
        .select("id, name, description, category, price, is_premium")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("user_agents")
        .select("agent_id")
        .eq("user_id", user.id),
    ]);
    if (agentsRes.error) throw agentsRes.error;
    agents = agentsRes.data;
    userAgents = userAgentsRes.data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load the store. Please refresh the page.</p>
      </div>
    );
  }

  const ownedAgentIds = (userAgents || []).map((ua: any) => ua.agent_id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Agent Store</h1>
      <p className="text-muted-foreground mb-6">
        Browse and add agents to your library.
      </p>
      <AgentStore agents={agents || []} ownedAgentIds={ownedAgentIds} />
    </div>
  );
}
