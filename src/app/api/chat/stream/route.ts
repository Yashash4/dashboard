import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

function sanitizeAgentName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rl = rateLimit(`${user.id}:chat_stream`, 30, 60_000);
  if (!rl.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }

  const { agent_id, message, new_session } = body as {
    agent_id?: string;
    message?: string;
    new_session?: boolean;
  };

  if (!agent_id || !message?.trim()) {
    return new Response(JSON.stringify({ error: "Agent ID and message required" }), { status: 400 });
  }

  // ST_HIGH_06: Message length validation matching chat/send's 10K limit
  if (message.length > 10000) {
    return new Response(JSON.stringify({ error: "Message must be at most 10000 characters" }), { status: 400 });
  }

  const admin = createAdminClient();

  const { data: userAgent } = await admin
    .from("user_agents")
    .select("id, deployed, agents(name)")
    .eq("user_id", user.id)
    .eq("agent_id", agent_id)
    .eq("deployed", true)
    .single();

  if (!userAgent) {
    return new Response(JSON.stringify({ error: "Agent not deployed" }), { status: 400 });
  }

  const agentName = (userAgent as any).agents?.name || "main";
  const agentSlug = sanitizeAgentName(agentName);

  const { data: vps } = await admin
    .from("vps_instances")
    .select("hostname, openclaw_dashboard_url, dashboard_username, dashboard_password, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return new Response(JSON.stringify({ error: "VPS not running" }), { status: 400 });
  }

  const dashboardUrl = vps.openclaw_dashboard_url || (vps.hostname ? `https://${vps.hostname}` : null);
  if (!dashboardUrl) {
    return new Response(JSON.stringify({ error: "Endpoint not configured" }), { status: 400 });
  }

  // Validate dashboard URL against SSRF (same as chat/send ST_MED_10)
  try {
    const parsedDashUrl = new URL(dashboardUrl);
    const h = parsedDashUrl.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(h) ||
        /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^192\.168\./.test(h)) {
      return new Response(JSON.stringify({ error: "Invalid endpoint" }), { status: 400 });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid endpoint URL" }), { status: 400 });
  }

  // Upsert conversation
  const { data: conversation } = await admin
    .from("chat_conversations")
    .upsert({ user_id: user.id, agent_id, updated_at: new Date().toISOString() }, { onConflict: "user_id,agent_id" })
    .select("id")
    .single();

  if (!conversation) {
    return new Response(JSON.stringify({ error: "Failed to create conversation" }), { status: 500 });
  }

  if (new_session) {
    await admin.from("chat_messages").delete().eq("conversation_id", conversation.id);
  }

  await admin.from("chat_messages").insert({
    conversation_id: conversation.id,
    role: "user",
    content: message.trim(),
  });

  const sessionKey = new_session
    ? `${user.id}_${agentSlug}_${Date.now()}`
    : `${user.id}_${agentSlug}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-openclaw-session-key": sessionKey,
  };

  // ST_CRIT_02: Null check before decrypting dashboard_password
  if (vps.dashboard_username && vps.dashboard_password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${vps.dashboard_username}:${decryptField(vps.dashboard_password)}`).toString("base64")}`;
  }

  const baseUrl = dashboardUrl.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const openclawRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: `openclaw:${agentSlug}`,
        messages: [{ role: "user", content: message.trim() }],
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!openclawRes.ok || !openclawRes.body) {
      // Fallback to non-streaming — agent returned error
      return new Response(JSON.stringify({ error: "Agent unavailable" }), { status: 502 });
    }

    // Stream SSE to client via TransformStream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    let fullContent = "";

    const reader = openclawRes.body.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                // Strip thinking tags
                const clean = delta
                  .replace(/<think>[\s\S]*?<\/think>/gi, "")
                  .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                if (clean) {
                  fullContent += clean;
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ content: clean, conversation_id: conversation.id })}\n\n`));
                }
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }

        // ST_HIGH_05: Store final message with error handling instead of fire-and-forget
        if (fullContent.trim()) {
          const { error: insertError } = await admin.from("chat_messages").insert({
            conversation_id: conversation.id,
            role: "assistant",
            content: fullContent.trim(),
          });
          if (insertError) {
            console.error("[chat/stream] Failed to save assistant message:", insertError.message);
          }
        }
      } catch (streamErr) {
        // ST_HIGH_05: Log stream errors instead of silently swallowing
        console.error("[chat/stream] Stream processing error:", streamErr instanceof Error ? streamErr.message : "unknown");
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Timeout" }), { status: 504 });
    }
    return new Response(JSON.stringify({ error: "Failed to send message" }), { status: 500 });
  }
}
