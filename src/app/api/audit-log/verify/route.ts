import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { verifyChain } from "@/lib/audit-hash";

/** GET /api/audit-log/verify — Verify audit log hash chain integrity */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:audit_verify`, 5, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Fetch last 1000 audit entries for verification
  const { data: entries } = await admin.from("audit_logs")
    .select("id, entry_hash, previous_hash, user_id, action, entity_type, entity_id, category, details, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (!entries || entries.length === 0) {
    return NextResponse.json({ valid: true, verified: 0, total: 0 });
  }

  const result = verifyChain(entries);

  return NextResponse.json({
    ...result,
    total: entries.length,
  });
}
