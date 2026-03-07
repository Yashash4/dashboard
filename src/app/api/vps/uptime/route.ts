import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  if (vps.status !== "running") {
    return NextResponse.json({
      uptime_percentage: 0,
      total_checks: 0,
      successful_checks: 0,
      last_check: null,
      recent_statuses: [],
    });
  }

  let ssh: NodeSSH | null = null;
  try {
    ssh = new NodeSSH();
    await ssh.connect({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: vps.ssh_password,
      port: vps.ssh_port || 22,
      readyTimeout: 10000,
    });

    // Read health check timer journal entries (last 24 hours)
    // Each run of the health check timer produces output only on restart (failure)
    // We use the timer's execution count + systemctl show to compute uptime

    // Method: Check systemd timer execution log
    const journalResult = await ssh.execCommand(
      'journalctl -u openclaw-health-check.service --since "24 hours ago" --no-pager -o short-iso 2>/dev/null || echo ""'
    );
    const journalLines = journalResult.stdout?.trim().split("\n").filter(Boolean) || [];

    // Count restart events (indicates gateway was down)
    const restartLines = journalLines.filter((l) =>
      l.includes("Gateway unresponsive, restarting")
    );

    // Also check current gateway status
    const activeResult = await ssh.execCommand(
      "systemctl is-active openclaw-gateway 2>/dev/null"
    );
    const currentlyUp = activeResult.stdout?.trim() === "active";

    // Check how many timer runs happened (approximately)
    const timerResult = await ssh.execCommand(
      'systemctl show openclaw-health-check.timer --property=LastTriggerUSec 2>/dev/null || echo ""'
    );

    // Get system uptime to estimate total checks (1 check every 2 min)
    const uptimeResult = await ssh.execCommand(
      "cat /proc/uptime 2>/dev/null"
    );
    const uptimeSeconds = parseFloat(
      uptimeResult.stdout?.split(" ")[0] || "0"
    );
    // Cap at 24 hours
    const relevantSeconds = Math.min(uptimeSeconds, 86400);
    const estimatedChecks = Math.max(
      1,
      Math.floor(relevantSeconds / 120)
    ); // 1 check per 2 min

    const failedChecks = restartLines.length;
    const successfulChecks = Math.max(0, estimatedChecks - failedChecks);
    const uptimePercentage =
      estimatedChecks > 0
        ? (successfulChecks / estimatedChecks) * 100
        : currentlyUp
          ? 100
          : 0;

    // Build recent_statuses array (last 30 "checks")
    // Fill with true (up), mark failures at approximate positions
    const recentCount = Math.min(30, estimatedChecks);
    const recentStatuses: boolean[] = new Array(recentCount).fill(true);

    // Place failures in recent positions (most recent first)
    for (let i = 0; i < Math.min(failedChecks, recentCount); i++) {
      recentStatuses[recentCount - 1 - i] = false;
    }

    // If currently down, mark the last check as down
    if (!currentlyUp && recentStatuses.length > 0) {
      recentStatuses[recentStatuses.length - 1] = false;
    }

    return NextResponse.json({
      uptime_percentage: Math.min(100, uptimePercentage),
      total_checks: estimatedChecks,
      successful_checks: successfulChecks,
      last_check: new Date().toISOString(),
      recent_statuses: recentStatuses,
    });
  } catch (err: any) {
    return NextResponse.json({
      uptime_percentage: 0,
      total_checks: 0,
      successful_checks: 0,
      last_check: null,
      recent_statuses: [],
      error: err.message,
    });
  } finally {
    if (ssh) ssh.dispose();
  }
}
