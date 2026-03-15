/**
 * Keyboard shortcut registry for Mission Control.
 * Scopes: GLOBAL (always), KANBAN (board focused), TASK_DETAIL (modal open)
 */

export type ShortcutScope = "global" | "kanban" | "task_detail";

export interface Shortcut {
  keys: string;
  label: string;
  scope: ShortcutScope;
}

export const MC_SHORTCUTS: Shortcut[] = [
  { keys: "n", label: "Create new task", scope: "kanban" },
  { keys: "j", label: "Move focus down", scope: "kanban" },
  { keys: "k", label: "Move focus up", scope: "kanban" },
  { keys: "h", label: "Move focus left", scope: "kanban" },
  { keys: "l", label: "Move focus right", scope: "kanban" },
  { keys: "/", label: "Focus search", scope: "kanban" },
  { keys: "?", label: "Show shortcuts", scope: "global" },
  { keys: "Enter", label: "Open task detail", scope: "kanban" },
  { keys: "Escape", label: "Close modal", scope: "task_detail" },
  { keys: "mod+k", label: "Command palette", scope: "global" },
];
