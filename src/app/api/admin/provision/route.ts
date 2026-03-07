// Force module re-evaluation — v3
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { provisionVPS } from "@/lib/provision-v3";
import { createSubdomain, ensureSslFull } from "@/lib/cloudflare";
import { ensureFirewallPorts } from "@/lib/hostinger";
import {
  createJob,
  getJob,
  getActiveJob,
  updateStep,
  completeJob,
} from "@/lib/provision-store";

// Prevent Next.js from caching this route
export const dynamic = "force-dynamic";

// POST: Start provisioning (returns job ID immediately)
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { userId, ip, sshUser, sshPassword, sshPort, subdomain, email } =
    body as {
      userId?: string;
      ip?: string;
      sshUser?: string;
      sshPassword?: string;
      sshPort?: number;
      subdomain?: string;
      email?: string;
    };

  if (!userId || !ip || !sshUser || !sshPassword || !subdomain || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check if there's already an active job
  const active = getActiveJob();
  if (active) {
    return NextResponse.json(
      { error: "A provisioning job is already running", jobId: active.id },
      { status: 409 }
    );
  }

  // Create job and return immediately
  const jobId = crypto.randomUUID();
  createJob(jobId);

  // Run provisioning in background (not awaited)
  runProvisioning(jobId, {
    userId,
    ip,
    sshUser,
    sshPassword,
    sshPort: sshPort || 22,
    subdomain,
    email,
  });

  return NextResponse.json({ jobId });
}

// GET: Poll for job status
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get("jobId");

  const noCacheHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };

  // If no jobId, check for any active job (resume after navigation)
  if (!jobId) {
    const active = getActiveJob();
    if (active) {
      return NextResponse.json(active, { headers: noCacheHeaders });
    }
    return NextResponse.json({ status: "idle" }, { headers: noCacheHeaders });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404, headers: noCacheHeaders }
    );
  }

  return NextResponse.json(job, { headers: noCacheHeaders });
}

// Background provisioning function
async function runProvisioning(
  jobId: string,
  config: {
    userId: string;
    ip: string;
    sshUser: string;
    sshPassword: string;
    sshPort: number;
    subdomain: string;
    email: string;
  }
) {
  try {
    // Step 0: DNS
    console.log(
      `[Provision] Step 0: Create DNS record for ${config.subdomain}.clawhq.tech → ${config.ip}`
    );
    updateStep(jobId, {
      step: 0,
      label: "Create DNS record",
      status: "running",
    });

    const dns = await createSubdomain(config.subdomain, config.ip);
    if (!dns.success) {
      console.error(`[Provision] ✗ DNS failed: ${dns.error}`);
      updateStep(jobId, {
        step: 0,
        label: "Create DNS record",
        status: "error",
        output: dns.error,
      });
      completeJob(jobId, {
        success: false,
        error: `DNS setup failed: ${dns.error}`,
      });
      return;
    }

    console.log(`[Provision] ✓ DNS record created: ${dns.hostname}`);
    updateStep(jobId, {
      step: 0,
      label: "Create DNS record",
      status: "done",
      output: dns.hostname,
    });

    // Ensure SSL/TLS mode is "Full" (zone-level, idempotent)
    const ssl = await ensureSslFull();
    if (!ssl.success) {
      console.warn(`[Provision] ⚠ SSL mode set failed: ${ssl.error}`);
    } else {
      console.log(`[Provision] ✓ SSL/TLS mode set to Full`);
    }

    // Step 1: Open firewall ports (provider-level)
    console.log(`[Provision] Step 1: Open firewall ports for ${config.ip}`);
    updateStep(jobId, {
      step: 1,
      label: "Open firewall ports",
      status: "running",
    });

    let hostingerVmId: number | null = null;
    try {
      const fw = await ensureFirewallPorts(config.ip);
      hostingerVmId = fw.vmId;
      const msg =
        fw.portsOpened.length > 0
          ? `Opened ports ${fw.portsOpened.join(", ")} and synced`
          : "Ports 22, 80, 443 already open";
      console.log(`[Provision] ✓ Firewall: ${msg}`);
      updateStep(jobId, {
        step: 1,
        label: "Open firewall ports",
        status: "done",
        output: msg,
      });
    } catch (fwErr: any) {
      // Non-fatal — VPS might not be on Hostinger, or API token expired
      console.warn(`[Provision] ⚠ Firewall skipped: ${fwErr.message}`);
      updateStep(jobId, {
        step: 1,
        label: "Open firewall ports",
        status: "done",
        output: "Skipped — not managed or API unavailable",
      });
    }

    const hostname = dns.hostname;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.clawhq.tech";

    // Fetch customer name for Basic Auth username
    const admin = createAdminClient();
    const { data: customerUser } = await admin
      .from("users")
      .select("name")
      .eq("id", config.userId)
      .single();

    // Username: first name lowercased, fallback to "admin"
    const rawName = customerUser?.name?.trim() || "";
    const dashboardUsername = rawName.split(/\s+/)[0]?.toLowerCase() || "admin";
    // Password: random 16-char alphanumeric
    const dashboardPassword = randomBytes(12).toString("base64url").slice(0, 16);

    // Run SSH provisioning
    const result = await provisionVPS(
      {
        ip: config.ip,
        sshUser: config.sshUser,
        sshPassword: config.sshPassword,
        sshPort: config.sshPort,
        hostname,
        email: config.email,
        appUrl,
        dashboardUsername,
        dashboardPassword,
      },
      (step) => {
        updateStep(jobId, step);
      }
    );

    if (result.success) {
      // Save to DB
      console.log(`[Provision] Saving to database...`);
      const dashboardUrl = `https://${hostname}`;

      const dbRecord: Record<string, unknown> = {
        ip_address: config.ip,
        ssh_user: config.sshUser,
        ssh_password: config.sshPassword,
        ssh_port: config.sshPort,
        hostname,
        openclaw_dashboard_url: dashboardUrl,
        openclaw_auth_token: null,
        status: "running",
        dashboard_username: dashboardUsername,
        dashboard_password: dashboardPassword,
      };
      if (hostingerVmId) {
        dbRecord.hostinger_vm_id = hostingerVmId;
      }

      const { data: existing } = await admin
        .from("vps_instances")
        .select("id")
        .eq("user_id", config.userId)
        .single();

      if (existing) {
        await admin
          .from("vps_instances")
          .update(dbRecord)
          .eq("user_id", config.userId);
      } else {
        await admin.from("vps_instances").insert({
          user_id: config.userId,
          ...dbRecord,
        });
      }

      console.log(`[Provision] ✓ DB saved. Dashboard: ${dashboardUrl}`);
      completeJob(jobId, {
        success: true,
        dashboardUrl,
      });
    } else {
      console.error(`[Provision] ✗ Provisioning failed: ${result.error}`);
      completeJob(jobId, { success: false, error: result.error });
    }
  } catch (err: any) {
    console.error(`[Provision] ✗ Unexpected error: ${err.message}`);
    completeJob(jobId, {
      success: false,
      error: err.message || "Provisioning failed",
    });
  }
}
