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
  Zap,
  Filter,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MC_SHORTCUTS } from "@/lib/mc-keyboard";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask?: () => void;
  onOpenAutomationRules?: () => void;
  onFilterByPriority?: (priority: string) => void;
  onSearchTasks?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onCreateTask,
  onOpenAutomationRules,
  onFilterByPriority,
  onSearchTasks,
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

  const runAction = (fn?: () => void) => {
    fn?.();
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
                onSelect={() => runAction(onCreateTask)}
              >
                <Plus className="h-4 w-4" />
                Create Task
                <kbd className="ml-auto text-[10px] font-mono bg-muted px-1 rounded border border-border">n</kbd>
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(onSearchTasks)}
              >
                <Search className="h-4 w-4" />
                Search Tasks
                <kbd className="ml-auto text-[10px] font-mono bg-muted px-1 rounded border border-border">/</kbd>
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(onOpenAutomationRules)}
              >
                <Zap className="h-4 w-4" />
                Automation Rules
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => setShowShortcuts(true)}
              >
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Filter by Priority" className="text-xs text-muted-foreground px-2 py-1.5">
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(() => onFilterByPriority?.("all"))}
              >
                <Filter className="h-4 w-4" />
                All Priorities
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(() => onFilterByPriority?.("critical"))}
              >
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Critical Priority
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(() => onFilterByPriority?.("high"))}
              >
                <ArrowUp className="h-4 w-4 text-orange-400" />
                High Priority
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(() => onFilterByPriority?.("medium"))}
              >
                <Star className="h-4 w-4 text-yellow-400" />
                Medium Priority
              </Command.Item>
              <Command.Item
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer data-[selected=true]:bg-accent"
                onSelect={() => runAction(() => onFilterByPriority?.("low"))}
              >
                <ArrowDown className="h-4 w-4 text-green-400" />
                Low Priority
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
              <kbd className="font-mono bg-muted px-1 rounded">up/down</kbd> navigate
              <kbd className="font-mono bg-muted px-1 rounded ml-2">enter</kbd> select
              <kbd className="font-mono bg-muted px-1 rounded ml-2">esc</kbd> close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
