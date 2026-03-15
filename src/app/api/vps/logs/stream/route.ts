import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { NodeSSH } from "node-ssh";

/**
 * GET /api/vps/logs/stream
 * Server-Sent Events endpoint for live log tailing.
 * Connects to the user's VPS via SSH and streams docker/journalctl logs.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rl = rateLimit(`${user.id}:log_stream`, 5, 60_000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createAdminClient();

  const [{ data: sub }, { data: vps }] = await Promise.all([
    admin.from("subscriptions").select("plan").eq("user_id", user.id).single(),
    admin
      .from("vps_instances")
      .select("ip_address, ssh_user, ssh_password, ssh_port, status")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return new Response(JSON.stringify({ error: "Pro plan required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!vps || vps.status !== "running") {
    return new Response(JSON.stringify({ error: "VPS not available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let sshConnection: NodeSSH | null = null;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream already closed
          closed = true;
        }
      };

      // Keepalive every 15 seconds
      // Max connection duration: 30 minutes
      const maxDurationTimer = setTimeout(() => {
        sendEvent({ type: "timeout", message: "Maximum stream duration reached (30 min)" });
        if (keepaliveTimer) clearInterval(keepaliveTimer);
        if (sshConnection) { sshConnection.dispose(); sshConnection = null; }
        if (!closed) { closed = true; controller.close(); }
      }, 30 * 60 * 1000);

      keepaliveTimer = setInterval(() => {
        if (closed) { clearTimeout(maxDurationTimer); return; }
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearTimeout(maxDurationTimer);
          closed = true;
        }
      }, 15_000);

      try {
        // Connect to VPS via SSH
        const ssh = new NodeSSH();
        await ssh.connect({
          host: vps.ip_address,
          username: vps.ssh_user,
          password: vps.ssh_password,
          port: vps.ssh_port || 22,
          readyTimeout: 10_000,
        });
        sshConnection = ssh;

        sendEvent({ type: "connected", timestamp: new Date().toISOString() });

        // Detect runtime: Docker or systemd
        const dockerCheck = await ssh.execCommand(
          'docker inspect openclaw --format "{{.State.Status}}" 2>/dev/null'
        );
        const isDocker = !!(dockerCheck.stdout.trim() && !dockerCheck.stderr);

        const command = isDocker
          ? "docker logs openclaw --follow --tail 0 2>&1"
          : "journalctl -u openclaw-gateway -f -n 0 --no-pager 2>&1";

        // Execute the streaming command
        // Use the underlying SSH2 channel for raw streaming
        const rawConn = (ssh as any).connection;
        if (!rawConn) {
          sendEvent({ type: "error", message: "SSH connection unavailable" });
          controller.close();
          return;
        }

        rawConn.exec(command, (err: Error | undefined, channel: any) => {
          if (err) {
            sendEvent({ type: "error", message: err.message });
            if (!closed) controller.close();
            return;
          }

          channel.on("data", (data: Buffer) => {
            const lines = data.toString("utf-8").split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              sendEvent({
                line: trimmed,
                timestamp: new Date().toISOString(),
              });
            }
          });

          channel.stderr.on("data", (data: Buffer) => {
            const lines = data.toString("utf-8").split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              sendEvent({
                line: trimmed,
                timestamp: new Date().toISOString(),
                stderr: true,
              });
            }
          });

          channel.on("close", () => {
            sendEvent({ type: "disconnected", timestamp: new Date().toISOString() });
            if (!closed) {
              closed = true;
              controller.close();
            }
          });
        });
      } catch (err) {
        sendEvent({
          type: "error",
          message: err instanceof Error ? err.message : "SSH connection failed",
        });
        if (keepaliveTimer) clearInterval(keepaliveTimer);
        if (sshConnection) { sshConnection.dispose(); sshConnection = null; }
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },

    cancel() {
      closed = true;
      if (keepaliveTimer) clearInterval(keepaliveTimer);
      if (sshConnection) {
        sshConnection.dispose();
        sshConnection = null;
      }
    },
  });

  // Listen for client disconnect via AbortSignal
  request.signal.addEventListener("abort", () => {
    closed = true;
    if (keepaliveTimer) clearInterval(keepaliveTimer);
    if (sshConnection) {
      sshConnection.dispose();
      sshConnection = null;
    }
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
