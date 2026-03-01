"use client";

import { useState } from "react";
import {
  Bot,
  Rocket,
  Check,
  Loader2,
  Power,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AgentInfo {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface UserAgent {
  id: string;
  agent_id: string;
  deployed: boolean;
  deployed_at: string | null;
  purchased_at: string;
  agents: AgentInfo;
}

export function AgentManager({
  userAgents: initialAgents,
  plan,
}: {
  userAgents: UserAgent[];
  plan: string;
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<{
    agentId: string;
    agentName: string;
    action: "deploy" | "undeploy";
  } | null>(null);

  const deployedCount = agents.filter((a) => a.deployed).length;

  const handleAction = async () => {
    if (!dialogAction) return;
    const { agentId, action } = dialogAction;
    setLoadingAgent(agentId);
    setDialogAction(null);

    try {
      const res = await fetch(`/api/agents/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || `Failed to ${action} agent`);
        return;
      }

      setAgents((prev) =>
        prev.map((a) =>
          a.agent_id === agentId
            ? {
                ...a,
                deployed: action === "deploy",
                deployed_at:
                  action === "deploy" ? new Date().toISOString() : null,
              }
            : a
        )
      );

      toast.success(
        action === "deploy"
          ? `${agents.find((a) => a.agent_id === agentId)?.agents.name} deployed successfully`
          : `Agent removed from your instance`
      );
    } catch {
      toast.error(`Failed to ${action} agent`);
    } finally {
      setLoadingAgent(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">My Agents</CardTitle>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Total: <strong className="text-foreground">{agents.length}</strong>
            </span>
            <span>&middot;</span>
            <span>
              Deployed:{" "}
              <strong className="text-foreground">{deployedCount}</strong>
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((ua) => {
          const agent = ua.agents;
          const isLoading = loadingAgent === ua.agent_id;

          return (
            <Card
              key={ua.id}
              className={`border-border transition-colors ${
                ua.deployed
                  ? "border-green-600/30 bg-green-600/5"
                  : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-base">{agent.name}</h3>
                  {ua.deployed ? (
                    <Badge className="bg-green-600 text-white border-green-600 text-xs">
                      <Check className="mr-1 h-3 w-3" />
                      Deployed
                    </Badge>
                  ) : (
                    <Badge className="bg-secondary text-secondary-foreground border-secondary text-xs">
                      Not Deployed
                    </Badge>
                  )}
                </div>

                {agent.category && (
                  <div className="flex items-center gap-1 mb-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {agent.category}
                    </span>
                  </div>
                )}

                {agent.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {agent.description}
                  </p>
                )}

                {ua.deployed && ua.deployed_at && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Deployed{" "}
                    {new Date(ua.deployed_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}

                {ua.deployed ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() =>
                      setDialogAction({
                        agentId: ua.agent_id,
                        agentName: agent.name,
                        action: "undeploy",
                      })
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-3 w-3" />
                    )}
                    Undeploy
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() =>
                      setDialogAction({
                        agentId: ua.agent_id,
                        agentName: agent.name,
                        action: "deploy",
                      })
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Rocket className="mr-2 h-3 w-3" />
                    )}
                    Deploy
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!dialogAction}
        onOpenChange={(open) => !open && setDialogAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction?.action === "deploy" ? "Deploy" : "Undeploy"}{" "}
              {dialogAction?.agentName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction?.action === "deploy"
                ? "This will install the agent on your instance and restart the service. The agent will be live and ready to handle messages."
                : "This will remove the agent from your instance and restart the service. You can re-deploy it anytime."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {dialogAction?.action === "deploy"
                ? "Deploy Agent"
                : "Undeploy Agent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
