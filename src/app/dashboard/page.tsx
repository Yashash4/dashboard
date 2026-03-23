import Link from "next/link";
import {
  Server,
  CreditCard,
  Brain,
  Cpu,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { vpsStatusConfig } from "@/lib/vps-status";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { SystemAlerts } from "@/components/dashboard/system-alerts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { VpsHealthCard } from "@/components/dashboard/vps-health-card";
import { GettingStartedGuide } from "@/components/dashboard/getting-started-guide";
import { OverviewSparklines } from "@/components/dashboard/overview-sparklines";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UsageSummaryCard } from "@/components/dashboard/usage-summary-card";

function formatContext(limit: number | null) {
  if (limit == null) return "Unlimited";
  if (limit >= 1000) return `${Math.round(limit / 1000)}K`;
  return String(limit);
}

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  let subscription: {
    plan: string;
    status: string;
    expires_at: string | null;
  } | null = null;
  let vps: {
    status: string;
    openclaw_dashboard_url: string | null;
    cpu_cores: number | null;
    ram_gb: number | null;
    storage_gb: number | null;
  } | null = null;
  let model: {
    current_model: string | null;
    requested_model: string | null;
    change_effective_date: string | null;
    context_limit: number | null;
  } | null = null;
  let channelsConnected: number | null = null;
  let agentsDeployed: number | null = null;
  let openTickets: number | null = null;

  try {
    const [subRes, vpsRes, modelRes, channelsRes, agentsRes, ticketsRes] = await Promise.all([
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
    // Subscription/VPS/model queries can return null (no rows) — that's OK
    // But a real error (permissions, network) should throw
    if (subRes.error && subRes.error.code !== "PGRST116") throw subRes.error;
    if (vpsRes.error && vpsRes.error.code !== "PGRST116") throw vpsRes.error;
    if (modelRes.error && modelRes.error.code !== "PGRST116") throw modelRes.error;
    if (channelsRes.error) throw channelsRes.error;
    if (agentsRes.error) throw agentsRes.error;
    if (ticketsRes.error) throw ticketsRes.error;
    subscription = subRes.data;
    vps = vpsRes.data;
    model = modelRes.data;
    channelsConnected = channelsRes.count;
    agentsDeployed = agentsRes.count;
    openTickets = ticketsRes.count;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your data. Please refresh the page.</p>
      </div>
    );
  }

  // Stage 1: No subscription — direct to billing
  if (!subscription) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p className="text-muted-foreground mb-6">Your ClawHQ dashboard at a glance.</p>
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Get Started with ClawHQ</h2>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Choose a plan to get your managed OpenClaw instance up and running.
              </p>
              <Button asChild>
                <Link href="/billing">
                  View Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stage 2: Has subscription but no VPS yet — setting up
  if (!vps) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Overview</h1>
        <p className="text-muted-foreground mb-6">Your ClawHQ dashboard at a glance.</p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h2 className="text-lg font-semibold mb-2">Setting Up Your Instance</h2>
              <p className="text-muted-foreground mb-3 max-w-md mx-auto">
                Your <span className="capitalize font-medium">{subscription.plan}</span> plan is active. Our team is setting up your dedicated VPS. You&apos;ll receive an email once your instance is live.
              </p>
              <p className="text-sm text-muted-foreground">
                Questions? <Link href="/support" className="text-primary underline">Contact support</Link>
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

      {/* System Alerts */}
      <div className="mb-4">
        <SystemAlerts
          vpsStatus={vps.status}
          channelsConnected={channelsConnected ?? 0}
          agentsDeployed={agentsDeployed ?? 0}
        />
      </div>

      {/* Getting Started Guide (brand new users only) */}
      <div className="mb-4">
        <GettingStartedGuide />
      </div>

      {/* Onboarding Checklist (in-progress users) */}
      <div className="mb-6">
        <OnboardingChecklist />
      </div>

      {/* Top row: VPS Status, Plan, Model, Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <VpsHealthCard
          vpsStatus={vps.status}
          statusLabel={statusConfig.label}
          statusClassName={statusConfig.className}
          cpuCores={vps.cpu_cores}
          ramGb={vps.ram_gb}
          storageGb={vps.storage_gb}
        />

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
            {subscription.expires_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {subscription.status === "cancelled" || subscription.status === "past_due" ? "Expires" : "Renews"} {new Date(subscription.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
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

      {/* Second row: Channels, Agents, Messages/Tickets — with sparklines */}
      <div className="mb-6">
        <OverviewSparklines
          channelsConnected={channelsConnected ?? 0}
          agentsDeployed={agentsDeployed ?? 0}
          openTickets={openTickets ?? 0}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions openclawUrl={vps.openclaw_dashboard_url} />

      {/* Usage + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <UsageSummaryCard />
        <RecentActivity />
      </div>
    </div>
  );
}
