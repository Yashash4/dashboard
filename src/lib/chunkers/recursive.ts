import { Chunk, ChunkerOptions, estimateTokens, tokensToChars } from "./types";

/** Split hierarchy: try largest structural boundary first, then smaller */
const SPLIT_HIERARCHY = [
  /\n\n\n+/, // triple+ newline — major sections
  /\n\n/, // double newline — paragraphs
  /\n/, // single newline — lines
  /(?<=[.!?])\s+/, // sentence boundaries
  /\s+/, // words (last resort)
];

interface Block {
  content: string;
  type: "text" | "header" | "table" | "code" | "list";
  language?: string;
}

export function identifyBlocks(
  content: string,
  _opts: ChunkerOptions
): Block[] {
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
      while (
        i < lines.length &&
        (/^[\s]*[-*]\s|^[\s]*\d+\.\s/.test(lines[i]) ||
          /^\s+/.test(lines[i]))
      ) {
        listLines.push(lines[i]);
        i++;
      }
      blocks.push({ content: listLines.join("\n"), type: "list" });
      continue;
    }

    // Regular text — accumulate until empty line or structural element
    const textLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\|/.test(lines[i])
    ) {
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

export function splitLargeBlock(
  content: string,
  opts: ChunkerOptions,
  heading?: string
): Chunk[] {
  const maxChars = tokensToChars(opts.maxChunkSize || 400);
  const overlapChars = Math.floor(
    maxChars * ((opts.overlapPercent || 15) / 100)
  );
  const chunks: Chunk[] = [];

  // Try each split level in the hierarchy
  for (const splitter of SPLIT_HIERARCHY) {
    const parts = content.split(splitter).filter((p) => p.trim());
    if (parts.length <= 1) continue;

    let current = "";
    for (const part of parts) {
      const combined = current + (current ? " " : "") + part;
      if (estimateTokens(combined) <= (opts.maxChunkSize || 400)) {
        current = combined;
      } else {
        if (current.trim()) {
          chunks.push({
            content: current.trim(),
            metadata: { heading, chunk_type: "text" },
          });
        }
        const overlap = current.slice(-overlapChars);
        current = overlap + " " + part;
      }
    }
    if (current.trim()) {
      chunks.push({
        content: current.trim(),
        metadata: { heading, chunk_type: "text" },
      });
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

export function chunkRecursive(
  content: string,
  opts: ChunkerOptions
): Chunk[] {
  const maxChars = tokensToChars(opts.maxChunkSize || 400);
  const overlapChars = Math.floor(
    maxChars * ((opts.overlapPercent || 15) / 100)
  );

  // First pass: identify structural blocks
  const blocks = identifyBlocks(content, opts);

  // Second pass: merge small blocks, split large blocks
  const chunks: Chunk[] = [];
  let currentContent = "";
  let currentHeading: string | undefined;

  for (const block of blocks) {
    // If block is a table or code and we're preserving them, keep intact
    if (
      (block.type === "table" && opts.preserveTables !== false) ||
      (block.type === "code" && opts.preserveCode !== false)
    ) {
      if (currentContent.trim()) {
        chunks.push({
          content: currentContent.trim(),
          metadata: { heading: currentHeading, chunk_type: "text" },
        });
        currentContent = "";
      }
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
      currentContent += (currentContent ? "\n\n" : "") + block.content;
      continue;
    }

    // Regular text block
    const combined =
      currentContent + (currentContent ? "\n\n" : "") + block.content;

    if (estimateTokens(combined) <= (opts.maxChunkSize || 400)) {
      currentContent = combined;
    } else {
      if (currentContent.trim()) {
        chunks.push({
          content: currentContent.trim(),
          metadata: { heading: currentHeading, chunk_type: "text" },
        });
      }
      const overlap = currentContent.slice(-overlapChars);
      currentContent = overlap + (overlap ? "\n\n" : "") + block.content;

      if (estimateTokens(currentContent) > (opts.maxChunkSize || 400)) {
        const subChunks = splitLargeBlock(
          currentContent,
          opts,
          currentHeading
        );
        chunks.push(...subChunks.slice(0, -1));
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

  return chunks.filter((c) => c.content.length > 10);
}
