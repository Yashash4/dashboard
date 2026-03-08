"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCw,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  description: string | null;
  last_triggered_at: string | null;
  last_status: "success" | "failed" | null;
  last_status_code: number | null;
  failure_count: number;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  {
    id: "message.received",
    label: "Message Received",
    description: "When a user sends a message",
  },
  {
    id: "agent.deployed",
    label: "Agent Deployed",
    description: "When an agent is deployed to VPS",
  },
  {
    id: "vps.status_changed",
    label: "VPS Status Changed",
    description: "When VPS starts, stops, or errors",
  },
  {
    id: "channel.connected",
    label: "Channel Connected",
    description: "When a messaging channel connects",
  },
  {
    id: "channel.disconnected",
    label: "Channel Disconnected",
    description: "When a channel goes offline",
  },
];

export function WebhooksManager() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<{ webhooks: WebhookEndpoint[] }>({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const res = await fetch("/api/webhooks");
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      return res.json();
    },
  });

  const webhooks = data?.webhooks || [];

  const createMutation = useMutation({
    mutationFn: async (payload: { url: string; events: string[] }) => {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create webhook");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setCreateOpen(false);
      setNewUrl("");
      setSelectedEvents([]);
      // Show secret once
      if (data?.webhook?.secret) {
        setCreatedSecret(data.webhook.secret);
        setSecretDialogOpen(true);
      }
      toast.success("Webhook created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete webhook");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update webhook");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: () => {
      toast.error("Failed to toggle webhook");
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleCreate = () => {
    createMutation.mutate({ url: newUrl, events: selectedEvents });
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Test event delivered successfully");
      } else {
        toast.error(`Test failed: ${data.error || `HTTP ${data.status_code}`}`);
      }
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    } catch {
      toast.error("Failed to send test event");
    } finally {
      setTestingId(null);
    }
  };

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive mb-2">Failed to load webhooks</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-8 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {webhooks.filter((w) => w.enabled).length}
                  </p>
                )}
              </div>
              <Webhook className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Events Tracked</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-8 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {new Set(webhooks.flatMap((w) => w.events)).size}
                  </p>
                )}
              </div>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Last Triggered</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-24 mt-1" />
                ) : (
                  <p className="text-sm font-medium mt-1">
                    {webhooks.some((w) => w.last_triggered_at)
                      ? new Date(
                          webhooks
                            .filter((w) => w.last_triggered_at)
                            .sort(
                              (a, b) =>
                                new Date(b.last_triggered_at!).getTime() -
                                new Date(a.last_triggered_at!).getTime()
                            )[0].last_triggered_at!
                        ).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </p>
                )}
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create button */}
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                We&apos;ll send a POST request to your URL when selected events
                occur. Payloads include a signature header for verification.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Endpoint URL
                </label>
                <Input
                  placeholder="https://api.example.com/webhooks"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Events
                </label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border border-border p-3">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-start gap-3 cursor-pointer py-1"
                    >
                      <Checkbox
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newUrl || selectedEvents.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhook list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-72" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Webhook className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No webhooks configured</p>
            <p className="text-xs mt-1">
              Add a webhook to start receiving event notifications
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() =>
                        toggleMutation.mutate({
                          id: webhook.id,
                          enabled: !webhook.enabled,
                        })
                      }
                      className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                        webhook.enabled
                          ? "bg-green-500"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    <CardTitle className="text-sm font-mono truncate">
                      {webhook.url}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {webhook.last_status === "success" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-green-500/15 text-green-400 border-green-500/30"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        OK
                      </Badge>
                    )}
                    {webhook.last_status === "failed" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30"
                      >
                        <XCircle className="h-2.5 w-2.5 mr-1" />
                        Failed
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingId === webhook.id}
                    >
                      {testingId === webhook.id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <RotateCw className="h-3.5 w-3.5 mr-1" />
                      )}
                      Test
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this webhook. You will
                            stop receiving event notifications at this URL.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(webhook.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {webhook.events.map((e) => (
                    <Badge
                      key={e}
                      variant="outline"
                      className="text-[10px] font-mono"
                    >
                      {e}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>Secret:</span>
                    <code className="font-mono">{webhook.secret}</code>
                  </div>
                  {webhook.last_triggered_at && (
                    <span>
                      Last fired{" "}
                      {new Date(webhook.last_triggered_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Secret shown once dialog */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook Secret</DialogTitle>
            <DialogDescription>
              Copy this secret now. It will not be shown again. Use it to
              verify webhook signatures on your server.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-muted border border-border font-mono text-sm break-all">
              <span className="flex-1">{createdSecret}</span>
              <button
                onClick={() => {
                  if (createdSecret) {
                    navigator.clipboard.writeText(createdSecret);
                    toast.success("Secret copied");
                  }
                }}
              >
                <Copy className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
