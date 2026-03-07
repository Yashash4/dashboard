"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Bot,
  Calendar,
  CheckCircle2,
  ListChecks,
  GripVertical,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "./priority-badge";
import { mockTasks } from "@/lib/mock-data/mission-control";
import { MC_COLUMNS, type MCTask, type MCTaskColumn } from "@/types/mission-control";

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

// ─── Sortable Task Card ────────────────────────────────────
function SortableTaskCard({
  task,
  onClick,
}: {
  task: MCTask;
  onClick: () => void;
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
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent
        task={task}
        onClick={onClick}
        dragListeners={listeners}
      />
    </div>
  );
}

// ─── Task Card Content (reused for card + overlay) ─────────
function TaskCardContent({
  task,
  onClick,
  dragListeners,
}: {
  task: MCTask;
  onClick?: () => void;
  dragListeners?: Record<string, unknown>;
}) {
  return (
    <Card
      className="border-border cursor-pointer hover:border-primary/30 transition-colors"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Droppable Column ──────────────────────────────────────
function DroppableColumn({
  columnId,
  label,
  tasks,
  onTaskClick,
  onAddClick,
}: {
  columnId: string;
  label: string;
  tasks: MCTask[];
  onTaskClick: (task: MCTask) => void;
  onAddClick?: () => void;
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex-shrink-0 w-[300px]">
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
          className={`space-y-2 min-h-[200px] p-2 border border-border/50 rounded-sm border-t-2 ${COLUMN_COLORS[columnId] || ""}`}
          data-column-id={columnId}
        >
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No tasks
            </p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Create Task Dialog ────────────────────────────────────
function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<MCTask>) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority: priority as MCTask["priority"],
      column_id: "inbox",
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Board ────────────────────────────────────────────
export function TaskBoard() {
  const [tasks, setTasks] = useState<MCTask[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<MCTask | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, MCTask[]> = {};
    for (const col of MC_COLUMNS) {
      grouped[col.id] = tasks
        .filter((t) => t.column_id === col.id)
        .sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [tasks]);

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) || null
    : null;

  function findColumn(taskId: string): MCTaskColumn | null {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.column_id : null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    let overCol = findColumn(over.id as string);

    // If dropped over a column container (not a task), get column from data attribute
    if (!overCol) {
      const overElement = document.querySelector(
        `[data-column-id="${over.id}"]`
      );
      if (overElement) {
        overCol = over.id as MCTaskColumn;
      }
    }

    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasks((prev) => {
      return prev.map((t) =>
        t.id === active.id ? { ...t, column_id: overCol } : t
      );
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);

    if (activeCol && overCol && activeCol === overCol) {
      // Reorder within same column
      setTasks((prev) => {
        const colTasks = prev
          .filter((t) => t.column_id === activeCol)
          .sort((a, b) => a.position - b.position);

        const oldIndex = colTasks.findIndex((t) => t.id === active.id);
        const newIndex = colTasks.findIndex((t) => t.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prev;

        const reordered = arrayMove(colTasks, oldIndex, newIndex);
        const otherTasks = prev.filter((t) => t.column_id !== activeCol);

        return [
          ...otherTasks,
          ...reordered.map((t, i) => ({ ...t, position: i })),
        ];
      });
    }
  }

  function handleCreateTask(partial: Partial<MCTask>) {
    const now = new Date().toISOString();
    const inboxTasks = tasks.filter((t) => t.column_id === "inbox");
    const newTask: MCTask = {
      id: `task-${Date.now()}`,
      user_id: "demo",
      title: partial.title || "Untitled",
      description: partial.description || null,
      column_id: "inbox",
      priority: partial.priority || "medium",
      assigned_agent_id: null,
      assigned_agent: null,
      due_date: null,
      position: inboxTasks.length,
      acceptance_criteria: null,
      metadata: {},
      created_at: now,
      updated_at: now,
      completed_at: null,
    };
    setTasks((prev) => [...prev, newTask]);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {MC_COLUMNS.map((col) => (
            <DroppableColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              tasks={tasksByColumn[col.id] || []}
              onTaskClick={setSelectedTask}
              onAddClick={
                col.id === "inbox" ? () => setCreateOpen(true) : undefined
              }
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-[280px]">
              <TaskCardContent task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateTask}
      />

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left pr-4">
                  {selectedTask.title}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Priority
                    </p>
                    <PriorityBadge priority={selectedTask.priority} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Status
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono capitalize"
                    >
                      {selectedTask.column_id.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Assigned To
                    </p>
                    <span className="text-sm">
                      {selectedTask.assigned_agent?.name || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Due Date
                    </p>
                    <span className="text-sm">
                      {selectedTask.due_date
                        ? formatDate(selectedTask.due_date)
                        : "No due date"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Created
                    </p>
                    <span className="text-sm">
                      {formatTimeAgo(selectedTask.created_at)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Updated
                    </p>
                    <span className="text-sm">
                      {formatTimeAgo(selectedTask.updated_at)}
                    </span>
                  </div>
                </div>

                <Separator />

                {selectedTask.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Description
                    </p>
                    <p className="text-sm">{selectedTask.description}</p>
                  </div>
                )}

                {selectedTask.acceptance_criteria && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Acceptance Criteria
                    </p>
                    <p className="text-sm">
                      {selectedTask.acceptance_criteria}
                    </p>
                  </div>
                )}

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
