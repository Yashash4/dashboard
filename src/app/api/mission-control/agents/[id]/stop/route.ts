import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";
import { stopOpenClaw } from "@/lib/ssh";
import { decryptField } from "@/lib/credential-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 5, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
  const { id: agentId } = await params;

  try {
    const { data: vps } = await supabase
      .from("vps_instances")
      .select("ip_address, ssh_user, ssh_password, ssh_port")
      .eq("user_id", user.id)
      .single();

    if (!vps) {
      return NextResponse.json({ error: "VPS not found" }, { status: 404 });
    }

    await stopOpenClaw({ ...vps, ssh_password: decryptField(vps.ssh_password) });

    await supabase
      .from("mc_agent_status")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("agent_id", agentId);

    emitMCEvent(user.id, "agent_status_changed", { agent_id: agentId, status: "offline" });

    return NextResponse.json({ success: true, status: "offline" });
  } catch {
    return NextResponse.json({ error: "Failed to stop agent" }, { status: 500 });
  }
}
