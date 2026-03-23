"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Inbox,
  Loader2,
  Ban,
  CheckCircle2,
  X,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vpsStatusConfig } from "@/lib/vps-status";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
  subscriptions: { plan: string; status: string; price?: number }[] | null;
  vps_instances: { status: string; ip_address: string | null; hostname?: string | null }[] | null;
}

const PLAN_CONFIG: Record<string, { label: string; className: string }> = {
  starter: { label: "Starter", className: "bg-green-600/20 text-green-500 border-green-600/30" },
  pro: { label: "Pro", className: "bg-[#ffe0c2]/20 text-[#ffe0c2] border-[#ffe0c2]/30" },
  ultra: { label: "Ultra", className: "bg-amber-600/20 text-amber-400 border-amber-600/30" },
  enterprise: { label: "Enterprise", className: "bg-teal-600/20 text-teal-400 border-teal-600/30" },
};

type SortField = "created_at" | "name" | "plan" | "revenue";
type SortDir = "asc" | "desc";

export function AdminCustomers({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vpsFilter, setVpsFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      // Text search
      if (search) {
        const q = search.toLowerCase();
        const sub = Array.isArray(c.subscriptions) ? c.subscriptions[0] : c.subscriptions;
        const vps = Array.isArray(c.vps_instances) ? c.vps_instances[0] : c.vps_instances;
        const matches =
          c.name?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          vps?.ip_address?.includes(q) ||
          (vps as any)?.hostname?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Plan filter
      if (planFilter !== "all") {
        const sub = Array.isArray(c.subscriptions) ? c.subscriptions[0] : c.subscriptions;
        if (sub?.plan !== planFilter) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const sub = Array.isArray(c.subscriptions) ? c.subscriptions[0] : c.subscriptions;
        if (sub?.status !== statusFilter) return false;
      }

      // VPS filter
      if (vpsFilter !== "all") {
        const vps = Array.isArray(c.vps_instances) ? c.vps_instances[0] : c.vps_instances;
        if (vpsFilter === "none" && vps) return false;
        if (vpsFilter !== "none" && vps?.status !== vpsFilter) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "plan": {
          const planOrder: Record<string, number> = { enterprise: 4, ultra: 3, pro: 2, starter: 1 };
          const aPlan = (Array.isArray(a.subscriptions) ? a.subscriptions[0] : a.subscriptions)?.plan || "";
          const bPlan = (Array.isArray(b.subscriptions) ? b.subscriptions[0] : b.subscriptions)?.plan || "";
          cmp = (planOrder[aPlan] || 0) - (planOrder[bPlan] || 0);
          break;
        }
        case "revenue": {
          const aPrice = Number((Array.isArray(a.subscriptions) ? a.subscriptions[0] : a.subscriptions)?.price) || 0;
          const bPrice = Number((Array.isArray(b.subscriptions) ? b.subscriptions[0] : b.subscriptions)?.price) || 0;
          cmp = aPrice - bPrice;
          break;
        }
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [customers, search, planFilter, statusFilter, vpsFilter, sortField, sortDir]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleBulkAction = async (action: "suspend" | "activate") => {
    if (selectedIds.size === 0) return;
    setBulkLoading(action);
    try {
      const res = await fetch("/api/admin/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${action}`);
        return;
      }
      toast.success(`${data.count} customer${data.count !== 1 ? "s" : ""} ${action === "suspend" ? "suspended" : "activated"}`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setBulkLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Plan", "Status", "VPS Status", "IP", "Price", "Created"];
    const rows = filtered.map((c) => {
      const sub = Array.isArray(c.subscriptions) ? c.subscriptions[0] : c.subscriptions;
      const vps = Array.isArray(c.vps_instances) ? c.vps_instances[0] : c.vps_instances;
      return [
        c.name || "",
        c.email,
        sub?.plan || "",
        sub?.status || "",
        vps?.status || "none",
        vps?.ip_address || "",
        sub?.price?.toString() || "",
        new Date(c.created_at).toISOString().split("T")[0],
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clawhq-customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const hasFilters = planFilter !== "all" || statusFilter !== "all" || vpsFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Customers</h1>
          <p className="text-muted-foreground">
            {filtered.length} of {customers.length} customers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, IP, hostname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="ultra">Ultra</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={vpsFilter} onValueChange={setVpsFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="VPS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All VPS</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
            <SelectItem value="none">No VPS</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => { setPlanFilter("all"); setStatusFilter("all"); setVpsFilter("all"); }}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 text-sm">
            <span className="font-medium">{selectedIds.size} selected</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleBulkAction("suspend")}
              disabled={!!bulkLoading}
            >
              {bulkLoading === "suspend" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
              Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleBulkAction("activate")}
              disabled={!!bulkLoading}
            >
              {bulkLoading === "activate" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedIds(new Set())}
              disabled={!!bulkLoading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {search || hasFilters ? "No customers match" : "No customers yet"}
          </h2>
          <p className="text-muted-foreground">
            {search || hasFilters
              ? "Try adjusting your search or filters."
              : "Customers will appear here once they sign up."}
          </p>
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    Name
                    {sortField === "name" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Email
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
                    onClick={() => toggleSort("plan")}
                  >
                    Plan
                    {sortField === "plan" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  VPS
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
                    onClick={() => toggleSort("revenue")}
                  >
                    Revenue
                    {sortField === "revenue" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
                    onClick={() => toggleSort("created_at")}
                  >
                    Joined
                    {sortField === "created_at" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const sub = Array.isArray(customer.subscriptions)
                  ? customer.subscriptions[0]
                  : customer.subscriptions;
                const vps = Array.isArray(customer.vps_instances)
                  ? customer.vps_instances[0]
                  : customer.vps_instances;

                const plan = sub?.plan || "none";
                const planConfig = PLAN_CONFIG[plan] || {
                  label: "None",
                  className: "bg-muted text-muted-foreground border-border",
                };

                const vpsStatus = vps?.status || "none";
                const vpsConfig = vpsStatusConfig[vpsStatus] || {
                  label: "No VPS",
                  className: "border-muted-foreground/30 text-muted-foreground",
                };

                return (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") router.push("/admin/customers/" + customer.id); }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(customer.id)}
                        onCheckedChange={() => toggleSelect(customer.id)}
                      />
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <span className="text-sm font-medium">{customer.name || "—"}</span>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <span className="text-sm text-muted-foreground">{customer.email}</span>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <Badge className={`${planConfig.className} text-xs`}>{planConfig.label}</Badge>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      {vps ? (
                        <div className="flex items-center gap-2">
                          <Badge className={`${vpsConfig.className} text-xs`}>{vpsConfig.label}</Badge>
                          {vps.ip_address && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {vps.ip_address}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs">
                          No VPS
                        </Badge>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <span className="text-sm font-mono">
                        {sub?.price ? `$${Number(sub.price).toLocaleString()}` : "—"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(customer.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
