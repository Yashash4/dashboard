"use client";

import { useState, useMemo } from "react";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Inbox,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_TICKETS = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    subject: "Cannot connect WhatsApp channel",
    status: "open",
    priority: "high",
    category: "channels",
    created_at: "2026-03-20T14:30:00Z",
    user_read_at: "2026-03-21T08:00:00Z",
    ticket_messages: [
      { sender_role: "user", created_at: "2026-03-20T14:30:00Z" },
      { sender_role: "admin", created_at: "2026-03-20T15:00:00Z" },
      { sender_role: "user", created_at: "2026-03-21T09:00:00Z" },
    ],
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    subject: "Agent response time is slow",
    status: "in_progress",
    priority: "medium",
    category: "agents",
    created_at: "2026-03-18T10:00:00Z",
    user_read_at: null,
    ticket_messages: [
      { sender_role: "user", created_at: "2026-03-18T10:00:00Z" },
      { sender_role: "admin", created_at: "2026-03-18T12:00:00Z" },
    ],
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    subject: "How to upgrade from Starter to Pro?",
    status: "resolved",
    priority: "low",
    category: "billing",
    created_at: "2026-03-10T08:00:00Z",
    user_read_at: "2026-03-10T10:30:00Z",
    ticket_messages: [
      { sender_role: "user", created_at: "2026-03-10T08:00:00Z" },
      { sender_role: "admin", created_at: "2026-03-10T09:30:00Z" },
      { sender_role: "user", created_at: "2026-03-10T10:00:00Z" },
      { sender_role: "admin", created_at: "2026-03-10T10:15:00Z" },
    ],
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    subject: "VPS keeps going offline at night",
    status: "closed",
    priority: "high",
    category: "technical",
    created_at: "2026-03-05T16:00:00Z",
    user_read_at: "2026-03-08T09:00:00Z",
    ticket_messages: [
      { sender_role: "user", created_at: "2026-03-05T16:00:00Z" },
      { sender_role: "admin", created_at: "2026-03-06T09:00:00Z" },
      { sender_role: "user", created_at: "2026-03-06T10:00:00Z" },
      { sender_role: "admin", created_at: "2026-03-07T11:00:00Z" },
      { sender_role: "user", created_at: "2026-03-07T14:00:00Z" },
    ],
  },
];

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

function formatTicketNumber(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
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

function formatTabLabel(tab: string) {
  if (tab === "all") return "All";
  if (tab === "in_progress") return "In Progress";
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

function getLastReply(messages: { sender_role: string; created_at: string }[]) {
  if (!messages || messages.length === 0) return null;
  const sorted = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0];
}

export default function DemoSupportPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = filter === "all"
      ? DEMO_TICKETS
      : DEMO_TICKETS.filter((t) => t.status === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.subject.toLowerCase().includes(q) ||
        formatTicketNumber(t.id).toLowerCase().includes(q)
      );
    }

    return result;
  }, [filter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Support</h1>
          <p className="text-muted-foreground">Get help with your account.</p>
        </div>
        <Button disabled>
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
              ? DEMO_TICKETS.length
              : DEMO_TICKETS.filter((t) => t.status === tab).length;
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
            <Button variant="outline" disabled>
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
            const hasUnreadAdminReply = lastReply?.sender_role === "admin" && (
              !ticket.user_read_at || new Date(lastReply.created_at) > new Date(ticket.user_read_at)
            );

            return (
              <button
                key={ticket.id}
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
        </div>
      )}
    </div>
  );
}
