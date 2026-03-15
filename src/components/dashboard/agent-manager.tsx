"use client";

import { useState } from "react";
import {
  Bot,
  Rocket,
  Check,
  Loader2,
  Power,
  Tag,
  Brain,
  MoreVertical,
  MessageSquare,
  FileCode,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentConfigEditor } from "./agent-config-editor";
import { AgentTestDialog } from "./agent-test-dialog";
import { AgentConfigDialog } from "./agent-config-dialog";
import { hasAccess } from "@/lib/tier";

interface AgentInfo {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  config_files: Record<string, string> | null;
}

interface UserAgent {
  id: string;
  agent_id: string;
  deployed: boolean;
  deployed_at: string | null;
  purchased_at: string;
  custom_config: Record<string, string> | null;
  primary_model: string | null;
  fallback_model: string | null;
  agents: AgentInfo;
}

interface AvailableModel {
  name: string;
  display_name: string;
}

export function AgentManager({
  userAgents: initialAgents,
  plan,
  availableModels = [],
}: {
  userAgents: UserAgent[];
  plan: string;
  availableModels?: AvailableModel[];
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "deployed" | "not_deployed">("all");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");
  const [dialogAction, setDialogAction] = useState<{
    agentId: string;
    agentName: string;
    action: "deploy" | "undeploy";
  } | null>(null);

  // Test dialog state
  const [testDialog, setTestDialog] = useState<{
    agentId: string;
    agentName: string;
  } | null>(null);

  // Config dialog state
  const [configDialog, setConfigDialog] = useState<{
    agentId: string;
    agentName: string;
  } | null>(null);

  // Bulk action state
  const [bulkAction, setBulkAction] = useState<"deploy_all" | "undeploy_all" | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  const deployedCount = agents.filter((a) => a.deployed).length;
  const isPro = hasAccess(plan, "pro");

  // Plan-based deploy limits
  const deployLimits: Record<string, number> = {
    starter: 3,
    pro: 10,
    ultra: 25,
  };
  const maxDeploys = deployLimits[plan] || 3;

  const handleAction = async () => {
    if (!dialogAction) return;
    const { agentId, action } = dialogAction;
    setDialogAction(null);

    if (action === "deploy" && deployedCount >= maxDeploys) {
      toast.error(`Deploy limit reached (${maxDeploys} agents on ${plan} plan). Upgrade to deploy more.`);
      return;
    }

    setLoadingAgent(agentId);

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

  const handleModelChange = async (
    agentId: string,
    field: "primary_model" | "fallback_model",
    value: string
  ) => {
    setSavingModel(`${agentId}-${field}`);
    try {
      const res = await fetch(`/api/agents/${agentId}/model`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value === "default" ? null : value }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update model");
        return;
      }

      setAgents((prev) =>
        prev.map((a) =>
          a.agent_id === agentId
            ? { ...a, [field]: value === "default" ? null : value }
            : a
        )
      );
      toast.success("Model updated. Redeploy to apply changes.");
    } catch {
      toast.error("Failed to update model");
    } finally {
      setSavingModel(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) return;
    const action = bulkAction;
    setBulkAction(null);
    setBulkRunning(true);

    const targets =
      action === "deploy_all"
        ? agents.filter((a) => !a.deployed)
        : agents.filter((a) => a.deployed);

    if (targets.length === 0) {
      toast.info(action === "deploy_all" ? "All agents are already deployed." : "No agents are deployed.");
      setBulkRunning(false);
      return;
    }

    const apiAction = action === "deploy_all" ? "deploy" : "undeploy";
    let completed = 0;
    let failed = 0;

    for (const ua of targets) {
      if (apiAction === "deploy" && deployedCount + completed >= maxDeploys) {
        toast.error(`Deploy limit reached (${maxDeploys}). Stopped at ${completed} agents.`);
        break;
      }

      completed++;
      toast.info(`${apiAction === "deploy" ? "Deploying" : "Undeploying"} ${completed}/${targets.length}...`);

      try {
        const res = await fetch(`/api/agents/${apiAction}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_id: ua.agent_id }),
        });

        if (!res.ok) {
          failed++;
          continue;
        }

        setAgents((prev) =>
          prev.map((a) =>
            a.agent_id === ua.agent_id
              ? {
                  ...a,
                  deployed: apiAction === "deploy",
                  deployed_at: apiAction === "deploy" ? new Date().toISOString() : null,
                }
              : a
          )
        );
      } catch {
        failed++;
      }
    }

    setBulkRunning(false);

    if (failed > 0) {
      toast.warning(`Completed with ${failed} failure${failed > 1 ? "s" : ""}.`);
    } else {
      toast.success(
        apiAction === "deploy"
          ? `All ${targets.length} agents deployed.`
          : `All ${targets.length} agents undeployed.`
      );
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

            {/* Bulk Actions Dropdown */}
            {agents.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={bulkRunning}
                  >
                    {bulkRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setBulkAction("deploy_all")}
                    disabled={bulkRunning}
                  >
                    <Rocket className="mr-2 h-3.5 w-3.5" />
                    Deploy All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setBulkAction("undeploy_all")}
                    disabled={bulkRunning}
                  >
                    <Power className="mr-2 h-3.5 w-3.5" />
                    Undeploy All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {(["all", "deployed", "not_deployed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                statusFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "deployed" ? "Deployed" : "Not Deployed"}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "recent")}
          className="text-xs bg-transparent border border-border px-2 py-1 text-muted-foreground"
        >
          <option value="recent">Recent</option>
          <option value="name">A-Z</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {(() => {
            const filtered = agents.filter((a) =>
              statusFilter === "all" ? true : statusFilter === "deployed" ? a.deployed : !a.deployed
            );
            return `${filtered.length} of ${agents.length} agents`;
          })()}
        </span>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents
          .filter((a) => statusFilter === "all" ? true : statusFilter === "deployed" ? a.deployed : !a.deployed)
          .sort((a, b) => {
            if (sortBy === "name") return (a.agents.name || "").localeCompare(b.agents.name || "");
            return new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime();
          })
          .map((ua) => {
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-base">{agent.name}</h3>
                    <AgentConfigEditor
                      userAgentId={ua.id}
                      agentId={ua.agent_id}
                      agentName={agent.name}
                      defaultConfig={agent.config_files || {}}
                      customConfig={ua.custom_config}
                      deployed={ua.deployed}
                    />
                  </div>
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

                {/* Per-agent model selector (Pro only) */}
                {isPro && availableModels.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Brain className="h-3 w-3" />
                      <span>Model</span>
                    </div>
                    <Select
                      value={ua.primary_model || "default"}
                      onValueChange={(v) => handleModelChange(ua.agent_id, "primary_model", v)}
                      disabled={savingModel === `${ua.agent_id}-primary_model`}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">VPS Default</SelectItem>
                        {availableModels.map((m) => (
                          <SelectItem key={m.name} value={m.name}>
                            {m.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {ua.primary_model && (
                      <div>
                        <span className="text-[10px] text-muted-foreground">Fallback</span>
                        <Select
                          value={ua.fallback_model || "default"}
                          onValueChange={(v) => handleModelChange(ua.agent_id, "fallback_model", v)}
                          disabled={savingModel === `${ua.agent_id}-fallback_model`}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">None</SelectItem>
                            {availableModels
                              .filter((m) => m.name !== ua.primary_model)
                              .map((m) => (
                                <SelectItem key={m.name} value={m.name}>
                                  {m.display_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  {ua.deployed ? (
                    <>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            setTestDialog({
                              agentId: ua.agent_id,
                              agentName: agent.name,
                            })
                          }
                        >
                          <MessageSquare className="mr-1.5 h-3 w-3" />
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            setConfigDialog({
                              agentId: ua.agent_id,
                              agentName: agent.name,
                            })
                          }
                        >
                          <FileCode className="mr-1.5 h-3 w-3" />
                          Config
                        </Button>
                      </div>
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
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          setConfigDialog({
                            agentId: ua.agent_id,
                            agentName: agent.name,
                          })
                        }
                      >
                        <FileCode className="mr-1.5 h-3 w-3" />
                        View Config
                      </Button>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Deploy/Undeploy Confirmation Dialog */}
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

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog
        open={!!bulkAction}
        onOpenChange={(open) => !open && setBulkAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "deploy_all" ? "Deploy All Agents?" : "Undeploy All Agents?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "deploy_all"
                ? `This will sequentially deploy all undeployed agents (${agents.filter((a) => !a.deployed).length} agents). Each deployment restarts the service.`
                : `This will sequentially undeploy all deployed agents (${agents.filter((a) => a.deployed).length} agents). Each removal restarts the service.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>
              {bulkAction === "deploy_all" ? "Deploy All" : "Undeploy All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Dialog */}
      <AgentTestDialog
        agentId={testDialog?.agentId || ""}
        agentName={testDialog?.agentName || ""}
        open={!!testDialog}
        onOpenChange={(open) => !open && setTestDialog(null)}
      />

      {/* Config Dialog */}
      <AgentConfigDialog
        agentId={configDialog?.agentId || ""}
        agentName={configDialog?.agentName || ""}
        open={!!configDialog}
        onOpenChange={(open) => !open && setConfigDialog(null)}
        plan={plan}
      />
    </div>
  );
}
