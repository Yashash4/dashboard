"use client";

import { useState } from "react";
import {
  Wand2,
  Sparkles,
  Wrench,
  Eye,
  Rocket,
} from "lucide-react";

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

const DEMO_MODELS = [
  { name: "kimi-k2.5", display_name: "Kimi K2.5" },
  { name: "minimax-m2.7", display_name: "MiniMax M2.7" },
  { name: "deepseek-v3", display_name: "DeepSeek V3" },
  { name: "llama-4", display_name: "Llama 4" },
  { name: "qwen-3", display_name: "Qwen 3" },
  { name: "mistral", display_name: "Mistral" },
];

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

export default function AgentBuilderDemoPage() {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiDescription, setAiDescription] = useState("");
  const [agentName, setAgentName] = useState("");
  const [soulContent, setSoulContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState("");
  const [emoji, setEmoji] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>(["read", "thinking"]);
  const [primaryModel, setPrimaryModel] = useState("default");
  const [fallbackModel, setFallbackModel] = useState("default");
  const [userContext, setUserContext] = useState("");

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Agent Builder</h1>
      <p className="text-muted-foreground mb-6">
        Create custom AI agents with AI-assisted or manual configuration.
      </p>

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

              <Button disabled={!aiDescription.trim()} className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />
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
                  onChange={(e) => setAgentName(e.target.value)}
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
                <Button variant="outline" size="sm" className="text-xs" disabled>
                  <Wand2 className="h-3 w-3 mr-1" />
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
                    <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="&#x1F916;" maxLength={2} />
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
                        {DEMO_MODELS.map((m) => (
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
                        {DEMO_MODELS.filter((m) => m.name !== primaryModel).map((m) => (
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
            <Button disabled className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Preview & Deploy
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
