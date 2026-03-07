"use client";

import { useState } from "react";
import {
  Download,
  Filter,
  Search,
  User,
  Bot,
  Server,
  Settings,
  Shield,
  Key,
  CreditCard,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "user" | "agent" | "system";
  action: string;
  category: string;
  details: string;
  ip: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; badge: string }
> = {
  auth: { icon: Shield, badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  vps: { icon: Server, badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  agent: { icon: Bot, badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  model: { icon: Settings, badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  api_key: { icon: Key, badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  billing: { icon: CreditCard, badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  account: { icon: User, badge: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

const ACTOR_ICONS: Record<string, React.ElementType> = {
  user: User,
  agent: Bot,
  system: Server,
};

// Mock data
const MOCK_ENTRIES: AuditEntry[] = [
  {
    id: "1",
    timestamp: "2026-03-07T14:32:00Z",
    actor: "you@example.com",
    actorType: "user",
    action: "Restarted OpenClaw",
    category: "vps",
    details: "Manual restart from dashboard",
    ip: "192.168.1.1",
  },
  {
    id: "2",
    timestamp: "2026-03-07T13:15:00Z",
    actor: "System",
    actorType: "system",
    action: "Model change applied",
    category: "model",
    details: "Changed from Kimi K2.5 to MiniMax M2.5",
    ip: "-",
  },
  {
    id: "3",
    timestamp: "2026-03-07T11:45:00Z",
    actor: "you@example.com",
    actorType: "user",
    action: "Deployed agent",
    category: "agent",
    details: 'Deployed "Customer Support Bot" to VPS',
    ip: "192.168.1.1",
  },
  {
    id: "4",
    timestamp: "2026-03-06T22:10:00Z",
    actor: "you@example.com",
    actorType: "user",
    action: "Changed password",
    category: "account",
    details: "Dashboard password updated",
    ip: "192.168.1.1",
  },
  {
    id: "5",
    timestamp: "2026-03-06T18:00:00Z",
    actor: "you@example.com",
    actorType: "user",
    action: "Created API key",
    category: "api_key",
    details: 'Key "Production" created',
    ip: "192.168.1.1",
  },
  {
    id: "6",
    timestamp: "2026-03-06T15:30:00Z",
    actor: "System",
    actorType: "system",
    action: "Subscription renewed",
    category: "billing",
    details: "Pro plan - $129.00",
    ip: "-",
  },
  {
    id: "7",
    timestamp: "2026-03-06T09:00:00Z",
    actor: "you@example.com",
    actorType: "user",
    action: "Login",
    category: "auth",
    details: "Successful login",
    ip: "192.168.1.1",
  },
  {
    id: "8",
    timestamp: "2026-03-05T20:45:00Z",
    actor: "Support Bot",
    actorType: "agent",
    action: "Channel connected",
    category: "agent",
    details: "WhatsApp channel configured",
    ip: "-",
  },
];

export function AuditLogViewer() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  const filtered = MOCK_ENTRIES.filter((entry) => {
    if (
      search &&
      !entry.action.toLowerCase().includes(search.toLowerCase()) &&
      !entry.details.toLowerCase().includes(search.toLowerCase()) &&
      !entry.actor.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (categoryFilter !== "all" && entry.category !== categoryFilter)
      return false;
    if (actorFilter !== "all" && entry.actorType !== actorFilter) return false;
    return true;
  });

  const handleExport = () => {
    const csv = [
      "Timestamp,Actor,Type,Action,Category,Details,IP",
      ...filtered.map(
        (e) =>
          `"${e.timestamp}","${e.actor}","${e.actorType}","${e.action}","${e.category}","${e.details}","${e.ip}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions, details, actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_CONFIG).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="capitalize">{cat.replace("_", " ")}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actors</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{filtered.length} entries</span>
        {search && (
          <>
            <span>&middot;</span>
            <span>Filtered by &quot;{search}&quot;</span>
          </>
        )}
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">Time</TableHead>
                <TableHead className="w-[140px]">Actor</TableHead>
                <TableHead className="w-[100px]">Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[200px]">Details</TableHead>
                <TableHead className="w-[100px]">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No audit entries match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => {
                  const catConfig = CATEGORY_CONFIG[entry.category];
                  const CatIcon = catConfig?.icon || Settings;
                  const ActorIcon = ACTOR_ICONS[entry.actorType] || User;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ActorIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs truncate max-w-[110px]">
                            {entry.actor}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${catConfig?.badge || ""}`}
                        >
                          <CatIcon className="h-2.5 w-2.5 mr-1" />
                          <span className="capitalize">
                            {entry.category.replace("_", " ")}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.action}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {entry.details}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.ip}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
