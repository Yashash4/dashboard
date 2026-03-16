"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function KBConnectors() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [connType, setConnType] = useState("url_sync");
  const [syncUrl, setSyncUrl] = useState("");
  const [syncInterval, setSyncInterval] = useState("24");

  const { data, isLoading } = useQuery({
    queryKey: ["kb-connectors"],
    queryFn: async () => {
      const res = await fetch("/api/knowledge-base/connectors");
      if (!res.ok) return { connectors: [] };
      return res.json();
    },
  });
  const connectors = data?.connectors || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const config: Record<string, unknown> = {};
      if (connType === "url_sync") {
        config.url = syncUrl;
        config.interval_hours = parseInt(syncInterval) || 24;
      }
      const res = await fetch("/api/knowledge-base/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: connType, config }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create connector");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-connectors"] });
      setCreateOpen(false);
      setSyncUrl("");
      toast.success("Connector created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/knowledge-base/connectors?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-connectors"] });
      toast.success("Connector deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Connector</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Connector</DialogTitle>
              <DialogDescription>Automatically sync external content into your Knowledge Base.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Connector Type</label>
                <Select value={connType} onValueChange={setConnType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url_sync">URL Auto-Sync</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="notion">Notion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {connType === "url_sync" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">URL to sync</label>
                    <Input value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} placeholder="https://docs.example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Sync interval (hours)</label>
                    <Select value={syncInterval} onValueChange={setSyncInterval}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">Every 6 hours</SelectItem>
                        <SelectItem value="12">Every 12 hours</SelectItem>
                        <SelectItem value="24">Daily</SelectItem>
                        <SelectItem value="168">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {(connType === "google_drive" || connType === "notion") && (
                <p className="text-xs text-muted-foreground">
                  OAuth setup required. Click Create to start the authentication flow.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={connType === "url_sync" && !syncUrl.trim()}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {connectors.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No connectors configured</p>
            <p className="text-xs mt-1">Add a connector to automatically sync external content</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connectors.map((conn: any) => (
            <Card key={conn.id} className="border-border">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium capitalize">{conn.type.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className={`text-[10px] ${conn.is_enabled ? "text-green-400" : "text-muted-foreground"}`}>
                        {conn.sync_status || "idle"}
                      </Badge>
                    </div>
                    {conn.config?.url && (
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{conn.config.url}</p>
                    )}
                    {conn.last_synced_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(conn.id)} aria-label="Delete connector">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
