import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/audit-log/export — Export all audit logs (up to 10K) */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:audit_export`, 3, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = admin.from("audit_logs")
    .select("id, action, entity_type, entity_id, category, details, ip_address, created_at, entry_hash")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: entries, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  if (!entries || entries.length === 0)
    return NextResponse.json({ error: "No entries to export" }, { status: 404 });

  if (format === "json") {
    return new Response(JSON.stringify({ entries, exported_at: new Date().toISOString(), total: entries.length }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // CSV (with injection protection)
  const csvHeader = "Timestamp,Action,Category,Entity Type,Entity ID,IP,Details Hash\n";
  const csvRows = entries.map((e) => {
    const sanitize = (v: string | null) => {
      if (!v) return "";
      // Prevent CSV injection
      const s = v.replace(/"/g, '""');
      return /[,"\n\r]/.test(s) || s.startsWith("=") || s.startsWith("+") || s.startsWith("-") || s.startsWith("@")
        ? `"${s}"` : s;
    };
    return [
      sanitize(e.created_at),
      sanitize(e.action),
      sanitize(e.category),
      sanitize(e.entity_type),
      sanitize(e.entity_id),
      sanitize(e.ip_address),
      sanitize(e.entry_hash),
    ].join(",");
  }).join("\n");

  return new Response(csvHeader + csvRows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
