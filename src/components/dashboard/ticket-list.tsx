"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Inbox,
  Loader2,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTicketNumber } from "@/lib/format-ticket";

interface TicketMessage {
  sender_role: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string | null;
  created_at: string;
  user_read_at?: string | null;
  ticket_messages?: TicketMessage[];
}

function getLastReply(messages?: TicketMessage[]) {
  if (!messages || messages.length === 0) return null;
  const sorted = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_TABS = ["all", "open", "in_progress", "resolved", "closed"] as const;

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
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
  low: { label: "Low", className: "border-muted-foreground/30 text-muted-foreground" },
  medium: { label: "Medium", className: "border-yellow-600/50 text-yellow-500" },
  high: { label: "High", className: "border-red-600/50 text-red-500" },
};

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  general: { label: "General", className: "border-muted-foreground/30 text-muted-foreground" },
  billing: { label: "Billing", className: "border-emerald-600/50 text-emerald-500" },
  technical: { label: "Technical", className: "border-blue-600/50 text-blue-500" },
  account: { label: "Account", className: "border-purple-600/50 text-purple-500" },
  channels: { label: "Channels", className: "border-cyan-600/50 text-cyan-500" },
  agents: { label: "Agents", className: "border-orange-600/50 text-orange-500" },
  feature: { label: "Feature Request", className: "border-pink-600/50 text-pink-500" },
};

function formatTabLabel(tab: string) {
  if (tab === "all") return "All";
  if (tab === "in_progress") return "In Progress";
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

export function TicketList({
  tickets: initialTickets,
  totalCount = 0,
  pageSize = 20,
}: {
  tickets: Ticket[];
  totalCount?: number;
  pageSize?: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [tickets, setTickets] = useState(initialTickets);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const hasMore = tickets.length < totalCount;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/tickets/list?offset=${tickets.length}&limit=${pageSize}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.tickets?.length) {
          setTickets((prev) => [...prev, ...data.tickets]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = useMemo(() => {
    let result = filter === "all"
      ? tickets
      : tickets.filter((t) => t.status === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.subject.toLowerCase().includes(q) ||
        formatTicketNumber(t.id).toLowerCase().includes(q)
      );
    }

    return result;
  }, [tickets, filter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Support</h1>
          <p className="text-muted-foreground">Get help with your account.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/support/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {STATUS_TABS.map((tab) => {
            const count = tab === "all"
              ? tickets.length
              : tickets.filter((t) => t.status === tab).length;
            return (
              <TabsTrigger key={tab} value={tab}>
                {formatTabLabel(tab)} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {searchQuery.trim() && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No tickets found</h2>
          <p className="text-muted-foreground mb-4">
            {filter === "all"
              ? "You haven't created any support tickets yet."
              : `No ${formatTabLabel(filter).toLowerCase()} tickets.`}
          </p>
          {filter === "all" && (
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/support/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
            const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
            const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
            const lastReply = getLastReply(ticket.ticket_messages);
            // Show "New reply" only if last message is from admin AND user hasn't read it since
            const hasUnreadAdminReply = lastReply?.sender_role === "admin" && (
              !ticket.user_read_at || new Date(lastReply.created_at) > new Date(ticket.user_read_at)
            );

            return (
              <button
                key={ticket.id}
                onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                className="w-full text-left border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        <span className="text-muted-foreground font-mono text-xs mr-1.5">
                          {formatTicketNumber(ticket.id)}
                        </span>
                        {ticket.subject}
                      </h3>
                      {hasUnreadAdminReply && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          New reply
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`${status.className} text-xs`}>
                        {status.label}
                      </Badge>
                      <Badge variant="outline" className={`${priority.className} text-xs`}>
                        {priority.label}
                      </Badge>
                      {ticket.category && CATEGORY_CONFIG[ticket.category] && (
                        <Badge variant="outline" className={`${CATEGORY_CONFIG[ticket.category].className} text-xs`}>
                          {CATEGORY_CONFIG[ticket.category].label}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {lastReply && (
                        <span className="text-xs text-muted-foreground">
                          &middot; Last reply: {lastReply.sender_role === "admin" ? "Support" : "You"},{" "}
                          {timeAgo(lastReply.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {hasMore && filter === "all" && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Load More ({totalCount - tickets.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
