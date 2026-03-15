import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 1 per day (86400000ms)
  const rl = rateLimit(`${user.id}:data_export`, 1, 86_400_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "You can only export your data once per day. Try again later." },
      { status: 429 }
    );
  }

  const admin = createAdminClient();

  const [profileRes, subscriptionRes, ticketsRes, agentsRes, channelsRes] =
    await Promise.all([
      admin
        .from("users")
        .select("name, email, role, created_at, notification_preferences, timezone")
        .eq("id", user.id)
        .single(),
      admin
        .from("subscriptions")
        .select("plan, billing_cycle, price, status, started_at, expires_at")
        .eq("user_id", user.id)
        .single(),
      admin
        .from("support_tickets")
        .select("id, subject, status, priority, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      admin
        .from("user_agents")
        .select("agent_id, deployed, created_at")
        .eq("user_id", user.id),
      admin
        .from("channels")
        .select("platform, status, created_at")
        .eq("user_id", user.id),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data || null,
    subscription: subscriptionRes.data || null,
    tickets: ticketsRes.data || [],
    agents: agentsRes.data || [],
    channels: channelsRes.data || [],
  };

  const jsonStr = JSON.stringify(exportData, null, 2);

  return new NextResponse(jsonStr, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="clawhq-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
