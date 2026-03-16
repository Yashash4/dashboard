import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

const ALLOWED_TYPES = [
  "application/pdf", "text/plain", "text/markdown", "text/csv",
  "application/json", "image/png", "image/jpeg", "image/gif", "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** GET /api/v1/files — List uploaded files (cursor-based pagination) */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateV1Auth(request, "files", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx } = auth;

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));
    const cursor = url.searchParams.get("cursor"); // ISO timestamp cursor

    let query = admin.from("kb_documents")
      .select("id, name, type, file_size, status, created_at")
      .eq("user_id", apiKey.user_id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: files, error } = await query;

    if (error) {
      return apiError("internal_error", "Failed to fetch files", ctx);
    }

    const results = files || [];
    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? page[page.length - 1]?.created_at : null;

    return apiSuccess({
      files: page.map((f) => ({
        file_id: f.id,
        filename: f.name,
        size: f.file_size,
        type: f.type,
        status: f.status === "indexed" ? "processed" : f.status,
        created_at: f.created_at,
      })),
      has_more: hasMore,
      next_cursor: nextCursor,
    }, ctx);
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
  const { apiKey, admin, ctx } = auth;

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

    // Store file content in Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const storagePath = `${apiKey.user_id}/${fileId}/${file.name}`;

    const { error: uploadError } = await admin.storage
      .from("kb-files")
      .upload(storagePath, fileBuffer, { contentType: file.type });

    if (uploadError) {
      // Storage bucket may not exist — try without storage, just store text content
      console.warn("[v1/files] Storage upload failed:", uploadError.message);
    }

    // For KB files, create a document record and trigger indexing
    if (purpose === "knowledge_base") {
      const fileType = file.name.split(".").pop()?.toLowerCase() || "txt";

      // Extract text content for indexing
      let textContent = "";
      if (["text/plain", "text/markdown", "text/csv", "application/json"].includes(file.type)) {
        textContent = new TextDecoder().decode(fileBuffer);
      }

      const { error } = await admin.from("kb_documents").insert({
        id: fileId,
        user_id: apiKey.user_id,
        name: file.name,
        type: fileType,
        file_size: file.size,
        status: textContent ? "processing" : "processing",
        storage_path: storagePath,
      });

      if (error) return apiError("internal_error", "Failed to save file record", ctx);

      // Index text files immediately
      if (textContent) {
        const { indexDocument } = await import("@/lib/knowledge-base");
        indexDocument(fileId, apiKey.user_id, textContent, fileType || "txt").catch(() => {});
      }
    }

    return apiSuccess({
      file_id: fileId,
      filename: file.name,
      size: file.size,
      mime_type: mimeType,
      purpose,
      status: "processing",
      created_at: new Date().toISOString(),
    }, ctx);
  } catch {
    return apiError("invalid_request", "Invalid multipart form data", ctx);
  }
}
