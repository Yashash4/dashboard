import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { removeChannel } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:channel_disconnect`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { channel_id } = body as { channel_id?: string };

  if (!channel_id) {
    return NextResponse.json(
      { error: "Channel ID is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify user owns this channel
  const { data: channel } = await admin
    .from("channels")
    .select("id, channel_type, status")
    .eq("id", channel_id)
    .eq("user_id", user.id)
    .single();

  if (!channel) {
    return NextResponse.json(
      { error: "Channel not found" },
      { status: 404 }
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
      { error: "VPS must be running to disconnect channels" },
      { status: 400 }
    );
  }

  try {
    await removeChannel(
      {
        ip_address: vps.ip_address,
        ssh_user: vps.ssh_user,
        ssh_password: vps.ssh_password,
        ssh_port: vps.ssh_port,
      },
      channel.channel_type
    );

    // Remove encrypted credentials
    await admin.from("channel_credentials").delete().eq("channel_id", channel.id);

    // Remove channel from DB
    await admin.from("channels").delete().eq("id", channel.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to disconnect channel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
