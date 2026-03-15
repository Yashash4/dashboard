import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { logAudit, getClientIp } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = [
  "restart_openclaw",
  "restart_nginx",
  "restart_embeddings",
  "restart_data_api",
  "start_openclaw",
  "stop_openclaw",
  "view_logs",
] as const;

type VPSAction = (typeof VALID_ACTIONS)[number];

const SERVICE_MAP: Record<string, string> = {
  restart_openclaw: "openclaw-gateway",
  restart_nginx: "nginx",
  restart_embeddings: "clawhq-embeddings",
  restart_data_api: "clawhq-data-api",
  start_openclaw: "openclaw-gateway",
  stop_openclaw: "openclaw-gateway",
};

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

  const body = await request.json();
  const action = body.action as VPSAction;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

    const PATH_PREFIX = "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH && ";

    if (action === "view_logs") {
      const result = await ssh.execCommand(
        `${PATH_PREFIX}journalctl -u openclaw-gateway --no-pager -n 200 2>/dev/null || docker logs openclaw --tail 200 2>/dev/null || echo "No logs available"`
      );
      return NextResponse.json({
        success: true,
        output: result.stdout || result.stderr || "No output",
      });
    }

    const service = SERVICE_MAP[action];
    let command = "";

    if (action.startsWith("restart_")) {
      command = `${PATH_PREFIX}systemctl restart ${service}`;
    } else if (action.startsWith("start_")) {
      command = `${PATH_PREFIX}systemctl start ${service}`;
    } else if (action.startsWith("stop_")) {
      command = `${PATH_PREFIX}systemctl stop ${service}`;
    }

    const result = await ssh.execCommand(command);

    const ip = getClientIp(request);
    logAudit({
      adminId: user.id,
      action: `vps_${action}`,
      entityType: "vps",
      entityId: userId,
      details: { service, output: result.stderr || result.stdout || "ok" },
      ip,
    });

    if (result.stderr && !result.stderr.includes("Warning")) {
      return NextResponse.json({
        success: false,
        error: result.stderr,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "SSH connection failed" },
      { status: 500 }
    );
  } finally {
    if (ssh) ssh.dispose();
  }
}
