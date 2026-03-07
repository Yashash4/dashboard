import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { stopVM } from "@/lib/hostinger";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:vps_stop`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("id, hostinger_vm_id, status")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "VPS not found" }, { status: 404 });
  }

  if (!vps.hostinger_vm_id) {
    return NextResponse.json(
      { error: "Hostinger VM ID not configured" },
      { status: 400 }
    );
  }

  if (vps.status === "stopped") {
    return NextResponse.json(
      { error: "VPS is already stopped" },
      { status: 400 }
    );
  }

  try {
    await stopVM(vps.hostinger_vm_id);

    await admin
      .from("vps_instances")
      .update({ status: "stopped" })
      .eq("id", vps.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to stop VPS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
