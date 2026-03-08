import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// PATCH /api/mission-control/tasks/reorder — bulk position update for drag-drop
export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { updates } = body as {
    updates?: Array<{
      id: string;
      column_id: string;
      position: number;
    }>;
  };

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json(
      { error: "Updates array is required" },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();

    // Update each task's column and position
    const promises = updates.map((u) =>
      supabase
        .from("mc_tasks")
        .update({
          column_id: u.column_id,
          position: u.position,
          updated_at: now,
          // Auto-set completed_at
          ...(u.column_id === "done" ? { completed_at: now } : {}),
        })
        .eq("id", u.id)
        .eq("user_id", user.id)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}
