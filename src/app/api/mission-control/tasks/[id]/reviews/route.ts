import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/mission-control/tasks/[id]/reviews
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;

  try {
    const { data, error } = await supabase
      .from("mc_reviews")
      .select("*")
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reviews: data || [] });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

// POST /api/mission-control/tasks/[id]/reviews
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const body = await request.json();
  const { reviewer, status, notes } = body as {
    reviewer?: string;
    status?: string;
    notes?: string;
  };

  if (!status) {
    return NextResponse.json(
      { error: "Status is required" },
      { status: 400 }
    );
  }

  const validStatuses = ["approved", "rejected", "needs_changes"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: approved, rejected, or needs_changes" },
      { status: 400 }
    );
  }

  try {
    // Get user name for reviewer field fallback
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("mc_reviews")
      .insert({
        user_id: user.id,
        task_id: taskId,
        reviewer: reviewer || profile?.name || user.email || "reviewer",
        status,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Also log activity
    await supabase.from("mc_task_activities").insert({
      user_id: user.id,
      task_id: taskId,
      actor: reviewer || profile?.name || "reviewer",
      action: "added_review",
      old_value: null,
      new_value: status,
    });

    return NextResponse.json({ review: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
