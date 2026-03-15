"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LogPatterns() {
  const [patterns, setPatterns] = useState<{ pattern: string; count: number; example: string }[]>([]);
  const [anomalies, setAnomalies] = useState<{ type: string; pattern: string; details: string }[]>([]);

  const detectMutation = useMutation({
    mutationFn: async () => {
      // Fetch recent logs from VPS
      const logsRes = await fetch("/api/vps/logs?lines=200");
      if (!logsRes.ok) throw new Error("Failed to fetch logs");
      const { logs } = await logsRes.json();

      if (!logs || logs.length === 0) throw new Error("No logs available");

      const res = await fetch("/api/logs/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      if (!res.ok) throw new Error("Pattern detection failed");
      return res.json();
    },
    onSuccess: (data) => {
      setPatterns(data.patterns || []);
      setAnomalies(data.anomalies || []);
      toast.success(`Found ${data.patterns?.length || 0} patterns`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending}>
          {detectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Detect Patterns
        </Button>
      </div>

      {anomalies.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader><CardTitle className="text-sm text-yellow-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Anomalies Detected</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{a.type.replace(/_/g, " ")}</Badge>
                <span className="text-muted-foreground">{a.details}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {patterns.length > 0 && (
        <Card className="border-border">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Log Patterns ({patterns.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {patterns.map((p, i) => (
                <div key={i} className="border border-border p-2">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-mono text-muted-foreground truncate flex-1">{p.pattern}</code>
                    <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{p.count}x</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Example: {p.example}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {patterns.length === 0 && !detectMutation.isPending && (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click "Detect Patterns" to analyze your recent logs</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
