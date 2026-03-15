"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const INTENT_COLORS: Record<string, string> = {
  support: "bg-red-500",
  billing: "bg-yellow-500",
  product: "bg-blue-500",
  sales: "bg-green-500",
  feedback: "bg-purple-500",
  greeting: "bg-cyan-500",
  general: "bg-muted-foreground",
};

export function IntentsDashboard() {
  const [days, setDays] = useState("7");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-intents", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/intents?days=${days}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const intents: { intent: string; count: number }[] = data?.intents || [];
  const totalMessages = data?.total_messages || 0;
  const maxCount = Math.max(...intents.map((i) => i.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {totalMessages} messages analyzed
        </p>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Intents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : intents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversation data yet
            </p>
          ) : (
            <div className="space-y-2">
              {intents.map((item, idx) => {
                const pct = totalMessages > 0 ? Math.round((item.count / totalMessages) * 100) : 0;
                return (
                  <div key={item.intent} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}</span>
                    <Badge variant="outline" className="text-[10px] capitalize w-20 justify-center">
                      {item.intent}
                    </Badge>
                    <div className="flex-1 bg-muted/30 h-6">
                      <div
                        className={`h-full ${INTENT_COLORS[item.intent] || "bg-primary"} transition-all`}
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
