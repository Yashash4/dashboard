import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/knowledge-base/feedback — Submit thumbs up/down on a search result */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:kb_feedback`, 30, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { chunk_id, document_id, query, rating } = body as {
    chunk_id?: string; document_id?: string; query?: string; rating?: number;
  };

  if (!chunk_id || !document_id || !query || !rating || ![-1, 1].includes(rating)) {
    return NextResponse.json({ error: "chunk_id, document_id, query, and rating (-1 or 1) are required" }, { status: 400 });
  }

  const { error } = await admin.from("kb_feedback").insert({
    user_id: user.id,
    chunk_id,
    document_id,
    query,
    rating,
  });

  if (error) return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  return NextResponse.json({ success: true });
}
