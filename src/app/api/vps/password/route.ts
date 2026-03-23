import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { updateDashboardPassword } from "@/lib/ssh";
import { rateLimit } from "@/lib/rate-limit";
import { decryptField, encryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

// GET: Fetch current dashboard credentials (masked password) for the logged-in user
// ST_HIGH_04: Only return masked password. Use POST /api/vps/password/reveal for full password.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:vps_password_get`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("dashboard_username, dashboard_password, hostname")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  // ST_HIGH_04: Return masked password — never expose plaintext in GET
  const hasPassword = !!vps.dashboard_password;
  const masked = hasPassword ? "••••••••" : null;

  return NextResponse.json({
    username: vps.dashboard_username || null,
    password: masked,
    has_password: hasPassword,
    hostname: vps.hostname || null,
  });
}

// ST_CRIT_03: POST-based password reveal with explicit action required
export async function PUT() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:vps_password_reveal`, 3, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("dashboard_username, dashboard_password, hostname")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  // ST_CRIT_02: Null check before decrypting
  const decryptedPassword = vps.dashboard_password ? decryptField(vps.dashboard_password) : null;

  return NextResponse.json({
    username: vps.dashboard_username || null,
    password: decryptedPassword,
    hostname: vps.hostname || null,
  });
}

// POST: Customer changes their own dashboard password
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:vps_password_post`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  const { password } = body as { password?: string };

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { error: "Password must be at most 128 characters" },
      { status: 400 }
    );
  }

  // ST_LOW_04: Password complexity — min 8 chars, at least 1 uppercase, 1 number
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one uppercase letter" },
      { status: 400 }
    );
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one number" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Get VPS credentials
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, dashboard_username")
    .eq("user_id", user.id)
    .single();

  if (!vps) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  const username = vps.dashboard_username || "admin";

  // ST_CRIT_02: Null check before decrypting ssh_password
  if (!vps.ssh_password) {
    return NextResponse.json(
      { error: "VPS credentials not available. VPS may still be provisioning." },
      { status: 400 }
    );
  }

  // Decrypt ssh_password before using it for SSH connection
  const sshCreds = { ...vps, ssh_password: decryptField(vps.ssh_password) };

  // Update on VPS via SSH
  let result;
  try {
    result = await updateDashboardPassword(sshCreds, username, password);
  } catch {
    return NextResponse.json(
      { error: "Failed to update password. Try again." },
      { status: 500 }
    );
  }

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to update password. Try again." },
      { status: 500 }
    );
  }

  // Save to DB (encrypted)
  await admin
    .from("vps_instances")
    .update({ dashboard_password: encryptField(password) })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
