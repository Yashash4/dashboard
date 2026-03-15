import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:agent_config`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify user owns this agent
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, agent_id, custom_config")
    .eq("user_id", user.id)
    .eq("agent_id", agentId)
    .single();

  if (!userAgent) {
    return NextResponse.json({ error: "Agent not found in your library" }, { status: 404 });
  }

  // Get default config files from agents table
  const { data: agent } = await admin
    .from("agents")
    .select("config_files")
    .eq("id", agentId)
    .single();

  // Merge: custom_config overrides default config_files
  const defaultFiles = (agent?.config_files || {}) as Record<string, string>;
  const customFiles = (userAgent.custom_config || {}) as Record<string, string>;

  const merged = { ...defaultFiles, ...customFiles };
  // Remove internal metadata keys
  delete merged.builder_name;

  return NextResponse.json({ files: merged });
}
