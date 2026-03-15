import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { searchKBChunks } from "@/lib/knowledge-base";
import { shouldSearchKB } from "@/lib/rag-classifier";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";
import { createRequestContext, apiError, type RequestContext } from "@/lib/api-errors";

function sanitizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** POST /api/v1/chat — API key authenticated chat endpoint */
export async function POST(request: NextRequest) {
  const ctx = createRequestContext(request);

  // Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiError("invalid_api_key", "Missing Authorization: Bearer <api_key> header", ctx);
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return apiError("invalid_api_key", "Invalid API key format", ctx);
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
    return apiError("invalid_api_key", "Invalid API key", ctx);
  }

  if (apiKey.status !== "active") {
    return NextResponse.json(
      { error: { code: "revoked_api_key", message: "API key has been revoked", type: "authentication_error", request_id: ctx.requestId } },
      { status: 401, headers: { "X-Request-Id": ctx.requestId } }
    );
  }

  // Plan check — keys must not work after downgrade from Pro
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", apiKey.user_id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!["pro", "ultra", "enterprise"].includes(plan)) {
    return NextResponse.json(
      { error: { code: "plan_required", message: "API access requires a Pro plan or higher", type: "authorization_error", request_id: ctx.requestId } },
      { status: 403, headers: { "X-Request-Id": ctx.requestId } }
    );
  }

  // Per-key rate limiting
  const rpm = apiKey.rate_limit_per_min || 60;
  const rl = rateLimit(`apikey:${apiKey.id}`, rpm, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Rate limit exceeded. Try again later.", type: "api_error", request_id: ctx.requestId } },
      { status: 429, headers: { "X-Request-Id": ctx.requestId, "Retry-After": "60" } }
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

  const { message, agent, session_id, stream } = body as {
    message?: string;
    agent?: string;
    session_id?: string;
    stream?: boolean;
  };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "message field is required" },
      { status: 400 }
    );
  }

  if (message.length > 100_000) {
    return NextResponse.json(
      { error: "Message too long (max 100KB)" },
      { status: 400 }
    );
  }

  if (session_id && (session_id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(session_id))) {
    return NextResponse.json(
      { error: "session_id must be alphanumeric, max 128 chars" },
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
        `${vps.dashboard_username}:${vps.dashboard_password}`
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

      return NextResponse.json(
        { error: "Failed to get response from agent" },
        { status: 502 }
      );
    }

    // --- Streaming response ---
    if (stream && openclawResponse.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = openclawResponse.body.getReader();

      const sseStream = new ReadableStream({
        async start(controller) {
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
          } finally {
            controller.close();
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

      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // --- Non-streaming response ---
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
      return NextResponse.json(
        { error: "Agent took too long to respond" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
