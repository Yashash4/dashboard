/**
 * Agentic RAG Classifier — decides whether a message needs KB search.
 * Saves latency + cost by skipping KB lookup for greetings,
 * follow-ups, and other messages that don't need knowledge retrieval.
 */

/** Greeting patterns (case-insensitive) */
const GREETING_PATTERNS = [
  /^(hi|hello|hey|yo|sup|hola|greetings|good\s*(morning|afternoon|evening|day))[\s!.?]*$/i,
  /^(thanks|thank\s*you|thx|ty|cheers)[\s!.?]*$/i,
  /^(bye|goodbye|see\s*you|later|take\s*care)[\s!.?]*$/i,
];

/** Follow-up patterns — very short affirmative/negative replies */
const FOLLOWUP_PATTERNS = [
  /^(yes|yeah|yep|yup|sure|ok|okay|no|nah|nope|right|correct|exactly|agreed|got\s*it|understood|cool|nice|great|awesome|perfect)[\s!.?]*$/i,
  /^(please|pls|go\s*ahead|continue|more|elaborate)[\s!.?]*$/i,
];

/** Knowledge request patterns — likely need KB search */
const KNOWLEDGE_PATTERNS = [
  /\?/, // Contains a question mark
  /^(what|how|why|when|where|which|who|can|does|do|is|are|will|should|could|would)\s/i,
  /\b(explain|describe|tell\s*me|show\s*me|help\s*me|walk\s*me\s*through)\b/i,
  /\b(what\s+is|how\s+to|how\s+do|how\s+does|how\s+can)\b/i,
  /\b(documentation|docs|guide|manual|tutorial|instructions)\b/i,
  /\b(error|issue|problem|bug|troubleshoot|fix|resolve|solution)\b/i,
  /\b(policy|pricing|plan|feature|limit|quota)\b/i,
  /\b(api|endpoint|webhook|integration|config|setting)\b/i,
];

/**
 * Classify whether a message should trigger KB search.
 * @returns "search" — definitely search KB
 * @returns "skip" — definitely skip KB (greetings, follow-ups)
 * @returns "uncertain" — unclear, default to searching
 */
export function shouldSearchKB(
  message: string
): "search" | "skip" | "uncertain" {
  const trimmed = message.trim();

  // Empty or very short messages — skip
  if (!trimmed || trimmed.length < 2) return "skip";

  // Less than 3 words — likely a follow-up
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < 3) {
    // Check if it matches a greeting
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(trimmed)) return "skip";
    }
    // Check if it matches a follow-up
    for (const pattern of FOLLOWUP_PATTERNS) {
      if (pattern.test(trimmed)) return "skip";
    }
    // Short but not a greeting/follow-up — uncertain
    return "uncertain";
  }

  // Check greeting patterns (even if longer than 3 words, e.g. "good morning!")
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(trimmed)) return "skip";
  }

  // Check knowledge request patterns
  for (const pattern of KNOWLEDGE_PATTERNS) {
    if (pattern.test(trimmed)) return "search";
  }

  // Default: uncertain — we'll search anyway to be safe
  return "uncertain";
}
