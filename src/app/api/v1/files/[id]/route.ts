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

    if (!file) return apiError("invalid_request", "File not found", ctx);

    return apiSuccess({
      file_id: file.id,
      filename: file.name,
      type: file.type,
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

    // Get file record to find storage_path for cleanup
    const { data: file } = await admin.from("kb_documents")
      .select("id, storage_path")
      .eq("id", id).eq("user_id", apiKey.user_id).single();

    if (!file) return apiError("invalid_request", "File not found", ctx);

    // Delete from Supabase Storage if storage_path exists
    if (file.storage_path) {
      await admin.storage.from("kb-files").remove([file.storage_path]).then(() => {}, () => {});
    }

    const { data: deleted } = await admin.from("kb_documents")
      .delete().eq("id", id).eq("user_id", apiKey.user_id).select("id").single();

    if (!deleted) return apiError("invalid_request", "File not found", ctx);

    return apiSuccess({ deleted: true }, ctx, rateLimitInfo);
  } catch {
    const { createRequestContext } = await import("@/lib/api-errors");
    const ctx = createRequestContext(request);
    return apiError("internal_error", "Internal server error", ctx);
  }
}
