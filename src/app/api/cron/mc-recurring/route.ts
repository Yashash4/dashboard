import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// GET /api/cron/mc-recurring — process recurring tasks
export async function GET() {
  const supabase = createAdminClient();

  try {
    const now = new Date().toISOString();

    // Get all due recurring tasks
    const { data: dueRecurring, error } = await supabase
      .from("mc_recurring_tasks")
      .select("*, template:template_id(*)")
      .eq("is_enabled", true)
      .lte("next_run_at", now);

    if (error) throw error;
    if (!dueRecurring || dueRecurring.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;

    for (const recurring of dueRecurring) {
      const template = recurring.template;
      if (!template) continue;

      // Create task from template
      await supabase.from("mc_tasks").insert({
        user_id: recurring.user_id,
        title: template.name,
        description: template.description,
        column_id: "planning",
        priority: template.priority || "medium",
        assigned_agent_id: template.default_agent_id || null,
        estimated_hours: template.estimated_hours,
        metadata: {
          tags: template.tags || [],
          subtasks: (template.subtasks || []).map((s: { title: string }, i: number) => ({
            id: `st-rec-${Date.now()}-${i}`,
            title: typeof s === "string" ? s : s.title,
            completed: false,
          })),
          recurring_task_id: recurring.id,
        },
        position: 0,
        created_by: "system",
        created_at: now,
        updated_at: now,
      });

      // Calculate next run
      let nextRun = new Date(recurring.next_run_at);
      switch (recurring.schedule_type) {
        case "hourly": nextRun.setHours(nextRun.getHours() + 1); break;
        case "daily": nextRun.setDate(nextRun.getDate() + 1); break;
        case "weekly": nextRun.setDate(nextRun.getDate() + 7); break;
        case "monthly": nextRun.setMonth(nextRun.getMonth() + 1); break;
        default: nextRun.setDate(nextRun.getDate() + 1); break;
      }

      await supabase
        .from("mc_recurring_tasks")
        .update({ last_run_at: now, next_run_at: nextRun.toISOString() })
        .eq("id", recurring.id);

      processed++;
    }

    return NextResponse.json({ processed });
  } catch {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
