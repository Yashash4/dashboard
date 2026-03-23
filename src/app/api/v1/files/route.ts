import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

const ALLOWED_TYPES = [
  "application/pdf", "text/plain", "text/markdown", "text/csv",
  "application/json", "image/png", "image/jpeg", "image/gif", "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STALE_PROCESSING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

async function markStaleProcessingFiles(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_THRESHOLD_MS).toISOString();
  await admin.from("kb_documents")
    .update({ status: "failed" })
    .eq("user_id", userId)
    .eq("status", "processing")
    .lt("created_at", cutoff);
}

// Magic bytes for file signature validation
const MAGIC_BYTES: Record<string, { signatures: Array<{ bytes: number[]; offset?: number }>; mime: string }> = {
  "application/pdf": { signatures: [{ bytes: [0x25, 0x50, 0x44, 0x46] }], mime: "application/pdf" },
  "image/png": { signatures: [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }], mime: "image/png" },
  "image/jpeg": { signatures: [{ bytes: [0xFF, 0xD8, 0xFF] }], mime: "image/jpeg" },
  "image/gif": { signatures: [{ bytes: [0x47, 0x49, 0x46, 0x38] }], mime: "image/gif" },
  "image/webp": { signatures: [{ bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }], mime: "image/webp" },
  "text/plain": { signatures: [], mime: "text/plain" },
  "text/markdown": { signatures: [], mime: "text/markdown" },
  "text/csv": { signatures: [], mime: "text/csv" },
  "application/json": { signatures: [], mime: "application/json" },
};

function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const magic = MAGIC_BYTES[declaredMime];
  if (!magic) return false;
  if (magic.signatures.length === 0) return true; // text types have no magic bytes
  return magic.signatures.some(({ bytes, offset = 0 }) => {
    return bytes.every((b, i) => buffer[offset + i] === b);
  });
}

/** GET /api/v1/files — List uploaded files (offset-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "files", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    // Mark stale processing files as failed
    await markStaleProcessingFiles(admin, apiKey.user_id);

    const url = new URL(request.url);
    const rawLimit = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
    const rawOffset = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    let query = admin.from("kb_documents")
      .select("id, name, type, file_size, status, created_at", { count: "exact" })
      .eq("user_id", apiKey.user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: files, error, count } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch files", ctx);
    }

    const results = files || [];
    const total = count ?? 0;
    const hasMore = offset + results.length < total;

    return apiSuccess({
      files: results.map((f) => ({
        file_id: f.id,
        filename: f.name,
        size: f.file_size,
        mime_type: f.type,
        status: f.status === "indexed" ? "processed" : f.status,
        created_at: f.created_at,
      })),
      has_more: hasMore,
      total,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

/** POST /api/v1/files — Upload a file */
export async function POST(request: NextRequest) {
  const auth = await validateV1Auth(request, "file_upload", { limit: 10 });
  if (auth instanceof NextResponse) return auth;
  const { apiKey, admin, ctx, rateLimitInfo } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as string) || "knowledge_base";

    if (!file) return apiError("missing_parameter", "file is required", ctx, { param: "file" });
    if (file.size > MAX_FILE_SIZE) return apiError("file_too_large", "File must be under 10MB", ctx);

    const mimeType = file.type;
    if (!ALLOWED_TYPES.includes(mimeType))
      return apiError("unsupported_file_type", `Unsupported file type: ${mimeType}`, ctx);

    const fileId = `file_${crypto.randomUUID().replace(/-/g, "")}`;

    // Read file content for storage and magic byte validation
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Magic byte validation to prevent mime-type spoofing
    if (!validateMagicBytes(fileBuffer, mimeType)) {
      return apiError("unsupported_file_type", `File content does not match declared MIME type ${mimeType}`, ctx);
    }

    const storagePath = `${apiKey.user_id}/${fileId}/${file.name}`;

    const { error: uploadError } = await admin.storage
      .from("kb-files")
      .upload(storagePath, fileBuffer, { contentType: file.type });

    if (uploadError) {
      console.error("[v1/files] Storage upload failed:", uploadError.message);
      return apiError("internal_error", "Failed to upload file to storage", ctx);
    }

    // For KB files, create a document record and trigger indexing
    if (purpose === "knowledge_base") {
      const fileType = file.name.split(".").pop()?.toLowerCase() || "txt";

      // Extract text content for indexing
      let textContent = "";
      if (["text/plain", "text/markdown", "text/csv", "application/json"].includes(file.type)) {
        textContent = new TextDecoder().decode(fileBuffer);
      }

      // Determine initial status: PDFs and binary types without text extraction get "error"
      const hasTextContent = !!textContent;
      const initialStatus = hasTextContent ? "processing" : "error";
      const statusMessage = hasTextContent ? null : "Text extraction not available for this file type. Only plain text, markdown, CSV, and JSON files are supported for knowledge base indexing.";

      const { error } = await admin.from("kb_documents").insert({
        id: fileId,
        user_id: apiKey.user_id,
        name: file.name,
        type: fileType,
        file_size: file.size,
        status: initialStatus,
        storage_path: storagePath,
        ...(statusMessage ? { error_message: statusMessage } : {}),
      });

      if (error) return apiError("internal_error", "Failed to save file record", ctx);

      // Index text files immediately with proper error handling
      if (hasTextContent) {
        const { indexDocument } = await import("@/lib/knowledge-base");
        indexDocument(fileId, apiKey.user_id, textContent, fileType || "txt").catch(async (indexErr) => {
          console.error(`[v1/files] indexDocument failed for ${fileId}:`, indexErr?.message);
          await admin.from("kb_documents")
            .update({ status: "failed", error_message: "Indexing failed" })
            .eq("id", fileId)
            .then(() => {}, () => {});
        });
      }
    }

    // Determine final status to report — if we're in KB mode with no text, status is already "error"
    const reportStatus = purpose === "knowledge_base" && !["text/plain", "text/markdown", "text/csv", "application/json"].includes(mimeType)
      ? "error"
      : "processing";

    return apiSuccess({
      file_id: fileId,
      filename: file.name,
      size: file.size,
      mime_type: mimeType,
      purpose,
      status: reportStatus,
      created_at: new Date().toISOString(),
    }, ctx, rateLimitInfo);
  } catch {
    return apiError("invalid_request", "Invalid multipart form data", ctx);
  }
}
