import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo user: return mock uptime data
  if (user.email === "demo@clawhq.tech") {
    return NextResponse.json({
      uptime_percentage: 99.9,
      total_checks: 720,
      successful_checks: 719,
      last_check: new Date().toISOString(),
      recent_statuses: new Array(30).fill(true),
    });
  }

  const rl = rateLimit(`${user.id}:vps_uptime`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
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
      password: decryptField(vps.ssh_password),
      port: vps.ssh_port || 22,
      readyTimeout: 10000,
    });

    // Detect runtime (Docker vs native)
    const dockerCheck = await ssh.execCommand(
      'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
    );
    const isDocker = !!(dockerCheck.stdout.trim() && !dockerCheck.stderr);

    let currentlyUp = false;
    let failedChecks = 0;

    if (isDocker) {
      // Docker: use container status + restart count
      currentlyUp = dockerCheck.stdout.trim() === "running";

      const restartResult = await ssh.execCommand(
        'docker inspect openclaw --format "{{.RestartCount}}" 2>/dev/null'
      );
      failedChecks = parseInt(restartResult.stdout.trim()) || 0;
    } else {
      // Native: check systemd journal for restart events
      const journalResult = await ssh.execCommand(
        'journalctl -u openclaw-health-check.service --since "24 hours ago" --no-pager -o short-iso 2>/dev/null || echo ""'
      );
      const journalLines = journalResult.stdout?.trim().split("\n").filter(Boolean) || [];
      failedChecks = journalLines.filter((l) =>
        l.includes("Gateway unresponsive, restarting")
      ).length;

      const activeResult = await ssh.execCommand(
        "systemctl is-active openclaw-gateway 2>/dev/null"
      );
      currentlyUp = activeResult.stdout?.trim() === "active";
    }

    // Get system uptime to estimate total checks (1 check every 2 min)
    const uptimeResult = await ssh.execCommand(
      "cat /proc/uptime 2>/dev/null"
    );
    const uptimeSeconds = parseFloat(
      uptimeResult.stdout?.split(" ")[0] || "0"
    );
    const relevantSeconds = Math.min(uptimeSeconds, 86400);
    const estimatedChecks = Math.max(1, Math.floor(relevantSeconds / 120));

    const successfulChecks = Math.max(0, estimatedChecks - failedChecks);
    const uptimePercentage =
      estimatedChecks > 0
        ? (successfulChecks / estimatedChecks) * 100
        : currentlyUp
          ? 100
          : 0;

    // Build recent_statuses array (last 30 "checks")
    const recentCount = Math.min(30, estimatedChecks);
    const recentStatuses: boolean[] = new Array(recentCount).fill(true);

    for (let i = 0; i < Math.min(failedChecks, recentCount); i++) {
      recentStatuses[recentCount - 1 - i] = false;
    }

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
      error: "Failed to fetch uptime data.",
    }, { status: 500 });
  } finally {
    if (ssh) ssh.dispose();
  }
}
