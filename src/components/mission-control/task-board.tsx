"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
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
  Calendar as CalendarIcon,
  ListChecks,
  GripVertical,
  ArrowRight,
  Clock,
  X,
  Trash2,
  Inbox,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  Rows3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CommandPalette } from "./command-palette";
import { useUndoStack } from "@/hooks/use-undo-stack";
import { formatDate, formatTimeAgo, isOverdue } from "@/lib/format-time";
import {
  MC_COLUMNS,
  type MCTask,
  type MCTaskColumn,
  type MCComment,
  type MCReview,
  type MCActivity,
  type MCAgentStatus,
} from "@/types/mission-control";

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
function TaskCardContent({
  task,
  onClick,
  dragListeners,
  onSendToInbox,
  isFocused,
}: {
  task: MCTask;
  onClick?: () => void;
  dragListeners?: Record<string, unknown>;
  onSendToInbox?: () => void;
  isFocused?: boolean;
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

// ─── Droppable Column ──────────────────────────────────────
function DroppableColumn({
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

// ─── Search & Filter Bar ───────────────────────────────────
function FilterBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  agentFilter,
  onAgentChange,
  agents,
  totalCount,
  filteredCount,
  viewMode,
  onViewModeChange,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  agentFilter: string;
  onAgentChange: (v: string) => void;
  agents: { id: string; name: string }[];
  totalCount: number;
  filteredCount: number;
  viewMode: "kanban" | "list" | "swimlane" | "calendar";
  onViewModeChange: (v: "kanban" | "list" | "swimlane" | "calendar") => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 text-xs"
          id="mc-task-search"
        />
      </div>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={agentFilter} onValueChange={onAgentChange}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Agents</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(searchQuery || priorityFilter !== "all" || agentFilter !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            onSearchChange("");
            onPriorityChange("all");
            onAgentChange("all");
          }}
        >
          Clear
        </Button>
      )}

      <span className="text-xs text-muted-foreground ml-auto">
        {filteredCount !== totalCount
          ? `${filteredCount} of ${totalCount}`
          : `${totalCount} tasks`}
      </span>

      {/* View toggle */}
      <div className="flex border border-border rounded-sm">
        <button
          className={`p-1.5 ${viewMode === "kanban" ? "bg-accent" : ""}`}
          onClick={() => onViewModeChange("kanban")}
          title="Kanban view"
          aria-pressed={viewMode === "kanban"}
          role="button"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          className={`p-1.5 ${viewMode === "list" ? "bg-accent" : ""}`}
          onClick={() => onViewModeChange("list")}
          title="List view"
          aria-pressed={viewMode === "list"}
          role="button"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          className={`p-1.5 ${viewMode === "swimlane" ? "bg-accent" : ""}`}
          onClick={() => onViewModeChange("swimlane")}
          title="Swimlane view"
          aria-pressed={viewMode === "swimlane"}
          role="button"
        >
          <Rows3 className="h-3.5 w-3.5" />
        </button>
        <button
          className={`p-1.5 ${viewMode === "calendar" ? "bg-accent" : ""}`}
          onClick={() => onViewModeChange("calendar")}
          title="Calendar view"
          aria-pressed={viewMode === "calendar"}
          role="button"
        >
          <CalendarDays className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────
function TaskListView({
  tasks,
  onTaskClick,
}: {
  tasks: MCTask[];
  onTaskClick: (task: MCTask) => void;
}) {
  // Group by column
  const grouped = useMemo(() => {
    const g: Record<string, MCTask[]> = {};
    for (const col of MC_COLUMNS) {
      const colTasks = tasks.filter((t) => t.column_id === col.id);
      if (colTasks.length > 0) g[col.id] = colTasks;
    }
    return g;
  }, [tasks]);

  return (
    <div className="space-y-6">
      {MC_COLUMNS.filter((col) => grouped[col.id]).map((col) => (
        <div key={col.id}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5">
              {grouped[col.id].length}
            </Badge>
          </div>
          <div className="space-y-1">
            {grouped[col.id].map((task) => (
              <Card
                key={task.id}
                className={`border-border cursor-pointer hover:border-primary/30 transition-colors border-l-[3px] ${PRIORITY_BORDER[task.priority] || ""}`}
                onClick={() => onTaskClick(task)}
              >
                <CardContent className="p-2 flex items-center gap-3">
                  <span className="text-sm font-medium truncate flex-1">
                    {task.title}
                  </span>
                  <PriorityBadge priority={task.priority} />
                  {task.assigned_agent && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      {task.assigned_agent.name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`text-[10px] font-mono ${isOverdue(task.due_date) ? "text-red-400" : "text-muted-foreground"}`}>
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Swimlane View ─────────────────────────────────────────
function SwimlaneView({
  tasks,
  groupBy,
  onGroupByChange,
  agents,
  onTaskClick,
}: {
  tasks: MCTask[];
  groupBy: "agent" | "priority" | "tag";
  onGroupByChange: (v: "agent" | "priority" | "tag") => void;
  agents: { id: string; name: string }[];
  onTaskClick: (task: MCTask) => void;
}) {
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());

  const toggleLane = (key: string) => {
    setCollapsedLanes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group tasks into swimlanes
  const lanes = useMemo(() => {
    const map: Record<string, { label: string; tasks: MCTask[] }> = {};

    if (groupBy === "agent") {
      for (const task of tasks) {
        const key = task.assigned_agent_id || "unassigned";
        const label = task.assigned_agent?.name || "Unassigned";
        if (!map[key]) map[key] = { label, tasks: [] };
        map[key].tasks.push(task);
      }
    } else if (groupBy === "priority") {
      for (const p of ["critical", "high", "medium", "low"]) {
        map[p] = { label: p.charAt(0).toUpperCase() + p.slice(1), tasks: [] };
      }
      for (const task of tasks) {
        const key = task.priority || "medium";
        if (!map[key]) map[key] = { label: key, tasks: [] };
        map[key].tasks.push(task);
      }
    } else {
      // Group by tag
      const tagMap: Record<string, MCTask[]> = {};
      for (const task of tasks) {
        const tags = task.metadata?.tags || [];
        if (tags.length === 0) {
          if (!tagMap["untagged"]) tagMap["untagged"] = [];
          tagMap["untagged"].push(task);
        } else {
          for (const tag of tags) {
            if (!tagMap[tag]) tagMap[tag] = [];
            tagMap[tag].push(task);
          }
        }
      }
      for (const [tag, t] of Object.entries(tagMap)) {
        map[tag] = { label: tag === "untagged" ? "Untagged" : tag, tasks: t };
      }
    }

    return Object.entries(map).filter(([, v]) => v.tasks.length > 0);
  }, [tasks, groupBy]);

  // Group tasks by column within each lane
  const getColumnTasks = (laneTasks: MCTask[], colId: string) =>
    laneTasks.filter((t) => t.column_id === colId).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-2">
      {/* Group-by selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Group by:</span>
        <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as "agent" | "priority" | "tag")}>
          <SelectTrigger className="h-7 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="tag">Tag</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Swimlane rows */}
      {lanes.map(([key, lane]) => {
        const isCollapsed = collapsedLanes.has(key);
        return (
          <div key={key} className="border border-border rounded-sm">
            {/* Lane header */}
            <button
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors"
              onClick={() => toggleLane(key)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm font-semibold">{lane.label}</span>
              <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5">
                {lane.tasks.length}
              </Badge>
            </button>

            {/* Lane content — columns grid */}
            {!isCollapsed && (
              <div className="grid gap-2 px-3 pb-3 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${MC_COLUMNS.length}, minmax(150px, 1fr))` }}>
                {/* Column headers */}
                {MC_COLUMNS.map((col) => (
                  <div key={col.id} className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono pb-1 border-b border-border/30">
                    {col.label} ({getColumnTasks(lane.tasks, col.id).length})
                  </div>
                ))}
                {/* Column cells */}
                {MC_COLUMNS.map((col) => (
                  <div key={col.id} className="space-y-1 min-h-[40px]">
                    {getColumnTasks(lane.tasks, col.id).map((task) => (
                      <Card
                        key={task.id}
                        className={`border-border cursor-pointer hover:border-primary/30 transition-colors border-l-[3px] ${PRIORITY_BORDER[task.priority] || ""}`}
                        onClick={() => onTaskClick(task)}
                      >
                        <CardContent className="p-2">
                          <p className="text-xs font-medium line-clamp-1">{task.title}</p>
                          {task.due_date && (
                            <span className={`text-[9px] font-mono ${isOverdue(task.due_date) ? "text-red-400" : "text-muted-foreground"}`}>
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────
function CalendarView({
  tasks,
  onTaskClick,
  onUpdateDueDate,
}: {
  tasks: MCTask[];
  onTaskClick: (task: MCTask) => void;
  onUpdateDueDate: (taskId: string, dueDate: string) => void;
}) {
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");
  const [viewDate, setViewDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Tasks indexed by due date
  const tasksByDate = useMemo(() => {
    const map: Record<string, MCTask[]> = {};
    for (const task of tasks) {
      if (task.due_date) {
        const dateKey = task.due_date.split("T")[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    }
    return map;
  }, [tasks]);

  // Generate days for the month view
  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0=Sun

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, dateStr: d.toISOString().split("T")[0], isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: d.toISOString().split("T")[0], isCurrentMonth: true });
    }
    // Next month padding (fill to 42 = 6 rows)
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1);
      days.push({ date: d, dateStr: d.toISOString().split("T")[0], isCurrentMonth: false });
    }

    return days;
  }, [viewDate]);

  // Week days for the week view
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return { date: d, dateStr: d.toISOString().split("T")[0] };
    });
  }, [viewDate]);

  const navigateMonth = (delta: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const navigateWeek = (delta: number) => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  };

  const PRIORITY_DOT: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-zinc-500",
  };

  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => calendarMode === "month" ? navigateMonth(-1) : navigateWeek(-1)}>
            Prev
          </Button>
          <span className="text-sm font-semibold min-w-[160px] text-center">{monthName}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => calendarMode === "month" ? navigateMonth(1) : navigateWeek(1)}>
            Next
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex border border-border rounded-sm">
          {(["month", "week", "day"] as const).map((m) => (
            <button
              key={m}
              className={`px-2 py-1 text-[10px] capitalize ${calendarMode === m ? "bg-accent" : ""}`}
              onClick={() => setCalendarMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Month view */}
      {calendarMode === "month" && (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground font-mono text-center py-1">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {monthDays.map(({ dateStr, date, isCurrentMonth }) => {
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isExpanded = expandedDay === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`min-h-[80px] p-1 border border-border/30 rounded-sm cursor-pointer transition-colors hover:bg-accent/30 ${
                    !isCurrentMonth ? "opacity-30" : ""
                  } ${isToday ? "border-primary/50 bg-primary/5" : ""} ${
                    isExpanded ? "col-span-7 min-h-0" : ""
                  }`}
                  onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && !isExpanded && (
                      <span className="text-[9px] text-muted-foreground font-mono">{dayTasks.length}</span>
                    )}
                  </div>
                  {/* Priority dots (compact mode) */}
                  {!isExpanded && dayTasks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 5).map((t) => (
                        <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[t.priority] || PRIORITY_DOT.medium}`} />
                      ))}
                      {dayTasks.length > 5 && <span className="text-[8px] text-muted-foreground">+{dayTasks.length - 5}</span>}
                    </div>
                  )}
                  {/* Expanded day: full task list */}
                  {isExpanded && dayTasks.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {dayTasks.map((task) => (
                        <Card
                          key={task.id}
                          className={`border-border cursor-pointer hover:border-primary/30 border-l-[3px] ${PRIORITY_BORDER[task.priority] || ""}`}
                          onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                        >
                          <CardContent className="p-1.5">
                            <p className="text-xs font-medium line-clamp-1">{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <PriorityBadge priority={task.priority} />
                              {task.assigned_agent && (
                                <span className="text-[9px] text-muted-foreground">{task.assigned_agent.name}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {isExpanded && dayTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/50 mt-1">No tasks due</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {calendarMode === "week" && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(({ dateStr, date }) => {
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} className={`border border-border/50 rounded-sm p-2 min-h-[200px] ${isToday ? "border-primary/50 bg-primary/5" : ""}`}>
                <div className="text-center mb-2">
                  <p className="text-[10px] text-muted-foreground">{date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                  <p className={`text-sm font-mono ${isToday ? "text-primary font-bold" : ""}`}>{date.getDate()}</p>
                </div>
                <div className="space-y-1">
                  {dayTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`border-border cursor-pointer hover:border-primary/30 border-l-[2px] ${PRIORITY_BORDER[task.priority] || ""}`}
                      onClick={() => onTaskClick(task)}
                    >
                      <CardContent className="p-1.5">
                        <p className="text-[10px] font-medium line-clamp-2">{task.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day view */}
      {calendarMode === "day" && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {viewDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {(() => {
            const dateStr = viewDate.toISOString().split("T")[0];
            const dayTasks = (tasksByDate[dateStr] || []).sort((a, b) => {
              const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return (pOrder[a.priority as keyof typeof pOrder] ?? 2) - (pOrder[b.priority as keyof typeof pOrder] ?? 2);
            });
            if (dayTasks.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-8">No tasks due on this day</p>;
            }
            return (
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={`border-border cursor-pointer hover:border-primary/30 border-l-[3px] ${PRIORITY_BORDER[task.priority] || ""}`}
                    onClick={() => onTaskClick(task)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>}
                      </div>
                      <PriorityBadge priority={task.priority} />
                      {task.assigned_agent && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {task.assigned_agent.name}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] font-mono capitalize">{task.column_id.replace("_", " ")}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tasks without due dates */}
      {tasks.filter((t) => !t.due_date).length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">
            {tasks.filter((t) => !t.due_date).length} tasks without due dates (not shown on calendar)
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Create Task Dialog ─────────────────────────────────────
function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  agents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<MCTask>) => void;
  agents: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [agentId, setAgentId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const reset = () => {
    setTitle(""); setDescription(""); setPriority("medium"); setAgentId(""); setDueDate("");
    setEstimatedHours(""); setTagInput(""); setTags([]); setSubtaskInput(""); setSubtasks([]);
  };

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags((p) => [...p, tag]);
    setTagInput("");
  };

  const addSubtask = () => {
    const text = subtaskInput.trim();
    if (text) { setSubtasks((p) => [...p, text]); setSubtaskInput(""); }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const agent = agents.find((a) => a.id === agentId);
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority: priority as MCTask["priority"],
      column_id: "planning",
      assigned_agent_id: agentId && agentId !== "none" ? agentId : null,
      assigned_agent: agent ? { id: agent.id, name: agent.name } : null,
      due_date: dueDate || null,
      estimated_hours: estimatedHours ? Number(estimatedHours) : null,
      metadata: {
        tags: tags.length > 0 ? tags : undefined,
        subtasks: subtasks.length > 0
          ? subtasks.map((s, i) => ({ id: `st-${crypto.randomUUID()}-${i}`, title: s, completed: false }))
          : undefined,
      },
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ct-title">Title *</Label>
            <Input id="ct-title" placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-desc">Description</Label>
            <Textarea id="ct-desc" placeholder="What needs to be done..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-due">Due Date</Label>
              <Input id="ct-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-hours">Estimated Hours</Label>
              <Input id="ct-hours" type="number" min="0" step="0.5" placeholder="e.g. 4" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-mono gap-1 pr-1">{tag}
                  <button type="button" onClick={() => setTags((p) => p.filter((t) => t !== tag))} className="hover:text-red-400"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <Input placeholder="Type tag + Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }} />
          </div>
          <div className="space-y-2">
            <Label>Subtasks</Label>
            {subtasks.length > 0 && (
              <div className="space-y-1">{subtasks.map((st, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-2 py-1 bg-muted/30 rounded-sm">
                  <span className="truncate">{st}</span>
                  <button type="button" onClick={() => setSubtasks((p) => p.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-400 shrink-0 ml-2"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}</div>
            )}
            <div className="flex gap-2">
              <Input placeholder="Add subtask..." value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} />
              <Button type="button" variant="outline" size="sm" onClick={addSubtask} disabled={!subtaskInput.trim()}>Add</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Board ────────────────────────────────────────────
export function TaskBoard() {
  const queryClient = useQueryClient();
  const undoStack = useUndoStack();

  // View state
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "swimlane" | "calendar">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [swimlaneGroupBy, setSwimlaneGroupBy] = useState<"agent" | "priority" | "tag">("agent");

  // Fetch real agents
  const { data: agentStatuses = [] } = useQuery<MCAgentStatus[]>({
    queryKey: ["mc-agents"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/agents/status");
      if (!res.ok) return [];
      const json = await res.json();
      return json.agents || [];
    },
    refetchInterval: 10000,
  });

  const realAgents = useMemo(
    () => agentStatuses.map((a) => ({ id: a.agent_id, name: a.agent?.name || a.agent_id })),
    [agentStatuses]
  );

  // Fetch tasks
  const { data: apiTasks, isLoading, isError, refetch } = useQuery<MCTask[]>({
    queryKey: ["mc-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const json = await res.json();
      return json.tasks || [];
    },
    refetchInterval: 10000,
  });

  const [tasks, setTasks] = useState<MCTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MCTask | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dropTargetCol, setDropTargetCol] = useState<string | null>(null);

  const isSyncingRef = useRef(false);
  const tasksRef = useRef(tasks); // FIX-57: avoid stale closure in drag handlers
  tasksRef.current = tasks;

  useEffect(() => {
    if (apiTasks && !isSyncingRef.current) setTasks(apiTasks);
  }, [apiTasks]);

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks, selectedTask]);

  // Per-task data
  const { data: taskComments = [] } = useQuery<MCComment[]>({
    queryKey: ["mc-comments", selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask) return [];
      const res = await fetch(`/api/mission-control/tasks/${selectedTask.id}/comments`);
      if (!res.ok) return [];
      return (await res.json()).comments || [];
    },
    enabled: !!selectedTask,
  });

  const { data: taskReviews = [] } = useQuery<MCReview[]>({
    queryKey: ["mc-reviews", selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask) return [];
      const res = await fetch(`/api/mission-control/tasks/${selectedTask.id}/reviews`);
      if (!res.ok) return [];
      return (await res.json()).reviews || [];
    },
    enabled: !!selectedTask,
  });

  const { data: taskActivities = [] } = useQuery<MCActivity[]>({
    queryKey: ["mc-activities", selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask) return [];
      const res = await fetch(`/api/mission-control/tasks/${selectedTask.id}/activities`);
      if (!res.ok) return [];
      return (await res.json()).activities || [];
    },
    enabled: !!selectedTask,
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) return false;
      }
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (agentFilter === "unassigned" && t.assigned_agent_id) return false;
      if (agentFilter !== "all" && agentFilter !== "unassigned" && t.assigned_agent_id !== agentFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, agentFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, MCTask[]> = {};
    for (const col of MC_COLUMNS) {
      grouped[col.id] = filteredTasks
        .filter((t) => t.column_id === col.id)
        .sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [filteredTasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) || null : null;

  function findColumn(taskId: string): MCTaskColumn | null {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.column_id : null;
  }

  const persistDragMove = useCallback(
    async (taskId: string, columnId: string, position: number) => {
      try {
        const res = await fetch(`/api/mission-control/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ column_id: columnId, position, ...(columnId !== "done" ? { completed_at: null } : {}) }),
        });
        if (!res.ok) throw new Error();
      } catch {
        toast.error("Failed to save task move.");
        queryClient.invalidateQueries({ queryKey: ["mc-tasks"] });
      } finally {
        isSyncingRef.current = false; // FIX-17: clear in callback, not timer
      }
    },
    [queryClient]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    isSyncingRef.current = true;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) { setDropTargetCol(null); return; }

    const activeCol = findColumn(active.id as string);
    let overCol = findColumn(over.id as string);

    if (!overCol) {
      const el = document.querySelector(`[data-column-id="${over.id}"]`);
      if (el) overCol = over.id as MCTaskColumn;
    }

    setDropTargetCol(overCol || null);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, column_id: overCol, completed_at: overCol !== "done" ? null : t.completed_at }
          : t
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setDropTargetCol(null);
    // isSyncingRef cleared in persistDragMove callback (FIX-17)

    if (!over || active.id === over.id) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);

    if (activeCol && overCol && activeCol === overCol) {
      setTasks((prev) => {
        const colTasks = prev.filter((t) => t.column_id === activeCol).sort((a, b) => a.position - b.position);
        const oldIndex = colTasks.findIndex((t) => t.id === active.id);
        const newIndex = colTasks.findIndex((t) => t.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(colTasks, oldIndex, newIndex);
        const otherTasks = prev.filter((t) => t.column_id !== activeCol);
        return [...otherTasks, ...reordered.map((t, i) => ({ ...t, position: i }))];
      });
    }

    // FIX-57: use ref to get fresh tasks state after setTasks above
    const currentTasks = tasksRef.current;
    const task = currentTasks.find((t) => t.id === active.id);
    if (task) {
      const col = task.column_id;
      if (col) {
        const colTasks = currentTasks.filter((t) => t.column_id === col).sort((a, b) => a.position - b.position);
        const idx = colTasks.findIndex((t) => t.id === active.id);
        persistDragMove(active.id as string, col, idx >= 0 ? idx : 0);
      }
    }
  }

  async function handleCreateTask(partial: Partial<MCTask>) {
    const now = new Date().toISOString();
    const planningTasks = tasks.filter((t) => t.column_id === "planning");
    const tempId = crypto.randomUUID();
    const newTask: MCTask = {
      id: tempId, user_id: "", title: partial.title || "Untitled", description: partial.description || null,
      column_id: "planning", priority: partial.priority || "medium", assigned_agent_id: partial.assigned_agent_id || null,
      assigned_agent: partial.assigned_agent || null, created_by: "user", due_date: partial.due_date || null,
      estimated_hours: partial.estimated_hours || null, actual_hours: null, position: planningTasks.length,
      acceptance_criteria: null, outcome: null, error_message: null, resolution: null,
      metadata: partial.metadata || {}, created_at: now, updated_at: now, completed_at: null,
    };
    const prevTasks = [...tasks];
    setTasks((p) => [...p, newTask]);
    try {
      const res = await fetch("/api/mission-control/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(partial) });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTasks((p) => p.map((t) => (t.id === tempId ? { ...newTask, ...json.task } : t)));
      toast.success("Task created");
    } catch { setTasks(prevTasks); toast.error("Failed to create task."); }
  }

  async function handleSendToInbox(taskId: string) {
    const now = new Date().toISOString();
    const prevTasks = [...tasks];
    const inboxTasks = tasks.filter((t) => t.column_id === "inbox");
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, column_id: "inbox" as MCTaskColumn, position: inboxTasks.length, updated_at: now } : t));
    try {
      const res = await fetch(`/api/mission-control/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ column_id: "inbox" }) });
      if (!res.ok) throw new Error();
      undoStack.push({
        type: "move", description: "Task moved to Inbox",
        undo: () => { setTasks(prevTasks); fetch(`/api/mission-control/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ column_id: "planning" }) }); },
      });
    } catch { setTasks(prevTasks); toast.error("Failed to move task."); }
  }

  async function handleUpdateTask(taskId: string, updates: Partial<MCTask>) {
    const now = new Date().toISOString();
    const prevTasks = [...tasks];
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, ...updates, updated_at: now, completed_at: updates.column_id === "done" && !t.completed_at ? now : updates.column_id && updates.column_id !== "done" ? null : t.completed_at } : t));
    setSelectedTask((p) => p && p.id === taskId ? { ...p, ...updates, updated_at: now, completed_at: updates.column_id === "done" && !p.completed_at ? now : updates.column_id && updates.column_id !== "done" ? null : p.completed_at } : p);
    try {
      const res = await fetch(`/api/mission-control/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error();
    } catch { setTasks(prevTasks); toast.error("Failed to save."); }
  }

  async function handleDeleteTask(taskId: string) {
    const prevTasks = [...tasks];
    const deletedTask = tasks.find((t) => t.id === taskId);
    setTasks((p) => p.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    try {
      const res = await fetch(`/api/mission-control/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (deletedTask) {
        undoStack.push({
          type: "delete", description: `Deleted "${deletedTask.title}"`,
          undo: () => {
            setTasks((p) => [...p, deletedTask]);
            fetch("/api/mission-control/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(deletedTask) });
          },
        });
      }
    } catch { setTasks(prevTasks); toast.error("Failed to delete task."); }
  }

  async function handleAddComment(taskId: string, content: string) {
    try {
      const res = await fetch(`/api/mission-control/tasks/${taskId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["mc-comments", taskId] });
    } catch { toast.error("Failed to add comment."); }
  }

  async function handleAddReview(taskId: string, review: { reviewer: string; status: MCReview["status"]; notes: string }) {
    try {
      const res = await fetch(`/api/mission-control/tasks/${taskId}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(review) });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["mc-reviews", taskId] });
    } catch { toast.error("Failed to submit review."); }
  }

  // Keyboard shortcuts
  useHotkeys("n", () => setCreateOpen(true), { enabled: !selectedTask && !createOpen });
  useHotkeys("mod+k", (e) => { e.preventDefault(); setCmdPaletteOpen(true); });
  useHotkeys("/", (e) => { e.preventDefault(); document.getElementById("mc-task-search")?.focus(); }, { enabled: !selectedTask && !createOpen });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {MC_COLUMNS.slice(0, 4).map((col) => (
          <div key={col.id} className="flex-shrink-0 w-[300px]">
            <Skeleton className="h-6 w-24 mb-3" />
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}</div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-10 w-10 text-red-400/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load tasks</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <>
      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground mb-1">Your task board is empty</p>
          <p className="text-sm text-muted-foreground/60 mb-4">Create your first task to assign work to your AI agents</p>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Task</Button>
        </div>
      ) : (
        <>
          <FilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter} onPriorityChange={setPriorityFilter}
            agentFilter={agentFilter} onAgentChange={setAgentFilter}
            agents={realAgents} totalCount={tasks.length} filteredCount={filteredTasks.length}
            viewMode={viewMode} onViewModeChange={setViewMode}
          />

          {viewMode === "list" ? (
            <TaskListView tasks={filteredTasks} onTaskClick={setSelectedTask} />
          ) : viewMode === "swimlane" ? (
            <SwimlaneView
              tasks={filteredTasks}
              groupBy={swimlaneGroupBy}
              onGroupByChange={setSwimlaneGroupBy}
              agents={realAgents}
              onTaskClick={setSelectedTask}
            />
          ) : viewMode === "calendar" ? (
            <CalendarView
              tasks={filteredTasks}
              onTaskClick={setSelectedTask}
              onUpdateDueDate={(taskId, dueDate) => handleUpdateTask(taskId, { due_date: dueDate })}
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners}
              onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {MC_COLUMNS.map((col) => (
                  <DroppableColumn key={col.id} columnId={col.id} label={col.label}
                    tasks={tasksByColumn[col.id] || []} onTaskClick={setSelectedTask}
                    onAddClick={col.id === "planning" ? () => setCreateOpen(true) : undefined}
                    onSendToInbox={col.id === "planning" ? handleSendToInbox : undefined}
                    isDropTarget={dropTargetCol === col.id}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeTask && (
                  <div className="w-[280px] ring-2 ring-primary shadow-lg">
                    <TaskCardContent task={activeTask} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreateTask} agents={realAgents} />
      <CommandPalette open={cmdPaletteOpen} onOpenChange={setCmdPaletteOpen} onCreateTask={() => setCreateOpen(true)} />

      <TaskDetailModal
        task={selectedTask} open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        onUpdate={handleUpdateTask} onDelete={handleDeleteTask}
        comments={taskComments} reviews={taskReviews} activities={taskActivities}
        onAddComment={handleAddComment} onAddReview={handleAddReview}
      />
    </>
  );
}
