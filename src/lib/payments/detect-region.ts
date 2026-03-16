import type { RegionInfo } from "./types";

const INDIA: RegionInfo = {
  region: "india",
  provider: "razorpay",
  currency: "INR",
};

const INTERNATIONAL: RegionInfo = {
  region: "international",
  provider: "razorpay",
  currency: "USD",
};

/**
 * Detect user region from request headers (server-side).
 * Vercel sets x-vercel-ip-country in production.
 * Falls back to Accept-Language header, then defaults to international.
 *
 * Both regions use Razorpay — India pays in INR, everyone else in USD.
 */
export function detectRegion(request?: Request): RegionInfo {
  if (!request) return INTERNATIONAL;

  // 1. Vercel geo header (production)
  const country = request.headers.get("x-vercel-ip-country");
  if (country === "IN") return INDIA;
  if (country) return INTERNATIONAL;

  // 2. Accept-Language fallback
  const lang = request.headers.get("accept-language") || "";
  if (lang.includes("hi") || lang.includes("en-IN")) return INDIA;

  return INTERNATIONAL;
}

/**
 * Client-side region detection using browser locale.
 */
export function detectRegionClient(): RegionInfo {
  if (typeof window === "undefined") return INTERNATIONAL;

  const locale = navigator.language || "";
  if (
    locale.toLowerCase().startsWith("hi") ||
    locale.toLowerCase() === "en-in"
  ) {
    return INDIA;
  }

  return INTERNATIONAL;
}
