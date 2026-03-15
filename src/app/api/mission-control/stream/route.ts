import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { eventBus } from "@/lib/mc-event-bus";

// GET /api/mission-control/stream — SSE endpoint
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Ultra plan check (P1.5.4)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  if (!hasAccess(sub?.plan || "starter", "ultra")) {
    return new Response("Ultra plan required", { status: 403 });
  }

  // Rate limit SSE connections (P1.6.1)
  const rl = rateLimit(`mc-stream:${user.id}`, 5, 60000);
  if (!rl.success) {
    return new Response("Too many connections", { status: 429 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`
        )
      );

      // Listen for events for this user
      const handler = (event: {
        type: string;
        data?: Record<string, unknown>;
        timestamp: number;
      }) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      eventBus.on(`mc:${user.id}`, handler);

      // Heartbeat ping every 30s
      const pingInterval = setInterval(() => {
        if (closed) {
          clearInterval(pingInterval);
          return;
        }
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}\n\n`
            )
          );
        } catch {
          closed = true;
          clearInterval(pingInterval);
        }
      }, 30000);

      // Auto-close after 5 minutes (client will reconnect)
      const timeout = setTimeout(() => {
        closed = true;
        clearInterval(pingInterval);
        eventBus.off(`mc:${user.id}`, handler);
        try {
          // Send closing event before closing (P1.5.8)
          controller.enqueue(encoder.encode("event: closing\ndata: {}\n\n"));
          controller.close();
        } catch {}
      }, 5 * 60 * 1000);

      // Cleanup on abort
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pingInterval);
        clearTimeout(timeout);
        eventBus.off(`mc:${user.id}`, handler);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
