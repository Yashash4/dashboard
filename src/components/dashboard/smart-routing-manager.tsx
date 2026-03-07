"use client";

import { useState } from "react";
import {
  Route,
  Plus,
  Trash2,
  ArrowRight,
  MessageSquare,
  Bot,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  Globe,
  Zap,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface RoutingRule {
  id: string;
  name: string;
  condition: {
    type: "intent" | "sentiment" | "channel" | "keyword" | "language";
    operator: string;
    value: string;
  };
  action: {
    type: "route_agent" | "route_channel" | "escalate" | "auto_reply";
    target: string;
  };
  priority: number;
  enabled: boolean;
  matchCount: number;
}

const CONDITION_TYPES = [
  { id: "intent", label: "Intent", icon: MessageSquare },
  { id: "sentiment", label: "Sentiment", icon: Smile },
  { id: "channel", label: "Channel", icon: Globe },
  { id: "keyword", label: "Keyword", icon: Zap },
  { id: "language", label: "Language", icon: Globe },
];

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "Positive", icon: Smile },
  { value: "negative", label: "Negative", icon: Frown },
  { value: "neutral", label: "Neutral", icon: Meh },
];

const ACTION_TYPES = [
  { id: "route_agent", label: "Route to Agent" },
  { id: "route_channel", label: "Route to Channel" },
  { id: "escalate", label: "Escalate (Notify)" },
  { id: "auto_reply", label: "Auto Reply" },
];

const MOCK_RULES: RoutingRule[] = [
  {
    id: "1",
    name: "Angry customers → Support Lead",
    condition: { type: "sentiment", operator: "is", value: "negative" },
    action: { type: "route_agent", target: "Support Lead Agent" },
    priority: 1,
    enabled: true,
    matchCount: 47,
  },
  {
    id: "2",
    name: "Billing questions → Billing Bot",
    condition: { type: "keyword", operator: "contains", value: "billing, invoice, payment, refund" },
    action: { type: "route_agent", target: "Billing Bot" },
    priority: 2,
    enabled: true,
    matchCount: 128,
  },
  {
    id: "3",
    name: "WhatsApp → Primary Agent",
    condition: { type: "channel", operator: "is", value: "whatsapp" },
    action: { type: "route_agent", target: "Customer Support Bot" },
    priority: 3,
    enabled: true,
    matchCount: 312,
  },
  {
    id: "4",
    name: "Spanish messages → Spanish Agent",
    condition: { type: "language", operator: "is", value: "es" },
    action: { type: "route_agent", target: "Spanish Support" },
    priority: 4,
    enabled: false,
    matchCount: 0,
  },
];

const CONDITION_ICON: Record<string, React.ElementType> = {
  intent: MessageSquare,
  sentiment: Smile,
  channel: Globe,
  keyword: Zap,
  language: Globe,
};

function SentimentIcon({ value }: { value: string }) {
  const opt = SENTIMENT_OPTIONS.find((s) => s.value === value);
  const Icon = opt?.icon || Meh;
  return <Icon className="h-3.5 w-3.5" />;
}

export function SmartRoutingManager() {
  const [rules, setRules] = useState<RoutingRule[]>(MOCK_RULES);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCondType, setNewCondType] = useState("keyword");
  const [newCondValue, setNewCondValue] = useState("");
  const [newActionType, setNewActionType] = useState("route_agent");
  const [newActionTarget, setNewActionTarget] = useState("");

  const activeRules = rules.filter((r) => r.enabled).length;
  const totalMatches = rules.reduce((s, r) => s + r.matchCount, 0);

  const handleCreate = () => {
    const rule: RoutingRule = {
      id: Math.random().toString(36).slice(2, 8),
      name: newName,
      condition: {
        type: newCondType as RoutingRule["condition"]["type"],
        operator: newCondType === "keyword" ? "contains" : "is",
        value: newCondValue,
      },
      action: {
        type: newActionType as RoutingRule["action"]["type"],
        target: newActionTarget,
      },
      priority: rules.length + 1,
      enabled: true,
      matchCount: 0,
    };
    setRules((prev) => [...prev, rule]);
    setCreateOpen(false);
    setNewName("");
    setNewCondType("keyword");
    setNewCondValue("");
    setNewActionType("route_agent");
    setNewActionTarget("");
    toast.success("Routing rule created");
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rule deleted");
  };

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{activeRules}</p>
              </div>
              <Route className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Messages Routed
                </p>
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info + Create */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Rules are evaluated top-to-bottom. First match wins.
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Routing Rule</DialogTitle>
              <DialogDescription>
                Define a condition and action. When a message matches the
                condition, the action is executed.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Rule Name
                </label>
                <Input
                  placeholder="e.g., Angry customers → Support Lead"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    When
                  </label>
                  <Select value={newCondType} onValueChange={setNewCondType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_TYPES.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Value
                  </label>
                  {newCondType === "sentiment" ? (
                    <Select
                      value={newCondValue}
                      onValueChange={setNewCondValue}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SENTIMENT_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={
                        newCondType === "keyword"
                          ? "billing, refund, payment"
                          : newCondType === "channel"
                            ? "whatsapp"
                            : newCondType === "language"
                              ? "es, fr, de"
                              : "sales, support"
                      }
                      value={newCondValue}
                      onChange={(e) => setNewCondValue(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Then
                  </label>
                  <Select
                    value={newActionType}
                    onValueChange={setNewActionType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((at) => (
                        <SelectItem key={at.id} value={at.id}>
                          {at.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Target
                  </label>
                  <Input
                    placeholder={
                      newActionType === "auto_reply"
                        ? "Reply message..."
                        : "Agent or channel name"
                    }
                    value={newActionTarget}
                    onChange={(e) => setNewActionTarget(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName || !newCondValue || !newActionTarget}
              >
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Route className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No routing rules configured</p>
            <p className="text-xs mt-1">
              Add rules to automatically route conversations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            const CondIcon = CONDITION_ICON[rule.condition.type] || Zap;
            return (
              <Card
                key={rule.id}
                className={`border-border transition-opacity ${!rule.enabled ? "opacity-50" : ""}`}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                      <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                        {index + 1}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggle(rule.id)}
                      className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                        rule.enabled
                          ? "bg-green-500"
                          : "bg-muted-foreground/30"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {rule.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          <CondIcon className="h-2.5 w-2.5 mr-1" />
                          {rule.condition.type} {rule.condition.operator}{" "}
                          {rule.condition.value}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/30"
                        >
                          <Bot className="h-2.5 w-2.5 mr-1" />
                          {rule.action.target}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {rule.matchCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {rule.matchCount} matches
                        </span>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the routing rule
                              &quot;{rule.name}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
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
            );
          })}
        </div>
      )}
    </div>
  );
}
