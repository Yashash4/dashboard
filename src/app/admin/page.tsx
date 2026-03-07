import Link from "next/link";
import {
  Users,
  CreditCard,
  DollarSign,
  Ticket,
  Server,
  Crown,
  Zap,
  ArrowRight,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminVpsHealth } from "@/components/dashboard/admin-vps-health";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-blue-600 text-white border-blue-600",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-600 text-white border-yellow-600",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-600 text-white border-green-600",
  },
  closed: {
    label: "Closed",
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "border-muted-foreground/30 text-muted-foreground" },
  medium: { label: "Medium", className: "border-yellow-600/50 text-yellow-500" },
  high: { label: "High", className: "border-red-600/50 text-red-500" },
};

export default async function AdminStatsPage() {
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
    { data: recentTickets },
    { data: vpsInstances },
  ] = await Promise.all([
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("subscriptions")
      .select("price")
      .eq("status", "active"),
    admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    admin
      .from("vps_instances")
      .select("*", { count: "exact", head: true })
      .eq("status", "running"),
    admin
      .from("vps_instances")
      .select("*", { count: "exact", head: true }),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("plan", ["pro", "enterprise"])
      .eq("status", "active"),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "starter")
      .eq("status", "active"),
    admin
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, user_id, users!inner(email)")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("vps_instances")
      .select("user_id, hostname, ip_address, status, users!inner(name, email)")
      .order("status", { ascending: true }),
  ]);

  const monthlyRevenue = activeSubsData?.reduce(
    (sum, sub) => sum + (Number(sub.price) || 0),
    0
  ) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Stats</h1>
      <p className="text-muted-foreground mb-6">Platform overview and metrics.</p>

      {/* Row 1: Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCustomers ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeSubscriptions ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${monthlyRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
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
      </div>

      {/* Row 2: Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pro Customers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{proCustomers ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Starter Customers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{starterCustomers ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: VPS Health */}
      <div className="mb-6">
        <AdminVpsHealth instances={vpsInstances || []} />
      </div>

      {/* Row 4: Recent Tickets */}
      <h2 className="text-lg font-semibold mb-3">Recent Tickets</h2>
      {recentTickets && recentTickets.length > 0 ? (
        <div className="border border-border mb-6">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Subject</span>
            <span>Customer</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Date</span>
          </div>
          {recentTickets.map((ticket: any) => {
            const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
            const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
            const email = (ticket.users as any)?.email || "—";

            return (
              <div
                key={ticket.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-border last:border-b-0 items-center"
              >
                <span className="text-sm font-medium truncate">{ticket.subject}</span>
                <span className="text-sm text-muted-foreground truncate max-w-[180px]">{email}</span>
                <Badge className={`${status.className} text-xs`}>{status.label}</Badge>
                <Badge variant="outline" className={`${priority.className} text-xs`}>{priority.label}</Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(ticket.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border p-8 text-center mb-6">
          <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        </div>
      )}

      {/* Row 4: Quick Actions */}
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
          <Link href="/admin/tickets">
            All Tickets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
