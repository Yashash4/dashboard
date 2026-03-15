"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDERS = [
  { value: "ollama", label: "Local Model Provider" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google (Gemini)" },
  { value: "groq", label: "Groq" },
  { value: "mistral", label: "Mistral" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "openrouter", label: "OpenRouter" },
];

interface ApiKeyRow {
  id: string;
  provider: string;
  base_url: string | null;
  configured_at: string | null;
  created_at: string;
}

export function AdminApiKeys({
  userId,
  hasVps,
}: {
  userId: string;
  hasVps: boolean;
}) {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const fetchKeys = async () => {
    try {
      const res = await fetch(`/api/admin/api-keys?userId=${userId}`);
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [userId]);

  const handleSave = async () => {
    if (!provider || !apiKey) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          provider,
          apiKey,
          baseUrl: baseUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save API key");
        return;
      }

      if (data.configured) {
        toast.success(`${provider} key saved and configured on VPS`);
      } else {
        toast.success(`${provider} key saved (will configure on deploy)`);
      }

      setShowForm(false);
      setProvider("");
      setApiKey("");
      setBaseUrl("");
      fetchKeys();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prov: string) => {
    setDeleting(prov);

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, provider: prov }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }

      toast.success(`${prov} key removed`);
      fetchKeys();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(null);
    }
  };

  const getProviderLabel = (value: string) => {
    return PROVIDERS.find((p) => p.value === value)?.label || value;
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          API Keys
        </CardTitle>
        <Key className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="space-y-3">
            {keys.length > 0 ? (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between gap-2 p-2 border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium">
                        {getProviderLabel(k.provider)}
                      </span>
                      {k.configured_at ? (
                        <Badge className="bg-green-600 text-white border-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-600 text-white border-yellow-600 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {k.base_url && (
                        <span className="text-xs text-muted-foreground truncate">
                          Custom endpoint
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(k.provider)}
                      disabled={deleting === k.provider}
                    >
                      {deleting === k.provider ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No API keys configured
              </p>
            )}

            {showForm ? (
              <div className="space-y-3 p-3 border border-border">
                <div className="space-y-1.5">
                  <Label className="text-xs">Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.filter(
                        (p) => !keys.some((k) => k.provider === p.value)
                      ).map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Base URL{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!provider || !apiKey || saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : null}
                    {hasVps ? "Save & Configure" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      setProvider("");
                      setApiKey("");
                      setBaseUrl("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Key
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
