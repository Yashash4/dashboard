/**
 * Log alerting engine — evaluates alert conditions against log lines.
 * Used by the log-alerts cron job (9.3) and Logs Explorer alerting UI.
 */

export type AlertConditionType =
  | "keyword_count"
  | "level_count"
  | "pattern_match"
  | "absence";

export interface AlertCondition {
  /** Unique id for persistence */
  id?: string;
  type: AlertConditionType;
  /**
   * - keyword_count: the keyword to search for
   * - level_count: the log level ("error" | "warn")
   * - pattern_match: a regex pattern string
   * - absence: the expected pattern/string that should appear
   */
  value: string;
  /**
   * Threshold count. Meaning depends on type:
   * - keyword_count: keyword must appear in >= threshold lines
   * - level_count: lines at the given level must be >= threshold
   * - pattern_match: regex must match in >= threshold lines (default 1)
   * - absence: ignored (condition fires if pattern is NOT found at all)
   */
  threshold: number;
  /** Human-readable label for the alert */
  label?: string;
}

export interface AlertResult {
  conditionId?: string;
  conditionType: AlertConditionType;
  label?: string;
  triggered: boolean;
  matchCount: number;
  threshold: number;
  details: string;
}

/**
 * Evaluate a single alert condition against a set of log lines.
 * Returns true if the condition is triggered (alert should fire).
 */
export function evaluateAlertCondition(
  condition: AlertCondition,
  logs: string[]
): boolean {
  return evaluateAlertConditionDetailed(condition, logs).triggered;
}

/**
 * Evaluate with full detail including match count.
 */
export function evaluateAlertConditionDetailed(
  condition: AlertCondition,
  logs: string[]
): AlertResult {
  const base: Omit<AlertResult, "triggered" | "matchCount" | "details"> = {
    conditionId: condition.id,
    conditionType: condition.type,
    label: condition.label,
    threshold: condition.threshold,
  };

  switch (condition.type) {
    case "keyword_count": {
      const keyword = condition.value.toLowerCase();
      const matchCount = logs.filter((l) =>
        l.toLowerCase().includes(keyword)
      ).length;
      const triggered = matchCount >= condition.threshold;
      return {
        ...base,
        triggered,
        matchCount,
        details: triggered
          ? `Keyword "${condition.value}" found in ${matchCount} lines (threshold: ${condition.threshold})`
          : `Keyword "${condition.value}" found in ${matchCount} lines, below threshold of ${condition.threshold}`,
      };
    }

    case "level_count": {
      const level = condition.value.toUpperCase();
      // Match common log level patterns: [ERROR], ERROR, level=error, etc.
      const levelRegex = new RegExp(
        `\\b${level}\\b|\\[${level}\\]|level=${level.toLowerCase()}`,
        "i"
      );
      const matchCount = logs.filter((l) => levelRegex.test(l)).length;
      const triggered = matchCount >= condition.threshold;
      return {
        ...base,
        triggered,
        matchCount,
        details: triggered
          ? `${level} level appeared ${matchCount} times (threshold: ${condition.threshold})`
          : `${level} level appeared ${matchCount} times, below threshold of ${condition.threshold}`,
      };
    }

    case "pattern_match": {
      let regex: RegExp;
      try {
        regex = new RegExp(condition.value, "i");
      } catch {
        return {
          ...base,
          triggered: false,
          matchCount: 0,
          details: `Invalid regex pattern: ${condition.value}`,
        };
      }
      // Test each log line with a simple length guard to prevent ReDoS on adversarial patterns
      let matchCount = 0;
      for (const l of logs) {
        if (l.length > 10000) continue; // Skip extremely long lines
        try { if (regex.test(l)) matchCount++; } catch { break; }
      }
      const threshold = condition.threshold || 1;
      const triggered = matchCount >= threshold;
      return {
        ...base,
        triggered,
        matchCount,
        threshold,
        details: triggered
          ? `Pattern /${condition.value}/ matched ${matchCount} lines (threshold: ${threshold})`
          : `Pattern /${condition.value}/ matched ${matchCount} lines, below threshold of ${threshold}`,
      };
    }

    case "absence": {
      const search = condition.value.toLowerCase();
      const found = logs.some((l) => l.toLowerCase().includes(search));
      return {
        ...base,
        triggered: !found,
        matchCount: found ? 1 : 0,
        details: found
          ? `Expected pattern "${condition.value}" was found (no alert)`
          : `Expected pattern "${condition.value}" was NOT found in any log line — alert triggered`,
      };
    }

    default:
      return {
        ...base,
        triggered: false,
        matchCount: 0,
        details: `Unknown condition type: ${(condition as any).type}`,
      };
  }
}

/**
 * Evaluate multiple conditions at once.
 * Returns array of results for triggered conditions only.
 */
export function evaluateAllConditions(
  conditions: AlertCondition[],
  logs: string[]
): AlertResult[] {
  return conditions
    .map((c) => evaluateAlertConditionDetailed(c, logs))
    .filter((r) => r.triggered);
}
