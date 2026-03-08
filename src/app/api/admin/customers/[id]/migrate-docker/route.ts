import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for Docker install + pull

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, hostname")
    .eq("user_id", userId)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  let ssh: NodeSSH | null = null;
  const steps: string[] = [];

  try {
    ssh = new NodeSSH();
    await ssh.connect({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: vps.ssh_password,
      port: vps.ssh_port || 22,
      readyTimeout: 15000,
    });
    steps.push("SSH connected");

    // Check if already running Docker
    const dockerCheck = await ssh.execCommand(
      'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
    );
    if (dockerCheck.stdout.trim() === "running") {
      return NextResponse.json(
        { error: "Already running on Docker" },
        { status: 400 }
      );
    }

    // Read existing config from native path
    const readResult = await ssh.execCommand(
      "cat /root/.openclaw/openclaw.json 2>/dev/null"
    );
    if (!readResult.stdout?.trim()) {
      return NextResponse.json(
        { error: "No existing OpenClaw config found at /root/.openclaw/openclaw.json" },
        { status: 404 }
      );
    }
    steps.push("Config read");

    // Parse config and fix bind address for Docker
    let config: Record<string, any>;
    try {
      const cleaned = readResult.stdout
        .replace(/\/\/.*$/gm, "")
        .replace(/,\s*([\]}])/g, "$1");
      config = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse existing config" },
        { status: 500 }
      );
    }

    // Fix config for Docker (--network=host, so loopback = host loopback)
    if (!config.gateway) config.gateway = {};
    config.gateway.bind = "loopback";
    config.gateway.mode = "local";
    config.gateway.trustedProxies = config.gateway.trustedProxies || ["127.0.0.1", "::1"];

    // Use trusted-proxy auth (nginx sets X-Forwarded-User)
    config.gateway.auth = {
      mode: "trusted-proxy",
      trustedProxy: { userHeader: "x-forwarded-user" },
    };

    // Enable chat completions endpoint
    if (!config.gateway.http) config.gateway.http = {};
    if (!config.gateway.http.endpoints) config.gateway.http.endpoints = {};
    if (!config.gateway.http.endpoints.chatCompletions) config.gateway.http.endpoints.chatCompletions = {};
    config.gateway.http.endpoints.chatCompletions.enabled = true;

    // Ensure controlUi settings
    if (!config.gateway.controlUi) config.gateway.controlUi = {};
    if (!config.gateway.controlUi.allowedOrigins) {
      config.gateway.controlUi.allowedOrigins = [
        `https://${vps.hostname}`,
        `http://${vps.hostname}`,
      ];
    }
    config.gateway.controlUi.dangerouslyDisableDeviceAuth = true;
    config.gateway.controlUi.allowInsecureAuth = true;

    steps.push("Config parsed, bind/auth/endpoints fixed");

    // Stop native OpenClaw
    await ssh.execCommand("systemctl stop openclaw-gateway 2>/dev/null || true");
    await ssh.execCommand("systemctl disable openclaw-gateway 2>/dev/null || true");
    await ssh.execCommand("systemctl stop openclaw-health-check.timer 2>/dev/null || true");
    await ssh.execCommand("systemctl disable openclaw-health-check.timer 2>/dev/null || true");
    steps.push("Native OpenClaw stopped");

    // Install Docker if not present
    const dockerExists = await ssh.execCommand("command -v docker 2>/dev/null");
    if (!dockerExists.stdout.trim()) {
      await ssh.execCommand(
        "export DEBIAN_FRONTEND=noninteractive && curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh && rm -f /tmp/get-docker.sh"
      );
      await ssh.execCommand("systemctl enable docker && systemctl start docker");
      steps.push("Docker installed");
    } else {
      steps.push("Docker already installed");
    }

    // Pull OpenClaw image
    await ssh.execCommand("docker pull ghcr.io/openclaw/openclaw:latest");
    steps.push("Image pulled");

    // Create host directory (single volume — no /data dir needed)
    await ssh.execCommand(
      "mkdir -p /opt/openclaw/config && chmod 700 /opt/openclaw"
    );

    // Write fixed config to host volume path
    const configB64 = Buffer.from(JSON.stringify(config, null, 2)).toString("base64");
    await ssh.execCommand(
      [
        `echo '${configB64}' | base64 -d > /opt/openclaw/config/openclaw.json`,
        "chmod 600 /opt/openclaw/config/openclaw.json",
        "chown -R 1000:1000 /opt/openclaw",
      ].join(" && ")
    );
    steps.push("Config written to host volume");

    // Copy existing agents/data into config dir (Docker volume maps to /home/node/.openclaw)
    const agentsCheck = await ssh.execCommand(
      "test -d /root/.openclaw/agents && echo exists || echo none"
    );
    if (agentsCheck.stdout.trim() === "exists") {
      await ssh.execCommand(
        "cp -r /root/.openclaw/agents /opt/openclaw/config/ 2>/dev/null && chown -R 1000:1000 /opt/openclaw/config/agents || true"
      );
      steps.push("Agents migrated");
    }

    // Remove existing container if any
    await ssh.execCommand("docker rm -f openclaw 2>/dev/null || true");

    // Start Docker container — host networking so nginx (127.0.0.1) is trusted
    const dockerRun = [
      "docker run -d --init",
      "--name openclaw",
      "--restart=unless-stopped",
      "--network=host",
      "-v /opt/openclaw/config:/home/node/.openclaw",
      "ghcr.io/openclaw/openclaw:latest",
    ].join(" ");
    await ssh.execCommand(dockerRun);
    steps.push("Container started");

    // Gateway needs ~30s to fully start
    await ssh.execCommand("sleep 30");
    const statusCheck = await ssh.execCommand(
      'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
    );
    if (statusCheck.stdout.trim() !== "running") {
      // Get container logs for debugging
      const logs = await ssh.execCommand("docker logs openclaw --tail 20 2>&1");
      return NextResponse.json(
        {
          error: "Container failed to start",
          logs: logs.stdout?.trim() || logs.stderr?.trim(),
          steps,
        },
        { status: 500 }
      );
    }

    // Test gateway health
    const gatewayCheck = await ssh.execCommand(
      "curl -sf --max-time 10 http://127.0.0.1:18789/ > /dev/null && echo ok || echo fail"
    );
    if (gatewayCheck.stdout.trim() !== "ok") {
      steps.push("WARNING: Gateway not responding yet (may need more time)");
    } else {
      steps.push("Gateway verified");
    }

    // Clean up old systemd files
    await ssh.execCommand(
      [
        "rm -f /etc/systemd/system/openclaw-gateway.service",
        "rm -f /etc/systemd/system/openclaw-health-check.service",
        "rm -f /etc/systemd/system/openclaw-health-check.timer",
        "rm -f /usr/local/bin/openclaw-health-check.sh",
        "systemctl daemon-reload",
      ].join(" && ")
    );
    steps.push("Old systemd files removed");

    const ip = getClientIp(request);
    logAudit({
      adminId: user.id,
      action: "vps_migrated_docker",
      entityType: "vps",
      entityId: userId,
      details: { hostname: vps.hostname },
      ip,
    });

    return NextResponse.json({
      success: true,
      message: "Migrated to Docker successfully",
      steps,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Migration failed", steps },
      { status: 500 }
    );
  } finally {
    if (ssh) {
      ssh.dispose();
    }
  }
}
