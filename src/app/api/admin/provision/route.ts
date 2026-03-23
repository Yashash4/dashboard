// Force module re-evaluation — v3
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { provisionVPS } from "@/lib/provision-v3";
import { createSubdomain, ensureSslFull, ensureAlwaysHttps } from "@/lib/cloudflare";
import { ensureFirewallPorts } from "@/lib/hostinger";
import {
  createJob,
  getJob,
  getActiveJob,
  updateStep,
  completeJob,
} from "@/lib/provision-store";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { encryptField } from "@/lib/credential-utils";

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

  const ip_addr = getClientIp(request);

  // Run provisioning in background (not awaited)
  runProvisioning(jobId, {
    userId,
    ip,
    sshUser,
    sshPassword,
    sshPort: sshPort || 22,
    subdomain,
    email,
    adminId: user.id,
    requestIp: ip_addr,
  });

  logAudit({ adminId: user.id, action: "vps_provisioning_started", entityType: "vps", entityId: userId, details: { subdomain, ip, jobId }, ip: ip_addr });

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

  // 2.22: Admin role check — was missing, any authenticated user could poll provision status
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    adminId: string;
    requestIp: string;
  }
) {
  try {
    // Step 0: DNS
    updateStep(jobId, {
      step: 0,
      label: "Create DNS record",
      status: "running",
    });

    const dns = await createSubdomain(config.subdomain, config.ip);
    if (!dns.success) {
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

    updateStep(jobId, {
      step: 0,
      label: "Create DNS record",
      status: "done",
      output: dns.hostname,
    });

    // Ensure SSL/TLS mode is "Full" + always redirect HTTP→HTTPS (zone-level, idempotent)
    const ssl = await ensureSslFull();
    if (!ssl.success) {
      console.warn("[provision] SSL mode setup failed: " + (ssl.error || "unknown"));
    }
    const https = await ensureAlwaysHttps();
    if (!https.success) {
      console.warn("[provision] Always HTTPS setup failed: " + (https.error || "unknown"));
    }

    // Step 1: Open firewall ports (provider-level)
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
      updateStep(jobId, {
        step: 1,
        label: "Open firewall ports",
        status: "done",
        output: msg,
      });
    } catch (fwErr: any) {
      // Non-fatal — VPS might not be on Hostinger, or API token expired
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
      const dashboardUrl = `https://${hostname}`;

      const dbRecord: Record<string, unknown> = {
        ip_address: config.ip,
        ssh_user: config.sshUser,
        ssh_password: encryptField(config.sshPassword),
        ssh_port: config.sshPort,
        hostname,
        openclaw_dashboard_url: dashboardUrl,
        openclaw_auth_token: null,
        gateway_token: null,
        data_api_token: result.dataApiToken ? encryptField(result.dataApiToken) : null,
        status: "running",
        dashboard_username: dashboardUsername,
        dashboard_password: encryptField(dashboardPassword),
      };
      if (hostingerVmId) {
        dbRecord.hostinger_vm_id = hostingerVmId;
      }

      const { data: existing } = await admin
        .from("vps_instances")
        .select("id")
        .eq("user_id", config.userId)
        .single();

      let dbError: string | null = null;
      if (existing) {
        const { error } = await admin
          .from("vps_instances")
          .update(dbRecord)
          .eq("user_id", config.userId);
        if (error) dbError = error.message;
      } else {
        const { error } = await admin.from("vps_instances").insert({
          user_id: config.userId,
          ...dbRecord,
        });
        if (error) dbError = error.message;
      }

      if (dbError) {
        completeJob(jobId, {
          success: false,
          error: `Provisioning succeeded but DB save failed: ${dbError}`,
        });
        logAudit({ adminId: config.adminId, action: "vps_provisioning_db_save_failed", entityType: "vps", entityId: config.userId, details: { subdomain: config.subdomain, ip: config.ip, jobId, dbError }, ip: config.requestIp });
        return;
      }

      completeJob(jobId, {
        success: true,
        dashboardUrl,
      });

      // ADMIN_HIGH_07: Log completion separately so audit trail reflects actual outcome
      logAudit({ adminId: config.adminId, action: "vps_provisioning_completed", entityType: "vps", entityId: config.userId, details: { subdomain: config.subdomain, ip: config.ip, jobId, dashboardUrl }, ip: config.requestIp });
    } else {
      completeJob(jobId, { success: false, error: result.error });
      logAudit({ adminId: config.adminId, action: "vps_provisioning_failed", entityType: "vps", entityId: config.userId, details: { subdomain: config.subdomain, ip: config.ip, jobId, error: result.error }, ip: config.requestIp });
    }
  } catch (err: any) {
    completeJob(jobId, {
      success: false,
      error: err.message || "Provisioning failed",
    });
    logAudit({ adminId: config.adminId, action: "vps_provisioning_failed", entityType: "vps", entityId: config.userId, details: { subdomain: config.subdomain, ip: config.ip, jobId, error: err.message || "Provisioning failed" }, ip: config.requestIp });
  }
}
