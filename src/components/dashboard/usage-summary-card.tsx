"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BarChart3, Bot, MessageSquare, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniSparkline } from "./mini-sparkline";

interface UsageData {
  days: string[];
  messages: number[];
  total_messages: number;
  top_agent: { name: string; count: number } | null;
  top_channel: { type: string; count: number } | null;
}

export function UsageSummaryCard() {
  const { data, isLoading } = useQuery<UsageData | null>({
    queryKey: ["usage-summary"],
    queryFn: async () => {
      const res = await fetch("/api/stats/usage-summary");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </div>
          {data && data.total_messages > 0 && (
            <MiniSparkline data={data.messages} width={100} height={28} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : !data || data.total_messages === 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              No messages yet this week. Deploy an agent and start chatting.
            </p>
            <Link href="/chat" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Open Chat <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold">{data.total_messages}</p>
              <p className="text-xs text-muted-foreground">messages this week</p>
            </div>
            <div className="space-y-1.5">
              {data.top_agent && (
                <div className="flex items-center gap-2 text-sm">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Most active:</span>
                  <span className="font-medium">{data.top_agent.name}</span>
                  <span className="text-xs text-muted-foreground">({data.top_agent.count})</span>
                </div>
              )}
              {data.top_channel && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Top channel:</span>
                  <span className="font-medium capitalize">{data.top_channel.type}</span>
                  <span className="text-xs text-muted-foreground">({data.top_channel.count})</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
