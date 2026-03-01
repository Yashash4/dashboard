import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { startVM } from "@/lib/hostinger";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  if (vps.status === "running") {
    return NextResponse.json(
      { error: "VPS is already running" },
      { status: 400 }
    );
  }

  try {
    await startVM(vps.hostinger_vm_id);

    await admin
      .from("vps_instances")
      .update({ status: "running" })
      .eq("id", vps.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start VPS";
    await admin
      .from("vps_instances")
      .update({ status: "error" })
      .eq("id", vps.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
