"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CONDITION_TYPES = [
  { value: "keyword_count", label: "Keyword Count", desc: "Alert when keyword appears N+ times" },
  { value: "level_count", label: "Level Count", desc: "Alert when log level (error/warn) exceeds threshold" },
  { value: "pattern_match", label: "Pattern Match", desc: "Alert on specific log pattern" },
  { value: "absence", label: "Absence", desc: "Alert when expected log stops appearing" },
];

export function LogAlerts() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [conditionType, setConditionType] = useState("keyword_count");
  const [keyword, setKeyword] = useState("");
  const [threshold, setThreshold] = useState("5");
  const [webhookUrl, setWebhookUrl] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["log-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/logs/alerts");
      if (!res.ok) return { alerts: [] };
      return res.json();
    },
  });

  const alerts = data?.alerts || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logs/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          condition_type: conditionType,
          condition_config: { keyword, threshold: parseInt(threshold) || 5 },
          notification_channel: "webhook",
          notification_target: webhookUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create alert");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["log-alerts"] });
      setCreateOpen(false);
      setName("");
      setKeyword("");
      toast.success("Alert rule created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/logs/alerts?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["log-alerts"] });
      toast.success("Alert deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Alert</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Log Alert</DialogTitle>
              <DialogDescription>Get notified when log conditions are met.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Alert Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Error Spike Alert" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Condition</label>
                <Select value={conditionType} onValueChange={setConditionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label} — {ct.desc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Keyword / Pattern</label>
                  <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="error" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Threshold</label>
                  <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="5" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Webhook URL (notification)</label>
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No alert rules configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <Card key={alert.id} className="border-border">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{alert.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {alert.condition_type.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${alert.is_enabled ? "text-green-400" : "text-muted-foreground"}`}>
                      {alert.is_enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.condition_config?.keyword && `Keyword: "${alert.condition_config.keyword}"`}
                    {alert.condition_config?.threshold && ` — Threshold: ${alert.condition_config.threshold}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(alert.id)}>
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
