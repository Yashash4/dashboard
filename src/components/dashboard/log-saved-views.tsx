"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Plus, Trash2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function LogSavedViews() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["log-saved-views"],
    queryFn: async () => {
      const res = await fetch("/api/logs/saved-views");
      if (!res.ok) return { views: [] };
      return res.json();
    },
  });

  const views = data?.views || [];

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; is_default: boolean }) => {
      const res = await fetch("/api/logs/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, filters: {} }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["log-saved-views"] });
      setCreateOpen(false);
      setViewName("");
      toast.success("View saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/logs/saved-views?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["log-saved-views"] });
      toast.success("View deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Save Current View</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Save Log View</DialogTitle></DialogHeader>
            <div className="py-4 space-y-3">
              <Input
                placeholder="View name (e.g., Error Logs)"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Set as default view
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ name: viewName, is_default: isDefault })} disabled={!viewName.trim()}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {views.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No saved views yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {views.map((view: any) => (
            <Card key={view.id} className="border-border">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{view.name}</span>
                  {view.is_default && (
                    <Badge variant="outline" className="text-[10px]"><Star className="h-2.5 w-2.5 mr-0.5" />Default</Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(view.id)}>
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
