import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { getProcessList } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo user: return mock process list
  if (user.email === "demo@clawhq.tech") {
    return NextResponse.json({
      processes: [
        { user: "root", pid: 1, cpu: 0.0, mem: 0.1, command: "/sbin/init" },
        { user: "root", pid: 1842, cpu: 2.3, mem: 4.5, command: "openclaw-gateway --config /root/.openclaw/openclaw.json" },
        { user: "root", pid: 1901, cpu: 1.1, mem: 2.8, command: "nginx: master process /usr/sbin/nginx" },
        { user: "www-data", pid: 1902, cpu: 0.4, mem: 1.2, command: "nginx: worker process" },
        { user: "root", pid: 2105, cpu: 0.8, mem: 3.1, command: "node /opt/clawhq/embeddings/server.js" },
      ],
    });
  }

  const rl = rateLimit(`${user.id}:vps_processes`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();
  const [{ data: sub }, { data: vps }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
    admin
      .from("vps_instances")
      .select("ip_address, ssh_user, ssh_password, ssh_port, status")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  if (!vps) {
    return NextResponse.json({ error: "VPS not found" }, { status: 404 });
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS is not running" },
      { status: 400 }
    );
  }

  try {
    const processes = await getProcessList({
      ip_address: vps.ip_address,
      ssh_user: vps.ssh_user,
      ssh_password: decryptField(vps.ssh_password),
      ssh_port: vps.ssh_port,
    });
    return NextResponse.json({ processes });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch process list" },
      { status: 500 }
    );
  }
}
