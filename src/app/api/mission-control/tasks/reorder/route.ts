import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

// PATCH /api/mission-control/tasks/reorder — bulk position update for drag-drop
export async function PATCH(request: NextRequest) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 }, maxBodySize: 51200 });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;

  const supabase = await createClient();
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

  if (updates.length > 100) {
    return NextResponse.json(
      { error: "Max 100 items per reorder" },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();

    const promises = updates.map((u) =>
      supabase
        .from("mc_tasks")
        .update({
          column_id: u.column_id,
          position: u.position,
          updated_at: now,
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
