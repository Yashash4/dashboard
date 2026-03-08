export type MCTaskColumn =
  | "planning"
  | "inbox"
  | "assigned"
  | "in_progress"
  | "testing"
  | "review"
  | "done";

export const MC_COLUMNS: {
  id: MCTaskColumn;
  label: string;
  color: string;
}[] = [
  { id: "planning", label: "Planning", color: "border-t-purple-500" },
  { id: "inbox", label: "Inbox", color: "border-t-pink-500" },
  { id: "assigned", label: "Assigned", color: "border-t-blue-500" },
  { id: "in_progress", label: "In Progress", color: "border-t-yellow-500" },
  { id: "testing", label: "Testing", color: "border-t-cyan-500" },
  { id: "review", label: "Review", color: "border-t-violet-500" },
  { id: "done", label: "Done", color: "border-t-green-500" },
];

export interface MCTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  column_id: MCTaskColumn;
  priority: "low" | "medium" | "high" | "critical";
  assigned_agent_id: string | null;
  assigned_agent?: { id: string; name: string } | null;
  created_by: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  position: number;
  acceptance_criteria: string | null;
  outcome: string | null;
  error_message: string | null;
  resolution: string | null;
  metadata: {
    subtasks?: Array<{ id: string; title: string; completed: boolean }>;
    tags?: string[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface MCEvent {
  id: string;
  user_id: string;
  event_type:
    | "webhook"
    | "tool_invocation"
    | "error"
    | "task_complete"
    | "agent_state_change"
    | "session_start"
    | "session_end";
  severity: "info" | "warning" | "error" | "success";
  agent_id: string | null;
  agent?: { id: string; name: string } | null;
  task_id: string | null;
  session_id: string | null;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export type MCAgentStatusType =
  | "online"
  | "working"
  | "idle"
  | "blocked"
  | "sleeping"
  | "offline";

export interface MCAgentStatus {
  id: string;
  user_id: string;
  agent_id: string;
  agent?: { id: string; name: string; description: string | null } | null;
  status: MCAgentStatusType;
  current_task_id: string | null;
  current_task?: { id: string; title: string } | null;
  capacity_used: number;
  performance_score: number | null;
  last_activity_at: string | null;
  metadata: {
    version?: string;
    deployed_tools?: string[];
    [key: string]: unknown;
  };
  updated_at: string;
}

export interface MCSession {
  id: string;
  user_id: string;
  agent_id: string;
  agent?: { id: string; name: string } | null;
  task_id: string | null;
  task?: { id: string; title: string } | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  success: boolean;
  error_message: string | null;
  trace_data: {
    steps?: Array<{
      timestamp: string;
      action: string;
      result: string;
      duration_ms?: number;
      cost_usd?: number;
    }>;
    [key: string]: unknown;
  };
}

export interface MCMetrics {
  system_health_percent: number;
  active_agents: number;
  total_agents: number;
  tasks_in_progress: number;
  tasks_completed_today: number;
  cost_today_usd: number;
  success_rate_percent: number;
}

export interface MCComment {
  id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  mentions: string[];
}

export interface MCReview {
  id: string;
  task_id: string;
  reviewer: string;
  status: "approved" | "rejected" | "needs_changes";
  notes: string | null;
  created_at: string;
}

export interface MCActivity {
  id: string;
  task_id: string;
  actor: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}
