"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  ExternalLink,
  Code,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
}

// Mock data
const MOCK_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "Production",
    prefix: "sk-claw-prod",
    createdAt: "2026-02-15",
    lastUsedAt: "2026-03-07",
    status: "active",
  },
  {
    id: "2",
    name: "Development",
    prefix: "sk-claw-dev",
    createdAt: "2026-03-01",
    lastUsedAt: null,
    status: "active",
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X POST "https://your-instance.clawhq.tech/api/v1/chat" \
  -H "Authorization: Bearer sk-claw-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me?", "agent": "default"}'`,
  powershell: `$response = Invoke-RestMethod \`
  -Uri "https://your-instance.clawhq.tech/api/v1/chat" \`
  -Method POST \`
  -Headers @{
    "Authorization" = "Bearer sk-claw-xxxxx"
    "Content-Type"  = "application/json"
  } \`
  -Body '{"message": "Hello, how can you help me?", "agent": "default"}'

$response | ConvertTo-Json`,
  python: `import requests

response = requests.post(
    "https://your-instance.clawhq.tech/api/v1/chat",
    headers={
        "Authorization": "Bearer sk-claw-xxxxx",
        "Content-Type": "application/json",
    },
    json={
        "message": "Hello, how can you help me?",
        "agent": "default",
    },
)

print(response.json())`,
  javascript: `const response = await fetch(
  "https://your-instance.clawhq.tech/api/v1/chat",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk-claw-xxxxx",
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
};

export function ApiAccessManager({ hostname }: { hostname: string | null }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const endpoint = hostname
    ? `https://${hostname}/api/v1`
    : "https://your-instance.clawhq.tech/api/v1";

  const handleCreate = () => {
    const key = `sk-claw-${Math.random().toString(36).slice(2, 14)}`;
    setNewKey(key);
    toast.success("API key created");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
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
            OpenAI-compatible API. Use this base URL with any OpenAI SDK.
          </p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            API Keys
          </CardTitle>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) {
                setNewKey(null);
                setKeyName("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {newKey ? "API Key Created" : "Create API Key"}
                </DialogTitle>
                <DialogDescription>
                  {newKey
                    ? "Copy your key now. You won't be able to see it again."
                    : "Give your key a name to identify it later."}
                </DialogDescription>
              </DialogHeader>
              {newKey ? (
                <div className="py-4">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-black/50 px-3 py-2 font-mono text-sm text-green-400 break-all">
                      {showKey ? newKey : newKey.replace(/./g, "\u2022")}
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
                      onClick={() => handleCopy(newKey, "newkey")}
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
                  />
                </div>
              )}
              <DialogFooter>
                {newKey ? (
                  <Button onClick={() => setCreateOpen(false)}>Done</Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!keyName}>
                      Create Key
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {MOCK_KEYS.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {MOCK_KEYS.map((key) => (
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
                          {key.prefix}...
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          Created{" "}
                          {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                        {key.lastUsedAt && (
                          <>
                            <span>&middot;</span>
                            <Clock className="h-3 w-3" />
                            <span>
                              Last used{" "}
                              {new Date(key.lastUsedAt).toLocaleDateString()}
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
                          <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately revoke &quot;{key.name}&quot;.
                            Any applications using this key will stop working.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              toast.success(`Key "${key.name}" revoked`)
                            }
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
              <TabsTrigger value="powershell">PowerShell</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
            {(Object.entries(CODE_EXAMPLES) as [string, string][]).map(
              ([lang, code]) => (
                <TabsContent key={lang} value={lang}>
                  <div className="relative">
                    <pre className="bg-black/50 p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                      {code.replace(
                        "your-instance.clawhq.tech",
                        hostname || "your-instance.clawhq.tech"
                      )}
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
              )
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
