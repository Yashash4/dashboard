/**
 * RAG Evaluation — groundedness scoring.
 * Checks how well a response is supported by the retrieved chunks.
 */

export interface GroundednessResult {
  groundednessScore: number; // 0-1, fraction of claims supported
  supportedClaims: number;
  totalClaims: number;
}

/**
 * Evaluate how grounded a response is in the provided KB chunks.
 * Splits the response into sentences, extracts key terms from each,
 * and checks whether those terms appear in the source chunks.
 */
export function evaluateGroundedness(
  response: string,
  chunks: string[]
): GroundednessResult {
  if (!response.trim() || chunks.length === 0) {
    return { groundednessScore: 0, supportedClaims: 0, totalClaims: 0 };
  }

  // Split response into sentences
  const sentences = splitSentences(response);
  if (sentences.length === 0) {
    return { groundednessScore: 0, supportedClaims: 0, totalClaims: 0 };
  }

  // Combine all chunk text for searching (lowercased)
  const combinedChunks = chunks.join(" ").toLowerCase();

  let supportedClaims = 0;

  for (const sentence of sentences) {
    // Skip very short sentences (likely not factual claims)
    if (sentence.split(/\s+/).length < 4) {
      continue;
    }

    const keyTerms = extractKeyTerms(sentence);
    if (keyTerms.length === 0) continue;

    // A sentence is "supported" if a majority of its key terms appear in the chunks
    const matchCount = keyTerms.filter((term) =>
      combinedChunks.includes(term.toLowerCase())
    ).length;

    const matchRatio = matchCount / keyTerms.length;
    if (matchRatio >= 0.5) {
      supportedClaims++;
    }
  }

  // Only count sentences with 4+ words as claims
  const claimSentences = sentences.filter(
    (s) => s.split(/\s+/).length >= 4
  );
  const totalClaims = claimSentences.length;

  if (totalClaims === 0) {
    return { groundednessScore: 1, supportedClaims: 0, totalClaims: 0 };
  }

  return {
    groundednessScore: Math.round((supportedClaims / totalClaims) * 100) / 100,
    supportedClaims,
    totalClaims,
  };
}

/** Split text into sentences at typical boundaries. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Module-level constant — avoids recreating on every call
const STOP_WORDS = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "shall",
    "can",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "as",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "out",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "and",
    "but",
    "or",
    "nor",
    "not",
    "so",
    "yet",
    "both",
    "either",
    "neither",
    "each",
    "every",
    "all",
    "any",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "only",
    "own",
    "same",
    "than",
    "too",
    "very",
    "just",
    "because",
    "if",
    "when",
    "where",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "i",
    "me",
    "my",
    "we",
    "our",
    "you",
    "your",
    "he",
    "him",
    "his",
    "she",
    "her",
    "it",
    "its",
    "they",
    "them",
    "their",
    "also",
    "about",
]);

/** Extract key terms from a sentence (nouns, numbers, proper nouns). */
function extractKeyTerms(sentence: string): string[] {
  const words = sentence
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()));

  return words;
}
