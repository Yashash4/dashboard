"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Brain,
  Bot,
  MessageSquare,
  Ticket,
  Server,
  Key,
  Globe,
  Activity,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  CreditCard,
  User,
  Trash2,
  Webhook,
  BarChart3,
  Terminal,
  CircleDot,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CustomerData {
  customer: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    created_at: string;
  };
  subscription: {
    id: string;
    plan: string;
    status: string;
    billing_cycle: string;
    price: number;
    started_at: string | null;
    expires_at: string | null;
  } | null;
  vps: {
    id: string;
    ip_address: string | null;
    hostname: string | null;
    ssh_user: string | null;
    ssh_password: string | null;
    ssh_port: number | null;
    hostinger_vm_id: number | null;
    cpu_cores: number | null;
    ram_gb: number | null;
    storage_gb: number | null;
    bandwidth_tb: number | null;
    status: string;
    openclaw_dashboard_url: string | null;
    dashboard_username: string | null;
    dashboard_password: string | null;
    data_api_token: string | null;
  } | null;
  model: {
    current_model: string | null;
    requested_model: string | null;
    context_limit: number | null;
    changes_this_cycle: number | null;
  } | null;
  userAgents: Array<{
    id: string;
    deployed: boolean;
    agents: { name: string; slug: string; category: string; description: string } | null;
  }>;
  channels: Array<{
    id: string;
    channel_type: string;
    status: string;
    config: any;
    created_at: string;
  }>;
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    secret: string | null;
    enabled: boolean;
    created_at: string;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    key_hash: string;
    last_used_at: string | null;
    created_at: string;
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    category: string | null;
    created_at: string;
    resolved_at: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    payment_method: string | null;
    created_at: string;
  }>;
  mcTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
  authMeta: {
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    created_at: string;
  } | null;
}

interface ServiceStatus {
  services: {
    openclaw?: boolean;
    nginx?: boolean;
    embeddings?: boolean;
    dataApi?: boolean;
  };
  resources: {
    cpu_percent: number;
    ram_used_mb: number;
    ram_total_mb: number;
    ram_percent: number;
    disk_used: string;
    disk_total: string;
    disk_percent: string;
    uptime_seconds: number;
    ssl_expiry: string | null;
  } | null;
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  starter: "bg-green-600/20 text-green-500 border-green-600/30",
  pro: "bg-[#ffe0c2]/20 text-[#ffe0c2] border-[#ffe0c2]/30",
  ultra: "bg-amber-600/20 text-amber-400 border-amber-600/30",
  enterprise: "bg-teal-600/20 text-teal-400 border-teal-600/30",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600/20 text-green-500 border-green-600/30",
  cancelled: "bg-red-600/20 text-red-500 border-red-600/30",
  expired: "bg-muted text-muted-foreground border-border",
  past_due: "bg-yellow-600/20 text-yellow-500 border-yellow-600/30",
  pending: "bg-yellow-600/20 text-yellow-500 border-yellow-600/30",
};

const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  in_progress: { label: "In Progress", className: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30" },
  resolved: { label: "Resolved", className: "bg-green-600/20 text-green-400 border-green-600/30" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Credential Field Component ─────────────────────────────────────────────
function CredentialField({
  label,
  value,
  mono = true,
  sensitive = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  sensitive?: boolean;
}) {
  const [visible, setVisible] = useState(!sensitive);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <code className={`text-xs truncate max-w-[280px] ${mono ? "font-mono" : ""}`}>
          {sensitive && !visible ? "••••••••••••" : value}
        </code>
        {sensitive && (
          <button
            onClick={() => setVisible(!visible)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground p-0.5"
        >
          {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

// ─── Service Status Badge ───────────────────────────────────────────────────
function ServiceBadge({
  name,
  port,
  active,
}: {
  name: string;
  port: number;
  active: boolean | undefined;
}) {
  if (active === undefined) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <CircleDot className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">
          {name} <span className="font-mono">:{port}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {active ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500" />
      )}
      <span className={active ? "text-foreground" : "text-red-400"}>
        {name} <span className="font-mono">:{port}</span>
      </span>
    </div>
  );
}

// ─── Resource Gauge ─────────────────────────────────────────────────────────
function ResourceGauge({
  label,
  percent,
  detail,
}: {
  label: string;
  percent: number;
  detail: string;
}) {
  const color =
    percent > 90
      ? "bg-red-500"
      : percent > 70
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{percent.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border-border">
      <CardHeader
        className="flex flex-row items-center justify-between pb-2 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {badge}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function AdminCustomerDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [checkPendingRef = { current: false }, setActionLoading] = useState<string | null>(null);
  const [logsData, setLogsData] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${userId}/full`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/services`);
      const json = await res.json();
      setServices(json);
    } catch {
      toast.error("Failed to check services");
    } finally {
      setServicesLoading(false);
    }
  };

  const runAction = async (action: string) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (action === "view_logs") {
        setLogsData(json.output || "No logs");
        setLogsOpen(true);
      } else if (json.success) {
        toast.success(`Action ${action} completed`);
        // Re-check services after action
        setTimeout(fetchServices, 2000);
      } else {
        toast.error(json.error || "Action failed");
      }
    } catch {
      toast.error("Failed to run action");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "confirm") return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to delete");
        return;
      }
      toast.success("Customer deleted");
      router.push("/admin/customers");
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  const { customer, subscription, vps, model, userAgents, channels, webhooks, apiKeys, tickets, payments, mcTasks, authMeta } = data;
  const deployedAgents = userAgents.filter((a) => a.deployed);
  const plan = subscription?.plan || "none";
  const isUltra = plan === "ultra" || plan === "enterprise";

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" onClick={() => router.push("/admin/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Customers
          </Button>
          <h1 className="text-2xl font-bold">{customer.name || "Unnamed"}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-muted-foreground">{customer.email}</span>
            <Badge className={PLAN_COLORS[plan] || "bg-muted text-muted-foreground"}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </Badge>
            {subscription && (
              <Badge className={STATUS_COLORS[subscription.status] || ""}>
                {subscription.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ID: <code className="font-mono">{customer.id}</code> · Joined {formatDate(customer.created_at)}
            {authMeta?.last_sign_in_at && ` · Last login ${formatDateTime(authMeta.last_sign_in_at)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {vps?.openclaw_dashboard_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={vps.openclaw_dashboard_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Dashboard
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ─── 3.1 Profile ──────────────────────────────────────────────── */}
      <Section title="Profile & Account" icon={User}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{customer.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{customer.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="font-medium capitalize">{customer.role}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(customer.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email Verified</p>
            <p className="font-medium">
              {authMeta?.email_confirmed_at ? (
                <span className="text-green-500">Yes</span>
              ) : (
                <span className="text-yellow-500">No</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Login</p>
            <p className="font-medium">
              {authMeta?.last_sign_in_at ? formatDateTime(authMeta.last_sign_in_at) : "Never"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">User ID</p>
            <p className="font-mono text-xs">{customer.id.slice(0, 16)}...</p>
          </div>
        </div>
      </Section>

      {/* ─── 3.2 Subscription ─────────────────────────────────────────── */}
      <Section
        title="Subscription & Billing"
        icon={CreditCard}
        badge={
          subscription ? (
            <Badge className={PLAN_COLORS[subscription.plan] || ""}>
              ${subscription.price}/{subscription.billing_cycle === "annual" ? "yr" : "mo"}
            </Badge>
          ) : undefined
        }
      >
        {subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-medium capitalize">{subscription.plan}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cycle</p>
                <p className="font-medium capitalize">{subscription.billing_cycle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-medium">${Number(subscription.price).toLocaleString()}</p>
              </div>
              {subscription.started_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="font-medium">{formatDate(subscription.started_at)}</p>
                </div>
              )}
              {subscription.expires_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-medium">{formatDate(subscription.expires_at)}</p>
                </div>
              )}
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Payment History</p>
                <div className="space-y-1">
                  {payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{formatDate(p.created_at)}</span>
                      <span className="font-medium">${Number(p.amount).toLocaleString()}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No subscription</p>
        )}
      </Section>

      {/* ─── 3.3 VPS Details ──────────────────────────────────────────── */}
      <Section
        title="VPS Instance"
        icon={Server}
        badge={
          vps ? (
            <Badge
              className={
                vps.status === "running"
                  ? "bg-green-600/20 text-green-500 border-green-600/30"
                  : vps.status === "stopped"
                  ? "bg-red-600/20 text-red-500 border-red-600/30"
                  : "bg-yellow-600/20 text-yellow-500 border-yellow-600/30"
              }
            >
              {vps.status}
            </Badge>
          ) : undefined
        }
      >
        {vps ? (
          <div className="space-y-4">
            {/* Specs */}
            {vps.cpu_cores && (
              <p className="text-xs text-muted-foreground">
                {vps.cpu_cores} vCPU · {vps.ram_gb}GB RAM · {vps.storage_gb}GB SSD
                {vps.bandwidth_tb ? ` · ${vps.bandwidth_tb}TB BW` : ""}
              </p>
            )}

            {/* Credentials */}
            <div className="border border-border p-3 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Network & SSH</p>
              <CredentialField label="IP Address" value={vps.ip_address} />
              <CredentialField label="Hostname" value={vps.hostname} />
              <CredentialField label="SSH User" value={vps.ssh_user} />
              <CredentialField label="SSH Password" value={vps.ssh_password} sensitive />
              <CredentialField label="SSH Port" value={vps.ssh_port?.toString()} />
              <CredentialField
                label="Quick SSH"
                value={vps.ip_address ? `ssh ${vps.ssh_user}@${vps.ip_address} -p ${vps.ssh_port || 22}` : null}
              />
            </div>

            <div className="border border-border p-3 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Dashboard Credentials</p>
              <CredentialField label="URL" value={vps.openclaw_dashboard_url} />
              <CredentialField label="Username" value={vps.dashboard_username} />
              <CredentialField label="Password" value={vps.dashboard_password} sensitive />
            </div>

            <div className="border border-border p-3 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Internal</p>
              <CredentialField label="Data API Token" value={vps.data_api_token} sensitive />
              <CredentialField label="Hostinger VM ID" value={vps.hostinger_vm_id?.toString()} />
            </div>

            {/* Services & Resources */}
            <div className="border border-border p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">Services & Resources</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={fetchServices}
                  disabled={servicesLoading}
                >
                  {servicesLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Check
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <ServiceBadge name="OpenClaw" port={18789} active={services?.services?.openclaw} />
                <ServiceBadge name="Nginx" port={443} active={services?.services?.nginx} />
                <ServiceBadge name="Embeddings" port={5555} active={services?.services?.embeddings} />
                <ServiceBadge name="Data API" port={5556} active={services?.services?.dataApi} />
              </div>

              {services?.resources && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
                  <ResourceGauge
                    label="CPU"
                    percent={services.resources.cpu_percent}
                    detail=""
                  />
                  <ResourceGauge
                    label="RAM"
                    percent={services.resources.ram_percent}
                    detail={`${services.resources.ram_used_mb}MB / ${services.resources.ram_total_mb}MB`}
                  />
                  <ResourceGauge
                    label="Disk"
                    percent={parseFloat(services.resources.disk_percent) || 0}
                    detail={`${services.resources.disk_used} / ${services.resources.disk_total}`}
                  />
                </div>
              )}

              {services?.resources && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>Uptime: {formatUptime(services.resources.uptime_seconds)}</span>
                  {services.resources.ssl_expiry && (
                    <span>SSL expires: {services.resources.ssl_expiry}</span>
                  )}
                </div>
              )}

              {services?.error && (
                <p className="text-xs text-red-400 mt-2">{services.error}</p>
              )}
            </div>

            {/* VPS Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("restart_openclaw")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "restart_openclaw" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCw className="h-3 w-3 mr-1" />
                )}
                Restart OpenClaw
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("restart_nginx")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "restart_nginx" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCw className="h-3 w-3 mr-1" />
                )}
                Restart Nginx
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("restart_embeddings")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "restart_embeddings" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCw className="h-3 w-3 mr-1" />
                )}
                Restart Embeddings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("restart_data_api")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "restart_data_api" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCw className="h-3 w-3 mr-1" />
                )}
                Restart Data API
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("stop_openclaw")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "stop_openclaw" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Square className="h-3 w-3 mr-1" />
                )}
                Stop
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("start_openclaw")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "start_openclaw" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Start
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAction("view_logs")}
                disabled={!!checkPendingRef = { current: false }}
              >
                {checkPendingRef = { current: false } === "view_logs" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Terminal className="h-3 w-3 mr-1" />
                )}
                View Logs
              </Button>
            </div>

            {/* Logs Dialog */}
            <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>VPS Logs — {vps.hostname || vps.ip_address}</DialogTitle>
                </DialogHeader>
                <div className="bg-black/50 p-4 font-mono text-xs leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap">
                  {logsData || "No logs"}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No VPS provisioned</p>
        )}
      </Section>

      {/* ─── 3.4 Model Configuration ──────────────────────────────────── */}
      <Section title="Model Configuration" icon={Brain}>
        {model ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Current Model</p>
              <p className="font-medium">{model.current_model || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Context Limit</p>
              <p className="font-medium">
                {model.context_limit ? `${Math.round(model.context_limit / 1000)}K` : "—"}
              </p>
            </div>
            {model.requested_model && (
              <div>
                <p className="text-xs text-muted-foreground">Pending Change</p>
                <p className="font-medium text-yellow-500">{model.requested_model}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Changes This Cycle</p>
              <p className="font-medium">{model.changes_this_cycle ?? 0} / 5</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No model configured</p>
        )}
      </Section>

      {/* ─── 3.5 Agents ───────────────────────────────────────────────── */}
      <Section
        title="Agents"
        icon={Bot}
        badge={
          deployedAgents.length > 0 ? (
            <Badge variant="outline" className="text-xs">{deployedAgents.length} deployed</Badge>
          ) : undefined
        }
      >
        {userAgents.length > 0 ? (
          <div className="space-y-2">
            {userAgents.map((ua) => (
              <div
                key={ua.id}
                className="flex items-center justify-between p-2 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{ua.agents?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {ua.agents?.category} · {ua.agents?.slug}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    ua.deployed
                      ? "bg-green-600/20 text-green-500 border-green-600/30"
                      : "bg-muted text-muted-foreground border-border"
                  }
                >
                  {ua.deployed ? "Deployed" : "Not deployed"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No agents configured</p>
        )}
      </Section>

      {/* ─── 3.6 Channels ─────────────────────────────────────────────── */}
      <Section
        title="Channels"
        icon={MessageSquare}
        badge={
          channels.length > 0 ? (
            <Badge variant="outline" className="text-xs">{channels.length} connected</Badge>
          ) : undefined
        }
      >
        {channels.length > 0 ? (
          <div className="space-y-2">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between p-2 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium capitalize">{ch.channel_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(ch.created_at)}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    ch.status === "connected"
                      ? "bg-green-600/20 text-green-500 border-green-600/30"
                      : "bg-muted text-muted-foreground border-border"
                  }
                >
                  {ch.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No channels connected</p>
        )}
      </Section>

      {/* ─── 3.9 Webhooks ─────────────────────────────────────────────── */}
      <Section
        title="Webhooks"
        icon={Webhook}
        defaultOpen={false}
        badge={
          webhooks.length > 0 ? (
            <Badge variant="outline" className="text-xs">{webhooks.length}</Badge>
          ) : undefined
        }
      >
        {webhooks.length > 0 ? (
          <div className="space-y-2">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-2 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono truncate max-w-[400px]">{wh.url}</code>
                  <Badge
                    className={
                      wh.enabled
                        ? "bg-green-600/20 text-green-500 border-green-600/30"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {wh.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Events: {wh.events?.join(", ") || "all"}
                </p>
                {wh.secret && (
                  <CredentialField label="Secret" value={wh.secret} sensitive />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No webhooks configured</p>
        )}
      </Section>

      {/* ─── 3.10 API Keys ────────────────────────────────────────────── */}
      <Section
        title="API Keys"
        icon={Key}
        defaultOpen={false}
        badge={
          apiKeys.length > 0 ? (
            <Badge variant="outline" className="text-xs">{apiKeys.length}</Badge>
          ) : undefined
        }
      >
        {apiKeys.length > 0 ? (
          <div className="space-y-2">
            {apiKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-2 border border-border">
                <div>
                  <p className="text-sm font-medium">{k.name || "Unnamed key"}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {k.key_hash?.slice(0, 16)}...
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Created {formatDate(k.created_at)}</p>
                  {k.last_used_at && <p>Last used {formatDateTime(k.last_used_at)}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No API keys</p>
        )}
      </Section>

      {/* ─── 3.11 Support Tickets ─────────────────────────────────────── */}
      <Section
        title="Support Tickets"
        icon={Ticket}
        defaultOpen={false}
        badge={
          tickets.filter((t) => t.status === "open" || t.status === "in_progress").length > 0 ? (
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">
              {tickets.filter((t) => t.status === "open" || t.status === "in_progress").length} open
            </Badge>
          ) : undefined
        }
      >
        {tickets.length > 0 ? (
          <div className="space-y-1">
            {tickets.map((t) => {
              const ts = TICKET_STATUS[t.status] || TICKET_STATUS.open;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/tickets/${t.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm truncate flex-1">{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`${ts.className} text-[10px]`}>{ts.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No support tickets</p>
        )}
      </Section>

      {/* ─── 3.13 Usage Analytics ─────────────────────────────────────── */}
      <Section title="Usage Analytics" icon={BarChart3} defaultOpen={false}>
        <p className="text-sm text-muted-foreground">
          Usage data is on the customer&apos;s VPS. Click &quot;Check Services&quot; above to verify the Data API is running,
          then visit their dashboard for detailed analytics.
        </p>
      </Section>

      {/* ─── 3.14 Mission Control (Ultra only) ────────────────────────── */}
      {isUltra && (
        <Section title="Mission Control" icon={Activity} defaultOpen={false}>
          {mcTasks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                {mcTasks.length} tasks total
              </p>
              {mcTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 border border-border">
                  <span className="text-sm truncate">{t.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{t.status}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{t.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No MC tasks</p>
          )}
        </Section>
      )}

      {/* ─── 3.15 Danger Zone ─────────────────────────────────────────── */}
      <Card className="border-red-600/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-medium text-red-500">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Dialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); setDeleteConfirm(""); }}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete {customer.name || "Customer"}?</DialogTitle>
                  <DialogDescription>
                    This permanently deletes <strong>{customer.email}</strong> and all data:
                    subscription, VPS, agents, channels, tickets, chat history.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <p className="text-sm">
                    Type <code className="bg-muted px-1.5 py-0.5 text-xs font-mono">confirm</code> to proceed:
                  </p>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type confirm"
                    className="font-mono"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteConfirm !== "confirm" || deleting}>
                    {deleting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    Delete Permanently
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
