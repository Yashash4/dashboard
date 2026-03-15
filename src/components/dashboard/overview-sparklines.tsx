"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquare, Bot, Ticket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniSparkline } from "./mini-sparkline";

interface SparklineData {
  days: string[];
  messages: number[];
  agents: number[];
  channels: number[];
}

interface Props {
  channelsConnected: number;
  agentsDeployed: number;
  openTickets: number;
}

export function OverviewSparklines({ channelsConnected, agentsDeployed, openTickets }: Props) {
  const { data } = useQuery<SparklineData>({
    queryKey: ["sparklines"],
    queryFn: async () => {
      const res = await fetch("/api/stats/sparklines");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const messagesTotal = data?.messages?.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Channels Connected
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{channelsConnected}</p>
              {channelsConnected === 0 && (
                <Link href="/channels" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Connect a channel
                </Link>
              )}
            </div>
            {data?.channels && <MiniSparkline data={data.channels} />}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Agents Deployed
          </CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{agentsDeployed}</p>
              {agentsDeployed === 0 && (
                <Link href="/store" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Deploy your first agent
                </Link>
              )}
            </div>
            {data?.agents && <MiniSparkline data={data.agents} color="hsl(142, 76%, 36%)" />}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {messagesTotal > 0 ? "Messages (7d)" : "Open Tickets"}
          </CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold">{messagesTotal > 0 ? messagesTotal : openTickets}</p>
            {data?.messages && messagesTotal > 0 && (
              <MiniSparkline data={data.messages} color="hsl(217, 91%, 60%)" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
