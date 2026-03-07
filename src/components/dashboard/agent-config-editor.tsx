"use client";

import { useState } from "react";
import { Settings, Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AgentConfigEditorProps {
  userAgentId: string;
  agentId: string;
  agentName: string;
  defaultConfig: Record<string, string>;
  customConfig: Record<string, string> | null;
  deployed: boolean;
}

export function AgentConfigEditor({
  userAgentId,
  agentId,
  agentName,
  defaultConfig,
  customConfig,
  deployed,
}: AgentConfigEditorProps) {
  const activeConfig = customConfig || defaultConfig || {};
  const [config, setConfig] = useState<Record<string, string>>({ ...activeConfig });
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const updateField = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const removeField = (key: string) => {
    setConfig((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addField = () => {
    const trimmed = newKey.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
    if (!trimmed) return;
    if (config[trimmed] !== undefined) {
      toast.error("Field already exists");
      return;
    }
    setConfig((prev) => ({ ...prev, [trimmed]: "" }));
    setNewKey("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/agents/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          user_agent_id: userAgentId,
          config,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save configuration");
        return;
      }

      toast.success(
        deployed
          ? "Configuration saved and applied to your instance"
          : "Configuration saved"
      );
      setOpen(false);
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({ ...defaultConfig });
    toast.info("Reset to default configuration");
  };

  const configKeys = Object.keys(config);
  const hasChanges =
    JSON.stringify(config) !== JSON.stringify(activeConfig);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {agentName}</DialogTitle>
          <DialogDescription>
            Edit the agent&apos;s configuration files. Changes are saved to your
            account
            {deployed ? " and applied to your running instance" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {configKeys.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No configuration files. Add one below.
            </p>
          )}

          {/* Prompt field first (if exists), then others */}
          {configKeys
            .sort((a, b) => {
              if (a === "prompt") return -1;
              if (b === "prompt") return 1;
              return a.localeCompare(b);
            })
            .map((key) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium capitalize">
                    {key === "prompt" ? "System Prompt" : key}
                  </Label>
                  {key !== "prompt" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeField(key)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={config[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="min-h-[100px] font-mono text-sm resize-y"
                  placeholder={
                    key === "prompt"
                      ? "Enter the system prompt for this agent..."
                      : `Content for ${key}...`
                  }
                />
              </div>
            ))}

          {/* Add new field */}
          <div className="border-t border-border pt-4">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Add Config File
            </Label>
            <div className="flex gap-2">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="filename (e.g. knowledge_base)"
                className="flex-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addField()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addField}
                disabled={!newKey.trim()}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={saving}
            className="text-muted-foreground"
          >
            Reset to Default
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Save className="mr-2 h-3 w-3" />
            )}
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
