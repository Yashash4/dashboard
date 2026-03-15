"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceStatus {
  name: string;
  port: number;
  status: "running" | "stopped" | "unknown";
}

export function ServiceStatusPanel({ isRunning }: { isRunning: boolean }) {
  const { data, isLoading, refetch, isFetching } = useQuery<ServiceStatus[]>({
    queryKey: ["service-status"],
    queryFn: async () => {
      const res = await fetch("/api/vps/services");
      if (!res.ok) return [];
      const d = await res.json();
      return d.services || [];
    },
    enabled: isRunning,
    staleTime: 30_000,
    retry: 1,
  });

  if (!isRunning) return null;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Services</CardTitle>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(data || []).map((svc) => (
              <div key={svc.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  {svc.status === "running" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : svc.status === "stopped" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  )}
                  <span className="text-sm">{svc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">:{svc.port}</span>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <p className="text-sm text-muted-foreground">Could not check services.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
