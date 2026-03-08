import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { configureChannel } from "@/lib/ssh";
import { encryptCredentials, isEncryptionConfigured } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";

const VALID_CHANNELS = [
  "whatsapp",
  "telegram",
  "discord",
  "slack",
  "signal",
  "teams",
  "webchat",
  "other",
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:channel_connect`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { channel_type, credentials } = body as {
    channel_type?: string;
    credentials?: Record<string, string>;
  };

  if (!channel_type || !VALID_CHANNELS.includes(channel_type)) {
    return NextResponse.json(
      { error: "Invalid channel type" },
      { status: 400 }
    );
  }

  // Webchat doesn't need credentials
  if (channel_type !== "webchat" && (!credentials || Object.keys(credentials).length === 0)) {
    return NextResponse.json(
      { error: "Credentials are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if channel already exists for this user
  const { data: existing } = await admin
    .from("channels")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("channel_type", channel_type)
    .single();

  if (existing && existing.status === "connected") {
    return NextResponse.json(
      { error: "This channel is already connected" },
      { status: 400 }
    );
  }

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, status")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json(
      { error: "No VPS instance found" },
      { status: 404 }
    );
  }

  if (vps.status !== "running") {
    return NextResponse.json(
      { error: "VPS must be running to connect channels" },
      { status: 400 }
    );
  }

  try {
    await configureChannel(
      {
        ip_address: vps.ip_address,
        ssh_user: vps.ssh_user,
        ssh_password: vps.ssh_password,
        ssh_port: vps.ssh_port,
      },
      channel_type,
      credentials || {}
    );

    let channelId: string;

    if (existing) {
      // Update existing disconnected/pending channel
      await admin
        .from("channels")
        .update({
          status: "connected",
          configured_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      channelId = existing.id;
    } else {
      // Insert new channel
      const { data: inserted } = await admin
        .from("channels")
        .insert({
          user_id: user.id,
          channel_type,
          status: "connected",
          configured_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      channelId = inserted?.id;
    }

    // Store encrypted credentials for recovery
    if (
      isEncryptionConfigured() &&
      credentials &&
      Object.keys(credentials).length > 0
    ) {
      const encrypted = encryptCredentials(credentials);
      // Upsert: delete old, insert new
      await admin
        .from("channel_credentials")
        .delete()
        .eq("channel_id", channelId);
      await admin.from("channel_credentials").insert({
        channel_id: channelId,
        encrypted_data: encrypted,
      });
    }

    dispatchWebhooks(user.id, "channel.connected", {
      channel_type,
      channel_id: channelId,
    }).catch(() => {});

    return NextResponse.json({ success: true, channel_id: channelId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect channel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
