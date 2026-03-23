"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  ShoppingBag,
  Check,
  Power,
  Tag,
  Brain,
  Rocket,
  MessageSquare,
  FileCode,
  MoreVertical,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEMO_AGENTS = [
  {
    id: "ua-1",
    agent_id: "a-1",
    deployed: true,
    deployed_at: "2026-03-01T10:00:00Z",
    purchased_at: "2026-02-15T00:00:00Z",
    primary_model: "Kimi K2.5",
    fallback_model: null,
    agents: { id: "a-1", name: "Support Agent", description: "Handles customer support queries across all channels.", category: "support", config_files: null },
  },
  {
    id: "ua-2",
    agent_id: "a-2",
    deployed: true,
    deployed_at: "2026-03-05T14:00:00Z",
    purchased_at: "2026-02-20T00:00:00Z",
    primary_model: "DeepSeek V3",
    fallback_model: null,
    agents: { id: "a-2", name: "Research Agent", description: "Gathers and synthesizes information from multiple sources.", category: "research", config_files: null },
  },
  {
    id: "ua-3",
    agent_id: "a-3",
    deployed: true,
    deployed_at: "2026-03-10T09:00:00Z",
    purchased_at: "2026-02-25T00:00:00Z",
    primary_model: "Kimi K2.5",
    fallback_model: null,
    agents: { id: "a-3", name: "Sales Agent", description: "Engages leads and qualifies prospects automatically.", category: "sales", config_files: null },
  },
  {
    id: "ua-4",
    agent_id: "a-4",
    deployed: false,
    deployed_at: null,
    purchased_at: "2026-03-01T00:00:00Z",
    primary_model: null,
    fallback_model: null,
    agents: { id: "a-4", name: "Writer Agent", description: "Creates blog posts, emails, and marketing copy.", category: "content", config_files: null },
  },
  {
    id: "ua-5",
    agent_id: "a-5",
    deployed: true,
    deployed_at: "2026-03-15T11:00:00Z",
    purchased_at: "2026-03-10T00:00:00Z",
    primary_model: "Qwen 3",
    fallback_model: null,
    agents: { id: "a-5", name: "Data Agent", description: "Analyzes datasets and generates insights and reports.", category: "analytics", config_files: null },
  },
];

export default function DemoAgentsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "deployed" | "not_deployed">("all");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");

  const deployedCount = DEMO_AGENTS.filter((a) => a.deployed).length;

  const filtered = DEMO_AGENTS
    .filter((a) => statusFilter === "all" ? true : statusFilter === "deployed" ? a.deployed : !a.deployed)
    .sort((a, b) => {
      if (sortBy === "name") return (a.agents?.name || "").localeCompare(b.agents?.name || "");
      return new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime();
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard-demo/store">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Browse Store
          </Link>
        </Button>
      </div>

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
                Total: <strong className="text-foreground">{DEMO_AGENTS.length}</strong>
              </span>
              <span>&middot;</span>
              <span>
                Deployed:{" "}
                <strong className="text-foreground">{deployedCount}</strong>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled
                aria-label="Bulk actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
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
            {filtered.length} of {DEMO_AGENTS.length} agents
          </span>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ua) => {
            const agent = ua.agents;

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

                  {/* Per-agent model selector (Pro) */}
                  {ua.primary_model && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Brain className="h-3 w-3" />
                        <span>Model</span>
                      </div>
                      <div className="h-8 border border-border px-2 flex items-center text-xs text-foreground">
                        {ua.primary_model}
                      </div>
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
                            disabled
                          >
                            <MessageSquare className="mr-1.5 h-3 w-3" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled
                          >
                            <FileCode className="mr-1.5 h-3 w-3" />
                            Config
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          <Power className="mr-2 h-3 w-3" />
                          Undeploy
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          <FileCode className="mr-1.5 h-3 w-3" />
                          View Config
                        </Button>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled
                        >
                          <Rocket className="mr-2 h-3 w-3" />
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
      </div>

      {/* Usage Analytics */}
      <div className="mt-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Agent Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center py-4">
                <p className="text-3xl font-bold">1,247</p>
                <p className="text-sm text-muted-foreground">Messages (7d)</p>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold">342</p>
                <p className="text-sm text-muted-foreground">Conversations (7d)</p>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold">1.2s</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
