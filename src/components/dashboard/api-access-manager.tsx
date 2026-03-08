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

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  usage_count: number;
  last_used_at: string | null;
  status: "active" | "revoked";
  created_at: string;
}

function getCodeExamples(endpoint: string) {
  return {
    curl: `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer clw_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how can you help me?", "agent": "default"}'`,
    python: `import requests

response = requests.post(
    "${endpoint}",
    headers={
        "Authorization": "Bearer clw_your_key_here",
        "Content-Type": "application/json",
    },
    json={
        "message": "Hello, how can you help me?",
        "agent": "default",
    },
)

print(response.json())`,
    javascript: `const response = await fetch(
  "${endpoint}",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer clw_your_key_here",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello, how can you help me?",
      agent: "default",
    }),
  }
);

const data = await response.json();
console.log(data);`,
    powershell: `$response = Invoke-RestMethod \`
  -Uri "${endpoint}" \`
  -Method POST \`
  -Headers @{
    "Authorization" = "Bearer clw_your_key_here"
    "Content-Type"  = "application/json"
  } \`
  -Body '{"message": "Hello, how can you help me?", "agent": "default"}'

$response | ConvertTo-Json`,
  };
}

export function ApiAccessManager({ hostname }: { hostname: string | null }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newFullKey, setNewFullKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const endpoint = `${appUrl}/api/v1/chat`;
  const codeExamples = getCodeExamples(endpoint);

  // Fetch keys
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
  const activeCount = keys.filter((k) => k.status === "active").length;

  // Create key
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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

  // Revoke key
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleCreate = () => {
    if (keyName.trim()) {
      createMutation.mutate(keyName.trim());
    }
  };

  const handleDialogClose = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setNewFullKey(null);
      setKeyName("");
      setShowKey(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoint info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            API Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/50 px-4 py-2.5 font-mono text-sm text-green-400">
              {endpoint}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(endpoint, "endpoint")}
            >
              {copied === "endpoint" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
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
                    : "Give your key a name to identify it later."}
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
                <div className="py-4">
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
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Try again
              </button>
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
                  className="flex items-center justify-between px-6 py-3"
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
                            <span>{key.usage_count} requests</span>
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
              Quick Start
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="powershell">PowerShell</TabsTrigger>
            </TabsList>
            {(
              Object.entries(codeExamples) as [string, string][]
            ).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative">
                  <pre className="bg-black/50 p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                    {code}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => handleCopy(code, lang)}
                  >
                    {copied === lang ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
