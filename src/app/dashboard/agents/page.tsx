import Link from "next/link";
import { Bot, ShoppingBag } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentManager } from "@/components/dashboard/agent-manager";
import { AgentAnalytics } from "@/components/dashboard/agent-analytics";

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
        "id, agent_id, deployed, deployed_at, purchased_at, custom_config, agents(id, name, description, category, config_files)"
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
              <p className="text-muted-foreground mb-4">
                Browse the store to find and add agents.
              </p>
              <Button variant="outline" asChild>
                <Link href="/store">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse Store
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/store">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Browse Store
          </Link>
        </Button>
      </div>
      <AgentManager
        userAgents={normalizedAgents}
        plan={subscription?.plan || "starter"}
      />

      {/* Usage Analytics */}
      <div className="mt-8">
        <AgentAnalytics
          agents={normalizedAgents
            .filter((ua) => ua.agents)
            .map((ua) => ({
              agent_id: ua.agent_id,
              name: ua.agents?.name || "Unknown",
            }))}
        />
      </div>
    </div>
  );
}
