import dns from "dns";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/domains/verify — verify DNS A record for a domain */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`${user.id}:domain_verify`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const { domain_id } = body as { domain_id?: string };

  if (!domain_id) {
    return NextResponse.json(
      { error: "domain_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Fetch domain and verify ownership
  const { data: domainRecord } = await admin
    .from("custom_domains")
    .select("id, domain, status")
    .eq("id", domain_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!domainRecord) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Get user's VPS IP
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address")
    .eq("user_id", user.id)
    .single();

  if (!vps?.ip_address) {
    return NextResponse.json(
      { error: "No VPS found. Deploy a VPS first." },
      { status: 400 }
    );
  }

  // Resolve A records for the domain
  let resolvedIps: string[];
  try {
    resolvedIps = await dns.promises.resolve4(domainRecord.domain);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return NextResponse.json(
        {
          verified: false,
          error: `No A record found for ${domainRecord.domain}. Add an A record pointing to ${vps.ip_address}.`,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        verified: false,
        error: `DNS lookup failed: ${code || "unknown error"}. Try again in a few minutes.`,
      },
      { status: 200 }
    );
  }

  // Check if any resolved IP matches the VPS IP
  const match = resolvedIps.includes(vps.ip_address);

  if (match) {
    await admin
      .from("custom_domains")
      .update({ status: "verified", ssl_status: "provisioning" })
      .eq("id", domain_id);

    return NextResponse.json({
      verified: true,
      resolved_ips: resolvedIps,
    });
  }

  // No match — update status to error and return instructions
  await admin
    .from("custom_domains")
    .update({ status: "error" })
    .eq("id", domain_id);

  return NextResponse.json({
    verified: false,
    resolved_ips: resolvedIps,
    error: `DNS A record points to ${resolvedIps.join(", ")} but your VPS IP is ${vps.ip_address}. Update the A record to point to ${vps.ip_address}.`,
  });
}
