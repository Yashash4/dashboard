import { Chunk, ChunkerOptions } from "./types";
import { chunkMarkdown } from "./markdown";
import { chunkRecursive } from "./recursive";

export type { Chunk, ChunkerOptions } from "./types";
export { estimateTokens, tokensToChars } from "./types";

const DEFAULT_OPTIONS: ChunkerOptions = {
  maxChunkSize: 400, // 400 tokens ~ 1600 chars — optimal for RAG
  overlapPercent: 15,
  preserveTables: true,
  preserveCode: true,
};

/**
 * Smart chunk dispatcher — routes by fileType to the best chunker.
 * CSV is handled inline; markdown gets section-aware chunking;
 * everything else uses the recursive/structural chunker.
 */
export function smartChunk(
  content: string,
  fileType: string,
  options?: Partial<ChunkerOptions>
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  switch (fileType.toLowerCase()) {
    case "md":
    case "markdown":
      return chunkMarkdown(content, opts);

    case "csv":
      return chunkCSVSmart(content, opts);

    case "html":
    case "url":
      // Strip HTML was already done before chunking; treat as plain text
      return chunkRecursive(content, opts);

    case "txt":
    case "pdf":
    case "docx":
    case "pptx":
    case "xlsx":
    default:
      return chunkRecursive(content, opts);
  }
}

/**
 * CSV chunker — each row gets header context.
 */
function chunkCSVSmart(csvText: string, opts: ChunkerOptions): Chunk[] {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return [
      {
        content: csvText,
        metadata: { chunk_type: "text" },
      },
    ];
  }

  const header = lines[0];
  const maxChars = (opts.maxChunkSize || 400) * 4; // tokensToChars
  const chunks: Chunk[] = [];
  let current = `Headers: ${header}\n\n`;

  for (let i = 1; i < lines.length; i++) {
    const row = `Row ${i}: ${lines[i]}`;
    if (current.length + row.length + 1 > maxChars) {
      chunks.push({
        content: current.trim(),
        metadata: { chunk_type: "table" },
      });
      current = `Headers: ${header}\n\n${row}`;
    } else {
      current += "\n" + row;
    }
  }

  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      metadata: { chunk_type: "table" },
    });
  }

  return chunks;
}
