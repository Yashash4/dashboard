import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";

export const dynamic = "force-dynamic";

// GET: Check all VPS services + resource usage for a customer
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
      services: {},
      resources: null,
      error: "VPS not running",
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

    // Check all services in parallel
    const PATH_PREFIX = "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH && ";

    const [
      openclawResult,
      nginxResult,
      embeddingsResult,
      dataApiResult,
      cpuResult,
      memResult,
      diskResult,
      uptimeResult,
      sslResult,
    ] = await Promise.all([
      ssh.execCommand(`${PATH_PREFIX}systemctl is-active openclaw-gateway 2>/dev/null || echo inactive`),
      ssh.execCommand(`${PATH_PREFIX}systemctl is-active nginx 2>/dev/null || echo inactive`),
      ssh.execCommand(`${PATH_PREFIX}systemctl is-active clawhq-embeddings 2>/dev/null || echo inactive`),
      ssh.execCommand(`${PATH_PREFIX}systemctl is-active clawhq-data-api 2>/dev/null || echo inactive`),
      ssh.execCommand(`${PATH_PREFIX}grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {printf "%.1f", usage}'`),
      ssh.execCommand(`${PATH_PREFIX}free -m | awk 'NR==2{printf "%d %d %.1f", $3, $2, $3*100/$2}'`),
      ssh.execCommand(`${PATH_PREFIX}df -h / | awk 'NR==2{printf "%s %s %s", $3, $2, $5}'`),
      ssh.execCommand(`${PATH_PREFIX}cat /proc/uptime | awk '{print $1}'`),
      ssh.execCommand(`${PATH_PREFIX}openssl x509 -enddate -noout -in /etc/letsencrypt/live/*/fullchain.pem 2>/dev/null | head -1 | sed 's/notAfter=//'`),
    ]);

    const services = {
      openclaw: openclawResult.stdout?.trim() === "active",
      nginx: nginxResult.stdout?.trim() === "active",
      embeddings: embeddingsResult.stdout?.trim() === "active",
      dataApi: dataApiResult.stdout?.trim() === "active",
    };

    // Parse resource data
    const memParts = memResult.stdout?.trim().split(" ") || [];
    const diskParts = diskResult.stdout?.trim().split(" ") || [];

    const resources = {
      cpu_percent: parseFloat(cpuResult.stdout?.trim() || "0") || 0,
      ram_used_mb: parseInt(memParts[0] || "0"),
      ram_total_mb: parseInt(memParts[1] || "0"),
      ram_percent: parseFloat(memParts[2] || "0") || 0,
      disk_used: diskParts[0] || "0",
      disk_total: diskParts[1] || "0",
      disk_percent: diskParts[2] || "0%",
      uptime_seconds: parseFloat(uptimeResult.stdout?.trim() || "0") || 0,
      ssl_expiry: sslResult.stdout?.trim() || null,
    };

    return NextResponse.json({ services, resources });
  } catch (err: any) {
    return NextResponse.json({
      services: {},
      resources: null,
      error: err.message || "SSH connection failed",
    });
  } finally {
    if (ssh) ssh.dispose();
  }
}
