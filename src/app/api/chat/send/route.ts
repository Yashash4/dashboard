import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { searchKBChunks } from "@/lib/knowledge-base";
import { shouldSearchKB } from "@/lib/rag-classifier";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";
import { classifyIntent } from "@/lib/conversation-analysis";
import { evaluateGroundedness } from "@/lib/rag-evaluation";
import { decryptField } from "@/lib/credential-utils";

// Same sanitization as ssh.ts deployAgent uses for agent folder names
function sanitizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export const maxDuration = 60;

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
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

  if (message.length > 10000) {
    return NextResponse.json(
      { error: "Message must be at most 10000 characters" },
      { status: 400 }
    );
  }

  // Verify agent is deployed and get its name + model config
  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, deployed, primary_model, fallback_model, agents(name)")
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
      { error: "Agent endpoint not configured. Contact support." },
      { status: 400 }
    );
  }

  // ST_MED_10: Validate DB-stored dashboard URL against SSRF at fetch time
  try {
    const parsedDashUrl = new URL(dashboardUrl);
    if (!["https:", "http:"].includes(parsedDashUrl.protocol)) {
      return NextResponse.json({ error: "Invalid dashboard URL protocol" }, { status: 400 });
    }
    // Block obvious private IPs
    const h = parsedDashUrl.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(h) ||
        /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^192\.168\./.test(h)) {
      return NextResponse.json({ error: "Dashboard URL points to internal network" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid dashboard URL" }, { status: 400 });
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

      // Fire session.started webhook
      dispatchWebhooks(user.id, "session.started", {
        conversation_id: conversation.id,
        agent_id,
        agent_name: agentName,
      }).catch(() => {});
    }

    // Store user message in our DB
    await admin.from("chat_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: message.trim(),
    });

    // Check auto-responses BEFORE AI call (Pro feature)
    const { data: autoResponses } = await admin
      .from("auto_responses")
      .select("type, trigger_keyword, response_text, channel_type")
      .eq("user_id", user.id)
      .eq("is_enabled", true);

    if (autoResponses && autoResponses.length > 0) {
      // Filter to global (null channel_type) or webchat-specific responses
      const applicableResponses = autoResponses.filter(
        (ar) => !ar.channel_type || ar.channel_type === "webchat"
      );
      const trimmedMsg = message.trim().toLowerCase();

      // Check business hours for away messages
      const awayResponse = applicableResponses.find((ar) => ar.type === "away");
      if (awayResponse) {
        const { data: bizHours } = await admin
          .from("business_hours")
          .select("*")
          .eq("user_id", user.id)
          .is("channel_type", null)
          .single();

        if (bizHours) {
          const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          // Use the configured timezone for business hours check
          const userTz = bizHours.timezone || "UTC";
          const nowInTz = new Date(new Date().toLocaleString("en-US", { timeZone: userTz }));
          const dayName = days[nowInTz.getDay()];
          const dayEnabled = bizHours[`${dayName}_enabled` as keyof typeof bizHours];
          const dayStart = bizHours[`${dayName}_start` as keyof typeof bizHours] as string;
          const dayEnd = bizHours[`${dayName}_end` as keyof typeof bizHours] as string;

          if (dayEnabled === false || (dayStart && dayEnd)) {
            const currentTime = `${String(nowInTz.getHours()).padStart(2, "0")}:${String(nowInTz.getMinutes()).padStart(2, "0")}`;
            const isOutsideHours = dayEnabled === false || currentTime < dayStart || currentTime > dayEnd;

            if (isOutsideHours) {
              await admin.from("chat_messages").insert({
                conversation_id: conversation.id,
                role: "assistant",
                content: awayResponse.response_text,
              });
              return NextResponse.json({
                response: awayResponse.response_text,
                message_id: null,
                conversation_id: conversation.id,
                auto_response: true,
              });
            }
          }
        }
      }

      // Check FAQ keyword matches
      const faqMatch = applicableResponses.find(
        (ar) => ar.type === "faq" && ar.trigger_keyword &&
          trimmedMsg.includes(ar.trigger_keyword.toLowerCase())
      );
      if (faqMatch) {
        await admin.from("chat_messages").insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: faqMatch.response_text,
        });
        return NextResponse.json({
          response: faqMatch.response_text,
          message_id: null,
          conversation_id: conversation.id,
          auto_response: true,
        });
      }

      // Greeting for new sessions
      if (new_session) {
        const greeting = applicableResponses.find((ar) => ar.type === "greeting");
        if (greeting) {
          await admin.from("chat_messages").insert({
            conversation_id: conversation.id,
            role: "assistant",
            content: greeting.response_text,
          });
          // Don't return — still proceed to AI call. Greeting is supplementary.
        }
      }
    }

    // Search Knowledge Base for relevant context (non-blocking if fails)
    // Use RAG classifier to skip KB search for greetings, follow-ups, etc.
    let kbContext = "";
    const trimmedMsg = message.trim();
    const kbDecision = shouldSearchKB(trimmedMsg);
    if (kbDecision !== "skip" && trimmedMsg.length >= 2) {
      try {
        const kbResults = await searchKBChunks(user.id, trimmedMsg, 3);
        if (kbResults.length > 0) {
          kbContext = kbResults
            .map((r) => `[Source: ${r.documentName}]\n${r.content}`)
            .join("\n\n---\n\n");
        }
      } catch {
        // KB search failure should never block chat
      }
    }

    // Call OpenClaw chat completions API through nginx (trusted-proxy auth)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    // NOTE: Only the current user message is sent to OpenClaw. Conversation history is
    // maintained server-side by OpenClaw using the session key (user_id + agent_slug).
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
        `${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${basicAuth}`;
    }

    const baseUrl = dashboardUrl.replace(/\/$/, "");

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
                  content: `Use the following knowledge base context to answer the user's question. Cite the document name when using information from it. If the context is not relevant to the question, ignore it and answer normally.\n\n${kbContext}`,
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
      if (openclawResponse.status === 401) {
        return NextResponse.json(
          { error: "Connection to your agent failed." },
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

    // RAG evaluation — score groundedness if KB context was used (non-blocking)
    if (kbContext && assistantContent) {
      try {
        const kbChunks = kbContext.split("\n\n---\n\n").map((c) => c.replace(/^\[Source:.*?\]\n/, ""));
        const evalResult = evaluateGroundedness(assistantContent, kbChunks);
        // ST_LOW_02: Log errors on RAG eval insert instead of silently swallowing
        admin.from("agent_analytics").insert({
          user_id: user.id,
          agent_id: agent_id,
          metric_type: "rag_eval",
          metadata: { groundedness: evalResult.groundednessScore, supported: evalResult.supportedClaims, total: evalResult.totalClaims },
        }).then(() => {}, (err) => {
          console.warn("[chat/send] RAG evaluation insert failed:", err?.message || "unknown");
        });
      } catch {
        // Never let evaluation break the chat flow
      }
    }

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

    // Classify intent and store for analytics paths (10.2) — non-blocking
    try {
      const intent = classifyIntent(message.trim());
      // Count user messages in this conversation for message_index
      const { count: msgCount } = await admin
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversation.id)
        .eq("role", "user");

      admin
        .from("conversation_intents")
        .upsert(
          {
            user_id: user.id,
            conversation_id: conversation.id,
            message_index: (msgCount || 1) - 1,
            intent,
          },
          { onConflict: "conversation_id,message_index" }
        )
        .then(() => {}, () => {});
    } catch {
      // Never let intent classification break the chat flow
    }

    dispatchWebhooks(user.id, "message.received", {
      conversation_id: conversation.id,
      agent_id,
    }).catch(() => {});

    return NextResponse.json({
      response: assistantContent,
      message_id: assistantMsg?.id,
      conversation_id: conversation.id,
      model_used: (userAgent as any).primary_model || undefined,
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
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
