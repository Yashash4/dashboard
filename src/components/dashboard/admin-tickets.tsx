"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  users: { name: string | null; email: string } | { name: string | null; email: string }[] | null;
}

const STATUS_TABS = [
  "all",
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  open: {
    label: "Open",
    className: "bg-blue-600 text-white border-blue-600",
    icon: CircleDot,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-600 text-white border-yellow-600",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-600 text-white border-green-600",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    className: "bg-secondary text-secondary-foreground border-secondary",
    icon: XCircle,
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "border-muted-foreground/30 text-muted-foreground",
  },
  medium: {
    label: "Medium",
    className: "border-yellow-600/50 text-yellow-500",
  },
  high: { label: "High", className: "border-red-600/50 text-red-500" },
};

function formatTabLabel(tab: string) {
  if (tab === "all") return "All";
  if (tab === "in_progress") return "In Progress";
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

function getUser(users: Ticket["users"]) {
  if (!users) return { name: null, email: "Unknown" };
  if (Array.isArray(users)) return users[0] || { name: null, email: "Unknown" };
  return users;
}

export function AdminTickets({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const user = getUser(t.users);
      return (
        t.subject.toLowerCase().includes(q) ||
        (user.name || "").toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Tickets</h1>
        <p className="text-muted-foreground">
          Manage all customer support tickets.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter} className="flex-1">
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {formatTabLabel(tab)}{" "}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({counts[tab]})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by subject, customer name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No tickets found</h2>
          <p className="text-muted-foreground">
            {search
              ? "No tickets match your search."
              : filter === "all"
              ? "No support tickets yet."
              : `No ${formatTabLabel(filter).toLowerCase()} tickets.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => {
                const status =
                  STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const priority =
                  PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                const user = getUser(ticket.users);

                return (
                  <tr
                    key={ticket.id}
                    onClick={() =>
                      router.push(`/admin/tickets/${ticket.id}`)
                    }
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium max-w-[300px] truncate">
                      {ticket.subject}
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="truncate">
                          {user.name || "Unnamed"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={`${status.className} text-xs`}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="outline"
                        className={`${priority.className} text-xs`}
                      >
                        {priority.label}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(ticket.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(ticket.updated_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
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
