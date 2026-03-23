"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Clock,
  Code,
  Gauge,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_KEYS = [
  {
    id: "1",
    name: "Production",
    key_prefix: "clw_prod_7a3f",
    usage_count: 12847,
    last_used_at: "2026-03-22T14:30:00Z",
    status: "active" as const,
    rate_limit_per_min: 120,
    created_at: "2026-02-15T10:00:00Z",
    stats: { today: 342, week: 2104, errors: 3 },
  },
  {
    id: "2",
    name: "Development",
    key_prefix: "clw_dev_9b1c",
    usage_count: 3421,
    last_used_at: "2026-03-22T11:15:00Z",
    status: "active" as const,
    rate_limit_per_min: 60,
    created_at: "2026-03-01T08:30:00Z",
    stats: { today: 89, week: 512, errors: 0 },
  },
  {
    id: "3",
    name: "Testing (old)",
    key_prefix: "clw_test_2d4e",
    usage_count: 156,
    last_used_at: "2026-03-10T09:00:00Z",
    status: "revoked" as const,
    rate_limit_per_min: 30,
    created_at: "2026-02-20T14:00:00Z",
    stats: { today: 0, week: 0, errors: 0 },
  },
];

const HOSTNAME = "demo.clawhq.tech";

const CODE_EXAMPLES = {
  chat: {
    curl: `curl -X POST https://${HOSTNAME}/api/v1/chat \\
  -H "Authorization: Bearer clw_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can I help?",
    "agent": "support-bot",
    "session_id": "user-123"
  }'`,
    python: `import requests

response = requests.post(
    "https://${HOSTNAME}/api/v1/chat",
    headers={
        "Authorization": "Bearer clw_your_key",
        "Content-Type": "application/json"
    },
    json={
        "message": "Hello, how can I help?",
        "agent": "support-bot",
        "session_id": "user-123"
    }
)
print(response.json())`,
    javascript: `const response = await fetch("https://${HOSTNAME}/api/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer clw_your_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "Hello, how can I help?",
    agent: "support-bot",
    session_id: "user-123"
  })
});
const data = await response.json();
console.log(data);`,
  },
  health: {
    curl: `curl https://${HOSTNAME}/api/v1/health \\
  -H "Authorization: Bearer clw_your_key"`,
    python: `import requests

response = requests.get(
    "https://${HOSTNAME}/api/v1/health",
    headers={"Authorization": "Bearer clw_your_key"}
)
print(response.json())`,
    javascript: `const response = await fetch("https://${HOSTNAME}/api/v1/health", {
  headers: { "Authorization": "Bearer clw_your_key" }
});
const data = await response.json();
console.log(data);`,
  },
};

export default function ApiAccessDemoPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeCount = DEMO_KEYS.filter((k) => k.status === "active").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">API Access</h1>
      <p className="text-muted-foreground mb-6">
        Direct API access to your OpenClaw instance.
      </p>

      <Tabs defaultValue="keys">
        <TabsList className="mb-6">
          <TabsTrigger value="keys">Keys & Examples</TabsTrigger>
          <TabsTrigger value="docs">API Docs & Playground</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
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
                <Button size="sm" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Key
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {DEMO_KEYS.map((key) => (
                    <div key={key.id} className="flex items-center justify-between px-6 py-3 flex-wrap gap-2">
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
                            <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                            {key.usage_count > 0 && (
                              <>
                                <span>&middot;</span>
                                <span>{key.usage_count.toLocaleString()} total</span>
                              </>
                            )}
                            {key.stats.today > 0 && (
                              <>
                                <span>&middot;</span>
                                <span>{key.stats.today} today</span>
                                <span>&middot;</span>
                                <span>{key.stats.week} this week</span>
                              </>
                            )}
                            {key.stats.errors > 0 && (
                              <>
                                <span>&middot;</span>
                                <span className="text-red-400">{key.stats.errors} errors</span>
                              </>
                            )}
                            {key.last_used_at && (
                              <>
                                <span>&middot;</span>
                                <Clock className="h-3 w-3" />
                                <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {key.status === "active" && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Gauge className="h-3 w-3" />
                            {key.rate_limit_per_min} RPM
                          </span>
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
                      </div>
                    </div>
                  ))}
                </div>
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
                  </TabsList>

                  {(["chat", "health"] as const).map((section) => (
                    <TabsContent key={section} value={section}>
                      <Tabs defaultValue="curl">
                        <TabsList>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                        </TabsList>
                        {(["curl", "python", "javascript"] as const).map((lang) => (
                          <TabsContent key={lang} value={lang}>
                            <div className="relative">
                              <pre className="bg-black/50 p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                                {CODE_EXAMPLES[section][lang]}
                              </pre>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7"
                                onClick={() => handleCopy(CODE_EXAMPLES[section][lang], `${section}-${lang}`)}
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

                <div className="mt-4 p-3 border border-border text-xs text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Agent Parameter</p>
                  <p>The <code className="text-foreground">agent</code> parameter specifies which deployed agent to talk to. Use the agent name as shown in your Agents page.</p>
                  <p>If omitted, defaults to the first deployed agent. Use <code className="text-foreground">GET /api/v1/health</code> to see available agents.</p>
                  <p>The <code className="text-foreground">session_id</code> parameter maintains conversation state across requests. Same session_id = continued conversation.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">API Playground</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Interactive API playground - try sending requests to your endpoints directly from the browser.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
