import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:agent_health`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();

  // Verify user owns this agent and it's deployed
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, deployed, agent_id, agents(name)")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .single();

  if (!userAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (!userAgent.deployed) {
    return NextResponse.json({
      status: "not_deployed",
      message: "Agent is not deployed",
    });
  }

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json({
      status: "vps_offline",
      message: "VPS is not running",
    });
  }

  const agentName = (userAgent as any).agents?.name || "unknown";
  const agentSlug = agentName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: decryptField(vps.ssh_password),
      port: vps.ssh_port || 22,
      readyTimeout: 10000,
    });

    // Check 1: Agent directory exists (check both native and Docker paths)
    const dirCheck = await ssh.execCommand(
      `(test -d /root/.openclaw/agents/${agentSlug} || test -d /home/node/.openclaw/agents/${agentSlug} || test -d /data/agents/${agentSlug}) && echo "exists" || echo "missing"`
    );
    const dirExists = dirCheck.stdout.trim() === "exists";

    if (!dirExists) {
      return NextResponse.json({
        status: "error",
        message: "Agent files not found on VPS",
        checks: { directory: false, gateway: false, responsive: false },
      });
    }

    // Check 2: OpenClaw gateway is running
    const gwCheck = await ssh.execCommand(
      "pgrep -f 'openclaw' > /dev/null 2>&1 && echo 'running' || echo 'stopped'"
    );
    const gatewayRunning = gwCheck.stdout.trim() === "running";

    if (!gatewayRunning) {
      return NextResponse.json({
        status: "degraded",
        message: "OpenClaw gateway is not running",
        checks: { directory: true, gateway: false, responsive: false },
      });
    }

    // Check 3: Agent responds to a health ping via the gateway
    const pingCheck = await ssh.execCommand(
      `curl -sf --max-time 5 http://localhost:18789/v1/models 2>/dev/null | grep -q "${agentSlug}" && echo "ok" || echo "fail"`
    );
    const responsive = pingCheck.stdout.trim() === "ok";

    if (!responsive) {
      // Gateway running but agent not listed — might still be loading
      return NextResponse.json({
        status: "degraded",
        message: "Agent not responding to gateway. It may be loading.",
        checks: { directory: true, gateway: true, responsive: false },
      });
    }

    return NextResponse.json({
      status: "healthy",
      message: "Agent is running and responsive",
      checks: { directory: true, gateway: true, responsive: true },
    });
  } catch {
    return NextResponse.json({
      status: "error",
      message: "Could not connect to VPS",
      checks: { directory: false, gateway: false, responsive: false },
    });
  } finally {
    ssh.dispose();
  }
}
