"use client";

import { useState } from "react";
import {
  Plus,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  X,
  ListChecks,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "./priority-badge";
import { mockTasks } from "@/lib/mock-data/mission-control";
import { MC_COLUMNS, type MCTask } from "@/types/mission-control";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const COLUMN_COLORS: Record<string, string> = {
  inbox: "border-t-zinc-500",
  backlog: "border-t-yellow-500",
  in_progress: "border-t-blue-500",
  review: "border-t-violet-500",
  done: "border-t-green-500",
};

export function TaskBoard() {
  const [tasks] = useState<MCTask[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<MCTask | null>(null);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {MC_COLUMNS.map((col) => {
          const columnTasks = tasks
            .filter((t) => t.column_id === col.id)
            .sort((a, b) => a.position - b.position);

          return (
            <div key={col.id} className="flex-shrink-0 w-[300px]">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono h-5 px-1.5"
                  >
                    {columnTasks.length}
                  </Badge>
                </div>
                {col.id === "inbox" && (
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Task Cards */}
              <div className={`space-y-2 min-h-[200px] p-2 border border-border/50 rounded-sm border-t-2 ${COLUMN_COLORS[col.id] || ""}`}>
                {columnTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="border-border cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium leading-tight">
                            {task.title}
                          </p>
                          <PriorityBadge priority={task.priority} />
                        </div>

                        {task.metadata?.subtasks &&
                          task.metadata.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <ListChecks className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {task.metadata.subtasks.filter((s) => s.completed).length}
                                /{task.metadata.subtasks.length}
                              </span>
                            </div>
                          )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {task.assigned_agent && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Bot className="h-3 w-3" />
                                {task.assigned_agent.name}
                              </span>
                            )}
                          </div>
                          {task.due_date && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>

                        {task.metadata?.tags && task.metadata.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {task.metadata.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-4 font-mono"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <SheetTitle className="text-left pr-4">
                    {selectedTask.title}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <PriorityBadge priority={selectedTask.priority} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className="text-[10px] font-mono capitalize">
                      {selectedTask.column_id.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                    <span className="text-sm">
                      {selectedTask.assigned_agent?.name || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                    <span className="text-sm">
                      {selectedTask.due_date
                        ? formatDate(selectedTask.due_date)
                        : "No due date"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <span className="text-sm">
                      {formatTimeAgo(selectedTask.created_at)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Updated</p>
                    <span className="text-sm">
                      {formatTimeAgo(selectedTask.updated_at)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Description
                    </p>
                    <p className="text-sm">{selectedTask.description}</p>
                  </div>
                )}

                {/* Acceptance Criteria */}
                {selectedTask.acceptance_criteria && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Acceptance Criteria
                    </p>
                    <p className="text-sm">{selectedTask.acceptance_criteria}</p>
                  </div>
                )}

                {/* Subtasks */}
                {selectedTask.metadata?.subtasks &&
                  selectedTask.metadata.subtasks.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                        Subtasks
                      </p>
                      <div className="space-y-1.5">
                        {selectedTask.metadata.subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2
                              className={`h-4 w-4 shrink-0 ${
                                sub.completed
                                  ? "text-green-500"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                            <span
                              className={
                                sub.completed
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Tags */}
                {selectedTask.metadata?.tags &&
                  selectedTask.metadata.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                        Tags
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedTask.metadata.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
