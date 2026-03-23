"use client";

import { useState } from "react";
import {
  Download,
  Filter,
  Search,
  User,
  Server,
  Settings,
  Shield,
  Key,
  RefreshCw,
  BookOpen,
  Webhook,
  ShieldCheck,
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

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; badge: string }> = {
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

const DEMO_LOGS = [
  { id: "1", action: "login_success", entity_type: "session", entity_id: null, category: "auth", actor_type: "user", details: { method: "email" }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:30:00Z" },
  { id: "2", action: "api_key_created", entity_type: "api_key", entity_id: "key_7a3f", category: "api_key", actor_type: "user", details: { name: "Production", rate_limit: 120 }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:25:00Z" },
  { id: "3", action: "agent_deployed", entity_type: "agent", entity_id: "support-bot", category: "agent", actor_type: "user", details: { agent: "support-bot", model: "kimi-k2.5" }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:20:00Z" },
  { id: "4", action: "model_changed", entity_type: "model", entity_id: null, category: "model", actor_type: "user", details: { from: "minimax-m2.7", to: "kimi-k2.5" }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:15:00Z" },
  { id: "5", action: "vps_restarted", entity_type: "vps", entity_id: null, category: "vps", actor_type: "user", details: { reason: "manual" }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:10:00Z" },
  { id: "6", action: "document_uploaded", entity_type: "document", entity_id: "doc_123", category: "knowledge_base", actor_type: "user", details: { name: "FAQ.pdf", size: "245KB" }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:05:00Z" },
  { id: "7", action: "webhook_created", entity_type: "webhook", entity_id: "wh_456", category: "webhook", actor_type: "user", details: { url: "https://api.example.com/hooks" }, ip_address: "192.168.1.45", created_at: "2026-03-22T14:00:00Z" },
  { id: "8", action: "password_changed", entity_type: "account", entity_id: null, category: "account", actor_type: "user", details: null, ip_address: "192.168.1.45", created_at: "2026-03-22T13:55:00Z" },
  { id: "9", action: "api_key_revoked", entity_type: "api_key", entity_id: "key_2d4e", category: "api_key", actor_type: "user", details: { name: "Testing (old)" }, ip_address: "192.168.1.45", created_at: "2026-03-22T13:50:00Z" },
  { id: "10", action: "agent_undeployed", entity_type: "agent", entity_id: "old-bot", category: "agent", actor_type: "user", details: { agent: "old-bot" }, ip_address: "192.168.1.45", created_at: "2026-03-22T13:45:00Z" },
];

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

export default function AuditLogDemoPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = DEMO_LOGS.filter((entry) => {
    if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
    if (search && !entry.action.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Audit Log</h1>
      <p className="text-muted-foreground mb-6">
        Track all activity across your account.
      </p>

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-1" />
              Export Page
            </Button>

            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-1" />
              Export All
            </Button>

            <Button variant="outline" size="sm" disabled>
              <ShieldCheck className="h-4 w-4 mr-1" />
              Verify
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>
          {search && (
            <>
              <span>&middot;</span>
              <span>Filtered by &quot;{search}&quot;</span>
            </>
          )}
          {categoryFilter !== "all" && (
            <>
              <span>&middot;</span>
              <span className="capitalize">{categoryFilter.replace(/_/g, " ")}</span>
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
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-[250px]">Details</TableHead>
                  <TableHead className="w-[110px]">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => {
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
                          <span className="capitalize">{entry.category.replace(/_/g, " ")}</span>
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
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
