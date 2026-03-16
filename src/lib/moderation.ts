const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  violence: [/\b(kill|murder|assault|weapon|bomb|shoot|stab|attack)\b/i],
  sexual: [/\b(explicit|pornograph|nsfw)\b/i],
  hate: [/\b(hate speech|racist|discriminat)\b/i],
  self_harm: [/\b(suicide|self.?harm|cut myself)\b/i],
  prompt_injection: [
    /\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)\b/i,
    /\byou\s+are\s+now\s+(DAN|jailbreak|unrestricted)\b/i,
    /\bdo\s+anything\s+now\b/i,
  ],
};

/** Default categories blocked for V1 API requests */
const DEFAULT_BLOCK_CATEGORIES = ["violence", "sexual", "hate", "self_harm", "prompt_injection"];

export interface ModerationConfig {
  enabled: boolean;
  block_categories?: string[];
  custom_blocked_words?: string[];
}

export interface ModerationResult {
  blocked: boolean;
  category?: string;
  matched_word?: string;
}

/**
 * Moderate content with explicit config.
 */
export function moderateContent(
  text: string,
  config: ModerationConfig
): ModerationResult {
  if (!config.enabled) return { blocked: false };

  const lowerText = text.toLowerCase();

  // Check custom blocked words first
  if (config.custom_blocked_words) {
    for (const word of config.custom_blocked_words) {
      if (lowerText.includes(word.toLowerCase())) {
        return { blocked: true, category: "custom", matched_word: word };
      }
    }
  }

  // Check category patterns
  const categories = config.block_categories || DEFAULT_BLOCK_CATEGORIES;
  for (const category of categories) {
    const patterns = CATEGORY_PATTERNS[category];
    if (!patterns) continue;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { blocked: true, category, matched_word: pattern.source };
      }
    }
  }

  return { blocked: false };
}

/**
 * Quick moderation check using default blocking categories.
 * Used by V1 API routes that don't have per-user config.
 */
export function moderateApiInput(text: string): ModerationResult {
  return moderateContent(text, {
    enabled: true,
    block_categories: DEFAULT_BLOCK_CATEGORIES,
  });
}
