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
  Lock,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

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

export function TicketThread({
  ticket,
  messages: initialMessages,
}: {
  ticket: Ticket;
  messages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);

  const status = STATUS_CONFIG[ticketStatus] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
  const canReply = ticketStatus === "open" || ticketStatus === "in_progress";

  const handleResolve = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/resolve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resolve ticket");
        return;
      }
      setTicketStatus("resolved");
      toast.success("Ticket marked as resolved");
    } catch {
      toast.error("Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send reply");
        return;
      }

      // Add message to local state
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender_role: "customer",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => router.push("/dashboard/support")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>
        <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
        <div className="flex items-center gap-2">
          <Badge className={`${status.className} text-xs`}>
            {status.label}
          </Badge>
          <Badge variant="outline" className={`${priority.className} text-xs`}>
            {priority.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Created{" "}
            {new Date(ticket.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
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
                  ? "ml-8 bg-primary/5 border-primary/20"
                  : "mr-8 bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                  {isCustomer ? "You" : "Support"}
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
      {canReply ? (
        <div className="border border-border p-4 space-y-3">
          <Textarea
            placeholder="Type your reply..."
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Resolved
            </Button>
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
      ) : (
        <div className="border border-border p-4 text-center text-muted-foreground">
          <Lock className="h-5 w-5 mx-auto mb-2" />
          <p className="text-sm">This ticket is {ticket.status}. No further replies can be added.</p>
        </div>
      )}
    </div>
  );
}
