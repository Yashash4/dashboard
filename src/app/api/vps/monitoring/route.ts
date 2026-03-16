import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getVPSStats } from "@/lib/ssh";
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

  const rl = rateLimit(`${user.id}:vps_monitoring`, 30, 60_000);
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
      { error: "VPS is not running" },
      { status: 400 }
    );
  }

  try {
    const stats = await getVPSStats({
      ip_address: vps.ip_address,
      ssh_user: vps.ssh_user,
      ssh_password: decryptField(vps.ssh_password),
      ssh_port: vps.ssh_port,
    });
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch VPS stats — server may be starting up" },
      { status: 500 }
    );
  }
}
