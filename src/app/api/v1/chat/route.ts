import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { searchKBChunks } from "@/lib/knowledge-base";
import { shouldSearchKB } from "@/lib/rag-classifier";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";
import { apiError } from "@/lib/api-errors";
import { decryptField } from "@/lib/credential-utils";
import { moderateApiInput } from "@/lib/moderation";
import { validateV1Auth } from "@/lib/v1-auth";

/** Max streaming duration in seconds (Next.js edge/serverless limit) */
export const maxDuration = 60;

/** Body size limit for this POST route */
const MAX_BODY_SIZE = 102_400; // 100 KB

function sanitizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** POST /api/v1/chat — API key authenticated chat endpoint */
export async function POST(request: NextRequest) {
  const auth = await validateV1Auth(request);
  if (auth instanceof NextResponse) return auth;
  const { apiKey, admin, ctx } = auth;

  // Body size check
  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return apiError("invalid_request", "Request body too large (max 100KB)", ctx);
  }

  // Parse request body
  const rawBody = await request.text().catch(() => "");
  if (rawBody.length > MAX_BODY_SIZE) {
    return apiError("invalid_request", "Request body too large (max 100KB)", ctx);
  }
  const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
  if (!body) {
    return apiError("invalid_request", "Invalid JSON body", ctx);
  }

  const { message, agent, session_id, stream } = body as {
    message?: string;
    agent?: string;
    session_id?: string;
    stream?: boolean;
  };

  if (!message?.trim()) {
    return apiError("missing_parameter", "message field is required", ctx, { param: "message" });
  }

  if (message.length > 100_000) {
    return apiError("invalid_request", "Message too long (max 100KB)", ctx);
  }

  // Content moderation — block harmful inputs before sending to model
  const modResult = moderateApiInput(message);
  if (modResult.blocked) {
    return apiError("content_blocked", modResult.category
      ? `Content blocked: ${modResult.category}`
      : "Your message was blocked by our content policy.", ctx);
  }

  if (session_id && (session_id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(session_id))) {
    return apiError("invalid_parameter", "session_id must be alphanumeric, max 128 chars", ctx, { param: "session_id" });
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
      return apiError("agent_not_found", `Agent "${agent}" not found or not deployed`, ctx);
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
      return apiError("agent_not_found", "No deployed agents found", ctx);
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
    return apiError("agent_offline", "No VPS provisioned", ctx);
  }

  if (vps.status !== "running") {
    return apiError("agent_offline", "VPS is not running", ctx);
  }

  const dashboardUrl =
    vps.openclaw_dashboard_url ||
    (vps.hostname ? `https://${vps.hostname}` : null);

  if (!dashboardUrl) {
    return apiError("internal_error", "Dashboard URL not configured", ctx);
  }

  try {
    // Search Knowledge Base for relevant context
    // Use RAG classifier to skip KB search for greetings, follow-ups, etc.
    let kbContext = "";
    const trimmedMsg = message.trim();
    const kbDecision = shouldSearchKB(trimmedMsg);
    if (kbDecision !== "skip" && trimmedMsg.length >= 2) {
      try {
        const kbResults = await searchKBChunks(userId, trimmedMsg, 3);
        if (kbResults.length > 0) {
          kbContext = kbResults
            .map((r) => `[Source: ${r.documentName}]\n${r.content}`)
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
        `${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${basicAuth}`;
    }

    const openclawBody: Record<string, unknown> = {
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
        { role: "user", content: trimmedMsg },
      ],
    };

    if (stream) {
      openclawBody.stream = true;
    }

    const openclawResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(openclawBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!openclawResponse.ok) {
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
        .then(() => {}, (e) => console.warn("[v1/chat] analytics insert failed:", e?.message));

      return apiError("model_error", "Failed to get response from agent", ctx);
    }

    // --- Streaming response ---
    if (stream && openclawResponse.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = openclawResponse.body.getReader();

      const sseStream = new ReadableStream({
        async start(controller) {
          // Max SSE stream duration — close stream after 60s to prevent runaway connections
          const streamTimeout = setTimeout(() => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { code: "model_timeout", message: "Stream timed out" } })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch { /* already closed */ }
            reader.cancel().catch(() => {});
          }, 60_000);

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              // Forward SSE chunks, stripping thinking tags from content
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    continue;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || "";
                    if (content) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                      );
                    }
                  } catch {
                    // Forward unparseable chunks as-is
                    controller.enqueue(encoder.encode(`${line}\n`));
                  }
                }
              }
            }
          } catch (streamErr) {
            // Send error event instead of silently closing
            try {
              const errMsg = streamErr instanceof Error && streamErr.name === "AbortError"
                ? "Stream aborted"
                : "Stream error occurred";
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { code: "stream_error", message: errMsg } })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch { /* controller already closed */ }
          } finally {
            clearTimeout(streamTimeout);
            try { controller.close(); } catch { /* already closed */ }
            const responseTimeMs = Date.now() - analyticsStart;
            // Track analytics (non-blocking)
            admin
              .rpc("increment_api_key_usage", { p_key_id: apiKey.id })
              .then(() => {}, (e) => console.warn("[v1/chat] increment_api_key_usage failed:", e?.message));
            admin
              .from("agent_analytics")
              .insert({
                user_id: userId,
                agent_id: agentId,
                api_key_id: apiKey.id,
                metric_type: "message",
                response_time_ms: responseTimeMs,
              })
              .then(() => {}, (e) => console.warn("[v1/chat] analytics insert failed:", e?.message));
            dispatchWebhooks(userId, "api.request", {
              agent: agentSlug,
              response_time_ms: responseTimeMs,
            }).catch(() => {});
          }
        },
      });

      const sseHeaders: Record<string, string> = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Request-Id": ctx.requestId,
      };
      if (ctx.clientRequestId) {
        sseHeaders["X-Client-Request-Id"] = ctx.clientRequestId;
      }

      return new Response(sseStream, { headers: sseHeaders });
    }

    // --- Non-streaming response ---
    const data = await openclawResponse.json();
    const msg = data.choices?.[0]?.message;
    let rawContent = msg?.content || "";

    if (!rawContent && msg?.reasoning_content) {
      rawContent = "I processed your request but have no response to show.";
    }

    const assistantContent = rawContent
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, "")
      .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
      .replace(/<inner_monologue>[\s\S]*?<\/inner_monologue>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<\|think_start\|>[\s\S]*?<\|think_end\|>/gi, "")
      .trim() || "No response from agent";

    const responseTimeMs = Date.now() - analyticsStart;

    // Atomic usage_count increment (non-blocking)
    admin
      .rpc("increment_api_key_usage", { p_key_id: apiKey.id })
      .then(() => {}, (e) => console.warn("[v1/chat] increment_api_key_usage failed:", e?.message));

    // Track analytics (non-blocking)
    admin
      .from("agent_analytics")
      .insert({
        user_id: userId,
        agent_id: agentId,
        api_key_id: apiKey.id,
        metric_type: "message",
        response_time_ms: responseTimeMs,
      })
      .then(() => {}, (e) => console.warn("[v1/chat] analytics insert failed:", e?.message));

    // Fire api.request webhook (non-blocking)
    dispatchWebhooks(userId, "api.request", {
      agent: agentSlug,
      response_time_ms: responseTimeMs,
    }).catch(() => {});

    const successHeaders: Record<string, string> = { "X-Request-Id": ctx.requestId };
    if (ctx.clientRequestId) successHeaders["X-Client-Request-Id"] = ctx.clientRequestId;

    return NextResponse.json({
      response: assistantContent,
      agent: agentSlug,
      request_id: ctx.requestId,
    }, { headers: successHeaders });
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
      .then(() => {}, (e) => console.warn("[v1/chat] analytics insert failed:", e?.message));

    if (err instanceof Error && err.name === "AbortError") {
      return apiError("model_timeout", "Agent took too long to respond", ctx);
    }

    return apiError("internal_error", "Internal server error", ctx);
  }
}
