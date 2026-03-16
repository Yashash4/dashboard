"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Link2,
  Plus,
  X,
  Search,
  Loader2,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MCTask } from "@/types/mission-control";

interface Dependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  depends_on: {
    id: string;
    title: string;
    column_id: string;
  } | null;
}

interface TaskDependenciesProps {
  task: MCTask;
  allTasks: MCTask[];
}

export function TaskDependencies({ task, allTasks }: TaskDependenciesProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // Fetch dependencies where this task depends on others
  const { data: dependencies = [], isLoading: loadingDeps } = useQuery<Dependency[]>({
    queryKey: ["mc-task-deps", task.id],
    queryFn: async () => {
      const res = await fetch(`/api/mission-control/tasks/${task.id}/dependencies`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.dependencies || [];
    },
  });

  // Find tasks that depend on this task (blockers)
  const blockedTasks = useMemo(() => {
    // We need to check other tasks' dependencies to find which ones this task blocks
    // Since we only have the current task's deps from API, we derive blockers from allTasks
    return allTasks.filter((t) => t.id !== task.id);
  }, [allTasks, task.id]);

  // Searchable tasks for adding dependencies
  const searchableTasks = useMemo(() => {
    const depIds = new Set(dependencies.map((d) => d.depends_on_task_id));
    return allTasks
      .filter((t) => t.id !== task.id && !depIds.has(t.id))
      .filter((t) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
      });
  }, [allTasks, task.id, dependencies, searchQuery]);

  async function handleAddDependency(dependsOnId: string) {
    setAdding(dependsOnId);
    try {
      const res = await fetch(`/api/mission-control/tasks/${task.id}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depends_on_task_id: dependsOnId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to add dependency");
      }
      queryClient.invalidateQueries({ queryKey: ["mc-task-deps", task.id] });
      toast.success("Dependency added");
      setAddDialogOpen(false);
      setSearchQuery("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add dependency");
    } finally {
      setAdding(null);
    }
  }

  async function handleRemoveDependency(depId: string) {
    setRemoving(depId);
    try {
      const res = await fetch(`/api/mission-control/tasks/${task.id}/dependencies`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependency_id: depId }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["mc-task-deps", task.id] });
      toast.success("Dependency removed");
    } catch {
      toast.error("Failed to remove dependency");
    } finally {
      setRemoving(null);
    }
  }

  const columnLabel = (colId: string) => {
    const labels: Record<string, string> = {
      planning: "Planning",
      inbox: "Inbox",
      assigned: "Assigned",
      in_progress: "In Progress",
      testing: "Testing",
      review: "Review",
      done: "Done",
    };
    return labels[colId] || colId;
  };

  return (
    <div className="space-y-4">
      {/* This task depends on */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Depends on
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        {loadingDeps ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : dependencies.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-2 text-center">
            No dependencies
          </p>
        ) : (
          <div className="space-y-1.5">
            {dependencies.map((dep) => {
              const depTask = dep.depends_on;
              const isDone = depTask?.column_id === "done";
              return (
                <div
                  key={dep.id}
                  className="flex items-center gap-2 px-2 py-1.5 border border-border rounded-sm group"
                >
                  <Link2 className={`h-3 w-3 shrink-0 ${isDone ? "text-green-500" : "text-orange-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                      {depTask?.title || dep.depends_on_task_id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[8px] font-mono shrink-0 ${isDone ? "text-green-500 border-green-500/30" : ""}`}
                  >
                    {depTask ? columnLabel(depTask.column_id) : "Unknown"}
                  </Badge>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                    onClick={() => handleRemoveDependency(dep.id)}
                    disabled={removing === dep.id}
                  >
                    {removing === dep.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Dependency Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Dependency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {searchableTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No matching tasks
                </p>
              ) : (
                searchableTasks.slice(0, 20).map((t) => (
                  <button
                    key={t.id}
                    className="w-full flex items-center gap-2 px-2 py-2 text-left rounded-sm hover:bg-accent/50 transition-colors"
                    onClick={() => handleAddDependency(t.id)}
                    disabled={adding === t.id}
                  >
                    {adding === t.id ? (
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    ) : (
                      <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {columnLabel(t.column_id)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Hook to check if a task has unresolved dependencies.
 * Returns true if any dependency is not in "done" column.
 */
export function useTaskHasUnresolvedDeps(taskId: string | undefined) {
  const { data } = useQuery<Dependency[]>({
    queryKey: ["mc-task-deps", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await fetch(`/api/mission-control/tasks/${taskId}/dependencies`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.dependencies || [];
    },
    enabled: !!taskId,
    staleTime: 30000,
  });

  if (!data || data.length === 0) return false;
  return data.some((d) => d.depends_on?.column_id !== "done");
}
