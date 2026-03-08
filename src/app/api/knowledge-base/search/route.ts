import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:kb_search`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Use Postgres full-text search via RPC function
  const { data: chunks, error } = await admin.rpc("search_kb_chunks_fts", {
    p_user_id: user.id,
    p_query: q.trim(),
    p_limit: 20,
  });

  if (error) {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }

  // Get document names (with user_id filter for defense-in-depth)
  const docIds = [...new Set((chunks || []).map((c: any) => c.chunk_document_id))];
  let docMap = new Map<string, string>();
  if (docIds.length > 0) {
    const { data: docs } = await admin
      .from("kb_documents")
      .select("id, name")
      .in("id", docIds)
      .eq("user_id", user.id);
    docMap = new Map(docs?.map((d) => [d.id, d.name]) || []);
  }

  const results = (chunks || []).map((c: any) => ({
    id: c.chunk_id,
    content: c.chunk_content,
    chunkIndex: c.chunk_index,
    documentId: c.chunk_document_id,
    documentName: docMap.get(c.chunk_document_id) || "Unknown",
    rank: c.rank,
  }));

  return NextResponse.json({ results });
}
