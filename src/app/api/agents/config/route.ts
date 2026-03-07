import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { deployAgent } from "@/lib/ssh";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { agent_id, user_agent_id, config } = body as {
    agent_id?: string;
    user_agent_id?: string;
    config?: Record<string, string>;
  };

  if (!agent_id || !user_agent_id || !config) {
    return NextResponse.json(
      { error: "agent_id, user_agent_id, and config are required" },
      { status: 400 }
    );
  }

  if (typeof config !== "object" || Array.isArray(config)) {
    return NextResponse.json(
      { error: "config must be an object" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify user owns this agent
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, deployed, agent_id")
    .eq("id", user_agent_id)
    .eq("user_id", user.id)
    .eq("agent_id", agent_id)
    .single();

  if (!userAgent) {
    return NextResponse.json(
      { error: "Agent not found in your library" },
      { status: 404 }
    );
  }

  // Save custom config to user_agents
  const { error: updateError } = await admin
    .from("user_agents")
    .update({ custom_config: config })
    .eq("id", userAgent.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }

  // If deployed, also push config to VPS via SSH
  if (userAgent.deployed) {
    const { data: agent } = await admin
      .from("agents")
      .select("name")
      .eq("id", agent_id)
      .single();

    const { data: vps } = await admin
      .from("vps_instances")
      .select("ip_address, ssh_user, ssh_password, ssh_port, status")
      .eq("user_id", user.id)
      .single();

    if (agent && vps && vps.status === "running") {
      try {
        await deployAgent(
          {
            ip_address: vps.ip_address,
            ssh_user: vps.ssh_user,
            ssh_password: vps.ssh_password,
            ssh_port: vps.ssh_port,
          },
          agent.name,
          config
        );
      } catch {
        // Config saved to DB but VPS update failed — not fatal
        return NextResponse.json({
          success: true,
          warning: "Configuration saved but could not update running instance. Redeploy to apply changes.",
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
