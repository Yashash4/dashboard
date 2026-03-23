import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Demo user: return mock services status
  if (user.email === "demo@clawhq.tech") {
    return NextResponse.json({
      services: [
        { name: "OpenClaw Gateway", port: 18789, status: "running" },
        { name: "Web Server", port: 443, status: "running" },
        { name: "ClawHQ Embeddings", port: 5555, status: "running" },
        { name: "ClawHQ Data API", port: 5556, status: "running" },
      ],
    });
  }

  const rl = rateLimit(`${user.id}:vps_services`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json({ error: "VPS not running" }, { status: 400 });
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: decryptField(vps.ssh_password),
      port: vps.ssh_port || 22,
      readyTimeout: 10000,
    });

    // Run all checks in a single SSH command for speed
    const checkScript = [
      "echo OC=$(pgrep -x openclaw-gate 2>/dev/null || pgrep -f 'openclaw.*gateway' 2>/dev/null | head -1 || echo '')",
      "echo NG=$(pgrep -x nginx 2>/dev/null | head -1 || echo '')",
      "echo EB=$(curl -sf --max-time 3 http://localhost:5555/health 2>/dev/null && echo ok || echo fail)",
      "echo DA=$(curl -sf --max-time 3 http://localhost:5556/health 2>/dev/null && echo ok || echo fail)",
    ].join("; ");

    const result = await ssh.execCommand(checkScript);
    const output = result.stdout;

    const getVal = (key: string) => {
      const match = output.match(new RegExp(`${key}=(.*)`));
      return match?.[1]?.trim() || "";
    };

    const services = [
      { name: "OpenClaw Gateway", port: 18789, status: getVal("OC") ? "running" : "stopped" },
      { name: "Web Server", port: 443, status: getVal("NG") ? "running" : "stopped" },
      { name: "ClawHQ Embeddings", port: 5555, status: getVal("EB") === "ok" ? "running" : "stopped" },
      { name: "ClawHQ Data API", port: 5556, status: getVal("DA") === "ok" ? "running" : "stopped" },
    ] as const;

    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: "Failed to check services" }, { status: 500 });
  } finally {
    ssh.dispose();
  }
}
