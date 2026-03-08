"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Filter,
  Search,
  User,
  Server,
  Settings,
  Shield,
  Key,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Webhook,
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
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  category: string;
  actor_type: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; badge: string }
> = {
  auth: { icon: Shield, badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  vps: { icon: Server, badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  agent: { icon: Settings, badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  model: { icon: Settings, badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  api_key: { icon: Key, badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  account: { icon: User, badge: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  knowledge_base: { icon: BookOpen, badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  webhook: { icon: Webhook, badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

const PAGE_SIZE = 50;

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return "-";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value !== null && value !== undefined) {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join(", ") || "-";
}

export function AuditLogViewer() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(PAGE_SIZE));
  if (categoryFilter !== "all") queryParams.set("category", categoryFilter);
  if (debouncedSearch.trim()) queryParams.set("search", debouncedSearch.trim());

  const { data, isLoading, isError, refetch } = useQuery<AuditResponse>({
    queryKey: ["audit-log", page, categoryFilter, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/audit-log?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = () => {
    const csv = [
      "Timestamp,Action,Category,Actor Type,Entity Type,Entity ID,Details,IP",
      ...logs.map(
        (e) =>
          `"${e.created_at}","${e.action}","${e.category}","${e.actor_type}","${e.entity_type}","${e.entity_id || ""}","${formatDetails(e.details).replace(/"/g, '""')}","${e.ip_address || "-"}"`
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
            placeholder="Search actions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{total} {total === 1 ? "entry" : "entries"}</span>
        {debouncedSearch && (
          <>
            <span>&middot;</span>
            <span>Filtered by &quot;{debouncedSearch}&quot;</span>
          </>
        )}
        {categoryFilter !== "all" && (
          <>
            <span>&middot;</span>
            <span className="capitalize">{categoryFilter.replace(/_/g, " ")}</span>
          </>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-destructive mb-2">Failed to load audit logs</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isError && (
        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Time</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-[250px]">Details</TableHead>
                  <TableHead className="w-[110px]">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {debouncedSearch || categoryFilter !== "all"
                        ? "No entries match your filters"
                        : "No audit entries yet. Actions you take will appear here."}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((entry) => {
                    const catConfig = CATEGORY_CONFIG[entry.category];
                    const CatIcon = catConfig?.icon || Settings;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${catConfig?.badge || ""}`}
                          >
                            <CatIcon className="h-2.5 w-2.5 mr-1" />
                            <span className="capitalize">
                              {entry.category.replace(/_/g, " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatAction(entry.action)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {formatDetails(entry.details)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {entry.ip_address || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isError && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
