import { createAdminClient } from "@/lib/supabase-admin";
import { smartChunk } from "@/lib/chunkers";
import { expandQuery } from "@/lib/query-expansion";

const EMBEDDING_BATCH_SIZE = 50;

/* ---------- Types ---------- */

export interface KBSearchResult {
  content: string;
  documentName: string;
  similarity?: number;
  searchType?: "vector" | "fts" | "both";
}

interface ScoredChunk {
  id: string;
  document_id: string;
  content: string;
  score: number;
  rank: number;
  source: "vector" | "fts" | "both";
}

/* ---------- SSRF protection ---------- */

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

  // Exact matches for common loopback/private hostnames
  if (
    [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "[::1]",
      "0177.0.0.1",     // Octal notation for 127.0.0.1
      "0x7f000001",     // Hex notation for 127.0.0.1
    ].includes(h)
  )
    return true;

  // Block decimal IP notation (e.g. 2130706433 = 127.0.0.1)
  if (/^\d+$/.test(h)) {
    const decimal = parseInt(h, 10);
    if (!isNaN(decimal) && decimal >= 0 && decimal <= 0xffffffff) return true;
  }

  // Block IPv6 loopback and link-local addresses
  // Strip brackets for IPv6 comparison
  const bare = h.replace(/^\[/, "").replace(/]$/, "");
  if (
    bare === "::1" ||
    bare === "0:0:0:0:0:0:0:1" ||
    bare.startsWith("fe80:") ||   // Link-local
    bare.startsWith("fe80%") ||   // Link-local with zone ID
    bare.startsWith("fc00:") ||   // Unique local (private)
    bare.startsWith("fd") ||      // Unique local (private)
    bare === "::" ||              // Unspecified address (binds all)
    bare === "0:0:0:0:0:0:0:0"
  )
    return true;

  // Block private/reserved TLDs
  if (
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".localhost")
  )
    return true;

  // Octal notation detection: e.g. 0177.0.0.1 = 127.0.0.1
  const parts = h.split(".");
  if (parts.length === 4) {
    // Try to parse each octet (supporting octal like 0177 and hex like 0x7f)
    const octets = parts.map((p) => {
      if (/^0x[0-9a-f]+$/i.test(p)) return parseInt(p, 16);
      if (/^0\d+$/.test(p)) return parseInt(p, 8);
      if (/^\d+$/.test(p)) return parseInt(p, 10);
      return NaN;
    });

    if (octets.every((o) => !isNaN(o) && o >= 0 && o <= 255)) {
      const [a, b] = octets;
      if (a === 127) return true;               // Loopback
      if (a === 10) return true;                 // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true;   // 192.168.0.0/16
      if (a === 169 && b === 254) return true;   // Link-local
      if (a === 0) return true;                  // 0.0.0.0/8
    }
  }

  return false;
}

/* ---------- Legacy chunking (kept for backward compat) ---------- */

const MAX_CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

/**
 * @deprecated Use smartChunk() from @/lib/chunkers instead.
 */
export function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
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

function splitLongText(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > MAX_CHUNK_SIZE) {
      if (current) {
        chunks.push(current.trim());
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
 * @deprecated Use smartChunk("csv") from @/lib/chunkers instead.
 */
export function chunkCSV(csvText: string): string[] {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [csvText];

  const header = lines[0];
  const chunks: string[] = [];
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

/* ---------- HTML stripping ---------- */

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

/* ---------- Embedding service ---------- */

/**
 * Call the VPS-side embedding service to get vectors for text chunks.
 * Service runs on port 5555 on the VPS.
 */
export async function getEmbeddings(
  vpsIp: string,
  texts: string[]
): Promise<number[][] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`http://${vpsIp}:5555/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data.vectors || null;
  } catch {
    return null;
  }
}

/**
 * Get VPS info for a user to call embedding service.
 */
async function getUserVpsIp(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address, status")
    .eq("user_id", userId)
    .single();

  if (!vps || vps.status !== "running") return null;
  return vps.ip_address;
}

/**
 * Generate embeddings for chunks in batches and store them.
 */
async function embedChunks(
  documentId: string,
  userId: string,
  chunks: string[]
): Promise<boolean> {
  const vpsIp = await getUserVpsIp(userId);
  if (!vpsIp) return false;

  const admin = createAdminClient();

  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const vectors = await getEmbeddings(vpsIp, batch);
    if (!vectors || vectors.length !== batch.length) return false;

    const { data: chunkRows } = await admin
      .from("kb_chunks")
      .select("id")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .gte("chunk_index", i)
      .lt("chunk_index", i + EMBEDDING_BATCH_SIZE)
      .order("chunk_index", { ascending: true });

    if (!chunkRows || chunkRows.length !== batch.length) return false;

    for (let j = 0; j < chunkRows.length; j++) {
      const embedding = `[${vectors[j].join(",")}]`;
      await admin
        .from("kb_chunks")
        .update({ embedding })
        .eq("id", chunkRows[j].id);
    }
  }

  return true;
}

/* ---------- Indexing ---------- */

/**
 * Process and index a document's text content into chunks.
 * @param fileType - file extension string (e.g. "pdf", "md", "csv", "txt", "html")
 */
export async function indexDocument(
  documentId: string,
  userId: string,
  content: string,
  fileType: string = "txt"
): Promise<{ chunkCount: number }> {
  const admin = createAdminClient();

  // Delete existing chunks for re-indexing
  await admin.from("kb_chunks").delete().eq("document_id", documentId);

  // Use new smart chunker
  const smartChunks = smartChunk(content, fileType);

  if (smartChunks.length === 0) {
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

  // Insert chunks with metadata
  const chunkRows = smartChunks.map((chunk, index) => ({
    document_id: documentId,
    user_id: userId,
    content: chunk.content,
    chunk_index: index,
    metadata: chunk.metadata,
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

  // Try to generate embeddings (non-blocking — falls back to FTS if VPS unavailable)
  const chunkTexts = smartChunks.map((c) => c.content);
  const embeddingSuccess = await embedChunks(documentId, userId, chunkTexts);

  // Update document status
  await admin
    .from("kb_documents")
    .update({
      status: embeddingSuccess ? "indexed" : "pending_embedding",
      chunk_count: smartChunks.length,
      error_message: embeddingSuccess
        ? null
        : "Embeddings pending — start VPS to complete indexing",
      indexed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  return { chunkCount: smartChunks.length };
}

/* ---------- Hybrid Search ---------- */

/**
 * Search KB chunks using hybrid search (vector + FTS in parallel) with RRF merge.
 */
export async function searchKBChunks(
  userId: string,
  query: string,
  limit: number = 5
): Promise<KBSearchResult[]> {
  const admin = createAdminClient();

  if (!query.trim()) return [];

  const vpsIp = await getUserVpsIp(userId);

  // Expand query with synonyms for FTS
  const expandedQuery = expandQuery(query.trim());

  // Run BOTH searches in parallel
  const [vectorResults, ftsResults] = await Promise.all([
    vectorSearch(admin, userId, query, vpsIp, limit * 2),
    ftsSearch(admin, userId, expandedQuery, limit * 2),
  ]);

  // Merge using Reciprocal Rank Fusion
  let merged = reciprocalRankFusion(vectorResults, ftsResults, limit * 2);

  // Rerank top results if VPS is available and we have more than `limit`
  if (vpsIp && merged.length > limit) {
    merged = await rerankResults(vpsIp, query, merged, limit);
  } else {
    merged = merged.slice(0, limit);
  }

  if (merged.length === 0) return [];

  // Get document names for all results
  const docIds = [...new Set(merged.map((c) => c.document_id))];
  const { data: docs } = await admin
    .from("kb_documents")
    .select("id, name")
    .in("id", docIds)
    .eq("user_id", userId);
  const docMap = new Map(docs?.map((d) => [d.id, d.name]) || []);

  // Track usage — increment retrieval_count for each referenced document
  for (const docId of docIds) {
    admin
      .rpc("increment_kb_retrieval_count", { p_document_id: docId })
      .then(
        () => {},
        () => {}
      );
  }

  return merged.map((c) => ({
    content: c.content,
    documentName: docMap.get(c.document_id) || "Unknown",
    similarity: c.score,
    searchType: c.source,
  }));
}

/* ---------- Vector search helper ---------- */

async function vectorSearch(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  query: string,
  vpsIp: string | null,
  limit: number
): Promise<ScoredChunk[]> {
  if (!vpsIp) return [];

  try {
    const vectors = await getEmbeddings(vpsIp, [query.trim()]);
    if (!vectors || vectors.length === 0) return [];

    const queryEmbedding = `[${vectors[0].join(",")}]`;
    const { data } = await admin.rpc("search_kb_chunks_vector", {
      p_user_id: userId,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.2, // Lower threshold for hybrid — RRF handles relevance
      p_limit: limit,
    });

    return (data || []).map((c: any, rank: number) => ({
      id: c.chunk_id || c.id,
      document_id: c.chunk_document_id,
      content: c.chunk_content,
      score: c.similarity,
      rank,
      source: "vector" as const,
    }));
  } catch {
    return [];
  }
}

/* ---------- FTS search helper ---------- */

async function ftsSearch(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  query: string,
  limit: number
): Promise<ScoredChunk[]> {
  try {
    const { data } = await admin.rpc("search_kb_chunks_fts", {
      p_user_id: userId,
      p_query: query.trim(),
      p_limit: limit,
    });

    return (data || []).map((c: any, rank: number) => ({
      id: c.chunk_id || c.id,
      document_id: c.chunk_document_id,
      content: c.chunk_content,
      score: c.rank || 0,
      rank,
      source: "fts" as const,
    }));
  } catch {
    return [];
  }
}

/* ---------- Reciprocal Rank Fusion ---------- */

/**
 * Combine results from vector + FTS using RRF.
 * Standard algorithm used by Elasticsearch, Pinecone, Weaviate.
 * k=60 is the industry-standard constant.
 */
function reciprocalRankFusion(
  vectorResults: ScoredChunk[],
  ftsResults: ScoredChunk[],
  limit: number,
  k: number = 60
): (ScoredChunk & { source: "vector" | "fts" | "both" })[] {
  const scoreMap = new Map<
    string,
    { chunk: ScoredChunk; rrfScore: number; sources: Set<string> }
  >();

  // Score vector results
  for (let i = 0; i < vectorResults.length; i++) {
    const chunk = vectorResults[i];
    const rrfScore = 1 / (k + i + 1);
    const existing = scoreMap.get(chunk.id);
    if (existing) {
      existing.rrfScore += rrfScore;
      existing.sources.add("vector");
    } else {
      scoreMap.set(chunk.id, {
        chunk,
        rrfScore,
        sources: new Set(["vector"]),
      });
    }
  }

  // Score FTS results
  for (let i = 0; i < ftsResults.length; i++) {
    const chunk = ftsResults[i];
    const rrfScore = 1 / (k + i + 1);
    const existing = scoreMap.get(chunk.id);
    if (existing) {
      existing.rrfScore += rrfScore;
      existing.sources.add("fts");
    } else {
      scoreMap.set(chunk.id, {
        chunk,
        rrfScore,
        sources: new Set(["fts"]),
      });
    }
  }

  // Sort by combined RRF score, return top N
  return [...scoreMap.values()]
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, limit)
    .map((entry) => ({
      ...entry.chunk,
      score: entry.rrfScore,
      source:
        entry.sources.size > 1
          ? ("both" as const)
          : entry.sources.has("vector")
            ? ("vector" as const)
            : ("fts" as const),
    }));
}

/* ---------- Cross-Encoder Reranking ---------- */

/**
 * Rerank search results using the VPS cross-encoder model.
 * Calls port 5555 /rerank endpoint. Falls back gracefully on error.
 */
async function rerankResults(
  vpsIp: string,
  query: string,
  chunks: (ScoredChunk & { source: "vector" | "fts" | "both" })[],
  topK: number
): Promise<(ScoredChunk & { source: "vector" | "fts" | "both" })[]> {
  if (chunks.length <= topK) return chunks;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`http://${vpsIp}:5555/rerank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        documents: chunks.map((c) => c.content),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return chunks.slice(0, topK);

    const { scores } = await res.json();

    if (!scores || scores.length !== chunks.length) {
      return chunks.slice(0, topK);
    }

    // Attach reranker scores and sort
    const reranked = chunks
      .map((chunk, i) => ({
        ...chunk,
        rerankerScore: scores[i] as number,
      }))
      .sort((a, b) => b.rerankerScore - a.rerankerScore)
      .slice(0, topK);

    return reranked;
  } catch {
    // If reranking fails, return first N without reranking
    return chunks.slice(0, topK);
  }
}
