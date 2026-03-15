"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const STAGES = [
  { key: "started", label: "Started", color: "bg-blue-500" },
  { key: "engaged", label: "Engaged", color: "bg-cyan-500" },
  { key: "substantive", label: "Substantive", color: "bg-green-500" },
  { key: "resolved", label: "Resolved", color: "bg-emerald-500" },
  { key: "satisfied", label: "Satisfied", color: "bg-primary" },
];

export function ConversationFunnels() {
  const [days, setDays] = useState("7");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-funnels", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/funnels?days=${days}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const funnel = data?.funnel || { started: 0, engaged: 0, substantive: 0, resolved: 0, satisfied: 0 };
  const maxVal = Math.max(funnel.started, 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
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
            Conversation Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {STAGES.map((stage) => {
                const count = funnel[stage.key as keyof typeof funnel] || 0;
                const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                const convRate = stage.key !== "started" && funnel.started > 0
                  ? Math.round((count / funnel.started) * 100)
                  : 100;

                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-24 shrink-0">{stage.label}</span>
                    <div className="flex-1 bg-muted/30 h-8 relative">
                      <div
                        className={`h-full ${stage.color} transition-all flex items-center px-2`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{convRate}%</span>
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
