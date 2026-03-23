import Link from "next/link";
import {
  Users,
  DollarSign,
  Ticket,
  Server,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminVpsHealth } from "@/components/dashboard/admin-vps-health";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-600 text-white border-blue-600" },
  in_progress: { label: "In Progress", className: "bg-yellow-600 text-white border-yellow-600" },
  resolved: { label: "Resolved", className: "bg-green-600 text-white border-green-600" },
  closed: { label: "Closed", className: "bg-secondary text-secondary-foreground border-secondary" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "border-muted-foreground/30 text-muted-foreground" },
  medium: { label: "Medium", className: "border-yellow-600/50 text-yellow-500" },
  high: { label: "High", className: "border-red-600/50 text-red-500" },
};

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    { count: totalCustomers },
    { count: activeSubscriptions },
    { data: activeSubsData },
    { count: openTickets },
    { count: vpsRunning },
    { count: vpsTotal },
    { count: proCustomers },
    { count: starterCustomers },
    { count: ultraCustomers },
    { data: recentTickets },
    { data: vpsInstances },
    { count: totalAgents },
    { count: totalChannels },
    { data: recentAuditLogs },
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "customer"),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("subscriptions").select("price, plan").eq("status", "active"),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    admin.from("vps_instances").select("*", { count: "exact", head: true }).eq("status", "running"),
    admin.from("vps_instances").select("*", { count: "exact", head: true }),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "pro").eq("status", "active"),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "starter").eq("status", "active"),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "ultra").eq("status", "active"),
    admin.from("support_tickets").select("id, subject, status, priority, created_at, user_id, users!inner(email)").order("created_at", { ascending: false }).limit(5),
    admin.from("vps_instances").select("user_id, hostname, ip_address, status, users!inner(name, email)").order("status", { ascending: true }),
    admin.from("user_agents").select("*", { count: "exact", head: true }).eq("deployed", true),
    admin.from("channels").select("*", { count: "exact", head: true }).eq("status", "connected"),
    admin.from("audit_logs").select("id, action, entity_type, created_at, details, users!admin_id(name, email)").order("created_at", { ascending: false }).limit(10),
  ]);

  // ADMIN_MED_12: ARR calculation accounts for annual billing cycles (price / 12)
  const monthlyRevenue = activeSubsData?.reduce((sum, sub) => {
    const price = Number(sub.price) || 0;
    const cycle = sub.billing_cycle === "annual" ? price / 12 : price;
    return sum + cycle;
  }, 0) ?? 0;

  // MRR by plan
  const mrrByPlan: Record<string, number> = {};
  activeSubsData?.forEach((sub: any) => {
    const plan = sub.plan || "unknown";
    mrrByPlan[plan] = (mrrByPlan[plan] || 0) + (Number(sub.price) || 0);
  });

  // Alerts
  const alerts: { level: "critical" | "warning" | "info"; text: string }[] = [];
  const stoppedVps = vpsInstances?.filter((v: any) => v.status !== "running") || [];
  if (stoppedVps.length > 0) {
    alerts.push({ level: "critical", text: `${stoppedVps.length} VPS(es) not running` });
  }
  if ((openTickets ?? 0) > 0) {
    alerts.push({ level: "warning", text: `${openTickets} open support ticket(s)` });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Overview</h1>
      <p className="text-muted-foreground mb-6">Platform health and key metrics.</p>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 border ${
                alert.level === "critical"
                  ? "border-red-600/30 bg-red-600/5"
                  : alert.level === "warning"
                  ? "border-yellow-600/30 bg-yellow-600/5"
                  : "border-border bg-muted/50"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 shrink-0 ${
                  alert.level === "critical" ? "text-red-500" : "text-yellow-500"
                }`}
              />
              <p className={`text-sm ${alert.level === "critical" ? "text-red-400" : "text-yellow-400"}`}>
                {alert.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Revenue + Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${monthlyRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ARR: ${(monthlyRevenue * 12).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCustomers ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSubscriptions ?? 0} active subs
            </p>
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

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">VPS Running</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {vpsRunning ?? 0}
              <span className="text-sm font-normal text-muted-foreground"> / {vpsTotal ?? 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Plan breakdown + deployment stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Starter</p>
            <p className="text-lg font-bold text-green-500">{starterCustomers ?? 0}</p>
            {mrrByPlan.starter && (
              <p className="text-[10px] text-muted-foreground">${mrrByPlan.starter}/mo</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pro</p>
            <p className="text-lg font-bold text-[#ffe0c2]">{proCustomers ?? 0}</p>
            {mrrByPlan.pro && (
              <p className="text-[10px] text-muted-foreground">${mrrByPlan.pro}/mo</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ultra</p>
            <p className="text-lg font-bold text-amber-400">{ultraCustomers ?? 0}</p>
            {mrrByPlan.ultra && (
              <p className="text-[10px] text-muted-foreground">${mrrByPlan.ultra}/mo</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Agents Deployed</p>
            <p className="text-lg font-bold">{totalAgents ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Channels</p>
            <p className="text-lg font-bold">{totalChannels ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Enterprise</p>
            <p className="text-lg font-bold text-teal-400">
              {(activeSubsData?.filter((s: any) => s.plan === "enterprise") || []).length}
            </p>
            {mrrByPlan.enterprise && (
              <p className="text-[10px] text-muted-foreground">${mrrByPlan.enterprise}/mo</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: VPS Health */}
      <div className="mb-6">
        <AdminVpsHealth instances={vpsInstances || []} />
      </div>

      {/* Row 4: Recent Activity + Recent Tickets side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Tickets */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Tickets</h2>
          {recentTickets && recentTickets.length > 0 ? (
            <div className="border border-border">
              {recentTickets.map((ticket: any) => {
                const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                const email = (ticket.users as any)?.email || "—";

                return (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${status.className} text-xs`}>{status.label}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-border p-8 text-center">
              <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            </div>
          )}
        </div>

        {/* Recent Admin Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Admin Activity</h2>
          {recentAuditLogs && recentAuditLogs.length > 0 ? (
            <div className="border border-border">
              {recentAuditLogs.map((log: any) => {
                const adminUser = Array.isArray(log.users) ? log.users[0] : log.users;
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{adminUser?.name || "Admin"}</span>{" "}
                        <span className="text-muted-foreground">{log.action.replace(/_/g, " ")}</span>
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground truncate">
                          {typeof log.details === "object"
                            ? JSON.stringify(log.details).slice(0, 60)
                            : String(log.details).slice(0, 60)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border p-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No admin activity yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/customers">
            View Customers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/deploy">
            Deploy VPS
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/health">
            Health Check
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/tickets">
            All Tickets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/audit-logs">
            Audit Logs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
