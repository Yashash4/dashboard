"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EndpointDoc {
  method: string;
  path: string;
  description: string;
  auth: string;
  params: { name: string; type: string; required: boolean; description: string }[];
  response: string;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    method: "POST",
    path: "/api/v1/chat",
    description: "Send a message to your deployed agent and receive a response.",
    auth: "Bearer API key (clw_...)",
    params: [
      { name: "message", type: "string", required: true, description: "The user's message (max 100KB)" },
      { name: "agent", type: "string", required: false, description: "Agent name to talk to. Defaults to first deployed agent." },
      { name: "session_id", type: "string", required: false, description: "Alphanumeric ID for conversation persistence across requests" },
      { name: "stream", type: "boolean", required: false, description: "If true, returns SSE stream instead of JSON response" },
    ],
    response: `{
  "response": "Hello! How can I help you today?",
  "agent": "default"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/health",
    description: "Validate your API key and check available agents. No tokens used.",
    auth: "Bearer API key (clw_...)",
    params: [],
    response: `{
  "status": "ok",
  "plan": "pro",
  "key_name": "Production",
  "rate_limit": 60,
  "agents": ["default", "support-bot"]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/conversations",
    description: "List your conversations. Filterable by agent, paginated.",
    auth: "Bearer API key (clw_...)",
    params: [
      { name: "agent", type: "string", required: false, description: "Filter by agent name" },
      { name: "limit", type: "number", required: false, description: "Results per page (max 100, default 20)" },
      { name: "offset", type: "number", required: false, description: "Skip N results (default 0)" },
    ],
    response: `{
  "conversations": [
    {
      "id": "uuid",
      "agent_name": "default",
      "created_at": "2026-03-15T10:00:00Z",
      "last_message_at": "2026-03-15T10:05:00Z"
    }
  ],
  "total": 42
}`,
  },
  {
    method: "GET",
    path: "/api/v1/conversations/:id/messages",
    description: "Get messages for a conversation. Paginated, newest first.",
    auth: "Bearer API key (clw_...)",
    params: [
      { name: "limit", type: "number", required: false, description: "Messages per page (max 200, default 50)" },
      { name: "offset", type: "number", required: false, description: "Skip N messages (default 0)" },
    ],
    response: `{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello!",
      "created_at": "2026-03-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi there! How can I help?",
      "created_at": "2026-03-15T10:00:01Z"
    }
  ]
}`,
  },
];

export function ApiPlayground() {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [tryMessage, setTryMessage] = useState("");
  const [tryAgent, setTryAgent] = useState("");
  const [tryStream, setTryStream] = useState(false);
  const [tryResult, setTryResult] = useState<string | null>(null);
  const [trying, setTrying] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Fetch user's API keys for the "Try it" dropdown
  const { data: keysData } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/keys");
      if (!res.ok) return { keys: [] };
      return res.json();
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied");
  };

  const handleTryChat = async () => {
    if (!tryMessage.trim()) return;
    setTrying(true);
    setTryResult(null);

    const appUrl = typeof window !== "undefined" ? window.location.origin : "";

    try {
      const payload: Record<string, unknown> = { message: tryMessage.trim() };
      if (tryAgent) payload.agent = tryAgent;
      if (tryStream) payload.stream = true;

      const startMs = Date.now();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKeyInput.trim()) {
        headers["Authorization"] = `Bearer ${apiKeyInput.trim()}`;
      }

      const res = await fetch(`${appUrl}/api/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const elapsed = Date.now() - startMs;

      if (tryStream && res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let streamedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                streamedContent += parsed.content || "";
              } catch {
                // skip unparseable
              }
            }
          }
        }

        setTryResult(JSON.stringify({
          response: streamedContent,
          streamed: true,
          elapsed_ms: elapsed,
        }, null, 2));
      } else {
        const data = await res.json();
        setTryResult(JSON.stringify({
          status: res.status,
          elapsed_ms: elapsed,
          ...data,
        }, null, 2));
      }
    } catch (err) {
      setTryResult(JSON.stringify({
        error: err instanceof Error ? err.message : "Request failed",
      }, null, 2));
    } finally {
      setTrying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoint reference */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            API Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {ENDPOINTS.map((ep) => {
            const key = `${ep.method}-${ep.path}`;
            const isExpanded = expandedEndpoint === key;
            return (
              <div key={key}>
                <button
                  onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${
                      ep.method === "GET"
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        : "bg-green-500/15 text-green-400 border-green-500/30"
                    }`}
                  >
                    {ep.method}
                  </Badge>
                  <code className="text-sm font-mono">{ep.path}</code>
                  <span className="text-xs text-muted-foreground ml-auto">{ep.description.slice(0, 60)}...</span>
                </button>
                {isExpanded && (
                  <div className="px-6 pb-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{ep.description}</p>
                    <p className="text-xs"><span className="text-muted-foreground">Auth:</span> <code className="text-foreground">{ep.auth}</code></p>

                    {ep.params.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">Parameters</p>
                        <div className="border border-border divide-y divide-border text-xs">
                          {ep.params.map((p) => (
                            <div key={p.name} className="flex items-center gap-3 px-3 py-2">
                              <code className="font-mono text-foreground w-24 shrink-0">{p.name}</code>
                              <span className="text-muted-foreground w-16 shrink-0">{p.type}</span>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {p.required ? "required" : "optional"}
                              </Badge>
                              <span className="text-muted-foreground">{p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">Response</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(ep.response, key)}
                          aria-label="Copy response"
                        >
                          {copied === key ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-black/50 p-3 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                        {ep.response}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Try it */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Try it Live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Send a real request to your agent. Paste your API key below to authenticate.
          </p>

          <div>
            <label className="text-xs font-medium mb-1 block">API Key</label>
            <Input
              type="password"
              placeholder="clw_..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="font-mono"
            />
            {!apiKeyInput.trim() && (
              <p className="text-[11px] text-yellow-500 mt-1">
                An API key is required. Copy one from the Keys & Examples tab.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Message</label>
              <Input
                placeholder="Hello, how can you help me?"
                value={tryMessage}
                onChange={(e) => setTryMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tryMessage.trim()) handleTryChat();
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Agent (optional)</label>
              <Input
                placeholder="default"
                value={tryAgent}
                onChange={(e) => setTryAgent(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={tryStream}
                onCheckedChange={(checked) => setTryStream(!!checked)}
              />
              Stream response
            </label>

            <Button
              onClick={handleTryChat}
              disabled={!tryMessage.trim() || !apiKeyInput.trim() || trying}
              size="sm"
            >
              {trying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </div>

          {tryResult && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium">Response</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(tryResult, "try-result")}
                  aria-label="Copy response"
                >
                  {copied === "try-result" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="bg-black/50 p-3 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre max-h-[300px] overflow-y-auto">
                {tryResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
