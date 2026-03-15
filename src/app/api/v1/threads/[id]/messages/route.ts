import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";
import { searchKBChunks } from "@/lib/knowledge-base";

function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return null;
  return rawKey;
}

/** GET /api/v1/threads/:id/messages — Get thread message history */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  // Verify thread ownership
  const { data: thread } = await admin.from("api_threads").select("id").eq("id", id).eq("user_id", apiKey.user_id).single();
  if (!thread) return apiError("thread_not_found", "Thread not found", ctx);

  const url = new URL(request.url);
  const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "50"));

  const { data: messages } = await admin.from("api_thread_messages")
    .select("id, role, content, tool_calls, tool_results, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true })
    .limit(limit);

  return apiSuccess({
    messages: messages || [],
    thread_id: id,
    has_more: (messages || []).length === limit,
  }, ctx);
}

/** POST /api/v1/threads/:id/messages — Send a message in a thread */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("id, user_id, status, rate_limit_per_min").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const rl = rateLimit(`apikey:${apiKey.id}`, apiKey.rate_limit_per_min || 60, 60_000);
  if (!rl.success) return apiError("rate_limited", "Rate limit exceeded", ctx);

  // Verify thread
  const { data: thread } = await admin.from("api_threads").select("id, agent").eq("id", id).eq("user_id", apiKey.user_id).single();
  if (!thread) return apiError("thread_not_found", "Thread not found", ctx);

  const body = await request.json().catch(() => null);
  if (!body) return apiError("invalid_request", "Invalid JSON body", ctx);

  const { message } = body as { message?: string };
  if (!message?.trim()) return apiError("missing_parameter", "message is required", ctx, { param: "message" });

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
    headers["Authorization"] = `Basic ${Buffer.from(`${vps.dashboard_username}:${vps.dashboard_password}`).toString("base64")}`;
  }

  try {
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
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
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
    }, ctx);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return apiError("model_timeout", "Agent took too long to respond", ctx);
    }
    return apiError("internal_error", "Internal server error", ctx);
  }
}
