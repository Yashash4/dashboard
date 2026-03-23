import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { searchKBChunks } from "@/lib/knowledge-base";
import { decryptField } from "@/lib/credential-utils";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/threads/:id/messages — Get thread message history (cursor-based pagination) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "thread_messages", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    // Verify thread ownership
    const { data: thread } = await admin.from("api_threads").select("id").eq("id", id).eq("user_id", apiKey.user_id).single();
    if (!thread) return apiError("thread_not_found", "Thread not found", ctx);

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get("limit") || "50", 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(200, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    let query = admin.from("api_thread_messages")
      .select("id, role, content, tool_calls, tool_results, created_at", { count: "exact" })
      .eq("thread_id", id)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch messages", ctx);
    }

    const results = messages || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    return apiSuccess({
      messages: results,
      thread_id: id,
      has_more: hasMore,
      total,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

/** POST /api/v1/threads/:id/messages — Send a message in a thread */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Use per-key rate limit (no override — uses apiKey's rate_limit_per_min)
    const auth = await validateV1Auth(request);
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    // Verify thread
    const { data: thread } = await admin.from("api_threads").select("id, agent").eq("id", id).eq("user_id", apiKey.user_id).single();
    if (!thread) return apiError("thread_not_found", "Thread not found", ctx);

    // Body size check
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 102_400) return apiError("invalid_request", "Request body too large (max 100KB)", ctx);
    const rawBody = await request.text().catch(() => "");
    if (rawBody.length > 102_400) return apiError("invalid_request", "Request body too large (max 100KB)", ctx);
    const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    if (!body) return apiError("invalid_request", "Invalid JSON body", ctx);

    const { message } = body as { message?: string };
    if (!message?.trim()) return apiError("missing_parameter", "message is required", ctx, { param: "message" });
    if (message.length > 10000) return apiError("invalid_request", "message must be 10000 characters or fewer", ctx, { param: "message" });

    // Store user message
    const userMsgId = `msg_${crypto.randomUUID().replace(/-/g, "")}`;
    await admin.from("api_thread_messages").insert({
      id: userMsgId,
      thread_id: id,
      role: "user",
      content: message.trim(),
    });

    // Get conversation history (last 20 messages — fetch descending, then reverse)
    const { data: historyDesc } = await admin.from("api_thread_messages")
      .select("role, content")
      .eq("thread_id", id)
      .order("created_at", { ascending: false })
      .limit(20);
    const history = (historyDesc || []).reverse();

    // Get VPS
    const { data: vps } = await admin.from("vps_instances")
      .select("hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status")
      .eq("user_id", apiKey.user_id).single();

    if (!vps || vps.status !== "running") return apiError("agent_offline", "VPS is not running", ctx);

    const dashboardUrl = vps.openclaw_dashboard_url || (vps.hostname ? `https://${vps.hostname}` : null);
    if (!dashboardUrl) return apiError("internal_error", "Dashboard URL not configured", ctx);

    // KB context
    let kbContext = "";
    if (message.trim().length >= 2) {
      try {
        const results = await searchKBChunks(apiKey.user_id, message.trim(), 3);
        if (results.length > 0) {
          kbContext = results.map((r) => `[Source: ${r.documentName}]\n${r.content}`).join("\n\n---\n\n");
        }
      } catch {}
    }

    const baseUrl = dashboardUrl.replace(/\/$/, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (vps.dashboard_username && vps.dashboard_password) {
      headers["Authorization"] = `Basic ${Buffer.from(`${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`).toString("base64")}`;
    }

    const messages_to_send = [
      ...(kbContext ? [{ role: "system" as const, content: `Use the following knowledge base context to answer. Cite the document name. If not relevant, ignore.\n\n${kbContext}` }] : []),
      ...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content || "" })),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { ...headers, "x-openclaw-session-key": `thread_${id}` },
      body: JSON.stringify({ model: `openclaw:${thread.agent}`, messages: messages_to_send }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return apiError("model_error", "Failed to get response from agent", ctx);

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, "")
      .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
      .replace(/<inner_monologue>[\s\S]*?<\/inner_monologue>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<\|think_start\|>[\s\S]*?<\|think_end\|>/gi, "")
      .trim() || "No response from agent";

    // Store assistant message
    const asstMsgId = `msg_${crypto.randomUUID().replace(/-/g, "")}`;
    await admin.from("api_thread_messages").insert({
      id: asstMsgId,
      thread_id: id,
      role: "assistant",
      content,
    });

    // Update thread timestamp
    await admin.from("api_threads").update({ updated_at: new Date().toISOString() }).eq("id", id);

    return apiSuccess({
      response: content,
      message_id: asstMsgId,
      thread_id: id,
    }, ctx, rateLimitInfo);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      const { createRequestContext } = await import("@/lib/api-errors");
      const ctx = createRequestContext(request);
      return apiError("model_timeout", "Agent took too long to respond", ctx);
    }
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
