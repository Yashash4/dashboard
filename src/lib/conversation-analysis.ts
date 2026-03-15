/**
 * Conversation analysis — funnels, resolution detection, intent classification.
 * Used for analytics enhancement features (10.1-10.16).
 */

// --- 10.1 Funnel Stages ---

export type FunnelStage = "started" | "engaged" | "substantive" | "resolved" | "satisfied";

export function detectFunnelStage(messageCount: number, hasResolution: boolean, csatRating?: number): FunnelStage {
  if (csatRating && csatRating >= 4) return "satisfied";
  if (hasResolution) return "resolved";
  if (messageCount >= 4) return "substantive";
  if (messageCount >= 2) return "engaged";
  return "started";
}

// --- 10.3 Resolution Detection ---

export type ResolutionStatus = "resolved" | "escalated" | "abandoned" | "ongoing";

const RESOLUTION_PATTERNS = [
  /thank you|thanks|that helps|perfect|great|solved|fixed|worked/i,
  /problem solved|issue resolved|that.s what I needed/i,
];

const ESCALATION_PATTERNS = [
  /speak to (a |an )?human|real person|agent|manager|supervisor/i,
  /escalat|transfer|hand.?off/i,
];

const FRUSTRATION_PATTERNS = [
  /not helpful|doesn.t work|wrong|useless|terrible|awful|worst/i,
  /still not|doesn.t answer|can.t help/i,
];

export function detectResolution(messages: { role: string; content: string }[]): ResolutionStatus {
  if (messages.length === 0) return "ongoing";

  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";

  // Check for escalation
  for (const pattern of ESCALATION_PATTERNS) {
    if (pattern.test(lastUserMsg)) return "escalated";
  }

  // Check for resolution (positive signals in last few messages)
  const lastMessages = userMessages.slice(-3);
  for (const msg of lastMessages) {
    for (const pattern of RESOLUTION_PATTERNS) {
      if (pattern.test(msg.content)) return "resolved";
    }
  }

  // Check for abandonment (no activity for 30+ minutes and last message was user)
  if (messages[messages.length - 1]?.role === "user" && userMessages.length >= 2) {
    return "abandoned";
  }

  return "ongoing";
}

// --- 10.10 Intent Classification ---

const INTENT_KEYWORDS: Record<string, string[]> = {
  support: ["help", "issue", "problem", "broken", "error", "bug", "fix", "not working"],
  billing: ["bill", "payment", "charge", "invoice", "refund", "subscription", "cancel"],
  product: ["how to", "how do", "feature", "can I", "does it", "tutorial", "guide"],
  sales: ["pricing", "plan", "upgrade", "demo", "trial", "buy", "purchase"],
  feedback: ["suggestion", "feedback", "improve", "would be nice", "wish", "request"],
  greeting: ["hello", "hi", "hey", "good morning", "good afternoon"],
};

export function classifyIntent(message: string): string {
  const lower = message.toLowerCase();
  let bestMatch = "general";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  return bestMatch;
}

// --- 10.11 Failed Conversation Detection ---

export type FailureType = "frustrated" | "abandoned" | "escalated" | "no_answer";

export function detectFailure(messages: { role: string; content: string }[]): FailureType | null {
  const userMessages = messages.filter((m) => m.role === "user");

  // Frustrated
  for (const msg of userMessages) {
    for (const pattern of FRUSTRATION_PATTERNS) {
      if (pattern.test(msg.content)) return "frustrated";
    }
  }

  // Escalated
  for (const msg of userMessages) {
    for (const pattern of ESCALATION_PATTERNS) {
      if (pattern.test(msg.content)) return "escalated";
    }
  }

  // No answer (assistant gave generic non-answer)
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const noAnswerPatterns = [/I don.t have|I.m not sure|I cannot|I can.t help with that/i];
  for (const msg of assistantMessages) {
    for (const pattern of noAnswerPatterns) {
      if (pattern.test(msg.content)) return "no_answer";
    }
  }

  // Abandoned (user sent multiple messages, no resolution)
  if (userMessages.length >= 3 && messages[messages.length - 1]?.role === "user") {
    return "abandoned";
  }

  return null;
}
