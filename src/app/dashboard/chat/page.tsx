import { AlertTriangle, Bot } from "lucide-react";
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

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  type ChatAgent = { id: string; name: string; description: string | null };
  let userAgents: {
    agent_id: string;
    agents: ChatAgent | ChatAgent[] | null;
  }[] | null = null;
  let vps: { status: string } | null = null;

  try {
    const [agentsRes, vpsRes] = await Promise.all([
      supabase
        .from("user_agents")
        .select("agent_id, agents(id, name, description)")
        .eq("user_id", user.id)
        .eq("deployed", true),
      supabase
        .from("vps_instances")
        .select("status")
        .eq("user_id", user.id)
        .single(),
    ]);
    userAgents = agentsRes.data;
    vps = vpsRes.data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your data. Please refresh the page.</p>
      </div>
    );
  }

  const vpsWarning = !vps || vps.status !== "running";

  const agents = (userAgents || [])
    .map((ua) => {
      const a = ua.agents;
      return Array.isArray(a) ? a[0] : a;
    })
    .filter((a): a is ChatAgent => a != null);

  if (agents.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Agent Chat</h1>
        <p className="text-muted-foreground mb-6">
          Chat with your deployed agents.
        </p>
        {vpsWarning && (
          <div className="mb-4 flex items-center gap-2 rounded-none border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-500">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Your server is not running. <Link href="/vps" className="underline font-medium">Start it</Link> to chat with agents.</span>
          </div>
        )}
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
    <div className="absolute inset-0 flex flex-col">
      {vpsWarning && (
        <div className="m-6 mb-0 flex items-center gap-2 rounded-none border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Your server is not running. <Link href="/vps" className="underline font-medium">Start it</Link> to chat with agents.</span>
        </div>
      )}
      <AgentChat agents={agents} />
    </div>
  );
}
