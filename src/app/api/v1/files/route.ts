import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createRequestContext, apiError, apiSuccess } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";

function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) return null;
  return rawKey;
}

const ALLOWED_TYPES = [
  "application/pdf", "text/plain", "text/markdown", "text/csv",
  "application/json", "image/png", "image/jpeg", "image/gif", "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** GET /api/v1/files — List uploaded files */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  // List from kb_documents as file proxy
  const { data: files } = await admin.from("kb_documents")
    .select("id, name, type, file_size, status, created_at")
    .eq("user_id", apiKey.user_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return apiSuccess({
    files: (files || []).map((f) => ({
      file_id: f.id,
      filename: f.name,
      size: f.file_size,
      type: f.type,
      status: f.status === "indexed" ? "processed" : f.status,
      created_at: f.created_at,
    })),
  }, ctx);
}

/** POST /api/v1/files — Upload a file */
export async function POST(request: NextRequest) {
  const ctx = createRequestContext(request);
  const rawKey = validateApiKey(request);
  if (!rawKey) return apiError("invalid_api_key", "Invalid API key", ctx);

  const admin = createAdminClient();
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data: apiKey } = await admin.from("api_keys").select("id, user_id, status").eq("key_hash", keyHash).single();
  if (!apiKey || apiKey.status !== "active") return apiError("invalid_api_key", "Invalid API key", ctx);

  const { data: sub } = await admin.from("subscriptions").select("plan").eq("user_id", apiKey.user_id).single();
  if (!["pro", "ultra", "enterprise"].includes((sub?.plan as string) || "starter"))
    return apiError("plan_required", "Pro plan required", ctx);

  const rl = rateLimit(`${apiKey.user_id}:file_upload`, 10, 60_000);
  if (!rl.success) return apiError("rate_limited", "Too many requests", ctx);

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
