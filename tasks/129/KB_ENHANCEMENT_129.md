# Knowledge Base / RAG Enhancement — Full Implementation Guide

**Owner:** Plan 129 Agent
**Referenced from:** `TODO_129_PRO.md` Section 8
**Total features:** 16
**Last updated:** 2026-03-15

---

## CONTEXT: Current KB Architecture

**How KB currently works end-to-end:**

```
User uploads PDF → dashboard API receives file
  → extracts text (pdf-parse for PDF, raw for TXT/MD, custom for CSV)
  → chunkText() splits into paragraphs (2000 char max, 200 char overlap)
  → inserts chunks into Supabase kb_chunks table
  → calls VPS embedding service (port 5555) to get vectors
  → stores vectors in kb_chunks.embedding column (pgvector)
  → updates document status to "indexed"

User sends chat message → chat/send/route.ts
  → checks message length ≥ 2 chars
  → calls searchKBChunks(userId, message, 3)
    → embeds the query via VPS port 5555
    → calls Supabase RPC search_kb_chunks_vector (cosine similarity, threshold 0.3)
    → if VPS down: falls back to search_kb_chunks_fts (Postgres full-text search)
    → returns top 3 chunks with document names
  → injects chunks as system message:
    "Use the following knowledge base context to answer. Cite the document name."
  → sends to clawhq-models API via OpenClaw
  → returns response to user
```

**Key files:**
- `src/lib/knowledge-base.ts` — chunkText(), chunkCSV(), stripHTML(), indexDocument(), searchKBChunks(), getEmbeddings(), embedChunks()
- `src/app/api/knowledge-base/upload/route.ts` — file upload
- `src/app/api/knowledge-base/url/route.ts` — URL crawl
- `src/app/api/knowledge-base/search/route.ts` — search endpoint
- `src/app/api/knowledge-base/[id]/route.ts` — delete
- `src/app/api/knowledge-base/[id]/reindex/route.ts` — reindex
- `src/components/dashboard/knowledge-base-manager.tsx` — KB UI

**Key tables (currently in Supabase, will move to VPS):**
- `kb_documents` — id, user_id, name, file_type, file_size, content, status, chunk_count, retrieval_count, error_message, created_at, indexed_at
- `kb_chunks` — id, document_id, user_id, content, chunk_index, embedding (vector(384)), metadata

**VPS services:**
- Port 5555: ClawHQ Embeddings — `POST /embed { texts[] }` → `{ vectors[][] }`, model: all-MiniLM-L6-v2 (384 dims)
- Port 5556: ClawHQ Data API — future home of KB data (being built by 350 agent)

**Data architecture rule:** KB data moves to VPS only. For now, Supabase. When Data API is ready, migrate. Build features against Supabase now, they'll work the same after migration (just change the data source).

---

## 8.1 HYBRID SEARCH (Vector + Keyword Combined)

### What it is
Instead of choosing EITHER vector search (semantic) OR keyword search (exact match), run BOTH simultaneously and merge the results. This catches both semantic matches ("refund" finds "return policy") AND exact matches ("error code 4032" finds the exact string).

### Why current approach fails
- User asks "what is error ERR-4032?" → vector search finds chunks about "errors" in general (semantically similar) but misses the specific error code
- User asks "how do I return a product?" → FTS search finds nothing because the document says "refund policy" not "return"
- Hybrid search catches BOTH cases

### Current code path
```typescript
// src/lib/knowledge-base.ts — searchKBChunks()
// Current: try vector first, fallback to FTS
const vpsIp = await getUserVpsIp(userId);
if (vpsIp) {
  const vectors = await getEmbeddings(vpsIp, [query.trim()]);
  if (vectors) {
    // vector search via Supabase RPC
    const { data: vectorChunks } = await admin.rpc("search_kb_chunks_vector", {...});
    if (vectorChunks?.length > 0) return vectorChunks; // ← returns here, never does FTS
  }
}
// Fallback: FTS only when vector fails
const { data: chunks } = await admin.rpc("search_kb_chunks_fts", {...});
```

### What to change

Replace the sequential try-vector-then-fallback-FTS with parallel-both-then-merge:

```typescript
// NEW: src/lib/knowledge-base.ts — searchKBChunks()

export async function searchKBChunks(
  userId: string,
  query: string,
  limit: number = 5
): Promise<KBSearchResult[]> {
  const admin = createAdminClient();
  if (!query.trim()) return [];

  const vpsIp = await getUserVpsIp(userId);

  // Run BOTH searches in parallel
  const [vectorResults, ftsResults] = await Promise.all([
    // Vector search (returns empty array if VPS is down)
    vectorSearch(admin, userId, query, vpsIp, limit * 2), // fetch more for merging
    // FTS search (always available via Supabase)
    ftsSearch(admin, userId, query, limit * 2),
  ]);

  // Merge using Reciprocal Rank Fusion
  const merged = reciprocalRankFusion(vectorResults, ftsResults, limit);

  // Get document names for all results
  const docIds = [...new Set(merged.map(c => c.document_id))];
  const { data: docs } = await admin
    .from("kb_documents")
    .select("id, name")
    .in("id", docIds)
    .eq("user_id", userId);
  const docMap = new Map(docs?.map(d => [d.id, d.name]) || []);

  // Track usage
  for (const docId of docIds) {
    admin.rpc("increment_kb_retrieval_count", { p_document_id: docId })
      .then(() => {}, () => {});
  }

  return merged.map(c => ({
    content: c.content,
    documentName: docMap.get(c.document_id) || "Unknown",
    similarity: c.score,
    searchType: c.source, // "vector" | "fts" | "both"
  }));
}

// Vector search helper
async function vectorSearch(
  admin: SupabaseClient,
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
      p_match_threshold: 0.2, // Lower threshold for hybrid — RRF will handle relevance
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

// FTS search helper
async function ftsSearch(
  admin: SupabaseClient,
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

// Reciprocal Rank Fusion
// Combines results from multiple search systems
// Standard algorithm used by Elasticsearch, Pinecone, Weaviate
interface ScoredChunk {
  id: string;
  document_id: string;
  content: string;
  score: number;
  rank: number;
  source: "vector" | "fts";
}

function reciprocalRankFusion(
  vectorResults: ScoredChunk[],
  ftsResults: ScoredChunk[],
  limit: number,
  k: number = 60 // RRF constant — 60 is the standard value
): (ScoredChunk & { rrfScore: number; source: "vector" | "fts" | "both" })[] {
  const scoreMap = new Map<string, { chunk: ScoredChunk; rrfScore: number; sources: Set<string> }>();

  // Score vector results
  for (let i = 0; i < vectorResults.length; i++) {
    const chunk = vectorResults[i];
    const rrfScore = 1 / (k + i + 1);
    const existing = scoreMap.get(chunk.id);
    if (existing) {
      existing.rrfScore += rrfScore;
      existing.sources.add("vector");
    } else {
      scoreMap.set(chunk.id, { chunk, rrfScore, sources: new Set(["vector"]) });
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
      scoreMap.set(chunk.id, { chunk, rrfScore, sources: new Set(["fts"]) });
    }
  }

  // Sort by combined RRF score, return top N
  return [...scoreMap.values()]
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, limit)
    .map(entry => ({
      ...entry.chunk,
      rrfScore: entry.rrfScore,
      source: entry.sources.size > 1 ? "both" as const :
              entry.sources.has("vector") ? "vector" as const : "fts" as const,
    }));
}
```

### Types to add

Create or update `src/types/knowledge-base.ts`:
```typescript
export interface KBSearchResult {
  content: string;
  documentName: string;
  similarity?: number;
  searchType?: "vector" | "fts" | "both";
}

export interface ScoredChunk {
  id: string;
  document_id: string;
  content: string;
  score: number;
  rank: number;
  source: "vector" | "fts";
}
```

### Impact on other files
- `src/app/api/chat/send/route.ts` — no change needed, it calls `searchKBChunks()` which now returns hybrid results
- `src/app/api/v1/chat/route.ts` — same, no change
- `src/app/api/knowledge-base/search/route.ts` — no change, calls `searchKBChunks()`
- KB manager "Test Your KB" UI — update to show `searchType` badge per result ("vector match", "keyword match", "both")

### Testing
1. Upload a document about "refund policy and return process"
2. Search: "how do I get my money back?" → vector should match (semantic)
3. Search: "refund" → FTS should match (exact keyword)
4. Search: "refund policy" → both should match, RRF merges and ranks
5. Verify that results from both sources appear, not just one

### Edge cases
- VPS is down: `vectorSearch()` returns `[]`, hybrid degrades to FTS-only (same as current fallback)
- FTS returns nothing (rare query): hybrid degrades to vector-only
- Both return nothing: empty results, no KB context injected
- Same chunk found by both: RRF boosts its score (it's doubly relevant)

---

## 8.2 RERANKING AFTER RETRIEVAL

### What it is
After hybrid search returns ~10 candidate chunks, run a second scoring pass that evaluates how well each chunk ACTUALLY answers the specific query — not just how similar or keyword-matched it is.

### Why first-pass retrieval isn't enough
Vector similarity says "this chunk is about a similar topic." But "similar topic" ≠ "answers the question."

Example:
- Query: "What is the return deadline?"
- Chunk A (similarity 0.85): "Our return policy allows customers to return items. We process returns within 5 business days." ← similar topic but doesn't answer the deadline question
- Chunk B (similarity 0.72): "Items must be returned within 30 days of purchase to receive a full refund." ← lower similarity but ACTUALLY answers the question

A reranker would score Chunk B higher because it directly answers "what is the deadline."

### What to build

**Add a cross-encoder reranking model to the VPS embedding service (port 5555).**

Cross-encoders are different from bi-encoders (embeddings):
- Bi-encoder: encode query and chunk separately, compare vectors → fast but less accurate
- Cross-encoder: encode (query + chunk) TOGETHER → slower but much more accurate for relevance

**Step 1: Update VPS embedding service to add `/rerank` endpoint**

In the VPS embedding service (Node.js on port 5555), add:

```javascript
// In the embedding service server.js on VPS

const { pipeline } = require('@xenova/transformers');

// Load reranker model (downloads once, ~90MB, caches on disk)
let reranker = null;
async function getReranker() {
  if (!reranker) {
    // cross-encoder/ms-marco-MiniLM-L-6-v2 is small and fast
    reranker = await pipeline('text-classification', 'Xenova/ms-marco-MiniLM-L-6-v2');
  }
  return reranker;
}

app.post('/rerank', async (req, res) => {
  try {
    const { query, documents } = req.body;

    if (!query || !documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'query and documents[] required' });
    }

    if (documents.length > 50) {
      return res.status(400).json({ error: 'max 50 documents per request' });
    }

    const model = await getReranker();

    // Score each (query, document) pair
    const scores = [];
    for (const doc of documents) {
      // Cross-encoder input: "query [SEP] document"
      const result = await model(`${query} [SEP] ${doc}`, { topk: null });
      // result is array of { label, score } — we want the "LABEL_1" (relevant) score
      const relevanceScore = result.find(r => r.label === 'LABEL_1')?.score || 0;
      scores.push(relevanceScore);
    }

    res.json({ scores });
  } catch (err) {
    res.status(500).json({ error: 'Reranking failed' });
  }
});
```

**Step 2: Add reranking step to `searchKBChunks()`**

After hybrid search returns candidates, before returning final results:

```typescript
// In src/lib/knowledge-base.ts

async function rerankResults(
  vpsIp: string,
  query: string,
  chunks: ScoredChunk[],
  topK: number
): Promise<ScoredChunk[]> {
  if (chunks.length <= topK) return chunks; // no need to rerank if already within limit

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`http://${vpsIp}:5555/rerank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        documents: chunks.map(c => c.content),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return chunks.slice(0, topK); // fallback: return first N without reranking

    const { scores } = await res.json();

    if (!scores || scores.length !== chunks.length) {
      return chunks.slice(0, topK);
    }

    // Attach reranker scores
    const reranked = chunks.map((chunk, i) => ({
      ...chunk,
      rerankerScore: scores[i],
    }));

    // Sort by reranker score (descending), take top K
    reranked.sort((a, b) => b.rerankerScore - a.rerankerScore);
    return reranked.slice(0, topK);
  } catch {
    // If reranking fails (VPS issue, timeout), return first N without reranking
    return chunks.slice(0, topK);
  }
}
```

**Step 3: Wire into the search pipeline**

In `searchKBChunks()`, after RRF merge, before document name lookup:

```typescript
export async function searchKBChunks(...) {
  // ... hybrid search + RRF merge (returns ~10 candidates)
  let merged = reciprocalRankFusion(vectorResults, ftsResults, limit * 2); // get 2x candidates

  // Rerank to find the best `limit` results
  if (vpsIp && merged.length > limit) {
    merged = await rerankResults(vpsIp, query, merged, limit);
  } else {
    merged = merged.slice(0, limit);
  }

  // ... document name lookup + return
}
```

**Step 4: Add reranker model to VPS provisioning**

In `provision-v3.ts`, in the embedding service setup step, after downloading `all-MiniLM-L6-v2`:
```typescript
// Also download the reranker model (runs once, caches on disk)
// Add to the service startup or a warmup script
await ssh.execCommand(
  `cd /opt/clawhq-embeddings && node -e "
    const { pipeline } = require('@xenova/transformers');
    pipeline('text-classification', 'Xenova/ms-marco-MiniLM-L-6-v2').then(() => console.log('Reranker model downloaded'));
  "`
);
```

### Performance
- Reranker adds ~50-200ms per search (depends on number of chunks)
- Model is ~90MB RAM additional (on top of embedding model's ~100MB)
- Total VPS RAM for search: ~200-300MB — well within 8GB+ VPS capacity
- If reranking times out or fails, search still works (graceful degradation)

### Files to modify
- VPS embedding service `server.js` — add `/rerank` endpoint
- `src/lib/knowledge-base.ts` — add `rerankResults()`, wire into `searchKBChunks()`
- `src/lib/provision-v3.ts` — download reranker model during provisioning

### Testing
1. Upload a document with multiple sections about similar topics
2. Search with a specific question
3. Compare results WITH reranking vs WITHOUT (log both orderings)
4. The reranked results should have the most directly relevant chunk first
5. Test timeout: stop the VPS embedding service → search should still work (FTS fallback)

---

## 8.3 BETTER CHUNKING (Semantic/Recursive)

### What it is
Replace the current fixed-size paragraph chunker with a structure-aware chunker that preserves document organization — headings stay with their content, tables stay intact, code blocks don't get split.

### Current chunker problems

The current `chunkText()` in `knowledge-base.ts`:
```typescript
// Current: split on double newlines, max 2000 chars
const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
```

This fails when:
1. **Heading separated from content:** "## Return Policy\n\nYou can return..." → heading becomes one chunk, content becomes another. The content chunk has no context about what section it's from.
2. **Table broken mid-row:** A markdown table gets split at 2000 chars, potentially mid-row. The second chunk has table data without headers.
3. **Code block split:** A code example gets split, making both halves useless.
4. **Overlap is character-based, not semantic:** The 200-char overlap can start mid-word or mid-sentence.
5. **No metadata:** Chunks don't know which section they came from.

### What to replace it with

**Create `src/lib/chunkers/` directory with specialized chunkers:**

```
src/lib/chunkers/
├── index.ts           ← smartChunk() dispatcher
├── markdown.ts        ← chunkMarkdown() for .md files
├── html.ts            ← chunkHTML() for crawled URLs
├── recursive.ts       ← chunkRecursive() for plain text / PDF
├── csv.ts             ← chunkCSV() (improved version of current)
├── table.ts           ← chunkTable() for extracted tables
└── types.ts           ← shared types
```

**Types (`src/lib/chunkers/types.ts`):**
```typescript
export interface Chunk {
  content: string;
  metadata: {
    heading?: string;          // nearest parent heading text
    section_path?: string;     // "# Guide > ## Installation > ### Requirements"
    page_number?: number;      // for PDFs
    chunk_type: "text" | "table" | "code" | "list" | "header";
    start_char?: number;       // character offset in original document
    end_char?: number;
    language?: string;         // for code blocks
  };
}

export interface ChunkerOptions {
  maxChunkSize?: number;       // in tokens (default 400)
  overlapPercent?: number;     // overlap as % of chunk size (default 15%)
  preserveTables?: boolean;    // keep tables intact (default true)
  preserveCode?: boolean;     // keep code blocks intact (default true)
}

// Rough token estimator (1 token ≈ 4 chars for English)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function tokensToChars(tokens: number): number {
  return tokens * 4;
}
```

**Smart dispatcher (`src/lib/chunkers/index.ts`):**
```typescript
import { Chunk, ChunkerOptions } from './types';
import { chunkMarkdown } from './markdown';
import { chunkHTML } from './html';
import { chunkRecursive } from './recursive';
import { chunkCSV } from './csv';

const DEFAULT_OPTIONS: ChunkerOptions = {
  maxChunkSize: 400,      // 400 tokens ≈ 1600 chars — optimal for RAG per 2026 research
  overlapPercent: 15,      // 15% overlap
  preserveTables: true,
  preserveCode: true,
};

export function smartChunk(
  content: string,
  fileType: string,
  options?: Partial<ChunkerOptions>
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  switch (fileType.toLowerCase()) {
    case 'md':
    case 'markdown':
      return chunkMarkdown(content, opts);

    case 'html':
      return chunkHTML(content, opts);

    case 'csv':
      return chunkCSV(content, opts);

    case 'txt':
    case 'pdf':
    case 'docx':
    case 'pptx':
    default:
      return chunkRecursive(content, opts);
  }
}
```

**Recursive chunker (`src/lib/chunkers/recursive.ts`):**
```typescript
import { Chunk, ChunkerOptions, estimateTokens, tokensToChars } from './types';

// Split on the largest structural boundary first, then progressively smaller
const SPLIT_HIERARCHY = [
  /\n\n\n+/,        // triple+ newline — major sections
  /\n\n/,            // double newline — paragraphs
  /\n/,              // single newline — lines
  /(?<=[.!?])\s+/,  // sentence boundaries
  /\s+/,             // words (last resort)
];

export function chunkRecursive(content: string, opts: ChunkerOptions): Chunk[] {
  const maxChars = tokensToChars(opts.maxChunkSize!);
  const overlapChars = Math.floor(maxChars * (opts.overlapPercent! / 100));

  // First pass: identify structural blocks
  const blocks = identifyBlocks(content, opts);

  // Second pass: merge small blocks, split large blocks
  const chunks: Chunk[] = [];
  let currentContent = "";
  let currentHeading: string | undefined;

  for (const block of blocks) {
    // If block is a table or code and we're preserving them, keep intact
    if (
      (block.type === "table" && opts.preserveTables) ||
      (block.type === "code" && opts.preserveCode)
    ) {
      // Flush current accumulated text
      if (currentContent.trim()) {
        chunks.push({
          content: currentContent.trim(),
          metadata: { heading: currentHeading, chunk_type: "text" },
        });
        currentContent = "";
      }
      // Add the block as its own chunk (even if it exceeds maxChars — tables/code stay intact)
      chunks.push({
        content: block.content,
        metadata: {
          heading: currentHeading,
          chunk_type: block.type as "table" | "code",
          language: block.language,
        },
      });
      continue;
    }

    // If block is a heading, update the current heading context
    if (block.type === "header") {
      currentHeading = block.content.replace(/^#+\s*/, "").trim();
      // Don't create a separate chunk for headings — they'll be part of the next text chunk
      currentContent += (currentContent ? "\n\n" : "") + block.content;
      continue;
    }

    // Regular text block
    const combined = currentContent + (currentContent ? "\n\n" : "") + block.content;

    if (estimateTokens(combined) <= opts.maxChunkSize!) {
      // Fits in current chunk
      currentContent = combined;
    } else {
      // Current chunk is full — save it
      if (currentContent.trim()) {
        chunks.push({
          content: currentContent.trim(),
          metadata: { heading: currentHeading, chunk_type: "text" },
        });
      }

      // Start new chunk with overlap from end of previous
      const overlap = currentContent.slice(-overlapChars);
      currentContent = overlap + (overlap ? "\n\n" : "") + block.content;

      // If the new block alone exceeds max, recursively split it
      if (estimateTokens(currentContent) > opts.maxChunkSize!) {
        const subChunks = splitLargeBlock(currentContent, opts, currentHeading);
        chunks.push(...subChunks.slice(0, -1)); // add all but last
        currentContent = subChunks[subChunks.length - 1]?.content || "";
      }
    }
  }

  // Flush remaining
  if (currentContent.trim()) {
    chunks.push({
      content: currentContent.trim(),
      metadata: { heading: currentHeading, chunk_type: "text" },
    });
  }

  // Filter out tiny chunks (less than 10 chars / 3 tokens)
  return chunks.filter(c => c.content.length > 10);
}

interface Block {
  content: string;
  type: "text" | "header" | "table" | "code" | "list";
  language?: string;
}

function identifyBlocks(content: string, opts: ChunkerOptions): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect markdown headers
    if (/^#{1,6}\s/.test(line)) {
      blocks.push({ content: line, type: "header" });
      i++;
      continue;
    }

    // Detect code blocks (```)
    if (/^```/.test(line)) {
      const language = line.replace(/^```/, "").trim() || undefined;
      const codeLines = [line];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) codeLines.push(lines[i]); // closing ```
      i++;
      blocks.push({ content: codeLines.join("\n"), type: "code", language });
      continue;
    }

    // Detect markdown tables (lines starting with |)
    if (/^\|/.test(line)) {
      const tableLines = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ content: tableLines.join("\n"), type: "table" });
      continue;
    }

    // Detect list items (-, *, 1.)
    if (/^[\s]*[-*]\s|^[\s]*\d+\.\s/.test(line)) {
      const listLines = [line];
      i++;
      while (i < lines.length && (/^[\s]*[-*]\s|^[\s]*\d+\.\s/.test(lines[i]) || /^\s+/.test(lines[i]))) {
        listLines.push(lines[i]);
        i++;
      }
      blocks.push({ content: listLines.join("\n"), type: "list" });
      continue;
    }

    // Regular text — accumulate until empty line
    const textLines = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^#{1,6}\s/.test(lines[i]) && !/^```/.test(lines[i]) && !/^\|/.test(lines[i])) {
      textLines.push(lines[i]);
      i++;
    }

    if (textLines.length > 0) {
      blocks.push({ content: textLines.join("\n"), type: "text" });
    }

    // Skip empty lines
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  return blocks;
}

function splitLargeBlock(content: string, opts: ChunkerOptions, heading?: string): Chunk[] {
  const maxChars = tokensToChars(opts.maxChunkSize!);
  const overlapChars = Math.floor(maxChars * (opts.overlapPercent! / 100));
  const chunks: Chunk[] = [];

  // Try each split level in the hierarchy
  for (const splitter of SPLIT_HIERARCHY) {
    const parts = content.split(splitter).filter(p => p.trim());
    if (parts.length <= 1) continue; // this splitter didn't help

    let current = "";
    for (const part of parts) {
      const combined = current + (current ? " " : "") + part;
      if (estimateTokens(combined) <= opts.maxChunkSize!) {
        current = combined;
      } else {
        if (current.trim()) {
          chunks.push({ content: current.trim(), metadata: { heading, chunk_type: "text" } });
        }
        const overlap = current.slice(-overlapChars);
        current = overlap + " " + part;
      }
    }
    if (current.trim()) {
      chunks.push({ content: current.trim(), metadata: { heading, chunk_type: "text" } });
    }

    if (chunks.length > 0) return chunks;
  }

  // Absolute fallback: hard split at maxChars
  for (let i = 0; i < content.length; i += maxChars - overlapChars) {
    chunks.push({
      content: content.slice(i, i + maxChars).trim(),
      metadata: { heading, chunk_type: "text" },
    });
  }

  return chunks;
}
```

**Markdown-aware chunker (`src/lib/chunkers/markdown.ts`):**
```typescript
import { Chunk, ChunkerOptions, estimateTokens, tokensToChars } from './types';

export function chunkMarkdown(content: string, opts: ChunkerOptions): Chunk[] {
  const maxChars = tokensToChars(opts.maxChunkSize!);
  const chunks: Chunk[] = [];

  // Parse into sections by headers
  const sections = parseMarkdownSections(content);

  for (const section of sections) {
    const sectionContent = section.heading
      ? `${section.heading}\n\n${section.body}`
      : section.body;

    if (estimateTokens(sectionContent) <= opts.maxChunkSize!) {
      // Section fits in one chunk — keep together
      chunks.push({
        content: sectionContent.trim(),
        metadata: {
          heading: section.headingText,
          section_path: section.path,
          chunk_type: "text",
        },
      });
    } else {
      // Section too large — use recursive chunker on the body
      // but keep heading attached to first chunk
      const { chunkRecursive } = require('./recursive');
      const subChunks = chunkRecursive(section.body, opts);

      subChunks.forEach((sub, i) => {
        chunks.push({
          content: i === 0
            ? `${section.heading}\n\n${sub.content}`.trim()
            : sub.content,
          metadata: {
            ...sub.metadata,
            heading: section.headingText,
            section_path: section.path,
          },
        });
      });
    }
  }

  return chunks.filter(c => c.content.length > 10);
}

interface MarkdownSection {
  heading: string;      // full heading line "## Return Policy"
  headingText: string;  // just the text "Return Policy"
  level: number;        // 1-6
  body: string;         // content under this heading
  path: string;         // "# Guide > ## Installation > ### Requirements"
}

function parseMarkdownSections(content: string): MarkdownSection[] {
  const lines = content.split("\n");
  const sections: MarkdownSection[] = [];
  const headingStack: { text: string; level: number }[] = [];

  let currentHeading = "";
  let currentHeadingText = "";
  let currentLevel = 0;
  let currentBody: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headerMatch) {
      // Save previous section
      if (currentBody.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          headingText: currentHeadingText,
          level: currentLevel,
          body: currentBody.join("\n").trim(),
          path: headingStack.map(h => `${"#".repeat(h.level)} ${h.text}`).join(" > "),
        });
      }

      // Start new section
      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();

      // Update heading stack (pop headers at same or deeper level)
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ text, level });

      currentHeading = line;
      currentHeadingText = text;
      currentLevel = level;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  // Save last section
  if (currentBody.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      headingText: currentHeadingText,
      level: currentLevel,
      body: currentBody.join("\n").trim(),
      path: headingStack.map(h => `${"#".repeat(h.level)} ${h.text}`).join(" > "),
    });
  }

  return sections;
}
```

### Update `indexDocument()` to use new chunker

In `src/lib/knowledge-base.ts`:
```typescript
import { smartChunk } from './chunkers';

export async function indexDocument(
  documentId: string,
  userId: string,
  content: string,
  fileType: string = "txt" // changed from isCSV boolean
): Promise<{ chunkCount: number }> {
  const admin = createAdminClient();

  // Delete existing chunks for re-indexing
  await admin.from("kb_chunks").delete().eq("document_id", documentId);

  // Use new smart chunker
  const chunks = smartChunk(content, fileType);

  if (chunks.length === 0) {
    await admin.from("kb_documents").update({
      status: "error",
      error_message: "No content could be extracted",
      chunk_count: 0,
    }).eq("id", documentId);
    return { chunkCount: 0 };
  }

  // Insert chunks with metadata
  const chunkRows = chunks.map((chunk, index) => ({
    document_id: documentId,
    user_id: userId,
    content: chunk.content,
    chunk_index: index,
    metadata: chunk.metadata, // NEW: stores heading, section_path, chunk_type
  }));

  // ... rest of insertion + embedding logic stays the same
}
```

### Update upload routes to pass file type

In `src/app/api/knowledge-base/upload/route.ts`:
```typescript
// Change from:
await indexDocument(doc.id, user.id, textContent, file.type === "text/csv");
// To:
const fileType = file.name.split('.').pop() || "txt";
await indexDocument(doc.id, user.id, textContent, fileType);
```

### Update `kb_chunks` metadata column

Currently `metadata` is `JSONB DEFAULT '{}'`. No schema change needed — just start storing richer metadata. The column already accepts any JSON.

### Testing

1. Upload a markdown file with headers, code blocks, and tables
2. Check chunks: headers should stay with their content, code blocks should be intact, tables should be intact
3. Upload a plain text file — recursive chunker should split on paragraphs/sentences
4. Upload a CSV — should use the CSV-specific chunker
5. Verify chunk sizes are ~400 tokens (1600 chars) ± 15% overlap
6. Verify metadata contains heading, section_path, chunk_type for each chunk

### Files to create
- `src/lib/chunkers/types.ts`
- `src/lib/chunkers/index.ts`
- `src/lib/chunkers/recursive.ts`
- `src/lib/chunkers/markdown.ts`
- `src/lib/chunkers/html.ts` (adapt from existing `stripHTML` + recursive)
- `src/lib/chunkers/csv.ts` (improved version of existing `chunkCSV`)

### Files to modify
- `src/lib/knowledge-base.ts` — replace `chunkText()` calls with `smartChunk()`, update `indexDocument()` signature
- `src/app/api/knowledge-base/upload/route.ts` — pass file type
- `src/app/api/knowledge-base/url/route.ts` — pass "html" as file type
- `src/app/api/knowledge-base/[id]/reindex/route.ts` — pass stored file type

---

## 8.4 METADATA FILTERING

### What it is
When searching KB, filter by tags, category, date range, or document before running similarity search. "Only search in support documents" or "only from last 30 days."

### Current state
Every search scans ALL documents for the user. No way to narrow scope. A support agent searching KB gets chunks from HR docs, marketing docs, technical docs — irrelevant noise.

### Database changes

Migration SQL:
```sql
-- Add metadata columns to kb_documents
ALTER TABLE kb_documents ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE kb_documents ADD COLUMN category TEXT;

-- Index for tag filtering
CREATE INDEX idx_kb_docs_tags ON kb_documents USING GIN(tags);
CREATE INDEX idx_kb_docs_category ON kb_documents(category);

-- Update the vector search RPC to accept filters
CREATE OR REPLACE FUNCTION search_kb_chunks_vector_filtered(
  p_user_id UUID,
  p_query_embedding vector(384),
  p_match_threshold FLOAT,
  p_limit INT,
  p_tags TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_document_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_document_id UUID,
  chunk_content TEXT,
  chunk_index INT,
  chunk_metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id AS chunk_document_id,
    c.content AS chunk_content,
    c.chunk_index,
    c.metadata AS chunk_metadata,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM kb_chunks c
  JOIN kb_documents d ON d.id = c.document_id
  WHERE c.user_id = p_user_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_query_embedding) > p_match_threshold
    AND (p_tags IS NULL OR d.tags && p_tags)  -- array overlap operator
    AND (p_category IS NULL OR d.category = p_category)
    AND (p_date_from IS NULL OR d.created_at >= p_date_from)
    AND (p_date_to IS NULL OR d.created_at <= p_date_to)
    AND (p_document_ids IS NULL OR d.id = ANY(p_document_ids))
  ORDER BY similarity DESC
  LIMIT p_limit;
END;
$$;

-- Same for FTS
CREATE OR REPLACE FUNCTION search_kb_chunks_fts_filtered(
  p_user_id UUID,
  p_query TEXT,
  p_limit INT,
  p_tags TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_document_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_document_id UUID,
  chunk_content TEXT,
  chunk_index INT,
  rank FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id AS chunk_document_id,
    c.content AS chunk_content,
    c.chunk_index,
    ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', p_query)) AS rank
  FROM kb_chunks c
  JOIN kb_documents d ON d.id = c.document_id
  WHERE c.user_id = p_user_id
    AND to_tsvector('english', c.content) @@ plainto_tsquery('english', p_query)
    AND (p_tags IS NULL OR d.tags && p_tags)
    AND (p_category IS NULL OR d.category = p_category)
    AND (p_date_from IS NULL OR d.created_at >= p_date_from)
    AND (p_date_to IS NULL OR d.created_at <= p_date_to)
    AND (p_document_ids IS NULL OR d.id = ANY(p_document_ids))
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$;
```

### Update searchKBChunks() to accept filters

```typescript
// src/lib/knowledge-base.ts

export interface KBSearchFilters {
  tags?: string[];
  category?: string;
  dateFrom?: string;     // ISO date string
  dateTo?: string;       // ISO date string
  documentIds?: string[]; // restrict to specific documents
}

export async function searchKBChunks(
  userId: string,
  query: string,
  limit: number = 5,
  filters?: KBSearchFilters  // NEW parameter
): Promise<KBSearchResult[]> {
  // ... hybrid search setup ...

  // Pass filters to both vector and FTS searches
  const [vectorResults, ftsResults] = await Promise.all([
    vectorSearchFiltered(admin, userId, query, vpsIp, limit * 2, filters),
    ftsSearchFiltered(admin, userId, query, limit * 2, filters),
  ]);

  // ... RRF merge + reranking as before ...
}

async function vectorSearchFiltered(
  admin: SupabaseClient,
  userId: string,
  query: string,
  vpsIp: string | null,
  limit: number,
  filters?: KBSearchFilters
): Promise<ScoredChunk[]> {
  if (!vpsIp) return [];

  const vectors = await getEmbeddings(vpsIp, [query.trim()]);
  if (!vectors?.length) return [];

  const queryEmbedding = `[${vectors[0].join(",")}]`;
  const { data } = await admin.rpc("search_kb_chunks_vector_filtered", {
    p_user_id: userId,
    p_query_embedding: queryEmbedding,
    p_match_threshold: 0.2,
    p_limit: limit,
    p_tags: filters?.tags || null,
    p_category: filters?.category || null,
    p_date_from: filters?.dateFrom || null,
    p_date_to: filters?.dateTo || null,
    p_document_ids: filters?.documentIds || null,
  });

  return (data || []).map((c: any, rank: number) => ({
    id: c.chunk_id,
    document_id: c.chunk_document_id,
    content: c.chunk_content,
    score: c.similarity,
    rank,
    source: "vector" as const,
  }));
}

// Same pattern for ftsSearchFiltered
```

### Update chat routes to use agent-specific filters

In `src/app/api/chat/send/route.ts` and `v1/chat/route.ts`:

```typescript
// When searching KB for an agent, check if the agent has KB filter config
const agentConfig = await getAgentConfig(userId, agentName); // read from VPS or DB
const kbFilters: KBSearchFilters | undefined = agentConfig?.kb_filters
  ? {
      tags: agentConfig.kb_filters.tags,
      category: agentConfig.kb_filters.category,
    }
  : undefined;

const kbResults = await searchKBChunks(user.id, trimmedMsg, 3, kbFilters);
```

### UI changes

**In KB manager — document upload/edit:**
- Add "Tags" chip input: user types tag, presses Enter, chip appears. Remove with X. Stored as `TEXT[]` array.
- Add "Category" dropdown: predefined categories or free text. Options: "General", "Support", "Technical", "Legal", "HR", "Marketing", "Sales", or custom text input.

**In KB manager — search section:**
- Add filter controls above the search input:
  - Tags dropdown (multi-select from existing tags)
  - Category dropdown
  - Date range picker
- "Clear filters" button
- Filters are optional — empty = search all

**In Agent Builder (Feature 3) — manual form:**
- Add "KB Filter" section: which tags/categories this agent's KB search should use. When the agent chats, only matching documents are searched.

### API changes

Update KB document endpoints:
```typescript
// PATCH /api/knowledge-base/[id]
// Accept: { tags: string[], category: string }
// Update the document's tags and category in Supabase

// GET /api/knowledge-base/list
// Accept query params: ?tags=support,faq&category=Technical
// Return filtered document list
```

Update search endpoint:
```typescript
// GET /api/knowledge-base/search
// Accept: ?q=refund&tags=support&category=Support&dateFrom=2026-01-01
// Pass filters to searchKBChunks()
```

### Files to modify
- `src/lib/knowledge-base.ts` — add filters to search functions
- `src/app/api/knowledge-base/upload/route.ts` — accept tags + category
- `src/app/api/knowledge-base/[id]/route.ts` — PATCH for tags + category
- `src/app/api/knowledge-base/search/route.ts` — pass filter params
- `src/app/api/chat/send/route.ts` — use agent-specific filters
- `src/app/api/v1/chat/route.ts` — same
- `src/components/dashboard/knowledge-base-manager.tsx` — tag/category UI + filter controls
- Supabase migration file for schema changes + new RPCs

### Testing
1. Upload 3 docs: tag one "support", one "technical", one "marketing"
2. Search without filter → all 3 may return results
3. Search with `tags: ["support"]` → only support-tagged chunks returned
4. Search with `category: "Technical"` → only technical chunks
5. Search with `dateFrom` → only recent documents
6. Set agent KB filter to "support" → chat with agent → only support docs used

---

## 8.5 PARENT DOCUMENT RETRIEVAL

### What it is
Retrieve the small chunk for accuracy (it matched the query best), but inject the LARGER parent section for context (the model needs surrounding info to answer properly).

### Current state
We retrieve the matched chunk (~400 tokens after 8.3) and inject it as-is. If the answer spans information across multiple chunks in the same section, the model only sees part of the answer.

Example:
- Document section "Return Policy" has 3 chunks: eligibility, process, timeline
- User asks "what's the return process and deadline?"
- Vector search matches the "process" chunk (best match)
- But the "timeline" info is in the next chunk — model doesn't see it

### Database changes

```sql
-- Add section tracking to kb_chunks
ALTER TABLE kb_chunks ADD COLUMN section_id TEXT;
ALTER TABLE kb_chunks ADD COLUMN section_title TEXT;
```

### Update chunking to set section_id

In the chunkers (8.3), when creating chunks from a section, assign the same `section_id` to all chunks in that section:

```typescript
// In src/lib/chunkers/markdown.ts or recursive.ts
// When splitting a section into multiple chunks:

const sectionId = crypto.randomUUID();

subChunks.forEach((sub, i) => {
  chunks.push({
    content: sub.content,
    metadata: {
      ...sub.metadata,
      heading: section.headingText,
      section_path: section.path,
      section_id: sectionId,  // NEW: all chunks from this section share this ID
    },
  });
});
```

When inserting chunks in `indexDocument()`:
```typescript
const chunkRows = chunks.map((chunk, index) => ({
  document_id: documentId,
  user_id: userId,
  content: chunk.content,
  chunk_index: index,
  metadata: chunk.metadata,
  section_id: chunk.metadata.section_id || null,  // NEW
  section_title: chunk.metadata.heading || null,   // NEW
}));
```

### Update search to expand context

In `searchKBChunks()`, after getting the top results:

```typescript
async function expandWithParentContext(
  admin: SupabaseClient,
  userId: string,
  chunks: ScoredChunk[],
  maxExpandedChunks: number = 3 // max chunks to expand per result
): Promise<ScoredChunk[]> {
  const expanded: ScoredChunk[] = [];

  for (const chunk of chunks) {
    // Get the section_id of this chunk
    const { data: chunkData } = await admin
      .from("kb_chunks")
      .select("section_id, chunk_index")
      .eq("id", chunk.id)
      .single();

    if (!chunkData?.section_id) {
      // No section info — return chunk as-is
      expanded.push(chunk);
      continue;
    }

    // Fetch adjacent chunks in the same section
    const { data: sectionChunks } = await admin
      .from("kb_chunks")
      .select("id, content, chunk_index")
      .eq("section_id", chunkData.section_id)
      .eq("user_id", userId)
      .order("chunk_index", { ascending: true })
      .limit(maxExpandedChunks);

    if (sectionChunks && sectionChunks.length > 1) {
      // Merge adjacent chunks into one expanded result
      const mergedContent = sectionChunks.map(c => c.content).join("\n\n");
      expanded.push({
        ...chunk,
        content: mergedContent,
        // Mark as expanded for debugging
      });
    } else {
      expanded.push(chunk);
    }
  }

  return expanded;
}
```

Wire into the search pipeline, after reranking:
```typescript
// In searchKBChunks():
let results = await rerankResults(vpsIp, query, merged, limit);

// Expand with parent context
if (vpsIp) {
  results = await expandWithParentContext(admin, userId, results);
}
```

### Configuration
- Per-agent setting in Agent Builder: "Context expansion" toggle (on/off). Default on.
- When on: each matched chunk is expanded with its section siblings (~3 chunks)
- When off: just the matched chunk (original behavior)

### Files to modify
- `src/lib/chunkers/*.ts` — set `section_id` during chunking
- `src/lib/knowledge-base.ts` — `indexDocument()` stores section_id, `searchKBChunks()` expands
- Migration for `section_id` + `section_title` columns

### Testing
1. Upload a markdown document with "## Section A" containing 3 paragraphs
2. Search for something in the 2nd paragraph
3. Result should include content from all 3 paragraphs (expanded context)
4. The `content` field should be the merged section, not just the matching chunk

---

## 8.6 CHUNK VIEWER / EDITOR

### What it is
UI to see how documents were chunked. View, edit, merge, split individual chunks. Re-embed after editing.

### Current state
Users upload a document and can't see what happened. If chunks are bad, they have no way to fix it.

### API endpoints

```typescript
// GET /api/knowledge-base/[docId]/chunks
// Returns all chunks for a document
// Query params: ?limit=50&offset=0
// Response:
{
  "chunks": [
    {
      "id": "chunk-uuid",
      "content": "chunk text here...",
      "chunk_index": 0,
      "metadata": { "heading": "Introduction", "chunk_type": "text", "section_path": "# Guide > ## Introduction" },
      "has_embedding": true,
      "content_preview": "chunk text he..." // first 200 chars
    }
  ],
  "total": 24,
  "document": { "name": "Guide.md", "chunk_count": 24, "status": "indexed" }
}

// PATCH /api/knowledge-base/chunks/[chunkId]
// Edit chunk content
// Body: { "content": "updated text" }
// Response: { "chunk": { ...updated }, "needs_reembed": true }
// Note: editing content invalidates the embedding — mark as needs re-embed

// POST /api/knowledge-base/chunks/[chunkId]/split
// Split a chunk at a character position
// Body: { "split_at": 450 } // character position
// Creates two new chunks from the split, deletes the original
// Updates chunk_index for all subsequent chunks
// Response: { "chunks": [chunk1, chunk2], "needs_reembed": true }

// POST /api/knowledge-base/chunks/merge
// Merge two adjacent chunks
// Body: { "chunk_id_1": "uuid1", "chunk_id_2": "uuid2" }
// Validates they're adjacent (chunk_index differs by 1) and same document
// Creates one merged chunk, deletes both originals
// Response: { "chunk": { ...merged }, "needs_reembed": true }

// DELETE /api/knowledge-base/chunks/[chunkId]
// Delete a single chunk
// Updates chunk_index for subsequent chunks
// Response: { "success": true, "remaining_chunks": 23 }

// POST /api/knowledge-base/chunks/[chunkId]/re-embed
// Regenerate embedding for a single chunk
// Calls VPS embedding service
// Response: { "chunk": { ...updated, "has_embedding": true } }

// POST /api/knowledge-base/[docId]/re-embed-all
// Regenerate embeddings for all chunks of a document
// Useful after bulk editing
// Response: { "document_id": "...", "chunks_embedded": 24 }
```

All endpoints: auth → Pro plan check → verify document belongs to user → rate limit.

### UI component

Create `src/components/dashboard/chunk-viewer.tsx`:

```typescript
// Opens as a full-screen dialog or slide-in panel when clicking a document in KB manager

interface ChunkViewerProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

// Layout:
// ┌─────────────────────────────────────────────┐
// │ Chunks for "Guide.md"        [Re-embed All] [Close] │
// │ 24 chunks · Status: Indexed                       │
// ├─────────────────────────────────────────────┤
// │ Chunk 1 · text · "# Introduction"    [⋮ More]    │
// │ ┌───────────────────────────────────────┐          │
// │ │ This guide covers the setup process   │          │
// │ │ for new users. Follow the steps below │          │
// │ │ to get started quickly...             │          │
// │ └───────────────────────────────────────┘          │
// │ 📏 142 tokens · ✅ Embedded                        │
// ├─────────────────────────────────────────────┤
// │ Chunk 2 · table · "# Setup"          [⋮ More]    │
// │ ┌───────────────────────────────────────┐          │
// │ │ | Step | Action | Time |             │          │
// │ │ |------|--------|------|             │          │
// │ │ | 1    | Sign up| 2min |             │          │
// │ └───────────────────────────────────────┘          │
// │ 📏 89 tokens · ✅ Embedded                         │
// └─────────────────────────────────────────────┘

// "More" dropdown menu per chunk:
// - Edit (opens inline textarea)
// - Split here (cursor position in edit mode)
// - Merge with next
// - Re-embed
// - Delete

// Each chunk shows:
// - Index number
// - Type badge (text/table/code/list/header)
// - Heading context (from metadata)
// - Content (collapsible, first 3 lines shown by default)
// - Token count (estimateTokens())
// - Embedding status (✅ Embedded / ⚠️ Needs re-embed / ❌ No embedding)
```

### Inline editing flow

When user clicks "Edit" on a chunk:
1. Content area becomes a `<textarea>` with current content
2. "Save" and "Cancel" buttons appear
3. On save: `PATCH /api/knowledge-base/chunks/[id]` with new content
4. Chunk is marked as "needs re-embed" (yellow warning badge)
5. User can click "Re-embed" to regenerate, or "Re-embed All" at the top to batch

### Split flow

When user clicks "Split here" on a chunk:
1. Content opens in edit mode with a cursor
2. User positions cursor where they want the split
3. Clicks "Split at cursor"
4. `POST /api/knowledge-base/chunks/[id]/split` with character position
5. One chunk becomes two. Both marked "needs re-embed"

### Merge flow

When user clicks "Merge with next" on a chunk:
1. Confirmation: "Merge chunk 3 with chunk 4? This combines their content into one chunk."
2. On confirm: `POST /api/knowledge-base/chunks/merge` with both IDs
3. Two chunks become one. Marked "needs re-embed"

### Files to create
- `src/components/dashboard/chunk-viewer.tsx`
- `src/app/api/knowledge-base/[docId]/chunks/route.ts` (GET)
- `src/app/api/knowledge-base/chunks/[chunkId]/route.ts` (PATCH, DELETE)
- `src/app/api/knowledge-base/chunks/[chunkId]/split/route.ts` (POST)
- `src/app/api/knowledge-base/chunks/merge/route.ts` (POST)
- `src/app/api/knowledge-base/chunks/[chunkId]/re-embed/route.ts` (POST)
- `src/app/api/knowledge-base/[docId]/re-embed-all/route.ts` (POST)

### Files to modify
- `src/components/dashboard/knowledge-base-manager.tsx` — add "View Chunks" button per document that opens chunk-viewer

### Testing
1. Upload a document → click "View Chunks" → see all chunks with metadata
2. Edit a chunk → save → verify "needs re-embed" badge
3. Split a chunk → verify two new chunks appear
4. Merge two chunks → verify one combined chunk
5. Delete a chunk → verify it's gone and indices updated
6. Re-embed → verify embedding regenerated (badge changes to ✅)

---

## 8.7 DOCUMENT CONNECTORS (URL Auto-Sync, Google Drive, Notion)

### What it is
Auto-import documents from external sources instead of manual upload only.

### 8.7a URL Auto-Sync (build first — easiest)

**Current state:** URLs are one-time crawl. Content gets stale.

**Database:**
```sql
ALTER TABLE kb_documents ADD COLUMN sync_schedule TEXT DEFAULT 'none'; -- 'none', 'daily', 'weekly'
ALTER TABLE kb_documents ADD COLUMN last_synced_at TIMESTAMPTZ;
ALTER TABLE kb_documents ADD COLUMN source_url TEXT; -- store the original URL for re-crawl
ALTER TABLE kb_documents ADD COLUMN content_hash TEXT; -- MD5 of content, detect changes
```

**Cron endpoint:** `GET /api/cron/kb-sync`

```typescript
export async function GET(request: NextRequest) {
  // Auth: verify cron secret token
  const admin = createAdminClient();

  // Find documents due for sync
  const { data: docs } = await admin
    .from("kb_documents")
    .select("id, user_id, source_url, sync_schedule, content_hash")
    .neq("sync_schedule", "none")
    .not("source_url", "is", null)
    .or(`
      last_synced_at.is.null,
      and(sync_schedule.eq.daily,last_synced_at.lt.${oneDayAgo}),
      and(sync_schedule.eq.weekly,last_synced_at.lt.${oneWeekAgo})
    `);

  for (const doc of docs || []) {
    try {
      // Fetch URL content
      const response = await fetch(doc.source_url);
      const html = await response.text();
      const text = stripHTML(html);
      const newHash = crypto.createHash("md5").update(text).digest("hex");

      if (newHash === doc.content_hash) {
        // Content unchanged — just update last_synced_at
        await admin.from("kb_documents")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", doc.id);
        continue;
      }

      // Content changed — re-index
      const fileType = "html";
      await indexDocument(doc.id, doc.user_id, text, fileType);
      await admin.from("kb_documents")
        .update({
          last_synced_at: new Date().toISOString(),
          content_hash: newHash,
        })
        .eq("id", doc.id);
    } catch (err) {
      // Log error, continue with next doc
      console.warn(`[kb-sync] Failed to sync ${doc.id}: ${err}`);
    }
  }

  return NextResponse.json({ synced: docs?.length || 0 });
}
```

**UI in KB manager:**
On URL-sourced documents, show:
- "Auto-sync" toggle + schedule dropdown (Daily / Weekly / Off)
- "Last synced: 2 hours ago" timestamp
- "Sync now" manual button
- If content changed on last sync: "Content updated" badge

**Files to create:** `src/app/api/cron/kb-sync/route.ts`
**Files to modify:** `knowledge-base-manager.tsx` (sync UI), KB URL route (store source_url + content_hash on first crawl)

### 8.7b Google Drive Connector (build second)

**OAuth2 flow:**
1. User clicks "Connect Google Drive" in KB manager
2. Redirect to Google OAuth consent screen
3. User grants read-only access to Drive
4. Callback saves `refresh_token` (encrypted) in `kb_connectors` table
5. User selects a folder from their Drive
6. ClawHQ lists files in the folder, imports selected ones
7. On schedule: check folder for new/updated files, auto-import

**Database:**
```sql
CREATE TABLE kb_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'google_drive', 'notion'
  config JSONB NOT NULL, -- { folder_id, folder_name, file_types: ["pdf", "docx"] }
  credentials JSONB NOT NULL, -- { access_token, refresh_token, expires_at } — ENCRYPTED
  sync_schedule TEXT DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'error', 'disconnected'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**API endpoints:**
```
GET  /api/knowledge-base/connectors          — list user's connectors
POST /api/knowledge-base/connectors          — create connector (start OAuth)
GET  /api/knowledge-base/connectors/callback  — OAuth callback
GET  /api/knowledge-base/connectors/[id]/files — list files in connected folder
POST /api/knowledge-base/connectors/[id]/import — import selected files
DELETE /api/knowledge-base/connectors/[id]    — disconnect
```

**Google Drive API calls:**
```typescript
// List files in folder
const response = await fetch(
  `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,modifiedTime,size)`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);

// Download file content
const fileResponse = await fetch(
  `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
// For Google Docs: export as text
const exportResponse = await fetch(
  `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
```

**Environment variables needed:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://app.clawhq.tech/api/knowledge-base/connectors/callback
```

**Credential encryption:** Use `src/lib/crypto.ts` (already exists in the project) to encrypt/decrypt OAuth tokens before storing in DB.

**Sync cron:** Add to `GET /api/cron/kb-sync` — check `kb_connectors` with `sync_schedule != 'none'`, fetch new/modified files from Drive, import them.

### 8.7c Notion Connector (build third — same pattern as Google Drive)

Same OAuth2 flow with Notion's API. Uses Notion integration tokens. Fetches pages as markdown via Notion API's blocks endpoint. Same `kb_connectors` table.

### Files to create
- `src/app/api/knowledge-base/connectors/route.ts` (GET, POST)
- `src/app/api/knowledge-base/connectors/callback/route.ts` (OAuth callback)
- `src/app/api/knowledge-base/connectors/[id]/route.ts` (DELETE)
- `src/app/api/knowledge-base/connectors/[id]/files/route.ts` (list files)
- `src/app/api/knowledge-base/connectors/[id]/import/route.ts` (import)
- `src/components/dashboard/kb-connectors.tsx` (connector management UI)

### Files to modify
- `src/app/api/cron/kb-sync/route.ts` — add connector sync logic
- `src/components/dashboard/knowledge-base-manager.tsx` — add "Connect" button

---

## 8.8 RAG EVALUATION / ANSWER QUALITY SCORING

### What it is
After every KB-augmented response, automatically measure: did the AI actually use the provided context correctly? Or did it hallucinate?

### What to build

**Groundedness scoring function:**

```typescript
// src/lib/rag-evaluation.ts

export interface RAGEvaluation {
  groundednessScore: number;  // 0-1: how much of the response is supported by chunks
  chunksUsed: number;         // how many chunks were referenced
  chunksRelevant: number;     // how many chunks actually matched the response
  claims: { text: string; supported: boolean }[];
}

export function evaluateGroundedness(
  response: string,
  chunks: { content: string; documentName: string }[]
): RAGEvaluation {
  // Split response into claims (sentences)
  const sentences = response
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // skip very short fragments

  const claims: { text: string; supported: boolean }[] = [];
  let supportedCount = 0;

  for (const sentence of sentences) {
    // Check if this sentence is supported by any chunk
    // Method: extract key terms from the sentence, check if they appear in chunks
    const keyTerms = extractKeyTerms(sentence);
    const isSupported = chunks.some(chunk => {
      const matchCount = keyTerms.filter(term =>
        chunk.content.toLowerCase().includes(term.toLowerCase())
      ).length;
      return matchCount >= Math.ceil(keyTerms.length * 0.3); // 30% of key terms match
    });

    claims.push({ text: sentence, supported: isSupported });
    if (isSupported) supportedCount++;
  }

  const groundednessScore = sentences.length > 0
    ? supportedCount / sentences.length
    : 1; // no claims = nothing to evaluate

  // Count how many chunks were relevant
  const chunksRelevant = chunks.filter(chunk => {
    return claims.some(claim => claim.supported &&
      extractKeyTerms(claim.text).some(term =>
        chunk.content.toLowerCase().includes(term.toLowerCase())
      )
    );
  }).length;

  return {
    groundednessScore,
    chunksUsed: chunks.length,
    chunksRelevant,
    claims,
  };
}

function extractKeyTerms(text: string): string[] {
  // Remove common stop words, return meaningful terms
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "not", "no", "this", "that", "these", "those", "it", "its", "they",
    "them", "their", "we", "our", "you", "your", "he", "she", "his", "her",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}
```

**Wire into chat routes:**

In `chat/send/route.ts` and `v1/chat/route.ts`, after receiving the model response:

```typescript
// Only evaluate if KB context was used
if (kbResults.length > 0) {
  const evaluation = evaluateGroundedness(modelResponse, kbResults);

  // Store evaluation (fire-and-forget)
  storeRAGEvaluation(userId, {
    query: message,
    response: modelResponse,
    groundednessScore: evaluation.groundednessScore,
    chunksUsed: evaluation.chunksUsed,
    chunksRelevant: evaluation.chunksRelevant,
    timestamp: new Date().toISOString(),
  }).catch(() => {}); // non-blocking

  // If groundedness is very low, log a warning
  if (evaluation.groundednessScore < 0.3) {
    console.warn(`[rag-eval] Low groundedness ${evaluation.groundednessScore} for user ${userId}`);
  }
}
```

**In "Test Your KB" UI:**
After test query, show groundedness score as a visual indicator:
- Green (0.7+): "High confidence — response is well-grounded in your documents"
- Yellow (0.3-0.7): "Medium confidence — some claims may not be from your documents"
- Red (<0.3): "Low confidence — response may not be based on your documents"
- Show individual claims with check/cross marks

### Files to create
- `src/lib/rag-evaluation.ts`

### Files to modify
- `src/app/api/chat/send/route.ts` — add evaluation after KB-augmented response
- `src/app/api/v1/chat/route.ts` — same
- `src/components/dashboard/knowledge-base-manager.tsx` — show score in Test UI
- Analytics storage — store evaluation records

---

## 8.9 MULTI-FORMAT PROCESSING (DOCX, PPTX, XLSX + Better PDF)

### What to install

```bash
npm install mammoth          # DOCX → markdown/HTML
npm install xlsx             # XLSX/XLS → JSON
npm install pdf-parse        # PDF text (already installed?)
```

For PPTX: parse the ZIP XML directly (no great npm package). Or use `officegen` for reading.

### File processing pipeline

Create `src/lib/file-processors.ts`:

```typescript
import mammoth from 'mammoth';
import XLSX from 'xlsx';

export async function processFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ text: string; fileType: string }> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'pdf':
      return { text: await processPDF(buffer), fileType: 'pdf' };
    case 'docx':
      return { text: await processDOCX(buffer), fileType: 'md' }; // mammoth outputs markdown
    case 'xlsx':
    case 'xls':
      return { text: processXLSX(buffer), fileType: 'csv' }; // treat as CSV-like
    case 'pptx':
      return { text: await processPPTX(buffer), fileType: 'md' };
    case 'txt':
      return { text: buffer.toString('utf-8'), fileType: 'txt' };
    case 'md':
      return { text: buffer.toString('utf-8'), fileType: 'md' };
    case 'csv':
      return { text: buffer.toString('utf-8'), fileType: 'csv' };
    case 'json':
      return { text: buffer.toString('utf-8'), fileType: 'txt' };
    default:
      return { text: buffer.toString('utf-8'), fileType: 'txt' };
  }
}

async function processPDF(buffer: Buffer): Promise<string> {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text;
}

async function processDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToMarkdown({ buffer });
  return result.value;
  // mammoth preserves: headings, bold/italic, tables, lists, images (as alt text)
}

function processXLSX(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    sheets.push(`## Sheet: ${sheetName}\n\n${csv}`);
  }

  return sheets.join('\n\n---\n\n');
}

async function processPPTX(buffer: Buffer): Promise<string> {
  // PPTX is a ZIP file containing XML
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);

  const slides: string[] = [];
  let slideNum = 1;

  // PPTX slides are in ppt/slides/slide1.xml, slide2.xml, etc.
  for (const [path, file] of Object.entries(zip.files)) {
    if (path.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      const xml = await (file as any).async('text');
      // Extract text from XML (simplified — get all <a:t> elements)
      const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
      const texts = textMatches.map((m: string) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

      if (texts.length > 0) {
        slides.push(`## Slide ${slideNum}\n\n${texts.join('\n')}`);
      }
      slideNum++;
    }
  }

  return slides.join('\n\n---\n\n');
}
```

### Update upload route

In `src/app/api/knowledge-base/upload/route.ts`:

```typescript
import { processFile } from '@/lib/file-processors';

// Current MIME type validation:
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  // NEW:
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/vnd.ms-excel',                                                 // .xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

// Replace the current file-type-specific processing with:
const buffer = Buffer.from(await file.arrayBuffer());
const { text, fileType } = await processFile(buffer, file.name, file.type);

// Then chunk with the detected fileType:
await indexDocument(doc.id, user.id, text, fileType);
```

### Update KB manager UI

In the upload area, update the accepted file types:
```typescript
accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx,.xls,.pptx"
```

Update the supported formats display:
"Supported: PDF, TXT, MD, CSV, JSON, DOCX, XLSX, PPTX"

### Files to create
- `src/lib/file-processors.ts`

### Files to modify
- `src/app/api/knowledge-base/upload/route.ts` — use processFile(), expand MIME types
- `src/components/dashboard/knowledge-base-manager.tsx` — update accepted types

### Additional npm packages
- `npm install mammoth` (DOCX)
- `npm install xlsx` (XLSX)
- `npm install jszip` (PPTX XML parsing)

---

## 8.10 FEEDBACK LOOP (Thumbs Up/Down)

### What to build

**Chat UI addition:**
After every assistant message that used KB context (identifiable by the `[Source: ...]` citation), show small thumbs up / thumbs down buttons.

```typescript
// In src/components/dashboard/agent-chat.tsx
// After rendering an assistant message:

{message.usedKB && (
  <div className="flex gap-1 mt-1">
    <button
      onClick={() => submitFeedback(message.id, "positive")}
      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      <ThumbsUp className="h-3 w-3" />
    </button>
    <button
      onClick={() => submitFeedback(message.id, "negative")}
      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      <ThumbsDown className="h-3 w-3" />
    </button>
  </div>
)}
```

**API endpoint:**
```typescript
// POST /api/knowledge-base/feedback
// Body: { message_id, feedback: "positive" | "negative", comment?: string, chunk_ids: string[] }
// Stores feedback + updates chunk quality scores
```

**Database:**
```sql
CREATE TABLE kb_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message_id TEXT,
  feedback TEXT NOT NULL CHECK (feedback IN ('positive', 'negative')),
  comment TEXT,
  chunk_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add quality_score to chunks
ALTER TABLE kb_chunks ADD COLUMN quality_score FLOAT DEFAULT 0;
```

**On positive feedback:** Increment `quality_score` by 0.1 for all chunks used
**On negative feedback:** Decrement by 0.1, flag for review

**In search:** Factor quality score into final ranking:
```typescript
const adjustedScore = similarity * (1 + chunk.quality_score * 0.1);
```

**In KB manager:** Show "Feedback" section: "X chunks flagged for review" with link to chunk viewer filtered to low-quality chunks.

### Files to create
- `src/app/api/knowledge-base/feedback/route.ts`

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — add thumbs buttons
- `src/lib/knowledge-base.ts` — factor quality_score into search ranking
- `src/components/dashboard/knowledge-base-manager.tsx` — show feedback stats

---

## 8.11 QUERY TRANSFORMATION

### What to build

```typescript
// src/lib/query-expansion.ts

import { getEmbeddings } from './knowledge-base';

// Cache for query expansions (avoid duplicate model calls)
const expansionCache = new Map<string, { expanded: string; expiresAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function expandQuery(
  originalQuery: string,
  vpsIp: string,
  userId: string
): Promise<string> {
  // Check cache
  const cacheKey = `${userId}:${originalQuery.toLowerCase().trim()}`;
  const cached = expansionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.expanded;
  }

  // Rule-based expansion first (free, instant)
  const ruleExpanded = ruleBasedExpansion(originalQuery);
  if (ruleExpanded !== originalQuery) {
    expansionCache.set(cacheKey, { expanded: ruleExpanded, expiresAt: Date.now() + CACHE_TTL });
    return ruleExpanded;
  }

  // For longer queries (5+ words), use model-based expansion
  const words = originalQuery.trim().split(/\s+/);
  if (words.length < 5) {
    return originalQuery; // short queries don't benefit much from expansion
  }

  try {
    // Call clawhq-models API for expansion
    // This costs 1 model request — cache aggressively
    const expanded = await callModelForExpansion(originalQuery, vpsIp);
    expansionCache.set(cacheKey, { expanded, expiresAt: Date.now() + CACHE_TTL });
    return expanded;
  } catch {
    return originalQuery; // fallback to original
  }
}

function ruleBasedExpansion(query: string): string {
  // Common synonyms and expansions
  const expansions: Record<string, string> = {
    "refund": "refund return money back policy",
    "cancel": "cancel cancellation terminate end subscription",
    "price": "price pricing cost fee charge",
    "help": "help support assistance guide",
    "error": "error bug issue problem failure",
    "login": "login sign in authenticate access account",
    "signup": "signup sign up register create account",
  };

  const lowerQuery = query.toLowerCase();
  for (const [trigger, expansion] of Object.entries(expansions)) {
    if (lowerQuery.includes(trigger) && !lowerQuery.includes(expansion)) {
      return `${query} ${expansion}`;
    }
  }

  return query; // no expansion applied
}

async function callModelForExpansion(query: string, vpsIp: string): Promise<string> {
  // Call the chat model with a specific expansion prompt
  // This goes through the same clawhq-models API
  const response = await fetch(`http://${vpsIp}:18789/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "You are a search query optimizer. Given a user question, output ONLY search keywords that would find relevant documents. Include synonyms, related terms, and alternative phrasings. Output keywords only, no explanation, no sentences. Max 20 words."
        },
        { role: "user", content: query }
      ],
      max_tokens: 50,
    }),
  });

  const data = await response.json();
  const expanded = data.choices?.[0]?.message?.content?.trim();
  return expanded || query;
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of expansionCache) {
    if (value.expiresAt < now) expansionCache.delete(key);
  }
}, 5 * 60 * 1000); // every 5 minutes
```

**Wire into search:**
```typescript
// In searchKBChunks(), before running hybrid search:
const expandedQuery = await expandQuery(query, vpsIp, userId);
// Use expandedQuery for the FTS search, original query for vector search
// Vector search already handles semantics — expansion helps keyword search most
```

### Files to create
- `src/lib/query-expansion.ts`

### Files to modify
- `src/lib/knowledge-base.ts` — call expandQuery() before FTS search

---

## 8.12 KB ANALYTICS

### What to build

**Data collection:** Every KB search logs metadata.

```typescript
// In searchKBChunks(), at the end:
logKBSearch({
  userId,
  query,
  expandedQuery,
  resultsCount: results.length,
  topScore: results[0]?.similarity || 0,
  searchType: results[0]?.searchType || "none",
  groundednessScore, // if available from 8.8
  chunkIds: results.map(r => r.id),
  documentIds: [...new Set(results.map(r => r.document_id))],
  timestamp: new Date().toISOString(),
}).catch(() => {}); // non-blocking
```

**API endpoint:**
```typescript
// GET /api/knowledge-base/analytics?period=7d|30d
// Response:
{
  "summary": {
    "total_searches": 456,
    "avg_relevance_score": 0.72,
    "avg_groundedness_score": 0.68,
    "searches_with_results": 410,
    "searches_without_results": 46
  },
  "top_queries": [
    { "query": "refund policy", "count": 23, "avg_score": 0.85 },
    { "query": "shipping times", "count": 18, "avg_score": 0.71 }
  ],
  "most_referenced_documents": [
    { "name": "Return Policy.md", "retrieval_count": 89 },
    { "name": "FAQ.md", "retrieval_count": 67 }
  ],
  "unused_documents": [
    { "name": "Old Guide.pdf", "retrieval_count": 0, "created_at": "..." }
  ],
  "failed_queries": [
    { "query": "warranty claims", "count": 5, "last_asked": "..." }
  ],
  "relevance_trend": [
    { "date": "2026-03-15", "avg_score": 0.73 },
    { "date": "2026-03-14", "avg_score": 0.71 }
  ]
}
```

**UI in KB manager:**
New "Analytics" tab showing:
1. Summary cards (total searches, avg relevance, success rate)
2. Top queries table
3. Most/least referenced documents
4. Failed queries (KB gaps — what users ask that has no answer)
5. Relevance trend chart (Recharts line chart)

### Files to create
- `src/app/api/knowledge-base/analytics/route.ts`
- KB analytics component

### Files to modify
- `src/lib/knowledge-base.ts` — add search logging
- `src/components/dashboard/knowledge-base-manager.tsx` — add Analytics tab

---

## 8.13 AGENTIC RAG (AI Decides When to Search)

### What to build

```typescript
// src/lib/rag-classifier.ts

// Rule-based classifier (free, instant, handles 80% of cases)
export function shouldSearchKB(message: string): "search" | "skip" | "uncertain" {
  const trimmed = message.trim().toLowerCase();

  // SKIP: greetings
  if (/^(hi|hello|hey|thanks|bye|ok|sure|great|cool|nice|yes|no|yeah|nah)\b/i.test(trimmed)) {
    return "skip";
  }

  // SKIP: very short messages (under 3 words)
  if (trimmed.split(/\s+/).length < 3) {
    return "skip";
  }

  // SKIP: follow-ups and continuations
  if (/^(tell me more|go on|continue|what else|anything else|can you explain|elaborate)\b/i.test(trimmed)) {
    return "skip";
  }

  // SKIP: meta questions about the agent itself
  if (/^(who are you|what can you do|what are you|help me)\b/i.test(trimmed)) {
    return "skip";
  }

  // SEARCH: questions (contains ?)
  if (trimmed.includes("?")) {
    return "search";
  }

  // SEARCH: explicit knowledge requests
  if (/\b(what is|how to|how do|where is|when does|tell me about|explain|define|describe|policy|process|procedure|guide|documentation)\b/i.test(trimmed)) {
    return "search";
  }

  // UNCERTAIN: medium-length statements that might need context
  if (trimmed.split(/\s+/).length >= 5) {
    return "uncertain";
  }

  return "skip";
}
```

**Wire into chat routes:**

```typescript
// In chat/send/route.ts and v1/chat/route.ts, BEFORE KB search:

import { shouldSearchKB } from '@/lib/rag-classifier';

let kbContext = "";
const searchDecision = shouldSearchKB(message);

if (searchDecision === "search" || searchDecision === "uncertain") {
  // For "uncertain": search but with higher relevance threshold
  const threshold = searchDecision === "uncertain" ? 0.5 : undefined;
  const kbResults = await searchKBChunks(user.id, trimmedMsg, 3, filters);

  // For "uncertain" results: only use if top result has high relevance
  if (searchDecision === "uncertain" && kbResults[0]?.similarity && kbResults[0].similarity < 0.5) {
    // Not relevant enough — skip KB context
  } else if (kbResults.length > 0) {
    kbContext = kbResults.map(r => `[Source: ${r.documentName}]\n${r.content}`).join("\n\n---\n\n");
  }
}
// If searchDecision === "skip", no KB search at all
```

**Benefit:** Reduces unnecessary KB searches by ~40-60%. Faster responses for greetings/follow-ups. No irrelevant context injected.

### Files to create
- `src/lib/rag-classifier.ts`

### Files to modify
- `src/app/api/chat/send/route.ts` — add classification before KB search
- `src/app/api/v1/chat/route.ts` — same

---

## 8.14 TABLE EXTRACTION FROM PDFs

### What to build

Already handled in `src/lib/file-processors.ts` (8.9) for general PDF processing. This section adds specific table detection and structured extraction.

```typescript
// Add to src/lib/file-processors.ts

// After normal PDF text extraction, detect and extract tables
async function extractTablesFromPDF(buffer: Buffer): Promise<string[]> {
  try {
    // Method 1: Use regex to detect table-like patterns in extracted text
    // (lines with consistent column separators)
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text;

    const tables: string[] = [];
    const lines = text.split('\n');
    let tableLines: string[] = [];
    let inTable = false;

    for (const line of lines) {
      // Detect table-like lines (multiple whitespace-separated columns)
      const columns = line.trim().split(/\s{2,}/).filter(Boolean);
      if (columns.length >= 3) {
        inTable = true;
        tableLines.push(line);
      } else if (inTable) {
        // End of table
        if (tableLines.length >= 2) {
          tables.push(convertToMarkdownTable(tableLines));
        }
        tableLines = [];
        inTable = false;
      }
    }

    // Flush last table
    if (tableLines.length >= 2) {
      tables.push(convertToMarkdownTable(tableLines));
    }

    return tables;
  } catch {
    return [];
  }
}

function convertToMarkdownTable(lines: string[]): string {
  const rows = lines.map(line =>
    line.trim().split(/\s{2,}/).filter(Boolean)
  );

  if (rows.length < 2) return lines.join('\n');

  // First row = header
  const header = `| ${rows[0].join(' | ')} |`;
  const separator = `| ${rows[0].map(() => '---').join(' | ')} |`;
  const body = rows.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n');

  return `${header}\n${separator}\n${body}`;
}
```

**Integration with chunker:**
Tables detected in PDF text are marked with `chunk_type: "table"` in metadata. The chunker (8.3) keeps tables intact — never splits a table across chunks.

### Files to modify
- `src/lib/file-processors.ts` — add table detection
- `src/lib/chunkers/recursive.ts` — already handles `type: "table"` blocks (8.3)

---

## 8.15 OCR FOR SCANNED PDFs

### What to build

**Detection: is this PDF scanned?**
```typescript
// In src/lib/file-processors.ts, update processPDF():

async function processPDF(buffer: Buffer): Promise<string> {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);

  // Check if text extraction was useful
  const textLength = data.text.trim().length;
  const pageCount = data.numpages || 1;
  const charsPerPage = textLength / pageCount;

  if (charsPerPage < 50) {
    // Very little text per page — likely a scanned document
    // Try OCR
    return await ocrPDF(buffer);
  }

  return data.text;
}
```

**OCR via VPS Tesseract:**

Add to VPS provisioning (`provision-v3.ts`):
```bash
# Install Tesseract OCR
apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils
```

`poppler-utils` provides `pdftoppm` which converts PDF pages to images (needed for Tesseract).

Add OCR endpoint to VPS Data API or embedding service:
```javascript
// On VPS — add to embedding service (port 5555) or data API (port 5556)

app.post('/ocr', async (req, res) => {
  try {
    // Receive PDF as base64
    const { pdf_base64 } = req.body;
    const buffer = Buffer.from(pdf_base64, 'base64');

    // Write to temp file
    const tmpPdf = `/tmp/ocr_${Date.now()}.pdf`;
    const tmpImg = `/tmp/ocr_${Date.now()}`;
    fs.writeFileSync(tmpPdf, buffer);

    // Convert PDF pages to images
    execSync(`pdftoppm -png ${tmpPdf} ${tmpImg}`);

    // OCR each page image
    const pages = [];
    const imgFiles = fs.readdirSync('/tmp')
      .filter(f => f.startsWith(`ocr_${Date.now()}`))
      .sort();

    for (const imgFile of imgFiles) {
      const result = execSync(`tesseract /tmp/${imgFile} stdout`, { encoding: 'utf-8' });
      pages.push(result.trim());
    }

    // Cleanup
    fs.unlinkSync(tmpPdf);
    imgFiles.forEach(f => fs.unlinkSync(`/tmp/${f}`));

    res.json({ text: pages.join('\n\n--- Page Break ---\n\n'), pages: pages.length });
  } catch (err) {
    res.status(500).json({ error: 'OCR failed' });
  }
});
```

**Dashboard-side OCR call:**
```typescript
// In src/lib/file-processors.ts

async function ocrPDF(buffer: Buffer): Promise<string> {
  // This needs the VPS IP — get from context or pass as parameter
  // For now, this function is called from the upload API route which has access to VPS info

  const vpsIp = await getUserVpsIpFromContext(); // need to pass this through

  try {
    const response = await fetch(`http://${vpsIp}:5555/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_base64: buffer.toString('base64') }),
    });

    if (!response.ok) throw new Error('OCR failed');
    const data = await response.json();
    return data.text;
  } catch {
    return ''; // OCR failed — document will have 0 useful chunks
  }
}
```

**In upload route:**
```typescript
// Need to pass VPS IP to processFile for OCR
const vpsIp = await getUserVpsIp(user.id);
const { text, fileType } = await processFile(buffer, file.name, file.type, vpsIp);
```

**Document metadata:**
Mark documents that needed OCR: `ocr_processed: true` in metadata. Show "OCR" badge in KB manager.

### Files to modify
- `src/lib/file-processors.ts` — add OCR detection + call
- `src/lib/provision-v3.ts` — install tesseract + poppler-utils
- VPS embedding service — add `/ocr` endpoint
- `src/app/api/knowledge-base/upload/route.ts` — pass VPS IP to processFile

---

## 8.16 DOCX/PPTX/XLSX FILE SUPPORT

**Fully covered by 8.9** — same feature, same implementation. No separate work needed.

---

## BUILD ORDER (FINAL)

```
PHASE 1 — Foundation (do first, everything else depends on these):
  8.3  Better Chunking (changes chunk format for all features)
  8.9  Multi-format Processing (DOCX/PPTX/XLSX — more files to chunk)
  8.14 Table Extraction (part of chunking pipeline)
  8.15 OCR for Scanned PDFs (part of processing pipeline)

PHASE 2 — Search Quality (biggest RAG improvement):
  8.1  Hybrid Search (vector + keyword + RRF)
  8.2  Reranking (cross-encoder on VPS)
  8.4  Metadata Filtering (tags, categories)
  8.5  Parent Document Retrieval (expand context)
  8.11 Query Transformation (better queries → better retrieval)
  8.13 Agentic RAG (skip unnecessary searches)

PHASE 3 — User Experience:
  8.6  Chunk Viewer/Editor (transparency into chunking)
  8.10 Feedback Loop (thumbs up/down)
  8.12 KB Analytics (usage insights)
  8.8  RAG Evaluation (groundedness scoring)

PHASE 4 — Connectors:
  8.7  Document Connectors (URL sync first, then Google Drive, then Notion)
```

Phase 1 + 2 = transforms RAG quality from "basic keyword search" to "production-grade hybrid RAG with reranking." This alone justifies the $129 Pro price for KB-heavy users.

---

## BUILD ORDER

The 16 KB features have dependencies:

```
8.3 Better Chunking (FIRST — changes the chunk format all other features use)
  ↓
8.1 Hybrid Search (needs chunks to exist, can run on old or new chunks)
  ↓
8.2 Reranking (runs after hybrid search)
  ↓
8.4 Metadata Filtering (needs metadata from 8.3's chunks)
  ↓
8.5 Parent Document Retrieval (needs section_id from 8.3's chunks)
  ↓
8.6 Chunk Viewer/Editor (needs proper chunks with metadata to display)

Independent features (build in any order after 8.3):
8.7 Document Connectors
8.8 RAG Evaluation
8.9 Multi-format Processing (DOCX/PPTX/XLSX)
8.10 Feedback Loop
8.11 Query Transformation
8.12 KB Analytics
8.13 Agentic RAG
8.14 Table Extraction (can be part of 8.3 or separate)
8.15 OCR for Scanned PDFs
8.16 DOCX/PPTX/XLSX (same as 8.9)
```

Build 8.3 → 8.1 → 8.2 first. These three alone will improve RAG quality by ~50-70% based on industry benchmarks.
