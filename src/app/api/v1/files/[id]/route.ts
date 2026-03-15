import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";

/** GET /api/v1/files/:id — Get file details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return apiError("invalid_api_key", "Invalid API key", ctx);
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

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
  }, ctx);
}

/** DELETE /api/v1/files/:id — Delete a file */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request);

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return apiError("invalid_api_key", "Invalid API key", ctx);
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  const { data: deleted } = await admin.from("kb_documents")
    .delete().eq("id", id).eq("user_id", apiKey.user_id).select("id").single();

  if (!deleted) return apiError("invalid_request", "File not found", ctx);

  return apiSuccess({ deleted: true }, ctx);
}
