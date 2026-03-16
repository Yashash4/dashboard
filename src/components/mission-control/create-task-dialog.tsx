"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";

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
  MC_COLUMNS,
  type MCTask,
  type MCTaskColumn,
} from "@/types/mission-control";

export function CreateTaskDialog({
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
  const [columnId, setColumnId] = useState<string>("planning");
  const [agentId, setAgentId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const reset = () => {
    setTitle(""); setDescription(""); setPriority("medium"); setColumnId("planning"); setAgentId(""); setDueDate("");
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
      column_id: columnId as MCTaskColumn,
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
          <div className="grid grid-cols-3 gap-4">
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
              <Label>Column</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MC_COLUMNS.map((col) => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
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
