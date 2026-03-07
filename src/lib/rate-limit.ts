/**
 * Simple in-memory sliding-window rate limiter.
 * No external dependencies. Entries auto-expire.
 */

const store = new Map<string, number[]>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs * 2;
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60_000
): { success: boolean; remaining: number } {
  cleanup(windowMs);

  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = store.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);

  if (validTimestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  validTimestamps.push(now);
  store.set(identifier, validTimestamps);

  return { success: true, remaining: limit - validTimestamps.length };
}
