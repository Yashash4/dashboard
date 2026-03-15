import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:activity`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();

  // Aggregate recent activity from multiple tables
  const [agentsRes, channelsRes, ticketsRes] = await Promise.all([
    admin
      .from("user_agents")
      .select("agent_id, deployed, deployed_at, purchased_at, agents(name)")
      .eq("user_id", user.id)
      .order("deployed_at", { ascending: false, nullsFirst: true })
      .limit(5),
    admin
      .from("channels")
      .select("channel_type, status, configured_at")
      .eq("user_id", user.id)
      .order("configured_at", { ascending: false, nullsFirst: true })
      .limit(5),
    admin
      .from("support_tickets")
      .select("subject, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const activities: { type: string; message: string; created_at: string }[] = [];

  // Agent activities
  for (const ua of agentsRes.data || []) {
    const name = (ua as any).agents?.name || "Agent";
    if (ua.deployed && ua.deployed_at) {
      activities.push({
        type: "agent_deployed",
        message: `${name} deployed`,
        created_at: ua.deployed_at,
      });
    } else if (ua.purchased_at) {
      activities.push({
        type: "agent_deployed",
        message: `${name} added to library`,
        created_at: ua.purchased_at,
      });
    }
  }

  // Channel activities
  for (const ch of channelsRes.data || []) {
    const typeName = ch.channel_type.charAt(0).toUpperCase() + ch.channel_type.slice(1);
    if (ch.configured_at) {
      activities.push({
        type: ch.status === "connected" ? "channel_connected" : "channel_disconnected",
        message: `${typeName} channel ${ch.status === "connected" ? "connected" : "disconnected"}`,
        created_at: ch.configured_at,
      });
    }
  }

  // Ticket activities
  for (const t of ticketsRes.data || []) {
    if (t.status === "resolved" && t.updated_at) {
      activities.push({
        type: "ticket_resolved",
        message: `Ticket "${t.subject}" resolved`,
        created_at: t.updated_at,
      });
    } else {
      activities.push({
        type: "ticket_created",
        message: `Ticket "${t.subject}" created`,
        created_at: t.created_at,
      });
    }
  }

  // Sort by date descending
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ activities: activities.slice(0, 10) });
}
