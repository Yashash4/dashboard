import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/mission-control/agents/status — all agent statuses
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("mc_agent_status")
      .select(
        "*, agent:agent_id(id, name, description), current_task:current_task_id(id, title)"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ agents: data || [] });
  } catch {
    return NextResponse.json({ agents: [] });
  }
}
