import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { detectPatterns, detectAnomalies } from "@/lib/log-patterns";

/** POST /api/logs/patterns — Detect patterns in provided log lines */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", user.id).single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro"))
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const rl = rateLimit(`${user.id}:log_patterns`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { logs, baseline_logs } = body as { logs?: string[]; baseline_logs?: string[] };

  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return NextResponse.json({ error: "logs array is required" }, { status: 400 });
  }

  const patterns = detectPatterns(logs);
  let anomalies: ReturnType<typeof detectAnomalies> = [];

  if (baseline_logs && Array.isArray(baseline_logs) && baseline_logs.length > 0) {
    const baselinePatterns = detectPatterns(baseline_logs);
    anomalies = detectAnomalies(patterns, baselinePatterns);
  }

  return NextResponse.json({ patterns: patterns.slice(0, 50), anomalies });
}
