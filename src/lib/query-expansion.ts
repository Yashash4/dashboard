/**
 * Query Expansion — rule-based synonym expansion for FTS.
 * Adds synonyms/related terms to the search query so FTS
 * can find documents that use different terminology.
 */

const SYNONYM_MAP: Record<string, string[]> = {
  return: ["refund", "exchange", "send back"],
  refund: ["return", "money back", "reimburse"],
  cost: ["price", "pricing", "fee", "charge"],
  price: ["cost", "pricing", "fee", "rate"],
  buy: ["purchase", "order", "subscribe"],
  purchase: ["buy", "order", "acquire"],
  cancel: ["unsubscribe", "stop", "terminate", "end"],
  help: ["support", "assist", "troubleshoot"],
  support: ["help", "assistance", "contact"],
  error: ["issue", "problem", "bug", "failure"],
  issue: ["error", "problem", "bug"],
  problem: ["error", "issue", "bug"],
  setup: ["install", "configure", "get started"],
  install: ["setup", "configure", "deploy"],
  configure: ["setup", "settings", "customize"],
  update: ["upgrade", "change", "modify"],
  delete: ["remove", "erase", "clear"],
  remove: ["delete", "erase", "uninstall"],
  account: ["profile", "user"],
  password: ["credentials", "login", "auth"],
  login: ["sign in", "authenticate", "log in"],
  shipping: ["delivery", "ship", "dispatch"],
  delivery: ["shipping", "ship", "transit"],
  payment: ["billing", "pay", "charge", "invoice"],
  billing: ["payment", "invoice", "charge", "subscription"],
  deploy: ["launch", "publish", "release"],
  api: ["endpoint", "integration", "interface"],
  agent: ["bot", "assistant", "chatbot"],
  docs: ["documentation", "guide", "manual"],
  documentation: ["docs", "guide", "manual", "reference"],
};

/**
 * Expand a query with synonyms for better FTS recall.
 * Returns the original query plus expanded single-word synonyms.
 * Multi-word synonyms are split into individual words.
 * Consumer uses plainto_tsquery() which treats spaces as AND —
 * but more terms = more potential matches across documents.
 * e.g. "how to return item" -> "how to return item refund exchange"
 */
export function expandQuery(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const expansions = new Set<string>();

  for (const word of words) {
    const synonyms = SYNONYM_MAP[word];
    if (synonyms) {
      for (const syn of synonyms) {
        // Split multi-word synonyms into individual words
        const synWords = syn.toLowerCase().split(/\s+/);
        for (const sw of synWords) {
          if (!query.toLowerCase().includes(sw) && sw.length > 2) {
            expansions.add(sw);
          }
        }
      }
    }
  }

  if (expansions.size === 0) return query;

  return `${query} ${[...expansions].join(" ")}`;
}
