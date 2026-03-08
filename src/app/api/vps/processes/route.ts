import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { getProcessList } from "@/lib/ssh";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      ssh_password: vps.ssh_password,
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
