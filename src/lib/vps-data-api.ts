/**
 * Helper to call the ClawHQ Data API running on a user's VPS (port 5556).
 * All historical data (events, sessions, activities, audit logs, analytics,
 * KB, webhook deliveries) lives on the user's VPS in SQLite.
 */

import { createAdminClient } from "@/lib/supabase-admin";

interface VPSDataAPIOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  timeout?: number;
}

// Cache VPS lookup for 5 minutes to avoid hitting Supabase on every request
const vpsCache = new Map<
  string,
  { hostname: string; token: string; expiresAt: number }
>();
const CACHE_TTL = 5 * 60 * 1000;

// Evict expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of vpsCache) {
    if (val.expiresAt < now) vpsCache.delete(key);
  }
}, 10 * 60 * 1000);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

async function getVPSInfo(userId: string) {
  const cached = vpsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const supabase = createAdminClient();
  const { data: vps } = await supabase
    .from("vps_instances")
    .select("hostname, data_api_token, status")
    .eq("user_id", userId)
    .single();

  if (!vps) throw new Error("VPS not found");
  if (!vps.data_api_token) throw new Error("Data API not configured on VPS");
  if (vps.status !== "running") throw new Error("VPS is not running");

  const info = {
    hostname: vps.hostname,
    token: vps.data_api_token,
    expiresAt: Date.now() + CACHE_TTL,
  };
  vpsCache.set(userId, info);
  return info;
}

export async function vpsDataFetch<T = unknown>(
  userId: string,
  path: string,
  options?: VPSDataAPIOptions
): Promise<T> {
  const vps = await getVPSInfo(userId);

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options?.timeout || 10000
  );

  try {
    const response = await fetch(`https://${vps.hostname}:5556${path}`, {
      method: options?.method || "GET",
      headers: {
        Authorization: `Bearer ${vps.token}`,
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(`VPS Data API error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if a user's VPS has the Data API configured.
 * Falls back gracefully — returns false if VPS not found or token missing.
 */
export async function hasVPSDataAPI(userId: string): Promise<boolean> {
  try {
    const vps = await getVPSInfo(userId);
    return !!vps.token;
  } catch {
    return false;
  }
}
