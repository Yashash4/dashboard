import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:vps_gateway_health`, 30, 60_000);
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
    return NextResponse.json({ error: "VPS not found" }, { status: 404 });
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { active: false, httpOk: false, version: null, pid: null },
    );
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: vps.ssh_password,
      port: vps.ssh_port || 22,
      readyTimeout: 10000,
    });

    // Detect runtime (Docker vs native)
    const dockerCheck = await ssh.execCommand(
      'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
    );
    const isDocker = !!(dockerCheck.stdout.trim() && !dockerCheck.stderr);

    let active = false;
    let version: string | null = null;
    let pid: number | null = null;

    if (isDocker) {
      active = dockerCheck.stdout.trim() === "running";
      const versionResult = await ssh.execCommand(
        "docker exec openclaw openclaw --version 2>/dev/null || echo unknown"
      );
      version = versionResult.stdout.trim() || null;
    } else {
      const activeResult = await ssh.execCommand(
        "systemctl is-active openclaw-gateway 2>/dev/null"
      );
      active = activeResult.stdout.trim() === "active";
      const versionResult = await ssh.execCommand(
        "openclaw --version 2>/dev/null || echo unknown"
      );
      version = versionResult.stdout.trim() || null;
      if (active) {
        const pidResult = await ssh.execCommand(
          "systemctl show openclaw-gateway --property=MainPID --value 2>/dev/null"
        );
        pid = parseInt(pidResult.stdout.trim()) || null;
      }
    }

    const healthResult = await ssh.execCommand(
      "curl -sf http://127.0.0.1:18789/ -o /dev/null -w '%{http_code}' --max-time 5 2>/dev/null"
    );
    const httpCode = parseInt(healthResult.stdout.trim()) || 0;
    const httpOk = httpCode >= 200 && httpCode < 400;

    return NextResponse.json({ active, httpOk, version, pid });
  } catch {
    return NextResponse.json(
      { active: false, httpOk: false, version: null, pid: null },
    );
  } finally {
    ssh.dispose();
  }
}
