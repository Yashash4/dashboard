import { createAdminClient } from "@/lib/supabase-admin";

const MAX_CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

/** Block SSRF — prevent fetching private/internal URLs */
export function isPrivateUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return true;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return true;
  const h = parsed.hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(h))
    return true;
  if (
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".localhost")
  )
    return true;
  const parts = h.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  return false;
}

/**
 * Split text into chunks with overlap.
 * Splits on double newlines (paragraphs), then further splits long paragraphs.
 */
export function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    // If a single paragraph is too long, split it further
    if (para.length > MAX_CHUNK_SIZE) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      const subChunks = splitLongText(para);
      chunks.push(...subChunks);
      continue;
    }

    if (current.length + para.length + 2 > MAX_CHUNK_SIZE) {
      chunks.push(current.trim());
      // Keep overlap from end of previous chunk
      const overlap = current.slice(-CHUNK_OVERLAP);
      current = overlap + "\n\n" + para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 10);
}

/**
 * Split a long text block into chunks at sentence boundaries.
 */
function splitLongText(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > MAX_CHUNK_SIZE) {
      if (current) {
        chunks.push(current.trim());
        // Keep overlap from end of previous chunk
        const overlap = current.slice(-CHUNK_OVERLAP);
        current = overlap + " " + sentence;
      } else {
        current = sentence;
      }
    } else {
      current += (current ? " " : "") + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Extract text from CSV content. Each row becomes a chunk with header context.
 */
export function chunkCSV(csvText: string): string[] {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [csvText];

  const header = lines[0];
  const chunks: string[] = [];

  // Group rows into chunks
  let current = `Headers: ${header}\n\n`;
  for (let i = 1; i < lines.length; i++) {
    const row = `Row ${i}: ${lines[i]}`;
    if (current.length + row.length + 1 > MAX_CHUNK_SIZE) {
      chunks.push(current.trim());
      current = `Headers: ${header}\n\n${row}`;
    } else {
      current += "\n" + row;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Strip HTML tags and extract text content from a web page.
 */
export function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Process and index a document's text content into chunks.
 */
export async function indexDocument(
  documentId: string,
  userId: string,
  content: string,
  isCSV: boolean = false
): Promise<{ chunkCount: number }> {
  const admin = createAdminClient();

  // Delete existing chunks for re-indexing
  await admin.from("kb_chunks").delete().eq("document_id", documentId);

  // Chunk the content
  const chunks = isCSV ? chunkCSV(content) : chunkText(content);

  if (chunks.length === 0) {
    await admin
      .from("kb_documents")
      .update({
        status: "error",
        error_message: "No content could be extracted",
        chunk_count: 0,
      })
      .eq("id", documentId);
    return { chunkCount: 0 };
  }

  // Insert chunks in batches of 100
  const chunkRows = chunks.map((text, index) => ({
    document_id: documentId,
    user_id: userId,
    content: text,
    chunk_index: index,
    metadata: {},
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < chunkRows.length; i += BATCH_SIZE) {
    const batch = chunkRows.slice(i, i + BATCH_SIZE);
    const { error: batchError } = await admin.from("kb_chunks").insert(batch);
    if (batchError) {
      await admin
        .from("kb_documents")
        .update({
          status: "error",
          error_message: `Failed to index batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError.message}`,
          chunk_count: 0,
        })
        .eq("id", documentId);
      throw batchError;
    }
  }

  // Update document status
  await admin
    .from("kb_documents")
    .update({
      status: "indexed",
      chunk_count: chunks.length,
      error_message: null,
      indexed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  return { chunkCount: chunks.length };
}

/**
 * Search KB chunks for a user using Postgres full-text search.
 * Uses tsvector + ts_rank for relevance-ranked results.
 */
export async function searchKBChunks(
  userId: string,
  query: string,
  limit: number = 5
): Promise<{ content: string; documentName: string }[]> {
  const admin = createAdminClient();

  if (!query.trim()) return [];

  // Call the FTS RPC function (uses tsvector + GIN index + ts_rank)
  const { data: chunks, error } = await admin.rpc("search_kb_chunks_fts", {
    p_user_id: userId,
    p_query: query.trim(),
    p_limit: limit,
  });

  if (error || !chunks || chunks.length === 0) return [];

  // Get document names (with user_id filter for defense-in-depth)
  const docIds = [...new Set(chunks.map((c: any) => c.chunk_document_id))];
  const { data: docs } = await admin
    .from("kb_documents")
    .select("id, name")
    .in("id", docIds)
    .eq("user_id", userId);

  const docMap = new Map(docs?.map((d) => [d.id, d.name]) || []);

  return chunks.map((c: any) => ({
    content: c.chunk_content,
    documentName: docMap.get(c.chunk_document_id) || "Unknown",
  }));
}
