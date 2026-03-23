import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { getOpenClawLogs } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo user: return mock log lines
  if (user.email === "demo@clawhq.tech") {
    return NextResponse.json({
      logs: [
        "2026-03-22T08:00:01Z [INFO] OpenClaw Gateway started on port 18789",
        "2026-03-22T08:00:02Z [INFO] Loading agent: customer-support",
        "2026-03-22T08:00:02Z [INFO] Loading agent: sales-assistant",
        "2026-03-22T08:00:03Z [INFO] All agents loaded successfully",
        "2026-03-22T08:00:03Z [INFO] Trusted proxy auth enabled for 127.0.0.1",
        "2026-03-22T08:12:45Z [INFO] Incoming message from telegram channel",
        "2026-03-22T08:12:46Z [INFO] Routed to agent: customer-support",
        "2026-03-22T08:12:48Z [INFO] Response sent (model: gpt-4o, tokens: 342)",
        "2026-03-22T08:25:11Z [INFO] Health check passed — gateway responsive",
        "2026-03-22T08:30:00Z [INFO] Scheduled config reload completed",
      ],
    });
  }

  const rl = rateLimit(`${user.id}:vps_logs`, 20, 60_000);
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
      .select("ip_address, ssh_user, ssh_password, ssh_port")
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

  const parsedLines = parseInt(request.nextUrl.searchParams.get("lines") || "100", 10);
  const lines = Number.isNaN(parsedLines) ? 100 : parsedLines;

  try {
    const logs = await getOpenClawLogs(
      {
        ip_address: vps.ip_address,
        ssh_user: vps.ssh_user,
        ssh_password: decryptField(vps.ssh_password),
        ssh_port: vps.ssh_port,
      },
      Math.min(lines, 500) // Cap at 500 lines
    );
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch logs." }, { status: 500 });
  }
}
