export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiter with Supabase persistence.
 *
 * Uses an in-memory Map as a fast first-check to avoid DB round-trips on
 * every request, but falls through to Supabase `rate_limits` table for
 * authoritative counts. This means the limiter works correctly even when
 * serverless instances cold-start (Vercel, etc.), because the source of
 * truth is in the database.
 *
 * Table schema required:
 *   CREATE TABLE IF NOT EXISTS rate_limits (
 *     identifier TEXT NOT NULL,
 *     window_start BIGINT NOT NULL,
 *     hit_count INT NOT NULL DEFAULT 1,
 *     PRIMARY KEY (identifier, window_start)
 *   );
 *   CREATE INDEX idx_rate_limits_cleanup ON rate_limits (window_start);
 *
 * The synchronous `rateLimit()` function is kept for backward compatibility.
 * It uses the in-memory store only. Use `rateLimitAsync()` for the durable
 * Supabase-backed version in critical paths.
 */

import { createAdminClient } from "@/lib/supabase-admin";

/* ---------- In-memory (fast, non-durable) ---------- */

const store = new Map<string, number[]>();

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

/**
 * Synchronous in-memory rate limiter (best-effort on serverless).
 *
 * NOTE: On serverless platforms each cold start resets the in-memory Map,
 * so this alone cannot enforce hard limits. Prefer `rateLimitAsync()` for
 * security-critical paths. This function is kept for backward compatibility
 * and as a cheap pre-filter.
 */
/**
 * Get current rate limit status for an identifier — returns remaining count and reset time.
 */
export function getRateLimitStatus(
  identifier: string,
  limit: number,
  windowMs: number = 60_000
): { remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = store.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);
  const remaining = Math.max(0, limit - validTimestamps.length);
  const reset = Math.floor(now / windowMs) * windowMs + windowMs;
  return { remaining, reset };
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

  const success = validTimestamps.length < limit;
  if (success) {
    validTimestamps.push(now);
  }
  store.set(identifier, validTimestamps);

  const remaining = Math.max(0, limit - validTimestamps.length);
  return { success, remaining };
}

/* ---------- Tier-aware rate limiting (CROSS_HIGH_04) ---------- */

/** Multiplier applied to base rate limits per plan tier */
const TIER_MULTIPLIERS: Record<string, number> = {
  starter: 1,
  pro: 5,
  ultra: 10,
  enterprise: 25,
};

/**
 * Get the rate limit multiplier for a given plan tier.
 */
export function getTierMultiplier(plan: string): number {
  return TIER_MULTIPLIERS[plan] || 1;
}

/**
 * Tier-aware synchronous rate limiter.
 * Applies plan-based multiplier to the base limit.
 * Usage: rateLimitByTier("user123:chat", 10, "ultra") → effective limit = 100
 */
export function rateLimitByTier(
  identifier: string,
  baseLimit: number,
  plan: string,
  windowMs: number = 60_000
): { success: boolean; remaining: number } {
  const effectiveLimit = baseLimit * getTierMultiplier(plan);
  return rateLimit(identifier, effectiveLimit, windowMs);
}

/**
 * Tier-aware async (durable) rate limiter.
 * Applies plan-based multiplier to the base limit, backed by Supabase.
 */
export async function rateLimitByTierAsync(
  identifier: string,
  baseLimit: number,
  plan: string,
  windowMs: number = 60_000
): Promise<{ success: boolean; remaining: number }> {
  const effectiveLimit = baseLimit * getTierMultiplier(plan);
  return rateLimitAsync(identifier, effectiveLimit, windowMs);
}

/* ---------- Supabase-backed (durable) ---------- */

/**
 * Durable rate limiter backed by Supabase `rate_limits` table.
 * Safe across serverless cold starts. Use for security-critical endpoints.
 *
 * Uses a fixed-window approach with DB-level upsert for atomicity.
 */
export async function rateLimitAsync(
  identifier: string,
  limit: number,
  windowMs: number = 60_000
): Promise<{ success: boolean; remaining: number }> {
  // Fast in-memory pre-check (avoids DB call when clearly under limit)
  const memResult = rateLimit(identifier, limit, windowMs);
  if (!memResult.success) {
    return memResult;
  }

  try {
    const admin = createAdminClient();
    const now = Date.now();
    // Fixed window: floor to nearest windowMs
    const windowStart = Math.floor(now / windowMs) * windowMs;

    // Upsert: increment hit_count for this window, or insert 1
    const { data, error } = await admin.rpc("rate_limit_check", {
      p_identifier: identifier,
      p_window_start: windowStart,
      p_limit: limit,
    });

    if (error) {
      // If the RPC doesn't exist yet, fall back to in-memory only
      // This graceful degradation means the app works before the DB migration
      return memResult;
    }

    const allowed = data as boolean;
    return {
      success: allowed,
      remaining: allowed ? Math.max(0, limit - 1) : 0,
    };
  } catch {
    // On any DB error, fall back to in-memory result
    return memResult;
  }
}
