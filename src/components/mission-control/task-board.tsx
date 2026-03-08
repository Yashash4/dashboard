"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMissionControlStream } from "@/hooks/use-mission-control-stream";
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
  ListChecks,
  GripVertical,
  ArrowRight,
  Clock,
  X,
  Trash2,
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
import { PriorityBadge } from "./priority-badge";
import { TaskDetailModal } from "./task-detail-modal";
import {
  mockTasks,
  mockAgentStatuses,
  mockComments,
  mockReviews,
  mockActivities,
} from "@/lib/mock-data/mission-control";
import {
  MC_COLUMNS,
  type MCTask,
  type MCTaskColumn,
  type MCComment,
  type MCReview,
  type MCActivity,
} from "@/types/mission-control";

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

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const COLUMN_COLORS: Record<string, string> = {
  planning: "border-t-purple-500",
  inbox: "border-t-pink-500",
  assigned: "border-t-blue-500",
  in_progress: "border-t-yellow-500",
  testing: "border-t-cyan-500",
  review: "border-t-violet-500",
  done: "border-t-green-500",
};

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

// ─── Sortable Task Card ────────────────────────────────────
function SortableTaskCard({
  task,
  onClick,
  onSendToInbox,
}: {
  task: MCTask;
  onClick: () => void;
  onSendToInbox?: () => void;
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
        onSendToInbox={onSendToInbox}
      />
    </div>
  );
}

// ─── Task Card Content (reused for card + overlay) ─────────
function TaskCardContent({
  task,
  onClick,
  dragListeners,
  onSendToInbox,
}: {
  task: MCTask;
  onClick?: () => void;
  dragListeners?: Record<string, unknown>;
  onSendToInbox?: () => void;
}) {
  const overdue = task.column_id !== "done" && isOverdue(task.due_date);
  const tags = task.metadata?.tags || [];
  const subtasks = task.metadata?.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskPercent = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <Card
      className={`border-border cursor-pointer hover:border-primary/30 transition-colors border-l-[3px] ${PRIORITY_BORDER[task.priority] || ""}`}
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
            {/* Title row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {task.column_id === "planning" && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                  </span>
                )}
                <p className="text-sm font-medium leading-tight line-clamp-2">
                  {task.title}
                </p>
              </div>
              <PriorityBadge priority={task.priority} />
            </div>

            {/* Description preview */}
            {task.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
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

            {/* Bottom row: agent, hours, date, timestamp */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                {task.assigned_agent && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                    <Bot className="h-3 w-3 shrink-0" />
                    {task.assigned_agent.name}
                  </span>
                )}
                {task.estimated_hours && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    ~{task.estimated_hours}h
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
                    <Calendar className={`h-3 w-3 ${overdue ? "text-red-400" : ""}`} />
                    {formatDate(task.due_date)}
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground/60">
                  {formatTimeAgo(task.created_at)}
                </span>
              </div>
            </div>

            {/* Tags (max 3 + overflow) */}
            {tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 font-mono"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 font-mono text-muted-foreground"
                  >
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Send to Inbox button (Planning column only) */}
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

// ─── Droppable Column ──────────────────────────────────────
function DroppableColumn({
  columnId,
  label,
  tasks,
  onTaskClick,
  onAddClick,
  onSendToInbox,
}: {
  columnId: string;
  label: string;
  tasks: MCTask[];
  onTaskClick: (task: MCTask) => void;
  onAddClick?: () => void;
  onSendToInbox?: (taskId: string) => void;
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
                onSendToInbox={
                  onSendToInbox ? () => onSendToInbox(task.id) : undefined
                }
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Create Task Dialog (expanded) ─────────────────────────
const MOCK_AGENTS = mockAgentStatuses.map((a) => ({
  id: a.agent_id,
  name: a.agent?.name || a.agent_id,
}));

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
  const [agentId, setAgentId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAgentId("");
    setDueDate("");
    setEstimatedHours("");
    setTagInput("");
    setTags([]);
    setAcceptanceCriteria("");
    setSubtaskInput("");
    setSubtasks([]);
  };

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const addSubtask = () => {
    const text = subtaskInput.trim();
    if (text) {
      setSubtasks((prev) => [...prev, text]);
      setSubtaskInput("");
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const agent = MOCK_AGENTS.find((a) => a.id === agentId);
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority: priority as MCTask["priority"],
      column_id: "planning",
      assigned_agent_id: agentId || null,
      assigned_agent: agent ? { id: agent.id, name: agent.name } : null,
      due_date: dueDate || null,
      estimated_hours: estimatedHours ? Number(estimatedHours) : null,
      acceptance_criteria: acceptanceCriteria.trim() || null,
      metadata: {
        tags: tags.length > 0 ? tags : undefined,
        subtasks:
          subtasks.length > 0
            ? subtasks.map((s, i) => ({
                id: `st-${Date.now()}-${i}`,
                title: s,
                completed: false,
              }))
            : undefined,
      },
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Title (full width) */}
          <div className="space-y-2">
            <Label htmlFor="ct-title">Title *</Label>
            <Input
              id="ct-title"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description (full width) */}
          <div className="space-y-2">
            <Label htmlFor="ct-desc">Description</Label>
            <Textarea
              id="ct-desc"
              placeholder="What needs to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* 2-column: Priority + Agent */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Assign Agent</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {MOCK_AGENTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2-column: Due Date + Est. Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-due">Due Date</Label>
              <Input
                id="ct-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-hours">Estimated Hours</Label>
              <Input
                id="ct-hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 4"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          </div>

          {/* Tags (full width) */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs font-mono gap-1 pr-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Type tag + Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
          </div>

          {/* Acceptance Criteria (full width) */}
          <div className="space-y-2">
            <Label htmlFor="ct-criteria">Acceptance Criteria</Label>
            <Textarea
              id="ct-criteria"
              placeholder="What defines 'done' for this task..."
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              rows={3}
            />
          </div>

          {/* Subtasks (full width) */}
          <div className="space-y-2">
            <Label>Subtasks</Label>
            {subtasks.length > 0 && (
              <div className="space-y-1">
                {subtasks.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm px-2 py-1 bg-muted/30 rounded-sm"
                  >
                    <span className="truncate">{st}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSubtasks((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-muted-foreground hover:text-red-400 shrink-0 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubtask}
                disabled={!subtaskInput.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Board ────────────────────────────────────────────
export function TaskBoard() {
  useMissionControlStream();

  // Fetch tasks from API, fallback to mock
  const { data: apiTasks } = useQuery<MCTask[]>({
    queryKey: ["mc-tasks"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/mission-control/tasks");
        if (!res.ok) throw new Error();
        const json = await res.json();
        return json.tasks?.length > 0 ? json.tasks : mockTasks;
      } catch {
        return mockTasks;
      }
    },
    refetchInterval: 10000,
  });

  const [tasks, setTasks] = useState<MCTask[]>(mockTasks);
  const [comments, setComments] = useState<MCComment[]>(mockComments);
  const [reviewsList, setReviewsList] = useState<MCReview[]>(mockReviews);
  const [activitiesList, setActivitiesList] =
    useState<MCActivity[]>(mockActivities);
  const [selectedTask, setSelectedTask] = useState<MCTask | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [initialSynced, setInitialSynced] = useState(false);

  // Sync API data on first successful load
  useEffect(() => {
    if (apiTasks && apiTasks.length > 0 && !initialSynced) {
      setTasks(apiTasks);
      setInitialSynced(true);
    }
  }, [apiTasks, initialSynced]);

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
    const planningTasks = tasks.filter((t) => t.column_id === "planning");
    const newTask: MCTask = {
      id: `task-${Date.now()}`,
      user_id: "demo",
      title: partial.title || "Untitled",
      description: partial.description || null,
      column_id: "planning",
      priority: partial.priority || "medium",
      assigned_agent_id: partial.assigned_agent_id || null,
      assigned_agent: partial.assigned_agent || null,
      created_by: "user",
      due_date: partial.due_date || null,
      estimated_hours: partial.estimated_hours || null,
      actual_hours: null,
      position: planningTasks.length,
      acceptance_criteria: partial.acceptance_criteria || null,
      outcome: null,
      error_message: null,
      resolution: null,
      metadata: partial.metadata || {},
      created_at: now,
      updated_at: now,
      completed_at: null,
    };
    setTasks((prev) => [...prev, newTask]);

    // Fire-and-forget API call
    fetch("/api/mission-control/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }).catch(() => {});
  }

  function handleSendToInbox(taskId: string) {
    const now = new Date().toISOString();
    const inboxTasks = tasks.filter((t) => t.column_id === "inbox");
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              column_id: "inbox" as MCTaskColumn,
              position: inboxTasks.length,
              updated_at: now,
            }
          : t
      )
    );
    // Add activity
    setActivitiesList((prev) => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        task_id: taskId,
        actor: "user",
        action: "changed_status",
        old_value: "planning",
        new_value: "inbox",
        created_at: now,
      },
    ]);

    // Fire-and-forget API call
    fetch(`/api/mission-control/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column_id: "inbox" }),
    }).catch(() => {});
  }

  function handleUpdateTask(taskId: string, updates: Partial<MCTask>) {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...updates,
              updated_at: now,
              completed_at:
                updates.column_id === "done" && !t.completed_at
                  ? now
                  : updates.column_id && updates.column_id !== "done"
                    ? null
                    : t.completed_at,
            }
          : t
      )
    );
    setSelectedTask((prev) =>
      prev && prev.id === taskId
        ? {
            ...prev,
            ...updates,
            updated_at: now,
            completed_at:
              updates.column_id === "done" && !prev.completed_at
                ? now
                : updates.column_id && updates.column_id !== "done"
                  ? null
                  : prev.completed_at,
          }
        : prev
    );

    // Fire-and-forget API call
    fetch(`/api/mission-control/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }

  function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);

    // Fire-and-forget API call
    fetch(`/api/mission-control/tasks/${taskId}`, {
      method: "DELETE",
    }).catch(() => {});
  }

  function handleAddComment(taskId: string, content: string) {
    const newComment: MCComment = {
      id: `cmt-${Date.now()}`,
      task_id: taskId,
      author: "user",
      content,
      created_at: new Date().toISOString(),
      parent_id: null,
      mentions: [],
    };
    setComments((prev) => [...prev, newComment]);

    // Fire-and-forget API call
    fetch(`/api/mission-control/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }).catch(() => {});
  }

  function handleAddReview(
    taskId: string,
    review: { reviewer: string; status: MCReview["status"]; notes: string }
  ) {
    const now = new Date().toISOString();
    const newReview: MCReview = {
      id: `rev-${Date.now()}`,
      task_id: taskId,
      reviewer: review.reviewer,
      status: review.status,
      notes: review.notes || null,
      created_at: now,
    };
    setReviewsList((prev) => [...prev, newReview]);
    setActivitiesList((prev) => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        task_id: taskId,
        actor: review.reviewer,
        action: "added_review",
        old_value: null,
        new_value: review.status,
        created_at: now,
      },
    ]);

    // Fire-and-forget API call
    fetch(`/api/mission-control/tasks/${taskId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    }).catch(() => {});
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
                col.id === "planning" ? () => setCreateOpen(true) : undefined
              }
              onSendToInbox={
                col.id === "planning" ? handleSendToInbox : undefined
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

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateTask}
      />

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        comments={comments}
        reviews={reviewsList}
        activities={activitiesList}
        onAddComment={handleAddComment}
        onAddReview={handleAddReview}
      />
    </>
  );
}
