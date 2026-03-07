import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rebootVPS } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pro+ only
  const admin = createAdminClient();
  const [{ data: subscription }, { data: vps }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
    admin
      .from("vps_instances")
      .select("id, ip_address, ssh_user, ssh_password, ssh_port, status")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = (subscription?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  if (!vps) {
    return NextResponse.json({ error: "VPS not found" }, { status: 404 });
  }

  const rl = rateLimit(`${user.id}:vps_reboot`, 3, 300_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many reboot requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  await admin
    .from("vps_instances")
    .update({ status: "restarting" })
    .eq("id", vps.id);

  try {
    await rebootVPS({
      ip_address: vps.ip_address,
      ssh_user: vps.ssh_user,
      ssh_password: vps.ssh_password,
      ssh_port: vps.ssh_port,
    });

    // VPS will come back online after reboot — status will sync via polling
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reboot VPS";
    await admin
      .from("vps_instances")
      .update({ status: "error" })
      .eq("id", vps.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
