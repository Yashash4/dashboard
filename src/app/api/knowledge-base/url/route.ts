import dns from "dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { indexDocument, stripHTML, isPrivateUrl } from "@/lib/knowledge-base";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";

// ST_HIGH_11: Check if resolved IP is private (prevents DNS rebinding SSRF)
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (/^127\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (ip === "0.0.0.0" || ip === "::1" || ip === "::") return true;
  // Link-local
  if (/^169\.254\./.test(ip)) return true;
  // IPv6 private
  if (/^f[cd]/.test(ip)) return true;
  if (/^fe80:/.test(ip)) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const rl = rateLimit(`${user.id}:kb_url`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { url } = body as { url?: string };

  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { error: "Valid URL is required" },
      { status: 400 }
    );
  }

  if (isPrivateUrl(url)) {
    return NextResponse.json(
      { error: "URL must point to a public website" },
      { status: 400 }
    );
  }

  try {
    // ST_HIGH_11: Resolve hostname and check IP AFTER DNS resolution to prevent DNS rebinding
    const parsedUrl = new URL(url);
    try {
      const { address } = await dns.lookup(parsedUrl.hostname);
      if (isPrivateIP(address)) {
        return NextResponse.json(
          { error: "URL resolves to a private/internal IP address" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to resolve URL hostname" },
        { status: 400 }
      );
    }

    // Fetch URL content
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ClawHQ-KB-Crawler/1.0",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const textContent = stripHTML(html);

    if (!textContent || textContent.length < 20) {
      return NextResponse.json(
        { error: "No useful text content found at URL" },
        { status: 400 }
      );
    }

    // Check storage limit (100 MB total) — must match upload/route.ts and knowledge-base-manager.tsx
    const contentSize = Buffer.byteLength(textContent, "utf-8");

    const { data: existingDocs } = await admin
      .from("kb_documents")
      .select("file_size")
      .eq("user_id", user.id);
    const currentUsage = (existingDocs || []).reduce(
      (sum: number, d: { file_size: number }) => sum + (d.file_size || 0),
      0
    );
    if (currentUsage + contentSize > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Storage limit reached (100 MB). Delete some documents first." },
        { status: 400 }
      );
    }

    // Create document record
    const { data: doc, error: docError } = await admin
      .from("kb_documents")
      .insert({
        user_id: user.id,
        name: new URL(url).hostname + new URL(url).pathname,
        type: "url",
        source_url: url,
        file_size: contentSize,
        status: "processing",
      })
      .select("id")
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }

    const { chunkCount } = await indexDocument(
      doc.id,
      user.id,
      textContent,
      "html"
    );

    const { data: fullDoc } = await admin
      .from("kb_documents")
      .select("*")
      .eq("id", doc.id)
      .single();

    logAudit({
      userId: user.id,
      action: "kb_url_added",
      entityType: "kb_document",
      entityId: doc.id,
      category: "knowledge_base",
      details: { url, chunkCount },
      ip: getClientIp(request),
    });

    dispatchWebhooks(user.id, "kb.document.indexed", {
      document_name: new URL(url).hostname + new URL(url).pathname,
      chunk_count: chunkCount,
      file_size: contentSize,
    }).catch(() => {});

    return NextResponse.json({ document: fullDoc, chunkCount });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "URL took too long to respond" },
        { status: 400 }
      );
    }
    console.warn("[kb/url] Error processing URL:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
