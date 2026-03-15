import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET: Fetch all customer data for admin detail page
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

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

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [
    { data: customer },
    { data: subscription },
    { data: vps },
    { data: model },
    { data: userAgents },
    { data: channels },
    { data: webhooks },
    { data: apiKeys },
    { data: tickets },
    { data: payments },
    { data: mcTasks },
  ] = await Promise.all([
    admin
      .from("users")
      .select("id, name, email, role, created_at")
      .eq("id", userId)
      .single(),
    admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single(),
    admin
      .from("vps_instances")
      .select("*")
      .eq("user_id", userId)
      .single(),
    admin
      .from("models")
      .select("*")
      .eq("user_id", userId)
      .single(),
    admin
      .from("user_agents")
      .select("*, agents(name, slug, category, description)")
      .eq("user_id", userId),
    admin
      .from("channels")
      .select("*")
      .eq("user_id", userId),
    admin
      .from("webhooks")
      .select("*")
      .eq("user_id", userId),
    admin
      .from("api_keys")
      .select("*")
      .eq("user_id", userId),
    admin
      .from("support_tickets")
      .select("id, subject, status, priority, category, created_at, resolved_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("mc_tasks")
      .select("id, title, status, priority, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Get auth metadata if possible
  let authMeta = null;
  try {
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    if (authData?.user) {
      authMeta = {
        last_sign_in_at: authData.user.last_sign_in_at,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at,
      };
    }
  } catch {
    // Auth lookup can fail - non-fatal
  }

  return NextResponse.json({
    customer,
    subscription,
    vps,
    model,
    userAgents: userAgents || [],
    channels: channels || [],
    webhooks: webhooks || [],
    apiKeys: apiKeys || [],
    tickets: tickets || [],
    payments: payments || [],
    mcTasks: mcTasks || [],
    authMeta,
  });
}
