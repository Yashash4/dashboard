import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

const GENERATION_SYSTEM_PROMPT = `You are an expert at creating OpenClaw AI agent configurations. The user will describe what kind of agent they want, and you must generate the complete configuration files.

An OpenClaw agent consists of these files:

1. **SOUL.md** — The agent's personality, values, and communication style. This is the most important file. Write it as detailed markdown with sections for personality traits, communication style, knowledge areas, and behavioral guidelines.

2. **identity.md** — Short identity card:
\`\`\`
# Agent Name
theme: one-line theme description
emoji: single emoji
\`\`\`

3. **TOOLS.md** — List of allowed tools as markdown bullet list. Available tools:
   - read (read files)
   - write (write files)
   - edit (edit files)
   - exec (execute commands)
   - bash (run bash commands)
   - browser (browse web pages)
   - web (web search)
   - memory_search (search agent memory)
   - memory_get (retrieve specific memory)
   - agents_list (list available agents)
   - sessions_list (list chat sessions)
   - thinking (internal reasoning)

4. **config.json** — JSON configuration:
\`\`\`json
{
  "model": { "primary": "clawhq/default", "fallbacks": [] },
  "identity": { "name": "Agent Name", "theme": "theme", "emoji": "emoji" },
  "sandbox": { "mode": "all", "workspaceAccess": "rw", "scope": "agent" },
  "tools": { "allow": ["read", "write", "browser"], "deny": [] }
}
\`\`\`

Generate all 4 files based on the user's description. Return ONLY valid JSON in this exact format:
{
  "soul_md": "full SOUL.md content",
  "identity_md": "full identity.md content",
  "tools_md": "full TOOLS.md content",
  "config_json": "full config.json as stringified JSON"
}

Be thorough with SOUL.md — it should be at least 500 characters with clear personality traits and communication guidelines. Choose appropriate tools based on what the agent needs to do.`;

/** POST /api/agents/generate — AI-generate agent config from description */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:agent_generate`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { description } = body as { description?: string };
  if (!description?.trim() || description.length < 10) {
    return NextResponse.json(
      { error: "Please provide a more detailed description (at least 10 characters)" },
      { status: 400 }
    );
  }

  if (description.length > 5000) {
    return NextResponse.json(
      { error: "Description too long (max 5000 characters)" },
      { status: 400 }
    );
  }

  // Get VPS to call the model
  const { data: vps } = await admin
    .from("vps_instances")
    .select("hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS must be running to generate agents" },
      { status: 400 }
    );
  }

  const dashboardUrl =
    vps.openclaw_dashboard_url ||
    (vps.hostname ? `https://${vps.hostname}` : null);

  if (!dashboardUrl) {
    return NextResponse.json(
      { error: "Dashboard URL not configured" },
      { status: 500 }
    );
  }

  const baseUrl = dashboardUrl.replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (vps.dashboard_username && vps.dashboard_password) {
    const basicAuth = Buffer.from(
      `${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`
    ).toString("base64");
    headers["Authorization"] = `Basic ${basicAuth}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "clawhq/default",
        messages: [
          { role: "system", content: GENERATION_SYSTEM_PROMPT },
          { role: "user", content: description.trim() },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to generate agent config" },
        { status: 502 }
      );
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip thinking tags
    content = content
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<\|think_start\|>[\s\S]*?<\|think_end\|>/gi, "")
      .trim();

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse generated config" },
        { status: 500 }
      );
    }

    const generated = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!generated.soul_md || !generated.identity_md || !generated.tools_md || !generated.config_json) {
      return NextResponse.json(
        { error: "Generated config is incomplete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ generated });
  } catch {
    return NextResponse.json(
      { error: "Generation failed or timed out" },
      { status: 500 }
    );
  }
}
