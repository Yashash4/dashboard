"use client";

import { useState } from "react";
import {
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  ClipboardCheck,
  Activity,
  X,
  Plus,
  Trash2,
  Send,
  ArrowRight,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge } from "./priority-badge";
import { mockAgentStatuses } from "@/lib/mock-data/mission-control";
import {
  MC_COLUMNS,
  type MCTask,
  type MCTaskColumn,
  type MCComment,
  type MCReview,
  type MCActivity,
} from "@/types/mission-control";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Review Status Badge ─────────────────────────────────
function ReviewStatusBadge({
  status,
}: {
  status: MCReview["status"];
}) {
  const config = {
    approved: "bg-green-500/15 text-green-400 border-green-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    needs_changes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  };
  const labels = {
    approved: "Approved",
    rejected: "Rejected",
    needs_changes: "Needs Changes",
  };
  return (
    <Badge className={`text-[10px] border ${config[status]}`}>
      {labels[status]}
    </Badge>
  );
}

// ─── Activity Action Label ────────────────────────────────
function activityLabel(action: string): string {
  const labels: Record<string, string> = {
    changed_status: "changed status",
    assigned_agent: "assigned agent",
    added_comment: "added a comment",
    added_review: "submitted a review",
    completed_subtask: "completed subtask",
    created_task: "created the task",
    updated_field: "updated a field",
  };
  return labels[action] || action.replace(/_/g, " ");
}

// ─── Main Component ──────────────────────────────────────
interface TaskDetailModalProps {
  task: MCTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (taskId: string, updates: Partial<MCTask>) => void;
  onDelete: (taskId: string) => void;
  comments: MCComment[];
  reviews: MCReview[];
  activities: MCActivity[];
  onAddComment: (taskId: string, content: string) => void;
  onAddReview: (
    taskId: string,
    review: { reviewer: string; status: MCReview["status"]; notes: string }
  ) => void;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  comments,
  reviews,
  activities,
  onAddComment,
  onAddReview,
}: TaskDetailModalProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [commentText, setCommentText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewStatus, setReviewStatus] = useState<MCReview["status"]>("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  if (!task) return null;

  const taskComments = comments
    .filter((c) => c.task_id === task.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const taskReviews = reviews
    .filter((r) => r.task_id === task.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const taskActivities = activities
    .filter((a) => a.task_id === task.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Group comments: parents first, then children
  const parentComments = taskComments.filter((c) => !c.parent_id);
  const childComments = (parentId: string) =>
    taskComments.filter((c) => c.parent_id === parentId);

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.column_id !== "done";

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft.trim() !== task.title) {
      onUpdate(task.id, { title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const currentTags = task.metadata?.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      onUpdate(task.id, {
        metadata: { ...task.metadata, tags: [...currentTags, newTag.trim()] },
      });
    }
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = task.metadata?.tags || [];
    onUpdate(task.id, {
      metadata: { ...task.metadata, tags: currentTags.filter((t) => t !== tag) },
    });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const subtasks = task.metadata?.subtasks || [];
    onUpdate(task.id, {
      metadata: {
        ...task.metadata,
        subtasks: subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      },
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtasks = task.metadata?.subtasks || [];
    onUpdate(task.id, {
      metadata: {
        ...task.metadata,
        subtasks: [
          ...subtasks,
          { id: `s-${Date.now()}`, title: newSubtask.trim(), completed: false },
        ],
      },
    });
    setNewSubtask("");
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    const subtasks = task.metadata?.subtasks || [];
    onUpdate(task.id, {
      metadata: {
        ...task.metadata,
        subtasks: subtasks.filter((s) => s.id !== subtaskId),
      },
    });
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText("");
  };

  const handleSubmitReview = () => {
    if (!reviewerName.trim()) return;
    onAddReview(task.id, {
      reviewer: reviewerName.trim(),
      status: reviewStatus,
      notes: reviewNotes.trim(),
    });
    setReviewerName("");
    setReviewStatus("approved");
    setReviewNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  autoFocus
                  className="text-lg font-semibold"
                />
              ) : (
                <DialogTitle
                  className="text-lg cursor-pointer hover:text-primary/80 transition-colors"
                  onClick={() => {
                    setTitleDraft(task.title);
                    setEditingTitle(true);
                  }}
                >
                  {task.title}
                </DialogTitle>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PriorityBadge priority={task.priority} />
              <Select
                value={task.column_id}
                onValueChange={(v) =>
                  onUpdate(task.id, { column_id: v as MCTaskColumn })
                }
              >
                <SelectTrigger className="h-7 text-[10px] font-mono w-auto min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MC_COLUMNS.map((col) => (
                    <SelectItem key={col.id} value={col.id} className="text-xs">
                      {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="details" className="text-xs gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments
              {taskComments.length > 0 && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 ml-0.5">
                  {taskComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Review
              {taskReviews.length > 0 && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 ml-0.5">
                  {taskReviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {/* ─── Details Tab ─────────────────────────── */}
            <TabsContent value="details" className="mt-4 space-y-4">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select
                    value={task.priority}
                    onValueChange={(v) =>
                      onUpdate(task.id, { priority: v as MCTask["priority"] })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
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
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned Agent</Label>
                  <Select
                    value={task.assigned_agent_id || "unassigned"}
                    onValueChange={(v) =>
                      onUpdate(task.id, {
                        assigned_agent_id: v === "unassigned" ? null : v,
                        assigned_agent:
                          v === "unassigned"
                            ? null
                            : {
                                id: v,
                                name:
                                  mockAgentStatuses.find((a) => a.agent_id === v)
                                    ?.agent?.name || "Agent",
                              },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {mockAgentStatuses.map((agent) => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {agent.agent?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <Input
                    type="date"
                    className={`h-8 text-xs mt-1 ${isOverdue ? "text-red-400 border-red-500/30" : ""}`}
                    value={task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      onUpdate(task.id, {
                        due_date: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created By</Label>
                  <p className="text-sm mt-1.5">{task.created_by}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatTimeAgo(task.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Updated</Label>
                  <p className="text-sm mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatTimeAgo(task.updated_at)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  className="mt-1 text-sm"
                  rows={3}
                  value={task.description || ""}
                  onChange={(e) =>
                    onUpdate(task.id, { description: e.target.value || null })
                  }
                  placeholder="Add a description..."
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <Label className="text-xs text-muted-foreground">Acceptance Criteria</Label>
                <Textarea
                  className="mt-1 text-sm"
                  rows={2}
                  value={task.acceptance_criteria || ""}
                  onChange={(e) =>
                    onUpdate(task.id, {
                      acceptance_criteria: e.target.value || null,
                    })
                  }
                  placeholder="Define success criteria..."
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {(task.metadata?.tags || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-mono gap-1 pr-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex gap-1">
                    <Input
                      placeholder="Add tag..."
                      className="h-6 text-xs w-24"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <Label className="text-xs text-muted-foreground">Subtasks</Label>
                <div className="space-y-1.5 mt-1.5">
                  {(task.metadata?.subtasks || []).map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 group">
                      <button onClick={() => handleToggleSubtask(sub.id)}>
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            sub.completed
                              ? "text-green-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          sub.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {sub.title}
                      </span>
                      <button
                        onClick={() => handleRemoveSubtask(sub.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Add subtask..."
                      className="h-7 text-xs"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={handleAddSubtask}
                      disabled={!newSubtask.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Estimated Hours</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs mt-1"
                    min={0}
                    value={task.estimated_hours ?? ""}
                    onChange={(e) =>
                      onUpdate(task.id, {
                        estimated_hours: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Actual Hours</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs mt-1"
                    min={0}
                    value={task.actual_hours ?? ""}
                    onChange={(e) =>
                      onUpdate(task.id, {
                        actual_hours: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Outcome & Resolution (only for review/done) */}
              {(task.column_id === "review" || task.column_id === "done") && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Outcome</Label>
                    <Textarea
                      className="mt-1 text-sm"
                      rows={2}
                      value={task.outcome || ""}
                      onChange={(e) =>
                        onUpdate(task.id, { outcome: e.target.value || null })
                      }
                      placeholder="What was the result?"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Resolution</Label>
                    <Textarea
                      className="mt-1 text-sm"
                      rows={2}
                      value={task.resolution || ""}
                      onChange={(e) =>
                        onUpdate(task.id, { resolution: e.target.value || null })
                      }
                      placeholder="How was it resolved?"
                    />
                  </div>
                </>
              )}

              {/* Error (if any) */}
              {task.error_message && (
                <div className="border border-red-500/30 bg-red-500/5 p-3 rounded-sm">
                  <p className="text-xs text-red-400 font-medium mb-1">Error</p>
                  <p className="text-sm text-red-400">{task.error_message}</p>
                </div>
              )}
            </TabsContent>

            {/* ─── Comments Tab ─────────────────────────── */}
            <TabsContent value="comments" className="mt-4 space-y-4">
              {parentComments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {parentComments.map((comment) => (
                    <div key={comment.id}>
                      {/* Parent comment */}
                      <div className="flex gap-3">
                        <div className="h-7 w-7 bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary font-mono">
                            {comment.author[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.author}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                      {/* Child comments (replies) */}
                      {childComments(comment.id).map((reply) => (
                        <div key={reply.id} className="flex gap-3 ml-10 mt-3">
                          <div className="h-6 w-6 bg-muted/30 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-muted-foreground font-mono">
                              {reply.author[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium">
                                {reply.author}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTimeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  className="text-sm"
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-end"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* ─── Review Tab ──────────────────────────── */}
            <TabsContent value="review" className="mt-4 space-y-4">
              {/* Review History */}
              {taskReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No reviews yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {taskReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-border p-3 rounded-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {review.reviewer}
                          </span>
                          <ReviewStatusBadge status={review.status} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimeAgo(review.created_at)}
                        </span>
                      </div>
                      {review.notes && (
                        <p className="text-sm text-muted-foreground">
                          {review.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Submit Review Form */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Submit Review
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Reviewer</Label>
                    <Input
                      className="h-8 text-xs mt-1"
                      placeholder="Your name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Decision</Label>
                    <Select
                      value={reviewStatus}
                      onValueChange={(v) =>
                        setReviewStatus(v as MCReview["status"])
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="needs_changes">
                          Needs Changes
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    className="mt-1 text-sm"
                    rows={2}
                    placeholder="Review notes (optional)"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSubmitReview}
                  disabled={!reviewerName.trim()}
                >
                  Submit Review
                </Button>
              </div>
            </TabsContent>

            {/* ─── Activity Tab ────────────────────────── */}
            <TabsContent value="activity" className="mt-4">
              {taskActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet.
                </p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-4">
                    {taskActivities.map((act) => (
                      <div key={act.id} className="flex gap-3 relative">
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground bg-muted shrink-0 mt-0.5 z-10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{act.actor}</span>{" "}
                            <span className="text-muted-foreground">
                              {activityLabel(act.action)}
                            </span>
                          </p>
                          {(act.old_value || act.new_value) && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {act.old_value && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono line-through text-muted-foreground"
                                >
                                  {act.old_value}
                                </Badge>
                              )}
                              {act.old_value && act.new_value && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              )}
                              {act.new_value && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono"
                                >
                                  {act.new_value}
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {formatTimeAgo(act.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => {
              onDelete(task.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete Task
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
