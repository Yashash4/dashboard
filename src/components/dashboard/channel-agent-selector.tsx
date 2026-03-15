"use client";

import { useState, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  channelId: string;
  channelType: string;
}

interface DeployedAgent {
  agent_id: string;
  agents: { name: string } | null;
}

/**
 * Dropdown to assign a specific agent to handle a channel.
 * Shows on each connected channel card.
 * "Default" means the first deployed agent handles it (no routing override).
 */
export function ChannelAgentSelector({ channelId, channelType }: Props) {
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Fetch deployed agents
        const agentsRes = await fetch("/api/agents/config");
        if (agentsRes.ok) {
          const data = await agentsRes.json();
          setAgents(data.agents || []);
        }

        // Fetch current routing
        const routingRes = await fetch(`/api/channels/${channelId}/routing`);
        if (routingRes.ok) {
          const data = await routingRes.json();
          const routing = data.routing;
          if (routing?.length > 0) {
            setCurrentAgent(routing[0].agent_id);
          }
        }
      } catch {
        // Silent fail — default routing
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [channelId]);

  const handleChange = async (value: string) => {
    setSaving(true);
    const prevValue = currentAgent;
    setCurrentAgent(value);

    try {
      const res = await fetch(`/api/channels/${channelId}/routing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: value === "default" ? null : value,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update routing");
        setCurrentAgent(prevValue);
        return;
      }

      const agentName = value === "default"
        ? "default agent"
        : agents.find((a) => a.agent_id === value)?.agents?.name || "agent";
      toast.success(`${channelType} now routes to ${agentName}`);
    } catch {
      toast.error("Failed to update routing");
      setCurrentAgent(prevValue);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (agents.length <= 1) return null; // No point showing selector with 0-1 agents

  return (
    <div className="flex items-center gap-2 mt-2">
      <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
      <Select
        value={currentAgent}
        onValueChange={handleChange}
        disabled={saving}
      >
        <SelectTrigger className="h-7 text-xs flex-1">
          <SelectValue placeholder="Default agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default (first deployed)</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a.agent_id} value={a.agent_id}>
              {a.agents?.name || "Agent"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}
