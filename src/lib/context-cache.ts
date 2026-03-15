const MAX_ENTRIES = 100;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  systemPrompt: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedContext(userId: string, cacheKey: string): string | null {
  const key = `${userId}:${cacheKey}`;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  // Move to end for proper LRU eviction (access-order)
  cache.delete(key);
  cache.set(key, entry);
  return entry.systemPrompt;
}

export function setCachedContext(userId: string, cacheKey: string, systemPrompt: string): void {
  const key = `${userId}:${cacheKey}`;

  // Evict oldest entries if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  cache.set(key, {
    systemPrompt,
    expiresAt: Date.now() + DEFAULT_TTL_MS,
  });
}

export function invalidateUserCache(userId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      cache.delete(key);
    }
  }
}
