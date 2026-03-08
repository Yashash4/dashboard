export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Bot,
  MessageSquare,
  Ticket,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminApiKeys } from "@/components/dashboard/admin-api-keys";
import { AdminDashboardAuth } from "@/components/dashboard/admin-dashboard-auth";
import { AdminSubscriptionEditor } from "@/components/dashboard/admin-subscription-editor";
import { AdminVpsEditor } from "@/components/dashboard/admin-vps-editor";
import { AdminDeleteCustomer } from "@/components/dashboard/admin-delete-customer";

const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-600 text-white border-blue-600" },
  in_progress: { label: "In Progress", className: "bg-yellow-600 text-white border-yellow-600" },
  resolved: { label: "Resolved", className: "bg-green-600 text-white border-green-600" },
  closed: { label: "Closed", className: "bg-secondary text-secondary-foreground border-secondary" },
};

const CHANNEL_STATUS: Record<string, { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-green-600 text-white border-green-600" },
  disconnected: { label: "Disconnected", className: "bg-secondary text-secondary-foreground border-secondary" },
  pending: { label: "Pending", className: "bg-yellow-600 text-white border-yellow-600" },
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [
    { data: user },
    { data: subscription },
    { data: vps },
    { data: model },
    { data: userAgents },
    { data: channels },
    { data: tickets },
  ] = await Promise.all([
    admin.from("users").select("id, name, email, created_at").eq("id", id).single(),
    admin.from("subscriptions").select("*").eq("user_id", id).single(),
    admin.from("vps_instances").select("*").eq("user_id", id).single(),
    admin.from("models").select("*").eq("user_id", id).single(),
    admin.from("user_agents").select("id, deployed, agents(name)").eq("user_id", id),
    admin.from("channels").select("id, channel_type, status").eq("user_id", id),
    admin
      .from("support_tickets")
      .select("id, subject, status, priority, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!user) return notFound();

  const deployedAgents = userAgents?.filter((a: any) => a.deployed) || [];

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/admin/customers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{user.name || "Unnamed"}</h1>
        <p className="text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Joined{" "}
          {new Date(user.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Subscription */}
        <AdminSubscriptionEditor userId={id} subscription={subscription} />

        {/* VPS */}
        <AdminVpsEditor userId={id} vps={vps} />

        {/* Model */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Model</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {model ? (
              <>
                <p className="text-lg font-bold">{model.current_model || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  Context: {model.context_limit ? `${Math.round(model.context_limit / 1000)}K` : "—"}
                </p>
                {model.requested_model && (
                  <p className="text-xs text-yellow-500">
                    Pending: {model.requested_model}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No model configured</p>
            )}
          </CardContent>
        </Card>

        {/* Agents */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {deployedAgents.length > 0 ? (
              <div className="space-y-1">
                <p className="text-lg font-bold">{deployedAgents.length} deployed</p>
                {deployedAgents.map((ua: any) => (
                  <p key={ua.id} className="text-xs text-muted-foreground">
                    {(ua.agents as any)?.name || "Unknown agent"}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agents deployed</p>
            )}
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {channels && channels.length > 0 ? (
              <div className="space-y-2">
                {channels.map((ch: any) => {
                  const chStatus = CHANNEL_STATUS[ch.status] || CHANNEL_STATUS.disconnected;
                  return (
                    <div key={ch.id} className="flex items-center gap-2">
                      <span className="text-sm capitalize">{ch.channel_type}</span>
                      <Badge className={`${chStatus.className} text-xs`}>{chStatus.label}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No channels connected</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tickets && tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.map((t: any) => {
                  const tStatus = TICKET_STATUS[t.status] || TICKET_STATUS.open;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate flex-1">{t.subject}</span>
                      <Badge className={`${tStatus.className} text-xs`}>{tStatus.label}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tickets</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Access + API Keys — full width below the grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AdminDashboardAuth userId={id} />
        <AdminApiKeys userId={id} hasVps={!!vps} />
      </div>

      {/* Danger Zone */}
      <div className="mb-6">
        <AdminDeleteCustomer userId={id} email={user.email} name={user.name} />
      </div>
    </div>
  );
}
