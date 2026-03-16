import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { guardMCRoute } from "@/lib/mc-route-guard";

// GET /api/mission-control/tasks/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 30, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();

  const { id: taskId } = await params;

  try {
    // Verify the task belongs to the user
    const { data: task, error: taskError } = await supabase
      .from("mc_tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch ALL comments for this task (not just the user's)
    const { data, error } = await supabase
      .from("mc_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: data || [] });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

// POST /api/mission-control/tasks/[id]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMCRoute(request, { rateLimit: { max: 20, window: 60 } });
  if (guard instanceof NextResponse) return guard;
  const { user } = guard;
  const supabase = await createClient();

  const { id: taskId } = await params;
  const body = await request.json();
  const { content, parent_id, mentions = [] } = body as {
    content?: string;
    parent_id?: string;
    mentions?: string[];
  };

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  try {
    // Verify the task belongs to the authenticated user
    const { data: task } = await supabase
      .from("mc_tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get user name for author field
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("mc_comments")
      .insert({
        user_id: user.id,
        task_id: taskId,
        author: profile?.name || user.email || "user",
        content: content.trim(),
        parent_id: parent_id || null,
        mentions,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
