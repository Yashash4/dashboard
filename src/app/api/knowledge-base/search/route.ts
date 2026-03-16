import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { searchKBChunks } from "@/lib/knowledge-base";

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
  const mode = request.nextUrl.searchParams.get("mode") || "content";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (mode === "name") {
    // Search by document name — escape LIKE wildcards to prevent injection
    const escapedQ = q.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");
    const { data: docs } = await admin
      .from("kb_documents")
      .select("id, name, type, file_size, chunk_count, status, created_at")
      .eq("user_id", user.id)
      .ilike("name", `%${escapedQ}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      results: (docs || []).map((d) => ({
        id: d.id,
        documentName: d.name,
        type: d.type,
        fileSize: d.file_size,
        chunkCount: d.chunk_count,
        status: d.status,
      })),
    });
  }

  // Content search — uses vector search (primary) with FTS fallback
  try {
    const kbResults = await searchKBChunks(user.id, q.trim(), 20);

    return NextResponse.json({
      results: kbResults.map((r, i) => ({
        id: `result-${i}`,
        content: r.content,
        documentName: r.documentName,
        similarity: r.similarity || null,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
