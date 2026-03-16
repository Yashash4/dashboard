import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getOpenClawLogs } from "@/lib/ssh";
import {
  evaluateAlertConditionDetailed,
  type AlertCondition,
  type AlertResult,
} from "@/lib/log-alerting";
import { decryptField } from "@/lib/credential-utils";

/**
 * GET /api/cron/log-alerts
 * Cron job — called by Vercel cron scheduler.
 * Verifies CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized triggering (fail-closed: deny if unset)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();

  // Fetch all active alert rules joined with user VPS info
  const { data: rules, error } = await admin
    .from("log_alert_rules")
    .select("id, user_id, conditions, enabled")
    .eq("enabled", true)
    .limit(100);

  if (error || !rules || rules.length === 0) {
    return NextResponse.json({ evaluated: 0, triggered: 0 });
  }

  // Group rules by user_id to avoid fetching logs multiple times per user
  const rulesByUser = new Map<string, typeof rules>();
  for (const rule of rules) {
    const existing = rulesByUser.get(rule.user_id) || [];
    existing.push(rule);
    rulesByUser.set(rule.user_id, existing);
  }

  let evaluatedCount = 0;
  let triggeredCount = 0;

  for (const [userId, userRules] of rulesByUser) {
    // Get VPS credentials for the user
    const { data: vps } = await admin
      .from("vps_instances")
      .select("ip_address, ssh_user, ssh_password, ssh_port, status")
      .eq("user_id", userId)
      .single();

    if (!vps || vps.status !== "running") continue;

    // Fetch recent logs (last 200 lines)
    let logLines: string[];
    try {
      const rawLogs = await getOpenClawLogs(
        {
          ip_address: vps.ip_address,
          ssh_user: vps.ssh_user,
          ssh_password: decryptField(vps.ssh_password),
          ssh_port: vps.ssh_port,
        },
        200
      );
      logLines = typeof rawLogs === "string" ? rawLogs.split("\n").filter(Boolean) : Array.isArray(rawLogs) ? rawLogs : [];
    } catch {
      // VPS unreachable — skip
      continue;
    }

    if (logLines.length === 0) continue;

    // Evaluate each rule's conditions against the logs
    for (const rule of userRules) {
      const conditions: AlertCondition[] = Array.isArray(rule.conditions)
        ? rule.conditions
        : [];

      const triggeredResults: AlertResult[] = [];

      for (const condition of conditions) {
        evaluatedCount++;
        const result = evaluateAlertConditionDetailed(condition, logLines);
        if (result.triggered) {
          triggeredResults.push(result);
          triggeredCount++;
        }
      }

      // Record triggered alerts
      if (triggeredResults.length > 0) {
        await admin
          .from("log_alert_history")
          .insert({
            user_id: userId,
            rule_id: rule.id,
            results: triggeredResults,
            log_sample: logLines.slice(0, 10), // logLines defined above
            triggered_at: new Date().toISOString(),
          })
          .then(() => {}, () => {});
      }
    }
  }

  return NextResponse.json({
    evaluated: evaluatedCount,
    triggered: triggeredCount,
    users: rulesByUser.size,
  });
}
