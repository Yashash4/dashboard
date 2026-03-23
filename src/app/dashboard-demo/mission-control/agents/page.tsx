"use client";

import { useState } from "react";
import {
  Bot,
  Wrench,
  Clock,
  TrendingUp,
  Search,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_COLORS: Record<string, { dot: string; badge: string }> = {
  online: { dot: "bg-green-500", badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  working: { dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  idle: { dot: "bg-gray-400", badge: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  blocked: { dot: "bg-red-500", badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  offline: { dot: "bg-gray-600", badge: "bg-gray-600/15 text-gray-500 border-gray-600/30" },
};

const DEMO_AGENTS = [
  {
    id: "1",
    agent_id: "support-bot",
    agent: { name: "Support Bot", description: "Handles customer support tickets and FAQ queries" },
    status: "working",
    current_task: { title: "Handling ticket #847" },
    tasks_completed: 142,
    tasks_failed: 3,
    avg_response_ms: 1240,
    uptime_percent: 99.2,
    last_heartbeat: "2026-03-22T14:30:00Z",
    tools: ["memory_search", "web", "read"],
    model: "kimi-k2.5",
  },
  {
    id: "2",
    agent_id: "research-bot",
    agent: { name: "Research Bot", description: "Performs web research and generates reports" },
    status: "online",
    current_task: null,
    tasks_completed: 87,
    tasks_failed: 5,
    avg_response_ms: 3420,
    uptime_percent: 97.8,
    last_heartbeat: "2026-03-22T14:29:00Z",
    tools: ["web", "read", "write", "thinking"],
    model: "deepseek-v3",
  },
  {
    id: "3",
    agent_id: "sales-agent",
    agent: { name: "Sales Agent", description: "Qualifies leads and manages sales pipeline" },
    status: "working",
    current_task: { title: "Processing lead qualification" },
    tasks_completed: 65,
    tasks_failed: 2,
    avg_response_ms: 1890,
    uptime_percent: 98.5,
    last_heartbeat: "2026-03-22T14:30:00Z",
    tools: ["memory_search", "web", "thinking"],
    model: "kimi-k2.5",
  },
  {
    id: "4",
    agent_id: "data-analyst",
    agent: { name: "Data Analyst", description: "Analyzes data and generates insights" },
    status: "idle",
    current_task: null,
    tasks_completed: 34,
    tasks_failed: 1,
    avg_response_ms: 4560,
    uptime_percent: 96.3,
    last_heartbeat: "2026-03-22T14:25:00Z",
    tools: ["read", "exec", "thinking", "write"],
    model: "qwen-3",
  },
];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function AgentRosterDemoPage() {
  const [agentSearch, setAgentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAgents = DEMO_AGENTS.filter((a) => {
    if (agentSearch) {
      const q = agentSearch.toLowerCase();
      if (!(a.agent?.name || "").toLowerCase().includes(q) && !(a.agent?.description || "").toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const statusCounts: Record<string, number> = {};
  for (const a of DEMO_AGENTS) {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Agent Roster</h1>
      <p className="text-muted-foreground mb-6">
        Real-time status and performance of your AI agents.
      </p>

      <div className="space-y-4">
        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card key={status} className="border-border">
              <CardContent className="pt-3 pb-2 px-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]?.dot || "bg-gray-400"}`} />
                  <span className="text-xs text-muted-foreground capitalize">{status}</span>
                </div>
                <p className="text-lg font-bold font-mono">{count}</p>
              </CardContent>
            </Card>
          ))}
          <Card className="border-border">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <p className="text-lg font-bold font-mono">{DEMO_AGENTS.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => {
            const sc = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;
            const successRate = agent.tasks_completed > 0
              ? Math.round((agent.tasks_completed / (agent.tasks_completed + agent.tasks_failed)) * 100)
              : 0;

            return (
              <Card key={agent.id} className="border-border hover:bg-muted/20 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{agent.agent.name}</span>
                        <p className="text-xs text-muted-foreground">{agent.agent.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize ${sc.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1 ${sc.dot}`} />
                      {agent.status}
                    </Badge>
                  </div>

                  {agent.current_task && (
                    <div className="text-xs text-muted-foreground mb-3 px-2 py-1.5 bg-muted/30 border border-border/50">
                      <span className="font-medium text-foreground">Current:</span> {agent.current_task.title}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-sm font-bold font-mono">{agent.tasks_completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Success</p>
                      <p className="text-sm font-bold font-mono text-green-500">{successRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Time</p>
                      <p className="text-sm font-bold font-mono">{(agent.avg_response_ms / 1000).toFixed(1)}s</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                      <p className="text-sm font-bold font-mono">{agent.uptime_percent}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">Model:</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{agent.model}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-2">Tools:</span>
                    <div className="flex gap-1 flex-wrap">
                      {agent.tools.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[9px] px-1 py-0">{t}</Badge>
                      ))}
                      {agent.tools.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{agent.tools.length - 3}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      {formatTimeAgo(agent.last_heartbeat)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
