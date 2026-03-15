"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusEvent {
  status: string;
  timestamp: string;
  label: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ChannelStatusHistory({
  channelType,
  status,
  configuredAt,
  healthStatus,
  lastHealthCheck,
  errorMessage,
}: {
  channelType: string;
  status: string;
  configuredAt: string | null;
  healthStatus?: string | null;
  lastHealthCheck?: string | null;
  errorMessage?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  // Build timeline events from available data
  const events: StatusEvent[] = [];

  if (configuredAt) {
    if (status === "connected") {
      events.push({
        status: "connected",
        timestamp: configuredAt,
        label: "Channel connected",
      });
    } else if (status === "disconnected") {
      events.push({
        status: "disconnected",
        timestamp: new Date().toISOString(),
        label: "Channel disconnected",
      });
      events.push({
        status: "connected",
        timestamp: configuredAt,
        label: "Channel was connected",
      });
    } else if (status === "pending") {
      events.push({
        status: "pending",
        timestamp: configuredAt,
        label: "Setup initiated",
      });
    }
  }

  if (lastHealthCheck && healthStatus) {
    const healthLabel =
      healthStatus === "healthy"
        ? "Health check passed"
        : healthStatus === "degraded"
          ? "Health check: degraded"
          : healthStatus === "down"
            ? "Health check: down"
            : "Health check: unknown";
    events.push({
      status: healthStatus === "healthy" ? "connected" : "disconnected",
      timestamp: lastHealthCheck,
      label: errorMessage ? `${healthLabel} — ${errorMessage}` : healthLabel,
    });
  }

  // Sort by timestamp descending, limit to 10
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const displayEvents = events.slice(0, 10);

  if (displayEvents.length === 0) return null;

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="mr-1 h-3 w-3" />
        ) : (
          <ChevronRight className="mr-1 h-3 w-3" />
        )}
        Status history
      </Button>

      {expanded && (
        <div className="mt-2 ml-1 space-y-0">
          {status === "connected" && configuredAt && (
            <p className="text-xs text-green-500 mb-2 font-medium">
              Connected since{" "}
              {new Date(configuredAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

            {displayEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-2 pb-2 relative">
                <Circle
                  className={`h-[11px] w-[11px] shrink-0 mt-0.5 fill-current ${
                    event.status === "connected"
                      ? "text-green-500"
                      : event.status === "pending"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">
                    {event.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {getRelativeTime(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
