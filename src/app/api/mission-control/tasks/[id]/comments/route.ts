import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/mission-control/tasks/[id]/comments
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
      .from("mc_comments")
      .select("*")
      .eq("task_id", taskId)
      .eq("user_id", user.id)
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
  const { supabase, user } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
