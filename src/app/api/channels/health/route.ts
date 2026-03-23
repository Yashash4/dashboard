import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NodeSSH } from "node-ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo user: return mock healthy channels
  if (user.email === "demo@clawhq.tech") {
    return NextResponse.json({
      results: [
        { id: "demo-ch-telegram", health_status: "healthy", error_message: null },
        { id: "demo-ch-discord", health_status: "healthy", error_message: null },
        { id: "demo-ch-webchat", health_status: "healthy", error_message: null },
      ],
    });
  }

  const rl = rateLimit(`${user.id}:channels_health`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();

  // Get user's VPS
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps || vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS is not running" },
      { status: 400 }
    );
  }

  // Get connected channels
  const { data: channels } = await admin
    .from("channels")
    .select("id, channel_type, status")
    .eq("user_id", user.id)
    .eq("status", "connected");

  if (!channels || channels.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // ST_CRIT_02: Null check before decrypting ssh_password
  if (!vps.ssh_password) {
    return NextResponse.json(
      { error: "VPS credentials not available" },
      { status: 400 }
    );
  }

  // SSH into VPS and read OpenClaw config to check channel statuses
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: vps.ip_address,
      username: vps.ssh_user,
      password: decryptField(vps.ssh_password),
      port: vps.ssh_port || 22,
      readyTimeout: 10000,
    });

    // Read OpenClaw config
    const configPaths = [
      "/root/.openclaw/openclaw.json",
      "/home/node/.openclaw/openclaw.json",
    ];

    let config: Record<string, any> = {};
    for (const path of configPaths) {
      const result = await ssh.execCommand(`cat ${path} 2>/dev/null`);
      const raw = result.stdout.trim();
      if (raw) {
        try {
          // ST_HIGH_02: Old regex `//.*$` corrupted URLs containing `//`.
          // Only strip comments that start with `//` preceded by whitespace at line start
          // (not inside string values like URLs).
          const cleaned = raw
            .replace(/^\s*\/\/.*$/gm, "")
            .replace(/,\s*([\]}])/g, "$1");
          config = JSON.parse(cleaned);
          break;
        } catch {
          continue;
        }
      }
    }

    const channelConfig = config.channels || {};

    // Channel type to OpenClaw config key mapping
    const configKeyMap: Record<string, string> = {
      whatsapp: "whatsapp",
      telegram: "telegram",
      discord: "discord",
      slack: "slack",
      signal: "signal",
      teams: "msteams",
      webchat: "webchat",
    };

    const now = new Date().toISOString();
    const results: { id: string; health_status: string; error_message: string | null }[] = [];

    // ST_MED_02: Check OpenClaw process once instead of per-channel
    const processCheck = await ssh.execCommand(
      "pgrep -f 'openclaw' > /dev/null 2>&1 && echo 'running' || echo 'stopped'"
    );
    const isOpenClawRunning = processCheck.stdout.trim() === "running";

    for (const channel of channels) {
      const configKey = configKeyMap[channel.channel_type] || channel.channel_type;
      const chConf = channelConfig[configKey];

      let healthStatus = "unknown";
      let errorMessage: string | null = null;

      if (!chConf) {
        healthStatus = "down";
        errorMessage = "Channel not found in config";
      } else if (chConf.enabled === false) {
        healthStatus = "down";
        errorMessage = "Channel is disabled in config";
      } else if (!isOpenClawRunning) {
        healthStatus = "down";
        errorMessage = "OpenClaw process is not running";
      } else {
        healthStatus = "healthy";
      }

      // Update DB
      await admin
        .from("channels")
        .update({
          health_status: healthStatus,
          last_health_check: now,
          error_message: errorMessage,
        })
        .eq("id", channel.id);

      results.push({
        id: channel.id,
        health_status: healthStatus,
        error_message: errorMessage,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Failed to check channel health." }, { status: 500 });
  } finally {
    ssh.dispose();
  }
}
