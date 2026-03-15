/**
 * Automation Rules Execution Engine (FIX-01)
 * Fires when task state changes, agent status changes, etc.
 * Activities go to VPS via vpsDataFetch, not Supabase.
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { vpsDataFetch } from "@/lib/vps-data-api";

export async function processAutomationRules(
  userId: string,
  triggerType: string,
  triggerValue: string,
  context: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  const { data: rules } = await admin
    .from("mc_automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("trigger_type", triggerType)
    .eq("is_enabled", true);

  if (!rules?.length) return;

  for (const rule of rules) {
    if (rule.trigger_value && rule.trigger_value !== triggerValue) continue;

    try {
      await executeAction(admin, userId, rule.action_type, rule.action_value, context);

      // Increment run count (Supabase — config data)
      await admin
        .from("mc_automation_rules")
        .update({
          run_count: (rule.run_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rule.id);

      // Log activity on VPS (historical data)
      if (context.taskId) {
        vpsDataFetch(userId, "/api/activities", {
          method: "POST",
          body: {
            task_id: context.taskId,
            actor: "automation",
            action: `Rule "${rule.name}" fired: ${rule.action_type}`,
            old_value: JSON.stringify(context),
            new_value: rule.action_value,
          },
        }).catch(() => {}); // non-blocking
      }
    } catch (err) {
      console.warn(`[automation] Rule "${rule.name}" failed:`, err);
    }
  }
}

async function executeAction(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  actionType: string,
  actionValue: string,
  context: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();

  switch (actionType) {
    case "assign_agent":
      if (context.taskId) {
        await admin
          .from("mc_tasks")
          .update({ assigned_agent_id: actionValue, updated_at: now })
          .eq("id", context.taskId)
          .eq("user_id", userId);
      }
      break;

    case "move_to_column":
      if (context.taskId) {
        await admin
          .from("mc_tasks")
          .update({
            column_id: actionValue,
            updated_at: now,
            ...(actionValue === "done"
              ? { completed_at: now }
              : { completed_at: null }),
          })
          .eq("id", context.taskId)
          .eq("user_id", userId);
      }
      break;

    case "create_task": {
      const { data: template } = await admin
        .from("mc_task_templates")
        .select("*")
        .eq("id", actionValue)
        .eq("user_id", userId)
        .single();

      if (template) {
        await admin.from("mc_tasks").insert({
          user_id: userId,
          title: template.name,
          description: template.description,
          priority: template.priority || "medium",
          column_id: "planning",
          assigned_agent_id: template.default_agent_id || null,
          position: 0,
          metadata: {
            tags: template.tags || [],
            subtasks: template.subtasks || [],
          },
          created_by: "automation",
          created_at: now,
          updated_at: now,
        });
      }
      break;
    }

    case "send_notification":
      // Placeholder — notification system not yet built
      break;
  }
}
