"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Inbox, Loader2, Ban, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { vpsStatusConfig } from "@/lib/vps-status";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
  subscriptions: { plan: string; status: string }[] | null;
  vps_instances: { status: string; ip_address: string | null }[] | null;
}

const PLAN_CONFIG: Record<string, { label: string; className: string }> = {
  starter: {
    label: "Starter",
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
  pro: {
    label: "Pro",
    className: "bg-primary text-primary-foreground border-primary",
  },
  enterprise: {
    label: "Enterprise",
    className: "bg-purple-600 text-white border-purple-600",
  },
};

export function AdminCustomers({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  });

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
        body: JSON.stringify({
          action,
          userIds: Array.from(selectedIds),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${action}`);
        return;
      }

      toast.success(
        `${data.count} customer${data.count !== 1 ? "s" : ""} ${
          action === "suspend" ? "suspended" : "activated"
        }`
      );
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setBulkLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Customers</h1>
        <p className="text-muted-foreground">
          All customer accounts ({customers.length}).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
              {bulkLoading === "suspend" ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Ban className="h-3 w-3 mr-1" />
              )}
              Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleBulkAction("activate")}
              disabled={!!bulkLoading}
            >
              {bulkLoading === "activate" ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {search ? "No customers found" : "No customers yet"}
          </h2>
          <p className="text-muted-foreground">
            {search
              ? `No results for "${search}".`
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
                    checked={
                      filtered.length > 0 &&
                      selectedIds.size === filtered.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  VPS
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Joined
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
                  className:
                    "bg-secondary text-muted-foreground border-secondary",
                };

                const vpsStatus = vps?.status || "none";
                const vpsConfig = vpsStatusConfig[vpsStatus] || {
                  label: "No VPS",
                  className:
                    "border-muted-foreground/30 text-muted-foreground",
                };

                return (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(customer.id)}
                        onCheckedChange={() => toggleSelect(customer.id)}
                      />
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/customers/${customer.id}`)
                      }
                    >
                      <span className="text-sm font-medium">
                        {customer.name || "—"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/customers/${customer.id}`)
                      }
                    >
                      <span className="text-sm text-muted-foreground">
                        {customer.email}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/customers/${customer.id}`)
                      }
                    >
                      {plan === "none" ? (
                        <Badge
                          variant="outline"
                          className="border-muted-foreground/30 text-muted-foreground text-xs"
                        >
                          None
                        </Badge>
                      ) : (
                        <Badge className={`${planConfig.className} text-xs`}>
                          {planConfig.label}
                        </Badge>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/customers/${customer.id}`)
                      }
                    >
                      {vps ? (
                        <Badge className={`${vpsConfig.className} text-xs`}>
                          {vpsConfig.label}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted-foreground/30 text-muted-foreground text-xs"
                        >
                          No VPS
                        </Badge>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/customers/${customer.id}`)
                      }
                    >
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(customer.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
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
