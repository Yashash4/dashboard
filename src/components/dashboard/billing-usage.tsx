"use client";

import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Bot,
  Radio,
  CalendarDays,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UsageSummary {
  messages_sent: number;
  agents_deployed: number;
  channels_connected: number;
  days_active: number;
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-md">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-lg font-bold">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function BillingUsage({
  currentPlan,
}: {
  currentPlan: string;
}) {
  const { data, isLoading } = useQuery<UsageSummary>({
    queryKey: ["usage-summary"],
    queryFn: async () => {
      const res = await fetch("/api/stats/usage-summary");
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Your Usage This Month</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem
                icon={MessageSquare}
                label="Messages sent"
                value={data.messages_sent}
              />
              <StatItem
                icon={Bot}
                label="Agents deployed"
                value={data.agents_deployed}
              />
              <StatItem
                icon={Radio}
                label="Channels connected"
                value={data.channels_connected}
              />
              <StatItem
                icon={CalendarDays}
                label="Days active"
                value={data.days_active}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              You&apos;re getting great value from your{" "}
              <span className="capitalize font-medium text-foreground">
                {currentPlan}
              </span>{" "}
              plan!
            </p>

            {currentPlan === "starter" && (
              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" asChild>
                  <a href="/billing">
                    Unlock more with Pro
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Usage data is not available right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
