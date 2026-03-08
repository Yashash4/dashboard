import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";
import { indexDocument } from "@/lib/knowledge-base";

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

  const rl = rateLimit(`${user.id}:kb_upload`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();
  const validTypes = ["pdf", "txt", "md", "csv"];
  if (!ext || !validTypes.includes(ext)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PDF, TXT, MD, or CSV." },
      { status: 400 }
    );
  }

  // Check file size (10 MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum 10 MB." },
      { status: 400 }
    );
  }

  // Check storage limit (100 MB total)
  const { data: existingDocs } = await admin
    .from("kb_documents")
    .select("file_size")
    .eq("user_id", user.id);
  const currentUsage = (existingDocs || []).reduce(
    (sum, d) => sum + (d.file_size || 0),
    0
  );
  if (currentUsage + file.size > 100 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Storage limit reached (100 MB). Delete some documents first." },
      { status: 400 }
    );
  }

  try {
    // Create document record
    const { data: doc, error: docError } = await admin
      .from("kb_documents")
      .insert({
        user_id: user.id,
        name: fileName,
        type: ext,
        file_size: file.size,
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

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${user.id}/${doc.id}/${fileName}`;

    const { error: uploadError } = await admin.storage
      .from("knowledge-base")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      // Cleanup document record
      await admin.from("kb_documents").delete().eq("id", doc.id);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Update storage path
    await admin
      .from("kb_documents")
      .update({ storage_path: storagePath })
      .eq("id", doc.id);

    // Extract text and index
    let textContent = "";

    if (ext === "pdf") {
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      textContent = parsed.text;
    } else {
      textContent = buffer.toString("utf-8");
    }

    if (!textContent.trim()) {
      await admin
        .from("kb_documents")
        .update({
          status: "error",
          error_message: "No text content found in file",
        })
        .eq("id", doc.id);
      return NextResponse.json(
        { error: "No text content found in file" },
        { status: 422 }
      );
    }

    const { chunkCount } = await indexDocument(
      doc.id,
      user.id,
      textContent,
      ext === "csv"
    );

    // Fetch complete document
    const { data: fullDoc } = await admin
      .from("kb_documents")
      .select("*")
      .eq("id", doc.id)
      .single();

    return NextResponse.json({ document: fullDoc, chunkCount });
  } catch (err) {
    console.error("[kb/upload] Error:", err);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
