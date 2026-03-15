/**
 * Structured log parser — extracts timestamp, level, source, fields, and JSON payloads
 * from common log formats. Used by Logs Explorer (9.3).
 */

export interface ParsedLog {
  timestamp?: string;
  level?: string;
  source?: string;
  message: string;
  fields: Record<string, string>;
  jsonPayload?: unknown;
}

// Format 1: ISO timestamp + level + source
// e.g. "2026-03-15T10:00:00Z [ERROR] gateway: something happened"
const ISO_LEVEL_SOURCE =
  /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+\[(\w+)]\s+(\w[\w.-]*):\s+(.*)/;

// Format 2: Docker-style
// e.g. "2026-03-15T10:00:00.123456789Z stdout F some message"
const DOCKER_STYLE =
  /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+(stdout|stderr)\s+[FP]?\s*(.*)/;

// Format 3: Syslog / simple timestamp
// e.g. "Mar 15 10:00:00 some message"
const SYSLOG_STYLE =
  /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(.*)/;

// Key=value pairs inside log message
const KV_PAIR = /\b([a-zA-Z_][\w.]*)=("(?:[^"\\]|\\.)*"|[^\s,;]+)/g;

// Level keywords for lines without explicit level markers
const LEVEL_KEYWORDS: Record<string, RegExp> = {
  error: /\b(ERROR|ERR|FATAL|CRITICAL|PANIC)\b/i,
  warn: /\b(WARN|WARNING)\b/i,
  info: /\b(INFO|NOTICE)\b/i,
  debug: /\b(DEBUG|TRACE|VERBOSE)\b/i,
};

/**
 * Try to extract an inline JSON object from a message string.
 * Looks for the first `{` and tries to parse from there.
 */
function extractJsonPayload(msg: string): unknown | undefined {
  const start = msg.indexOf("{");
  if (start === -1) return undefined;

  // Try progressively shorter substrings from the end
  let end = msg.lastIndexOf("}");
  while (end >= start) {
    const candidate = msg.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Find next closing brace going backwards
      end = msg.lastIndexOf("}", end - 1);
    }
  }
  return undefined;
}

/**
 * Extract key=value pairs from a message string.
 */
function extractKeyValues(msg: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let match: RegExpExecArray | null;
  // Reset regex state
  KV_PAIR.lastIndex = 0;
  while ((match = KV_PAIR.exec(msg)) !== null) {
    let value = match[2];
    // Strip surrounding quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    fields[match[1]] = value;
  }
  return fields;
}

/**
 * Infer log level from message content when not explicitly provided.
 */
function inferLevel(msg: string): string | undefined {
  for (const [level, pattern] of Object.entries(LEVEL_KEYWORDS)) {
    if (pattern.test(msg)) return level;
  }
  return undefined;
}

/**
 * Parse a single log line into a structured ParsedLog object.
 * Detects 3 formats:
 *   1. ISO timestamp + [LEVEL] source: message
 *   2. Docker-style: ISO timestamp stdout/stderr message
 *   3. Syslog-style: Mon DD HH:MM:SS message
 * Also extracts inline JSON payloads and key=value pairs.
 */
export function parseStructuredLog(line: string): ParsedLog {
  const trimmed = line.trim();
  if (!trimmed) {
    return { message: "", fields: {} };
  }

  let timestamp: string | undefined;
  let level: string | undefined;
  let source: string | undefined;
  let message: string = trimmed;

  // Try Format 1: ISO + [LEVEL] source: message
  let m = ISO_LEVEL_SOURCE.exec(trimmed);
  if (m) {
    timestamp = m[1];
    level = m[2].toLowerCase();
    source = m[3];
    message = m[4];
  }

  // Try Format 2: Docker-style
  if (!m) {
    m = DOCKER_STYLE.exec(trimmed);
    if (m) {
      timestamp = m[1];
      // Map stdout/stderr to level hint
      level = m[2] === "stderr" ? "error" : undefined;
      source = m[2]; // "stdout" or "stderr"
      message = m[3];
    }
  }

  // Try Format 3: Syslog-style
  if (!m) {
    m = SYSLOG_STYLE.exec(trimmed);
    if (m) {
      timestamp = m[1];
      message = m[2];
    }
  }

  // If no level was detected from format, infer from message content
  if (!level) {
    level = inferLevel(message);
  }

  // Extract key=value pairs
  const fields = extractKeyValues(message);

  // Extract JSON payload
  const jsonPayload = extractJsonPayload(message);

  return {
    timestamp,
    level,
    source,
    message,
    fields,
    jsonPayload: jsonPayload ?? undefined,
  };
}

/**
 * Parse multiple log lines at once.
 */
export function parseLogBatch(lines: string[]): ParsedLog[] {
  return lines.map(parseStructuredLog);
}
