"use client";

import { ArrowDown, ArrowUp, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartPoint {
  time: string;
  cpu: number;
  ram: number;
  netIn: number;
  netOut: number;
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024)
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function VPSCharts({
  chartData,
  isRunning,
}: {
  chartData: ChartPoint[];
  isRunning: boolean;
}) {
  if (chartData.length < 2 && isRunning) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Activity className="h-6 w-6 mx-auto mb-2 animate-pulse" />
            Collecting chart data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length < 2) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            CPU & RAM Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === "cpu" ? "CPU" : "RAM"]}
                  wrapperStyle={{ zIndex: 50 }}
                />
                <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="url(#cpuGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="ram" stroke="hsl(142, 76%, 36%)" fill="url(#ramGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-primary" />
              <span className="text-xs text-muted-foreground">CPU</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
              <span className="text-xs text-muted-foreground">RAM</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="netInGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netOutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={60} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatRate(v)} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => [formatRate(value), name === "netIn" ? "Download" : "Upload"]}
                  wrapperStyle={{ zIndex: 50 }}
                />
                <Area type="monotone" dataKey="netIn" stroke="hsl(142, 76%, 36%)" fill="url(#netInGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="netOut" stroke="hsl(217, 91%, 60%)" fill="url(#netOutGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Download</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUp className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">Upload</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
