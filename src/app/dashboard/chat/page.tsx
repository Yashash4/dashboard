import { Bot } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentChat } from "@/components/dashboard/agent-chat";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get deployed agents
  const { data: userAgents } = await supabase
    .from("user_agents")
    .select("agent_id, agents(id, name, description)")
    .eq("user_id", user.id)
    .eq("deployed", true);

  const agents = (userAgents || [])
    .map((ua: any) => ua.agents)
    .filter(Boolean);

  if (agents.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Agent Chat</h1>
        <p className="text-muted-foreground mb-6">
          Chat with your deployed agents.
        </p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No agents deployed</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Deploy an agent first to start chatting.
              </p>
              <Button variant="outline" asChild>
                <Link href="/agents">Go to Agents</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <AgentChat agents={agents} />
    </div>
  );
}
