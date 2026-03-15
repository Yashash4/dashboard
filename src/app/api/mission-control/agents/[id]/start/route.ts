import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";
import { emitMCEvent } from "@/lib/mc-event-bus";
import { startOpenClaw } from "@/lib/ssh";

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
    // Get VPS credentials
    const { data: vps } = await supabase
      .from("vps_instances")
      .select("ip_address, ssh_user, ssh_password, ssh_port")
      .eq("user_id", user.id)
      .single();

    if (!vps) {
      return NextResponse.json({ error: "VPS not found" }, { status: 404 });
    }

    await startOpenClaw(vps);

    // Update agent status
    await supabase
      .from("mc_agent_status")
      .update({ status: "online", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("agent_id", agentId);

    emitMCEvent(user.id, "agent_status_changed", { agent_id: agentId, status: "online" });

    return NextResponse.json({ success: true, status: "online" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to start agent" },
      { status: 500 }
    );
  }
}
