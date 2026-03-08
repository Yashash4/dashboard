import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { deployAgent } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:agent_deploy`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { agent_id } = body as { agent_id?: string };

  if (!agent_id) {
    return NextResponse.json(
      { error: "Agent ID is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify user owns this agent (include custom_config if set)
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, deployed, agent_id, custom_config")
    .eq("user_id", user.id)
    .eq("agent_id", agent_id)
    .single();

  if (!userAgent) {
    return NextResponse.json(
      { error: "Agent not found in your library" },
      { status: 404 }
    );
  }

  if (userAgent.deployed) {
    return NextResponse.json(
      { error: "Agent is already deployed" },
      { status: 400 }
    );
  }

  // Get agent config
  const { data: agent } = await admin
    .from("agents")
    .select("name, config_files")
    .eq("id", agent_id)
    .single();

  if (!agent) {
    return NextResponse.json(
      { error: "Agent configuration not found" },
      { status: 404 }
    );
  }

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json(
      { error: "No VPS instance found" },
      { status: 404 }
    );
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS must be running to deploy agents" },
      { status: 400 }
    );
  }

  try {
    // Use custom config if user has customized, otherwise use default template
    const configFiles = (userAgent.custom_config || agent.config_files) as Record<string, string>;

    await deployAgent(
      {
        ip_address: vps.ip_address,
        ssh_user: vps.ssh_user,
        ssh_password: vps.ssh_password,
        ssh_port: vps.ssh_port,
      },
      agent.name,
      configFiles
    );

    // Update deploy status
    await admin
      .from("user_agents")
      .update({
        deployed: true,
        deployed_at: new Date().toISOString(),
      })
      .eq("id", userAgent.id);

    dispatchWebhooks(user.id, "agent.deployed", {
      agent_id,
      agent_name: agent.name,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to deploy agent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
