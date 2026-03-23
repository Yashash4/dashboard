import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-errors";
import { validateV1Auth } from "@/lib/v1-auth";

/** GET /api/v1/files/:id — Get file details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "files_detail", { limit: 60 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    const { data: file } = await admin.from("kb_documents")
      .select("id, name, type, file_size, status, chunk_count, created_at")
      .eq("id", id).eq("user_id", apiKey.user_id).single();

    if (!file) return apiError("not_found", "File not found", ctx);

    return apiSuccess({
      file_id: file.id,
      filename: file.name,
      mime_type: file.type,
      size: file.file_size,
      status: file.status === "indexed" ? "processed" : file.status,
      chunks: file.chunk_count,
      created_at: file.created_at,
    }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}

/** DELETE /api/v1/files/:id — Delete a file */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await validateV1Auth(request, "files_delete", { limit: 20 });
    if (auth instanceof NextResponse) return auth;
    const { apiKey, admin, ctx, rateLimitInfo } = auth;

    // Delete in a single query to avoid TOCTOU race
    const { data: deleted } = await admin.from("kb_documents")
      .delete().eq("id", id).eq("user_id", apiKey.user_id).select("id, storage_path").single();

    if (!deleted) return apiError("not_found", "File not found", ctx);

    // Clean up storage after successful DB deletion (best-effort)
    if (deleted.storage_path) {
      admin.storage.from("kb-files").remove([deleted.storage_path]).then(() => {}, () => {});
    }

    return apiSuccess({ deleted: true }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
