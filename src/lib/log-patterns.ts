/**
 * Log pattern detection — normalizes log messages and identifies recurring patterns.
 * Used for log pattern detection (9.2) and anomaly detection (9.9).
 */

const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const TIMESTAMP_REGEX = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*/g;
const NUMBER_REGEX = /\b\d{4,}\b/g;
const PATH_REGEX = /\/[\w\-./]+/g;

/**
 * Normalize a log message by replacing variable parts with placeholders.
 * "Error at 192.168.1.1: request abc-123 failed in 450ms"
 * → "Error at <IP>: request <UUID> failed in <NUM>ms"
 */
export function normalizeLogMessage(message: string): string {
  return message
    .replace(UUID_REGEX, "<UUID>")
    .replace(IP_REGEX, "<IP>")
    .replace(TIMESTAMP_REGEX, "<TIMESTAMP>")
    .replace(NUMBER_REGEX, "<NUM>")
    .replace(PATH_REGEX, "<PATH>");
}

/**
 * Detect patterns in a set of log lines.
 * Returns patterns sorted by frequency (most common first).
 */
export function detectPatterns(
  logs: string[]
): { pattern: string; count: number; example: string }[] {
  const patternMap = new Map<string, { count: number; example: string }>();

  for (const log of logs) {
    const normalized = normalizeLogMessage(log);
    const existing = patternMap.get(normalized);
    if (existing) {
      existing.count++;
    } else {
      patternMap.set(normalized, { count: 1, example: log });
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, { count, example }]) => ({ pattern, count, example }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detect anomalies by comparing current pattern distribution to baseline.
 */
export function detectAnomalies(
  currentPatterns: { pattern: string; count: number }[],
  baselinePatterns: { pattern: string; count: number }[]
): { type: string; pattern: string; details: string }[] {
  const anomalies: { type: string; pattern: string; details: string }[] = [];
  const baselineMap = new Map(baselinePatterns.map((p) => [p.pattern, p.count]));

  for (const current of currentPatterns) {
    const baseline = baselineMap.get(current.pattern);
    if (!baseline) {
      // New pattern not seen in baseline
      if (current.count >= 3) {
        anomalies.push({
          type: "new_pattern",
          pattern: current.pattern,
          details: `New pattern appeared ${current.count} times`,
        });
      }
    } else if (current.count > baseline * 3) {
      // Spike — 3x increase
      anomalies.push({
        type: "spike",
        pattern: current.pattern,
        details: `Count spiked from ${baseline} to ${current.count} (${Math.round(current.count / baseline)}x increase)`,
      });
    }
  }

  // Check for missing patterns (volume change)
  for (const [pattern, count] of baselineMap) {
    const current = currentPatterns.find((p) => p.pattern === pattern);
    if (!current && count >= 5) {
      anomalies.push({
        type: "volume_change",
        pattern,
        details: `Pattern disappeared (was ${count} occurrences)`,
      });
    }
  }

  return anomalies;
}
