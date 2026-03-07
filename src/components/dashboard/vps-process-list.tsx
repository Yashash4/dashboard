"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cpu,
  MemoryStick,
  RefreshCw,
  Loader2,
  Terminal,
  ArrowUpDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Process {
  user: string;
  pid: number;
  cpu: number;
  mem: number;
  command: string;
}

type SortKey = "cpu" | "mem" | "pid";

export function VPSProcessList() {
  const [sortBy, setSortBy] = useState<SortKey>("cpu");
  const [sortAsc, setSortAsc] = useState(false);

  const {
    data: processes,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["vps-processes"],
    queryFn: async () => {
      const res = await fetch("/api/vps/processes");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.processes || []) as Process[];
    },
    refetchInterval: 15000,
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const sorted = [...(processes || [])].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * mul;
  });

  const totalCpu = (processes || []).reduce((s, p) => s + p.cpu, 0);
  const totalMem = (processes || []).reduce((s, p) => s + p.mem, 0);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown
      className={`h-3 w-3 ml-1 inline ${sortBy === col ? "text-foreground" : "text-muted-foreground/50"}`}
    />
  );

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Running Processes
          </CardTitle>
          {processes && (
            <div className="flex items-center gap-2 ml-2">
              <Badge
                variant="outline"
                className="text-[10px] bg-primary/10 text-primary border-primary/30"
              >
                <Cpu className="h-2.5 w-2.5 mr-1" />
                {totalCpu.toFixed(1)}% CPU
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30"
              >
                <MemoryStick className="h-2.5 w-2.5 mr-1" />
                {totalMem.toFixed(1)}% RAM
              </Badge>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !processes || processes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No process data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">
                  <button
                    onClick={() => handleSort("pid")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    PID
                    <SortIcon col="pid" />
                  </button>
                </TableHead>
                <TableHead className="w-[80px]">User</TableHead>
                <TableHead className="w-[90px]">
                  <button
                    onClick={() => handleSort("cpu")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    CPU %
                    <SortIcon col="cpu" />
                  </button>
                </TableHead>
                <TableHead className="w-[90px]">
                  <button
                    onClick={() => handleSort("mem")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    MEM %
                    <SortIcon col="mem" />
                  </button>
                </TableHead>
                <TableHead>Command</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((proc, i) => (
                <TableRow key={`${proc.pid}-${i}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {proc.pid}
                  </TableCell>
                  <TableCell className="text-xs">{proc.user}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-mono ${
                        proc.cpu > 50
                          ? "text-red-400"
                          : proc.cpu > 20
                            ? "text-yellow-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {proc.cpu.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-mono ${
                        proc.mem > 50
                          ? "text-red-400"
                          : proc.mem > 20
                            ? "text-yellow-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {proc.mem.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[300px]">
                    {proc.command}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
