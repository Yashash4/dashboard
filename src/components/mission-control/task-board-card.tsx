"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bot,
  Calendar as CalendarIcon,
  ListChecks,
  GripVertical,
  ArrowRight,
  Link2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import { formatDate, isOverdue } from "@/lib/format-time";
import type { MCTask } from "@/types/mission-control";

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

// ─── Sortable Task Card ────────────────────────────────────
export function SortableTaskCard({
  task,
  onClick,
  onSendToInbox,
  isFocused,
}: {
  task: MCTask;
  onClick: () => void;
  onSendToInbox?: () => void;
  isFocused?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent
        task={task}
        onClick={onClick}
        dragListeners={listeners}
        onSendToInbox={onSendToInbox}
        isFocused={isFocused}
      />
    </div>
  );
}

// ─── Task Card Content ─────────────────────────────────────
export function TaskCardContent({
  task,
  onClick,
  dragListeners,
  onSendToInbox,
  isFocused,
  hasUnresolvedDeps,
}: {
  task: MCTask;
  onClick?: () => void;
  dragListeners?: Record<string, unknown>;
  onSendToInbox?: () => void;
  isFocused?: boolean;
  hasUnresolvedDeps?: boolean;
}) {
  const overdue = task.column_id !== "done" && isOverdue(task.due_date);
  const tags = task.metadata?.tags || [];
  const subtasks = task.metadata?.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskPercent = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <Card
      className={`border-border cursor-pointer hover:border-primary/30 transition-colors border-l-[3px] ${PRIORITY_BORDER[task.priority] || ""} ${isFocused ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-1.5">
          <button
            className="mt-1 shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
            {...dragListeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            {/* Row 1: Status dot + ID */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                task.column_id === "done" ? "bg-green-500" :
                task.column_id === "in_progress" ? "bg-blue-500" :
                task.column_id === "review" ? "bg-violet-500" :
                "bg-muted-foreground/30"
              }`} />
              <span className="text-[9px] text-muted-foreground/50 font-mono">
                {task.id.slice(0, 8)}
              </span>
              {hasUnresolvedDeps && (
                <span title="Has unresolved dependencies">
                  <Link2 className="h-3 w-3 text-orange-400 shrink-0" />
                </span>
              )}
            </div>

            {/* Row 2: Title */}
            <p className="text-sm font-medium leading-tight line-clamp-1 mb-0.5">
              {task.title}
            </p>

            {/* Row 3: Description preview (desktop only) */}
            {task.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 hidden sm:block">
                {task.description}
              </p>
            )}

            {/* Subtask progress */}
            {subtasks.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all"
                    style={{ width: `${subtaskPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {completedSubtasks}/{subtasks.length}
                </span>
              </div>
            )}

            {/* Row 4: Priority + Agent */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <PriorityBadge priority={task.priority} />
                {task.assigned_agent && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                    <Bot className="h-3 w-3 shrink-0" />
                    {task.assigned_agent.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.due_date && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                      overdue ? "text-red-400" : "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className={`h-3 w-3 ${overdue ? "text-red-400" : ""}`} />
                    {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>

            {/* Row 5: Tags */}
            {tags.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 font-mono"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 font-mono text-muted-foreground"
                  >
                    +{tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Send to Inbox (Planning only) */}
            {onSendToInbox && task.column_id === "planning" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 h-7 text-[11px] gap-1.5 text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToInbox();
                }}
              >
                Send to Inbox
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { PRIORITY_BORDER };
