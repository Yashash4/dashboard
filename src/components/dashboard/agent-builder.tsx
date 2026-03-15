"use client";

import { useState, useCallback } from "react";
import {
  Wand2,
  Loader2,
  Rocket,
  FileText,
  Code,
  Eye,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Model {
  name: string;
  display_name: string;
}

const TOOL_GROUPS = [
  {
    name: "Coding",
    tools: [
      { id: "read", label: "Read Files", desc: "Read file contents" },
      { id: "write", label: "Write Files", desc: "Create or overwrite files" },
      { id: "edit", label: "Edit Files", desc: "Make targeted edits" },
      { id: "exec", label: "Execute", desc: "Run system commands" },
      { id: "bash", label: "Bash", desc: "Run bash scripts" },
    ],
  },
  {
    name: "Browser",
    tools: [
      { id: "browser", label: "Browse Pages", desc: "Navigate and read web pages" },
      { id: "web", label: "Web Search", desc: "Search the internet" },
    ],
  },
  {
    name: "Memory",
    tools: [
      { id: "memory_search", label: "Search Memory", desc: "Search agent memory" },
      { id: "memory_get", label: "Get Memory", desc: "Retrieve specific memories" },
    ],
  },
  {
    name: "Session",
    tools: [
      { id: "agents_list", label: "List Agents", desc: "See available agents" },
      { id: "sessions_list", label: "List Sessions", desc: "See chat sessions" },
    ],
  },
  {
    name: "Thinking",
    tools: [
      { id: "thinking", label: "Reasoning", desc: "Internal reasoning and planning" },
    ],
  },
];

const EXAMPLE_PROMPTS = [
  "Customer support agent that handles refunds and order inquiries",
  "Research assistant that searches the web and summarizes findings",
  "Content writer for blog posts with SEO awareness",
  "Code review agent that checks for bugs and security issues",
  "Data analyst that reads CSV files and generates insights",
];

export function AgentBuilder({ models }: { models: Model[] }) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // AI mode state
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  // Manual mode state
  const [agentName, setAgentName] = useState("");
  const [soulContent, setSoulContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState("");
  const [emoji, setEmoji] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>(["read", "thinking"]);
  const [primaryModel, setPrimaryModel] = useState("default");
  const [fallbackModel, setFallbackModel] = useState("default");
  const [userContext, setUserContext] = useState("");

  // Shared state
  const [configFiles, setConfigFiles] = useState<Record<string, string> | null>(null);
  const [previewTab, setPreviewTab] = useState("SOUL.md");
  const [deploying, setDeploying] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  const sanitizeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Generation failed");
        return;
      }

      const { generated } = await res.json();

      // Parse config_json to extract name
      let parsedConfig: any = {};
      try {
        parsedConfig = typeof generated.config_json === "string"
          ? JSON.parse(generated.config_json)
          : generated.config_json;
      } catch {
        parsedConfig = {};
      }

      const configJson = typeof generated.config_json === "string"
        ? generated.config_json
        : JSON.stringify(generated.config_json, null, 2);

      setConfigFiles({
        "SOUL.md": generated.soul_md,
        "identity.md": generated.identity_md,
        "TOOLS.md": generated.tools_md,
        "config.json": configJson,
      });

      // Extract name from identity.md for the agent name
      const nameMatch = generated.identity_md?.match(/^#\s*(.+)/m);
      if (nameMatch) setAgentName(sanitizeName(nameMatch[1]));
      else if (parsedConfig.identity?.name) setAgentName(sanitizeName(parsedConfig.identity.name));

      toast.success("Agent config generated! Review and deploy.");
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateField = async (field: string) => {
    if (field === "soul" && !displayName && !agentName && !theme) return;
    setGeneratingField(field);

    const promptMap: Record<string, string> = {
      soul: `Generate a detailed SOUL.md personality file for an AI agent named "${displayName || agentName}". Theme: ${theme || "helpful assistant"}. Include sections for personality traits, communication style, knowledge areas, and behavioral guidelines. Write at least 500 characters.`,
    };

    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: promptMap[field] || `Generate ${field} for an AI agent` }),
      });

      if (res.ok) {
        const { generated } = await res.json();
        if (field === "soul" && generated.soul_md) {
          setSoulContent(generated.soul_md);
          toast.success("Personality generated!");
        }
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setGeneratingField(null);
    }
  };

  const buildConfigFromForm = useCallback(() => {
    const name = agentName || sanitizeName(displayName || "my-agent");
    const config: Record<string, string> = {
      "SOUL.md": soulContent || `# ${displayName || name}\n\nA helpful AI assistant.`,
      "identity.md": `# ${displayName || name}\ntheme: ${theme || "helpful assistant"}\nemoji: ${emoji || "🤖"}`,
      "TOOLS.md": selectedTools.map((t) => `- ${t}`).join("\n"),
      "config.json": JSON.stringify({
        model: {
          primary: primaryModel === "default" ? "clawhq/default" : primaryModel,
          fallbacks: fallbackModel !== "default" ? [fallbackModel] : [],
        },
        identity: { name: displayName || name, theme: theme || "helpful assistant", emoji: emoji || "🤖" },
        sandbox: { mode: "all", workspaceAccess: "rw", scope: "agent" },
        tools: { allow: selectedTools, deny: [] },
      }, null, 2),
    };
    if (userContext.trim()) config["USER.md"] = userContext.trim();
    return config;
  }, [agentName, displayName, soulContent, theme, emoji, selectedTools, primaryModel, fallbackModel, userContext]);

  const handlePreviewManual = () => {
    const config = buildConfigFromForm();
    setConfigFiles(config);
    if (!agentName && displayName) setAgentName(sanitizeName(displayName));
  };

  const handleDeploy = async () => {
    if (!configFiles || !agentName) {
      toast.error("Agent name and config are required");
      return;
    }

    setDeploying(true);
    try {
      // First check if agent exists in user's library — if not, we need to create it
      const res = await fetch("/api/agents/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentName,
          config_files: configFiles,
          from_builder: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Deploy failed");
        return;
      }

      toast.success(`${agentName} deployed successfully!`);
      // Reset state
      setConfigFiles(null);
      setAiDescription("");
      setAgentName("");
      setSoulContent("");
      setDisplayName("");
      setTheme("");
      setEmoji("");
      setSelectedTools(["read", "thinking"]);
      setUserContext("");
    } catch {
      toast.error("Deploy failed");
    } finally {
      setDeploying(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  };

  // Preview mode — show config files
  if (configFiles) {
    const fileNames = Object.keys(configFiles);
    return (
      <div className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Preview: {agentName || "agent"}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfigFiles(null)}>
                  Edit
                </Button>
                <Button size="sm" onClick={handleDeploy} disabled={deploying}>
                  {deploying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  Deploy Agent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block">Agent Name (filesystem safe)</label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(sanitizeName(e.target.value))}
                placeholder="my-agent"
                className="font-mono"
              />
            </div>
            <Tabs value={previewTab} onValueChange={setPreviewTab}>
              <TabsList>
                {fileNames.map((f) => (
                  <TabsTrigger key={f} value={f} className="text-xs font-mono">
                    {f}
                  </TabsTrigger>
                ))}
              </TabsList>
              {fileNames.map((f) => (
                <TabsContent key={f} value={f}>
                  <textarea
                    value={configFiles[f]}
                    onChange={(e) =>
                      setConfigFiles((prev) => prev ? { ...prev, [f]: e.target.value } : null)
                    }
                    rows={15}
                    className="w-full border border-input bg-black/30 px-4 py-3 font-mono text-xs text-green-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as "ai" | "manual")}>
      <TabsList className="mb-6">
        <TabsTrigger value="ai">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          AI Assistant
        </TabsTrigger>
        <TabsTrigger value="manual">
          <Wrench className="h-3.5 w-3.5 mr-1.5" />
          Manual Builder
        </TabsTrigger>
      </TabsList>

      {/* AI-Assisted Mode */}
      <TabsContent value="ai">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Describe Your Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe the agent you want to create..."
              rows={5}
              className="w-full border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAiDescription(p)}
                  className="text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            <Button
              onClick={handleAiGenerate}
              disabled={!aiDescription.trim() || generating}
              className="w-full"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate Agent
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Manual Builder Mode */}
      <TabsContent value="manual">
        <div className="space-y-6">
          {/* Agent Name */}
          <Card className="border-border">
            <CardContent className="pt-6">
              <label className="text-sm font-medium mb-1.5 block">Agent Name</label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(sanitizeName(e.target.value))}
                placeholder="my-support-bot"
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Lowercase, no spaces. Used as folder name on VPS.</p>
            </CardContent>
          </Card>

          {/* Personality (SOUL.md) */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Personality</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleGenerateField("soul")}
                disabled={generatingField === "soul"}
              >
                {generatingField === "soul" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3 mr-1" />
                )}
                Generate with AI
              </Button>
            </CardHeader>
            <CardContent>
              <textarea
                value={soulContent}
                onChange={(e) => setSoulContent(e.target.value)}
                placeholder="Describe the agent's personality, communication style, knowledge areas, and behavioral guidelines..."
                rows={8}
                className="w-full border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </CardContent>
          </Card>

          {/* Identity */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Support Bot" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Emoji</label>
                  <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🤖" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Theme</label>
                <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="helpful assistant" />
              </div>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TOOL_GROUPS.map((group) => (
                  <div key={group.name}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{group.name}</p>
                    <div className="space-y-1.5">
                      {group.tools.map((tool) => (
                        <label key={tool.id} className="flex items-center gap-3 cursor-pointer py-1">
                          <Checkbox
                            checked={selectedTools.includes(tool.id)}
                            onCheckedChange={() => toggleTool(tool.id)}
                          />
                          <div>
                            <span className="text-sm">{tool.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{tool.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Primary</label>
                  <Select value={primaryModel} onValueChange={setPrimaryModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">VPS Default</SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Fallback</label>
                  <Select value={fallbackModel} onValueChange={setFallbackModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">None</SelectItem>
                      {models.filter((m) => m.name !== primaryModel).map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Context */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">User Context <span className="text-muted-foreground font-normal">(optional)</span></CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="Tell the agent about yourself or your company..."
                rows={3}
                className="w-full border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </CardContent>
          </Card>

          {/* Preview button */}
          <Button onClick={handlePreviewManual} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Preview & Deploy
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
