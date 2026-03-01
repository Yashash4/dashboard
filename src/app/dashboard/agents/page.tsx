import { Bot } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { AgentManager } from "@/components/dashboard/agent-manager";

export default async function AgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: userAgents }, { data: subscription }] = await Promise.all([
    supabase
      .from("user_agents")
      .select(
        "id, agent_id, deployed, deployed_at, purchased_at, agents(id, name, description, category)"
      )
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
  ]);

  // Supabase returns joined relation as array — flatten to single object
  const normalizedAgents = userAgents?.map((ua) => ({
    ...ua,
    agents: Array.isArray(ua.agents) ? ua.agents[0] : ua.agents,
  }));

  if (!normalizedAgents || normalizedAgents.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Agents</h1>
        <p className="text-muted-foreground mb-6">Manage your AI agents.</p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Agents Yet</h2>
              <p className="text-muted-foreground">
                Your purchased agents will appear here once you add them to your
                plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Agents</h1>
      <p className="text-muted-foreground mb-6">Manage your AI agents.</p>
      <AgentManager
        userAgents={normalizedAgents}
        plan={subscription?.plan || "starter"}
      />
    </div>
  );
}
