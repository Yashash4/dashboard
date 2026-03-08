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

  const rl = rateLimit(`${user.id}:audit_log`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "50", 10) || 50));
  const category = params.get("category");
  const search = params.get("search");
  const offset = (page - 1) * limit;

  // Build query — use user client (RLS enforces user_id = auth.uid())
  let query = supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, category, actor_type, details, ip_address, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    const safe = search.replace(/[,%().\\/]/g, "");
    if (safe.trim()) {
      query = query.or(
        `action.ilike.%${safe}%,entity_type.ilike.%${safe}%`
      );
    }
  }

  const { data: logs, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }

  return NextResponse.json({
    logs: logs || [],
    total: count || 0,
    page,
    limit,
  });
}
