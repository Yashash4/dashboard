"use client";

import { useMemo } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTaskCard } from "./task-board-card";
import type { MCTask } from "@/types/mission-control";

const COLUMN_COLORS: Record<string, string> = {
  planning: "border-t-purple-500",
  inbox: "border-t-pink-500",
  assigned: "border-t-blue-500",
  in_progress: "border-t-yellow-500",
  testing: "border-t-cyan-500",
  review: "border-t-violet-500",
  done: "border-t-green-500",
};

export function DroppableColumn({
  columnId,
  label,
  tasks,
  onTaskClick,
  onAddClick,
  onSendToInbox,
  focusedTaskId,
  isDropTarget,
}: {
  columnId: string;
  label: string;
  tasks: MCTask[];
  onTaskClick: (task: MCTask) => void;
  onAddClick?: () => void;
  onSendToInbox?: (taskId: string) => void;
  focusedTaskId?: string | null;
  isDropTarget?: boolean;
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <Badge
            variant="outline"
            className="text-[10px] font-mono h-5 px-1.5"
          >
            {tasks.length}
          </Badge>
        </div>
        {onAddClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onAddClick}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          className={`space-y-2 min-h-[200px] p-2 border rounded-sm border-t-2 transition-colors ${COLUMN_COLORS[columnId] || ""} ${
            isDropTarget ? "border-primary/40 bg-primary/5" : "border-border/50"
          }`}
          data-column-id={columnId}
        >
          {tasks.length === 0 ? (
            <div className="border border-dashed border-border/50 rounded-sm py-8 text-center">
              <p className="text-xs text-muted-foreground/60">
                Drag tasks here
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onSendToInbox={
                  onSendToInbox ? () => onSendToInbox(task.id) : undefined
                }
                isFocused={focusedTaskId === task.id}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export { COLUMN_COLORS };
