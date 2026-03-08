import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { searchKBChunks } from "@/lib/knowledge-base";

function sanitizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** POST /api/v1/chat — API key authenticated chat endpoint */
export async function POST(request: NextRequest) {
  // Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <api_key> header" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401 }
    );
  }

  // Validate key via SHA-256 lookup
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();

  const { data: apiKey, error: keyError } = await admin
    .from("api_keys")
    .select("id, user_id, status, rate_limit_per_min, usage_count")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (apiKey.status !== "active") {
    return NextResponse.json(
      { error: "API key has been revoked" },
      { status: 401 }
    );
  }

  // Per-key rate limiting
  const rpm = apiKey.rate_limit_per_min || 60;
  const rl = rateLimit(`apikey:${apiKey.id}`, rpm, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { message, agent, session_id } = body as {
    message?: string;
    agent?: string;
    session_id?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "message field is required" },
      { status: 400 }
    );
  }

  const userId = apiKey.user_id;
  const analyticsStart = Date.now();

  // Find the target agent
  let agentId: string;
  let agentSlug: string;

  if (agent) {
    // Look up by slug or name
    const { data: userAgents } = await admin
      .from("user_agents")
      .select("id, agent_id, deployed, agents(name)")
      .eq("user_id", userId)
      .eq("deployed", true);

    const match = (userAgents || []).find((ua: any) => {
      const name = ua.agents?.name || "";
      return (
        sanitizeAgentName(name) === agent.toLowerCase() ||
        name.toLowerCase() === agent.toLowerCase()
      );
    });

    if (!match) {
      return NextResponse.json(
        { error: `Agent "${agent}" not found or not deployed` },
        { status: 404 }
      );
    }

    agentId = (match as any).agent_id;
    agentSlug = sanitizeAgentName((match as any).agents?.name || "main");
  } else {
    // Default: first deployed agent
    const { data: firstAgent } = await admin
      .from("user_agents")
      .select("agent_id, agents(name)")
      .eq("user_id", userId)
      .eq("deployed", true)
      .limit(1)
      .single();

    if (!firstAgent) {
      return NextResponse.json(
        { error: "No deployed agents found" },
        { status: 400 }
      );
    }

    agentId = firstAgent.agent_id;
    agentSlug = sanitizeAgentName((firstAgent as any).agents?.name || "main");
  }

  // Get VPS details
  const { data: vps } = await admin
    .from("vps_instances")
    .select(
      "hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status"
    )
    .eq("user_id", userId)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS provisioned" }, { status: 400 });
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS is not running" },
      { status: 503 }
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

  try {
    // Search Knowledge Base for context (skip short messages)
    let kbContext = "";
    const trimmedMsg = message.trim();
    const wordCount = trimmedMsg.split(/\s+/).length;
    if (trimmedMsg.length >= 20 && wordCount >= 3) {
      try {
        const kbResults = await searchKBChunks(userId, trimmedMsg, 3);
        if (kbResults.length > 0) {
          kbContext = kbResults
            .map((r) => `[From: ${r.documentName}]\n${r.content}`)
            .join("\n\n---\n\n");
        }
      } catch {
        // KB failure never blocks chat
      }
    }

    // Proxy to OpenClaw on VPS
    const baseUrl = dashboardUrl.replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    // Stateless by default — each call gets a unique session
    // Caller can pass session_id to maintain conversation state
    const sessionKey = session_id
      ? `apikey_${apiKey.id}_${session_id}`
      : `apikey_${apiKey.id}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-openclaw-session-key": sessionKey,
    };

    if (vps.dashboard_username && vps.dashboard_password) {
      const basicAuth = Buffer.from(
        `${vps.dashboard_username}:${vps.dashboard_password}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${basicAuth}`;
    }

    const openclawResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: `openclaw:${agentSlug}`,
        messages: [
          ...(kbContext
            ? [
                {
                  role: "system" as const,
                  content: `Use the following knowledge base context to help answer the user's question. Only reference it if relevant.\n\n${kbContext}`,
                },
              ]
            : []),
          { role: "user", content: trimmedMsg },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!openclawResponse.ok) {
      const errText = await openclawResponse.text().catch(() => "");
      console.error("[v1/chat] OpenClaw error:", openclawResponse.status, errText);

      // Track error analytics
      admin
        .from("agent_analytics")
        .insert({
          user_id: userId,
          agent_id: agentId,
          api_key_id: apiKey.id,
          metric_type: "error",
          response_time_ms: Date.now() - analyticsStart,
          metadata: { error: `upstream_${openclawResponse.status}` },
        })
        .then(() => {});

      return NextResponse.json(
        { error: "Failed to get response from agent" },
        { status: 502 }
      );
    }

    const data = await openclawResponse.json();
    const msg = data.choices?.[0]?.message;
    let rawContent = msg?.content || "";

    if (!rawContent && msg?.reasoning_content) {
      rawContent = "I processed your request but have no response to show.";
    }

    const assistantContent = rawContent
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
      .replace(/<\|think_start\|>[\s\S]*?<\|think_end\|>/gi, "")
      .trim() || "No response from agent";

    // Atomic usage_count increment (non-blocking)
    admin
      .rpc("increment_api_key_usage", { p_key_id: apiKey.id })
      .then(() => {});

    // Track analytics (non-blocking)
    admin
      .from("agent_analytics")
      .insert({
        user_id: userId,
        agent_id: agentId,
        api_key_id: apiKey.id,
        metric_type: "message",
        response_time_ms: Date.now() - analyticsStart,
      })
      .then(() => {});

    return NextResponse.json({
      response: assistantContent,
      agent: agentSlug,
    });
  } catch (err) {
    // Track error analytics
    admin
      .from("agent_analytics")
      .insert({
        user_id: userId,
        agent_id: agentId,
        api_key_id: apiKey.id,
        metric_type: "error",
        response_time_ms: Date.now() - analyticsStart,
        metadata: { error: err instanceof Error ? err.message : "unknown" },
      })
      .then(() => {});

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Agent took too long to respond" },
        { status: 504 }
      );
    }

    console.error("[v1/chat] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
