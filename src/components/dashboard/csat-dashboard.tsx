"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
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

export function CsatDashboard() {
  const [days, setDays] = useState("30");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-csat", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/csat?days=${days}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const average = data?.average || 0;
  const total = data?.total || 0;
  const distribution = data?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const maxDist = Math.max(...Object.values(distribution) as number[], 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Average CSAT</p>
            {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold">{average}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Ratings</p>
            {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">{total}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Satisfaction</p>
            {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">
                {total > 0 ? Math.round(((distribution[4] + distribution[5]) / total) * 100) : 0}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No ratings yet</p>
          ) : (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = (count / maxDist) * 100;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 w-16 shrink-0">
                      <span className="text-xs font-medium">{star}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 bg-muted/30 h-5">
                      <div
                        className="h-full bg-yellow-400/80 transition-all"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
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
