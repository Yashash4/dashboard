"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  Bot,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-muted-foreground/30",
};

const PRIORITY_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-muted-foreground/30",
};

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "text-muted-foreground" },
  { id: "ready", title: "Ready", color: "text-blue-400" },
  { id: "in_progress", title: "In Progress", color: "text-primary" },
  { id: "review", title: "Review", color: "text-yellow-400" },
  { id: "done", title: "Done", color: "text-green-400" },
];

const DEMO_TASKS = [
  { id: "1", title: "Handle customer ticket #847", priority: "high", column_id: "in_progress", assigned_agent: { name: "Support Bot" }, labels: ["support", "urgent"], due_date: "2026-03-22", created_at: "2026-03-22T10:00:00Z" },
  { id: "2", title: "Research competitor pricing", priority: "high", column_id: "in_progress", assigned_agent: { name: "Research Bot" }, labels: ["research"], due_date: "2026-03-23", created_at: "2026-03-21T14:00:00Z" },
  { id: "3", title: "Process lead qualification batch", priority: "medium", column_id: "in_progress", assigned_agent: { name: "Sales Agent" }, labels: ["sales"], due_date: "2026-03-22", created_at: "2026-03-22T08:00:00Z" },
  { id: "4", title: "Update FAQ knowledge base", priority: "low", column_id: "ready", assigned_agent: null, labels: ["kb"], due_date: null, created_at: "2026-03-20T16:00:00Z" },
  { id: "5", title: "Generate weekly analytics report", priority: "medium", column_id: "in_progress", assigned_agent: { name: "Data Analyst" }, labels: ["analytics", "weekly"], due_date: "2026-03-22", created_at: "2026-03-22T06:00:00Z" },
  { id: "6", title: "Analyze churn risk factors", priority: "high", column_id: "ready", assigned_agent: null, labels: ["analytics"], due_date: "2026-03-24", created_at: "2026-03-21T10:00:00Z" },
  { id: "7", title: "Set up onboarding flow for new users", priority: "medium", column_id: "backlog", assigned_agent: null, labels: ["onboarding"], due_date: null, created_at: "2026-03-19T12:00:00Z" },
  { id: "8", title: "Create email template library", priority: "low", column_id: "backlog", assigned_agent: null, labels: ["content"], due_date: null, created_at: "2026-03-18T14:00:00Z" },
  { id: "9", title: "Summarize customer feedback Q1", priority: "medium", column_id: "review", assigned_agent: { name: "Data Analyst" }, labels: ["analytics"], due_date: "2026-03-21", created_at: "2026-03-19T08:00:00Z" },
  { id: "10", title: "Deploy blog writing agent", priority: "low", column_id: "done", assigned_agent: { name: "Research Bot" }, labels: ["agent"], due_date: "2026-03-20", created_at: "2026-03-17T10:00:00Z" },
  { id: "11", title: "Migrate support docs to KB", priority: "medium", column_id: "done", assigned_agent: { name: "Support Bot" }, labels: ["kb", "migration"], due_date: "2026-03-19", created_at: "2026-03-16T14:00:00Z" },
  { id: "12", title: "Write API integration guide", priority: "high", column_id: "done", assigned_agent: { name: "Research Bot" }, labels: ["docs"], due_date: "2026-03-18", created_at: "2026-03-15T12:00:00Z" },
];

export default function TaskBoardDemoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredTasks = DEMO_TASKS.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Task Board</h1>
      <p className="text-muted-foreground mb-6">
        Manage and assign tasks to your AI agents.
      </p>

      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <span>{filteredTasks.length}/{DEMO_TASKS.length} tasks</span>
          </div>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.column_id === col.id);
            return (
              <div key={col.id} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                      {col.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                  </div>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`border-border border-l-2 ${PRIORITY_BORDER[task.priority] || ""} cursor-pointer hover:bg-muted/30 transition-colors`}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-medium mb-2 line-clamp-2">{task.title}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.labels.map((label) => (
                            <Badge key={label} variant="outline" className="text-[9px] px-1 py-0">
                              {label}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
                            <span className="text-[10px] text-muted-foreground capitalize">{task.priority}</span>
                          </div>
                          {task.assigned_agent ? (
                            <div className="flex items-center gap-1">
                              <Bot className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{task.assigned_agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">Unassigned</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
