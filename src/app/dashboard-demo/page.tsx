"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Brain,
  Cpu,
  Server,
  MessageSquare,
  Bot,
  BarChart3,
  Clock,
  Rocket,
  ExternalLink,
  HelpCircle,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatContext(limit: number | null) {
  if (limit == null) return "Unlimited";
  if (limit >= 1000) return `${Math.round(limit / 1000)}K`;
  return String(limit);
}

// Demo data per plan tier
const DEMO_PLANS: Record<string, { plan: string; cpu_cores: number; ram_gb: number; storage_gb: number }> = {
  starter: { plan: "starter", cpu_cores: 2, ram_gb: 8, storage_gb: 100 },
  pro: { plan: "pro", cpu_cores: 4, ram_gb: 16, storage_gb: 200 },
  ultra: { plan: "ultra", cpu_cores: 8, ram_gb: 32, storage_gb: 400 },
  enterprise: { plan: "enterprise", cpu_cores: 16, ram_gb: 64, storage_gb: 800 },
};

export default function DemoOverviewPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan")?.toLowerCase() || "pro";
  const demoConfig = DEMO_PLANS[planParam] || DEMO_PLANS.pro;

  const subscription = {
    plan: demoConfig.plan,
    status: "active",
    expires_at: "2026-04-22T00:00:00Z",
  };
  const vps = {
    status: "running",
    openclaw_dashboard_url: "https://demo.clawhq.tech",
    cpu_cores: demoConfig.cpu_cores,
    ram_gb: demoConfig.ram_gb,
    storage_gb: demoConfig.storage_gb,
  };
  const model = {
    current_model: "Kimi K2.5",
    requested_model: null as string | null,
    change_effective_date: null as string | null,
    context_limit: 128000,
  };
  const channelsConnected = 5;
  const agentsDeployed = 5;
  const openTickets = 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Overview</h1>
      <p className="text-muted-foreground mb-6">Your ClawHQ dashboard at a glance.</p>

      {/* Top row: VPS Status, Plan, Model, Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* VPS Health Card - hardcoded version */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VPS Status
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Badge className="bg-green-600 text-white border-green-600">Healthy</Badge>
              <p className="text-xs text-muted-foreground">CPU 12% &middot; RAM 34%</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {vps.cpu_cores} vCPU &middot; {vps.ram_gb}GB RAM &middot; {vps.storage_gb}GB
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
            {subscription.expires_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Renews {new Date(subscription.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Model</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{model.current_model || "\u2014"}</p>
            {model.requested_model && (
              <p className="text-xs text-yellow-500 mt-1">
                Pending: {model.requested_model}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Context Limit</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatContext(model.context_limit)}</p>
            <p className="text-xs text-muted-foreground mt-1">tokens per request</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Channels, Agents, Messages — hardcoded sparklines row */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Channels Connected
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{channelsConnected}</p>
                </div>
                {/* Mini sparkline placeholder */}
                <div className="flex items-end gap-0.5 h-6">
                  {[2, 3, 3, 4, 5, 5, 5].map((v, i) => (
                    <div key={i} className="w-1.5 bg-primary/40" style={{ height: `${(v / 5) * 100}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agents Deployed
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{agentsDeployed}</p>
                </div>
                <div className="flex items-end gap-0.5 h-6">
                  {[1, 2, 3, 3, 4, 5, 5].map((v, i) => (
                    <div key={i} className="w-1.5 bg-green-600/40" style={{ height: `${(v / 5) * 100}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages (7d)
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">1,247</p>
                  {openTickets > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {openTickets} open ticket{openTickets !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-end gap-0.5 h-6">
                  {[120, 180, 210, 150, 190, 200, 197].map((v, i) => (
                    <div key={i} className="w-1.5 bg-blue-500/40" style={{ height: `${(v / 210) * 100}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions - hardcoded */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={vps.openclaw_dashboard_url} target="_blank" rel="noopener noreferrer">
              Open OpenClaw
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard-demo/vps">
              <Server className="mr-2 h-4 w-4" />
              Manage VPS
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard-demo/support">
              <HelpCircle className="mr-2 h-4 w-4" />
              Raise Ticket
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard-demo/store">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Agent Store
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard-demo/channels">
              <MessageSquare className="mr-2 h-4 w-4" />
              Connect Channel
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard-demo/chat">
              <MessageCircle className="mr-2 h-4 w-4" />
              Open Chat
            </Link>
          </Button>
        </div>
      </div>

      {/* Usage + Recent Activity - hardcoded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Usage Summary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
              </div>
              <div className="flex items-end gap-0.5 h-7">
                {[120, 180, 210, 150, 190, 200, 197].map((v, i) => (
                  <div key={i} className="w-1 bg-primary/30" style={{ height: `${(v / 210) * 100}%` }} />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground">messages this week</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Most active:</span>
                  <span className="font-medium">Support Agent</span>
                  <span className="text-xs text-muted-foreground">(487)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Top channel:</span>
                  <span className="font-medium capitalize">WhatsApp</span>
                  <span className="text-xs text-muted-foreground">(612)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Rocket, message: "Data Agent deployed", time: "2h ago" },
                { icon: MessageSquare, message: "Webchat channel connected", time: "5h ago" },
                { icon: Rocket, message: "Sales Agent deployed", time: "1d ago" },
                { icon: MessageSquare, message: "Slack channel connected", time: "3d ago" },
                { icon: Rocket, message: "Research Agent deployed", time: "5d ago" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{item.message}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
