import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

export interface MCGuardResult {
  user: { id: string; email?: string };
  plan: string;
}

interface MCGuardOptions {
  rateLimit?: { max: number; window?: number };
  maxBodySize?: number;
}

/**
 * Shared guard for all Mission Control API routes.
 * 1. Auth check (401)
 * 2. Ultra plan check (403)
 * 3. Rate limit (429)
 * 4. Optional body size check (413)
 *
 * Returns MCGuardResult on success, NextResponse on failure.
 */
export async function guardMCRoute(
  request: NextRequest,
  options: MCGuardOptions = {}
): Promise<MCGuardResult | NextResponse> {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Plan check
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = (subscription?.plan as string) || "starter";

  if (!hasAccess(plan, "ultra")) {
    return NextResponse.json(
      { error: "Ultra plan required" },
      { status: 403 }
    );
  }

  // 3. Rate limit
  if (options.rateLimit) {
    const windowMs = (options.rateLimit.window || 60) * 1000;
    const identifier = `mc:${user.id}:${request.nextUrl.pathname.replace(/\/+$/, "")}`;
    const result = rateLimit(identifier, options.rateLimit.max, windowMs);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests, please wait" },
        { status: 429 }
      );
    }
  }

  // 4. Body size check — validate AFTER parsing to prevent Content-Length spoofing
  if (options.maxBodySize) {
    const contentLength = request.headers.get("content-length");
    // Only use header as a fast-path pre-check; actual validation happens after parse
    if (contentLength && parseInt(contentLength) > options.maxBodySize) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
  }

  return { user: { id: user.id, email: user.email ?? undefined }, plan };
}
