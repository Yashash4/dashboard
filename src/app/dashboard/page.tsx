import Link from "next/link";
import {
  Server,
  CreditCard,
  Brain,
  Cpu,
  MessageSquare,
  Bot,
  Ticket,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { vpsStatusConfig } from "@/lib/vps-status";

function formatContext(limit: number | null) {
  if (!limit) return "Unlimited";
  if (limit >= 1000) return `${Math.round(limit / 1000)}K`;
  return String(limit);
}

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: subscription },
    { data: vps },
    { data: model },
    { count: channelsConnected },
    { count: agentsDeployed },
    { count: openTickets },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("vps_instances")
      .select("status, openclaw_dashboard_url, cpu_cores, ram_gb, storage_gb")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("models")
      .select("current_model, requested_model, change_effective_date, context_limit")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "connected"),
    supabase
      .from("user_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("deployed", true),
    supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["open", "in_progress"]),
  ]);

  // No subscription = not onboarded yet
  if (!subscription || !vps) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p className="text-muted-foreground mb-6">Your ClawHQ dashboard at a glance.</p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Get Started with ClawHQ</h2>
              <p className="text-muted-foreground mb-4">
                Your account is set up. Once your subscription is activated and VPS is provisioned, your dashboard will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = vpsStatusConfig[vps.status] || vpsStatusConfig.error;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Overview</h1>
      <p className="text-muted-foreground mb-6">Your ClawHQ dashboard at a glance.</p>

      {/* Top row: VPS Status, Plan, Model, Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">VPS Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            {vps.cpu_cores && (
              <p className="text-xs text-muted-foreground mt-2">
                {vps.cpu_cores} vCPU &middot; {vps.ram_gb}GB RAM &middot; {vps.storage_gb}GB
              </p>
            )}
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
            <p className="text-2xl font-bold">{model?.current_model || "—"}</p>
            {model?.requested_model && (
              <p className="text-xs text-yellow-500 mt-1">
                Pending: {model.requested_model}
                {model.change_effective_date &&
                  ` (${new Date(model.change_effective_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })})`}
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
            <p className="text-2xl font-bold">{formatContext(model?.context_limit ?? null)}</p>
            <p className="text-xs text-muted-foreground mt-1">tokens per request</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Channels, Agents, Tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels Connected</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{channelsConnected ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agents Deployed</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{agentsDeployed ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openTickets ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        {vps.openclaw_dashboard_url && (
          <Button asChild>
            <a href={vps.openclaw_dashboard_url} target="_blank" rel="noopener noreferrer">
              Open OpenClaw
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/vps">
            Manage VPS
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/support">
            Raise Ticket
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
