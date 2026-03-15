"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, MessageSquare, Bot, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function LiveDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-live"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/live");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const metrics = [
    {
      label: "Active Conversations",
      value: data?.active_conversations ?? 0,
      icon: Activity,
      color: "text-green-400",
    },
    {
      label: "Messages / Minute",
      value: data?.messages_per_minute ?? 0,
      icon: MessageSquare,
      color: "text-blue-400",
    },
    {
      label: "Agents Online",
      value: data?.agents_online ?? 0,
      icon: Bot,
      color: "text-purple-400",
    },
    {
      label: "Avg Response Time",
      value: data?.avg_response_time_ms ? `${data.avg_response_time_ms}ms` : "—",
      icon: Clock,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">
          Live — updates every 5 seconds
        </span>
        {data?.timestamp && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {new Date(data.timestamp).toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{m.value}</p>
                  )}
                </div>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
