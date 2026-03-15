"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Plus,
  Search,
  LayoutDashboard,
  Bot,
  Activity,
  Radio,
  ListChecks,
  Keyboard,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MC_SHORTCUTS } from "@/lib/mc-keyboard";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onCreateTask,
}: CommandPaletteProps) {
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) setShowShortcuts(false);
  }, [open]);

  const navigate = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  if (showShortcuts) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowShortcuts(false)}
              >
                Back
              </button>
            </div>
            <div className="space-y-2">
              {MC_SHORTCUTS.map((s) => (
                <div
                  key={s.keys}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-muted-foreground">
                    {s.label}
                  </span>
                  <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <Command className="bg-transparent" loop>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Search commands..."
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="text-xs text-muted-foreground px-2 py-1.5">
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => {
                  onCreateTask?.();
                  onOpenChange(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Create Task
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => setShowShortcuts(true)}
              >
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigate" className="text-xs text-muted-foreground px-2 py-1.5">
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => navigate("/mission-control")}
              >
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => navigate("/mission-control/tasks")}
              >
                <ListChecks className="h-4 w-4" />
                Task Board
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => navigate("/mission-control/agents")}
              >
                <Bot className="h-4 w-4" />
                Agent Roster
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => navigate("/mission-control/events")}
              >
                <Activity className="h-4 w-4" />
                Event Feed
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => navigate("/mission-control/sessions")}
              >
                <Radio className="h-4 w-4" />
                Sessions
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate
              <kbd className="font-mono bg-muted px-1 rounded ml-2">↵</kbd> select
              <kbd className="font-mono bg-muted px-1 rounded ml-2">esc</kbd> close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
