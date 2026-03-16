import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import https from "https";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:ssl_check`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("hostname")
    .eq("user_id", user.id)
    .single();

  if (!vps?.hostname) {
    return NextResponse.json({ error: "No VPS found" }, { status: 404 });
  }

  try {
    const certInfo = await checkSSL(vps.hostname);
    return NextResponse.json(certInfo);
  } catch (err: any) {
    return NextResponse.json({
      valid: false,
      error: err.message || "SSL check failed",
    });
  }
}

function checkSSL(
  hostname: string
): Promise<{
  valid: boolean;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        method: "HEAD",
        timeout: 10000,
        rejectUnauthorized: false,
      },
      (res) => {
        const socket = res.socket as any;
        const cert = socket.getPeerCertificate?.();

        if (!cert || !cert.valid_to) {
          resolve({ valid: false, error: "No certificate found" });
          return;
        }

        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysRemaining = Math.floor(
          (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        resolve({
          valid: daysRemaining > 0 && socket.authorized !== false,
          issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown",
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining,
        });
      }
    );

    req.on("error", (err) => {
      resolve({ valid: false, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ valid: false, error: "Connection timed out" });
    });

    req.end();
  });
}
