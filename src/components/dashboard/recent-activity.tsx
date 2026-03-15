"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  MessageSquare,
  Ticket,
  Rocket,
  Unplug,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  type: string;
  message: string;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bot> = {
  agent_deployed: Rocket,
  agent_undeployed: Bot,
  channel_connected: MessageSquare,
  channel_disconnected: Unplug,
  ticket_created: Ticket,
  ticket_resolved: CheckCircle2,
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentActivity() {
  const { data, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/activity");
      if (!res.ok) return [];
      const data = await res.json();
      return data.activities || [];
    },
    staleTime: 60_000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No recent activity. Deploy an agent or connect a channel to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 10).map((item, i) => {
              const Icon = TYPE_ICONS[item.type] || Clock;
              return (
                <div key={i} className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.message}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
