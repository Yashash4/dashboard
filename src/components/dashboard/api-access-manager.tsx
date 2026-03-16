"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Code,
  AlertTriangle,
  Loader2,
  Gauge,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getCodeExamples } from "@/lib/api-code-examples";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  usage_count: number;
  last_used_at: string | null;
  status: "active" | "revoked";
  rate_limit_per_min: number | null;
  created_at: string;
}

const RATE_LIMITS = [
  { value: 30, label: "30 RPM" },
  { value: 60, label: "60 RPM" },
  { value: 120, label: "120 RPM" },
  { value: 300, label: "300 RPM" },
];

export function ApiAccessManager({ hostname }: { hostname: string | null }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyRateLimit, setKeyRateLimit] = useState("60");
  const [newFullKey, setNewFullKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [editRateLimitId, setEditRateLimitId] = useState<string | null>(null);
  const [editRateLimitValue, setEditRateLimitValue] = useState("60");
  const queryClient = useQueryClient();

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const endpoint = `${appUrl}/api/v1/chat`;
  const codeExamples = getCodeExamples(endpoint, appUrl);

  const {
    data: keysData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/keys");
      if (!res.ok) throw new Error("Failed to fetch keys");
      return res.json();
    },
  });

  const keys: ApiKey[] = keysData?.keys || [];
  const keyStats: Record<string, { today: number; week: number; errors: number }> = keysData?.keyStats || {};
  const activeCount = keys.filter((k) => k.status === "active").length;

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; rate_limit_per_min: number }) => {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create key");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setNewFullKey(data.key.full_key);
      setShowKey(true);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke key");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateRateLimitMutation = useMutation({
    mutationFn: async ({ id, rate_limit_per_min }: { id: string; rate_limit_per_min: number }) => {
      const res = await fetch(`/api/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_limit_per_min }),
      });
      if (!res.ok) throw new Error("Failed to update rate limit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setEditRateLimitId(null);
      toast.success("Rate limit updated");
    },
    onError: () => {
      toast.error("Failed to update rate limit");
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleCreate = () => {
    if (keyName.trim()) {
      createMutation.mutate({
        name: keyName.trim(),
        rate_limit_per_min: parseInt(keyRateLimit),
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setNewFullKey(null);
      setKeyName("");
      setKeyRateLimit("60");
      setShowKey(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoint info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] shrink-0">POST</Badge>
            <code className="flex-1 bg-black/50 px-3 py-1.5 font-mono text-xs text-green-400">
              /api/v1/chat
            </code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] shrink-0">GET</Badge>
            <code className="flex-1 bg-black/50 px-3 py-1.5 font-mono text-xs text-green-400">
              /api/v1/health
            </code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] shrink-0">GET</Badge>
            <code className="flex-1 bg-black/50 px-3 py-1.5 font-mono text-xs text-green-400">
              /api/v1/conversations
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Authenticate with <code className="text-foreground">Authorization: Bearer clw_your_key</code>
          </p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Keys
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeCount}/5 active keys
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={activeCount >= 5}>
                <Plus className="h-4 w-4 mr-2" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {newFullKey ? "API Key Created" : "Create API Key"}
                </DialogTitle>
                <DialogDescription>
                  {newFullKey
                    ? "Copy your key now. You won't be able to see it again."
                    : "Give your key a name and set a rate limit."}
                </DialogDescription>
              </DialogHeader>
              {newFullKey ? (
                <div className="py-4">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-black/50 px-3 py-2 font-mono text-sm text-green-400 break-all">
                      {showKey ? newFullKey : newFullKey.replace(/./g, "\u2022")}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                      aria-label={showKey ? "Hide API key" : "Show API key"}
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(newFullKey, "newkey")}
                      aria-label="Copy API key"
                    >
                      {copied === "newkey" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Key Name
                    </label>
                    <Input
                      placeholder="e.g., Production, Development"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && keyName.trim()) handleCreate();
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Rate Limit
                    </label>
                    <Select value={keyRateLimit} onValueChange={setKeyRateLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RATE_LIMITS.map((rl) => (
                          <SelectItem key={rl.value} value={String(rl.value)}>
                            {rl.label} ({rl.value} requests per minute)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                {newFullKey ? (
                  <Button onClick={() => handleDialogClose(false)}>Done</Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!keyName.trim() || createMutation.isPending}
                    >
                      {createMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Create Key
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-6 py-4 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Failed to load keys</p>
              <Button variant="link" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                No API keys yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between px-6 py-3 flex-wrap gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-muted/50 flex items-center justify-center">
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{key.name}</span>
                        <code className="text-xs text-muted-foreground font-mono">
                          {key.key_prefix}...
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          Created{" "}
                          {new Date(key.created_at).toLocaleDateString()}
                        </span>
                        {key.usage_count > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{key.usage_count} total</span>
                          </>
                        )}
                        {keyStats[key.id] && (
                          <>
                            <span>&middot;</span>
                            <span>{keyStats[key.id].today} today</span>
                            <span>&middot;</span>
                            <span>{keyStats[key.id].week} this week</span>
                            {keyStats[key.id].errors > 0 && (
                              <>
                                <span>&middot;</span>
                                <span className="text-red-400">{keyStats[key.id].errors} errors</span>
                              </>
                            )}
                          </>
                        )}
                        {key.last_used_at && (
                          <>
                            <span>&middot;</span>
                            <Clock className="h-3 w-3" />
                            <span>
                              Last used{" "}
                              {new Date(key.last_used_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Rate limit badge */}
                    {key.status === "active" && (
                      editRateLimitId === key.id ? (
                        <div className="flex items-center gap-1">
                          <Select
                            value={editRateLimitValue}
                            onValueChange={(v) => {
                              setEditRateLimitValue(v);
                              updateRateLimitMutation.mutate({
                                id: key.id,
                                rate_limit_per_min: parseInt(v),
                              });
                            }}
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RATE_LIMITS.map((rl) => (
                                <SelectItem key={rl.value} value={String(rl.value)}>
                                  {rl.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditRateLimitId(key.id);
                            setEditRateLimitValue(String(key.rate_limit_per_min || 60));
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title="Click to edit rate limit"
                        >
                          <Gauge className="h-3 w-3" />
                          {key.rate_limit_per_min || 60} RPM
                          <Edit2 className="h-2.5 w-2.5 opacity-50" />
                        </button>
                      )
                    )}
                    <Badge
                      variant="outline"
                      className={
                        key.status === "active"
                          ? "text-xs bg-green-500/15 text-green-400 border-green-500/30"
                          : "text-xs bg-red-500/15 text-red-400 border-red-500/30"
                      }
                    >
                      {key.status}
                    </Badge>
                    {key.status === "active" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label="Revoke API key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Revoke API Key?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately revoke &quot;{key.name}
                              &quot;. Any applications using this key will stop
                              working.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeMutation.mutate(key.id)}
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code examples */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Reference
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat">
            <TabsList className="mb-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
            </TabsList>

            {(["chat", "health", "conversations"] as const).map((section) => (
              <TabsContent key={section} value={section}>
                <Tabs defaultValue="curl">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="powershell">PowerShell</TabsTrigger>
                  </TabsList>
                  {(["curl", "python", "javascript", "powershell"] as const).map((lang) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-black/50 p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                          {codeExamples[section][lang]}
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => handleCopy(codeExamples[section][lang], `${section}-${lang}`)}
                          aria-label="Copy code example"
                        >
                          {copied === `${section}-${lang}` ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>

          {/* Agent parameter docs */}
          <div className="mt-4 p-3 border border-border text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Agent Parameter</p>
            <p>The <code className="text-foreground">agent</code> parameter specifies which deployed agent to talk to. Use the agent name as shown in your Agents page.</p>
            <p>If omitted, defaults to the first deployed agent. Use <code className="text-foreground">GET /api/v1/health</code> to see available agents.</p>
            <p>The <code className="text-foreground">session_id</code> parameter maintains conversation state across requests. Same session_id = continued conversation.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
