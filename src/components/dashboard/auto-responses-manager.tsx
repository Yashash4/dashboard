"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  Moon,
  Zap,
  Hand,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutoResponse {
  id: string;
  type: "greeting" | "away" | "faq";
  channel_type: string | null;
  trigger_keyword: string | null;
  response_text: string;
  is_enabled: boolean;
  created_at: string;
}

const TYPE_CONFIG = {
  greeting: { label: "Greeting", icon: Hand, color: "text-green-400" },
  away: { label: "Away", icon: Moon, color: "text-yellow-400" },
  faq: { label: "FAQ", icon: Zap, color: "text-blue-400" },
};

export function AutoResponsesManager() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newType, setNewType] = useState<string>("greeting");
  const [newKeyword, setNewKeyword] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newChannel, setNewChannel] = useState("all");

  const { data, isLoading } = useQuery<{ autoResponses: AutoResponse[] }>({
    queryKey: ["auto-responses"],
    queryFn: async () => {
      const res = await fetch("/api/auto-responses");
      if (!res.ok) return { autoResponses: [] };
      return res.json();
    },
  });

  const responses = data?.autoResponses || [];

  const createMutation = useMutation({
    mutationFn: async (payload: {
      type: string;
      channel_type: string | null;
      trigger_keyword?: string;
      response_text: string;
    }) => {
      const res = await fetch("/api/auto-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-responses"] });
      setCreateOpen(false);
      setNewType("greeting");
      setNewKeyword("");
      setNewResponse("");
      setNewChannel("all");
      toast.success("Auto-response created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const res = await fetch("/api/auto-responses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auto-responses"] }),
    onError: () => toast.error("Failed to toggle"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/auto-responses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-responses"] });
      toast.success("Auto-response deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleCreate = () => {
    createMutation.mutate({
      type: newType,
      channel_type: newChannel === "all" ? null : newChannel,
      trigger_keyword: newType === "faq" ? newKeyword : undefined,
      response_text: newResponse,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure automatic replies for greetings, away messages, and FAQ keywords.
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Auto-Response
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Auto-Response</DialogTitle>
              <DialogDescription>
                Set up automatic replies for common scenarios.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greeting">Greeting — sent on new sessions</SelectItem>
                    <SelectItem value="away">Away — sent outside business hours</SelectItem>
                    <SelectItem value="faq">FAQ — triggered by keyword match</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newType === "faq" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Trigger Keyword</label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., refund, pricing, hours"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Response Message</label>
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="The automatic reply to send..."
                  rows={4}
                  className="w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Channel</label>
                <Select value={newChannel} onValueChange={setNewChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="webchat">WebChat</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={!newResponse.trim() || (newType === "faq" && !newKeyword.trim()) || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-6"><div className="h-16" /></CardContent>
            </Card>
          ))}
        </div>
      ) : responses.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No auto-responses configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {responses.map((ar) => {
            const typeConf = TYPE_CONFIG[ar.type];
            const Icon = typeConf.icon;
            return (
              <Card key={ar.id} className="border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeConf.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{typeConf.label}</Badge>
                          {ar.channel_type && (
                            <Badge variant="outline" className="text-[10px] capitalize">{ar.channel_type}</Badge>
                          )}
                          {ar.trigger_keyword && (
                            <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1">
                              {ar.trigger_keyword}
                            </code>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ar.response_text}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={ar.is_enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: ar.id, is_enabled: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(ar.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
