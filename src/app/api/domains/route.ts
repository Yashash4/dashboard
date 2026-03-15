import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const MAX_DOMAINS = 3;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/** GET /api/domains — list user's custom domains */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:domains_list`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const admin = createAdminClient();

  // Fetch VPS to include ip_address for DNS instructions
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address")
    .eq("user_id", user.id)
    .single();

  const { data: domains, error } = await admin
    .from("custom_domains")
    .select("id, domain, status, ssl_status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    domains: domains || [],
    vps_ip: vps?.ip_address || null,
  });
}

/** POST /api/domains — add a new custom domain */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:domain_create`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const { domain } = body as { domain?: string };

  if (!domain || typeof domain !== "string") {
    return NextResponse.json(
      { error: "Domain is required" },
      { status: 400 }
    );
  }

  const cleaned = domain.trim().toLowerCase();

  if (!DOMAIN_REGEX.test(cleaned)) {
    return NextResponse.json(
      { error: "Invalid domain format. Example: myapp.example.com" },
      { status: 400 }
    );
  }

  if (cleaned.length > 253) {
    return NextResponse.json(
      { error: "Domain name too long" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check max domains
  const { count } = await admin
    .from("custom_domains")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= MAX_DOMAINS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DOMAINS} custom domains allowed. Remove one first.` },
      { status: 400 }
    );
  }

  // Check if domain already exists (globally)
  const { data: existing } = await admin
    .from("custom_domains")
    .select("id")
    .eq("domain", cleaned)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This domain is already registered" },
      { status: 409 }
    );
  }

  const { data: newDomain, error } = await admin
    .from("custom_domains")
    .insert({
      user_id: user.id,
      domain: cleaned,
      status: "pending",
      ssl_status: "pending",
    })
    .select("id, domain, status, ssl_status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }

  return NextResponse.json({ domain: newDomain });
}

/** DELETE /api/domains — remove a custom domain */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:domain_delete`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: domain } = await admin
    .from("custom_domains")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("custom_domains")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
