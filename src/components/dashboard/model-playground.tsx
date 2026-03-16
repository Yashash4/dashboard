"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Loader2,
  Clock,
  Settings,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface Model {
  name: string;
  display_name: string;
  description: string | null;
}

interface ModelResponse {
  content: string | null;
  error: string | null;
  responseTimeMs: number;
}

export function ModelPlayground({ models }: { models: Model[] }) {
  const [model1, setModel1] = useState(models[0]?.name || "");
  const [model2, setModel2] = useState(models[1]?.name || models[0]?.name || "");
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [running, setRunning] = useState(false);
  const [response1, setResponse1] = useState<ModelResponse | null>(null);
  const [response2, setResponse2] = useState<ModelResponse | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCompare = async () => {
    if (!prompt.trim() || !model1 || !model2) return;

    setRunning(true);
    setResponse1(null);
    setResponse2(null);
    setElapsedMs(0);

    const startMs = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startMs);
    }, 100);

    try {
      const res = await fetch("/api/playground/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model1,
          model2,
          prompt: prompt.trim(),
          temperature,
          maxTokens,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Comparison failed");
        return;
      }

      const data = await res.json();
      setResponse1(data.response1);
      setResponse2(data.response2);
    } catch {
      toast.error("Failed to run comparison");
    } finally {
      setRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      setElapsedMs(Date.now() - startMs);
    }
  };

  const getDisplayName = (name: string) =>
    models.find((m) => m.name === name)?.display_name || name;

  const renderPanel = (
    label: string,
    modelName: string,
    response: ModelResponse | null,
    panelState: "idle" | "running" | "done" | "error"
  ) => (
    <Card
      className={`border-border transition-all ${
        panelState === "running"
          ? "border-primary/50 animate-pulse"
          : panelState === "error"
          ? "border-red-500/50"
          : panelState === "done"
          ? "border-green-500/30"
          : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {getDisplayName(modelName)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {panelState === "running" ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{(elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        ) : response ? (
          <div>
            <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed min-h-[100px] max-h-[400px] overflow-y-auto">
              {response.content ? (
                <ReactMarkdown>
                  {response.content}
                </ReactMarkdown>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{response.error || "No response"}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              <Clock className="h-3 w-3" />
              <span>{(response.responseTimeMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Response will appear here
          </p>
        )}
      </CardContent>
    </Card>
  );

  const panel1State = running ? "running" : response1?.error ? "error" : response1 ? "done" : "idle";
  const panel2State = running ? "running" : response2?.error ? "error" : response2 ? "done" : "idle";

  return (
    <div className="space-y-6">
      {/* Model selectors (LOW_24: stack on very narrow screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block">Model 1</label>
          <Select value={model1} onValueChange={setModel1} disabled={running}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Model 2</label>
          <Select value={model2} onValueChange={setModel2} disabled={running}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
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
        {renderPanel("Model 1", model1, response1, panel1State)}
        {renderPanel("Model 2", model2, response2, panel2State)}
      </div>

      {/* Prompt input */}
      <div className="space-y-3">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && prompt.trim() && !running) {
              e.preventDefault();
              handleCompare();
            }
          }}
          placeholder="Type your prompt here... (Enter to compare, Shift+Enter for newline)"
          rows={3}
          className="resize-none"
          disabled={running}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Each comparison sends 2 requests using your active plan.
          </p>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={running}>
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
            <Button
              onClick={handleCompare}
              disabled={!prompt.trim() || !model1 || !model2 || running}
            >
              {running ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Compare
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
