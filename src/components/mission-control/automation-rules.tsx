"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  action_type: string;
  action_value: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const TRIGGER_TYPES = [
  { value: "task_status_change", label: "Task Status Change" },
  { value: "task_created", label: "Task Created" },
  { value: "task_assigned", label: "Task Assigned" },
  { value: "task_priority_change", label: "Priority Changed" },
  { value: "task_overdue", label: "Task Overdue" },
];

const ACTION_TYPES = [
  { value: "move_to_column", label: "Move to Column" },
  { value: "assign_agent", label: "Assign Agent" },
  { value: "change_priority", label: "Change Priority" },
  { value: "send_notification", label: "Send Notification" },
];

const COLUMNS = [
  { value: "planning", label: "Planning" },
  { value: "inbox", label: "Inbox" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing", label: "Testing" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

interface RuleFormState {
  name: string;
  trigger_type: string;
  trigger_value: string;
  action_type: string;
  action_value: string;
}

const emptyForm: RuleFormState = {
  name: "",
  trigger_type: "task_status_change",
  trigger_value: "",
  action_type: "move_to_column",
  action_value: "",
};

export function AutomationRulesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
    queryKey: ["mc-automation-rules"],
    queryFn: async () => {
      const res = await fetch("/api/mission-control/automation-rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      const json = await res.json();
      return json.rules || [];
    },
    enabled: open,
  });

  async function handleToggle(rule: AutomationRule) {
    try {
      const res = await fetch(`/api/mission-control/automation-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: !rule.is_enabled }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["mc-automation-rules"] });
    } catch {
      toast.error("Failed to toggle rule");
    }
  }

  async function handleDelete(ruleId: string) {
    try {
      const res = await fetch(`/api/mission-control/automation-rules/${ruleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["mc-automation-rules"] });
      toast.success("Rule deleted");
    } catch {
      toast.error("Failed to delete rule");
    }
  }

  function openCreateForm() {
    setEditingRule(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(rule: AutomationRule) {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      trigger_type: rule.trigger_type,
      trigger_value: rule.trigger_value || "",
      action_type: rule.action_type,
      action_value: rule.action_value || "",
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        trigger_type: form.trigger_type,
        trigger_value: form.trigger_value || null,
        action_type: form.action_type,
        action_value: form.action_value || null,
      };

      if (editingRule) {
        const res = await fetch(`/api/mission-control/automation-rules/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Rule updated");
      } else {
        const res = await fetch("/api/mission-control/automation-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to create rule");
        }
        toast.success("Rule created");
      }
      queryClient.invalidateQueries({ queryKey: ["mc-automation-rules"] });
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  function getTriggerLabel(type: string) {
    return TRIGGER_TYPES.find((t) => t.value === type)?.label || type;
  }

  function getActionLabel(type: string) {
    return ACTION_TYPES.find((a) => a.value === type)?.label || type;
  }

  function getValueLabel(type: string, value: string | null) {
    if (!value) return "";
    if (type === "move_to_column") return COLUMNS.find((c) => c.value === value)?.label || value;
    if (type === "change_priority") return PRIORITIES.find((p) => p.value === value)?.label || value;
    return value;
  }

  // Render the value selector based on action type
  function renderActionValueSelect() {
    if (form.action_type === "move_to_column") {
      return (
        <Select value={form.action_value} onValueChange={(v) => setForm((f) => ({ ...f, action_value: v }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (form.action_type === "change_priority") {
      return (
        <Select value={form.action_value} onValueChange={(v) => setForm((f) => ({ ...f, action_value: v }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        className="h-8 text-xs"
        placeholder="Value (optional)"
        value={form.action_value}
        onChange={(e) => setForm((f) => ({ ...f, action_value: e.target.value }))}
      />
    );
  }

  function renderTriggerValueSelect() {
    if (form.trigger_type === "task_status_change") {
      return (
        <Select value={form.trigger_value} onValueChange={(v) => setForm((f) => ({ ...f, trigger_value: v }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="When column is..." />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (form.trigger_type === "task_priority_change") {
      return (
        <Select value={form.trigger_value} onValueChange={(v) => setForm((f) => ({ ...f, trigger_value: v }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="When priority is..." />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        className="h-8 text-xs"
        placeholder="Condition (optional)"
        value={form.trigger_value}
        onChange={(e) => setForm((f) => ({ ...f, trigger_value: e.target.value }))}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automation Rules
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No automation rules yet</p>
              <p className="text-xs text-muted-foreground/60 mb-4">
                Create rules to automate task management
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <Card key={rule.id} className="border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Switch
                          checked={rule.is_enabled}
                          onCheckedChange={() => handleToggle(rule)}
                        />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${!rule.is_enabled ? "text-muted-foreground" : ""}`}>
                            {rule.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {getTriggerLabel(rule.trigger_type)}
                              {rule.trigger_value ? ` = ${getValueLabel(rule.trigger_type, rule.trigger_value)}` : ""}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">then</span>
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {getActionLabel(rule.action_type)}
                              {rule.action_value ? `: ${getValueLabel(rule.action_type, rule.action_value)}` : ""}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditForm(rule)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete rule &quot;{rule.name}&quot;?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(rule.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={openCreateForm}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Rule
          </Button>
        </div>

        {/* Create/Edit Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Rule" : "New Automation Rule"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Rule Name</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. Auto-assign critical tasks"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">When (Trigger)</Label>
                <Select
                  value={form.trigger_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, trigger_type: v, trigger_value: "" }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Condition</Label>
                {renderTriggerValueSelect()}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Then (Action)</Label>
                <Select
                  value={form.action_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, action_type: v, action_value: "" }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Action Value</Label>
                {renderActionValueSelect()}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {editingRule ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
