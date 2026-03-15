import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/knowledge-base/chunks — View chunks for a document */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:kb_chunks`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const documentId = url.searchParams.get("document_id");
  if (!documentId) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  // Verify document belongs to user
  const { data: doc } = await admin.from("kb_documents").select("id").eq("id", documentId).eq("user_id", user.id).single();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data: chunks } = await admin.from("kb_chunks")
    .select("id, content, chunk_index, metadata, is_edited")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .order("chunk_index", { ascending: true });

  return NextResponse.json({ chunks: chunks || [] });
}

/** PATCH /api/knowledge-base/chunks — Edit a chunk's content */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:kb_chunk_edit`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { chunk_id, content } = body as { chunk_id?: string; content?: string };

  if (!chunk_id || !content?.trim()) return NextResponse.json({ error: "chunk_id and content required" }, { status: 400 });

  const { error } = await admin.from("kb_chunks").update({
    content: content.trim(),
    is_edited: true,
  }).eq("id", chunk_id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to update chunk" }, { status: 500 });
  return NextResponse.json({ success: true });
}
