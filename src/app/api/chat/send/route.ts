import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { searchKBChunks } from "@/lib/knowledge-base";

// Same sanitization as ssh.ts deployAgent uses for agent folder names
function sanitizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:chat_send`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();

  const body = await request.json();
  const { agent_id, message, new_session } = body as {
    agent_id?: string;
    message?: string;
    new_session?: boolean;
  };

  if (!agent_id || !message?.trim()) {
    return NextResponse.json(
      { error: "Agent ID and message are required" },
      { status: 400 }
    );
  }

  // Verify agent is deployed and get its name
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, deployed, agents(name)")
    .eq("user_id", user.id)
    .eq("agent_id", agent_id)
    .eq("deployed", true)
    .single();

  if (!userAgent) {
    return NextResponse.json(
      { error: "Agent is not deployed" },
      { status: 400 }
    );
  }

  const agentName = (userAgent as any).agents?.name || "main";
  const agentSlug = sanitizeAgentName(agentName);

  // Get VPS details (including Basic Auth credentials for nginx)
  const { data: vps } = await admin
    .from("vps_instances")
    .select(
      "id, hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status"
    )
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json(
      { error: "No VPS provisioned" },
      { status: 400 }
    );
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { error: "Your VPS is not running. Start it from the VPS page first." },
      { status: 400 }
    );
  }

  const dashboardUrl =
    vps.openclaw_dashboard_url ||
    (vps.hostname ? `https://${vps.hostname}` : null);

  if (!dashboardUrl) {
    return NextResponse.json(
      { error: "OpenClaw dashboard URL is not configured. Contact support." },
      { status: 400 }
    );
  }

  const analyticsStart = Date.now();

  try {
    // Upsert conversation in our DB (for display purposes)
    const { data: conversation } = await admin
      .from("chat_conversations")
      .upsert(
        {
          user_id: user.id,
          agent_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,agent_id" }
      )
      .select("id")
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    // If new_session requested, clear our local history
    if (new_session) {
      await admin
        .from("chat_messages")
        .delete()
        .eq("conversation_id", conversation.id);
    }

    // Store user message in our DB
    await admin.from("chat_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: message.trim(),
    });

    // Search Knowledge Base for relevant context (non-blocking if fails)
    // Skip for short/conversational messages — no point RAG-searching "hi" or "thanks"
    let kbContext = "";
    const trimmedMsg = message.trim();
    const wordCount = trimmedMsg.split(/\s+/).length;
    if (trimmedMsg.length >= 20 && wordCount >= 3) {
      try {
        const kbResults = await searchKBChunks(user.id, trimmedMsg, 3);
        if (kbResults.length > 0) {
          kbContext = kbResults
            .map((r) => `[From: ${r.documentName}]\n${r.content}`)
            .join("\n\n---\n\n");
        }
      } catch {
        // KB search failure should never block chat
      }
    }

    // Call OpenClaw chat completions API
    // Only send the latest message — OpenClaw manages full session history
    // via x-openclaw-session-key header
    const baseUrl = dashboardUrl.replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    // Session key: unique per user + agent for conversation persistence on OpenClaw side
    const sessionKey = new_session
      ? `${user.id}_${agentSlug}_${Date.now()}`
      : `${user.id}_${agentSlug}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-openclaw-session-key": sessionKey,
    };

    // HTTP Basic Auth to pass nginx (gateway uses trusted-proxy behind nginx)
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
          { role: "user", content: message.trim() },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!openclawResponse.ok) {
      const errorText = await openclawResponse.text().catch(() => "");
      console.error(
        "[chat/send] OpenClaw error:",
        openclawResponse.status,
        errorText
      );

      if (openclawResponse.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Check your dashboard credentials." },
          { status: 502 }
        );
      }
      if (openclawResponse.status === 404) {
        return NextResponse.json(
          {
            error:
              "Chat endpoint not available. The agent may need to be redeployed.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "Failed to get response from agent" },
        { status: 502 }
      );
    }

    const data = await openclawResponse.json();

    const msg = data.choices?.[0]?.message;

    // Use only the 'content' field — ignore 'reasoning_content' / 'thinking' fields
    // Some models (Kimi, DeepSeek) return thinking in a separate field
    let rawContent = msg?.content || "";

    // If content is empty but reasoning_content exists, model returned only thinking
    if (!rawContent && msg?.reasoning_content) {
      rawContent = "I processed your request but have no response to show.";
    }

    // Strip thinking/reasoning tags (various model formats)
    const assistantContent = rawContent
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
      .replace(/<\|think_start\|>[\s\S]*?<\|think_end\|>/gi, "")
      .trim() || "No response from agent";

    // Store assistant message in our DB
    const { data: assistantMsg } = await admin
      .from("chat_messages")
      .insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: assistantContent,
      })
      .select("id")
      .single();

    // Update conversation timestamp
    await admin
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // Track analytics (non-blocking)
    admin
      .from("agent_analytics")
      .insert({
        user_id: user.id,
        agent_id: agent_id,
        metric_type: "message",
        response_time_ms: Date.now() - analyticsStart,
      })
      .then(() => {}, () => {});

    return NextResponse.json({
      response: assistantContent,
      message_id: assistantMsg?.id,
      conversation_id: conversation.id,
    });
  } catch (err) {
    // Track error analytics (non-blocking)
    admin
      .from("agent_analytics")
      .insert({
        user_id: user.id,
        agent_id: agent_id,
        metric_type: "error",
        response_time_ms: Date.now() - analyticsStart,
        metadata: { error: err instanceof Error ? err.message : "unknown" },
      })
      .then(() => {}, () => {});

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Agent took too long to respond" },
        { status: 504 }
      );
    }
    console.error("[chat/send] Error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
