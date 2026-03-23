"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Pause,
  RefreshCw,
  Filter,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Bookmark, Star, Zap, Bell } from "lucide-react";

const LEVEL_STYLES: Record<string, { badge: string; text: string }> = {
  error: { badge: "bg-red-500/15 text-red-400 border-red-500/30", text: "text-red-400" },
  warn: { badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", text: "text-yellow-400" },
  info: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", text: "text-blue-400" },
  debug: { badge: "bg-gray-500/15 text-gray-400 border-gray-500/30", text: "text-gray-400" },
};

const DEMO_LOGS = [
  { timestamp: "2026-03-22 14:32:01", level: "info" as const, message: "[gateway] Agent 'support-bot' initialized successfully" },
  { timestamp: "2026-03-22 14:32:02", level: "info" as const, message: "[gateway] WebSocket connection established from 192.168.1.45" },
  { timestamp: "2026-03-22 14:32:05", level: "info" as const, message: "[agent:support-bot] Processing message: 'How do I reset my password?'" },
  { timestamp: "2026-03-22 14:32:06", level: "debug" as const, message: "[agent:support-bot] Tool invocation: memory_search('password reset')" },
  { timestamp: "2026-03-22 14:32:07", level: "info" as const, message: "[agent:support-bot] Response generated in 1.2s (340 tokens)" },
  { timestamp: "2026-03-22 14:32:15", level: "warn" as const, message: "[gateway] Rate limit approaching for key clw_prod_*** (45/60 RPM)" },
  { timestamp: "2026-03-22 14:32:18", level: "info" as const, message: "[agent:research-bot] Processing message: 'Find recent papers on RAG'" },
  { timestamp: "2026-03-22 14:32:19", level: "debug" as const, message: "[agent:research-bot] Tool invocation: web_search('RAG retrieval augmented generation 2026')" },
  { timestamp: "2026-03-22 14:32:22", level: "info" as const, message: "[agent:research-bot] Response generated in 3.8s (1,204 tokens)" },
  { timestamp: "2026-03-22 14:32:30", level: "error" as const, message: "[gateway] API key clw_test_*** authentication failed - key revoked" },
  { timestamp: "2026-03-22 14:32:35", level: "info" as const, message: "[gateway] Health check passed: all agents responsive" },
  { timestamp: "2026-03-22 14:32:40", level: "info" as const, message: "[agent:support-bot] Processing message: 'What are your business hours?'" },
  { timestamp: "2026-03-22 14:32:41", level: "info" as const, message: "[agent:support-bot] Response generated in 0.8s (156 tokens)" },
  { timestamp: "2026-03-22 14:32:50", level: "warn" as const, message: "[gateway] Slow response detected: research-bot took 5.2s (threshold: 5s)" },
  { timestamp: "2026-03-22 14:33:01", level: "info" as const, message: "[gateway] Connection count: 12 active, 3 idle" },
];

const DEMO_SAVED_VIEWS = [
  { name: "Errors Only", is_default: false },
  { name: "Agent Activity", is_default: true },
  { name: "Gateway Events", is_default: false },
];

const DEMO_PATTERNS = [
  { pattern: "Rate limit approaching", count: 23, severity: "warn" },
  { pattern: "Authentication failed", count: 7, severity: "error" },
  { pattern: "Slow response detected", count: 12, severity: "warn" },
  { pattern: "Health check passed", count: 288, severity: "info" },
];

const DEMO_ALERTS = [
  { name: "Error spike", condition: ">10 errors in 5 min", enabled: true },
  { name: "Slow responses", condition: ">5s avg response time", enabled: true },
  { name: "Agent down", condition: "Health check fails 3x", enabled: false },
];

export default function LogsDemoPage() {
  const [search, setSearch] = useState("");
  const [lineCount, setLineCount] = useState("200");
  const [enabledLevels] = useState(new Set(["info", "warn", "error", "debug"]));

  const levelCounts: Record<string, number> = {};
  for (const log of DEMO_LOGS) {
    levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
  }

  const filtered = DEMO_LOGS.filter((entry) => {
    if (!enabledLevels.has(entry.level)) return false;
    if (search && !entry.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Logs Explorer</h1>
      <p className="text-muted-foreground mb-6">
        Search and filter your VPS logs in real-time.
      </p>

      <Tabs defaultValue="explorer">
        <TabsList className="mb-6">
          <TabsTrigger value="explorer">Explorer</TabsTrigger>
          <TabsTrigger value="saved">Saved Views</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer">
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
                      <DropdownMenuCheckboxItem key={level} checked={enabledLevels.has(level)}>
                        <span className={LEVEL_STYLES[level].text}>{level.toUpperCase()}</span>
                        {levelCounts[level] ? (
                          <span className="ml-auto text-xs text-muted-foreground">{levelCounts[level]}</span>
                        ) : null}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" title="Pause auto-refresh">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Refresh now">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Download logs">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{filtered.length} entries shown</span>
              <span>&middot;</span>
              <span>{DEMO_LOGS.length} total</span>
              <span>&middot;</span>
              <div className="flex items-center gap-2">
                {(["error", "warn", "info", "debug"] as const).map((level) => (
                  <span
                    key={level}
                    className={`inline-flex items-center border rounded-md text-[10px] px-1.5 py-0 ${LEVEL_STYLES[level].badge}`}
                  >
                    {level.toUpperCase()} {levelCounts[level] || 0}
                  </span>
                ))}
              </div>
              <span className="ml-auto">Live &middot; Updated {new Date().toLocaleTimeString()}</span>
            </div>

            {/* Log entries */}
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto font-mono text-xs">
                  <table className="w-full">
                    <tbody>
                      {filtered.map((entry, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap w-[160px]">
                            {entry.timestamp}
                          </td>
                          <td className="px-2 py-1.5 w-[60px]">
                            <span className={`text-[10px] font-bold uppercase ${LEVEL_STYLES[entry.level].text}`}>
                              {entry.level}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 whitespace-pre-wrap break-all text-foreground/90">
                            {entry.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <Card className="border-border">
            <CardContent className="pt-6">
              {DEMO_SAVED_VIEWS.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No saved views yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {DEMO_SAVED_VIEWS.map((view) => (
                    <div key={view.name} className="flex items-center justify-between p-3 border border-border">
                      <div className="flex items-center gap-2">
                        {view.is_default && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                        <span className="text-sm font-medium">{view.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {view.is_default ? "Default" : "Custom"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {DEMO_PATTERNS.map((p) => (
                  <div key={p.pattern} className="flex items-center justify-between p-3 border border-border">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-3.5 w-3.5 ${LEVEL_STYLES[p.severity]?.text || "text-muted-foreground"}`} />
                      <span className="text-sm">{p.pattern}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${LEVEL_STYLES[p.severity]?.badge || ""}`}>
                        {p.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{p.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {DEMO_ALERTS.map((a) => (
                  <div key={a.name} className="flex items-center justify-between p-3 border border-border">
                    <div className="flex items-center gap-2">
                      <Bell className={`h-3.5 w-3.5 ${a.enabled ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <span className="text-sm font-medium">{a.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{a.condition}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${a.enabled ? "bg-green-500/15 text-green-400 border-green-500/30" : ""}`}>
                      {a.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
