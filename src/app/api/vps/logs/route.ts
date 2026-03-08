import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { getOpenClawLogs } from "@/lib/ssh";

export async function GET(request: NextRequest) {
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

  const lines = parseInt(request.nextUrl.searchParams.get("lines") || "100");

  try {
    const logs = await getOpenClawLogs(
      {
        ip_address: vps.ip_address,
        ssh_user: vps.ssh_user,
        ssh_password: vps.ssh_password,
        ssh_port: vps.ssh_port,
      },
      Math.min(lines, 500) // Cap at 500 lines
    );
    return NextResponse.json({ logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
