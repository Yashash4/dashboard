import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { indexDocument, stripHTML, isPrivateUrl } from "@/lib/knowledge-base";
import { logAudit, getClientIp } from "@/lib/audit-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const rl = rateLimit(`${user.id}:kb_reindex`, 5, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Verify ownership
  const { data: doc } = await admin
    .from("kb_documents")
    .select("id, type, storage_path, source_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  // Set processing status
  await admin
    .from("kb_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", id);

  try {
    let textContent = "";

    if (doc.type === "url") {
      // Re-fetch URL
      if (!doc.source_url) {
        throw new Error("Source URL not found");
      }
      if (isPrivateUrl(doc.source_url)) {
        throw new Error("URL must point to a public website");
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(doc.source_url, {
        signal: controller.signal,
        headers: { "User-Agent": "ClawHQ-KB-Crawler/1.0" },
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const html = await response.text();
      textContent = stripHTML(html);
    } else if (doc.storage_path) {
      // Download from storage
      const { data: fileData, error: downloadError } = await admin.storage
        .from("knowledge-base")
        .download(doc.storage_path);

      if (downloadError || !fileData) {
        throw new Error("Failed to download file from storage");
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      if (doc.type === "pdf") {
          const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
        const parsed = await pdfParse(buffer);
        textContent = parsed.text;
      } else {
        textContent = buffer.toString("utf-8");
      }
    } else {
      throw new Error("No source available for re-indexing");
    }

    if (!textContent.trim()) {
      throw new Error("No text content found");
    }

    const { chunkCount } = await indexDocument(
      id,
      user.id,
      textContent,
      doc.type || "txt"
    );

    logAudit({
      userId: user.id,
      action: "kb_document_reindexed",
      entityType: "kb_document",
      entityId: id,
      category: "knowledge_base",
      details: { chunkCount },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, chunkCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Re-index failed";
    await admin
      .from("kb_documents")
      .update({ status: "error", error_message: message })
      .eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
