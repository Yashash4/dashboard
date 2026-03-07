"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  RefreshCw,
  Loader2,
  Pause,
  Play,
  Trash2,
  ArrowDown,
  Filter,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

const LEVEL_STYLES: Record<string, { badge: string; text: string }> = {
  error: {
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    text: "text-red-400",
  },
  warn: {
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    text: "text-yellow-400",
  },
  info: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    text: "text-blue-400",
  },
  debug: {
    badge: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    text: "text-gray-400",
  },
};

function parseLogs(raw: string): LogEntry[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      let level: LogEntry["level"] = "info";
      if (/error|fatal|panic/i.test(line)) level = "error";
      else if (/warn/i.test(line)) level = "warn";
      else if (/debug|trace/i.test(line)) level = "debug";

      // Try to extract timestamp from common log formats
      const tsMatch = line.match(
        /^(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})/
      );
      const timestamp = tsMatch
        ? tsMatch[1]
        : new Date().toISOString().slice(0, 19).replace("T", " ");

      return { timestamp, level, message: line };
    });
}

export function LogsExplorer() {
  const [search, setSearch] = useState("");
  const [lineCount, setLineCount] = useState("200");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [enabledLevels, setEnabledLevels] = useState<Set<string>>(
    new Set(["info", "warn", "error", "debug"])
  );
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const {
    data: rawLogs,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["logs-explorer", lineCount],
    queryFn: async () => {
      const res = await fetch(`/api/vps/logs?lines=${lineCount}`);
      if (!res.ok) {
        const err = await res.json();
        return err.error || "Failed to fetch logs";
      }
      const data = await res.json();
      return data.logs as string;
    },
    refetchInterval: autoRefresh ? 5000 : false,
    refetchIntervalInBackground: false,
  });

  const entries = parseLogs(rawLogs || "");

  const filtered = entries.filter((entry) => {
    if (!enabledLevels.has(entry.level)) return false;
    if (search && !entry.message.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const levelCounts = entries.reduce(
    (acc, e) => {
      acc[e.level] = (acc[e.level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered.length, autoScroll]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(atBottom);
  }, []);

  const handleDownload = () => {
    if (!rawLogs) return;
    const blob = new Blob([rawLogs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clawhq-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleLevel = (level: string) => {
    setEnabledLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={lineCount} onValueChange={setLineCount}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100 lines</SelectItem>
              <SelectItem value="200">200 lines</SelectItem>
              <SelectItem value="500">500 lines</SelectItem>
              <SelectItem value="1000">1000 lines</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Levels
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["error", "warn", "info", "debug"].map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={enabledLevels.has(level)}
                  onCheckedChange={() => toggleLevel(level)}
                >
                  <span className={LEVEL_STYLES[level].text}>
                    {level.toUpperCase()}
                  </span>
                  {levelCounts[level] ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {levelCounts[level]}
                    </span>
                  ) : null}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
          >
            {autoRefresh ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh now"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleDownload}
            disabled={!rawLogs}
            title="Download logs"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{filtered.length} entries shown</span>
        <span>&middot;</span>
        <span>{entries.length} total</span>
        {search && (
          <>
            <span>&middot;</span>
            <span>
              Filtered by &quot;{search}&quot;
            </span>
          </>
        )}
        <span>&middot;</span>
        <div className="flex items-center gap-2">
          {(["error", "warn", "info", "debug"] as const).map((level) => (
            <Badge
              key={level}
              variant="outline"
              className={`text-[10px] px-1.5 py-0 cursor-pointer ${
                enabledLevels.has(level)
                  ? LEVEL_STYLES[level].badge
                  : "opacity-30"
              }`}
              onClick={() => toggleLevel(level)}
            >
              {level.toUpperCase()} {levelCounts[level] || 0}
            </Badge>
          ))}
        </div>
        <span className="ml-auto">
          {autoRefresh ? "Live" : "Paused"}
          {dataUpdatedAt
            ? ` · Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
            : ""}
        </span>
      </div>

      {/* Log entries */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading && !rawLogs ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {entries.length === 0
                  ? "No logs available"
                  : "No logs match your filters"}
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="max-h-[600px] overflow-y-auto font-mono text-xs"
            >
              <table className="w-full">
                <tbody>
                  {filtered.map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap w-[160px]">
                        {entry.timestamp}
                      </td>
                      <td className="px-2 py-1.5 w-[60px]">
                        <span
                          className={`text-[10px] font-bold uppercase ${LEVEL_STYLES[entry.level].text}`}
                        >
                          {entry.level}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-pre-wrap break-all text-foreground/90">
                        {search ? (
                          <HighlightText
                            text={entry.message}
                            search={search}
                          />
                        ) : (
                          entry.message
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={logsEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scroll to bottom button */}
      {!autoScroll && filtered.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoScroll(true);
              logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ArrowDown className="h-3 w-3 mr-1" />
            Scroll to bottom
          </Button>
        </div>
      )}
    </div>
  );
}

function HighlightText({
  text,
  search,
}: {
  text: string;
  search: string;
}) {
  if (!search) return <>{text}</>;
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-primary px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
