import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", userId)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  if (vps.status !== "running") {
    return NextResponse.json({
      gateway_active: false,
      error: "VPS not running",
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
      readyTimeout: 8000,
    });

    // Detect runtime (Docker vs native)
    const dockerCheck = await ssh.execCommand(
      'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
    );
    const isDocker = !!(dockerCheck.stdout.trim() && !dockerCheck.stderr);

    let gatewayActive = false;
    let version = "unknown";
    let pid = "0";

    if (isDocker) {
      gatewayActive = dockerCheck.stdout.trim() === "running";
      const versionResult = await ssh.execCommand(
        "docker exec openclaw openclaw --version 2>/dev/null || echo unknown"
      );
      version = versionResult.stdout?.trim() || "unknown";
    } else {
      const active = await ssh.execCommand(
        "systemctl is-active openclaw-gateway 2>/dev/null"
      );
      gatewayActive = active.stdout?.trim() === "active";
      const info = await ssh.execCommand(
        "openclaw --version 2>/dev/null || echo unknown"
      );
      version = info.stdout?.trim() || "unknown";
      const pidResult = await ssh.execCommand(
        "systemctl show openclaw-gateway --property=MainPID --value 2>/dev/null || echo 0"
      );
      pid = pidResult.stdout?.trim() || "0";
    }

    // Check HTTP endpoint
    const httpCheck = await ssh.execCommand(
      "curl -sf --max-time 3 http://127.0.0.1:18789/ > /dev/null 2>&1 && echo ok || echo fail"
    );
    const httpOk = httpCheck.stdout?.trim() === "ok";

    return NextResponse.json({
      gateway_active: gatewayActive && httpOk,
      systemd_active: gatewayActive,
      http_ok: httpOk,
      version,
      pid,
    });
  } catch (err: any) {
    return NextResponse.json({
      gateway_active: false,
      error: err.message || "SSH connection failed",
    });
  } finally {
    if (ssh) ssh.dispose();
  }
}
