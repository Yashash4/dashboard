import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

const MAX_STREAMS_PER_USER = 3;
const VALID_DESTINATION_TYPES = ["http", "datadog", "splunk", "s3"] as const;
const VALID_FORMATS = ["json", "cef"] as const;

/**
 * GET /api/audit-log/streams
 * List the user's configured SIEM streams.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const rl = rateLimit(`${user.id}:siem_streams`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: streams, error } = await admin
    .from("siem_configs")
    .select("id, destination_type, destination_url, format, enabled, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch SIEM streams" },
      { status: 500 }
    );
  }

  // Mask destination_url credentials — URLs may embed API keys as query params or path segments
  const masked = (streams || []).map((s) => {
    let maskedUrl = s.destination_url;
    try {
      const u = new URL(s.destination_url);
      // Mask any query parameters (often contain tokens/keys)
      if (u.search) {
        for (const [key] of u.searchParams) {
          u.searchParams.set(key, "••••••••");
        }
        maskedUrl = u.toString();
      }
      // Mask password in URL (e.g. https://user:pass@host)
      if (u.password) {
        maskedUrl = maskedUrl.replace(u.password, "••••••••");
      }
    } catch {
      // If URL parsing fails, return as-is (already validated on insert)
    }
    return { ...s, destination_url: maskedUrl };
  });

  return NextResponse.json({ streams: masked });
}

/**
 * POST /api/audit-log/streams
 * Create a new SIEM stream destination.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const rl = rateLimit(`${user.id}:siem_streams_write`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { destination_type, destination_url, api_key, format } = body as {
    destination_type?: string;
    destination_url?: string;
    api_key?: string;
    format?: string;
  };

  // Validate destination_type
  if (
    !destination_type ||
    !VALID_DESTINATION_TYPES.includes(
      destination_type as (typeof VALID_DESTINATION_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: `Invalid destination_type. Must be one of: ${VALID_DESTINATION_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Validate destination_url
  if (!destination_url?.trim()) {
    return NextResponse.json(
      { error: "destination_url is required" },
      { status: 400 }
    );
  }

  // Basic URL validation
  try {
    new URL(destination_url);
  } catch {
    return NextResponse.json(
      { error: "Invalid destination_url format" },
      { status: 400 }
    );
  }

  // Block private/internal URLs
  const host = new URL(destination_url).hostname;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("172.") ||
    host === "0.0.0.0"
  ) {
    return NextResponse.json(
      { error: "Private/internal URLs are not allowed" },
      { status: 400 }
    );
  }

  // Validate format
  const streamFormat = format || "json";
  if (!VALID_FORMATS.includes(streamFormat as (typeof VALID_FORMATS)[number])) {
    return NextResponse.json(
      { error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}` },
      { status: 400 }
    );
  }

  // Check stream limit
  const { count } = await admin
    .from("siem_configs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= MAX_STREAMS_PER_USER) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_STREAMS_PER_USER} SIEM streams allowed` },
      { status: 400 }
    );
  }

  const { data: stream, error } = await admin
    .from("siem_configs")
    .insert({
      user_id: user.id,
      destination_type,
      destination_url: destination_url.trim(),
      api_key: api_key?.trim() || null,
      format: streamFormat,
      enabled: true,
    })
    .select("id, destination_type, destination_url, format, enabled, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create SIEM stream" },
      { status: 500 }
    );
  }

  return NextResponse.json({ stream }, { status: 201 });
}

/**
 * DELETE /api/audit-log/streams
 * Remove a SIEM stream by id (passed as query param).
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const rl = rateLimit(`${user.id}:siem_streams_write`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const streamId = request.nextUrl.searchParams.get("id");
  if (!streamId) {
    return NextResponse.json(
      { error: "Stream id is required" },
      { status: 400 }
    );
  }

  // Verify the stream belongs to this user
  const { data: existing } = await admin
    .from("siem_configs")
    .select("id")
    .eq("id", streamId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "SIEM stream not found" },
      { status: 404 }
    );
  }

  await admin.from("siem_configs").delete().eq("id", streamId);

  return NextResponse.json({ deleted: true });
}
