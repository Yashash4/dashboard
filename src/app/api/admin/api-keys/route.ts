import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { configureApiKeys } from "@/lib/ssh";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { decryptField } from "@/lib/credential-utils";

export const dynamic = "force-dynamic";

// GET: Fetch all API keys for a customer
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: keys } = await admin
    .from("user_api_keys")
    .select("id, provider, base_url, configured_at, created_at")
    .eq("user_id", userId)
    .order("provider");

  return NextResponse.json({ keys: keys || [] });
}

// POST: Save API key to Supabase + configure on VPS
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, provider, apiKey, baseUrl } = body as {
    userId?: string;
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
  };

  if (!userId || !provider || !apiKey) {
    return NextResponse.json(
      { error: "Missing required fields (userId, provider, apiKey)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Upsert key in Supabase
  const { error: dbError } = await admin.from("user_api_keys").upsert(
    {
      user_id: userId,
      provider: provider.toLowerCase(),
      api_key: apiKey,
      base_url: baseUrl || null,
    },
    { onConflict: "user_id,provider" }
  );

  if (dbError) {
    return NextResponse.json(
      { error: `Database error: ${dbError.message}` },
      { status: 500 }
    );
  }

  // Get VPS credentials + hostname to push config
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, hostname")
    .eq("user_id", userId)
    .single();

  if (!vps) {
    // Saved to DB but no VPS to configure — that's OK
    return NextResponse.json({
      success: true,
      configured: false,
      message: "Key saved. No VPS found — will be configured on deploy.",
    });
  }

  // Get user email + current model for gateway config
  const [{ data: targetUser }, { data: currentModel }] = await Promise.all([
    admin.from("users").select("email").eq("id", userId).single(),
    admin.from("models").select("current_model, context_limit").eq("user_id", userId).single(),
  ]);

  // Fetch ALL keys for this user to write complete auth-profiles.json
  const { data: allKeys } = await admin
    .from("user_api_keys")
    .select("provider, api_key, base_url")
    .eq("user_id", userId);

  if (!allKeys || allKeys.length === 0) {
    return NextResponse.json({ success: true, configured: false });
  }

  // Push to VPS (decrypt ssh_password for SSH connection)
  const result = await configureApiKeys(
    { ...vps, ssh_password: decryptField(vps.ssh_password) },
    allKeys.map((k) => ({
      provider: k.provider,
      apiKey: k.api_key,
      baseUrl: k.base_url?.trim() || undefined,
    })),
    {
      hostname: vps.hostname || "",
      email: targetUser?.email || "",
      appUrl: "https://app.clawhq.tech",
      modelName: currentModel?.current_model || undefined,
      contextLimit: currentModel?.context_limit || undefined,
    }
  );

  if (!result.success) {
    return NextResponse.json(
      { error: `SSH config failed: ${result.error}` },
      { status: 500 }
    );
  }

  // Mark as configured
  await admin
    .from("user_api_keys")
    .update({ configured_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", provider.toLowerCase());

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "api_key_configured", entityType: "api_key", entityId: userId, details: { provider }, ip });

  return NextResponse.json({ success: true, configured: true, debug: result.debug });
}

// DELETE: Remove API key
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, provider } = body as { userId?: string; provider?: string };

  if (!userId || !provider) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Delete from DB
  await admin
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider.toLowerCase());

  // Re-push remaining keys to VPS (or empty file if none left)
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, ssh_user, ssh_password, ssh_port, hostname")
    .eq("user_id", userId)
    .single();

  if (vps) {
    const [{ data: targetUser }, { data: delModel }] = await Promise.all([
      admin.from("users").select("email").eq("id", userId).single(),
      admin.from("models").select("current_model, context_limit").eq("user_id", userId).single(),
    ]);

    const { data: remainingKeys } = await admin
      .from("user_api_keys")
      .select("provider, api_key, base_url")
      .eq("user_id", userId);

    await configureApiKeys(
      { ...vps, ssh_password: decryptField(vps.ssh_password) },
      (remainingKeys || []).map((k) => ({
        provider: k.provider,
        apiKey: k.api_key,
        baseUrl: k.base_url?.trim() || undefined,
      })),
      {
        hostname: vps.hostname || "",
        email: targetUser?.email || "",
        appUrl: "https://app.clawhq.tech",
        modelName: delModel?.current_model || undefined,
        contextLimit: delModel?.context_limit || undefined,
      }
    );
  }

  const ip = getClientIp(request);
  logAudit({ adminId: user.id, action: "api_key_deleted", entityType: "api_key", entityId: userId, details: { provider }, ip });

  return NextResponse.json({ success: true });
}
