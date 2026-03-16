"use client";

import { useRef, useEffect } from "react";
import { ScrollText, Loader2, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function VPSLogsPanel({
  showLogs,
  setShowLogs,
}: {
  showLogs: boolean;
  setShowLogs: (v: boolean) => void;
}) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
    error: logsError,
  } = useQuery({
    queryKey: ["vps-logs"],
    queryFn: async () => {
      const res = await fetch("/api/vps/logs?lines=200");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch logs");
      }
      const data = await res.json();
      return data.logs as string;
    },
    enabled: showLogs,
    refetchInterval: false,
  });

  useEffect(() => {
    if (logsData && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logsData]);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gateway Logs
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {showLogs && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
            >
              {logsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? "Hide Logs" : "View Logs"}
          </Button>
        </div>
      </CardHeader>
      {showLogs && (
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : logsError ? (
            <div className="bg-black/50 p-4 max-h-96 overflow-y-auto text-sm text-muted-foreground">
              Could not load logs. Your server may be stopped.
            </div>
          ) : (
            <div className="bg-black/50 p-4 max-h-96 overflow-y-auto font-mono text-xs text-green-400 whitespace-pre-wrap">
              {logsData || "No logs available"}
              <div ref={logsEndRef} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
