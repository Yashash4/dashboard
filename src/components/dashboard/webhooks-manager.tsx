"use client";

import { useState } from "react";
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
  Eye,
  EyeOff,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  createdAt: string;
  lastTriggered: string | null;
  lastStatus: "success" | "failed" | null;
}

const AVAILABLE_EVENTS = [
  {
    id: "conversation.started",
    label: "Conversation Started",
    description: "When a new conversation begins",
  },
  {
    id: "conversation.ended",
    label: "Conversation Ended",
    description: "When a conversation is closed",
  },
  {
    id: "message.received",
    label: "Message Received",
    description: "When a user sends a message",
  },
  {
    id: "agent.error",
    label: "Agent Error",
    description: "When an agent encounters an error",
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

const MOCK_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: "1",
    url: "https://api.example.com/webhooks/clawhq",
    secret: "whsec_abc123def456",
    events: ["conversation.started", "conversation.ended", "agent.error"],
    enabled: true,
    createdAt: "2026-02-20",
    lastTriggered: "2026-03-07T14:30:00Z",
    lastStatus: "success",
  },
  {
    id: "2",
    url: "https://hooks.slack.com/services/T00/B00/xxx",
    secret: "whsec_xyz789ghi012",
    events: ["vps.status_changed", "agent.error"],
    enabled: true,
    createdAt: "2026-03-01",
    lastTriggered: "2026-03-06T09:15:00Z",
    lastStatus: "failed",
  },
];

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(MOCK_WEBHOOKS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

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
    const webhook: WebhookEndpoint = {
      id: Math.random().toString(36).slice(2, 8),
      url: newUrl,
      secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
      events: selectedEvents,
      enabled: true,
      createdAt: new Date().toISOString().slice(0, 10),
      lastTriggered: null,
      lastStatus: null,
    };
    setWebhooks((prev) => [...prev, webhook]);
    setCreateOpen(false);
    setNewUrl("");
    setSelectedEvents([]);
    toast.success("Webhook created");
  };

  const handleDelete = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.success("Webhook deleted");
  };

  const handleToggle = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleTest = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      toast.success("Test event sent");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {webhooks.filter((w) => w.enabled).length}
                </p>
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
                <p className="text-2xl font-bold">
                  {new Set(webhooks.flatMap((w) => w.events)).size}
                </p>
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
                <p className="text-sm font-medium mt-1">
                  {webhooks.some((w) => w.lastTriggered)
                    ? new Date(
                        webhooks
                          .filter((w) => w.lastTriggered)
                          .sort(
                            (a, b) =>
                              new Date(b.lastTriggered!).getTime() -
                              new Date(a.lastTriggered!).getTime()
                          )[0].lastTriggered!
                      ).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Never"}
                </p>
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
                disabled={!newUrl || selectedEvents.length === 0}
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhook list */}
      {webhooks.length === 0 ? (
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
                      onClick={() => handleToggle(webhook.id)}
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
                    {webhook.lastStatus === "success" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-green-500/15 text-green-400 border-green-500/30"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        OK
                      </Badge>
                    )}
                    {webhook.lastStatus === "failed" && (
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
                            onClick={() => handleDelete(webhook.id)}
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
                    <code className="font-mono">
                      {showSecret === webhook.id
                        ? webhook.secret
                        : "whsec_••••••••"}
                    </code>
                    <button
                      onClick={() =>
                        setShowSecret(
                          showSecret === webhook.id ? null : webhook.id
                        )
                      }
                    >
                      {showSecret === webhook.id ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                    <button onClick={() => handleCopy(webhook.secret, webhook.id)}>
                      {copied === webhook.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  {webhook.lastTriggered && (
                    <span>
                      Last fired{" "}
                      {new Date(webhook.lastTriggered).toLocaleString("en-US", {
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
    </div>
  );
}
