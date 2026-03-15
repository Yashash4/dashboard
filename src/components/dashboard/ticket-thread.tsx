"use client";

import { useState, useRef, useEffect } from "react";
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
  Star,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTicketNumber } from "@/lib/format-ticket";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  satisfaction_rating?: number | null;
  category?: string | null;
}

const RESPONSE_TIME: Record<string, string> = {
  high: "Expected response: within 4 hours",
  medium: "Expected response: within 12 hours",
  low: "Expected response: within 24 hours",
};

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

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  general: { label: "General", className: "border-muted-foreground/30 text-muted-foreground" },
  billing: { label: "Billing", className: "border-emerald-600/50 text-emerald-500" },
  technical: { label: "Technical", className: "border-blue-600/50 text-blue-500" },
  account: { label: "Account", className: "border-purple-600/50 text-purple-500" },
  channels: { label: "Channels", className: "border-cyan-600/50 text-cyan-500" },
  agents: { label: "Agents", className: "border-orange-600/50 text-orange-500" },
  feature: { label: "Feature Request", className: "border-pink-600/50 text-pink-500" },
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
  const [reopening, setReopening] = useState(false);
  const [rating, setRating] = useState<number | null>(ticket.satisfaction_rating ?? null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleRate = async (value: number) => {
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit rating");
        return;
      }
      setRating(value);
      toast.success("Thank you for your feedback!");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <h1 className="text-2xl font-bold mb-2">
          <span className="text-muted-foreground font-mono text-base mr-2">
            {formatTicketNumber(ticket.id)}
          </span>
          {ticket.subject}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
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
          <span className="text-sm text-muted-foreground">
            Created{" "}
            {new Date(ticket.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          {canReply && RESPONSE_TIME[ticket.priority] && (
            <span className="text-xs text-muted-foreground border border-border px-2 py-0.5">
              {RESPONSE_TIME[ticket.priority]}
            </span>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground border border-border p-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-blue-500" />
          <span>
            Created{" "}
            {new Date(ticket.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        {(ticketStatus === "resolved" || ticketStatus === "closed") && ticket.updated_at && (
          <>
            <span className="text-muted-foreground/40">&rarr;</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>
                Resolved{" "}
                {new Date(ticket.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </>
        )}
        {ticketStatus === "open" && ticket.updated_at && new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime() > 60000 && (
          <>
            <span className="text-muted-foreground/40">&rarr;</span>
            <div className="flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5 text-yellow-500" />
              <span>Reopened</span>
            </div>
          </>
        )}
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
              <div className="text-sm prose prose-sm prose-invert max-w-none prose-p:my-1 prose-a:text-primary">
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Satisfaction Rating */}
      {ticketStatus === "resolved" && (
        <div className="border border-border p-4 text-center space-y-2">
          {rating ? (
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <Star
                    key={v}
                    className={`h-5 w-5 ${v <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">How was your support experience?</p>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    disabled={ratingSubmitting}
                    onClick={() => handleRate(v)}
                    className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                  >
                    <Star className="h-6 w-6 text-muted-foreground hover:fill-yellow-500 hover:text-yellow-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reply Box */}
      {canReply ? (
        <div className="border border-border p-4 space-y-3">
          {/* Canned responses */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "Can you provide more details?",
              "Could you share a screenshot?",
              "This issue is resolved on my end.",
              "The issue has returned.",
              "Any update on this?",
            ].map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => setReply((prev) => prev ? `${prev}\n${text}` : text)}
                className="text-[11px] px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Type your reply..."
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Supports **bold**, *italic*, `code`, and [links](url)
          </p>
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
          <p className="text-sm mb-3">This ticket is {ticketStatus}. No further replies can be added.</p>
          <Button
            variant="outline"
            size="sm"
            disabled={reopening}
            onClick={async () => {
              setReopening(true);
              try {
                const res = await fetch(`/api/tickets/${ticket.id}/reopen`, {
                  method: "POST",
                });
                const data = await res.json();
                if (!res.ok) {
                  toast.error(data.error || "Failed to reopen ticket");
                  return;
                }
                setTicketStatus("open");
                toast.success("Ticket reopened");
              } catch {
                toast.error("Failed to reopen ticket");
              } finally {
                setReopening(false);
              }
            }}
          >
            {reopening ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CircleDot className="mr-2 h-4 w-4" />
            )}
            Reopen Ticket
          </Button>
        </div>
      )}
    </div>
  );
}
