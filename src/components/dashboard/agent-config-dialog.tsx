"use client";

import { useState, useEffect } from "react";
import { Loader2, FileCode, Lock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const FILE_ORDER = ["SOUL.md", "identity.md", "TOOLS.md", "config.json"];

export function AgentConfigDialog({
  agentId,
  agentName,
  open,
  onOpenChange,
  plan,
}: {
  agentId: string;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: string;
}) {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setFiles({});

    fetch(`/api/agents/${agentId}/config`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load config");
          return;
        }
        const f = data.files || {};
        setFiles(f);
        // Set first available tab
        const orderedKeys = FILE_ORDER.filter((k) => k in f);
        const remaining = Object.keys(f).filter((k) => !FILE_ORDER.includes(k));
        const allKeys = [...orderedKeys, ...remaining];
        if (allKeys.length > 0) setActiveTab(allKeys[0]);
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [open, agentId]);

  const orderedKeys = FILE_ORDER.filter((k) => k in files);
  const remainingKeys = Object.keys(files).filter((k) => !FILE_ORDER.includes(k));
  const allKeys = [...orderedKeys, ...remainingKeys];

  const isStarter = plan === "starter";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            {agentName} Config
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center py-8">{error}</p>
        )}

        {!loading && !error && allKeys.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No config files found for this agent.
          </p>
        )}

        {!loading && !error && allKeys.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {allKeys.map((key) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>
            {allKeys.map((key) => (
              <TabsContent key={key} value={key}>
                <ScrollArea className="h-[320px] rounded border border-border bg-muted/50 p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                    {files[key]}
                  </pre>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {isStarter && (
          <div className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2.5 mt-2">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Agent Builder</p>
              <p className="text-xs text-muted-foreground">
                Upgrade to Pro to edit agent configs with the Agent Builder.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href="/billing">Upgrade</a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
