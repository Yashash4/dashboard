import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const page = parseInt(params.get("page") || "1", 10);
  const limit = Math.min(parseInt(params.get("limit") || "50", 10), 100);
  const action = params.get("action");
  const entityType = params.get("entity_type");

  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("audit_logs")
    .select("*, users!audit_logs_admin_id_fkey(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq("action", action);
  }
  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data: logs, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    logs: logs || [],
    total: count || 0,
    page,
    limit,
  });
}
