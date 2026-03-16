import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { deployAgent } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";
import { decryptField } from "@/lib/credential-utils";

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { agent_id, config_files: builderConfigFiles, from_builder } = body as {
    agent_id?: string;
    config_files?: Record<string, string>;
    from_builder?: boolean;
  };

  if (!agent_id) {
    return NextResponse.json(
      { error: "Agent ID is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Agent Builder flow: create agent record + user_agents entry if needed
  let userAgent: any;
  let agentName: string;

  if (from_builder && builderConfigFiles) {
    // Builder-created agent — agent_id is the agent name (slug)
    agentName = agent_id;

    // Check if user already has this agent
    const { data: existing } = await admin
      .from("user_agents")
      .select("id, deployed, agent_id, custom_config, primary_model, fallback_model")
      .eq("user_id", user.id)
      .eq("custom_config->>builder_name", agentName)
      .single();

    if (existing) {
      if (existing.deployed) {
        // Redeploy — update config and continue
        await admin
          .from("user_agents")
          .update({ custom_config: { ...builderConfigFiles, builder_name: agentName } })
          .eq("id", existing.id);
      }
      userAgent = { ...existing, custom_config: builderConfigFiles };
    } else {
      // Create a new agent record for builder-created agents
      const { data: newAgent } = await admin
        .from("agents")
        .upsert({
          name: agentName,
          description: `Custom agent: ${agentName}`,
          category: "custom",
          config_files: builderConfigFiles,
          is_free: true,
          is_available: false, // Not in store
        }, { onConflict: "name" })
        .select("id")
        .single();

      if (!newAgent) {
        return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
      }

      // Create user_agents entry
      const { data: newUserAgent } = await admin
        .from("user_agents")
        .insert({
          user_id: user.id,
          agent_id: newAgent.id,
          custom_config: { ...builderConfigFiles, builder_name: agentName },
        })
        .select("id, deployed, agent_id, custom_config, primary_model, fallback_model")
        .single();

      if (!newUserAgent) {
        return NextResponse.json({ error: "Failed to register agent" }, { status: 500 });
      }

      userAgent = newUserAgent;
    }
  } else {
    // Standard store agent deploy flow
    const { data: existingAgent } = await admin
      .from("user_agents")
      .select("id, deployed, agent_id, custom_config, primary_model, fallback_model")
      .eq("user_id", user.id)
      .eq("agent_id", agent_id)
      .single();

    if (!existingAgent) {
      return NextResponse.json(
        { error: "Agent not found in your library" },
        { status: 404 }
      );
    }

    if (existingAgent.deployed) {
      return NextResponse.json(
        { error: "Agent is already deployed" },
        { status: 400 }
      );
    }

    userAgent = existingAgent;

    // Get agent name from store
    const { data: storeAgent } = await admin
      .from("agents")
      .select("name")
      .eq("id", agent_id)
      .single();

    agentName = storeAgent?.name || agent_id;
  }

  // Get agent config (for store agents)
  const { data: agent } = await admin
    .from("agents")
    .select("name, config_files")
    .eq("id", userAgent.agent_id)
    .single();

  if (!agent && !from_builder) {
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
    // Use builder config, custom config, or default template
    const configFiles = { ...((from_builder && builderConfigFiles) || userAgent.custom_config || agent?.config_files || {}) as Record<string, string> };
    // Remove internal metadata from config files
    delete configFiles.builder_name;

    // Inject per-agent model config if set (Pro feature)
    if (userAgent.primary_model) {
      try {
        const existingConfig = configFiles["config.json"]
          ? JSON.parse(configFiles["config.json"])
          : {};
        existingConfig.model = {
          primary: userAgent.primary_model,
          fallbacks: userAgent.fallback_model ? [userAgent.fallback_model] : [],
        };
        configFiles["config.json"] = JSON.stringify(existingConfig, null, 2);
      } catch {
        // If config.json parsing fails, create a minimal one
        configFiles["config.json"] = JSON.stringify({
          model: {
            primary: userAgent.primary_model,
            fallbacks: userAgent.fallback_model ? [userAgent.fallback_model] : [],
          },
        }, null, 2);
      }
    }

    await deployAgent(
      {
        ip_address: vps.ip_address,
        ssh_user: vps.ssh_user,
        ssh_password: decryptField(vps.ssh_password),
        ssh_port: vps.ssh_port,
      },
      agent?.name || agentName,
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
      agent_id: userAgent.agent_id,
      agent_name: agent?.name || agentName,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SSH error";
    // Log for debugging — generic message to client
    void message;
    return NextResponse.json({ error: "Failed to deploy agent. Ensure your server is running." }, { status: 500 });
  }
}
