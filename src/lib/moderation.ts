const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  violence: [/\b(kill|murder|assault|weapon|bomb|shoot|stab|attack)\b/i],
  sexual: [/\b(explicit|pornograph|nsfw)\b/i],
  hate: [/\b(hate speech|racist|discriminat)\b/i],
  self_harm: [/\b(suicide|self.?harm|cut myself)\b/i],
};

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
  if (config.block_categories) {
    for (const category of config.block_categories) {
      const patterns = CATEGORY_PATTERNS[category];
      if (!patterns) continue;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return { blocked: true, category, matched_word: pattern.source };
        }
      }
    }
  }

  return { blocked: false };
}
