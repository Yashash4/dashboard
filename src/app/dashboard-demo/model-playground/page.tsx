"use client";

import { useState } from "react";
import {
  Play,
  Clock,
  Settings,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const DEMO_MODELS = [
  { name: "kimi-k2.5", display_name: "Kimi K2.5", description: "Moonshot AI's latest model" },
  { name: "minimax-m2.7", display_name: "MiniMax M2.7", description: "MiniMax's powerful model" },
  { name: "deepseek-v3", display_name: "DeepSeek V3", description: "DeepSeek's reasoning model" },
  { name: "llama-4", display_name: "Llama 4", description: "Meta's open-source model" },
  { name: "qwen-3", display_name: "Qwen 3", description: "Alibaba's multilingual model" },
  { name: "mistral", display_name: "Mistral", description: "Mistral AI's efficient model" },
];

const DEMO_RESPONSE_1 = {
  content: "**Quantum computing** leverages the principles of quantum mechanics to process information in fundamentally different ways than classical computers.\n\nKey concepts:\n- **Qubits** can exist in superposition, representing both 0 and 1 simultaneously\n- **Entanglement** allows qubits to be correlated regardless of distance\n- **Quantum gates** manipulate qubits to perform computations\n\nThis enables quantum computers to solve certain problems exponentially faster than classical computers.",
  error: null,
  responseTimeMs: 2340,
};

const DEMO_RESPONSE_2 = {
  content: "Quantum computing is a type of computation that harnesses quantum mechanical phenomena like **superposition** and **entanglement** to process data.\n\nUnlike classical bits (0 or 1), quantum bits (**qubits**) can be in multiple states at once. This parallelism allows quantum computers to:\n\n1. Factor large numbers efficiently (Shor's algorithm)\n2. Search unsorted databases faster (Grover's algorithm)\n3. Simulate molecular interactions for drug discovery\n\nHowever, quantum computers are still in early stages and face challenges like decoherence and error correction.",
  error: null,
  responseTimeMs: 1870,
};

export default function ModelPlaygroundDemoPage() {
  const [model1, setModel1] = useState(DEMO_MODELS[0].name);
  const [model2, setModel2] = useState(DEMO_MODELS[2].name);
  const [prompt, setPrompt] = useState("Explain quantum computing in simple terms");
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(1024);

  const getDisplayName = (name: string) =>
    DEMO_MODELS.find((m) => m.name === name)?.display_name || name;

  const renderPanel = (
    label: string,
    modelName: string,
    response: { content: string | null; error: string | null; responseTimeMs: number },
  ) => (
    <Card className="border-border transition-all border-green-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {getDisplayName(modelName)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed min-h-[100px] max-h-[400px] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(response.content || "") }} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <Clock className="h-3 w-3" />
            <span>{(response.responseTimeMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Model Playground</h1>
      <p className="text-muted-foreground mb-6">
        Compare AI models side by side. Each comparison sends 2 requests.
      </p>

      <div className="space-y-6">
        {/* Model selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Model 1</label>
            <Select value={model1} onValueChange={setModel1}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEMO_MODELS.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Model 2</label>
            <Select value={model2} onValueChange={setModel2}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEMO_MODELS.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Response panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderPanel("Model 1", model1, DEMO_RESPONSE_1)}
          {renderPanel("Model 2", model2, DEMO_RESPONSE_2)}
        </div>

        {/* Prompt input */}
        <div className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here... (Enter to compare, Shift+Enter for newline)"
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Each comparison sends 2 requests using your active plan.
            </p>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Advanced Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Temperature</label>
                        <span className="text-xs text-muted-foreground font-mono">
                          {temperature.toFixed(1)}
                        </span>
                      </div>
                      <Slider
                        value={[temperature]}
                        onValueChange={([v]) => setTemperature(v)}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Lower = more focused, higher = more creative
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Max Response Length</label>
                        <span className="text-xs text-muted-foreground font-mono">
                          {maxTokens}
                        </span>
                      </div>
                      <Slider
                        value={[maxTokens]}
                        onValueChange={([v]) => setMaxTokens(v)}
                        min={64}
                        max={4096}
                        step={64}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button disabled>
                <Play className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
