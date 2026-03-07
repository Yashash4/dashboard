import { createClient } from "@/lib/supabase-server";
import { AgentStore } from "@/components/dashboard/agent-store";

export default async function StorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: agents }, { data: userAgents }] = await Promise.all([
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
