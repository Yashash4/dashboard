export interface Chunk {
  content: string;
  metadata: {
    heading?: string;
    section_path?: string;
    page_number?: number;
    chunk_type: "text" | "table" | "code" | "list" | "header";
    start_char?: number;
    end_char?: number;
    language?: string;
  };
}

export interface ChunkerOptions {
  maxChunkSize?: number;
  overlapPercent?: number;
  preserveTables?: boolean;
  preserveCode?: boolean;
}

/** Rough token estimator (1 token ~ 4 chars for English) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function tokensToChars(tokens: number): number {
  return tokens * 4;
}
