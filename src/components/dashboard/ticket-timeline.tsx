"use client";

import { CircleDot, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";

interface Props {
  ticketStatus: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}

interface TimelineEvent {
  icon: typeof CircleDot;
  iconColor: string;
  label: string;
  date: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Shows a vertical timeline of ticket status changes.
 * Uses existing ticket fields (created_at, status, updated_at) to infer events.
 * No separate status history table needed — derives from ticket state.
 */
export function TicketTimeline({ ticketStatus, createdAt, updatedAt, resolvedAt }: Props) {
  const events: TimelineEvent[] = [];

  // Created
  events.push({
    icon: CircleDot,
    iconColor: "text-blue-500",
    label: "Ticket created",
    date: createdAt,
  });

  // In progress (if status changed from open)
  if (
    ticketStatus === "in_progress" ||
    ticketStatus === "resolved" ||
    ticketStatus === "closed"
  ) {
    events.push({
      icon: Clock,
      iconColor: "text-yellow-500",
      label: "In progress",
      date: updatedAt || createdAt,
    });
  }

  // Resolved
  if (ticketStatus === "resolved" || ticketStatus === "closed") {
    events.push({
      icon: CheckCircle2,
      iconColor: "text-green-500",
      label: ticketStatus === "closed" ? "Closed" : "Resolved",
      date: resolvedAt || updatedAt || createdAt,
    });

    // Show auto-delete countdown for resolved tickets
    if (ticketStatus === "resolved" && resolvedAt) {
      const resolvedDate = new Date(resolvedAt);
      const deleteDate = new Date(resolvedDate.getTime() + 48 * 60 * 60 * 1000);
      const hoursRemaining = Math.max(
        0,
        Math.round((deleteDate.getTime() - Date.now()) / (60 * 60 * 1000))
      );

      if (hoursRemaining > 0) {
        events.push({
          icon: XCircle,
          iconColor: "text-muted-foreground",
          label: `Auto-deletes in ${hoursRemaining}h`,
          date: deleteDate.toISOString(),
        });
      }
    }
  }

  // Reopened (if status is open but ticket was previously resolved — inferred from updatedAt > createdAt significantly)
  if (ticketStatus === "open" && updatedAt && resolvedAt) {
    events.push({
      icon: RotateCcw,
      iconColor: "text-blue-500",
      label: "Reopened",
      date: updatedAt,
    });
  }

  return (
    <div className="border border-border p-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Timeline
      </h3>
      <div className="space-y-0">
        {events.map((event, i) => {
          const Icon = event.icon;
          const isLast = i === events.length - 1;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Icon className={`h-4 w-4 shrink-0 ${event.iconColor}`} />
                {!isLast && (
                  <div className="w-px h-6 bg-border" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium leading-none">{event.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDate(event.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
