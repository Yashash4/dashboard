"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
}

interface Message {
  id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

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

export function AdminTicketThread({
  ticket: initialTicket,
  messages: initialMessages,
}: {
  ticket: Ticket;
  messages: Message[];
}) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;

  const handleReply = async () => {
    if (!reply.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send reply");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender_role: "admin",
          message: reply.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setReply("");
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async (
    field: "status" | "priority",
    value: string
  ) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || `Failed to update ${field}`);
        return;
      }

      setTicket((prev) => ({ ...prev, [field]: value }));
      toast.success(
        `${field.charAt(0).toUpperCase() + field.slice(1)} updated`
      );
    } catch {
      toast.error(`Failed to update ${field}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => router.push("/admin/tickets")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>
        <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${status.className} text-xs`}>
            {status.label}
          </Badge>
          <Badge
            variant="outline"
            className={`${priority.className} text-xs`}
          >
            {priority.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            by {ticket.user_name || ticket.user_email}
          </span>
          <span className="text-sm text-muted-foreground">
            {new Date(ticket.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="flex items-end gap-4 border border-border p-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={ticket.status}
            onValueChange={(v) => handleUpdateTicket("status", v)}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select
            value={ticket.priority}
            onValueChange={(v) => handleUpdateTicket("priority", v)}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Message Thread */}
      <div className="space-y-3">
        {messages.map((msg) => {
          const isCustomer = msg.sender_role === "customer";
          return (
            <div
              key={msg.id}
              className={`border border-border p-4 ${
                isCustomer
                  ? "mr-8 bg-muted/50"
                  : "ml-8 bg-primary/5 border-primary/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                  {isCustomer
                    ? ticket.user_name || ticket.user_email
                    : "Admin"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          );
        })}
      </div>

      {/* Reply Box */}
      <div className="border border-border p-4 space-y-3">
        <Textarea
          placeholder="Type admin reply..."
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={handleReply} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
